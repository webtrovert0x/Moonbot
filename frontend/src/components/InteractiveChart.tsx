'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { TrendingUp, TrendingDown, BarChart2, LineChart, Activity, Crosshair } from 'lucide-react';
import { TokenItem, Trade, useMoonBot } from '@/context/MoonBotContext';

interface InteractiveChartProps {
  token: TokenItem;
}

type Timeframe = '1M' | '5M' | '15M' | '1H' | '1D';

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PricePoint {
  time: number;
  price: number;
  volume: number;
}

// Robust timestamp parser supporting seconds, milliseconds, ISO strings, and Date objects
function parseTimestamp(val: any, fallback = Date.now()): number {
  if (!val) return fallback;
  if (typeof val === 'number') {
    if (isNaN(val) || val <= 0) return fallback;
    return val < 100000000000 ? val * 1000 : val;
  }
  if (typeof val === 'string') {
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      return num < 100000000000 ? num * 1000 : num;
    }
    const parsed = new Date(val).getTime();
    return isNaN(parsed) || parsed <= 0 ? fallback : parsed;
  }
  if (val instanceof Date) {
    const t = val.getTime();
    return isNaN(t) || t <= 0 ? fallback : t;
  }
  return fallback;
}

export function InteractiveChart({ token }: InteractiveChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { getTokenTrades } = useMoonBot();
  const [timeframe, setTimeframe] = useState<Timeframe>('5M');
  const [chartType, setChartType] = useState<'area' | 'candles'>('area');
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; price: number; time: number; vol: number } | null>(null);

  const tokenTrades = getTokenTrades(token?.address || '');

  // Mathematical constants from MoonBotLaunchpad bonding curve
  const VIRTUAL_BOT_START = 30; // 30 BOT
  const VIRTUAL_TOKENS_START = 1073000000; // 1.073B tokens
  const K_CONSTANT = VIRTUAL_BOT_START * VIRTUAL_TOKENS_START; // 32,190,000,000
  const INITIAL_PRICE = (VIRTUAL_BOT_START * 1.0) / VIRTUAL_TOKENS_START; // ~0.00000002795899 BOT

  // Formatter for small crypto prices with dynamic precision
  const formatPrice = (p: number) => {
    if (!p || isNaN(p) || p <= 0) return '0.000000028';
    if (p < 0.000001) {
      return p.toFixed(10).replace(/0+$/, '0');
    }
    if (p < 0.01) {
      return p.toFixed(8);
    }
    return p.toFixed(6);
  };

  // Build accurate price points from token creation & chronological trades
  const priceTimeline: PricePoint[] = useMemo(() => {
    const now = Date.now();
    const creationTime = parseTimestamp(token?.createdAt, now - 3600000);
    const currentPrice = token?.priceBot && token.priceBot > 0 ? token.priceBot : INITIAL_PRICE;
    const currentRealReserve = token?.realBotReserve || 0;

    const points: PricePoint[] = [];

    if (!tokenTrades || tokenTrades.length === 0) {
      // No secondary trades yet: steady flat line from creation time at current price
      points.push({
        time: Math.min(creationTime, now - 60000),
        price: currentPrice,
        volume: 0,
      });
      points.push({
        time: now,
        price: currentPrice,
        volume: 0,
      });
      return points;
    }

    // Sort trades chronologically (oldest first)
    const sorted = [...tokenTrades]
      .map((t) => ({ ...t, timestamp: parseTimestamp(t.timestamp, now) }))
      .sort((a, b) => a.timestamp - b.timestamp);

    // Reconstruct backwards from current known on-chain real reserve to know exact historic reserves
    const historicReserves: number[] = new Array(sorted.length);
    let runningBack = currentRealReserve;

    for (let i = sorted.length - 1; i >= 0; i--) {
      historicReserves[i] = runningBack;
      const tr = sorted[i];
      const bAmt = Number(tr.botAmount) || 0;
      if (tr.type === 'BUY') {
        runningBack = Math.max(0, runningBack - bAmt);
      } else {
        runningBack = runningBack + bAmt;
      }
    }

    const initialReserve = runningBack;
    const initialCalcPrice = ((VIRTUAL_BOT_START + initialReserve) ** 2) / K_CONSTANT;

    // Point at launch
    points.push({
      time: Math.min(creationTime, sorted[0].timestamp - 10000),
      price: initialCalcPrice > 0 ? initialCalcPrice : INITIAL_PRICE,
      volume: 0,
    });

    // Points at each trade timestamp
    for (let i = 0; i < sorted.length; i++) {
      const tr = sorted[i];
      const res = historicReserves[i];
      const priceAtTrade = ((VIRTUAL_BOT_START + res) ** 2) / K_CONSTANT;
      points.push({
        time: tr.timestamp,
        price: priceAtTrade,
        volume: Number(tr.botAmount) || 0,
      });
    }

    // Point at now
    if (points[points.length - 1].time < now) {
      points.push({
        time: now,
        price: currentPrice,
        volume: 0,
      });
    }

    return points;
  }, [token, tokenTrades, INITIAL_PRICE, K_CONSTANT, VIRTUAL_BOT_START]);

  // Aggregate price points into OHLC candles based on timeframe
  const candles: CandleData[] = useMemo(() => {
    const bucketMsMap: Record<Timeframe, number> = {
      '1M': 60 * 1000,
      '5M': 5 * 60 * 1000,
      '15M': 15 * 60 * 1000,
      '1H': 60 * 60 * 1000,
      '1D': 24 * 60 * 60 * 1000,
    };
    const bucketMs = bucketMsMap[timeframe] || 5 * 60 * 1000;

    if (priceTimeline.length === 0) return [];

    const firstTime = priceTimeline[0].time;
    const lastTime = priceTimeline[priceTimeline.length - 1].time;
    const startBucket = Math.floor(firstTime / bucketMs) * bucketMs;
    const endBucket = Math.floor(lastTime / bucketMs) * bucketMs;

    const candleMap: Record<number, { prices: number[]; volume: number }> = {};

    let currentBucketTime = startBucket;
    while (currentBucketTime <= endBucket) {
      candleMap[currentBucketTime] = { prices: [], volume: 0 };
      currentBucketTime += bucketMs;
    }

    // Assign points to buckets
    for (const pt of priceTimeline) {
      const bTime = Math.floor(pt.time / bucketMs) * bucketMs;
      if (!candleMap[bTime]) candleMap[bTime] = { prices: [], volume: 0 };
      candleMap[bTime].prices.push(pt.price);
      candleMap[bTime].volume += pt.volume;
    }

    const result: CandleData[] = [];
    let lastClose = priceTimeline[0].price;

    const sortedBuckets = Object.keys(candleMap)
      .map(Number)
      .sort((a, b) => a - b);

    // Limit candle count to max 40 for sleek display
    const visibleBuckets = sortedBuckets.slice(-40);

    for (const bTime of visibleBuckets) {
      const { prices, volume } = candleMap[bTime];
      if (prices.length > 0) {
        const open = lastClose;
        const close = prices[prices.length - 1];
        const high = Math.max(open, close, ...prices);
        const low = Math.min(open, close, ...prices);
        result.push({ time: bTime, open, high, low, close, volume });
        lastClose = close;
      } else {
        // Flat candle maintaining last price
        result.push({
          time: bTime,
          open: lastClose,
          high: lastClose,
          low: lastClose,
          close: lastClose,
          volume: 0,
        });
      }
    }

    return result;
  }, [priceTimeline, timeframe]);

  // Main canvas render loop
  const renderChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !token) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height || rect.width <= 120 || rect.height <= 60) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    const padding = { top: 20, bottom: 35, left: 15, right: 95 };
    const chartWidth = Math.max(10, width - padding.left - padding.right);
    const chartHeight = Math.max(10, height - padding.top - padding.bottom);

    ctx.clearRect(0, 0, width, height);

    if (chartType === 'area') {
      const dataPoints = priceTimeline.length >= 2 ? priceTimeline : [
        { time: Date.now() - 3600000, price: INITIAL_PRICE, volume: 0 },
        { time: Date.now(), price: token.priceBot || INITIAL_PRICE, volume: 0 },
      ];

      const prices = dataPoints.map((d) => d.price);
      let minP = Math.min(...prices);
      let maxP = Math.max(...prices);

      // Add 5% breathing room
      const margin = (maxP - minP) * 0.08 || minP * 0.02 || 0.000000001;
      minP = Math.max(0, minP - margin);
      maxP = maxP + margin;
      const rangeP = maxP - minP || 0.000000001;

      // Draw horizontal grid lines & right price labels
      const gridCount = 4;
      ctx.strokeStyle = '#181d2e';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      for (let i = 0; i <= gridCount; i++) {
        const y = padding.top + (chartHeight / gridCount) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        const priceVal = maxP - (rangeP / gridCount) * i;
        ctx.fillStyle = '#64748b';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(formatPrice(priceVal), width - padding.right + 8, y + 3.5);
      }
      ctx.setLineDash([]);

      // Draw bottom time labels
      const timeLabelsCount = Math.min(4, dataPoints.length);
      for (let i = 0; i < timeLabelsCount; i++) {
        const idx = Math.floor((i / (timeLabelsCount - 1 || 1)) * (dataPoints.length - 1));
        const pt = dataPoints[idx];
        const x = padding.left + (chartWidth / Math.max(1, dataPoints.length - 1)) * idx;
        const d = new Date(pt.time);
        const timeStr = isNaN(d.getTime()) ? 'Now' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        ctx.fillStyle = '#64748b';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(timeStr, x, height - 12);
      }

      // Draw volume histogram bars
      for (let i = 0; i < dataPoints.length; i++) {
        const x = padding.left + (chartWidth / Math.max(1, dataPoints.length - 1)) * i;
        const vol = dataPoints[i].volume;
        const barHeight = vol > 0 ? Math.min(Math.max(vol * 8, 4), 30) : 3;
        const isUp = i > 0 ? dataPoints[i].price >= dataPoints[i - 1].price : true;

        ctx.fillStyle = isUp ? 'rgba(16, 185, 129, 0.22)' : 'rgba(239, 68, 68, 0.22)';
        ctx.fillRect(x - 2.5, height - padding.bottom - barHeight, 5, barHeight);
      }

      // Draw Area Fill Gradient
      const isOverallUp = dataPoints[dataPoints.length - 1].price >= dataPoints[0].price;
      const strokeColor = isOverallUp ? '#10b981' : '#ef4444';
      const glowColor = isOverallUp ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)';

      const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
      gradient.addColorStop(0, glowColor);
      gradient.addColorStop(0.6, isOverallUp ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      for (let i = 0; i < dataPoints.length; i++) {
        const x = padding.left + (chartWidth / Math.max(1, dataPoints.length - 1)) * i;
        const y = padding.top + chartHeight - ((dataPoints[i].price - minP) / rangeP) * chartHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineTo(padding.left + chartWidth, height - padding.bottom);
      ctx.lineTo(padding.left, height - padding.bottom);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Main line stroke
      ctx.beginPath();
      for (let i = 0; i < dataPoints.length; i++) {
        const x = padding.left + (chartWidth / Math.max(1, dataPoints.length - 1)) * i;
        const y = padding.top + chartHeight - ((dataPoints[i].price - minP) / rangeP) * chartHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Live price pulse dot on right edge
      const lastX = padding.left + chartWidth;
      const lastY = padding.top + chartHeight - ((dataPoints[dataPoints.length - 1].price - minP) / rangeP) * chartHeight;

      if (!isNaN(lastX) && !isNaN(lastY)) {
        // Outer halo
        ctx.beginPath();
        ctx.arc(lastX, lastY, 7, 0, Math.PI * 2);
        ctx.fillStyle = isOverallUp ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)';
        ctx.fill();

        // Center dot
        ctx.beginPath();
        ctx.arc(lastX, lastY, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = strokeColor;
        ctx.fill();
      }

      // Draw hover crosshair if user is hovering
      if (hoveredPoint && hoveredPoint.x >= padding.left && hoveredPoint.x <= width - padding.right) {
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);

        // Vertical crosshair
        ctx.beginPath();
        ctx.moveTo(hoveredPoint.x, padding.top);
        ctx.lineTo(hoveredPoint.x, height - padding.bottom);
        ctx.stroke();

        // Horizontal crosshair
        ctx.beginPath();
        ctx.moveTo(padding.left, hoveredPoint.y);
        ctx.lineTo(width - padding.right, hoveredPoint.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Hover highlight circle
        ctx.beginPath();
        ctx.arc(hoveredPoint.x, hoveredPoint.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    } else {
      // CANDLESTICK MODE
      if (candles.length === 0) return;

      const highs = candles.map((c) => c.high);
      const lows = candles.map((c) => c.low);
      let minP = Math.min(...lows);
      let maxP = Math.max(...highs);

      const margin = (maxP - minP) * 0.08 || minP * 0.02 || 0.000000001;
      minP = Math.max(0, minP - margin);
      maxP = maxP + margin;
      const rangeP = maxP - minP || 0.000000001;

      // Draw horizontal grid lines & right price labels
      const gridCount = 4;
      ctx.strokeStyle = '#181d2e';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      for (let i = 0; i <= gridCount; i++) {
        const y = padding.top + (chartHeight / gridCount) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        const priceVal = maxP - (rangeP / gridCount) * i;
        ctx.fillStyle = '#64748b';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(formatPrice(priceVal), width - padding.right + 8, y + 3.5);
      }
      ctx.setLineDash([]);

      const candleWidth = Math.min(18, Math.max(4, (chartWidth / Math.max(1, candles.length)) * 0.65));

      for (let i = 0; i < candles.length; i++) {
        const c = candles[i];
        const x = padding.left + (chartWidth / Math.max(1, candles.length - 1)) * i;

        const yOpen = padding.top + chartHeight - ((c.open - minP) / rangeP) * chartHeight;
        const yClose = padding.top + chartHeight - ((c.close - minP) / rangeP) * chartHeight;
        const yHigh = padding.top + chartHeight - ((c.high - minP) / rangeP) * chartHeight;
        const yLow = padding.top + chartHeight - ((c.low - minP) / rangeP) * chartHeight;

        const isGreen = c.close >= c.open;
        const color = isGreen ? '#10b981' : '#ef4444';

        // Draw wick
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.moveTo(x, yHigh);
        ctx.lineTo(x, yLow);
        ctx.stroke();

        // Draw body
        const topY = Math.min(yOpen, yClose);
        const bodyHeight = Math.max(Math.abs(yClose - yOpen), 2);
        ctx.fillStyle = color;
        ctx.fillRect(x - candleWidth / 2, topY, candleWidth, bodyHeight);
      }

      // Draw bottom time labels
      const timeLabelsCount = Math.min(4, candles.length);
      for (let i = 0; i < timeLabelsCount; i++) {
        const idx = Math.floor((i / (timeLabelsCount - 1 || 1)) * (candles.length - 1));
        const c = candles[idx];
        const x = padding.left + (chartWidth / Math.max(1, candles.length - 1)) * idx;
        const d = new Date(c.time);
        const timeStr = isNaN(d.getTime()) ? 'Now' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        ctx.fillStyle = '#64748b';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(timeStr, x, height - 12);
      }
    }
  }, [token, priceTimeline, candles, chartType, hoveredPoint, INITIAL_PRICE]);

  useEffect(() => {
    renderChart();
  }, [renderChart]);

  // Track window resize
  useEffect(() => {
    const handleResize = () => {
      renderChart();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderChart]);

  // Handle canvas mouse move for interactive tooltips
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || priceTimeline.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const padding = { top: 20, bottom: 35, left: 15, right: 95 };
    const chartWidth = Math.max(10, rect.width - padding.left - padding.right);
    const chartHeight = Math.max(10, rect.height - padding.top - padding.bottom);

    if (mouseX < padding.left || mouseX > rect.width - padding.right) {
      setHoveredPoint(null);
      return;
    }

    const ratio = Math.max(0, Math.min(1, (mouseX - padding.left) / chartWidth));
    const pointIdx = Math.round(ratio * (priceTimeline.length - 1));
    const pt = priceTimeline[pointIdx];

    if (!pt) return;

    const prices = priceTimeline.map((d) => d.price);
    let minP = Math.min(...prices);
    let maxP = Math.max(...prices);
    const margin = (maxP - minP) * 0.08 || minP * 0.02 || 0.000000001;
    minP = Math.max(0, minP - margin);
    maxP = maxP + margin;
    const rangeP = maxP - minP || 0.000000001;

    const x = padding.left + (chartWidth / Math.max(1, priceTimeline.length - 1)) * pointIdx;
    const y = padding.top + chartHeight - ((pt.price - minP) / rangeP) * chartHeight;

    setHoveredPoint({
      x,
      y,
      price: pt.price,
      time: pt.time,
      vol: pt.volume,
    });
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const currentTokenPrice = token?.priceBot && token.priceBot > 0 ? token.priceBot : INITIAL_PRICE;
  const rawPct = ((currentTokenPrice - INITIAL_PRICE) / INITIAL_PRICE) * 100;
  const pricePctChange = isNaN(rawPct) ? '0.00' : (rawPct >= 0 ? `+${rawPct.toFixed(2)}%` : `${rawPct.toFixed(2)}%`);
  const isPositive = rawPct >= 0;

  return (
    <div ref={containerRef} className="w-full rounded-2xl bg-[#141724] border border-[#24293e] p-4 flex flex-col space-y-4 shadow-xl">
      {/* Chart Header & Price Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#24293e] pb-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-baseline space-x-2">
            <span className="text-xl md:text-2xl font-black font-mono text-white">
              {formatPrice(hoveredPoint ? hoveredPoint.price : currentTokenPrice)}
            </span>
            <span className="text-xs font-mono font-bold text-gray-400">BOT</span>
          </div>

          <span
            className={`flex items-center space-x-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
              isPositive
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                : 'text-red-400 bg-red-500/10 border-red-500/30'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{pricePctChange}</span>
          </span>

          {hoveredPoint && (
            <div className="hidden sm:flex items-center space-x-2 text-[11px] font-mono text-gray-400 border-l border-[#24293e] pl-3">
              <span>{isNaN(new Date(hoveredPoint.time).getTime()) ? 'Now' : new Date(hoveredPoint.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              {hoveredPoint.vol > 0 && <span className="text-emerald-400">Vol: {hoveredPoint.vol.toFixed(3)} BOT</span>}
            </div>
          )}
        </div>

        {/* Timeframe & Chart Style Switchers */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-[#0f111a] rounded-xl p-1 border border-[#24293e]">
            {(['1M', '5M', '15M', '1H', '1D'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  timeframe === tf
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-[#0f111a] rounded-xl p-1 border border-[#24293e]">
            <button
              onClick={() => setChartType('area')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                chartType === 'area' ? 'bg-[#1e2438] text-emerald-400' : 'text-gray-400 hover:text-white'
              }`}
              title="Line Area Chart"
            >
              <LineChart className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType('candles')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                chartType === 'candles' ? 'bg-[#1e2438] text-emerald-400' : 'text-gray-400 hover:text-white'
              }`}
              title="Candlestick Chart"
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Interactive Chart */}
      <div className="w-full h-72 relative">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full block cursor-crosshair"
        />

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div
            className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-[#0f111a]/95 border border-[#3b4468] px-2.5 py-1.5 rounded-lg shadow-xl text-xs font-mono space-y-0.5 backdrop-blur-md z-10"
            style={{ left: `${hoveredPoint.x}px`, top: `${Math.max(30, hoveredPoint.y - 10)}px` }}
          >
            <div className="text-emerald-400 font-bold">{formatPrice(hoveredPoint.price)} BOT</div>
            <div className="text-[10px] text-gray-400">{isNaN(new Date(hoveredPoint.time).getTime()) ? 'Now' : new Date(hoveredPoint.time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
          </div>
        )}
      </div>
    </div>
  );
}

