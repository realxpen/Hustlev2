import React, { useState } from "react";
import { motion } from "motion/react";
import { Star, X, CheckCircle, Upload, MessageSquare, Award, Clock } from "lucide-react";

interface ReviewSubmissionModalProps {
  bookingId: string;
  providerName: string;
  onClose: () => void;
  onSubmit: (reviewData: any) => void;
}

export default function ReviewSubmissionModal({ bookingId, providerName, onClose, onSubmit }: ReviewSubmissionModalProps) {
  const [overallRating, setOverallRating] = useState<number>(0);
  const [hoveredOverall, setHoveredOverall] = useState<number>(0);
  
  const [categories, setCategories] = useState({
    quality: 0,
    communication: 0,
    timeliness: 0,
    professionalism: 0
  });

  const [reviewText, setReviewText] = useState("");
  const [media, setMedia] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCategoryRating = (category: keyof typeof categories, rating: number) => {
    setCategories(prev => ({ ...prev, [category]: rating }));
    // Auto-update overall if it's currently 0
    if (overallRating === 0) {
      setOverallRating(rating);
    }
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMedia(prev => [...prev, ...Array.from(e.target.files as FileList)]);
    }
  };

  const removeMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (overallRating === 0) {
      alert("Please provide an overall rating.");
      return;
    }
    
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      onSubmit({
        overallRating,
        categories,
        reviewText,
        mediaAttachments: media.map(m => m.name), // Mocking media upload
        timestamp: new Date().toISOString()
      });
      setIsSubmitting(false);
      onClose();
    }, 800);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh]"
      >
        <header className="px-6 py-5 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#0a0a0a]/90 backdrop-blur z-10">
          <div>
            <h2 className="text-lg font-black tracking-tight text-white mb-0.5">Rate Experience</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Hustle with {providerName}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white">
            <X size={20} />
          </button>
        </header>

        <div className="p-6 overflow-y-auto no-scrollbar flex flex-col gap-8">
          
          {/* Overall Rating */}
          <div className="flex flex-col items-center gap-3">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50">Overall Rating</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={`overall-${star}`}
                  onMouseEnter={() => setHoveredOverall(star)}
                  onMouseLeave={() => setHoveredOverall(0)}
                  onClick={() => setOverallRating(star)}
                  className="p-1 transition-transform hover:scale-110 active:scale-90"
                >
                  <Star 
                    size={40} 
                    className={`${(hoveredOverall || overallRating) >= star ? 'fill-yellow-400 text-yellow-400' : 'fill-white/5 text-white/20'} transition-all`} 
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Categories */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 space-y-5">
            <h4 className="text-[9px] font-black uppercase tracking-widest text-white/30 text-center mb-2">Detailed Feedback</h4>
            
            <CategoryRater 
              icon={<Award size={14} />} 
              label="Quality of Work" 
              value={categories.quality} 
              onChange={(val) => handleCategoryRating('quality', val)} 
            />
            <CategoryRater 
              icon={<MessageSquare size={14} />} 
              label="Communication" 
              value={categories.communication} 
              onChange={(val) => handleCategoryRating('communication', val)} 
            />
            <CategoryRater 
              icon={<Clock size={14} />} 
              label="Timeliness" 
              value={categories.timeliness} 
              onChange={(val) => handleCategoryRating('timeliness', val)} 
            />
            <CategoryRater 
              icon={<CheckCircle size={14} />} 
              label="Professionalism" 
              value={categories.professionalism} 
              onChange={(val) => handleCategoryRating('professionalism', val)} 
            />
          </div>

          {/* Written Review */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-[0.1em] text-white/50 block mb-3">Written Review</label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="How was your experience working with this provider? What did they do well?"
              className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all resize-none"
            ></textarea>
          </div>

          {/* Media Upload */}
          <div>
            <div className="flex justify-between items-end mb-3">
              <label className="text-[11px] font-black uppercase tracking-[0.1em] text-white/50">Attach Media <span className="text-white/20 ml-1">(Optional)</span></label>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              <label className="w-20 h-20 shrink-0 border border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-white/40 hover:bg-white/5 transition-colors group">
                <Upload size={20} className="text-white/40 group-hover:text-white/60 mb-2" />
                <span className="text-[8px] font-black uppercase tracking-widest text-white/40 group-hover:text-white/60">Upload</span>
                <input type="file" className="hidden" multiple accept="image/*,video/*" onChange={handleMediaUpload} />
              </label>

              {media.map((file, idx) => (
                <div key={idx} className="w-20 h-20 shrink-0 rounded-2xl border border-white/10 bg-white/5 relative overflow-hidden group">
                  <div className="absolute inset-x-0 bottom-0 top-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => removeMedia(idx)} className="p-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/40 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                    <span className="text-[8px] font-medium text-white/60 break-all line-clamp-2">{file.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="p-6 border-t border-white/5 bg-[#0a0a0a]">
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || overallRating === 0}
            className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center transition-all ${
              overallRating > 0 && !isSubmitting
                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)] active:scale-95' 
                : 'bg-white/5 text-white/20 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CategoryRater({ icon, label, value, onChange }: { icon: React.ReactNode, label: string, value: number, onChange: (val: number) => void }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="text-white/40">{icon}</div>
        <span className="text-xs font-bold text-white/80">{label}</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            className="p-1"
          >
            <Star 
              size={16} 
              className={`${(hovered || value) >= star ? 'fill-yellow-400 text-yellow-400' : 'fill-white/10 text-white/10'} transition-all`} 
            />
          </button>
        ))}
      </div>
    </div>
  );
}
