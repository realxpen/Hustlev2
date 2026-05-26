import React from 'react';
import { motion } from 'motion/react';
import { User, Zap, Briefcase, ChevronLeft, ArrowRight } from 'lucide-react';
import { useOnboardingStore } from '../../stores/useOnboardingStore';

const ROLES = [
  { id: 'client', label: 'Client', description: 'I want to hire talent and find services.', icon: User },
  { id: 'hustler', label: 'Hustler', description: 'I offer services and want to monetize my skills.', icon: Zap },
  { id: 'both', label: 'Both', description: 'I want to both hire and offer services.', icon: Briefcase },
] as const;

export function RoleStep({ onNext, onBack }: { onNext: () => void, onBack: () => void, key?: React.Key }) {
  const { role, setRole } = useOnboardingStore();

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="flex-1 flex flex-col p-6 max-w-lg mx-auto w-full relative z-10"
    >
      <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors mb-8 mt-4">
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <div className="mb-10">
        <h2 className="text-3xl font-bold tracking-tight mb-2">How will you use Hustle?</h2>
        <p className="text-white/40">Choose your primary mode. You can change this later.</p>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        {ROLES.map((r, i) => {
          const isSelected = role === r.id;
          const Icon = r.icon;
          return (
            <motion.button
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              onClick={() => {
                setRole(r.id);
                onNext();
              }}
              className={`p-6 rounded-2xl border text-left flex items-start gap-4 transition-all duration-300 ${isSelected ? 'bg-white/10 border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.05)]' : 'bg-transparent border-white/5 hover:bg-white/5'}`}
            >
              <div className={`p-3 rounded-xl ${isSelected ? 'bg-white text-black' : 'bg-white/5 text-white/50'}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold text-lg mb-1 ${isSelected ? 'text-white' : 'text-white/80'}`}>{r.label}</h3>
                <p className="text-sm text-white/40">{r.description}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      <motion.button 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        onClick={onNext}
        disabled={!role}
        className="w-full h-14 bg-white text-black rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] mt-8"
      >
        Continue <ArrowRight className="w-5 h-5" />
      </motion.button>
    </motion.div>
  );
}
