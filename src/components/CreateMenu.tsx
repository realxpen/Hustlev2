import { motion, AnimatePresence } from "motion/react";
import { Camera, Video, Briefcase, X, Sparkles, Image as ImageIcon } from "lucide-react";

interface CreateMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOptionSelect: (optionId: string) => void;
}

const CREATE_OPTIONS = [
  {
    id: "post",
    title: "Post Work",
    description: "Share a video or photo of your hustle",
    icon: <Video className="text-blue-400" />,
    color: "bg-blue-500/10",
    borderColor: "border-blue-500/20"
  },
  {
    id: "service",
    title: "Add Service",
    description: "Create a new booking option",
    icon: <Briefcase className="text-purple-400" />,
    color: "bg-purple-500/10",
    borderColor: "border-purple-500/20"
  },
  {
    id: "content",
    title: "Quick Story",
    description: "15-second update on your location",
    icon: <Camera className="text-emerald-400" />,
    color: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20"
  }
];

export default function CreateMenu({ isOpen, onClose, onOptionSelect }: CreateMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-[#0A0A0A] border-t border-white/5 rounded-t-[40px] px-8 pt-12 pb-16"
          >
            <div className="grain-overlay pointer-events-none" />

            {/* Header */}
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="text-2xl font-display font-black tracking-tight mb-1 flex items-center gap-2">
                  START SOMETHING <Sparkles size={20} className="text-yellow-500" />
                </h3>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">Turn your talent into opportunity</p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-4">
              {CREATE_OPTIONS.map((option, idx) => (
                <motion.button
                  key={option.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onOptionSelect(option.id)}
                  className={`w-full p-6 rounded-3xl border ${option.borderColor} ${option.color} flex items-center gap-6 text-left group hover:bg-white/[0.04] transition-all`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    {option.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg leading-tight mb-1">{option.title}</h4>
                    <p className="text-xs text-white/40 font-light tracking-wide">{option.description}</p>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Footer Tip */}
            <div className="mt-10 p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                 <ImageIcon size={16} className="text-white/20" />
              </div>
              <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest leading-relaxed">
                Consistent posting increases your discovery ranking by up to 40% in your local area.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
