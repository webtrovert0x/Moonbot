'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAccount, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { Rocket, Sparkles, HelpCircle, Shield, ChevronDown, Wallet, ExternalLink } from 'lucide-react';

interface NavbarProps {
  onOpenLaunchModal: () => void;
}

export function Navbar({ onOpenLaunchModal }: NavbarProps) {
  const { open } = useAppKit();
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#24293e] bg-[#08090d]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-cyan-500 to-amber-400 p-[1.5px] shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all duration-300 overflow-hidden">
                <img
                  src="/logo.png"
                  alt="MoonBot Logo"
                  className="w-full h-full object-cover rounded-[9px] group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                    MOON<span className="text-[#00f0a8]">BOT</span>
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    MAINNET
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">Fair Launchpad</span>
              </div>
            </Link>

            {/* Network indicator */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-[#141724] border border-[#24293e] text-xs text-gray-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-mono text-gray-200">BOT Chain Mainnet (677)</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowHowItWorks(true)}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-300 hover:text-white bg-[#141724] hover:bg-[#1b2032] border border-[#24293e] transition-all"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>How it works</span>
            </button>

            {/* Launch Coin CTA */}
            <button
              onClick={onOpenLaunchModal}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <Rocket className="w-4 h-4" />
              <span>Launch a Coin</span>
            </button>

            {/* Reown AppKit Connect Button */}
            {isConnected && address ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => open()}
                  className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-[#141724] hover:bg-[#1b2032] border border-emerald-500/40 text-emerald-400 hover:text-emerald-300 transition-all shadow-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>{shortenAddress(address)}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => open()}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#141724] hover:bg-[#1b2032] border border-[#3b82f6]/40 hover:border-[#3b82f6] text-white transition-all shadow-md"
              >
                <Wallet className="w-4 h-4 text-blue-400" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* How It Works Modal */}
      {showHowItWorks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0f111a] border border-[#24293e] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 border-b border-[#24293e] pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">How MoonBot Works</h3>
              </div>
              <button
                onClick={() => setShowHowItWorks(false)}
                className="text-gray-400 hover:text-white text-lg font-bold px-2 py-1 rounded-lg hover:bg-[#1b2032]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
              <div className="flex items-start space-x-3 p-3 rounded-xl bg-[#141724] border border-[#24293e]">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-white">Zero Upfront Liquidity Fair Launch</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Anyone can deploy a meme coin instantly. No presale, no team tokens, no rug pulls.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-xl bg-[#141724] border border-[#24293e]">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-white">Constant-Product Bonding Curve</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Buy and sell tokens directly along the curve with BOT currency. Price rises smoothly as more users buy.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-xl bg-[#141724] border border-[#24293e]">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-white">Auto-Graduation to DEX at 100%</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    When the bonding curve hits 100%, collected BOT and the reserved 200M tokens are seeded to a DEX liquidity pool and LP is permanently burned!
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowHowItWorks(false)}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-black transition-colors"
              >
                Got it, Let's Moon!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
