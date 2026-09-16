const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice || 0n;

  console.log("Gas price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");

  // 1. MoonBotToken deployment gas
  const TokenFactory = await ethers.getContractFactory("MoonBotToken");
  const tokenTx = await TokenFactory.getDeployTransaction();
  const tokenGas = await ethers.provider.estimateGas(tokenTx);
  const tokenCost = tokenGas * gasPrice;
  console.log("1. MoonBotToken Deploy Gas:", tokenGas.toString(), "Cost:", ethers.formatEther(tokenCost), "BOT");

  // 2. MoonBotLaunchpad deployment gas (optimized with external token impl address)
  const dummyTokenAddress = "0x000000000000000000000000000000000000dEaD";
  const LaunchpadFactory = await ethers.getContractFactory("MoonBotLaunchpad");
  const launchpadTx = await LaunchpadFactory.getDeployTransaction(dummyTokenAddress);
  const launchpadGas = await ethers.provider.estimateGas(launchpadTx);
  const launchpadCost = launchpadGas * gasPrice;
  console.log("2. MoonBotLaunchpad Deploy Gas (optimized):", launchpadGas.toString(), "Cost:", ethers.formatEther(launchpadCost), "BOT");

  const totalGas = tokenGas + launchpadGas;
  const totalCost = tokenCost + launchpadCost;
  console.log("\n--- Combined Deploy Summary ---");
  console.log("Total Gas Units:", totalGas.toString());
  console.log("Total Estimated Cost (both contracts):", ethers.formatEther(totalCost), "BOT");
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer Wallet Balance:", ethers.formatEther(balance), "BOT");
  console.log("Sufficient balance to deploy both?:", balance >= totalCost);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
