import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Award, BookOpen, CheckCircle, Clock, 
  ChevronRight, Bookmark, Star, Zap,
  ExternalLink, ShieldCheck
} from 'lucide-react';
import { useApprenticeshipStore } from '../../stores/useApprenticeshipStore';
import { useAuthStore } from '../../features/auth/stores/useAuthStore';
import { supabase } from '../../lib/supabase';

export function LearnerWorkspace() {
  const { 
    myApprenticeships, fetchMyApprenticeships,
    certifications, fetchCertifications,
    updateMilestone
  } = useApprenticeshipStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'programs' | 'certifications'>('programs');
  const [milestones, setMilestones] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchMyApprenticeships(user.id);
      fetchCertifications(user.id);
    }
  }, [user]);

  // Fetch milestones for active programs
  useEffect(() => {
    const fetchMilestones = async () => {
      if (!myApprenticeships.length) return;
      
      const sessionIds = myApprenticeships
        .filter(a => a.status === 'active')
        .map(a => a.id);
      
      if (!sessionIds.length) return;

      const { data } = await (supabase as any)
        .from('apprenticeship_progress')
        .select('*')
        .in('apprenticeship_id', sessionIds)
        .order('order', { ascending: true });
      
      setMilestones(data || []);
    };

    fetchMilestones();
  }, [myApprenticeships]);

  const toggleMilestone = async (id: string, currentStatus: boolean) => {
    const success = await updateMilestone(id, !currentStatus);
    if (success) {
      setMilestones(prev => 
        prev.map(m => m.id === id ? { ...m, completion_status: !currentStatus } : m)
      );
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Your Journey</h2>
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Level up through real-world mentorship</p>
        </div>
        <div className="flex bg-white/5 rounded-full p-1 border border-white/5 shadow-xl">
           <button 
             onClick={() => setActiveTab('programs')}
             className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'programs' ? 'bg-brand-primary text-black' : 'text-white/40 hover:text-white'}`}
           >
             Learning
           </button>
           <button 
             onClick={() => setActiveTab('certifications')}
             className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'certifications' ? 'bg-brand-primary text-black' : 'text-white/40 hover:text-white'}`}
           >
             Credentials
           </button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {activeTab === 'programs' ? (
          <>
            {myApprenticeships.map(apprenticeship => (
              <div 
                 key={apprenticeship.id}
                 className="bg-[#121212] rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col"
              >
                 <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-14 h-14 rounded-2xl bg-zinc-800 border-2 border-brand-primary/20 p-1">
                          <img 
                            src={apprenticeship.mentor_profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${apprenticeship.mentor_id}`} 
                            alt="Mentor" 
                            className="w-full h-full object-cover rounded-xl"
                          />
                       </div>
                       <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-white/40">Active Mentorship</p>
                          <h3 className="text-xl font-black text-white italic truncate max-w-[200px]">{apprenticeship.title}</h3>
                       </div>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                          apprenticeship.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                       }`}>
                          {apprenticeship.status}
                       </span>
                    </div>
                 </div>

                 <div className="p-8 space-y-6">
                    <div className="flex items-center gap-3">
                       <Zap size={16} className="text-brand-primary" />
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-white font-italic">Knowledge Path</h4>
                    </div>
                    
                    <div className="space-y-3">
                       {milestones
                         .filter(m => m.apprenticeship_id === apprenticeship.id)
                         .map(milestone => (
                           <button 
                             key={milestone.id}
                             onClick={() => toggleMilestone(milestone.id, milestone.completion_status)}
                             className={`w-full p-4 rounded-3xl border flex items-center gap-4 transition-all text-left ${
                               milestone.completion_status 
                                ? 'bg-brand-primary/10 border-brand-primary/20' 
                                : 'bg-white/5 border-white/5 hover:border-white/10'
                             }`}
                           >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                                milestone.completion_status 
                                 ? 'bg-brand-primary border-brand-primary/40 text-black' 
                                 : 'border-white/20 text-white/20'
                              }`}>
                                <CheckCircle size={14} />
                              </div>
                              <div className="flex-1">
                                 <h5 className={`text-xs font-black uppercase italic tracking-tighter ${milestone.completion_status ? 'text-white' : 'text-white/40'}`}>
                                   {milestone.milestone_title}
                                 </h5>
                                 {milestone.description && (
                                   <p className="text-[10px] text-white/30 font-medium mt-0.5 line-clamp-1">{milestone.description}</p>
                                 )}
                              </div>
                           </button>
                         ))}
                       {milestones.filter(m => m.apprenticeship_id === apprenticeship.id).length === 0 && (
                         <div className="py-6 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-20">
                            <p className="text-[8px] font-black uppercase tracking-widest">Awaiting milestones from mentor</p>
                         </div>
                       )}
                    </div>
                 </div>
              </div>
            ))}

            {myApprenticeships.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center gap-6 opacity-30 text-center">
                 <div className="w-20 h-20 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center">
                    <BookOpen size={32} />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest italic">No active apprenticeships</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest mt-1">Explore programs to begin your training</p>
                 </div>
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 gap-4">
             {certifications.map(cert => (
               <div key={cert.id} className="relative group">
                  <div className="absolute inset-0 bg-brand-primary/10 blur-[40px] rounded-full group-hover:bg-brand-primary/20 transition-all opacity-50" />
                  <div className="relative bg-[#1a1a1a] border border-brand-primary/30 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-8 overflow-hidden shadow-2xl">
                     <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Award size={120} />
                     </div>
                     
                     <div className="w-24 h-24 rounded-full bg-brand-primary flex items-center justify-center text-black shrink-0 shadow-[0_0_40px_rgba(var(--brand-primary-rgb),0.3)]">
                        <Award size={48} />
                     </div>
                     
                     <div className="flex-1 text-center md:text-left">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary mb-1">Official Credential</p>
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">{cert.certificate_title}</h3>
                        <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">
                          Completed on {new Date(cert.issued_at).toLocaleDateString()}
                        </p>
                        
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
                           <div className="bg-white/5 px-3 py-1.5 rounded-full border border-white/5 flex items-center gap-2">
                              <ShieldCheck size={12} className="text-brand-primary" />
                              <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Verified: {cert.verification_code}</span>
                           </div>
                           <button className="flex items-center gap-2 text-[9px] font-black text-brand-primary uppercase tracking-widest hover:underline transition-all">
                              <ExternalLink size={12} />
                              Share Portfolio
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
             ))}
             {certifications.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center gap-6 opacity-30 text-center">
                   <div className="w-20 h-20 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center">
                      <Award size={32} />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-widest italic">Complete a program to earn your badge of honor</p>
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
