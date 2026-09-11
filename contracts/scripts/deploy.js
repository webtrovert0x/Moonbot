const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying MoonBotLaunchpad with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "BOT");

  const LaunchpadFactory = await ethers.getContractFactory("MoonBotLaunchpad");
  const launchpad = await LaunchpadFactory.deploy();
  await launchpad.waitForDeployment();

  const launchpadAddress = await launchpad.getAddress();
  console.log("MoonBotLaunchpad deployed to:", launchpadAddress);

  console.log("BOT Chain Explorer:", `https://scan.bohr.life/address/${launchpadAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
