
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { ethers } from "https://esm.sh/ethers@6.7.0";
import CryptoJS from "npm:crypto-js@4.1.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { wallet_id, transaction, chain_id } = await req.json();

    if (!wallet_id || !transaction || !chain_id) {
      throw new Error("Missing wallet_id, transaction, or chain_id");
    }

    // 1. Initialize Supabase Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY")!;
    if (!supabaseServiceKey) throw new Error("Missing SERVICE_ROLE_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Fetch Encrypted Key
    const { data: wallet, error: fetchError } = await supabase
      .from("dev_wallets")
      .select("encrypted_private_key, encryption_iv, wallet_address")
      .eq("id", wallet_id)
      .single();

    if (fetchError || !wallet) {
      throw new Error("Wallet not found or access denied");
    }

    // 3. Decrypt Private Key
    const encryptionKey = Deno.env.get("ENCRYPTION_KEY");
    if (!encryptionKey) {
      throw new Error("Server configuration error: Missing ENCRYPTION_KEY");
    }

    const key = CryptoJS.enc.Hex.parse(encryptionKey);
    const iv = CryptoJS.enc.Hex.parse(wallet.encryption_iv);

    const decrypted = CryptoJS.AES.decrypt(
      wallet.encrypted_private_key,
      key,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    );

    const privateKey = decrypted.toString(CryptoJS.enc.Utf8);

    if (!privateKey || !privateKey.startsWith("0x")) {
       if (decrypted.sigBytes <= 0) {
           throw new Error("Decryption failed. Invalid key or IV.");
       }
    }

    // 4. Robust Broadcasting with Fallback
    const rpcUrls = getRpcUrls(chain_id);
    let lastError = null;
    let successHash = null;

    console.log(`Attempting broadcast for chain ${chain_id} with ${rpcUrls.length} providers...`);

    for (const url of rpcUrls) {
        try {
            console.log(`Trying RPC: ${url}`);
            const network = ethers.Network.from(Number(chain_id));
            // staticNetwork is crucial to avoid startup calls that might timeout
            const provider = new ethers.JsonRpcProvider(url, network, { staticNetwork: network });

            // Re-instantiate signer per provider
            const walletSigner = new ethers.Wallet(privateKey, provider);

            const txRequest = {
                to: transaction.to,
                data: transaction.data,
                value: transaction.value ? BigInt(transaction.value) : 0n,
                gasLimit: transaction.gasLimit ? BigInt(transaction.gasLimit) : undefined,
                // nonce: undefined, // Ethers will fetch nonce. If this fails repeatedly, we might need to fetch nonce once separately.
            };

            // Ethers `signTransaction` doesn't need a provider, but `sendTransaction` (broadcast) does.
            // We can try `signer.sendTransaction` which handles population + signing + sending.
            // If population (fetching nonce/gasPrice) fails, we catch and retry next RPC.

            const txResponse = await walletSigner.sendTransaction(txRequest);
            successHash = txResponse.hash;
            console.log(`Success via ${url}: ${successHash}`);
            break; // Success!

        } catch (err: any) {
            console.warn(`Failed with ${url}:`, err.message);
            lastError = err;
            // Continue to next provider
        }
    }

    if (!successHash) {
        throw new Error(`All RPC providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
    }

    return new Response(
      JSON.stringify({
          success: true,
          txHash: successHash,
          message: "Transaction sent successfully"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Deploy Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});

function getRpcUrls(chainId: number): string[] {
    const rpcs: Record<number, string[]> = {
        // Ethereum Mainnet
        1: [
            "https://eth.llamarpc.com",
            "https://rpc.ankr.com/eth",
            "https://cloudflare-eth.com",
            "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161" // Public Infura fallback
        ],
        // Sepolia
        11155111: [
            "https://rpc.sepolia.org",
            "https://ethereum-sepolia-rpc.publicnode.com",
            "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
            "https://rpc.ankr.com/eth_sepolia"
        ],
        // Optimism
        10: [
            "https://mainnet.optimism.io",
            "https://optimism.llamarpc.com"
        ],
        // Arbitrum
        42161: [
            "https://arb1.arbitrum.io/rpc",
            "https://arbitrum.llamarpc.com"
        ],
        // Base
        8453: [
            "https://mainnet.base.org",
            "https://base.llamarpc.com"
        ],
        // Base Sepolia
        84532: [
            "https://sepolia.base.org",
            "https://base-sepolia.blockpi.network/v1/rpc/public"
        ],
        // Blast
        81457: [
            "https://rpc.blast.io",
            "https://blast.blockpi.network/v1/rpc/public"
        ],
        // Scroll
        534352: ["https://rpc.scroll.io"],

        // Linea
        59144: ["https://rpc.linea.build"],

        // zkSync
        324: ["https://mainnet.era.zksync.io"],

        // Polygon
        137: ["https://polygon-rpc.com", "https://polygon.llamarpc.com"],

        // BSC
        56: ["https://binance.llamarpc.com", "https://bsc-dataseed.binance.org"],

        // Avalanche
        43114: ["https://api.avax.network/ext/bc/C/rpc"],

        // Fantom
        250: ["https://rpc.ftm.tools"]
    };

    return rpcs[chainId] || ["https://rpc.sepolia.org"];
}
