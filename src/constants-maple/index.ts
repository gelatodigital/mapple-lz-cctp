export enum ChainId {
  BaseSepolia =84532
}

interface INetwork {
  circleMessageTransmitter: string;
  usdc: string;
}

interface ISenderNetwork extends INetwork {
  mapleCCTPSender: string;
  circleTokenMessenger: string;
  confirmationChain: ChainId;
}

interface IReceiverNetwork extends INetwork {
  domain: number;
  chainId: number;
  maplePool: string;
  mapleCCTPReceiver: string;
}

interface INetworks {
  sender: { [id in ChainId]: ISenderNetwork };
  receiver: IReceiverNetwork;
}

export const NETWORKS: INetworks = {
  sender: {
    [ChainId.BaseSepolia]: {
      mapleCCTPSender: "0x6E24E10E0450B6868CaC141dD2acf266FBE00a3E",
      circleTokenMessenger: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
      circleMessageTransmitter: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
      usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      confirmationChain: ChainId.BaseSepolia,
    },
  },
  receiver: {
    domain: 0,
    chainId: 11155111,
    maplePool: "0x5F9b60A530dcc81b48Cd1d6B675EF9A766BBA326",
    mapleCCTPReceiver: "0x63Ca4Cb241294Fa19b9EF32BE558CAC49Ac975B6",
    circleMessageTransmitter: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  },
};

export const TWO_HOURS = 2 * 60 * 60 * 1000;
export const GELATO_API = "https://api.gelato.digital";
export const CIRCLE_API = "https://iris-api.circle.com";
