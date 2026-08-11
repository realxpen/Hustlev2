import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send } from 'lucide-react';

interface VoiceRecorderProps {
  onSend: (file: File, durationSeconds: number) => void;
  onCancel: () => void;
}

export function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let active = true;
    let activeStream: MediaStream | null = null;
    let activeRecorder: MediaRecorder | null = null;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        activeStream = stream;

        let mediaRecorder: MediaRecorder;
        try {
          mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        } catch (e) {
          // Fallback for Safari
          mediaRecorder = new MediaRecorder(stream); 
        }

        activeRecorder = mediaRecorder;
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start();
        setIsRecording(true);

        timerRef.current = setInterval(() => {
          setDuration(d => d + 1);
        }, 1000);
      } catch (err) {
        console.error('Mic access error:', err);
        if (active) {
          alert('Microphone access is required for voice notes.');
          onCancel();
        }
      }
    };

    start();

    return () => {
      active = false;
      cleanup();
      if (activeRecorder && activeRecorder.state === 'recording') {
        try {
          activeRecorder.stop();
        } catch (e) {}
      }
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    try {
      mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
    } catch (e) {}
  };

  const stopAndSend = () => {
    if (!mediaRecorderRef.current) return;
    
    mediaRecorderRef.current.onstop = () => {
      const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      const file = new File([audioBlob], `voice-note-${Date.now()}.${ext}`, { type: mimeType });
      onSend(file, duration);
      cleanup();
    };
    
    mediaRecorderRef.current.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const handleCancel = () => {
    cleanup();
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex items-center justify-between gap-3 bg-red-500/10 rounded-[2.5rem] p-2 pr-4 border border-red-500/20 shadow-lg shell">
      <button 
        onClick={handleCancel}
        className="w-10 h-10 rounded-full flex items-center justify-center text-red-500 hover:bg-white/5 transition-colors shrink-0"
      >
        <Trash2 size={18} />
      </button>

      <div className="flex-1 flex items-center justify-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-red-500 font-mono text-sm tracking-wider font-bold">
          {formatTime(duration)}
        </span>
      </div>

      <button 
        onClick={stopAndSend}
        className="w-12 h-12 rounded-full flex items-center justify-center bg-brand-primary text-white shadow-lg shadow-brand-primary/40 hover:bg-brand-primary/80 transition-all shrink-0"
      >
        <Send size={20} className="translate-x-0.5 -translate-y-0.5" />
      </button>
    </div>
  );
}
