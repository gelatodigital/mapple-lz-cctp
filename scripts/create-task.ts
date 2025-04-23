import { ethers, w3f } from "hardhat";
import {
  AutomateSDK,
  TriggerConfig,
  TriggerType,
  Web3Function,
} from "@gelatonetwork/automate-sdk";

import * as dotenv from "dotenv";
dotenv.config();

const main = async () => {
  const ONEBALANCE_API_KEY = process.env.ONEBALANCE_API_KEY;
  if (!ONEBALANCE_API_KEY)
    throw new Error("ONEBALANCE_API_KEY missing in .env");

  const SOURCE_RPC_URL = process.env.SOURCE_RPC_URL;
  if (!SOURCE_RPC_URL)
    throw new Error("SOURCE_RPC_URL missing in .env");

  const cctpW3f = w3f.get("maple-cctp");
  const cctpCid = await cctpW3f.deploy();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deployer]: any[] = await ethers.getSigners();
  const { chainId } = await ethers.provider.getNetwork();

  // required since the automate-sdk uses ethers v5
  deployer._isSigner = true;
  deployer.getChainId = () => chainId.toString();

  const automate = new AutomateSDK(Number(chainId), deployer);
  const web3Function = new Web3Function(Number(chainId), deployer);

  const trigger: TriggerConfig = {
    type: TriggerType.TIME,
    interval: 15000,
    start:Date.now()

  };

  const { taskId, tx } = await automate.createBatchExecTask({
    name: "Maple CCTP",
    web3FunctionHash: cctpCid,
    web3FunctionArgs: {},
    useTreasury: false,
    trigger,
  });

  await tx.wait();
console.log(SOURCE_RPC_URL)

  const secrets = {
    ONEBALANCE_API_KEY: ONEBALANCE_API_KEY,
    SOURCE_RPC_URL: SOURCE_RPC_URL,
  };

  await web3Function.secrets.set(secrets, taskId);

  console.log(
    `https://beta.app.gelato.network/task/${taskId}?chainId=${chainId}`,
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
