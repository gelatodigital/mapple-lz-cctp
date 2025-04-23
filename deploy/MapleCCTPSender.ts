import { DeployFunction } from "hardhat-deploy/types";
import { NETWORKS, ChainId } from "../src/constants-maple";
import hre from "hardhat";

const isHardhat = hre.network.name === "hardhat";

const func: DeployFunction = async () => {
  const chainId = await hre.getChainId();
  const accounts = await hre.getNamedAccounts();

  const srcNetwork = NETWORKS.sender[Number(chainId) as ChainId];
  const dstNetwork = NETWORKS.receiver;

  //if (!srcNetwork) throw new Error("Unsupported network");

  await hre.deployments.deploy("MapleCCTPSender", {
    from: accounts.deployer,
    args: [
      dstNetwork.mapleCCTPReceiver,
    ],
    deterministicDeployment: true,
    log: !isHardhat,
  });
};

func.tags = ["baseSepolia"];
//func.skip = async () => !isHardhat;

export default func;
