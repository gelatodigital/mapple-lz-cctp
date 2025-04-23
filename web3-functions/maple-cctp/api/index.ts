import { CallWithSyncFeeRequest, GelatoRelay } from "@gelatonetwork/relay-sdk";
import { GELATO_API, CIRCLE_API } from "../../../src/constants";
import {
  IAttestation,
  AttesationState,
  ICallWithSyncFeeRequest,
  IRelayRequestResponse,
  IRelayTaskStatusResponse,
  IRelayTaskStatus,
  ICreateTransferRequest,
  IUpdateTransferRequest,
} from "../types";
import ky from "ky";

const getErrorMsg = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export const getRelayTaskStatus = async (
  taskId: string,
): Promise<IRelayTaskStatus | null> => {
  try {
    const { task } = (await ky
      .get(`${GELATO_API}/tasks/status/${taskId}`)
      .json()) as IRelayTaskStatusResponse;
    return task;
  } catch (e) {
    console.error("getRelayTaskStatus:", getErrorMsg(e));
    return null;
  }
};

export const getAttestation = async (
  messageHash: string,
): Promise<string | null> => {
  try {
    const { status, attestation } = (await ky
      .get(`${CIRCLE_API}/attestations/${messageHash}`)
      .json()) as IAttestation;
    return status === AttesationState.Complete ? attestation : null;
  } catch (e) {
    console.error("getAttestation:", getErrorMsg(e));
    return null;
  }
};

export const callWithSyncFee = async (
  request: ICallWithSyncFeeRequest,
  sponsorApiKey: string,
): Promise<string | null> => {
  try {

    const requestrelay: CallWithSyncFeeRequest = 
    { isRelayContext:true,
      target:request.target,
      feeToken:request.feeToken,
      chainId: BigInt(request.chainId),
      data: request.data
    }
  
    const relay = new GelatoRelay();
    const response = await relay.callWithSyncFee(requestrelay, {retries:0},sponsorApiKey);
    console.log(`https://relay.gelato.digital/tasks/status/${response.taskId}`);
    return response.taskId
  } catch (e) {
    console.log(e)
    console.error("callWithSyncFee:", getErrorMsg(e));
    return null;
 }
};

export const create1BalanceTransfer = async (
  transfer: ICreateTransferRequest,
  accessToken: string,
): Promise<void> => {
  try {
    await ky.post(`${GELATO_API}/1balance/networks/mainnets/cctp/transfers`, {
      json: {
        chainId: transfer.chainId,
        transactionHash: transfer.transactionHash,
        blockNumber: transfer.blockNumber,
        blockHash: transfer.blockHash,
        sponsorAddress: transfer.sponsor,
        tokenAddress: transfer.token,
        amount: transfer.amount,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (e) {
    console.error("createTransfer:", getErrorMsg(e));
  }
};

export const update1BalanceTransfer = async (
  transfer: IUpdateTransferRequest,
  accessToken: string,
): Promise<void> => {
  try {
    await ky.put(`${GELATO_API}/1balance/networks/mainnets/cctp/transfers`, {
      json: {
        chainId: transfer.chainId,
        transactionHash: transfer.transactionHash,
        status: transfer.status,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (e) {
    console.error("updateTransfer:", getErrorMsg(e));
  }
};
