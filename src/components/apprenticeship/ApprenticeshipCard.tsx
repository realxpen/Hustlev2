import React from 'react';
import { motion } from 'motion/react';
import { Award, Users, BookOpen, Clock, ChevronRight } from 'lucide-react';
import { Apprenticeship } from '../../types/apprenticeship';

interface ApprenticeshipCardProps {
  program: Apprenticeship;
  onClick: () => void;
}

export function ApprenticeshipCard({ program, onClick }: ApprenticeshipCardProps) {
  const mentorName = program.mentor_profile?.hustle_name || program.mentor_profile?.full_name || 'Mentor';
  const mentorAvatar = program.mentor_profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${program.mentor_id}`;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full bg-[#1a1a1a] border border-white/5 rounded-3xl p-4 flex flex-col gap-4 text-left group transition-all hover:border-brand-primary/30"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-brand-primary/20 overflow-hidden">
            <img src={mentorAvatar} alt={mentorName} className="w-full h-full object-cover" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider">{mentorName}</h4>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{program.skill_area}</p>
          </div>
        </div>
        <div className="bg-brand-primary/10 text-brand-primary text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-brand-primary/20">
          Open Now
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-black text-white italic leading-tight group-hover:text-brand-primary transition-colors">
          {program.title}
        </h3>
        <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
          {program.description}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2">
        <div className="bg-white/5 rounded-2xl p-2.5 flex items-center gap-2">
          <BookOpen size={14} className="text-brand-primary" />
          <span className="text-[10px] font-black text-white/60 uppercase tracking-tight">Skill Path</span>
        </div>
        <div className="bg-white/5 rounded-2xl p-2.5 flex items-center gap-2">
          <Award size={14} className="text-brand-primary" />
          <span className="text-[10px] font-black text-white/60 uppercase tracking-tight">Certified</span>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-brand-primary">
        <span>Apply for Fellowship</span>
        <ChevronRight size={14} />
      </div>
    </motion.button>
  );
}
