
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
    const { wallet_id, transaction } = await req.json();

    if (!wallet_id || !transaction) {
      throw new Error("Missing wallet_id or transaction payload");
    }

    // 1. Initialize Supabase Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY")!;
    if (!supabaseServiceKey) throw new Error("Missing SERVICE_ROLE_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Fetch Encrypted Key
    const { data: wallet, error: fetchError } = await supabase
      .from("dev_wallets")
      .select("encrypted_private_key, encryption_iv")
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

    // 4. Sign Transaction (Offline / No Provider)
    // We do NOT connect to a provider here. We just sign.
    const walletSigner = new ethers.Wallet(privateKey);

    // Sanitize and BigInt conversion for the transaction object
    // The frontend sends strings/numbers, we need to ensure Ethers gets what it expects.
    const txRequest = {
        to: transaction.to,
        data: transaction.data,
        value: transaction.value ? BigInt(transaction.value) : 0n,
        gasLimit: transaction.gasLimit ? BigInt(transaction.gasLimit) : undefined,
        nonce: transaction.nonce !== undefined ? Number(transaction.nonce) : undefined,
        chainId: transaction.chainId ? Number(transaction.chainId) : undefined,

        // EIP-1559 fields
        maxFeePerGas: transaction.maxFeePerGas ? BigInt(transaction.maxFeePerGas) : undefined,
        maxPriorityFeePerGas: transaction.maxPriorityFeePerGas ? BigInt(transaction.maxPriorityFeePerGas) : undefined,

        // Legacy gasPrice
        gasPrice: transaction.gasPrice ? BigInt(transaction.gasPrice) : undefined,

        // Type (2 for EIP-1559)
        type: transaction.type !== undefined ? Number(transaction.type) : undefined
    };

    const signedTx = await walletSigner.signTransaction(txRequest);

    return new Response(
      JSON.stringify({
          success: true,
          signedTx: signedTx,
          message: "Transaction signed successfully"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Signing Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
