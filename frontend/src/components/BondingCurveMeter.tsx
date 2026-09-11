'use client';

import React from 'react';
import { Target, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { TokenItem } from '@/context/MoonBotContext';

interface BondingCurveMeterProps {
  token: TokenItem;
}

export function BondingCurveMeter({ token }: BondingCurveMeterProps) {
  const percent = Math.min(token.progressPercent || 0, 100);
  const remainingTokens = Math.max(0, (token.tokensForSale || 800000000) - (token.tokensSold || 0));
  const botInCurve = token.realBotReserve || 0;
  const targetBot = 85.0;

  return (
    <div className="w-full rounded-2xl bg-[#141724] border border-[#24293e] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-white text-base">Bonding Curve Progress</h3>
        </div>
        <span className="font-mono font-black text-lg text-emerald-400">
          {percent.toFixed(1)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="w-full h-3.5 bg-[#0f111a] rounded-full p-[2px] border border-[#24293e]">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-700 shadow-md shadow-emerald-500/20"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Stats Breakdown */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="p-3 rounded-xl bg-[#0f111a] border border-[#202538]">
          <span className="text-[11px] text-gray-400 font-mono block">BOT in Reserve</span>
          <span className="text-sm font-bold font-mono text-white mt-0.5 block">
            {botInCurve.toFixed(2)} / {targetBot.toFixed(0)} BOT
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#0f111a] border border-[#202538]">
          <span className="text-[11px] text-gray-400 font-mono block">Tokens Remaining</span>
          <span className="text-sm font-bold font-mono text-white mt-0.5 block">
            {(remainingTokens / 1000000).toFixed(1)}M / 800M
          </span>
        </div>
      </div>

      {/* Graduation Notice */}
      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-gray-300 flex items-start space-x-2.5">
        <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          When bonding curve reaches <strong className="text-emerald-400 font-mono">100%</strong>, all collected BOT liquidity + <strong className="text-white font-mono">200,000,000 ${token.symbol}</strong> will be deposited to DEX and LP tokens will be permanently burned! 🔥
        </p>
      </div>
    </div>
  );
}
