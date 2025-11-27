
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

    // 1. Initialize Supabase Client (Service Role needed to access encrypted key)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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
    const encryptionKey = Deno.env.get("SUPABASE_ENCRYPTION_KEY");
    if (!encryptionKey) {
      throw new Error("Server configuration error: Missing encryption key");
    }

    // Decrypt using AES-256-CBC
    // Key: Hex string -> WordArray
    // IV: Hex string (from DB) -> WordArray
    // Ciphertext: Base64 string (from DB)

    const key = CryptoJS.enc.Hex.parse(encryptionKey);
    const iv = CryptoJS.enc.Hex.parse(wallet.encryption_iv);

    // Note: crypto-js expects ciphertext in Base64 if passed as string to decrypt,
    // or we can pass a CipherParams object.
    // Based on user data inspection: 'encrypted_private_key' ends in '=' so it is Base64.

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
       // Just in case it wasn't utf8 encoded but hex
       // If the result is empty, decryption failed (wrong key/iv)
       if (decrypted.sigBytes <= 0) {
           throw new Error("Decryption failed. Invalid key or IV.");
       }
       // If the original private key was stored as hex without 0x or similar, we might need adjustment.
       // But assuming standard storage.
    }

    // 4. Sign Transaction
    const provider = new ethers.JsonRpcProvider(getRpcUrl(chain_id));
    const walletSigner = new ethers.Wallet(privateKey, provider);

    // Populate transaction (gas limit, nonce, etc.)
    // We trust the frontend to have estimated gas, but we should sanity check or re-estimate if missing.
    // For now, assume frontend passes a valid transaction object.

    // Ensure value is properly formatted
    const txRequest = {
        to: transaction.to,
        data: transaction.data,
        value: transaction.value ? BigInt(transaction.value) : 0n,
        gasLimit: transaction.gasLimit ? BigInt(transaction.gasLimit) : undefined,
        // Ethers v6 will automatically populate nonce and gasPrice/maxFee if not provided
    };

    // If gas parameters are missing, Ethers will try to estimate, which requires the provider.

    const signedTx = await walletSigner.signTransaction(txRequest);

    // We can either broadcast it here or return the signed tx for the frontend to broadcast.
    // Broadcasting here is more robust against frontend network issues.

    const txResponse = await provider.broadcastTransaction(signedTx);

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
    const rpcs: Record<number, string> = {
        1: "https://rpc.ankr.com/eth",
        11155111: "https://rpc.ankr.com/eth_sepolia",
        5: "https://rpc.ankr.com/eth_goerli",
        137: "https://rpc.ankr.com/polygon",
        80001: "https://rpc.ankr.com/polygon_mumbai",
        42161: "https://arb1.arbitrum.io/rpc",
        10: "https://mainnet.optimism.io",
        8453: "https://mainnet.base.org",
        84532: "https://sepolia.base.org"
    };

    return rpcs[chainId] || "https://rpc.ankr.com/eth_sepolia";
}
