'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Image as ImageIcon, Sparkles, Loader2, X } from 'lucide-react';
import { Comment, useMoonBot } from '@/context/MoonBotContext';

interface CommentsThreadProps {
  tokenAddress: string;
  comments: Comment[];
}

export function CommentsThread({ tokenAddress, comments = [] }: CommentsThreadProps) {
  const { addComment, fetchTokenComments } = useMoonBot();
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Poll for new live chats every 3.5s
  useEffect(() => {
    if (tokenAddress) {
      fetchTokenComments(tokenAddress);
      const interval = setInterval(() => {
        fetchTokenComments(tokenAddress);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [tokenAddress, fetchTokenComments]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !imagePreview) || isPosting) return;

    setIsPosting(true);
    try {
      let finalImageUri = '';

      // Upload image to MongoDB if attached
      if (imagePreview) {
        setIsUploadingImage(true);
        try {
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: imagePreview }),
          });
          if (uploadRes.ok) {
            const data = await uploadRes.json();
            if (data.url) finalImageUri = data.url;
          }
        } catch (err) {
          console.warn('Image upload error:', err);
        } finally {
          setIsUploadingImage(false);
        }
      }

      await addComment(tokenAddress, text.trim(), finalImageUri || undefined);
      setText('');
      setImagePreview('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Error posting chat:', err);
    } finally {
      setIsPosting(false);
    }
  };

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
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-white text-sm">Community Live Chat</h3>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>
        <span className="text-xs text-gray-400 font-mono">{comments.length} messages</span>
      </div>

      {/* Post chat form */}
      <form onSubmit={handleSubmit} className="flex flex-col space-y-2.5">
        <div className="relative">
          <textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Post a meme, share alpha, or reply to holders..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0f111a] border border-[#24293e] text-white text-xs placeholder-gray-500 focus:outline-none focus:border-emerald-400 resize-none transition-colors"
          />

          {/* Attached image preview */}
          {imagePreview && (
            <div className="relative inline-block mt-2 ml-2 p-1 bg-[#141724] rounded-lg border border-[#24293e]">
              <img src={imagePreview} alt="Attached" className="w-16 h-16 object-cover rounded-md" />
              <button
                type="button"
                onClick={() => {
                  setImagePreview('');
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2 text-gray-400">
            {/* Attach Image / Meme */}
            <label className="cursor-pointer p-1.5 rounded-lg bg-[#0f111a] border border-[#24293e] hover:text-emerald-400 hover:border-emerald-500/40 transition-colors inline-flex items-center space-x-1 text-xs">
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="text-[11px]">Meme</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => setText((prev) => prev + ' 🚀🌕')}
              className="text-xs hover:text-white px-2 py-1 rounded bg-[#0f111a] border border-[#24293e]"
            >
              🚀 LFG
            </button>
            <button
              type="button"
              onClick={() => setText((prev) => prev + ' 💎🙌')}
              className="text-xs hover:text-white px-2 py-1 rounded bg-[#0f111a] border border-[#24293e]"
            >
              💎 Diamond Hands
            </button>
          </div>

          <button
            type="submit"
            disabled={(!text.trim() && !imagePreview) || isPosting}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-colors disabled:opacity-40 shadow-sm"
          >
            {isPosting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            <span>{isUploadingImage ? 'Uploading...' : 'Send'}</span>
          </button>
        </div>
      </form>

      {/* Chat Messages List */}
      <div className="space-y-3 pt-2">
        {comments.map((c) => (
          <div
            key={c.id}
            className="p-3.5 rounded-xl bg-[#0f111a] border border-[#202538] space-y-2 hover:border-[#2e3650] transition-colors"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-emerald-400">{c.user}</span>
              <span className="text-[11px] text-gray-500 font-mono">{timeAgo(c.timestamp)}</span>
            </div>
            
            {c.text && <p className="text-xs text-gray-200 leading-relaxed break-words">{c.text}</p>}

            {c.imageUri && (
              <div className="rounded-lg overflow-hidden max-w-xs border border-[#24293e] mt-1.5">
                <img src={c.imageUri} alt="Chat attachment" className="w-full h-auto max-h-48 object-cover" />
              </div>
            )}
          </div>
        ))}

        {comments.length === 0 && (
          <div className="text-center py-6 text-xs text-gray-500 font-mono">
            No messages yet. Be the first to start the chat!
          </div>
        )}
      </div>
    </div>
  );
}
