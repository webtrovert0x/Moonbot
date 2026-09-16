'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { ArrowLeft, ExternalLink, Copy, Check, Send, Globe, ShieldCheck, Users, Flame, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { InteractiveChart } from '@/components/InteractiveChart';
import { BondingCurveMeter } from '@/components/BondingCurveMeter';
import { SwapTerminal } from '@/components/SwapTerminal';
import { TradeHistory } from '@/components/TradeHistory';
import { CommentsThread } from '@/components/CommentsThread';
import { LaunchModal } from '@/components/LaunchModal';
import { Footer } from '@/components/Footer';
import { useMoonBot } from '@/context/MoonBotContext';

export default function TokenDetailPage() {
  const params = useParams();
  const router = useRouter();
  const addressParam = (params?.address as string) || '';

  const { getToken, getTokenTrades, fetchSingleToken, comments, isLoadingTokens } = useMoonBot();
  const { chain } = useAccount();
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFetchingDirect, setIsFetchingDirect] = useState(true);

  const token = getToken(addressParam);
  const tokenTrades = getTokenTrades(addressParam);
  const tokenComments = comments[addressParam.toLowerCase()] || comments[addressParam] || [];

  // Fetch token on-chain if not already in memory/cache
  useEffect(() => {
    let active = true;
    if (addressParam) {
      fetchSingleToken(addressParam).finally(() => {
        if (active) setIsFetchingDirect(false);
      });
    }
    return () => {
      active = false;
    };
  }, [addressParam, fetchSingleToken]);

  const copyAddress = () => {
    if (!token?.address) return;
    navigator.clipboard.writeText(token.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shorten = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // Show loading skeleton while querying on-chain
  if (!token && (isLoadingTokens || isFetchingDirect)) {
    return (
      <div className="min-h-screen flex flex-col bg-[#08090d] text-white">
        <Navbar onOpenLaunchModal={() => setIsLaunchModalOpen(true)} />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <h2 className="text-base font-bold text-white">Loading token from BOT Chain...</h2>
          <p className="text-xs text-gray-400 font-mono">{addressParam}</p>
        </div>
      </div>
    );
  }

  // If on-chain search finishes and token genuinely does not exist
  if (!token) {
    return (
      <div className="min-h-screen flex flex-col bg-[#08090d] text-white">
        <Navbar onOpenLaunchModal={() => setIsLaunchModalOpen(true)} />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <span className="text-4xl">🌕</span>
          <h2 className="text-xl font-bold text-white">Token Not Found</h2>
          <p className="text-xs text-gray-400">The token at address {addressParam} is not registered on this contract.</p>
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400"
          >
            Back to Launchpad
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#08090d] text-white">
      <Navbar onOpenLaunchModal={() => setIsLaunchModalOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Back Link & Quick Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-xs font-semibold text-gray-400 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tokens</span>
          </Link>
          <div className="flex items-center space-x-2 text-xs font-mono text-gray-400">
            <span>Network:</span>
            <span className="text-emerald-400 font-bold">
              {chain?.name ? `${chain.name} (${chain.id})` : 'BOT Chain Mainnet (677)'}
            </span>
          </div>
        </div>

        {/* Token Header Card */}
        <div className="p-5 rounded-2xl bg-[#141724] border border-[#24293e] shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Avatar & Info */}
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#2e354f] shrink-0">
              <img src={token.imageUri} alt={token.name} className="w-full h-full object-cover" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <h1 className="text-xl md:text-2xl font-black text-white">{token.name}</h1>
                <span className="text-sm font-mono font-bold text-emerald-400">${token.symbol}</span>
                {token.graduated && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Graduated</span>
                  </span>
                )}
              </div>

              {/* Creator & Contract links */}
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-400 font-mono">
                <div className="flex items-center space-x-1">
                  <span>Created by:</span>
                  <span className="text-gray-200">{shorten(token.creator)}</span>
                </div>

                <span>•</span>

                <div className="flex items-center space-x-1">
                  <span>CA:</span>
                  <span className="text-gray-200">{shorten(token.address)}</span>
                  <button
                    onClick={copyAddress}
                    className="p-1 hover:text-white rounded hover:bg-[#1b2032] transition-colors"
                    title="Copy Contract Address"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                  <a
                    href={`https://scan.bohr.life/address/${token.address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 hover:text-emerald-400 transition-colors"
                    title="View on BohrScan"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Social Links & Metrics */}
          <div className="flex flex-wrap items-center gap-3">
            {token.twitter && (
              <a
                href={token.twitter}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-[#0f111a] border border-[#24293e] hover:border-emerald-500/40 text-gray-300 hover:text-emerald-400 transition-colors flex items-center justify-center"
                title="Twitter / X"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            )}
            {token.telegram && (
              <a
                href={token.telegram}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-[#0f111a] border border-[#24293e] hover:border-emerald-500/40 text-gray-300 hover:text-emerald-400 transition-colors"
                title="Telegram"
              >
                <Send className="w-4 h-4" />
              </a>
            )}
            {token.website && (
              <a
                href={token.website}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-[#0f111a] border border-[#24293e] hover:border-emerald-500/40 text-gray-300 hover:text-emerald-400 transition-colors"
                title="Website"
              >
                <Globe className="w-4 h-4" />
              </a>
            )}

            <div className="px-3.5 py-2 rounded-xl bg-[#0f111a] border border-[#24293e] font-mono text-xs">
              <span className="text-gray-400 block text-[10px]">Market Cap</span>
              <span className="font-bold text-white text-sm">
                {(Number(token?.marketCapBot || 0) < 1000 ? Number(token?.marketCapBot || 0) : (Number(token?.priceBot) || 0.000000028) * 1000000000).toFixed(2)} BOT
              </span>
            </div>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (Chart + Comments) */}
          <div className="lg:col-span-7 space-y-6">
            <InteractiveChart token={token} />

            {/* Token Description */}
            <div className="p-4 rounded-2xl bg-[#141724] border border-[#24293e] space-y-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">About {token.name}</h3>
              <p className="text-xs md:text-sm text-gray-200 leading-relaxed">{token.description}</p>
            </div>

            <CommentsThread tokenAddress={token.address} comments={tokenComments} />
          </div>

          {/* Right Column (Bonding Curve + Swap + Trades + Holders) */}
          <div className="lg:col-span-5 space-y-6">
            <BondingCurveMeter token={token} />
            <SwapTerminal token={token} />
            <TradeHistory trades={tokenTrades} symbol={token.symbol} />
          </div>
        </div>
      </main>

      <Footer />

      <LaunchModal isOpen={isLaunchModalOpen} onClose={() => setIsLaunchModalOpen(false)} />
    </div>
  );
}
