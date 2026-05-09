import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface EntryTransitionProps {
  onComplete: () => void;
  key?: string;
}

const loadingTexts = [
  "Finding real hustlers near you...",
  "Preparing your personalized feed...",
  "Gathering local talent...",
  "Securing your marketplace experience..."
];

export default function EntryTransition({ onComplete }: EntryTransitionProps) {
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const textInterval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 800);

    const timer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(timer);
      clearInterval(textInterval);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] p-6 text-center"
      id="entry-transition"
    >
      <div className="grain-overlay" />
      
      {/* Subtle background pulse */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-[400px] h-[400px] bg-white/[0.03] rounded-full blur-[80px]"
      />

      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-display font-medium tracking-widest text-white/90">
            Welcome to Hustle
          </h2>
        </motion.div>

        {/* Elegant spinner */}
        <div className="relative w-12 h-12 mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-full h-full border-t border-r border-white/20 border-l border-transparent border-b border-transparent rounded-full shadow-[0_0_15px_rgba(255,255,255,0.05)]"
          />
        </div>

        <motion.p
          key={textIndex}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="text-white/40 text-sm font-light tracking-wide max-w-[200px]"
        >
          {loadingTexts[textIndex]}
        </motion.p>
      </div>
    </motion.div>
  );
}
