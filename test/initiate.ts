/**
 * Test Suite for Maple CCTP Bridge
 * 
 * This test suite verifies the functionality of the Maple CCTP bridge implementation.
 * It tests the cross-chain transfer of USDC using Circle's CCTP protocol.
 * 
 * The test flow:
 * 1. Sets up the test environment with necessary contracts and accounts
 * 2. Funds the test account with USDC from a whale account
 * 3. Initiates the bridge process
 * 4. Verifies the transfer was successful
 */

import hre from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import * as mappleArtifacts from "../artifacts/contracts/MapleCCTPSender.sol/MapleCCTPSender.json"
import {
  setBalance,
  impersonateAccount,
} from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { MapleCCTPSender } from "../typechain";
import { initiateBridge } from "../scripts/initiate_deposit";
import { Contract, parseUnits, Log, EventLog } from "ethers";

const { ethers, deployments } = hre;

// USDC contract interface
interface IUSDC {
  transfer(to: string, value: bigint): Promise<boolean>;
  balanceOf(owner: string): Promise<bigint>;
  connect(signer: HardhatEthersSigner): IUSDC;
}

// USDC contract configuration
const usdcAbi = [
  "function transfer(address _to, uint256 _value) public returns (bool success)", 
  "function balanceOf(address _owner) public view returns (uint256 balance)"
];
const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

describe("Maple CCTP Bridge Tests", function () {
  let admin: HardhatEthersSigner;
  let adminAddress: string;
  let mapleCCTPSender: MapleCCTPSender;
  let mapleCCTPSenderAddress: string;

  beforeEach(async function () {
    // Ensure tests are running on hardhat network
    if (hre.network.name !== "hardhat") {
      console.error("Test Suite is meant to be run on hardhat only");
      process.exit(1);
    }

    // Deploy contracts and get signers
    await deployments.fixture("baseSepolia");
    [admin] = await ethers.getSigners();
    adminAddress = await admin.getAddress();
    
    // Fund admin account with ETH
    await setBalance(adminAddress, ethers.parseEther("1000"));

    // Get MapleCCTPSender contract instance
    mapleCCTPSenderAddress = (await deployments.get("MapleCCTPSender")).address;
    mapleCCTPSender = await ethers.getContractAt(
      "MapleCCTPSender",
      mapleCCTPSenderAddress,
    ) as unknown as MapleCCTPSender;
    
  });

  it("should successfully complete the bridge transfer", async () => {
    // Get USDC contract instance
    const usdc = new Contract(usdcAddress, usdcAbi, admin) as unknown as IUSDC;
    
    // Check initial USDC balance
    const initialBalance = await usdc.balanceOf(adminAddress);
    console.log("Initial USDC balance:", initialBalance.toString());

    // Transfer USDC from whale to admin
    const amount = parseUnits("10", 6);
    const whaleAddress = "0x52EdA770E87565ddB61cc1E9011192c5e3D5CbEc";
    await impersonateAccount(whaleAddress);
    const whale = await ethers.getSigner(whaleAddress);
    await usdc.connect(whale).transfer(adminAddress, amount);
    
    // Verify USDC transfer
    const balanceAfterTransfer = await usdc.balanceOf(adminAddress);
    console.log("USDC balance after transfer:", balanceAfterTransfer.toString());

    // Generate authorization for bridge
    const authorization = await initiateBridge(
      adminAddress,
      mapleCCTPSenderAddress,
      amount,
      admin,
    );

    // Execute bridge transfer and verify LogBridge event
    const tx = await mapleCCTPSender.bridgeAndDeposit(adminAddress, amount, authorization);
    const receipt = await tx.wait();
    
    // Verify LogBridge event was emitted
    const logBridgeEvent = receipt?.logs.find(
      (log: Log | EventLog) => 'fragment' in log && log.fragment?.name === "LogBridge"
    ) as EventLog;
    expect(logBridgeEvent).to.not.be.undefined;
    
    // Parse event data
    const eventData = mapleCCTPSender.interface.parseLog({
      topics: logBridgeEvent?.topics || [],
      data: logBridgeEvent?.data || "0x"
    });
    
    expect(eventData?.args[0]).to.equal(adminAddress); // sponsor
    expect(eventData?.args[1]).to.equal(amount); // amount

    // Verify sender contract has 0 USDC balance
    const senderBalance = await usdc.balanceOf(mapleCCTPSenderAddress);
    expect(senderBalance).to.equal(0n);
    console.log("Sender contract USDC balance:", senderBalance.toString());

    // Verify admin's final balance equals initial balance
    const finalBalance = await usdc.balanceOf(adminAddress);
    expect(finalBalance).to.equal(initialBalance);
    console.log("Final USDC balance:", finalBalance.toString());
  });
});
