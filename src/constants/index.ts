export enum ChainId {
  Ethereum = 1,
  Avalanche = 43114,
  Optimism = 10,
  Arbitrum = 42161,
  Base = 8453,
}

interface INetwork {
  circleMessageTransmitter: string;
  usdc: string;
}

interface ISenderNetwork extends INetwork {
  gelato1BalanceCCTPSender: string;
  circleTokenMessenger: string;
  confirmationChain: ChainId;
}

interface IReceiverNetwork extends INetwork {
  domain: number;
  chainId: number;
  gelato1Balance: string;
  gelato1BalanceCCTPReceiver: string;
}

interface INetworks {
  sender: { [id in ChainId]: ISenderNetwork };
  receiver: IReceiverNetwork;
}

export const NETWORKS: INetworks = {
  sender: {
    [ChainId.Ethereum]: {
      gelato1BalanceCCTPSender: "0xFc18C0423F803304272F7ba0FBb3988012Ce06e5",
      circleTokenMessenger: "0xBd3fa81B58Ba92a82136038B25aDec7066af3155",
      circleMessageTransmitter: "0x0a992d191DEeC32aFe36203Ad87D7d289a738F81",
      usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      confirmationChain: ChainId.Ethereum,
    },
    [ChainId.Avalanche]: {
      gelato1BalanceCCTPSender: "0xF955E8b9d8E39263145E6DaDe941958743Bb4fe4",
      circleTokenMessenger: "0x6B25532e1060CE10cc3B0A99e5683b91BFDe6982",
      circleMessageTransmitter: "0x8186359aF5F57FbB40c6b14A588d2A59C0C29880",
      usdc: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
      confirmationChain: ChainId.Avalanche,
    },
    [ChainId.Optimism]: {
      gelato1BalanceCCTPSender: "0x39817aaF09677e92855227B91D50330001d010B4",
      circleTokenMessenger: "0x2B4069517957735bE00ceE0fadAE88a26365528f",
      circleMessageTransmitter: "0x4D41f22c5a0e5c74090899E5a8Fb597a8842b3e8",
      usdc: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
      confirmationChain: ChainId.Ethereum,
    },
    [ChainId.Arbitrum]: {
      gelato1BalanceCCTPSender: "0xea112Bf0254D925f62DDF681e22CaE9f2FeCd5A2",
      circleTokenMessenger: "0x19330d10D9Cc8751218eaf51E8885D058642E08A",
      circleMessageTransmitter: "0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca",
      usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      confirmationChain: ChainId.Ethereum,
    },
    [ChainId.Base]: {
      gelato1BalanceCCTPSender: "0x44c430447B6CF9E496a349Fc8F10967B43922371",
      circleTokenMessenger: "0x1682Ae6375C4E4A97e4B583BC394c861A46D8962",
      circleMessageTransmitter: "0xAD09780d193884d503182aD4588450C416D6F9D4",
      usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      confirmationChain: ChainId.Ethereum,
    },
  },
  receiver: {
    domain: 7,
    chainId: 137,
    gelato1Balance: "0x7506C12a824d73D9b08564d5Afc22c949434755e",
    gelato1BalanceCCTPReceiver: "0x99746A0dCc24492207Ba95A458e9fA036f48e53e",
    circleMessageTransmitter: "0xF3be9355363857F3e001be68856A2f96b4C39Ba9",
    usdc: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  },
};

export const TWO_HOURS = 2 * 60 * 60 * 1000;
export const GELATO_API = "https://api.gelato.digital";
export const CIRCLE_API = "https://iris-api-sandbox.circle.com"//"https://iris-api.circle.com";
