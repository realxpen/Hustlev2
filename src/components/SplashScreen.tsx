import { motion } from "motion/react";
import { useEffect } from "react";

interface SplashScreenProps {
  onComplete: () => void;
  key?: string;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    // Auto-transition after 4 seconds if user doesn't tap
    const timer = setTimeout(() => {
      onComplete();
    }, 4500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: "easeInOut" }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#050505] cursor-pointer"
      onClick={onComplete}
      id="splash-container"
    >
      {/* Immersive UI Overlays */}
      <div className="grain-overlay" />
      <div className="absolute inset-10 border border-white/[0.03] pointer-events-none" />
      
      {/* Corners */}
      <div className="absolute top-[30px] left-[30px] w-5 h-5 border-t border-l border-white/10 pointer-events-none" />
      <div className="absolute top-[30px] right-[30px] w-5 h-5 border-t border-r border-white/10 pointer-events-none" />
      <div className="absolute bottom-[30px] left-[30px] w-5 h-5 border-b border-l border-white/10 pointer-events-none" />
      <div className="absolute bottom-[30px] right-[30px] w-5 h-5 border-b border-r border-white/10 pointer-events-none" />

      {/* Animated Background Glow */}
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-[100px]"
        />
      </div>

      {/* Brand Section */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.h1
          initial={{ opacity: 0, scale: 0.85, filter: "blur(12px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{
            duration: 2,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.3
          }}
          className="text-7xl md:text-[110px] font-display font-black tracking-[0.35em] text-white ml-[0.35em] drop-shadow-[0_0_60px_rgba(255,255,255,0.3)]"
          id="brand-logo"
        >
          HUSTLE
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 1.2 }}
          className="mt-12 flex flex-col items-center"
        >
          <p className="text-sm md:text-base font-sans font-light tracking-[0.5em] text-white/40 uppercase">
            Welcome to the economy of you
          </p>
          
          {/* Subtle progress indicator (optional but aesthetic) */}
          <div className="mt-12 w-12 h-[1px] bg-white/10 relative overflow-hidden">
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ 
                duration: 2.5, 
                repeat: Infinity, 
                ease: "linear",
                delay: 1.5
              }}
              className="absolute inset-0 bg-white/40"
            />
          </div>
        </motion.div>
      </div>

      {/* Tap to continue hint - extremely subtle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2.5 }}
        className="absolute bottom-20 text-[11px] uppercase tracking-[0.8em] text-white/15 font-light"
      >
        Tap anywhere to enter the marketplace
      </motion.div>
    </motion.div>
  );
}
