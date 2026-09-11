import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Web3Provider } from '@/context/Web3Provider';
import { MoonBotProvider } from '@/context/MoonBotContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'MoonBot — Fair Launchpad on BOT Chain',
  description:
    'Instant meme coin deployment and constant-product bonding curve trading on BOT Chain with zero upfront liquidity.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-[#08090d] text-slate-100 min-h-screen flex flex-col font-sans`}>
        <Web3Provider>
          <MoonBotProvider>
            {children}
          </MoonBotProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
