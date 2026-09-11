# 🌕 MoonBot — Fair Launchpad on BOT Chain

[![BOT Chain Testnet](https://img.shields.io/badge/Network-BOT%20Chain%20Testnet%20(968)-00f0a8?style=for-the-badge)](https://scan.bohr.life)
[![Smart Contract](https://img.shields.io/badge/Contract-0x5995...Cd993-3b82f6?style=for-the-badge)](https://scan.bohr.life/address/0x5995F44bB99BaBb4Fb44089012AC3A9def0Cd993)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber?style=for-the-badge)](https://opensource.org/licenses/MIT)

**MoonBot** is a decentralized, high-speed fair launchpad and automated market maker (AMM) native to **BOT Chain**. Inspired by the Pump.fun model, MoonBot enables anyone to create and trade meme coins instantly with **zero initial liquidity**, transparent constant-product bonding curves, automatic DEX graduation, and real-time creator royalties.

📖 **Read the Full Technical Whitepaper:** [`WHITEPAPER.md`](./WHITEPAPER.md)

---

## 🌟 Core Features

- **🚀 Zero-LP Fair Launch**:
  - Deploy a coin in seconds with zero upfront liquidity required.
  - 1 Billion fixed total supply (800M in bonding curve, 200M reserved for DEX).
  - No presale, no whitelist, no team pre-allocations — 100% fair distribution.
- **⚡ EIP-1167 Minimal Proxy Clones**:
  - Token deployments cost **~90% less gas** through lightweight 45-byte proxy pointers.
- **📈 Mathematical Bonding Curve ($x \cdot y = k$)**:
  - Automated price discovery governed by virtual reserves ($V_{BOT} \cdot V_{TOKEN} = K$).
  - Smooth continuous liquidity: buy and sell at any time directly against the smart contract.
- **💰 Real-Time Creator Royalties**:
  - Coin creators earn a **0.50% royalty** on every buy and sell trade, paid directly into their wallet automatically on-chain.
- **🎓 100% Autonomous DEX Graduation**:
  - When the bonding curve hits 100% (800M tokens sold), the smart contract automatically pairs all accumulated BOT with 200M reserved tokens to seed permanent DEX liquidity.
- **📊 Interactive Trading Terminal**:
  - **Live Candlestick / Line Chart**: Dynamic timeframe scaling (1s, 1m, 5m, 15m, 1h, 1D), real-time hover crosshair, and backward reserve reconstruction.
  - **On-Chain Trade Feed**: 100% direct from BOT Chain RPC logs (`getLogs`), multi-wallet trade tracking, and direct BohrScan explorer links.
  - **King of the Hill Spotlight**: Live crown badge and progress meter for the top trending token.
  - **Swap Terminal**: Instant Buy/Sell execution with quick preset chips (0.5, 1, 5, 10 BOT), slippage settings, and live balance refresh.
- **🔗 Reown AppKit (WalletConnect)**:
  - Supports MetaMask, Coinbase Wallet, Trust Wallet, Rabby, and mobile QR code pairing via WalletConnect.

---

## 🌐 Network Specifications

| Parameter | Value |
| :--- | :--- |
| **Network Name** | BOT Chain Testnet |
| **Chain ID** | `968` |
| **Native Currency** | BOT (18 Decimals) |
| **RPC Endpoint** | `https://rpc.bohr.life` |
| **Block Explorer** | [https://scan.bohr.life](https://scan.bohr.life) |
| **Launchpad Contract** | [`0x5995F44bB99BaBb4Fb44089012AC3A9def0Cd993`](https://scan.bohr.life/address/0x5995F44bB99BaBb4Fb44089012AC3A9def0Cd993) |

---

## 📐 Bonding Curve Economics

MoonBot uses an automated market maker virtual reserve model:

$$V_{BOT} \cdot V_{TOKEN} = K$$

- **Initial Virtual BOT Reserve ($V_{BOT}$):** `30 BOT`
- **Initial Virtual Token Reserve ($V_{TOKEN}$):** `1,073,000,000 Tokens`
- **Tokens for Sale in Curve:** `800,000,000 Tokens (80%)`
- **Tokens Reserved for DEX Pool:** `200,000,000 Tokens (20%)`
- **Starting Price:** `~0.000000028 BOT`
- **Graduation Target:** `~85 BOT` collected
- **Trading Fee:** `1.00%` (Split: `0.50%` Protocol Treasury + `0.50%` Token Creator)

---

## 📁 Repository Structure

```text
moonbot/
├── contracts/                  # Solidity Smart Contracts (Hardhat)
│   ├── contracts/
│   │   ├── MoonBotToken.sol    # Initializable ERC-20 template (EIP-1167)
│   │   └── MoonBotLaunchpad.sol# Factory, Bonding Curve AMM, Creator Fees, Graduation
│   ├── scripts/
│   │   └── deploy.js           # Hardhat deployment script for BOT Chain
│   ├── test/
│   │   └── MoonBotLaunchpad.test.js # Test suite
│   ├── hardhat.config.js       # Network and compiler configuration
│   └── .env.example            # Environment template
│
├── frontend/                   # Next.js 16 Web3 Application (Turbopack)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx        # Homepage (Hero, King of the Hill, Search, Grid)
│   │   │   ├── token/[address] # Trading Terminal, Price Chart, Live Feed
│   │   │   └── api/            # Off-chain image streaming & MongoDB routes
│   │   ├── components/
│   │   │   ├── Navbar.tsx      # Reown AppKit wallet button & network badge
│   │   │   ├── Footer.tsx      # Network status, contract info, ecosystem links
│   │   │   ├── KingOfTheHill.tsx # Top token spotlight
│   │   │   ├── InteractiveChart.tsx # Dynamic Canvas price chart
│   │   │   ├── BondingCurveMeter.tsx # Graduation progress bar
│   │   │   ├── SwapTerminal.tsx # Buy/Sell interface with slippage controls
│   │   │   ├── LaunchModal.tsx # Coin creation modal with snipe on launch
│   │   │   ├── TradeHistory.tsx # Scrollable on-chain trade feed
│   │   │   └── CommentsThread.tsx # Community discussion thread
│   │   ├── config/
│   │   │   └── reown.ts        # Reown AppKit + Wagmi v2 configuration
│   │   ├── context/
│   │   │   ├── MoonBotContext.tsx # Central blockchain data provider
│   │   │   └── Web3Provider.tsx # Wagmi + React Query provider
│   │   └── contracts/          # ABIs and contract addresses
│   └── .env.example            # Frontend environment template
│
├── WHITEPAPER.md               # Technical whitepaper & mathematical specification
└── README.md                   # Project documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js `>= 18.0.0`
- npm or yarn
- MetaMask or any Web3 Wallet configured for **BOT Chain Testnet**

---

### 1. Smart Contracts Setup

```bash
cd contracts
npm install

# Compile contracts
npx hardhat compile

# Run unit tests
npm test

# Deploy to BOT Chain Testnet
cp .env.example .env
# Edit .env and enter your PRIVATE_KEY
npm run deploy:testnet
```

---

### 2. Frontend Setup

```bash
cd frontend
npm install

# Copy environment variables
cp .env.example .env.local
```

Configure `frontend/.env.local`:
```env
NEXT_PUBLIC_LAUNCHPAD_ADDRESS=0x5995F44bB99BaBb4Fb44089012AC3A9def0Cd993
NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id_here
NEXT_PUBLIC_DEFAULT_CHAIN_ID=968
NEXT_PUBLIC_RPC_URL=https://rpc.bohr.life
MONGODB_URI=your_mongodb_connection_string
```

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or [http://localhost:3001](http://localhost:3001)) in your browser.

---

## 🔒 Security & Fair Launch Guarantees

- **No Pre-Mine**: 100% of tokens are minted directly into the launchpad contract at creation.
- **Rug-Proof Liquidity**: Creators cannot withdraw liquidity while the token is in the bonding curve.
- **Reentrancy Protection**: All state-modifying functions implement OpenZeppelin's `ReentrancyGuard`.
- **Direct On-Chain Data**: Trades and prices are verified against native blockchain events (`getLogs`) via the RPC node.

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
