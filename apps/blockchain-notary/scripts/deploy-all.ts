import { ethers } from "hardhat";

async function main() {
  console.log("Deploying GovernanceRegistry...");
  const GovernanceRegistry = await ethers.getContractFactory("GovernanceRegistry");
  const govContract = await GovernanceRegistry.deploy();
  await govContract.waitForDeployment();
  const govAddress = await govContract.getAddress();
  console.log(`GovernanceRegistry deployed to: ${govAddress}`);

  console.log("Deploying ArtisanNFTFactory...");
  const ArtisanNFTFactory = await ethers.getContractFactory("ArtisanNFTFactory");
  const factoryContract = await ArtisanNFTFactory.deploy();
  await factoryContract.waitForDeployment();
  const factoryAddress = await factoryContract.getAddress();
  console.log(`ArtisanNFTFactory deployed to: ${factoryAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
