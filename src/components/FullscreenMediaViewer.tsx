import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ZoomIn, ZoomOut, RotateCcw, Maximize2, Move } from "lucide-react";

interface FullscreenMediaViewerProps {
  url: string;
  type: "image" | "video";
  caption?: string;
  onClose: () => void;
}

export default function FullscreenMediaViewer({
  url,
  type,
  caption,
  onClose,
}: FullscreenMediaViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement>(null);

  // Multi-touch references
  const startDistanceRef = useRef<number | null>(null);
  const startScaleRef = useRef<number>(1);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Reset positioning on scale = 1
  useEffect(() => {
    if (scale <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch to Zoom initial calculations
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      startDistanceRef.current = dist;
      startScaleRef.current = scale;
    } else if (e.touches.length === 1) {
      // Single touch to Pan
      isDraggingRef.current = true;
      const t = e.touches[0];
      dragStartRef.current = {
        x: t.clientX - position.x,
        y: t.clientY - position.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && startDistanceRef.current !== null) {
      // Pinching
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const calculatedScale = startScaleRef.current * (dist / startDistanceRef.current);
      setScale(Math.max(1, Math.min(5, calculatedScale)));
    } else if (e.touches.length === 1 && isDraggingRef.current && scale > 1) {
      // Panning
      const t = e.touches[0];
      const newX = t.clientX - dragStartRef.current.x;
      const newY = t.clientY - dragStartRef.current.y;

      // Restrict range based on scale
      const maxOffsetWidth = ((scale - 1) * window.innerWidth) / 2;
      const maxOffsetHeight = ((scale - 1) * window.innerHeight) / 2;

      setPosition({
        x: Math.max(-maxOffsetWidth, Math.min(maxOffsetWidth, newX)),
        y: Math.max(-maxOffsetHeight, Math.min(maxOffsetHeight, newY)),
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      startDistanceRef.current = null;
    }
    if (e.touches.length === 0) {
      isDraggingRef.current = false;
    }
  };

  // Mouse handlers for desktop Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      e.preventDefault();
      isDraggingRef.current = true;
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current && scale > 1) {
      e.preventDefault();
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;

      const maxOffsetWidth = ((scale - 1) * window.innerWidth) / 2;
      const maxOffsetHeight = ((scale - 1) * window.innerHeight) / 2;

      setPosition({
        x: Math.max(-maxOffsetWidth, Math.min(maxOffsetWidth, newX)),
        y: Math.max(-maxOffsetHeight, Math.min(maxOffsetHeight, newY)),
      });
    }
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  // Wheel Zoom for desktop
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomIntensity = 0.05;
    const delta = e.deltaY < 0 ? 1 : -1;
    const nextScale = scale + delta * zoomIntensity;
    setScale(Math.max(1, Math.min(5, nextScale)));
  };

  const handleDoubleTap = () => {
    if (scale > 1) {
      setScale(1);
    } else {
      setScale(2.5);
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(5, prev + 0.5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(1, prev - 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  // Prevent parent scroll & background touch issues
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onWheel={handleWheel}
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center backdrop-blur-md select-none touch-none overflow-hidden"
    >
      {/* Top Banner Control Panel */}
      <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-xs uppercase tracking-widest font-mono">
            Full Viewer
          </span>
          {scale > 1 && (
            <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded-full text-white/90 font-mono">
              {scale.toFixed(1)}x
            </span>
          )}
        </div>

        {/* Action button controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/15 transition-all active:scale-90"
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/15 transition-all active:scale-90"
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
          <button
            onClick={handleRotate}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/15 transition-all active:scale-90"
            title="Rotate"
          >
            <RotateCcw size={18} />
          </button>
          {(scale > 1 || rotation !== 0) && (
            <button
              onClick={handleReset}
              className="text-xs text-white/60 hover:text-white bg-white/5 px-3 h-10 rounded-xl border border-white/10 hover:bg-white/15 font-mono transition-all"
            >
              Reset
            </button>
          )}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 transition-all active:scale-90 ml-2 shadow-lg"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div
        className="relative w-full h-full flex items-center justify-center p-4 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onDoubleClick={handleDoubleTap}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transition: isDraggingRef.current ? "none" : "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          className="max-w-full max-h-full flex items-center justify-center select-none"
        >
          {type === "image" ? (
            <img
              ref={mediaRef as React.RefObject<HTMLImageElement>}
              src={url}
              alt="Full view"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl pointer-events-none"
              referrerPolicy="no-referrer"
            />
          ) : (
            <video
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={url}
              controls
              autoPlay
              playsInline
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          )}
        </div>

        {/* Interactive hints */}
        {scale === 1 && (
          <div className="absolute bottom-24 bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 text-white/50 text-[10px] tracking-wide uppercase font-mono shadow-md animate-bounce pointer-events-none">
            <Maximize2 size={12} className="text-white/60 animate-pulse" />
            <span>Pinch to Zoom • Double Click</span>
          </div>
        )}

        {scale > 1 && (
          <div className="absolute bottom-24 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full flex items-center gap-2 text-white/80 text-[10px] tracking-wide uppercase font-mono shadow-md pointer-events-none">
            <Move size={12} className="text-brand-primary animate-pulse" />
            <span>Drag to Explore / Scroll Wheel to Zoom</span>
          </div>
        )}
      </div>

      {/* Bottom Info Bar Overlay */}
      {caption && (
        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-black/80 to-transparent flex items-end px-6 pb-6 pointer-events-none z-10">
          <p className="text-white/80 text-sm font-light max-w-xl line-clamp-2 leading-relaxed drop-shadow-md">
            {caption}
          </p>
        </div>
      )}
    </motion.div>
  );
}
