import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorVault } from "../target/types/anchor_vault";
import { BN } from "bn.js";
import { expect } from 'chai';


describe("anchor_vault", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider);
  const connection = provider.connection;

  const program = anchor.workspace.AnchorVault as Program<AnchorVault>;

  const amount = new BN( 10 * anchor.web3.LAMPORTS_PER_SOL);

  it("should initialize, deposit, withdraw, and close the vault", async () => {
    // Add your test here.
    let balance = await connection.getBalance(provider.wallet.publicKey);
    console.log("Balance: ", balance / anchor.web3.LAMPORTS_PER_SOL);

    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);

    console.log("New balance is ", (await connection.getBalance(provider.wallet.publicKey)) / anchor.web3.LAMPORTS_PER_SOL);

    console.log("--------------------");
    console.log("Depositing 10 SOL");
    const tx_deposit = await program.methods.deposit(amount).rpc();

    console.log("Your transaction signature", tx_deposit);
    console.log("New balance is ", (await connection.getBalance(provider.wallet.publicKey)) / anchor.web3.LAMPORTS_PER_SOL);

    const [vaultStatePda, _bump_vs] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('state'), provider.wallet.publicKey.toBuffer()],
      program.programId
    );
    console.log("Vault state PDA: ", vaultStatePda.toBase58());

    const [vaultPda, _bump_v] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), vaultStatePda.toBuffer()],
      program.programId
    );
    console.log("Vault PDA: ", vaultPda.toBase58());

    let vaultBalance = await connection.getBalance(vaultPda);
    console.log("Vault balance: ", vaultBalance / anchor.web3.LAMPORTS_PER_SOL);

    expect(vaultBalance).to.equal(amount.toNumber());

    console.log("--------------------");
    console.log("Withdrawing 10 SOL");
    const tx_withdraw = await program.methods.withdraw(amount).rpc();
    console.log("Your transaction signature", tx_withdraw);

    console.log("New balance is ", (await connection.getBalance(provider.wallet.publicKey)) / anchor.web3.LAMPORTS_PER_SOL);
    
    vaultBalance = await connection.getBalance(vaultPda);
    console.log("Vault balance: ", (vaultBalance) / anchor.web3.LAMPORTS_PER_SOL);
    expect(vaultBalance).to.equal(0);
    console.log("--------------------");

    console.log("Closing the vault");
    const tx_close = await program.methods.close().rpc();

    const vaultAccountInfo = await connection.getAccountInfo(vaultPda);
    const vaultStateAccountInfo = await connection.getAccountInfo(vaultStatePda);
  
    console.log("Vault account exists:", vaultAccountInfo !== null);
    console.log("VaultState account exists:", vaultStateAccountInfo !== null);
  
    // Add assertions
    expect(vaultAccountInfo).to.be.null;
    expect(vaultStateAccountInfo).to.be.null;
  
    console.log("--------------------");  
  });
});