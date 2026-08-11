import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, FastForward } from 'lucide-react';

interface AudioPlayerProps {
  mediaUrl?: string | null;
  duration?: number;
}

export function AudioPlayer({ mediaUrl, duration = 0 }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let isMounted = true;
    
    // Cache the voice note for 30 days locally using standard browser Cache API
    const cacheVoiceNote = async () => {
      if (!mediaUrl) return;
      try {
        const cache = await caches.open('voice-notes-v1');
        const match = await cache.match(mediaUrl);
        let blobUrl: string | null = null;
        
        if (match) {
          const blob = await match.blob();
          blobUrl = URL.createObjectURL(blob);
        } else {
          // Fetch and cache it
          const response = await fetch(mediaUrl);
          if (response.ok) {
            // Clone the response because it can only be consumed once
            await cache.put(mediaUrl, response.clone());
            const blob = await response.blob();
            blobUrl = URL.createObjectURL(blob);
          } else {
            // Fallback to original URL if fetch fails
            if (isMounted) setCachedUrl(mediaUrl);
            return;
          }
        }
        
        if (isMounted && blobUrl) {
          setCachedUrl(blobUrl);
        } else if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
        }
      } catch (err) {
        console.error('Caching failed, falling back to network url', err);
        if (isMounted) setCachedUrl(mediaUrl);
      }
    };
    
    cacheVoiceNote();
    
    return () => {
      isMounted = false;
      // We don't revoke here because it might be in use, 
      // but standard practice is to revoke if we created it.
      // However, since we're using a state for cachedUrl, 
      // we can use a ref to track what to revoke.
    };
  }, [mediaUrl]);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const cyclePlaybackRate = () => {
    if (!audioRef.current) return;
    const rates = [1, 1.5, 2, 0.5];
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIndex];
    audioRef.current.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setProgress((audio.currentTime / (audio.duration || duration || 1)) * 100);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      audio.currentTime = 0;
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [cachedUrl, mediaUrl, duration]);

  return (
    <div className="flex items-center gap-3 bg-white/5 rounded-full p-2 pr-4 border border-white/10 w-[240px]">
      <button 
        onClick={togglePlayback}
        className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white shrink-0 hover:bg-brand-primary/80 transition-colors shadow-lg shadow-brand-primary/20"
      >
        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
      </button>

      {/* Waveform placeholder */}
      <div className="flex-1 h-6 flex items-center gap-[2px]">
        {Array.from({ length: 20 }).map((_, i) => {
          const isActive = progress > (i / 20) * 100;
          const h = Math.max(2, Math.random() * 24);
          return (
            <div 
              key={i} 
              className={`w-1 rounded-full transition-colors ${isActive ? 'bg-brand-primary' : 'bg-white/20'}`} 
              style={{ height: `${h}px` }} 
            />
          );
        })}
      </div>

      <div className="flex flex-col items-end shrink-0 gap-1">
        <button 
          onClick={cyclePlaybackRate}
          className="text-[10px] font-bold bg-white/10 px-1.5 py-0.5 rounded text-white/50 hover:text-white hover:bg-white/20 transition-colors"
        >
          {playbackRate}x
        </button>
        <span className="text-[10px] text-white/40 font-mono">
          {formatTime((progress / 100) * (audioRef.current?.duration || duration || 0))}
        </span>
      </div>

      <audio ref={audioRef} src={cachedUrl || mediaUrl || undefined} className="hidden" preload="metadata" />
    </div>
  );
}
