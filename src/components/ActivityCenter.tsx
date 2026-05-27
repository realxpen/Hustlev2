import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, 
  Heart, 
  UserPlus, 
  MessageSquare, 
  Calendar, 
  Wallet, 
  ShieldCheck, 
  ChevronRight,
  X,
  Settings,
  Phone,
  AlertCircle,
  Moon,
  VolumeX,
  Filter,
  CheckCircle2,
  MessageCircle,
  Briefcase,
  ExternalLink,
  Navigation
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNotificationStore } from '../features/feed/stores/useNotificationStore';
import { formatDistanceToNow } from 'date-fns';

type Priority = "HIGH" | "MEDIUM" | "LOW";
type Category = "ALL" | "BOOKINGS" | "PAYMENTS" | "MESSAGES" | "MENTIONS" | "SYSTEM";

interface Notification {
  id: string;
  category: Category;
  priority: Priority;
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionText?: string;
  avatar?: string;
  isGrouped?: boolean;
  targetId?: string | number;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    category: "PAYMENTS",
    priority: "HIGH",
    title: "Escrow Released",
    message: "$2,400 has been released to your wallet for 'UX Design Project'.",
    time: "2m ago",
    read: false,
    actionText: "View Wallet",
    avatar: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=100&h=100&fit=crop"
  },
  {
    id: "n2",
    category: "BOOKINGS",
    priority: "HIGH",
    title: "Milestone Approval",
    message: "Client needs approval on Milestone 2: Wireframes.",
    time: "15m ago",
    read: false,
    actionText: "Approve Milestone",
  },
  {
    id: "n3",
    category: "MENTIONS",
    priority: "MEDIUM",
    title: "New Mention",
    message: "Marcus V. mentioned you in 'Brand Strategy Session' group.",
    time: "1h ago",
    read: false,
    actionText: "Reply",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&h=100&auto=format&fit=crop",
    targetId: 1 // Link to Marcus V (Chat ID 1)
  },
  {
    id: "n4",
    category: "ALL",
    priority: "LOW",
    title: "Social Activity",
    message: "Chioma Z. and 12 others liked your latest portfolio post.",
    time: "2h ago",
    read: true,
    isGrouped: true,
  },
  {
    id: "n5",
    category: "SYSTEM",
    priority: "LOW",
    title: "Weekly Insights",
    message: "Your profile views are up 32% this week. Keep Hustling.",
    time: "4h ago",
    read: true,
  }
];

const ACTIVITY_FEED = [
  { id: "a1", action: "paid", user: "Sarah L.", context: "UX Consultation", time: "Just now" },
  { id: "a2", action: "booked", user: "Michael T.", context: "Logo Design", time: "5m ago" },
  { id: "a3", action: "enrolled", user: "Chioma Z.", context: "Frontend Masterclass", time: "12m ago" },
  { id: "a4", action: "completed", user: "David K.", context: "Brand Strategy", time: "1h ago" },
];

