import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { defineChain, type AppKitNetwork } from '@reown/appkit/networks';

// BOT Chain Testnet definition ONLY
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

export const networks = [botChainTestnet] as unknown as [AppKitNetwork, ...AppKitNetwork[]];

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
  description: 'Fair Launchpad & Meme Coin Terminal on BOT Chain Testnet',
  url: 'https://moonbot.ai',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
};

// Initialize AppKit with BOT Chain Testnet
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  defaultNetwork: botChainTestnet,
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
