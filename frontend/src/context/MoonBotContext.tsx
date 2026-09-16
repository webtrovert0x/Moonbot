'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { parseEther, formatEther, createPublicClient, http, decodeEventLog } from 'viem';
import { MOONBOT_LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, ERC20_ABI } from '@/contracts';

export interface TokenItem {
  address: string;
  name: string;
  symbol: string;
  description: string;
  imageUri: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  creator: string;
  marketCapBot: number;
  priceBot: number;
  progressPercent: number; // 0 to 100
  tokensSold: number;
  tokensForSale: number;
  realBotReserve: number;
  graduated: boolean;
  createdAt: number;
  replyCount: number;
  volume24h: number;
}

export interface Trade {
  id: string;
  tokenAddress: string;
  type: 'BUY' | 'SELL';
  user: string;
  userAddress?: string;
  botAmount: number;
  tokenAmount: number;
  timestamp: number;
  txHash: string;
}

export interface Comment {
  id: string;
  tokenAddress: string;
  user: string;
  text: string;
  imageUri?: string;
  likes?: number;
  timestamp: number;
}

interface MoonBotContextType {
  tokens: TokenItem[];
  trades: Record<string, Trade[]>;
  comments: Record<string, Comment[]>;
  getToken: (address: string) => TokenItem | undefined;
  getTokenTrades: (address: string) => Trade[];
  fetchSingleToken: (address: string) => Promise<TokenItem | undefined>;
  createToken: (params: {
    name: string;
    symbol: string;
    description: string;
    imageUri: string;
    twitter?: string;
    telegram?: string;
    website?: string;
    initialBuyBot?: number;
  }) => Promise<string>;
  buyToken: (tokenAddress: string, botAmount: number, slippagePercent?: number) => Promise<string>;
  sellToken: (tokenAddress: string, tokenAmount: number, slippagePercent?: number) => Promise<string>;
  addComment: (tokenAddress: string, text: string, imageUri?: string) => Promise<void>;
  fetchTokenComments: (tokenAddress: string) => Promise<void>;
  refreshOnChainTokens: () => Promise<void>;
  fetchTrades: () => Promise<void>;
  getUserTokenBalance: (tokenAddress: string) => Promise<number>;
  isLaunching: boolean;
  isTrading: boolean;
  isLoadingTokens: boolean;
  txStatusText: string;
}

const MoonBotContext = createContext<MoonBotContextType | undefined>(undefined);

// Helper to safely convert number or string to 18-decimal bigint without viem fractional overflow
export function safeParseEther(val: string | number): bigint {
  try {
    if (val === undefined || val === null) return 0n;
    const str = typeof val === 'number' ? val.toString() : val.trim();
    if (!str || str === '.' || str === '-') return 0n;
    const num = parseFloat(str);
    if (isNaN(num) || num <= 0) return 0n;
    // Format to fixed 18 decimals and strip trailing zeros to prevent viem precision errors
    const fixed = num.toFixed(18).replace(/\.?0+$/, '');
    return parseEther(fixed || '0');
  } catch {
    return 0n;
  }
}

