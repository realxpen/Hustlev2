import { motion } from "motion/react";
import { ShoppingCart, ExternalLink, ShieldCheck, Tag } from "lucide-react";

interface ChatAttachmentProps {
  attachment: {
    id: string;
    type: "service" | "product" | "training";
    title: string;
    price: number;
    image: string;
    creator: string;
  };
  onAction: () => void;
}

export default function ChatAttachment({ attachment, onAction }: ChatAttachmentProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 max-w-[85%] self-start overflow-hidden relative group"
    >
      <div className="relative aspect-video rounded-xl overflow-hidden mb-3">
        <img src={attachment.image} alt={attachment.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-1">
           <Tag size={10} className="text-blue-400" />
           <span className="text-[9px] font-black">₦{attachment.price.toLocaleString()}</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>

      <div className="px-1 mb-4">
        <div className="flex items-center gap-2 mb-1">
           <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{attachment.type} attachment</span>
        </div>
        <h4 className="font-bold text-sm leading-tight text-white/90">{attachment.title}</h4>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button 
           onClick={onAction}
           className="h-10 bg-white/5 hover:bg-white/10 text-white rounded-xl flex items-center justify-center gap-2 transition-all border border-white/5"
        >
           <ExternalLink size={12} className="opacity-40" />
           <span className="text-[9px] font-black uppercase tracking-widest">View</span>
        </button>
        <button 
           className="h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
        >
           <ShieldCheck size={12} />
           <span className="text-[9px] font-black uppercase tracking-widest">Start Escrow</span>
        </button>
      </div>
    </motion.div>
  );
}