export default function ActivityCenter({ onClose, onAction }: { onClose: () => void; onAction?: (action: string, payload?: any) => void }) {
  const [activeTab, setActiveTab] = useState<"notifications" | "activity">("notifications");
  const [filter, setFilter] = useState<Category>("ALL");
  const { groupedNotifications, fetchNotifications, subscribeToNotifications, markGroupRead, markAllRead } = useNotificationStore();
  const [showSettings, setShowSettings] = useState(false);
  const [quietHours, setQuietHours] = useState(false);

  useEffect(() => {
    fetchNotifications();
    subscribeToNotifications();
  }, []);

  const handleAction = (group: any) => {
    const type = group.type;
    const itemIds = group.items.map((i: any) => i.id);
    markGroupRead(itemIds);

    if (type.includes('booking') || type.includes('milestone')) onAction?.('bookings');
    if (type === 'wallet' || type === 'escrow') onAction?.('wallet');
    if (type === 'message' || type === 'reply' || type === 'comment' || type === 'mention') onAction?.('chat', { chatId: group.entity_id });
    onClose();
  };

  const filteredNotifications = groupedNotifications
    .filter(g => {
      if (filter === "ALL") return true;
      if (filter === "BOOKINGS") return g.type.includes('booking') || g.type.includes('milestone');
      if (filter === "PAYMENTS") return g.type === 'wallet' || g.type === 'escrow';
      if (filter === "MESSAGES") return g.type === 'message' || g.type === 'reply' || g.type === 'comment' || g.type === 'mention';
      if (filter === "SYSTEM") return g.type === 'system';
      return true;
    })
    .map(g => {
      const item = g.items[0];
      const actor = g.actors[0];
      
      let category: Category = 'SYSTEM';
      if (g.type.includes('booking') || g.type.includes('milestone')) category = 'BOOKINGS';
      else if (g.type === 'wallet' || g.type === 'escrow') category = 'PAYMENTS';
      else if (g.type === 'message' || g.type === 'reply' || g.type === 'comment' || g.type === 'mention') category = 'MESSAGES';

      return {
        id: g.id,
        category,
        priority: (g.type.includes('booking') || g.type.includes('milestone')) ? 'HIGH' : 'MEDIUM' as Priority,
        title: g.count > 1 ? `${g.count} updates on your ${category.toLowerCase()}` : (item.message || 'New Update'),
        message: item.message || 'You have a new update in your hustle feed.',
        time: formatDistanceToNow(new Date(item.created_at), { addSuffix: true }),
        read: g.is_read,
        actionText: category === 'BOOKINGS' ? 'View Details' : category === 'PAYMENTS' ? 'Check Wallet' : 'Open',
        avatar: actor?.avatar_url,
        isGrouped: g.count > 1,
        items: g.items
      };
    });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed inset-0 z-[90] bg-[#050505] text-white flex flex-col pt-12"
    >
      <div className="grain-overlay pointer-events-none" />

      {/* Header */}
      <header className="px-6 pb-6 flex items-center justify-between border-b border-white/5 bg-gradient-to-b from-black/40 to-transparent relative z-10">
        <div>
           <h2 className="text-xl font-display font-black tracking-[0.2em] uppercase">Control Center</h2>
           <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Activity & Operations</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${showSettings ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
          >
            <Settings size={18} />
          </button>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex px-6 pt-6 gap-8 border-b border-white/5 relative z-10">
         <button 
           onClick={() => setActiveTab("notifications")}
           className={`pb-4 text-[10px] font-black uppercase tracking-widest relative transition-colors ${activeTab === 'notifications' ? 'text-white' : 'text-white/30'}`}
         >
            Alerts
            {activeTab === "notifications" && (
              <motion.div layoutId="activeActivityTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
            )}
         </button>
         <button 
           onClick={() => setActiveTab("activity")}
           className={`pb-4 text-[10px] font-black uppercase tracking-widest relative transition-colors ${activeTab === 'activity' ? 'text-white' : 'text-white/30'}`}
         >
            Live Activity
            {activeTab === "activity" && (
              <motion.div layoutId="activeActivityTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
            )}
         </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar relative z-10">
        <AnimatePresence mode="wait">
          {showSettings ? (
            <motion.div
              key="settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 flex flex-col gap-6"
            >
              <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Notification Preferences</h3>
              
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                       <Moon size={18} />
                    </div>
                    <div>
                       <h4 className="text-sm font-bold">Quiet Hours</h4>
                       <p className="text-[10px] text-white/40">Mute all non-critical alerts 10PM-8AM</p>
                    </div>
                 </div>
                 <button 
                    onClick={() => setQuietHours(!quietHours)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${quietHours ? 'bg-indigo-500' : 'bg-white/10'}`}
                 >
                    <motion.div 
                       layout
                       className="w-4 h-4 rounded-full bg-white shadow-md"
                       animate={{ x: quietHours ? 24 : 0 }}
                    />
                 </button>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 text-white/40 flex items-center justify-center">
                       <Filter size={18} />
                    </div>
                    <div>
                       <h4 className="text-sm font-bold">Smart Filtering</h4>
                       <p className="text-[10px] text-white/40">Only show marketplace critical alerts</p>
                    </div>
                 </div>
                 <button className="w-12 h-6 rounded-full bg-white/10 p-1">
                    <motion.div className="w-4 h-4 rounded-full bg-white shadow-md" />
                 </button>
              </div>
            </motion.div>
          ) : activeTab === "notifications" ? (
            <motion.div
              key="notifications-list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col"
            >
              {/* Filter Chips */}
              <div className="px-6 py-4 flex gap-2 overflow-x-auto no-scrollbar">
                {(["ALL", "BOOKINGS", "PAYMENTS", "MESSAGES", "SYSTEM"] as Category[]).map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-4 h-8 rounded-full text-[10px] uppercase font-black tracking-widest whitespace-nowrap transition-colors ${filter === cat ? 'bg-white text-black' : 'bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="px-6 flex justify-between items-center mb-4 mt-2">
                 <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Recent</span>
                 <button onClick={markAllRead} className="text-[10px] text-blue-400 uppercase tracking-widest font-bold hover:text-blue-300">Mark all read</button>
              </div>

              <div className="flex flex-col px-4 pb-32">
                {filteredNotifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className={`p-4 mb-2 rounded-3xl border transition-all relative overflow-hidden group ${
                      notif.priority === 'HIGH' 
                      ? 'bg-blue-500/[0.04] border-blue-500/20' 
                      : notif.priority === 'MEDIUM'
                      ? 'bg-white/[0.04] border-white/10'
                      : 'bg-transparent border-transparent hover:bg-white/[0.02]'
                    } ${!notif.read ? 'opacity-100' : 'opacity-50'}`}
                  >
                    {/* Read indicator */}
                    {!notif.read && (
                       <div className="absolute top-1/2 -translate-y-1/2 left-2 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                    )}

                    <div className="flex gap-4 ml-4">
                       {/* Contextual Icon / Avatar */}
                       <div className="relative shrink-0">
                          {notif.avatar ? (
                            <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10">
                              <img src={notif.avatar || undefined} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border border-white/5 ${
                               notif.category === 'BOOKINGS' ? 'bg-blue-500/10 text-blue-400' :
                               notif.category === 'PAYMENTS' ? 'bg-emerald-500/10 text-emerald-400' :
                               notif.category === 'MESSAGES' ? 'bg-purple-500/10 text-purple-400' :
                               'bg-white/5 text-white/60'
                            }`}>
                               {notif.category === 'BOOKINGS' && <Calendar size={18} />}
                               {notif.category === 'PAYMENTS' && <Wallet size={18} />}
                               {notif.category === 'SYSTEM' && <Bell size={18} />}
                            </div>
                          )}
                          
                          {/* Group Indicator */}
                          {notif.isGrouped && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#111] border border-white/10 flex items-center justify-center">
                              <Heart size={10} className="text-red-400 fill-red-400" />
                            </div>
                          )}
                       </div>

                       <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex justify-between items-start mb-1 gap-2">
                             <h4 className={`text-sm truncate ${notif.read ? 'font-medium text-white/80' : 'font-bold text-white'}`}>
                               {notif.title}
                             </h4>
                             <span className="text-[9px] text-white/30 font-bold uppercase whitespace-nowrap pt-1">{notif.time}</span>
                          </div>
                          <p className={`text-xs leading-relaxed mb-3 ${notif.read ? 'text-white/40' : 'text-white/60 font-medium'}`}>
                             {notif.message}
                          </p>
                          
                          {/* Actionable CTA */}
                          {notif.actionText && (
                             <button 
                               onClick={() => handleAction(notif)}
                               className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${
                               notif.priority === 'HIGH' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-white/10 text-white hover:bg-white/20'
                             }`}>
                                {notif.actionText}
                             </button>
                          )}
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="activity-feed"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col gap-6 p-6"
            >
               {/* Real-time Activity System */}
               <div className="relative border-l border-white/10 ml-4 flex flex-col gap-8 py-4">
                  {ACTIVITY_FEED.map((activity, idx) => (
                     <div key={activity.id} className="relative pl-6 group">
                        {/* Timeline node */}
                        <div className="absolute -left-1.5 top-2 w-3 h-3 rounded-full border-2 border-[#050505] bg-blue-500 ring-2 ring-blue-500/20 group-hover:bg-white group-hover:scale-125 transition-all" />
                        
                        <div className="flex flex-col gap-1">
                           <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest">{activity.time}</span>
                           <h4 className="text-sm text-white/80">
                             <span className="font-bold text-white">{activity.user}</span>
                             {" "}just <span className="text-blue-400 font-medium">{activity.action}</span> for{" "}
                             <span className="font-medium text-white">{activity.context}</span>
                           </h4>
                        </div>
                     </div>
                  ))}
               </div>
               
               {/* Read State History */}
               <div className="mt-8 text-center p-8 border border-white/5 rounded-3xl bg-white/[0.02]">
                  <MessageCircle size={24} className="mx-auto text-white/20 mb-3" />
                  <p className="text-xs text-white/40 font-medium">You're all caught up on live network activity.</p>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

