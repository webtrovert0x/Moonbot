const hre = require("hardhat");

async function main() {
  const tokenTemplateAddress = "0x9050fFa3269a268bee3604CCb7B2020a9cE7CAbb";
  const launchpadAddress = "0xD95368B45cca7C275B101DA4c54e67f0f5248063";

  console.log("1️⃣ Verifying MoonBotToken Master Template...");
  try {
    await hre.run("verify:verify", {
      address: tokenTemplateAddress,
      constructorArguments: [],
    });
    console.log("✅ MoonBotToken verified successfully!");
  } catch (error) {
    console.log("Token verification output:", error.message);
  }

  console.log("\n2️⃣ Verifying MoonBotLaunchpad Factory...");
  try {
    await hre.run("verify:verify", {
      address: launchpadAddress,
      constructorArguments: [tokenTemplateAddress],
    });
    console.log("✅ MoonBotLaunchpad verified successfully!");
  } catch (error) {
    console.log("Launchpad verification output:", error.message);
  }
}

main().catch(console.error);
