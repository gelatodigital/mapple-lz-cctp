import { HardhatUserConfig } from "hardhat/config";
import { ChainId } from "./src/constants-maple";
import "@gelatonetwork/web3-functions-sdk/hardhat-plugin";
import "@nomicfoundation/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan"
import "@typechain/hardhat";
import "hardhat-deploy";

import * as dotenv from "dotenv";
dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY;
const ALCHEMY_KEY  = process.env.ALCHEMY_KEY

const config: HardhatUserConfig = {
  w3f: {
    rootDir: "./web3-functions",
    debug: false,
    networks: ["baseSepolia"],
  },
  solidity: {
    compilers: [
      {
        version: "0.8.25",
        settings: {
          optimizer: { enabled: true, runs: 999999 },
          evmVersion: "paris",
        },
      },
    ],
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v6",
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  defaultNetwork:"sepolia",
  networks: {
    hardhat: {
      forking: {
        url: `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,

       blockNumber: 	24774417,
      },
    },
    baseSepolia: {
      chainId: ChainId.BaseSepolia,
      url: `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    sepolia: {
      chainId: 11155111,
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },

    etherscan: {
      apiKey:  { 
        sepolia: ETHERSCAN_KEY as string,
        baseSepolia: "EZI5X2XJYXSQIUM2VV9XW4CZ22BS7JW7G5"
      },
      customChains: [
        {
          network: "baseSepolia",
          chainId: 84532,
          urls: {
           apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
          }
        }
      ]
    },

};

export default config;
