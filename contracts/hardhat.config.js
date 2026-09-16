require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    botchain: {
      url: process.env.BOTCHAIN_RPC_URL || "https://rpc.botchain.ai",
      chainId: 677,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    botchainTestnet: {
      url: process.env.BOTCHAIN_TESTNET_RPC_URL || "https://rpc.bohr.life",
      chainId: 968,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      botchain: "empty",
      botchainTestnet: "empty",
    },
    customChains: [
      {
        network: "botchain",
        chainId: 677,
        urls: {
          apiURL: "https://scan.bohr.life/api",
          browserURL: "https://scan.bohr.life",
        },
      },
      {
        network: "botchainTestnet",
        chainId: 968,
        urls: {
          apiURL: "https://scan.bohr.life/api",
          browserURL: "https://scan.bohr.life",
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
  },
};

