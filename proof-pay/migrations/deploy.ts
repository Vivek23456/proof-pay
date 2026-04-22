/**
 * Devnet deploy shim. `anchor deploy` drives the actual deploy; this file exists
 * so `anchor test` (and future Anchor CLI verbs) can wire their post-deploy hook.
 */
import * as anchor from "@coral-xyz/anchor";

module.exports = async function (provider: anchor.AnchorProvider) {
  anchor.setProvider(provider);
  console.log("proof_pay deployed to", provider.connection.rpcEndpoint);
};
