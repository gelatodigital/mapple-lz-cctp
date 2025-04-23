/**
 * Maple CCTP Bridge Web3 Function
 * 
 * This web3 function handles the cross-chain transfer of USDC using Circle's CCTP protocol.
 * It monitors events from the source chain, fetches attestations, and relays transactions
 * to the target chain.
 * 
 * Flow:
 * 1. Monitors LogBridge events from MapleCCTPSender
 * 2. Fetches corresponding MessageSent events from Circle's MessageTransmitter
 * 3. Gets attestations for the messages
 * 4. Relays transactions to the target chain
 * 5. Tracks the status of relayed transactions
 */

import { NETWORKS, TWO_HOURS, ChainId } from "../../src/constants-maple";
import { ethers, JsonRpcProvider } from "ethers";
import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import {
  ITransfer,
  ICallWithSyncFeeRequest,
  TaskState,
  TransferState,
  TransferStatus,
} from "./types";
import {
  callWithSyncFee,
  getAttestation,
  getRelayTaskStatus,
} from "./api";
import {
  IMessageTransmitter__factory,
  MapleCCTPReceiver__factory,
  MapleCCTPSender__factory,
} from "../../typechain";
import { network } from "hardhat";

Web3Function.onRun(async (context: Web3FunctionContext) => {
  // Get required secrets from environment
  const oneBalanceApiKey = await context.secrets.get("ONEBALANCE_API_KEY");
  if (!oneBalanceApiKey)
    return { canExec: false, message: "Missing ONEBALANCE_API_KEY in secrets" };

  const SOURCE_RPC_URL = await context.secrets.get("SOURCE_RPC_URL");
  if (!SOURCE_RPC_URL)
    return { canExec: false, message: "Missing Provider for Source Chain" };

  // Initialize provider for source chain
  const sourceProvider = new JsonRpcProvider(SOURCE_RPC_URL);

  // Get current block and last processed block
  const currentBlock = await sourceProvider.getBlock("latest") as ethers.Block;
  const lastBlockStr = await context.storage.get("lastBlockStr");
  const lastBlock = lastBlockStr ? Number(lastBlockStr) : currentBlock.number;

  // Set up network configuration
  const chainId = 84532; // Base Sepolia
  const network = NETWORKS.sender[chainId];

  // Initialize last processed block if not set
  if (!lastBlockStr)
    await context.storage.set("lastBlockStr", currentBlock.number.toString());

  // Early return if no new blocks to process
  if (currentBlock.number === lastBlock)
    return { canExec: false, message: "No blocks to index" };

  // Load existing transfer requests from storage
  const transferRequestsStr = await context.storage.get("transfers");
  const transferRequests: ITransfer[] = transferRequestsStr
    ? JSON.parse(transferRequestsStr)
    : [];

  // Initialize contract instances for source chain
  const runner = { provider: sourceProvider as any };

  // Connect to Circle's MessageTransmitter contract
  const circleMessageTransmitter = IMessageTransmitter__factory.connect(
    network.circleMessageTransmitter,
    runner,
  );

  // Connect to MapleCCTPSender contract
  const mapleCCTPSender = MapleCCTPSender__factory.connect(
    network.mapleCCTPSender,
    runner,
  );

  // Create interface for MapleCCTPReceiver
  const IMapleCCTPReceiver = MapleCCTPReceiver__factory.createInterface();

  // Update status of existing transfer requests
  await Promise.all(
    transferRequests.map(async (transferRequest, index): Promise<void> => {
      // Skip if not pending confirmation or no taskId
      if (
        transferRequest.state !== TransferState.PendingConfirmation ||
        !transferRequest.taskId
      )
        return;

      // Get task status from Gelato
      const taskStatus = await getRelayTaskStatus(transferRequest.taskId);
      if (!taskStatus) return;

      // Skip if task is still pending
      if (
        taskStatus.taskState === TaskState.CheckPending ||
        taskStatus.taskState === TaskState.ExecPending ||
        taskStatus.taskState === TaskState.WaitingForConfirmation
      )
        return;

      // Update transfer state based on task status
      if (taskStatus.taskState === TaskState.ExecSuccess)
        transferRequests[index].state = TransferState.Confirmed;
      else {
        console.error("Retrying transfer:", transferRequest.taskId);
        transferRequests[index].state = TransferState.PendingRelayRequest;
      }
    }),
  );

  // Query events from last processed block
  console.log(lastBlock, currentBlock.number);
  
  // Get MessageSent events from Circle's MessageTransmitter
  const circleMessageSentEvents = await circleMessageTransmitter.queryFilter(
    circleMessageTransmitter.filters.MessageSent,
    lastBlock + 1,
    currentBlock.number,
  );

  // Get LogBridge events from MapleCCTPSender
  const mapleLogBridgeEvents = await mapleCCTPSender.queryFilter(
    mapleCCTPSender.filters.LogBridge,
    lastBlock + 1,
    currentBlock.number,
  );

  // Map LogBridge events to transfer requests
  // Note: Each LogBridge event corresponds to a MessageSent event
  const indexedTransferRequests = mapleLogBridgeEvents.map(
    (bridge): ITransfer => {
      const message = circleMessageSentEvents.find(
        (message) => message.transactionHash === bridge.transactionHash,
      )!.args.message;

      return {
        sponsor: bridge.args.sponsor,
        amount: bridge.args.amount.toString(),
        transactionHash: bridge.transactionHash,
        state: TransferState.PendingAttestation,
        expiry: Date.now() + TWO_HOURS,
        chainId: Number(chainId),
        message,
      };
    },
  );

  // Add new transfer requests to existing ones
  transferRequests.push(...indexedTransferRequests);

  // Fetch attestations for pending transfers
  await Promise.all(
    transferRequests.map(async (transferRequest, index): Promise<void> => {
      if (transferRequest.state !== TransferState.PendingAttestation) return;

      const messageHash = ethers.keccak256(transferRequest.message);
      const attestation = await getAttestation(messageHash);

      if (!attestation) return;

      transferRequests[index].attestation = attestation;
      transferRequests[index].state = TransferState.PendingRelayRequest;
    }),
  );

  // Execute pending transfers
  await Promise.all(
    transferRequests.map(async (transferRequest, index): Promise<void> => {
      if (
        transferRequest.state !== TransferState.PendingRelayRequest ||
        !transferRequest.attestation
      )
        return;

      // Encode function call for receiveAndDepositSyncFee
      const receiveAndDeposit = IMapleCCTPReceiver.encodeFunctionData(
        "receiveAndDepositSyncFee",
        [
          transferRequest.sponsor,
          transferRequest.message,
          transferRequest.attestation,
        ],
      );

      // Prepare relay request
      const request: ICallWithSyncFeeRequest = {
        chainId: NETWORKS.receiver.chainId,
        target: NETWORKS.receiver.mapleCCTPReceiver,
        data: receiveAndDeposit,
        feeToken: NETWORKS.receiver.usdc,
      };

      // Submit relay request to Gelato
      const taskId = await callWithSyncFee(request, oneBalanceApiKey);
      if (!taskId) return;

      transferRequests[index].taskId = taskId;
      transferRequests[index].state = TransferState.PendingConfirmation;
    }),
  );

  // Mark expired transfers
  transferRequests.forEach((transferRequest, index) => {
    if (transferRequest.expiry < Date.now())
      transferRequests[index].state = TransferState.Expired;
  });

  // Filter out confirmed and expired transfers
  const remainingTransferRequests = transferRequests.filter(
    (transferRequest) =>
      transferRequest.state !== TransferState.Confirmed &&
      transferRequest.state !== TransferState.Expired,
  );

  // Update storage with remaining transfers
  await context.storage.set(
    "transfers",
    JSON.stringify(remainingTransferRequests),
  );

  // Update last processed block
  await context.storage.set("lastBlockStr", currentBlock.number.toString());

  // Calculate statistics for different transfer states
  const stateCount = transferRequests.reduce(
    (prev, transferRequest) => {
      prev[transferRequest.state]++;
      return prev;
    },
    {
      Confirmed: 0,
      PendingAttestation: 0,
      PendingConfirmation: 0,
      PendingRelayRequest: 0,
    } as { [key in TransferState]: number },
  );

  // Prepare status message
  const message =
    `network: ${ChainId[Number(chainId) as ChainId]}, ` +
    `processed: ${currentBlock.number - lastBlock}, ` +
    `indexed: ${mapleLogBridgeEvents.length}, ` +
    `attesting: ${stateCount[TransferState.PendingAttestation]}, ` +
    `executed: ${stateCount[TransferState.PendingConfirmation]}, ` +
    `confirmed: ${stateCount[TransferState.Confirmed]}`;

  return { canExec: false, message };
});
