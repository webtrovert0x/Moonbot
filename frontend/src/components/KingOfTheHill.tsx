'use client';

import React from 'react';
import Link from 'next/link';
import { Crown, Flame, ArrowUpRight, ShieldCheck, MessageSquare } from 'lucide-react';
import { TokenItem } from '@/context/MoonBotContext';

interface KingOfTheHillProps {
  token: TokenItem;
}

export function KingOfTheHill({ token }: KingOfTheHillProps) {
  if (!token) return null;

  return (
    <div className="w-full relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#141724] via-[#1a1e30] to-[#141724] border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/10 p-5 md:p-6 transition-all hover:border-emerald-400">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left: Crown badge & Avatar & Info */}
        <div className="flex items-center space-x-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2 border-emerald-400/80 shadow-md">
              <img
                src={token.imageUri}
                alt={token.name}
                className="w-full h-full object-cover"
              />
            </div>
            {/* King of the hill crown badge */}
            <div className="absolute -top-3 -left-3 bg-amber-400 text-black p-1.5 rounded-full shadow-lg flex items-center justify-center font-black">
              <Crown className="w-4 h-4 fill-black" />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="flex items-center space-x-1 text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/10 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                <Flame className="w-3 h-3 text-amber-400 fill-amber-400 animate-pulse" />
                <span>King of the Hill</span>
              </span>
              {token.graduated && (
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Graduated to DEX</span>
                </span>
              )}
            </div>

            <div className="flex items-baseline space-x-2 mt-1.5">
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                {token.name}
              </h2>
              <span className="text-sm md:text-base font-bold text-emerald-400 font-mono">
                ${token.symbol}
              </span>
            </div>

            <p className="text-xs md:text-sm text-gray-300 line-clamp-2 max-w-xl mt-1">
              {token.description}
            </p>
          </div>
        </div>

        {/* Right: Bonding curve meter + Market cap + CTA */}
        <div className="w-full md:w-80 flex flex-col space-y-3 shrink-0 bg-[#0f111a]/80 p-4 rounded-xl border border-[#24293e]">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-gray-400">Market Cap</span>
            <span className="font-bold text-white text-sm">
              {(Number(token?.marketCapBot || 0) < 1000 ? Number(token?.marketCapBot || 0) : (Number(token?.priceBot) || 0.000000028) * 1000000000).toFixed(2)} BOT
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-emerald-400 font-semibold">Bonding Curve Progress</span>
              <span className="font-mono font-bold text-white">
                {(Number(token?.progressPercent) || 0).toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#1b2032] rounded-full overflow-hidden p-[1px]">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${Math.min(Number(token?.progressPercent) || 0, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-1 text-xs text-gray-400">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{token.replyCount || 0} replies</span>
            </div>

            <Link
              href={`/token/${token.address}`}
              className="flex items-center space-x-1 px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black transition-all shadow-md transform hover:scale-105"
            >
              <span>Trade Now</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
