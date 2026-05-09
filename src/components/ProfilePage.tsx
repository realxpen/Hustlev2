import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Star, MapPin, CheckCircle2, MessageSquare, MoreHorizontal, Grid, Briefcase, MessageCircle, Info, Calendar, ShieldCheck, ShieldAlert, Heart } from "lucide-react";
import { useState } from "react";
import BookingFlow from "./BookingFlow";
import ReportSheet from "./ReportSheet";

interface ProfilePageProps {
  hustler: any;
  onBack: () => void;
}

export default function ProfilePage({ hustler, onBack }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState("work");
  const [showBooking, setShowBooking] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const tabs = [
    { id: "work", label: "Work", icon: <Grid size={16} /> },
    { id: "services", label: "Services", icon: <Briefcase size={16} /> },
    { id: "reviews", label: "Reviews", icon: <MessageCircle size={16} /> },
    { id: "about", label: "About", icon: <Info size={16} /> }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[60] bg-[#050505] overflow-y-auto no-scrollbar pb-32"
    >
      <div className="grain-overlay pointer-events-none" />

      {/* Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 pt-12 pb-4 bg-gradient-to-b from-black/80 to-transparent">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 text-white"
        >
          <ChevronLeft size={20} />
        </button>
        <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 text-white">
          <MoreHorizontal size={20} />
        </button>
      </header>

      {/* Identity Section */}
      <section className="relative pt-32 px-6 flex flex-col items-center text-center">
        <div className="relative mb-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-28 h-28 rounded-full border-4 border-white/10 overflow-hidden bg-white/5 relative z-10"
          >
            <div className="w-full h-full flex items-center justify-center text-4xl font-display font-black text-white/20">
              {hustler.creator.name[0]}
            </div>
            {hustler.creator.active && (
              <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-[#050505] z-20" />
            )}
          </motion.div>
          {/* Animated Halo */}
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 bg-white rounded-full blur-2xl -z-0"
          />
        </div>

        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-display font-black tracking-tight flex items-center gap-2"
        >
          {hustler.creator.name}
          {hustler.creator.verified && <CheckCircle2 size={24} className="text-blue-400" />}
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-white/60 font-medium tracking-wide mt-1"
        >
          {hustler.creator.category}
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-2 mt-2 text-white/40 text-xs uppercase tracking-widest font-bold"
        >
          <MapPin size={12} />
          {hustler.creator.location}
        </motion.div>

        {/* Trust & Verification Strip */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="grid grid-cols-2 gap-3 w-full mt-8"
        >
           <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                 <CheckCircle2 size={16} />
              </div>
              <div className="text-left">
                 <p className="text-[8px] text-white/20 font-black uppercase tracking-widest">Repeat Clients</p>
                 <p className="text-[10px] font-bold">42 Regulars</p>
              </div>
           </div>
           <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                 <ShieldCheck size={16} />
              </div>
              <div className="text-left">
                 <p className="text-[8px] text-white/20 font-black uppercase tracking-widest">Verified Pro</p>
                 <p className="text-[10px] font-bold">Identity Confirmed</p>
              </div>
           </div>
        </motion.div>

        {/* Trust Signal Layer */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-3 gap-8 w-full max-w-sm mt-8 border-y border-white/5 py-6"
        >
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-white font-bold text-lg">
              <Star size={14} className="text-yellow-500 fill-yellow-500" />
              {hustler.creator.rating}
            </div>
            <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold mt-1">Rating</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-white font-bold text-lg">{hustler.creator.jobs}</span>
            <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold mt-1">Jobs</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-white font-bold text-lg">98%</span>
            <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold mt-1">Trust</span>
          </div>
        </motion.div>
      </section>

      {/* Tabs Navigation */}
      <nav className="mt-8 px-6 flex justify-between border-b border-white/5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-2 pb-4 px-2 relative transition-all ${activeTab === tab.id ? 'text-white' : 'text-white/30'}`}
          >
            {tab.icon}
            <span className="text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-white"
              />
            )}
          </button>
        ))}
      </nav>

      {/* Content Area */}
      <div className="px-6 mt-8">
        <AnimatePresence mode="wait">
          {activeTab === "work" && (
            <motion.div
              key="work"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-2 gap-4"
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 border border-white/10 overflow-hidden relative group">
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                   <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${i % 2 === 0 ? 'from-blue-500' : 'from-purple-500'} to-transparent`} />
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === "services" && (
            <motion.div
              key="services"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4"
            >
              {[
                { name: "Full Product Design", price: "$499", time: "5-7 days" },
                { name: "UI/UX Consultation", price: "$99", time: "1 hour" },
                { name: "Brand Identity", price: "$1,200", time: "2 weeks" }
              ].map((service, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center group hover:bg-white/10 transition-colors">
                  <div>
                    <h3 className="font-bold text-white text-lg">{service.name}</h3>
                    <div className="flex gap-4 mt-2">
                       <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Starting at {service.price}</span>
                       <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">• {service.time}</span>
                    </div>
                  </div>
                  <ChevronLeft size={20} className="text-white/20 rotate-180" />
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === "reviews" && (
            <motion.div
              key="reviews"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6"
            >
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/10" />
                        <span className="font-bold text-sm">Client Name</span>
                     </div>
                     <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => <Star key={s} size={10} className="text-yellow-500 fill-yellow-500" />)}
                     </div>
                  </div>
                  <p className="text-sm text-white/60 font-light leading-relaxed">
                    "Marcus delivered an exceptional piece of work. The attention to detail and the way he understood our brand vision was impressive."
                  </p>
                  <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold">2 weeks ago • Visual Design</span>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === "about" && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-8"
            >
              <div>
                <h3 className="text-sm uppercase tracking-widest font-bold text-white/30 mb-4">Bio</h3>
                <p className="text-white/80 leading-relaxed font-light">
                  Passionate about building intuitive digital experiences that push boundaries. With over 8 years of experience in the design industry, I've worked with startups and Fortune 500 companies alike to deliver award-winning products.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm uppercase tracking-widest font-bold text-white/30 mb-2 font-display">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {["UI Design", "UX Research", "Figma", "Branding"].map(tag => (
                      <span key={tag} className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded text-white/60">{tag}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm uppercase tracking-widest font-bold text-white/30 mb-2 font-display">Language</h3>
                   <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded text-white/60">English, Spanish</span>
                </div>
              </div>

              {/* Identity Evolution Layer - Social Proof */}
              <section className="mb-8">
                 <h3 className="text-sm uppercase tracking-widest font-bold text-white/30 mb-4 font-display">Community Trust</h3>
                 <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col gap-5">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                             <History size={14} />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest">Active Partner</span>
                       </div>
                       <span className="text-[9px] text-white/20 font-bold uppercase">2+ Years</span>
                    </div>
                    <div className="h-[1px] bg-white/5" />
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Jobs Completed</p>
                          <p className="text-sm font-black mt-1">142</p>
                       </div>
                       <div>
                          <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Bookings Made</p>
                          <p className="text-sm font-black mt-1">58</p>
                       </div>
                    </div>
                 </div>
              </section>

              {/* Safety & Report Layer */}
              <section className="mt-8 p-10 rounded-[40px] bg-white/[0.02] border border-white/5 text-center">
                 <div className="flex items-center justify-center gap-2 mb-4 opacity-30">
                    <ShieldCheck size={16} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Hustle Shield Active</span>
                 </div>
                 <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest leading-relaxed mb-8">
                    Interacting with {hustler.creator.name} is covered by our end-to-end payment escrow and identity protection.
                 </p>
                 <button 
                   onClick={() => setShowReport(true)}
                   className="flex items-center gap-2 mx-auto text-red-500/40 hover:text-red-500 transition-colors text-[9px] font-black uppercase tracking-widest mt-4"
                 >
                    <ShieldAlert size={14} />
                    Report Account
                 </button>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed Bottom CTA Bar */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 z-50">
        <div className="max-w-md mx-auto flex gap-3 h-14">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowBooking(true)}
            className="flex-1 bg-white text-black font-black uppercase tracking-widest text-[11px] rounded-xl flex items-center justify-center gap-2 shadow-2xl"
          >
            <Calendar size={16} />
            Book Service
          </motion.button>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            className="w-14 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center text-white"
          >
            <MessageSquare size={20} />
          </motion.button>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            className="w-14 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center text-white"
          >
            <MoreHorizontal size={20} />
          </motion.button>
        </div>
      </footer>

      {/* Booking Flow Overlay */}
      <AnimatePresence>
        {showBooking && (
          <BookingFlow 
            hustler={hustler} 
            onClose={() => setShowBooking(false)} 
          />
        )}
      </AnimatePresence>

      {/* Report Sheet Overlay */}
      <AnimatePresence>
        {showReport && (
          <ReportSheet 
             entityName={hustler.creator.name} 
             onClose={() => setShowReport(false)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
