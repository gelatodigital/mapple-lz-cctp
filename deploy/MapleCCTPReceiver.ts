import { DeployFunction } from "hardhat-deploy/types";
import { NETWORKS } from "../src/constants-maple";
import hre from "hardhat";

const isHardhat = hre.network.name === "hardhat";

const func: DeployFunction = async () => {
  const chainId = await hre.getChainId();
  const accounts = await hre.getNamedAccounts();

  console.log('receiver');

  const mapplePool = await hre.deployments.deploy("MaplePool", {
    from: accounts.deployer,
    args: [],
    deterministicDeployment: true,
    log: !isHardhat,
  });


  await hre.deployments.deploy("MapleCCTPReceiver", {
    from: accounts.deployer,
    args: [
      mapplePool.address,
    ],
    deterministicDeployment: true,
    log: !isHardhat,
  });
 };

func.tags = ["sepolia"];
//func.skip = async () => !isHardhat;

export default func;
