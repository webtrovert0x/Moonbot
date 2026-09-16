import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { defineChain, type AppKitNetwork } from '@reown/appkit/networks';

// BOT Chain Mainnet definition
export const botChainMainnet = defineChain({
  id: 677,
  name: 'BOT Chain Mainnet',
  chainNamespace: 'eip155',
  caipNetworkId: 'eip155:677',
  nativeCurrency: {
    decimals: 18,
    name: 'BOT',
    symbol: 'BOT',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.botchain.ai'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BohrScan',
      url: 'https://scan.bohr.life',
    },
  },
});

// BOT Chain Testnet definition
export const botChainTestnet = defineChain({
  id: 968,
  name: 'BOT Chain Testnet',
  chainNamespace: 'eip155',
  caipNetworkId: 'eip155:968',
  nativeCurrency: {
    decimals: 18,
    name: 'BOT',
    symbol: 'BOT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.bohr.life'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BohrScan',
      url: 'https://scan.bohr.life',
    },
  },
});

export const networks = [botChainMainnet, botChainTestnet] as unknown as [AppKitNetwork, ...AppKitNetwork[]];

// Reown Project ID
export const projectId =
  process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || 'c43f36da76c6ec227aa6d98c25dbbb11';

// Set up Wagmi Adapter with persistent storage
export const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  projectId,
  networks,
});

export const config = wagmiAdapter.wagmiConfig;

// Metadata for Reown Modal
export const metadata = {
  name: 'MoonBot',
  description: 'Fair Launchpad & Meme Coin Terminal on BOT Chain Mainnet',
  url: 'https://moonbot.ai',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
};

// Initialize AppKit with BOT Chain Mainnet
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  defaultNetwork: botChainMainnet,
  metadata,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#00f0a8',
    '--w3m-color-mix': '#0f111a',
    '--w3m-color-mix-strength': 40,
    '--w3m-border-radius-master': '12px',
  },
  features: {
    analytics: true,
    email: false,
    socials: false,
  },
});
