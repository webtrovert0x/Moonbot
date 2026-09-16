'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Copy, Check, Shield, Flame, Rocket, HelpCircle, Code2, Globe, Sparkles } from 'lucide-react';
import { MOONBOT_LAUNCHPAD_ADDRESS } from '@/contracts';

export function Footer() {
  const [copiedContract, setCopiedContract] = useState(false);

  const copyContract = () => {
    navigator.clipboard.writeText(MOONBOT_LAUNCHPAD_ADDRESS);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  const shorten = (addr: string) => `${addr.slice(0, 8)}...${addr.slice(-6)}`;

  return (
    <footer className="border-t border-[#24293e] bg-[#090b10] text-gray-400 mt-20">
      {/* Top Banner / Live Chain Health */}
      <div className="border-b border-[#1b2032] bg-[#0c0e16] py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>BOT Chain Mainnet Live</span>
            </div>
            <span className="text-gray-500 hidden sm:inline">•</span>
            <span className="font-mono text-[11px] text-gray-400">Chain ID: 677</span>
            <span className="text-gray-500 hidden sm:inline">•</span>
            <span className="font-mono text-[11px] text-gray-400">Block Time: ~2s</span>
          </div>

          <div className="flex items-center space-x-2 font-mono text-[11px]">
            <span className="text-gray-500">Contract:</span>
            <button
              onClick={copyContract}
              className="inline-flex items-center space-x-1 text-gray-300 hover:text-emerald-400 transition-colors bg-[#141724] px-2 py-0.5 rounded border border-[#24293e]"
              title="Copy Smart Contract Address"
            >
              <span>{shorten(MOONBOT_LAUNCHPAD_ADDRESS)}</span>
              {copiedContract ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
            </button>
            <a
              href={`https://scan.botchain.ai/address/${MOONBOT_LAUNCHPAD_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <span>BOTScan</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand & Description */}
          <div className="md:col-span-1 space-y-4">
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
                <span className="text-[10px] text-gray-400 font-mono">Fair Launch Protocol</span>
              </div>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed">
              The premier fair launchpad and bonding curve AMM native to BOT Chain Mainnet. Zero initial LP, instant bonding curves, and 100% fair distribution.
            </p>
            <div className="pt-2 flex items-center space-x-3">
              <div className="w-7 h-7 rounded-lg bg-[#141724] border border-[#24293e] flex items-center justify-center text-xs font-bold text-emerald-400">
                ⚡
              </div>
              <span className="text-[11px] font-mono text-gray-400">Powered by BOT Chain Mainnet</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono">Protocol</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-emerald-400 transition-colors flex items-center space-x-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Explore Coins</span>
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-emerald-400 transition-colors flex items-center space-x-1.5">
                  <Rocket className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Launch a Coin</span>
                </Link>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="hover:text-emerald-400 transition-colors flex items-center space-x-1.5"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Bonding Curve Guide</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Network & Infrastructure */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono">Network Specs</h4>
            <ul className="space-y-2 text-xs font-mono text-gray-400">
              <li className="flex items-center justify-between border-b border-[#1b2032] pb-1.5">
                <span className="text-gray-500">Network:</span>
                <span className="text-gray-200">BOT Chain Mainnet</span>
              </li>
              <li className="flex items-center justify-between border-b border-[#1b2032] pb-1.5">
                <span className="text-gray-500">Chain ID:</span>
                <span className="text-gray-200">677</span>
              </li>
              <li className="flex items-center justify-between border-b border-[#1b2032] pb-1.5">
                <span className="text-gray-500">Currency:</span>
                <span className="text-gray-200">BOT (18 Decimals)</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-gray-500">RPC Endpoint:</span>
                <span className="text-emerald-400 text-[11px] truncate max-w-[140px]">rpc.botchain.ai</span>
              </li>
            </ul>
          </div>

          {/* Ecosystem & Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono">Ecosystem</h4>
            <div className="space-y-2 text-xs">
              <a
                href="https://scan.botchain.ai"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2 rounded-xl bg-[#141724] border border-[#24293e] hover:border-emerald-500/40 text-gray-300 hover:text-white transition-all group"
              >
                <div className="flex items-center space-x-2">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>BOTScan Explorer</span>
                </div>
                <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-emerald-400 transition-colors" />
              </a>

              <a
                href="https://botchain.ai"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2 rounded-xl bg-[#141724] border border-[#24293e] hover:border-emerald-500/40 text-gray-300 hover:text-white transition-all group"
              >
                <div className="flex items-center space-x-2">
                  <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>BOT Chain Portal</span>
                </div>
                <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-emerald-400 transition-colors" />
              </a>
            </div>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="mt-12 pt-8 border-t border-[#1b2032] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-500">
          <p className="max-w-2xl text-center sm:text-left">
            <span className="font-semibold text-gray-400">Disclaimer:</span> MoonBot operates purely through autonomous smart contracts on BOT Chain Testnet. Meme coins are high-volatility experimental digital assets with zero guaranteed value. Trade responsibly.
          </p>
          <div className="font-mono text-center sm:text-right shrink-0">
            © {new Date().getFullYear()} MOONBOT. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
