import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, 
  Heart, 
  UserPlus, 
  MessageSquare, 
  Calendar, 
  Wallet, 
  ShieldCheck, 
  TrendingUp, 
  ChevronRight,
  X,
  Clock,
  Sparkles
} from "lucide-react";
import { useState } from "react";

type NotificationType = "BOOKING" | "TRANSACTION" | "SOCIAL" | "SYSTEM";
type Priority = "HIGH" | "MEDIUM" | "LOW";

interface Notification {
  id: string;
  type: NotificationType;
  priority: Priority;
  title: string;
  message: string;
  time: string;
  read: boolean;
  meta?: any;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "BOOKING",
    priority: "HIGH",
    title: "Booking Confirmed",
    message: "Marcus V. has accepted your UI/UX deep dive request. Work starts tomorrow.",
    time: "2m ago",
    read: false,
    meta: { status: "confirmed" }
  },
  {
    id: "n2",
    type: "TRANSACTION",
    priority: "HIGH",
    title: "Funds Secured",
    message: "$99.00 has been safely locked in escrow for your logo animation job.",
    time: "15m ago",
    read: false,
    meta: { amount: "$99.00" }
  },
  {
    id: "n3",
    type: "SOCIAL",
    priority: "LOW",
    title: "Work Interaction",
    message: "Chioma Z. and 12 others liked your latest Street Style post.",
    time: "1h ago",
    read: true
  },
  {
    id: "n4",
    type: "SOCIAL",
    priority: "MEDIUM",
    title: "New Follower",
    message: "Ayo B. just followed you. They are a Native Tailor nearby.",
    time: "2h ago",
    read: true
  }
];

const ACTIVITY_FEED = [
  { id: "a1", type: "BOOKING", text: "New job completed nearby in 'Hair Styling'", time: "Just now" },
  { id: "a2", type: "HUSTLER", text: "Chioma Z. is now trending in your area", time: "5m ago" },
  { id: "a3", type: "CONTENT", text: "New local talent 'Lagos Dev' just posted their first work", time: "12m ago" }
];

export default function ActivityCenter({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"updates" | "activity">("updates");

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed inset-0 z-[90] bg-[#050505] text-white flex flex-col pt-12"
    >
      <div className="grain-overlay pointer-events-none" />

      {/* Header */}
      <header className="px-6 pb-6 flex items-center justify-between border-b border-white/5 bg-gradient-to-b from-black/40 to-transparent">
        <div>
           <h2 className="text-xl font-display font-black tracking-[0.2em] uppercase">Activity Hub</h2>
           <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Updates & Local Vibrations</p>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </header>

      {/* Navigation Tabs */}
      <div className="flex px-6 pt-6 gap-8 border-b border-white/5">
         <button 
           onClick={() => setActiveTab("updates")}
           className={`pb-4 text-[10px] font-black uppercase tracking-widest relative transition-colors ${activeTab === 'updates' ? 'text-white' : 'text-white/30'}`}
         >
            Updates
            {activeTab === "updates" && (
              <motion.div layoutId="activeActivityTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
            )}
         </button>
         <button 
           onClick={() => setActiveTab("activity")}
           className={`pb-4 text-[10px] font-black uppercase tracking-widest relative transition-colors ${activeTab === 'activity' ? 'text-white' : 'text-white/30'}`}
         >
            Local Live
            {activeTab === "activity" && (
              <motion.div layoutId="activeActivityTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
            )}
         </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 no-scrollbar pb-32">
        <AnimatePresence mode="wait">
          {activeTab === "updates" ? (
            <motion.div
              key="updates-list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4"
            >
              {MOCK_NOTIFICATIONS.map((notif) => (
                <div 
                  key={notif.id}
                  className={`p-5 rounded-3xl border transition-all relative overflow-hidden group ${
                    notif.priority === 'HIGH' 
                    ? 'bg-white/[0.06] border-white/20' 
                    : 'bg-white/[0.03] border-white/5'
                  } ${!notif.read ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                >
                  {/* Priority Indicator */}
                  {!notif.read && notif.priority === 'HIGH' && (
                     <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-bl-lg" />
                  )}

                  <div className="flex gap-4">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        notif.type === 'BOOKING' ? 'bg-blue-500/10 text-blue-400' :
                        notif.type === 'TRANSACTION' ? 'bg-emerald-500/10 text-emerald-400' :
                        notif.type === 'SOCIAL' ? 'bg-purple-500/10 text-purple-400' :
                        'bg-white/10 text-white'
                     }`}>
                        {notif.type === 'BOOKING' && <Calendar size={20} />}
                        {notif.type === 'TRANSACTION' && <ShieldCheck size={20} />}
                        {notif.type === 'SOCIAL' && <Heart size={20} />}
                        {notif.type === 'SYSTEM' && <Bell size={20} />}
                     </div>

                     <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex justify-between items-start mb-1">
                           <h4 className="font-bold text-sm tracking-tight">{notif.title}</h4>
                           <span className="text-[9px] text-white/20 font-bold uppercase whitespace-nowrap">{notif.time}</span>
                        </div>
                        <p className="text-[11px] text-white/40 font-light leading-relaxed mb-3">
                           {notif.message}
                        </p>
                        
                        {notif.priority === 'HIGH' && (
                           <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-white/60 hover:bg-white/10 transition-colors">
                              View Update <ChevronRight size={10} />
                           </button>
                        )}
                     </div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="activity-feed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6"
            >
               {/* Real-time Ticker Style Feed */}
               <div className="flex flex-col gap-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 ml-1 mb-2">Live Vibes</h4>
                  {ACTIVITY_FEED.map((activity) => (
                     <div key={activity.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:bg-white/[0.04] transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                           <p className="text-[11px] font-medium text-white/60 leading-tight">
                              {activity.text}
                           </p>
                        </div>
                        <span className="text-[8px] text-white/10 font-bold uppercase whitespace-nowrap ml-4">{activity.time}</span>
                     </div>
                  ))}
               </div>

               {/* Discovery Insights Card */}
               <div className="p-8 rounded-[40px] bg-gradient-to-br from-blue-500/5 to-transparent border border-blue-500/10 text-center relative overflow-hidden mt-6">
                  <motion.div 
                     animate={{ rotate: 360 }}
                     transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                     className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 blur-3xl"
                  />
                  <Sparkles size={24} className="mx-auto text-blue-400/40 mb-4" />
                  <h4 className="text-sm font-display font-black tracking-widest uppercase text-white/40 mb-2">Hustle Intelligence</h4>
                  <p className="text-white/20 text-[11px] font-light leading-relaxed max-w-[200px] mx-auto uppercase tracking-wide">
                     Creatives in your area are seeing a 30% increase in bookings this week. Now is the perfect time to update your work.
                  </p>
                  <button className="mt-8 px-6 py-3 bg-white/[0.03] border border-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                     Learn More
                  </button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
