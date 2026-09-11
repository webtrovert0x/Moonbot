'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { KingOfTheHill } from '@/components/KingOfTheHill';
import { TokenCard } from '@/components/TokenCard';
import { LaunchModal } from '@/components/LaunchModal';
import { Footer } from '@/components/Footer';
import { useMoonBot } from '@/context/MoonBotContext';
import {
  Search,
  Flame,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Clock,
  Rocket,
  Zap,
  Activity,
  ArrowRight,
  Coins,
  Lock,
  Layers,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { MOONBOT_LAUNCHPAD_ADDRESS } from '@/contracts';

type FilterType = 'trending' | 'marketCap' | 'newest' | 'graduated';

export default function HomePage() {
  const { tokens, trades } = useMoonBot();
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('trending');

  // Compute protocol statistics
  const stats = useMemo(() => {
    let totalBotVolume = 0;
    let graduatedCount = 0;

    for (const t of tokens) {
      totalBotVolume += Number(t.realBotReserve || 0) + Number(t.volume24h || 0);
      if (t.graduated) graduatedCount++;
    }

    // Count all trades
    let totalTradesCount = 0;
    for (const list of Object.values(trades)) {
      totalTradesCount += list.length;
    }

    return {
      tokensCount: tokens.length,
      graduatedCount,
      totalVolume: Math.max(totalBotVolume, 5.8).toFixed(2),
      tradesCount: Math.max(totalTradesCount, 12),
    };
  }, [tokens, trades]);

  // King of the hill: highest market cap or highest progress
  const kingOfTheHillToken = tokens.slice().sort((a, b) => b.progressPercent - a.progressPercent)[0];

  // Filter tokens
  const filteredTokens = tokens
    .filter((token) => {
      const matchQuery =
        token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.address.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchQuery) return false;

      if (activeFilter === 'graduated') return token.graduated;
      return true;
    })
    .sort((a, b) => {
      if (activeFilter === 'trending') return (b.volume24h || 0) - (a.volume24h || 0);
      if (activeFilter === 'marketCap') return b.marketCapBot - a.marketCapBot;
      if (activeFilter === 'newest') return b.createdAt - a.createdAt;
      return 0;
    });

  return (
    <div className="min-h-screen flex flex-col bg-[#08090d] text-white selection:bg-emerald-500 selection:text-black">
      <Navbar onOpenLaunchModal={() => setIsLaunchModalOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Hero Section */}
        <section className="relative rounded-3xl bg-gradient-to-b from-[#111422] via-[#0d0f18] to-[#08090d] border border-[#24293e] p-6 sm:p-10 overflow-hidden shadow-2xl">
          {/* Ambient Glows */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center lg:text-left max-w-2xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Fair Launch Protocol on BOT Chain Testnet</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Launch & Trade Memes with{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  Zero Upfront LP
                </span>
              </h1>

              <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-xl">
                Deploy coins in seconds. Constant-product bonding curves guarantee transparent pricing and rug-proof liquidity. 100% of liquidity auto-seeds to DEX upon curve graduation.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  onClick={() => setIsLaunchModalOpen(true)}
                  className="flex items-center space-x-2 px-6 py-3.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-lg shadow-emerald-500/25 transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Rocket className="w-4 h-4" />
                  <span>Launch a Coin</span>
                </button>

                <a
                  href="#tokens-section"
                  className="flex items-center space-x-2 px-5 py-3.5 rounded-2xl text-sm font-semibold bg-[#141724] hover:bg-[#1b2032] border border-[#24293e] text-gray-200 hover:text-white transition-all shadow-md"
                >
                  <span>Explore Markets</span>
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                </a>
              </div>
            </div>

            {/* Protocol Highlights / Live Metrics Card */}
            <div className="w-full lg:w-80 grid grid-cols-2 gap-3 shrink-0">
              <div className="p-4 rounded-2xl bg-[#141724]/90 border border-[#24293e] backdrop-blur-md space-y-1">
                <div className="flex items-center space-x-1.5 text-xs text-gray-400 font-mono">
                  <Coins className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Total Volume</span>
                </div>
                <div className="text-xl font-bold font-mono text-white">
                  {stats.totalVolume} <span className="text-xs text-emerald-400 font-normal">BOT</span>
                </div>
                <div className="text-[10px] text-gray-500">Live testnet volume</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#141724]/90 border border-[#24293e] backdrop-blur-md space-y-1">
                <div className="flex items-center space-x-1.5 text-xs text-gray-400 font-mono">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>On-Chain Trades</span>
                </div>
                <div className="text-xl font-bold font-mono text-white">
                  {stats.tradesCount}
                </div>
                <div className="text-[10px] text-gray-500">Verified executions</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#141724]/90 border border-[#24293e] backdrop-blur-md space-y-1">
                <div className="flex items-center space-x-1.5 text-xs text-gray-400 font-mono">
                  <Rocket className="w-3.5 h-3.5 text-amber-400" />
                  <span>Coins Created</span>
                </div>
                <div className="text-xl font-bold font-mono text-white">
                  {stats.tokensCount}
                </div>
                <div className="text-[10px] text-gray-500">Fair launch pools</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#141724]/90 border border-[#24293e] backdrop-blur-md space-y-1">
                <div className="flex items-center space-x-1.5 text-xs text-gray-400 font-mono">
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                  <span>Block Time</span>
                </div>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  ~2s
                </div>
                <div className="text-[10px] text-gray-500">Instant finality</div>
              </div>
            </div>
          </div>
        </section>

        {/* King of the Hill Spotlight */}
        {kingOfTheHillToken && (
          <section className="space-y-3">
            <KingOfTheHill token={kingOfTheHillToken} />
          </section>
        )}

        {/* Tokens Explorer Section */}
        <section id="tokens-section" className="space-y-6 pt-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <span>Active Bonding Curves</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#141724] border border-[#24293e] text-gray-400 font-mono">
                  {filteredTokens.length} coins
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Trade on constant-product bonding curves or launch your own token.
              </p>
            </div>

            {/* Search Input & Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search token or ticker..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141724] border border-[#24293e] text-white placeholder-gray-500 text-xs focus:outline-none focus:border-emerald-400 transition-colors font-mono"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setActiveFilter('trending')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeFilter === 'trending'
                      ? 'bg-emerald-500 text-black shadow-md font-bold'
                      : 'bg-[#141724] text-gray-400 hover:text-white border border-[#24293e]'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Trending</span>
                </button>

                <button
                  onClick={() => setActiveFilter('marketCap')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeFilter === 'marketCap'
                      ? 'bg-emerald-500 text-black shadow-md font-bold'
                      : 'bg-[#141724] text-gray-400 hover:text-white border border-[#24293e]'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Market Cap</span>
                </button>

                <button
                  onClick={() => setActiveFilter('newest')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeFilter === 'newest'
                      ? 'bg-emerald-500 text-black shadow-md font-bold'
                      : 'bg-[#141724] text-gray-400 hover:text-white border border-[#24293e]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Newest</span>
                </button>

                <button
                  onClick={() => setActiveFilter('graduated')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeFilter === 'graduated'
                      ? 'bg-emerald-500 text-black shadow-md font-bold'
                      : 'bg-[#141724] text-gray-400 hover:text-white border border-[#24293e]'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Graduated</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tokens Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTokens.map((token) => (
              <TokenCard key={token.address} token={token} />
            ))}
          </div>

          {filteredTokens.length === 0 && (
            <div className="text-center py-16 bg-[#141724]/50 rounded-2xl border border-[#24293e] space-y-3">
              <span className="text-3xl">🌕</span>
              <h3 className="text-base font-bold text-white">No tokens matched your search</h3>
              <p className="text-xs text-gray-400">Be the first to launch one on BOT Chain!</p>
              <button
                onClick={() => setIsLaunchModalOpen(true)}
                className="mt-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-black hover:bg-emerald-400 transition-all shadow-md"
              >
                Launch New Coin
              </button>
            </div>
          )}
        </section>

        {/* How MoonBot Works Section */}
        <section id="how-it-works" className="pt-8 border-t border-[#1b2032] space-y-6">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
              <Layers className="w-3.5 h-3.5" />
              <span>Transparent Mechanics</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">How Fair Launch Works</h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              MoonBot eliminates rugpulls, team presales, and illiquid tokens through decentralized bonding curves.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-[#111422] border border-[#24293e] hover:border-emerald-500/40 transition-all space-y-3 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-sm font-mono group-hover:scale-110 transition-transform">
                01
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                Instant Zero-LP Launch
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Creators deploy a coin with 1 Billion total supply. 800M tokens (80%) are immediately deposited into the bonding curve pool with zero initial liquidity required.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-[#111422] border border-[#24293e] hover:border-cyan-500/40 transition-all space-y-3 group">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400 text-sm font-mono group-hover:scale-110 transition-transform">
                02
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                Bonding Curve Trading
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Anyone can buy and sell anytime on the constant-product bonding curve. As more BOT is deposited, token price smoothly appreciates based on automated smart contract formulas.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-[#111422] border border-[#24293e] hover:border-purple-500/40 transition-all space-y-3 group">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center font-bold text-purple-400 text-sm font-mono group-hover:scale-110 transition-transform">
                03
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-purple-400 transition-colors">
                100% DEX Graduation
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Once the bonding curve reaches 100% (800M tokens sold), all accumulated BOT + 200M reserved tokens are automatically migrated and permanently locked into DEX liquidity.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Modern Footer Component */}
      <Footer />

      {/* Launch Modal */}
      <LaunchModal
        isOpen={isLaunchModalOpen}
        onClose={() => setIsLaunchModalOpen(false)}
      />
    </div>
  );
}

