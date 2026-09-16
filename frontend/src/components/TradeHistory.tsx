'use client';

import React from 'react';
import { ExternalLink, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Trade } from '@/context/MoonBotContext';

interface TradeHistoryProps {
  trades: Trade[];
  symbol: string;
}

export function TradeHistory({ trades = [], symbol }: TradeHistoryProps) {
  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${Math.max(1, seconds)}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="w-full rounded-2xl bg-[#141724] border border-[#24293e] p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-[#24293e] pb-3">
        <div className="flex items-center space-x-2">
          <h3 className="font-bold text-white text-sm">On-Chain Trade Feed</h3>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>
        <span className="text-xs text-gray-400 font-mono">{trades.length} confirmed trades</span>
      </div>

      {/* Scrollable table container with dedicated scrollbar & sticky header */}
      <div className="max-h-[440px] overflow-y-auto overflow-x-auto pb-1 -mx-2 px-2 scrollbar-thin">
        <table className="w-full text-left text-xs min-w-[620px]">
          <thead className="sticky top-0 bg-[#141724] z-10 shadow-sm">
            <tr className="text-gray-400 border-b border-[#202538] font-mono text-[11px]">
              <th className="px-3 py-2.5 font-semibold w-24 whitespace-nowrap bg-[#141724]">Type</th>
              <th className="px-3 py-2.5 font-semibold whitespace-nowrap bg-[#141724]">BOT Amount</th>
              <th className="px-3 py-2.5 font-semibold whitespace-nowrap bg-[#141724]">{symbol} Amount</th>
              <th className="px-3 py-2.5 font-semibold whitespace-nowrap bg-[#141724]">Account</th>
              <th className="px-3 py-2.5 font-semibold text-right whitespace-nowrap bg-[#141724]">Time & Tx</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1b2032] font-mono">
            {trades.map((t) => (
              <tr key={t.id} className="hover:bg-[#1a1e30] transition-colors">
                <td className="px-3 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md font-bold text-[11px] ${
                      t.type === 'BUY'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                        : 'bg-red-500/10 text-red-400 border border-red-500/25'
                    }`}
                  >
                    {t.type === 'BUY' ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    <span>{t.type}</span>
                  </span>
                </td>
                <td className="px-3 py-3 font-bold text-white tracking-wide whitespace-nowrap">
                  {(Number(t.botAmount) || 0).toFixed(4)} <span className="text-gray-400 text-[10px] font-normal">BOT</span>
                </td>
                <td className="px-3 py-3 text-gray-200 whitespace-nowrap">
                  {t.tokenAmount ? Number(t.tokenAmount).toLocaleString() : '-'}
                </td>
                <td className="px-3 py-3 text-gray-400 whitespace-nowrap">
                  <a
                    href={
                      t.userAddress
                        ? `https://scan.botchain.ai/address/${t.userAddress}`
                        : t.user.startsWith('0x') && t.user.length === 42
                        ? `https://scan.botchain.ai/address/${t.user}`
                        : `https://scan.botchain.ai/tx/${t.txHash}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    {t.user}
                  </a>
                </td>
                <td className="px-3 py-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end space-x-2 text-gray-400">
                    <span className="text-[11px]">{timeAgo(t.timestamp)}</span>
                    {t.txHash && (
                      <a
                        href={`https://scan.botchain.ai/tx/${t.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-500 hover:text-emerald-400 transition-colors inline-flex items-center p-0.5 rounded hover:bg-[#202538]"
                        title="View transaction on BOTScan"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {trades.length === 0 && (
          <div className="text-center py-8 text-xs text-gray-500 font-mono">
            No trades executed on-chain yet. Be the first to buy!
          </div>
        )}
      </div>
    </div>
  );
}
