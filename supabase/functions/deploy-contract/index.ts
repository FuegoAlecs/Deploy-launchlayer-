
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

    // 4. Initialize Provider with Fallbacks/Better URLs
    const rpcUrl = getRpcUrl(chain_id);
    console.log(`Using RPC URL for chain ${chain_id}: ${rpcUrl}`);

    // Explicitly configure StaticJsonRpcProvider (or JsonRpcProvider in v6) with network detection disabled
    // to avoid the initial network call that might fail or timeout.
    // In ethers v6, we can pass the network object to skip detection.
    const network = ethers.Network.from(Number(chain_id));
    const provider = new ethers.JsonRpcProvider(rpcUrl, network, { staticNetwork: network });

    const walletSigner = new ethers.Wallet(privateKey, provider);

    const txRequest = {
        to: transaction.to,
        data: transaction.data,
        value: transaction.value ? BigInt(transaction.value) : 0n,
        gasLimit: transaction.gasLimit ? BigInt(transaction.gasLimit) : undefined,
    };

    // Sign and broadcast
    // We sign first, then broadcast to handle errors better
    const signedTx = await walletSigner.signTransaction(txRequest);
    console.log("Transaction signed, broadcasting...");

    const txResponse = await provider.broadcastTransaction(signedTx);
    console.log("Broadcast success:", txResponse.hash);

    return new Response(
      JSON.stringify({
          success: true,
          txHash: txResponse.hash,
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

function getRpcUrl(chainId: number): string {
    // Priority: Official/Reliable -> Cloudflare/Llama -> Ankr (Fallback)
    const rpcs: Record<number, string> = {
        // Ethereum
        1: "https://eth.llamarpc.com",
        11155111: "https://rpc.sepolia.org",
        5: "https://rpc.ankr.com/eth_goerli",

        // Polygon
        137: "https://polygon-rpc.com",
        80001: "https://rpc-mumbai.maticvigil.com",
        1101: "https://zkevm-rpc.com",

        // Arbitrum
        42161: "https://arb1.arbitrum.io/rpc",
        421614: "https://sepolia-rollup.arbitrum.io/rpc",

        // Optimism
        10: "https://mainnet.optimism.io",
        11155420: "https://sepolia.optimism.io",

        // Base
        8453: "https://mainnet.base.org",
        84532: "https://sepolia.base.org",

        // BSC
        56: "https://binance.llamarpc.com",
        97: "https://data-seed-prebsc-1-s1.binance.org:8545",

        // Avalanche
        43114: "https://api.avax.network/ext/bc/C/rpc",
        43113: "https://api.avax-test.network/ext/bc/C/rpc",

        // Fantom
        250: "https://rpc.ftm.tools",
        4002: "https://rpc.testnet.fantom.network",

        // Blast
        81457: "https://rpc.blast.io",
        168587773: "https://sepolia.blast.io",

        // Linea
        59144: "https://rpc.linea.build",
        59141: "https://rpc.goerli.linea.build",

        // Scroll
        534352: "https://rpc.scroll.io",
        534351: "https://sepolia-rpc.scroll.io",

        // zkSync Era
        324: "https://mainnet.era.zksync.io",
        300: "https://sepolia.era.zksync.dev"
    };

    // Default to Sepolia if unknown (safer than mainnet)
    return rpcs[chainId] || "https://rpc.sepolia.org";
}
