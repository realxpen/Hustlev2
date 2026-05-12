import { motion } from "motion/react";
import { Calendar, Clock, ChevronRight, CheckCircle2, AlertCircle, MessageSquare, X } from "lucide-react";

interface BookingsHubProps {
  onBookingSelect: (booking: any) => void;
  onClose?: () => void;
}

const MOCK_BOOKINGS = [
  {
    id: "BK-7721",
    hustler: "Marcus V.",
    service: "UI/UX Deep Dive",
    status: "in_progress",
    progress: 65,
    date: "May 10, 2026",
    time: "2:00 PM",
    price: "$120.00",
    avatar: "M",
    lastUpdate: "Wireframes completed",
    stage: "Design Phase"
  },
  {
    id: "BK-8842",
    hustler: "Elena S.",
    service: "Street Photography",
    status: "confirmed",
    progress: 25,
    date: "May 12, 2026",
    time: "4:00 PM",
    price: "$85.00",
    avatar: "E",
    lastUpdate: "Location confirmed",
    stage: "Preparation"
  },
  {
    id: "BK-1102",
    hustler: "Jordan K.",
    service: "Logo Animation",
    status: "completed",
    progress: 100,
    date: "May 05, 2026",
    time: "10:00 AM",
    price: "$200.00",
    avatar: "J",
    lastUpdate: "Final files delivered",
    stage: "Delivered"
  }
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  in_progress: { label: "In Progress", color: "text-blue-400", icon: <Clock size={12} /> },
  confirmed: { label: "Confirmed", color: "text-purple-400", icon: <CheckCircle2 size={12} /> },
  completed: { label: "Completed", color: "text-emerald-400", icon: <CheckCircle2 size={12} /> },
  pending: { label: "Pending", color: "text-yellow-400", icon: <AlertCircle size={12} /> },
};

export default function BookingsHub({ onBookingSelect, onClose }: BookingsHubProps) {
  return (
    <div className="h-full bg-transparent text-white p-6 pb-24 overflow-y-auto no-scrollbar" id="bookings-hub">
      <div className="grain-overlay pointer-events-none" />

      {/* Header */}
      <header className="flex justify-between items-center mb-10 pt-4">
        <div className="flex items-center gap-4">
          {onClose && (
            <button onClick={onClose} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
              <X size={24} />
            </button>
          )}
          <div>
            <h2 className="text-xl font-display font-black tracking-[0.2em] uppercase mb-1">My Bookings</h2>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Track your active services and history</p>
          </div>
        </div>
      </header>

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 gap-4 mb-10">
         <div className="p-6 rounded-[32px] bg-white/[0.03] border border-white/5">
            <span className="text-[32px] font-display font-black leading-none block mb-1">2</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Active Tasks</span>
         </div>
         <div className="p-6 rounded-[32px] bg-blue-500/10 border border-blue-500/20">
            <span className="text-[32px] font-display font-black leading-none block mb-1 text-blue-400">12</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-blue-400/40">Total Completed</span>
         </div>
      </div>

      {/* Active Bookings Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6 px-1">
           <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Active & Upcoming</h4>
        </div>
        
        <div className="flex flex-col gap-4">
          {MOCK_BOOKINGS.filter(b => b.status !== "completed").map((booking) => (
            <motion.button
              key={booking.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => onBookingSelect(booking)}
              className="w-full p-6 rounded-[32px] bg-white/[0.04] border border-white/10 text-left relative overflow-hidden group hover:border-white/20 transition-all"
            >
              <div className="flex justify-between items-start mb-6">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-black text-white/20">
                       {booking.avatar}
                    </div>
                    <div>
                       <h3 className="font-bold text-sm tracking-tight">{booking.hustler}</h3>
                       <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mt-0.5">{booking.service}</p>
                    </div>
                 </div>
                 <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 ${STATUS_CONFIG[booking.status].color}`}>
                    {STATUS_CONFIG[booking.status].icon}
                    <span className="text-[8px] font-black uppercase tracking-widest">{STATUS_CONFIG[booking.status].label}</span>
                 </div>
              </div>

              <div className="flex flex-col gap-4">
                 <div className="flex justify-between items-end mb-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20">{booking.stage}</span>
                    <span className="text-[9px] font-black text-white/40">{booking.progress}%</span>
                 </div>
                 <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${booking.progress}%` }}
                      className={`h-full ${booking.status === 'in_progress' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-purple-500'}`}
                    />
                 </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                       <Calendar size={12} className="text-white/20" />
                       <span className="text-[10px] font-bold text-white/40">{booking.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                       <Clock size={12} className="text-white/20" />
                       <span className="text-[10px] font-bold text-white/40">{booking.time}</span>
                    </div>
                 </div>
                 <ChevronRight size={16} className="text-white/10 group-hover:text-white transition-colors" />
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Trust Reinforcement Pad */}
      <div className="p-8 rounded-[40px] bg-gradient-to-br from-white/[0.02] to-transparent border border-white/5 text-center">
         <MessageSquare size={24} className="mx-auto text-white/10 mb-4" />
         <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Support & Clarity</h4>
         <p className="text-white/20 text-[9px] font-light leading-relaxed max-w-[200px] mx-auto uppercase tracking-wide">
            Need an update or have a question? Contact your hustler directly through the booking detail view.
         </p>
      </div>
    </div>
  );
}
