const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("=========================================");
  console.log("🚀 Deploying MoonBot to BOT Chain Mainnet");
  console.log("=========================================");
  console.log("Deployer / Fee Recipient:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer Balance:", ethers.formatEther(balance), "BOT");

  // 1. Deploy MoonBotToken Master Template
  console.log("\n1️⃣ Deploying MoonBotToken Master Implementation...");
  const TokenFactory = await ethers.getContractFactory("MoonBotToken");
  const tokenTemplate = await TokenFactory.deploy();
  await tokenTemplate.waitForDeployment();
  const tokenTemplateAddress = await tokenTemplate.getAddress();
  console.log("✅ MoonBotToken Master Template deployed to:", tokenTemplateAddress);

  // 2. Deploy MoonBotLaunchpad
  console.log("\n2️⃣ Deploying MoonBotLaunchpad Factory...");
  const LaunchpadFactory = await ethers.getContractFactory("MoonBotLaunchpad");
  const launchpad = await LaunchpadFactory.deploy(tokenTemplateAddress);
  await launchpad.waitForDeployment();
  const launchpadAddress = await launchpad.getAddress();
  console.log("✅ MoonBotLaunchpad deployed to:", launchpadAddress);

  const feeRecipient = await launchpad.feeRecipient();
  console.log("✅ Fee Recipient verified on-chain:", feeRecipient);

  const remainingBalance = await ethers.provider.getBalance(deployer.address);
  console.log("\n💰 Remaining Balance:", ethers.formatEther(remainingBalance), "BOT");

  console.log("\n=========================================");
  console.log("🎉 Mainnet Deployment Complete!");
  console.log("=========================================");
  console.log("Launchpad Address:", launchpadAddress);
  console.log("Token Template Address:", tokenTemplateAddress);
  console.log("Fee Recipient Address:", feeRecipient);
  console.log("=========================================");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
