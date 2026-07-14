import { ethers } from "hardhat";

async function main() {
  console.log("Deploying GovernanceRegistry...");
  const GovernanceRegistry = await ethers.getContractFactory("GovernanceRegistry");
  const contract = await GovernanceRegistry.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`GovernanceRegistry deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
