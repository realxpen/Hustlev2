import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Video, Briefcase, X, Sparkles, Image as ImageIcon, ShoppingBag, Play } from "lucide-react";

interface CreateMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOptionSelect: (optionId: string) => void;
}

const CREATE_OPTIONS = [
  {
    id: "post",
    title: "Post Content",
    description: "Share your latest work or story",
    icon: <Video className="text-blue-400" />,
    color: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    template: "video_flow"
  },
  {
    id: "live",
    title: "Go Live",
    description: "Launch real-time sales & demo",
    icon: <Sparkles className="text-red-400" />,
    color: "bg-red-500/10",
    borderColor: "border-red-500/20",
    template: "live_studio"
  },
  {
    id: "service",
    title: "Add Service",
    description: "New booking option for clients",
    icon: <Briefcase className="text-purple-400" />,
    color: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    template: "service_wizard"
  },
  {
    id: "product",
    title: "Add Product",
    description: "List a new physical item",
    icon: <ShoppingBag className="text-emerald-400" />,
    color: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    template: "product_listing"
  },
  {
    id: "training",
    title: "Create Training",
    description: "Tutorial or group session",
    icon: <Play className="text-yellow-400" />,
    color: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
    template: "course_builder"
  },
  {
    id: "offer",
    title: "Post Offer",
    description: "Flash sale or time-limited deal",
    icon: <Sparkles size={20} className="text-brand-primary" />,
    color: "bg-brand-primary/10",
    borderColor: "border-brand-primary/20",
    template: "promotion_engine"
  }
];

export default function CreateMenu({ isOpen, onClose, onOptionSelect }: CreateMenuProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[60]"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-[#050505] border-t border-white/10 rounded-t-[3rem] px-6 pt-10 pb-12 max-h-[85vh] overflow-y-auto no-scrollbar"
          >
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
            
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black font-display tracking-tight text-white italic">CREATION HUB</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Select your intent to begin</p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full glass border border-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {CREATE_OPTIONS.map((option, idx) => (
                <motion.button
                  key={option.id}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, type: "spring", damping: 20 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onOptionSelect(option.id)}
                  className={`p-6 rounded-3xl border ${option.borderColor} ${option.color} flex flex-col gap-4 text-left group hover:scale-[1.02] transition-all relative overflow-hidden`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-black/60 border border-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                    {option.icon}
                  </div>
                  <div>
                    <h4 className="font-black text-xs uppercase tracking-widest mb-1">{option.title}</h4>
                    <p className="text-[10px] text-white/40 leading-tight font-medium">{option.description}</p>
                  </div>
                  
                  {/* Subtle Smart Template Indicator */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-white/5">
               <div className="bg-brand-primary/10 border border-brand-primary/20 p-6 rounded-3xl flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-brand-primary flex items-center justify-center text-white shrink-0 shadow-glow-red">
                     <Sparkles size={24} />
                  </div>
                  <div>
                     <h5 className="text-[10px] font-black uppercase text-brand-primary tracking-widest mb-1">Smart Template Active</h5>
                     <p className="text-xs text-white/60 leading-relaxed font-medium">Hustle AI will pre-fill your listing based on your portfolio context.</p>
                  </div>
               </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
