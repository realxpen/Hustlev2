import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Check, ChevronLeft, ArrowRight } from 'lucide-react';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { useOnboardingAPI } from '../../hooks/useOnboardingAPI';

const PRESET_SKILLS = [
  'Haircut',
  'Photography',
  'Plumbing',
  'Graphics Design',
  'Tailoring',
  'Makeup',
  'Mechanic',
  'Electrician',
  'UI/UX Design',
  'House Painting',
  'Fitness Coaching',
  'Catering',
  'Accounting',
  'Language Tutoring'
];

interface InterestsStepProps {
  onNext: () => void;
  onBack: () => void;
  key?: React.Key | string;
}

export function InterestsStep({ onNext, onBack }: InterestsStepProps) {
  const { interests, toggleInterest, setInterests } = useOnboardingStore();
  const { saveInterestsAPI } = useOnboardingAPI();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter skills based on search
  const filteredSkills = PRESET_SKILLS.filter(skill => 
    skill.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSkip = async () => {
    // Clear selections and continue
    setInterests([]);
    await saveInterestsAPI([]);
    onNext();
  };

  const handleContinue = async () => {
    await saveInterestsAPI(interests);
    onNext();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
      className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full h-full justify-between relative z-10"
      id="interests-step"
    >
      {/* Header and Search */}
      <div className="w-full flex flex-col flex-1">
        {/* Back and Title Row */}
        <div className="flex items-center justify-between mb-6 mt-4">
          <button 
            onClick={onBack} 
            className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/60 hover:text-white transition-all active-scale"
            id="interests-back-btn"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button 
            onClick={handleSkip}
            className="text-sm font-medium text-white/50 hover:text-white/90 active:scale-95 transition-all px-3 py-1"
            id="interests-skip-btn"
          >
            Skip
          </button>
        </div>

        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight font-display mb-2">What services do you need?</h2>
          <p className="text-white/40 text-sm leading-relaxed">
            Select skills you'd like to discover or find nearby. Click Skip if you want to browse everything.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/40">
            <Search className="w-5 h-5" />
          </div>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skills (e.g. plumbing, haircut)"
            className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-white/30 focus:bg-white/10 outline-none transition-all text-base font-medium"
            id="interests-search"
          />
        </div>

        {/* Chips Container */}
        <div className="flex-1 overflow-y-auto no-scrollbar max-h-[50vh] pr-1">
          <div className="flex flex-wrap gap-2.5">
            <AnimatePresence>
              {filteredSkills.map((skill, index) => {
                const isSelected = interests.includes(skill);
                return (
                  <motion.button
                    key={skill}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                    onClick={() => toggleInterest(skill)}
                    className={`h-12 px-4 rounded-xl text-sm font-medium transition-all duration-200 border flex items-center gap-2 relative overflow-hidden active-scale ${
                      isSelected 
                        ? 'bg-white text-black border-white font-bold shadow-[0_0_15px_rgba(255,255,255,0.15)]' 
                        : 'bg-white/5 border-white/10 text-white/80 hover:border-white/20 hover:bg-white/10'
                    }`}
                    id={`skill-chip-${skill.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-black stroke-[3px]" />}
                    <span>{skill}</span>
                  </motion.button>
                );
              })}
              
              {/* Fallback if typed search doesn't exist */}
              {filteredSkills.length === 0 && searchQuery.trim() !== '' && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => {
                    toggleInterest(searchQuery.trim());
                    setSearchQuery('');
                  }}
                  className="h-12 px-4 rounded-xl text-sm font-semibold border bg-brand-primary/10 border-brand-primary/30 text-brand-primary flex items-center gap-2 active-scale mt-2"
                  id="skill-custom-add"
                >
                  <span>Add "{searchQuery.trim()}"</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Action Area */}
      <div className="w-full pb-8 pt-4 mt-auto border-t border-white/5">
        <button 
          onClick={handleContinue}
          className="w-full h-14 bg-white text-black rounded-xl font-semibold flex items-center justify-center gap-3 hover:bg-white/95 transition-all text-base active-scale group"
          id="btn-interests-continue"
        >
          {interests.length > 0 ? (
            <>
              Continue ({interests.length} selected)
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          ) : (
            <>
              Skip Selection
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
