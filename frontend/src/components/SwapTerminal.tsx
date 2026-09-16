'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { createPublicClient, http, parseEther, formatEther } from 'viem';
import { ArrowDownUp, Settings, Loader2, Sparkles, AlertCircle, ExternalLink } from 'lucide-react';
import confetti from 'canvas-confetti';
import { TokenItem, useMoonBot, safeParseEther } from '@/context/MoonBotContext';
import { MOONBOT_LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI } from '@/contracts';

interface SwapTerminalProps {
  token: TokenItem;
}

export function SwapTerminal({ token }: SwapTerminalProps) {
  const { open } = useAppKit();
  const { address: userAddress, isConnected } = useAccount();
  const { data: botBalanceData } = useBalance({ address: userAddress });
  const { buyToken, sellToken, isTrading, txStatusText, getUserTokenBalance } = useMoonBot();

  const [mode, setMode] = useState<'BUY' | 'SELL'>('BUY');
  const [amount, setAmount] = useState<string>('1.0');
  const [slippage, setSlippage] = useState<number>(1.0);
  const [showSlippageModal, setShowSlippageModal] = useState(false);
  const [userTokenBalance, setUserTokenBalance] = useState<number>(0);
  const [estimatedOut, setEstimatedOut] = useState<number>(0);
  const [estimatedFee, setEstimatedFee] = useState<number>(0);
  const [isEstimating, setIsEstimating] = useState<boolean>(false);
  const [error, setError] = useState('');
  const [successTxHash, setSuccessTxHash] = useState('');

  const publicClient = createPublicClient({
    transport: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.botchain.ai'),
  });

  // Refresh user's token balance
  const refreshUserBalance = useCallback(async () => {
    if (isConnected && userAddress && token?.address) {
      try {
        const bal = await getUserTokenBalance(token.address);
        setUserTokenBalance(bal || 0);
      } catch {
        setUserTokenBalance(0);
      }
    } else {
      setUserTokenBalance(0);
    }
  }, [isConnected, userAddress, token?.address, getUserTokenBalance]);

  useEffect(() => {
    refreshUserBalance();
    const interval = setInterval(refreshUserBalance, 4000);
    return () => clearInterval(interval);
  }, [refreshUserBalance]);

  // Compute on-chain simulation for exact numbers
  useEffect(() => {
    let active = true;
    const num = parseFloat(amount);
    if (!token?.address || isNaN(num) || num <= 0) {
      setEstimatedOut(0);
      setEstimatedFee(0);
      return;
    }

    async function estimate() {
      setIsEstimating(true);
      try {
        if (mode === 'BUY') {
          const rawBot = safeParseEther(amount);
          if (rawBot === 0n) {
            if (active) {
              setEstimatedOut(0);
              setEstimatedFee(0);
            }
            return;
          }
          const [tokensOutRaw, feeRaw] = (await publicClient.readContract({
            address: MOONBOT_LAUNCHPAD_ADDRESS,
            abi: LAUNCHPAD_ABI,
            functionName: 'calculateOutput',
            args: [token.address as `0x${string}`, rawBot],
          })) as [bigint, bigint];

          if (active) {
            setEstimatedOut(Number(formatEther(tokensOutRaw)) || 0);
            setEstimatedFee(Number(formatEther(feeRaw)) || 0);
          }
        } else {
          const rawTokens = safeParseEther(amount);
          if (rawTokens === 0n) {
            if (active) {
              setEstimatedOut(0);
              setEstimatedFee(0);
            }
            return;
          }
          const [botOutRaw, feeRaw] = (await publicClient.readContract({
            address: MOONBOT_LAUNCHPAD_ADDRESS,
            abi: LAUNCHPAD_ABI,
            functionName: 'calculateRefund',
            args: [token.address as `0x${string}`, rawTokens],
          })) as [bigint, bigint];

          if (active) {
            setEstimatedOut(Number(formatEther(botOutRaw)) || 0);
            setEstimatedFee(Number(formatEther(feeRaw)) || 0);
          }
        }
      } catch (e) {
        // Fallback to local approximation if contract call fails
        if (active) {
          const tokenPrice = token.priceBot || 0.000000028;
          if (mode === 'BUY') {
            setEstimatedOut((num / tokenPrice) * 0.99 || 0);
          } else {
            setEstimatedOut(num * tokenPrice * 0.99 || 0);
          }
        }
      } finally {
        if (active) setIsEstimating(false);
      }
    }

    estimate();
    return () => {
      active = false;
    };
  }, [amount, mode, token?.address, token?.priceBot]);

  const numAmount = parseFloat(amount) || 0;

  const handleExecute = async () => {
    setError('');
    setSuccessTxHash('');

    if (!isConnected) {
      open();
      return;
    }

    if (numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (mode === 'SELL' && numAmount > (userTokenBalance || 0)) {
      setError(`Insufficient token balance. You hold ${(userTokenBalance || 0).toLocaleString()} $${token?.symbol || 'TOKEN'}`);
      return;
    }

    try {
      if (mode === 'BUY') {
        const txHash = await buyToken(token.address, numAmount, slippage);
        setSuccessTxHash(txHash);
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
        });
        await refreshUserBalance();
      } else {
        const txHash = await sellToken(token.address, numAmount, slippage);
        setSuccessTxHash(txHash);
        await refreshUserBalance();
      }
    } catch (err: any) {
      setError(err?.message || 'Transaction failed. Please try again.');
    }
  };

  return (
    <div className="w-full rounded-2xl bg-[#141724] border border-[#24293e] p-5 space-y-4 shadow-lg">
      {/* Mode Switcher & Slippage */}
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-2 bg-[#0f111a] p-1 rounded-xl border border-[#24293e] w-48">
          <button
            onClick={() => {
              setMode('BUY');
              setAmount('1.0');
              setError('');
              setSuccessTxHash('');
            }}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'BUY'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            BUY
          </button>
          <button
            onClick={() => {
              setMode('SELL');
              setAmount(userTokenBalance > 0 ? (userTokenBalance * 0.5).toFixed(0) : '0');
              setError('');
              setSuccessTxHash('');
            }}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'SELL'
                ? 'bg-red-500 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            SELL
          </button>
        </div>

        <button
          onClick={() => setShowSlippageModal(!showSlippageModal)}
          className="flex items-center space-x-1.5 text-xs text-gray-400 hover:text-gray-200 bg-[#0f111a] px-2.5 py-1.5 rounded-lg border border-[#24293e]"
        >
          <Settings className="w-3.5 h-3.5" />
          <span className="font-mono">{slippage}% slippage</span>
        </button>
      </div>

      {/* Slippage Dropdown */}
      {showSlippageModal && (
        <div className="p-3 rounded-xl bg-[#0f111a] border border-[#24293e] space-y-2">
          <span className="text-xs text-gray-300 font-semibold block">Set Slippage Tolerance</span>
          <div className="flex items-center space-x-2">
            {[0.5, 1.0, 3.0, 5.0].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSlippage(s);
                  setShowSlippageModal(false);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                  slippage === s
                    ? 'bg-emerald-500 text-black'
                    : 'bg-[#141724] text-gray-300 hover:bg-[#1e2438]'
                }`}
              >
                {s}%
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pay Input Box */}
      <div className="p-3.5 rounded-xl bg-[#0f111a] border border-[#24293e] space-y-1.5">
        <div className="flex justify-between text-xs text-gray-400 font-mono">
          <span>You Pay</span>
          <span>
            {mode === 'BUY'
              ? `Balance: ${botBalanceData?.value !== undefined ? Number(formatEther(botBalanceData.value)).toFixed(3) : '0.00'} BOT`
              : `Balance: ${(userTokenBalance || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${token?.symbol || 'TOKEN'}`}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <input
            type="number"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="w-full bg-transparent font-mono text-xl font-bold text-white focus:outline-none"
          />
          <span className="font-mono font-bold text-sm text-emerald-400 shrink-0 ml-2">
            {mode === 'BUY' ? 'BOT' : token?.symbol || 'TOKEN'}
          </span>
        </div>
      </div>

      {/* Quick Chips */}
      <div className="flex items-center space-x-2">
        {mode === 'BUY'
          ? ['0.5', '1.0', '5.0', '10.0', '25.0'].map((chip) => (
              <button
                key={chip}
                onClick={() => setAmount(chip)}
                className={`flex-1 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
                  amount === chip
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-[#0f111a] text-gray-400 hover:text-white border border-[#24293e]'
                }`}
              >
                {chip}
              </button>
            ))
          : ['25%', '50%', '75%', '100%'].map((chip) => (
              <button
                key={chip}
                onClick={() => {
                  const mult = parseInt(chip) / 100;
                  const val = Math.floor((userTokenBalance || 0) * mult);
                  setAmount(val.toString());
                }}
                className="flex-1 py-1 rounded-lg text-xs font-mono font-semibold bg-[#0f111a] text-gray-400 hover:text-white border border-[#24293e] transition-colors"
              >
                {chip}
              </button>
            ))}
      </div>

      {/* Receive Estimate Box */}
      <div className="p-3.5 rounded-xl bg-[#0f111a] border border-[#24293e] space-y-1.5">
        <div className="flex justify-between text-xs text-gray-400 font-mono">
          <span>You Receive (On-chain simulated)</span>
          <span>Fee: 1.0% (0.5% Protocol + 0.5% Creator)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-xl font-bold text-gray-200">
            {isEstimating ? (
              <span className="text-sm text-gray-500 animate-pulse">Calculating on-chain...</span>
            ) : mode === 'BUY' ? (
              Math.floor(estimatedOut || 0).toLocaleString()
            ) : (
              (estimatedOut || 0).toFixed(6)
            )}
          </span>
          <span className="font-mono font-bold text-sm text-gray-400 shrink-0 ml-2">
            {mode === 'BUY' ? token?.symbol || 'TOKEN' : 'BOT'}
          </span>
        </div>
      </div>

      {/* Real-time Transaction Status Text */}
      {isTrading && txStatusText && (
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs flex items-center space-x-2 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{txStatusText}</span>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successTxHash && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs space-y-1">
          <div className="flex items-center space-x-1.5 font-bold">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Transaction confirmed on BOT Chain!</span>
          </div>
          <a
            href={`https://scan.botchain.ai/tx/${successTxHash}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1 text-emerald-300 underline font-mono text-[11px] hover:text-white"
          >
            <span>View on BOTScan ({successTxHash.slice(0, 10)}...)</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleExecute}
        disabled={isTrading || token.graduated}
        className={`w-full py-3.5 rounded-xl font-extrabold text-sm shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 ${
          token.graduated
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : !isConnected
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90'
            : mode === 'BUY'
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-emerald-500/20'
            : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-500/20'
        }`}
      >
        {isTrading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing order on-chain...</span>
          </>
        ) : token.graduated ? (
          <span>Graduated — Trade on DEX</span>
        ) : !isConnected ? (
          <span>Connect Wallet to Trade</span>
        ) : (
          <span>
            {mode === 'BUY' ? `Buy $${token.symbol}` : `Sell $${token.symbol}`}
          </span>
        )}
      </button>
    </div>
  );
}
