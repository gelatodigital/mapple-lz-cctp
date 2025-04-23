export enum TaskState {
  CheckPending = "CheckPending",
  ExecPending = "ExecPending",
  ExecSuccess = "ExecSuccess",
  WaitingForConfirmation = "WaitingForConfirmation",
}

export enum AttesationState {
  Complete = "complete",
}

export enum TransferState {
  PendingAttestation = "PendingAttestation",
  PendingRelayRequest = "PendingRelayRequest",
  PendingConfirmation = "PendingConfirmation",
  Confirmed = "Confirmed",
  Expired = "Expired",
}

export enum TransferStatus {
  Pending = "Pending",
  Cancelled = "Cancelled",
  Confirmed = "Confirmed",
}

export interface IAttestation {
  attestation: string;
  status: AttesationState;
}

export interface ITransfer {
  sponsor: string;
  amount: string;
  message: string;
  state: TransferState;
  expiry: number;
  chainId: number;
  transactionHash: string;
  attestation?: string;
  taskId?: string;
}

export interface ITransferRequest {
  chainId: number;
  transactionHash: string;
}

export interface ICreateTransferRequest extends ITransferRequest {
  sponsor: string;
  token: string;
  amount: string;
  blockNumber: number;
  blockHash: string;
}

export interface IUpdateTransferRequest extends ITransferRequest {
  status: TransferStatus;
}

export interface ICallWithSyncFeeRequest {
  chainId: number;
  target: string;
  data: string;
  feeToken: string;
}

export interface IRelayRequestResponse {
  taskId: string;
}

export interface IRelayTaskStatus {
  taskState: TaskState;
}

export interface IRelayTaskStatusResponse {
  task: IRelayTaskStatus;
}
