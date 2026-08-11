import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Users, CheckCircle2, Clock, 
  ChevronRight, X, UserPlus, BookOpen,
  CheckCircle, PlusCircle, Award
} from 'lucide-react';
import { useApprenticeshipStore } from '../../stores/useApprenticeshipStore';
import { useAuthStore } from '../../features/auth/stores/useAuthStore';
import { Apprenticeship, ApprenticeshipApplication } from '../../types/apprenticeship';
import { CreateApprenticeshipModal } from './CreateApprenticeshipModal';

export function MentorDashboard() {
  const { 
    myPrograms, fetchMyApprenticeships, 
    applications, getProgramApplications,
    respondToApplication, addMilestone,
    completeProgram
  } = useApprenticeshipStore();
  const { user } = useAuthStore();
  const [selectedProgram, setSelectedProgram] = useState<Apprenticeship | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: '', description: '' });

  useEffect(() => {
    if (user) fetchMyApprenticeships(user.id);
  }, [user]);

  const handleSelectProgram = async (program: Apprenticeship) => {
    setSelectedProgram(program);
    await getProgramApplications(program.id);
    setShowApplyModal(true);
  };

  const handleAddMilestone = async () => {
    if (!selectedProgram || !newMilestone.title) return;
    const success = await addMilestone(selectedProgram.id, {
      milestone_title: newMilestone.title,
      description: newMilestone.description
    });
    if (success) {
      setNewMilestone({ title: '', description: '' });
      // Refresh logic would go here if needed, or rely on store state
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Your Fellowships</h2>
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Manage your programs and talent</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="w-12 h-12 rounded-full bg-brand-primary flex items-center justify-center text-black shadow-lg hover:scale-105 active:scale-95 transition-transform"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {myPrograms.map(program => (
          <button
            key={program.id}
            onClick={() => handleSelectProgram(program)}
            className="bg-white/5 border border-white/5 rounded-[2rem] p-6 text-left hover:border-brand-primary/30 transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
               <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20">
                  <Users size={20} className="text-brand-primary" />
               </div>
               <div className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${
                 program.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                 program.status === 'completed' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                 'bg-white/10 text-white/40 border-white/20'
               }`}>
                 {program.status}
               </div>
            </div>
            <h3 className="text-lg font-black text-white italic group-hover:text-brand-primary transition-colors">{program.title}</h3>
            <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-1">{program.skill_area}</p>
            
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
               <div className="flex -space-x-2">
                 {[1,2,3].map(i => (
                   <div key={i} className="w-6 h-6 rounded-full border-2 border-[#121212] bg-zinc-800" />
                 ))}
               </div>
               <span className="text-[10px] font-black text-white/60">3 Applicants</span>
            </div>
          </button>
        ))}

        {myPrograms.length === 0 && (
          <div className="col-span-full py-20 bg-white/5 border border-white/5 border-dashed rounded-[3rem] flex flex-col items-center justify-center gap-4 text-center opacity-40">
             <BookOpen size={48} />
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest">No programs created yet</p>
                <p className="text-[8px] font-bold uppercase tracking-widest mt-1">Start mentoring to scale your hustle</p>
             </div>
          </div>
        )}
      </div>

      {/* Create Fellowship Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateApprenticeshipModal 
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Program Management Modal */}
      <AnimatePresence>
        {showApplyModal && selectedProgram && (
           <div className="fixed inset-0 z-[110] flex items-end justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowApplyModal(false)}
               className="absolute inset-0 bg-black/90 backdrop-blur-md"
             />
             <motion.div
               initial={{ y: "100%" }}
               animate={{ y: 0 }}
               exit={{ y: "100%" }}
               className="relative w-full max-w-xl bg-[#0f0f0f] rounded-[2.5rem] border border-white/10 overflow-hidden flex flex-col max-h-[85vh]"
             >
               <div className="p-8 border-b border-white/10 shrink-0 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-white italic uppercase">{selectedProgram.title}</h3>
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-1">Status: {selectedProgram.status}</p>
                  </div>
                  <button onClick={() => setShowApplyModal(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white">
                    <X size={20} />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto no-scrollbar p-8 pt-6">
                  <div className="space-y-10">
                    
                    {/* Active Learner or Applications */}
                    {selectedProgram.status === 'pending' ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                           <UserPlus size={16} className="text-brand-primary" />
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Open Applications</h4>
                        </div>
                        <div className="space-y-3">
                          {applications.map(app => (
                            <div key={app.id} className="bg-white/5 rounded-3xl p-5 border border-white/5 flex flex-col gap-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-zinc-800" />
                                  <div className="flex-1">
                                     <h5 className="text-xs font-black text-white uppercase italic">{app.applicant_profile?.hustle_name || 'Hustler'}</h5>
                                     <p className="text-[8px] text-white/40 font-black uppercase tracking-widest">Applicant Profile</p>
                                  </div>
                               </div>
                               <p className="text-xs text-white/60 italic leading-relaxed bg-black/20 p-4 rounded-2xl">
                                  "{app.message || 'No message provided'}"
                                </p>
                               <div className="flex gap-2">
                                  <button 
                                    onClick={() => respondToApplication(app.id, 'accepted')}
                                    className="flex-1 h-12 bg-brand-primary text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                  >
                                    Accept
                                  </button>
                                  <button 
                                    onClick={() => respondToApplication(app.id, 'rejected')}
                                    className="px-6 h-12 bg-white/5 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all"
                                  >
                                    Decline
                                  </button>
                               </div>
                            </div>
                          ))}
                          {applications.length === 0 && (
                            <div className="py-10 text-center opacity-20">
                               <p className="text-[10px] font-black uppercase tracking-widest italic">Waiting for talent to apply...</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-8">
                         {/* Milestone Builder */}
                         <div className="space-y-4">
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-2 text-brand-primary">
                                  <CheckCircle2 size={16} />
                                  <h4 className="text-[10px] font-black uppercase tracking-widest">Milestones & Progress</h4>
                               </div>
                            </div>
                            
                            {/* Add New Milestone */}
                            <div className="bg-white/5 rounded-3xl p-5 border border-white/5 space-y-4">
                               <div className="space-y-2">
                                  <input 
                                    type="text" 
                                    placeholder="Milestone Title (e.g. Master Basics)"
                                    value={newMilestone.title}
                                    onChange={e => setNewMilestone({...newMilestone, title: e.target.value})}
                                    className="w-full bg-black/20 border border-white/10 rounded-2xl p-3 text-xs text-white focus:outline-none italic"
                                  />
                                  <textarea 
                                    placeholder="Brief task description..."
                                    value={newMilestone.description}
                                    onChange={e => setNewMilestone({...newMilestone, description: e.target.value})}
                                    className="w-full bg-black/20 border border-white/10 rounded-2xl p-3 text-xs text-white focus:outline-none italic min-h-[80px] resize-none"
                                  />
                               </div>
                               <button 
                                 onClick={handleAddMilestone}
                                 className="w-full h-10 bg-white/5 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-black transition-all flex items-center justify-center gap-2"
                               >
                                  <PlusCircle size={14} />
                                  Deploy Milestone
                               </button>
                            </div>
                         </div>

                         {/* Complete Program Control */}
                         {selectedProgram.status === 'active' && (
                            <div className="pt-6 border-t border-white/5">
                               <button 
                                 onClick={() => completeProgram(selectedProgram.id)}
                                 className="w-full h-16 bg-brand-primary/10 border-2 border-brand-primary text-brand-primary rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-brand-primary hover:text-black transition-all shadow-[0_0_30px_rgba(var(--brand-primary-rgb),0.1)]"
                               >
                                  <Award size={20} />
                                  Finalize & Certify Learner
                               </button>
                               <p className="text-center text-[8px] font-bold text-white/20 uppercase tracking-widest mt-4">Issuing certification is permanent and on-chain verifiable</p>
                            </div>
                         )}
                      </div>
                    )}
                  </div>
               </div>
             </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
}
