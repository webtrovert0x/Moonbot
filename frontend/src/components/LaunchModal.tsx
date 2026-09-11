'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Rocket, Upload, Image as ImageIcon, ChevronDown, ChevronUp, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useMoonBot } from '@/context/MoonBotContext';

interface LaunchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LaunchModal({ isOpen, onClose }: LaunchModalProps) {
  const router = useRouter();
  const { createToken, isLaunching, txStatusText } = useMoonBot();

  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [twitter, setTwitter] = useState('');
  const [telegram, setTelegram] = useState('');
  const [website, setWebsite] = useState('');
  const [initialBuyBot, setInitialBuyBot] = useState<string>('0');
  const [showSocials, setShowSocials] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setImageUri(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide a coin name');
      return;
    }
    if (!symbol.trim()) {
      setError('Please provide a ticker symbol');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a brief description');
      return;
    }

    try {
      let finalImageUri = imageUri.trim();

      // If user uploaded a local image file (base64), upload it to MongoDB
      if (imagePreview && imagePreview.startsWith('data:image')) {
        setUploadStatus('Saving token image to MongoDB...');
        try {
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: imagePreview }),
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (uploadData.url) {
              finalImageUri = uploadData.url;
            }
          }
        } catch (uploadErr) {
          console.warn('MongoDB upload fallback:', uploadErr);
        } finally {
          setUploadStatus('');
        }
      }

      const parsedInitialBuy = parseFloat(initialBuyBot) || 0;
      const deployedAddress = await createToken({
        name: name.trim(),
        symbol: symbol.trim().toUpperCase(),
        description: description.trim(),
        imageUri: finalImageUri || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop',
        twitter: twitter.trim(),
        telegram: telegram.trim(),
        website: website.trim(),
        initialBuyBot: parsedInitialBuy,
      });

      // Fire celebratory confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      onClose();
      router.push(`/token/${deployedAddress}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create token. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0f111a] border border-[#24293e] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8">
        <div className="flex items-center justify-between border-b border-[#24293e] pb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Launch a new coin</h2>
              <p className="text-xs text-gray-400">Fair launch on BOT Chain with zero initial liquidity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#1b2032] transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {(isLaunching || uploadStatus) && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>{uploadStatus || txStatusText || 'Confirming on BOT Chain...'}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Name & Ticker */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Name <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Moon Doge"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#141724] border border-[#24293e] text-white placeholder-gray-500 text-xs focus:outline-none focus:border-emerald-400 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Ticker Symbol <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. MDOGE"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#141724] border border-[#24293e] text-white placeholder-gray-500 text-xs uppercase focus:outline-none focus:border-emerald-400 font-mono"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Description <span className="text-emerald-400">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="What makes this coin special? Describe the meme or vision..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl bg-[#141724] border border-[#24293e] text-white placeholder-gray-500 text-xs focus:outline-none focus:border-emerald-400"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Coin Image / Meme <span className="text-emerald-400">*</span>
            </label>
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 rounded-xl bg-[#141724] border border-[#24293e] flex items-center justify-center overflow-hidden shrink-0">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-gray-500" />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="cursor-pointer inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#1b2032] hover:bg-[#24293e] text-xs font-medium text-gray-200 border border-[#2e354f] transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose file from device</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFile}
                    className="hidden"
                  />
                </label>
                <span className="block text-[11px] text-gray-400">
                  Stored securely in MongoDB for fast rendering & low gas
                </span>
              </div>
            </div>
          </div>

          {/* Initial Dev Buy Option */}
          <div className="p-3.5 rounded-xl bg-[#141724] border border-[#24293e] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-200 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Initial Buy (Optional Dev Snipe)</span>
              </label>
              <span className="text-[11px] text-gray-400 font-mono">Cost in $BOT</span>
            </div>
            <p className="text-[11px] text-gray-400">
              Be the first buyer in the bonding curve upon token creation to secure an early bag.
            </p>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.0"
                value={initialBuyBot}
                onChange={(e) => setInitialBuyBot(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#0f111a] border border-[#24293e] text-white text-xs font-mono focus:outline-none focus:border-emerald-400"
              />
              {['0', '0.5', '1', '5'].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setInitialBuyBot(chip)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors shrink-0 ${
                    initialBuyBot === chip
                      ? 'bg-emerald-500 text-black font-bold'
                      : 'bg-[#1b2032] text-gray-300 hover:bg-[#24293e]'
                  }`}
                >
                  {chip === '0' ? 'None' : `${chip} BOT`}
                </button>
              ))}
            </div>
          </div>

          {/* Social Links Accordion */}
          <div>
            <button
              type="button"
              onClick={() => setShowSocials(!showSocials)}
              className="flex items-center justify-between w-full text-xs font-semibold text-gray-400 hover:text-gray-200 py-1"
            >
              <span>More Options (Telegram, Twitter, Website)</span>
              {showSocials ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showSocials && (
              <div className="space-y-2 mt-2 pt-2 border-t border-[#24293e]">
                <input
                  type="url"
                  placeholder="Twitter / X link"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#141724] border border-[#24293e] text-white placeholder-gray-500 text-xs focus:outline-none focus:border-emerald-400"
                />
                <input
                  type="url"
                  placeholder="Telegram link"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#141724] border border-[#24293e] text-white placeholder-gray-500 text-xs focus:outline-none focus:border-emerald-400"
                />
                <input
                  type="url"
                  placeholder="Website link"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#141724] border border-[#24293e] text-white placeholder-gray-500 text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isLaunching}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLaunching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{uploadStatus || txStatusText || 'Creating token on BOT Chain...'}</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>Create Coin (0.2 BOT fee)</span>
                </>
              )}
            </button>
            <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2 px-1">
              <span>Creation Fee: <strong className="text-emerald-400 font-mono">0.2 BOT</strong></span>
              <span>Creator Earnings: <strong className="text-cyan-400 font-mono">0.5% on trades</strong></span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