export function MoonBotProvider({ children }: { children: ReactNode }) {
  const { address: userAddress, isConnected } = useAccount();
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [trades, setTrades] = useState<Record<string, Trade[]>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [isLaunching, setIsLaunching] = useState(false);
  const [isTrading, setIsTrading] = useState(false);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [txStatusText, setTxStatusText] = useState('');

  const { writeContractAsync } = useWriteContract();

  // Create public client for BOT Chain Testnet reading with configured timeout
  const publicClient = useMemo(
    () =>
      createPublicClient({
        transport: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.bohr.life', {
          timeout: 8_000,
          retryCount: 1,
        }),
      }),
    []
  );

  // Load cached tokens from MongoDB and localStorage on boot
  useEffect(() => {
    async function loadInitial() {
      try {
        const cached = typeof window !== 'undefined' ? localStorage.getItem(`moonbot_cache_${MOONBOT_LAUNCHPAD_ADDRESS}`) : null;
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const valid = parsed.map((t: any) => ({
              ...t,
              marketCapBot: Number(t.marketCapBot) || 0,
              priceBot: Number(t.priceBot) || 0.000000028,
              progressPercent: Number(t.progressPercent) || 0,
              tokensSold: Number(t.tokensSold) || 0,
              tokensForSale: Number(t.tokensForSale) || 800000000,
              realBotReserve: Number(t.realBotReserve) || 0,
            }));
            setTokens(valid);
          }
        }

        const res = await fetch(`/api/tokens?launchpadAddress=${MOONBOT_LAUNCHPAD_ADDRESS}`);
        if (res.ok) {
          const data = await res.json();
          if (data.tokens && Array.isArray(data.tokens) && data.tokens.length > 0) {
            setTokens(data.tokens);
          } else {
            setTokens([]);
          }
        }
      } catch (e) {
        // Silent fallback
      }
    }
    loadInitial();
  }, []);

  // Sync token to MongoDB in the background without blocking
  const syncTokenToMongo = (token: TokenItem) => {
    fetch('/api/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...token, launchpadAddress: MOONBOT_LAUNCHPAD_ADDRESS }),
    }).catch(() => {});
  };

  // Sync trade to MongoDB in the background without blocking
  const syncTradeToMongo = (trade: Trade) => {
    fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trade),
    }).catch(() => {});
  };

  // Fetch a single token directly from the contract on-demand
  const fetchSingleToken = useCallback(
    async (tokenAddr: string): Promise<TokenItem | undefined> => {
      if (!tokenAddr || typeof tokenAddr !== 'string' || !tokenAddr.startsWith('0x') || tokenAddr.length !== 42) {
        return undefined;
      }

      try {
        const raw = (await publicClient.readContract({
          address: MOONBOT_LAUNCHPAD_ADDRESS,
          abi: LAUNCHPAD_ABI,
          functionName: 'getToken',
          args: [tokenAddr as `0x${string}`],
        })) as any;

        if (!raw || !raw.name || raw.creator === '0x0000000000000000000000000000000000000000') {
          return undefined;
        }

        let progressRaw = 0n;
        try {
          progressRaw = (await publicClient.readContract({
            address: MOONBOT_LAUNCHPAD_ADDRESS,
            abi: LAUNCHPAD_ABI,
            functionName: 'getProgress',
            args: [tokenAddr as `0x${string}`],
          })) as bigint;
        } catch {}

        let priceRaw = 0n;
        try {
          priceRaw = (await publicClient.readContract({
            address: MOONBOT_LAUNCHPAD_ADDRESS,
            abi: LAUNCHPAD_ABI,
            functionName: 'getCurrentPrice',
            args: [tokenAddr as `0x${string}`],
          })) as bigint;
        } catch {}

        const tokensSoldFormatted = Number(formatEther(raw.tokensSold || BigInt(0))) || 0;
        const realBotReserveFormatted = Number(formatEther(raw.realBotReserve || BigInt(0))) || 0;

        const priceFormatted = priceRaw > 0n ? Number(priceRaw) / 1e18 : 30 / 1073000000;
        const realMarketCap = priceFormatted * 1000000000;
        const progressPercent = Number(progressRaw) / 100 || 0;

        const item: TokenItem = {
          address: tokenAddr,
          name: raw.name || 'Unknown Token',
          symbol: raw.symbol || 'TOKEN',
          description: raw.description || '',
          imageUri: raw.imageUri || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop',
          twitter: raw.twitter || '',
          telegram: raw.telegram || '',
          website: raw.website || '',
          creator: raw.creator || '0x0000000000000000000000000000000000000000',
          marketCapBot: Number(realMarketCap.toFixed(2)) || 0,
          priceBot: priceFormatted || 0.000000028,
          progressPercent: progressPercent || 0,
          tokensSold: tokensSoldFormatted,
          tokensForSale: 800000000,
          realBotReserve: realBotReserveFormatted,
          graduated: Boolean(raw.graduated),
          createdAt: Number(raw.createdAt) * 1000 || Date.now(),
          replyCount: 0,
          volume24h: realBotReserveFormatted,
        };

        setTokens((prev) => {
          const index = prev.findIndex((t) => t.address && t.address.toLowerCase() === tokenAddr.toLowerCase());
          let updated: TokenItem[];
          if (index >= 0) {
            updated = [...prev];
            updated[index] = item;
          } else {
            updated = [item, ...prev];
          }
          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem(`moonbot_cache_${MOONBOT_LAUNCHPAD_ADDRESS}`, JSON.stringify(updated));
            }
          } catch {}
          return updated;
        });

        // Background sync to MongoDB
        syncTokenToMongo(item);

        return item;
      } catch (err) {
        return undefined;
      }
    },
    [publicClient]
  );

  // Fetch trades 100% directly from BOT Chain on-chain logs (zero database dependency)
  const fetchTrades = useCallback(async () => {
    try {
      const logs = await publicClient.getLogs({
        address: MOONBOT_LAUNCHPAD_ADDRESS,
        fromBlock: 0n,
        toBlock: 'latest',
      });

      const tokenMap: Record<string, Map<string, Trade>> = {};

      for (const log of logs) {
        try {
          const decoded = decodeEventLog({
            abi: LAUNCHPAD_ABI,
            data: log.data,
            topics: log.topics,
          });

          if (decoded.eventName === 'TokenPurchased') {
            const args = decoded.args as any;
            const botAmount = Number(formatEther(args.botIn || 0n)) || 0;
            const tokenAmount = Math.floor(Number(formatEther(args.tokensOut || 0n))) || 0;
            const timestamp = Number(args.timestamp) * 1000 || Date.now();
            const lower = args.tokenAddress.toLowerCase();

            const trade: Trade = {
              id: `${log.transactionHash}-${log.logIndex}`,
              tokenAddress: args.tokenAddress,
              type: 'BUY',
              user: `${args.buyer.slice(0, 6)}...${args.buyer.slice(-4)}`,
              userAddress: args.buyer,
              botAmount,
              tokenAmount,
              timestamp,
              txHash: log.transactionHash || '',
            };

            if (!tokenMap[lower]) tokenMap[lower] = new Map();
            tokenMap[lower].set(log.transactionHash.toLowerCase(), trade);
          } else if (decoded.eventName === 'TokenSold') {
            const args = decoded.args as any;
            const botAmount = Number(formatEther(args.botOut || 0n)) || 0;
            const tokenAmount = Math.floor(Number(formatEther(args.tokensIn || 0n))) || 0;
            const timestamp = Number(args.timestamp) * 1000 || Date.now();
            const lower = args.tokenAddress.toLowerCase();

            const trade: Trade = {
              id: `${log.transactionHash}-${log.logIndex}`,
              tokenAddress: args.tokenAddress,
              type: 'SELL',
              user: `${args.seller.slice(0, 6)}...${args.seller.slice(-4)}`,
              userAddress: args.seller,
              botAmount,
              tokenAmount,
              timestamp,
              txHash: log.transactionHash || '',
            };

            if (!tokenMap[lower]) tokenMap[lower] = new Map();
            tokenMap[lower].set(log.transactionHash.toLowerCase(), trade);
          }
        } catch {
          // Ignore other non-trade contract logs
        }
      }

      const nextTrades: Record<string, Trade[]> = {};
      for (const [tokenAddr, map] of Object.entries(tokenMap)) {
        const sorted = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
        nextTrades[tokenAddr] = sorted;
      }

      setTrades(nextTrades);
    } catch {
      // Ignore RPC log timeouts silently
    }
  }, [publicClient]);

  // Helper to fetch trades case-insensitively
  const getTokenTrades = useCallback(
    (addr: string): Trade[] => {
      if (!addr || typeof addr !== 'string') return [];
      return trades[addr.toLowerCase()] || trades[addr] || [];
    },
    [trades]
  );

  // Fetch comments/chats from MongoDB for a specific token
  const fetchTokenComments = useCallback(async (tokenAddress: string) => {
    if (!tokenAddress || typeof tokenAddress !== 'string') return;
    try {
      const res = await fetch(`/api/comments?tokenAddress=${tokenAddress.toLowerCase()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.comments) {
          setComments((prev) => ({
            ...prev,
            [tokenAddress.toLowerCase()]: data.comments,
            [tokenAddress]: data.comments,
          }));
        }
      }
    } catch {
      // Silent error
    }
  }, []);

  // Refresh all tokens with MongoDB fast-path + parallelized on-chain contract sync
  const refreshOnChainTokens = useCallback(async () => {
    // 1. Sync from MongoDB first (instant)
    try {
      const mongoRes = await fetch(`/api/tokens?launchpadAddress=${MOONBOT_LAUNCHPAD_ADDRESS}`);
      if (mongoRes.ok) {
        const mongoData = await mongoRes.json();
        if (mongoData.tokens && Array.isArray(mongoData.tokens)) {
          setTokens(mongoData.tokens);
        }
      }
    } catch {}

    // 2. Sync from smart contract in background
    try {
      const allTokenAddresses = (await publicClient.readContract({
        address: MOONBOT_LAUNCHPAD_ADDRESS,
        abi: LAUNCHPAD_ABI,
        functionName: 'getAllTokens',
      })) as string[];

      if (allTokenAddresses && Array.isArray(allTokenAddresses) && allTokenAddresses.length > 0) {
        const fetchPromises = allTokenAddresses.map(async (addr) => {
          if (!addr || typeof addr !== 'string') return null;
          try {
            const raw = (await publicClient.readContract({
              address: MOONBOT_LAUNCHPAD_ADDRESS,
              abi: LAUNCHPAD_ABI,
              functionName: 'getToken',
              args: [addr as `0x${string}`],
            })) as any;

            let progressRaw = 0n;
            try {
              progressRaw = (await publicClient.readContract({
                address: MOONBOT_LAUNCHPAD_ADDRESS,
                abi: LAUNCHPAD_ABI,
                functionName: 'getProgress',
                args: [addr as `0x${string}`],
              })) as bigint;
            } catch {}

            let priceRaw = 0n;
            try {
              priceRaw = (await publicClient.readContract({
                address: MOONBOT_LAUNCHPAD_ADDRESS,
                abi: LAUNCHPAD_ABI,
                functionName: 'getCurrentPrice',
                args: [addr as `0x${string}`],
              })) as bigint;
            } catch {}

            const tokensSoldFormatted = Number(formatEther(raw.tokensSold || BigInt(0))) || 0;
            const realBotReserveFormatted = Number(formatEther(raw.realBotReserve || BigInt(0))) || 0;

            const priceFormatted = priceRaw > 0n ? Number(priceRaw) / 1e18 : 30 / 1073000000;
            const realMarketCap = priceFormatted * 1000000000;
            const progressPercent = Number(progressRaw) / 100 || 0;

            const item: TokenItem = {
              address: addr,
              name: raw.name || 'Unknown Token',
              symbol: raw.symbol || 'TOKEN',
              description: raw.description || '',
              imageUri: raw.imageUri || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop',
              twitter: raw.twitter || '',
              telegram: raw.telegram || '',
              website: raw.website || '',
              creator: raw.creator || '0x0000000000000000000000000000000000000000',
              marketCapBot: Number(realMarketCap.toFixed(2)) || 0,
              priceBot: priceFormatted || 0.000000028,
              progressPercent: progressPercent || 0,
              tokensSold: tokensSoldFormatted,
              tokensForSale: 800000000,
              realBotReserve: realBotReserveFormatted,
              graduated: Boolean(raw.graduated),
              createdAt: Number(raw.createdAt) * 1000 || Date.now(),
              replyCount: 0,
              volume24h: realBotReserveFormatted,
            };

            return item;
          } catch {
            return null;
          }
        });

        const results = await Promise.allSettled(fetchPromises);
        const validTokens: TokenItem[] = results
          .filter((r): r is PromiseFulfilledResult<TokenItem> => r.status === 'fulfilled' && r.value !== null)
          .map((r) => r.value);

        if (validTokens.length > 0) {
          setTokens(validTokens);
          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem(`moonbot_cache_${MOONBOT_LAUNCHPAD_ADDRESS}`, JSON.stringify(validTokens));
            }
          } catch {}
        }
      }
    } catch {
      // Smart contract read timeouts fail silently to prevent React crash
    } finally {
      setIsLoadingTokens(false);
    }
  }, [publicClient]);

  // Initial load and recurring sync (poll every 12s instead of 4s to prevent RPC throttling)
  useEffect(() => {
    refreshOnChainTokens();
    fetchTrades();
    const interval = setInterval(() => {
      refreshOnChainTokens();
      fetchTrades();
    }, 12000);
    return () => clearInterval(interval);
  }, [refreshOnChainTokens, fetchTrades]);

  // Get single token helper
  const getToken = (addr: string) => {
    if (!addr || typeof addr !== 'string') return undefined;
    return tokens.find((tok) => tok?.address && tok.address.toLowerCase() === addr.toLowerCase());
  };

  // Get user's real on-chain token balance
  const getUserTokenBalance = async (tokenAddress: string): Promise<number> => {
    if (!userAddress || !tokenAddress || typeof tokenAddress !== 'string') return 0;
    try {
      const balance = (await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress as `0x${string}`],
      })) as bigint;
      return Number(formatEther(balance)) || 0;
    } catch {
      return 0;
    }
  };

  // Create Token with on-chain verification & MongoDB indexing
  const createToken = async (params: {
    name: string;
    symbol: string;
    description: string;
    imageUri: string;
    twitter?: string;
    telegram?: string;
    website?: string;
    initialBuyBot?: number;
  }): Promise<string> => {
    if (!isConnected || !userAddress) {
      throw new Error('Please connect your Web3 wallet first.');
    }

    setIsLaunching(true);
    setTxStatusText('Please confirm the token creation in your wallet...');

    try {
      const creationFeeNum = 0.2;
      const initialBuyNum = params.initialBuyBot || 0;
      const totalBotValue = creationFeeNum + initialBuyNum;
      const totalValue = safeParseEther(totalBotValue);

      const onChainImageUri = params.imageUri || '';

      const hash = await writeContractAsync({
        address: MOONBOT_LAUNCHPAD_ADDRESS,
        abi: LAUNCHPAD_ABI,
        functionName: 'createToken',
        args: [
          params.name.trim(),
          params.symbol.trim().toUpperCase(),
          params.description.trim(),
          onChainImageUri,
          params.twitter?.trim() || '',
          params.telegram?.trim() || '',
          params.website?.trim() || '',
        ],
        value: totalValue,
      });

      setTxStatusText('Verifying and waiting for BOT Chain confirmation...');

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      if (receipt.status !== 'success') {
        throw new Error('Token creation transaction failed or was reverted on BOT Chain.');
      }

      // Extract real deployed token address from TokenCreated event log
      let deployedTokenAddress = '';
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: LAUNCHPAD_ABI,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === 'TokenCreated') {
            deployedTokenAddress = (decoded.args as any).tokenAddress;
            break;
          }
        } catch {
          // not this event
        }
      }

      if (!deployedTokenAddress) {
        throw new Error('Could not find deployed token address in transaction receipt logs.');
      }

      // Trigger background syncs immediately
      fetchSingleToken(deployedTokenAddress);
      refreshOnChainTokens();
      fetchTrades();

      return deployedTokenAddress;
    } finally {
      setIsLaunching(false);
      setTxStatusText('');
    }
  };

  // Buy Token with instant unlocking on confirmation and direct trade indexing
  const buyToken = async (
    tokenAddress: string,
    botAmount: number,
    slippagePercent = 1.0
  ): Promise<string> => {
    if (!isConnected || !userAddress) {
      throw new Error('Please connect your Web3 wallet first.');
    }

    if (botAmount <= 0) {
      throw new Error('Please specify a valid BOT amount.');
    }

    setIsTrading(true);
    setTxStatusText('Estimating output and preparing buy transaction...');

    try {
      const parsedBotValue = safeParseEther(botAmount);
      let minTokensOut = 0n;
      try {
        const [estimatedTokens] = (await publicClient.readContract({
          address: MOONBOT_LAUNCHPAD_ADDRESS,
          abi: LAUNCHPAD_ABI,
          functionName: 'calculateOutput',
          args: [tokenAddress as `0x${string}`, parsedBotValue],
        })) as [bigint, bigint];

        if (estimatedTokens > 0n) {
          const slippageBps = BigInt(Math.floor(slippagePercent * 100));
          minTokensOut = (estimatedTokens * (10000n - slippageBps)) / 10000n;
        }
      } catch (calcErr) {
        console.warn('Could not pre-calculate on-chain output:', calcErr);
      }

      setTxStatusText('Please confirm buy in your wallet...');

      const hash = await writeContractAsync({
        address: MOONBOT_LAUNCHPAD_ADDRESS,
        abi: LAUNCHPAD_ABI,
        functionName: 'buy',
        args: [tokenAddress as `0x${string}`, minTokensOut],
        value: parsedBotValue,
      });

      setTxStatusText('Waiting for on-chain block confirmation...');

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      if (receipt.status !== 'success') {
        throw new Error('Buy transaction failed or reverted on BOT Chain.');
      }

      // Immediate trade recording from receipt logs
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: LAUNCHPAD_ABI,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === 'TokenPurchased') {
            const args = decoded.args as any;
            const trade: Trade = {
              id: `${log.transactionHash}-${log.logIndex}`,
              tokenAddress: args.tokenAddress,
              type: 'BUY',
              user: `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`,
              userAddress: userAddress,
              botAmount: Number(formatEther(args.botIn || 0n)) || botAmount,
              tokenAmount: Math.floor(Number(formatEther(args.tokensOut || 0n))),
              timestamp: Date.now(),
              txHash: hash,
            };
            syncTradeToMongo(trade);
            setTrades((prev) => {
              const lower = tokenAddress.toLowerCase();
              const existing = prev[lower] || [];
              const filtered = existing.filter((t) => (t.txHash || t.id).toLowerCase() !== hash.toLowerCase());
              return {
                ...prev,
                [lower]: [trade, ...filtered],
                [tokenAddress]: [trade, ...filtered],
              };
            });
          }
        } catch {}
      }

      // Trigger single token sync
      fetchSingleToken(tokenAddress);
      refreshOnChainTokens();

      return hash;
    } finally {
      setIsTrading(false);
      setTxStatusText('');
    }
  };

  // Sell Token with instant unlocking on confirmation and direct trade indexing
  const sellToken = async (
    tokenAddress: string,
    tokenAmount: number,
    slippagePercent = 1.0
  ): Promise<string> => {
    if (!isConnected || !userAddress) {
      throw new Error('Please connect your Web3 wallet first.');
    }

    if (tokenAmount <= 0) {
      throw new Error('Please specify a valid token amount.');
    }

    setIsTrading(true);
    setTxStatusText('Checking token balance and approval...');

    try {
      const rawTokenAmount = safeParseEther(tokenAmount);

      const balance = (await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress as `0x${string}`],
      })) as bigint;

      if (balance < rawTokenAmount) {
        throw new Error(`Insufficient token balance. You hold ${formatEther(balance)} tokens.`);
      }

      const allowance = (await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [userAddress as `0x${string}`, MOONBOT_LAUNCHPAD_ADDRESS],
      })) as bigint;

      if (allowance < rawTokenAmount) {
        setTxStatusText('Please approve tokens in your wallet...');
        const approveHash = await writeContractAsync({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [MOONBOT_LAUNCHPAD_ADDRESS, rawTokenAmount],
        });

        setTxStatusText('Waiting for approval confirmation on BOT Chain...');
        const approveReceipt = await publicClient.waitForTransactionReceipt({
          hash: approveHash,
          confirmations: 1,
        });

        if (approveReceipt.status !== 'success') {
          throw new Error('Token approval transaction failed.');
        }
      }

      let minBotOut = 0n;
      try {
        const [estimatedBot] = (await publicClient.readContract({
          address: MOONBOT_LAUNCHPAD_ADDRESS,
          abi: LAUNCHPAD_ABI,
          functionName: 'calculateRefund',
          args: [tokenAddress as `0x${string}`, rawTokenAmount],
        })) as [bigint, bigint];

        if (estimatedBot > 0n) {
          const slippageBps = BigInt(Math.floor(slippagePercent * 100));
          minBotOut = (estimatedBot * (10000n - slippageBps)) / 10000n;
        }
      } catch (calcErr) {
        console.warn('Could not pre-calculate on-chain refund:', calcErr);
      }

      setTxStatusText('Please confirm sell in your wallet...');

      const sellHash = await writeContractAsync({
        address: MOONBOT_LAUNCHPAD_ADDRESS,
        abi: LAUNCHPAD_ABI,
        functionName: 'sell',
        args: [tokenAddress as `0x${string}`, rawTokenAmount, minBotOut],
      });

      setTxStatusText('Waiting for sell confirmation on BOT Chain...');

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: sellHash,
        confirmations: 1,
      });

      if (receipt.status !== 'success') {
        throw new Error('Sell transaction failed or reverted on BOT Chain.');
      }

      // Immediate trade recording from receipt logs
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: LAUNCHPAD_ABI,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === 'TokenSold') {
            const args = decoded.args as any;
            const trade: Trade = {
              id: `${log.transactionHash}-${log.logIndex}`,
              tokenAddress: args.tokenAddress,
              type: 'SELL',
              user: `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`,
              userAddress: userAddress,
              botAmount: Number(formatEther(args.botOut || 0n)) || 0,
              tokenAmount: Math.floor(tokenAmount),
              timestamp: Date.now(),
              txHash: sellHash,
            };
            syncTradeToMongo(trade);
            setTrades((prev) => {
              const lower = tokenAddress.toLowerCase();
              const existing = prev[lower] || [];
              const filtered = existing.filter((t) => (t.txHash || t.id).toLowerCase() !== sellHash.toLowerCase());
              return {
                ...prev,
                [lower]: [trade, ...filtered],
                [tokenAddress]: [trade, ...filtered],
              };
            });
          }
        } catch {}
      }

      // Trigger single token sync
      fetchSingleToken(tokenAddress);
      refreshOnChainTokens();

      return sellHash;
    } finally {
      setIsTrading(false);
      setTxStatusText('');
    }
  };

  // Add Comment (stored persistently in MongoDB)
  const addComment = async (tokenAddress: string, text: string, imageUri?: string) => {
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenAddress: tokenAddress.toLowerCase(),
          user: userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : '0xAnon...User',
          text,
          imageUri,
        }),
      });

      if (res.ok) {
        await fetchTokenComments(tokenAddress);
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    }
  };

  return (
    <MoonBotContext.Provider
      value={{
        tokens,
        trades,
        comments,
        getToken,
        getTokenTrades,
        fetchSingleToken,
        createToken,
        buyToken,
        sellToken,
        addComment,
        fetchTokenComments,
        refreshOnChainTokens,
        fetchTrades,
        getUserTokenBalance,
        isLaunching,
        isTrading,
        isLoadingTokens,
        txStatusText,
      }}
    >
      {children}
    </MoonBotContext.Provider>
  );
}

export function useMoonBot() {
  const context = useContext(MoonBotContext);
  if (!context) {
    throw new Error('useMoonBot must be used within a MoonBotProvider');
  }
  return context;
}
