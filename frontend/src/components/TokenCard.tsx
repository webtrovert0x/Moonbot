'use client';

import React from 'react';
import Link from 'next/link';
import { MessageSquare, ShieldCheck, TrendingUp, Sparkles } from 'lucide-react';
import { TokenItem } from '@/context/MoonBotContext';

interface TokenCardProps {
  token: TokenItem;
}

export function TokenCard({ token }: TokenCardProps) {
  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <Link
      href={`/token/${token.address}`}
      className="group block rounded-2xl bg-[#141724] hover:bg-[#191d2e] border border-[#24293e] hover:border-emerald-500/50 p-4 transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-emerald-500/10 transform hover:-translate-y-1"
    >
      <div className="flex items-start space-x-3.5">
        {/* Token Avatar */}
        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[#2e354f] group-hover:border-emerald-400 transition-colors">
          <img
            src={token.imageUri}
            alt={token.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Token Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 truncate">
              <h3 className="font-bold text-white text-sm truncate group-hover:text-emerald-400 transition-colors">
                {token.name}
              </h3>
              <span className="text-xs font-mono font-bold text-gray-400 shrink-0">
                ${token.symbol}
              </span>
            </div>
            {token.graduated ? (
              <span className="shrink-0 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                DEX
              </span>
            ) : (
              <span className="shrink-0 text-[10px] font-mono text-gray-400">
                {timeAgo(token.createdAt)}
              </span>
            )}
          </div>

          <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-snug">
            {token.description}
          </p>

          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#202538] text-xs">
            <span className="font-mono text-gray-300 font-semibold">
              Market Cap: <span className="text-emerald-400 font-bold">{(Number(token?.marketCapBot || 0) < 1000 ? Number(token?.marketCapBot || 0) : (Number(token?.priceBot) || 0.000000028) * 1000000000).toFixed(2)} BOT</span>
            </span>
            <div className="flex items-center space-x-1 text-gray-400 font-mono text-[11px]">
              <MessageSquare className="w-3 h-3" />
              <span>{token.replyCount || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bonding Curve Progress Bar */}
      <div className="mt-3 space-y-1">
        <div className="flex justify-between text-[11px] font-mono">
          <span className="text-gray-400">Bonding Curve</span>
          <span className="font-bold text-emerald-400">
            {(Number(token?.progressPercent) || 0).toFixed(1)}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-[#0a0c12] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(Number(token?.progressPercent) || 0, 100)}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
