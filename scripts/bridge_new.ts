/**
 * Bridge Script for Maple CCTP
 * 
 * This script handles the cross-chain transfer of USDC using Circle's CCTP protocol.
 * It initiates the bridge process by:
 * 1. Creating a contract instance for the MapleCCTPSender
 * 2. Generating an authorization for the USDC transfer
 * 3. Calling the bridgeAndDeposit function to start the cross-chain transfer
 */

import { Contract, ethers, parseUnits, Signer, JsonRpcProvider } from "ethers";
import * as mappleArtifacts from "../artifacts/contracts/MapleCCTPSender.sol/MapleCCTPSender.json";

import { initiateBridge } from "./initiate_deposit";
import { MapleCCTPSender } from "../typechain";

import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

// Load environment variables
const ALCHEMY_KEY = process.env.ALCHEMY_KEY;
const PK = process.env.PRIVATE_KEY;
if (!PK) throw new Error("PRIVATE_KEY not found in environment variables");
const RPC_URL = `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`;

// Initialize provider and signer for Base Sepolia network
const provider: JsonRpcProvider = new ethers.JsonRpcProvider(RPC_URL);
const signer: Signer = new ethers.Wallet(PK, provider);

// Contract configuration
const abi = mappleArtifacts.abi;
const mappleSenderAddress = "0x6E24E10E0450B6868CaC141dD2acf266FBE00a3E";

/**
 * Main bridge function that orchestrates the cross-chain transfer
 * 1. Creates a contract instance for the sender
 * 2. Generates authorization for the transfer
 * 3. Initiates the bridge process
 */
const bridge = async (): Promise<void> => {
  // Create contract instance for the sender
  const mappleSender = new Contract(
    mappleSenderAddress,
    abi,
    signer,
  ) as unknown as MapleCCTPSender;

  // Set amount to transfer (8 USDC with 6 decimals)
  const amount = parseUnits("50", 6);

  // Generate authorization for the transfer
  const authorization = await initiateBridge(
    await signer.getAddress(),
    mappleSenderAddress,
    amount,
    signer,
  );

  // Initiate the bridge process
  const tx = await mappleSender.bridgeAndDeposit(await signer.getAddress(), amount, authorization);
  const receipt = await tx.wait();
 
};

// Execute the bridge function with error handling
bridge().catch((error) => {
  console.error("Error in bridge execution:", error);
  process.exit(1);
});
