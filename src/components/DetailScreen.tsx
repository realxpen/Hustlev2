import { motion, AnimatePresence } from "motion/react";
import { 
  X, Heart, Share2, Bookmark, Star, MapPin, CheckCircle, 
  ChevronRight, Play, ShoppingBag, Calendar, GraduationCap,
  ShieldCheck, Clock, MessageSquare, AlertCircle, ArrowRight
} from "lucide-react";
import { useState, useRef } from "react";
import { DetailData, ServiceDetailData, ProductDetailData, TrainingDetailData, Recommendation, Review } from "../types";

interface DetailScreenProps {
  isOpen: boolean;
  onClose: () => void;
  data: DetailData;
}

export default function DetailScreen({ isOpen, onClose, data }: DetailScreenProps) {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(data.socialStats.likes > 1000); // Simple mock state
  const [isSaved, setIsSaved] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const renderServiceContent = (s: ServiceDetailData) => (
    <div className="flex flex-col gap-10">
      {/* Packages Section */}
      <section>
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-6 flex items-center gap-2">
          <div className="w-4 h-[1px] bg-white/20" /> Pricing & Packages
        </h3>
        <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide -mx-2 px-2">
          {s.priceStructure.packages.map((pkg, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -5 }}
              className="min-w-[280px] bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-4"
            >
              <div className="flex justify-between items-start">
                <span className="text-lg font-bold">{pkg.name}</span>
                <span className="text-xl font-black">${pkg.price}</span>
              </div>
              <ul className="flex flex-col gap-3 mt-2">
                {pkg.features.map((f, i) => (
                  <li key={i} className="text-xs text-white/50 flex items-center gap-2">
                    <CheckCircle size={10} className="text-green-500" /> {f}
                  </li>
                ))}
              </ul>
              <button className="w-full py-3 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest mt-auto">
                Select Package
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Portfolio Grid */}
      <section>
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-6 flex items-center gap-2">
          <div className="w-4 h-[1px] bg-white/20" /> Portfolio Showcase
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {s.portfolio.map((item, idx) => (
            <div key={idx} className="aspect-square bg-white/5 rounded-2xl overflow-hidden relative group">
              <div 
                className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
                style={{ backgroundImage: `url(${item.url})` }}
              />
              {item.type === "video" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Play size={20} className="text-white fill-current" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const renderProductContent = (p: ProductDetailData) => (
    <div className="flex flex-col gap-10">
      {/* Variants */}
      {p.variants && (
        <section>
          {p.variants.map((v, idx) => (
            <div key={idx} className="mb-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-4">{v.name}</h3>
              <div className="flex flex-wrap gap-2">
                {v.options.map((opt, i) => (
                  <button 
                    key={i} 
                    className="px-4 py-2 border border-white/20 rounded-full text-xs font-bold hover:bg-white hover:text-black transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Features */}
      <section>
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-4">Highlights</h3>
        <div className="grid grid-cols-2 gap-4">
          {p.features.map((f, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="w-8 h-[1px] bg-white/40" />
              <span className="text-sm font-medium text-white/80">{f}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const renderTrainingContent = (t: TrainingDetailData) => (
    <div className="flex flex-col gap-10">
      {/* Learning Modules */}
      <section>
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-6 flex items-center gap-2">
          <div className="w-4 h-[1px] bg-white/20" /> Curriculum Overview
        </h3>
        <div className="flex flex-col gap-3">
          {t.curriculum.map((item, idx) => (
            <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Module {idx + 1}</span>
                <span className="text-xs font-medium text-white/40">{item.topics.length} topics</span>
              </div>
              <h4 className="font-bold text-base">{item.module}</h4>
            </div>
          ))}
        </div>
      </section>

      {/* Outcomes & Requirements */}
      <div className="grid grid-cols-2 gap-8">
        <section>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">You'll Learn</h3>
          <ul className="flex flex-col gap-3">
            {t.outcomes.map((o, i) => (
              <li key={i} className="text-xs text-white/60 leading-relaxed">• {o}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">Requirements</h3>
          <ul className="flex flex-col gap-3">
            {t.requirements.map((r, i) => (
              <li key={i} className="text-xs text-white/60 leading-relaxed">• {r}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
      className="fixed inset-0 z-[100] bg-[#050505] flex flex-col text-white"
    >
      {/* Immersive Header / Hero */}
      <div className="relative h-[65vh] w-full shrink-0 group">
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeMediaIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${data.heroMedia[activeMediaIndex]})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Media Navigation Tap Areas */}
        <div className="absolute inset-0 flex z-10 pointer-events-none">
          <div 
            className="w-1/2 h-full pointer-events-auto cursor-pointer" 
            onClick={() => setActiveMediaIndex(prev => (prev > 0 ? prev - 1 : data.heroMedia.length - 1))}
          />
          <div 
            className="w-1/2 h-full pointer-events-auto cursor-pointer" 
            onClick={() => setActiveMediaIndex(prev => (prev < data.heroMedia.length - 1 ? prev + 1 : 0))}
          />
        </div>

        {/* Media Interaction Overlays */}
        <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none z-20">
          <div className="flex justify-between items-center pointer-events-auto">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10"
            >
              <X size={20} />
            </motion.button>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10">
                <Share2 size={18} />
              </button>
              <button 
                onClick={() => setIsSaved(!isSaved)}
                className={`w-10 h-10 rounded-full backdrop-blur-xl flex items-center justify-center border ${isSaved ? 'bg-white text-black border-white' : 'bg-black/40 text-white border-white/10'}`}
              >
                <Bookmark size={18} className={isSaved ? "fill-current" : ""} />
              </button>
            </div>
          </div>

          <div className="mb-0">
             {/* Media Pagination */}
             <div className="flex gap-1.5 mb-8">
               {data.heroMedia.map((_, i) => (
                 <div 
                   key={i} 
                   className={`h-1 rounded-full transition-all duration-300 ${i === activeMediaIndex ? 'w-8 bg-white' : 'w-4 bg-white/20'}`} 
                 />
               ))}
             </div>
             
             {/* Massive Typographic Intro */}
             <motion.div
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.3 }}
             >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">{data.type}</span>
                  <div className="w-1 h-1 rounded-full bg-white/30" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-green-500 flex items-center gap-1">
                    <ShieldCheck size={10} /> Verified
                  </span>
                </div>
                <h1 className="text-5xl font-black tracking-tighter leading-[0.9] mb-4 uppercase italic">
                  {data.title}
                </h1>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star size={14} className="fill-yellow-500 text-yellow-500" />
                    <span className="font-black text-sm">{data.creator.rating}</span>
                  </div>
                  <span className="text-white/40 font-medium text-xs tracking-tight">
                    {data.socialStats.likes} likes • {data.socialStats.shares} shared
                  </span>
                </div>
             </motion.div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 pt-10 pb-32 flex flex-col gap-12 scrollbar-hide"
      >
        {/* Creator Section */}
        <section className="flex items-center justify-between bg-white/[0.03] border border-white/10 p-6 rounded-[2rem]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 overflow-hidden relative">
              <div 
                className="w-full h-full bg-cover bg-center" 
                style={{ backgroundImage: `url(${data.creator.avatar})` }}
              />
            </div>
            <div className="flex flex-col">
              <h4 className="font-bold text-base flex items-center gap-1.5 leading-none">
                {data.creator.name}
                {data.creator.verified && <CheckCircle size={14} className="text-blue-500" />}
              </h4>
              <span className="text-xs text-white/40 font-medium mt-1">{data.creator.category} • {data.creator.location}</span>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center"
          >
            <MessageSquare size={18} />
          </motion.button>
        </section>

        {/* Description Section */}
        <section>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-4 flex items-center gap-2">
            <div className="w-4 h-[1px] bg-white/20" /> The Hustle
          </h3>
          <p className="text-lg font-medium leading-relaxed text-white/90 italic tracking-tight">
            "{data.description}"
          </p>
        </section>

        {/* Type-Specific Content */}
        {data.type === "service" && renderServiceContent(data as ServiceDetailData)}
        {data.type === "product" && renderProductContent(data as ProductDetailData)}
        {data.type === "training" && renderTrainingContent(data as TrainingDetailData)}

        {/* Trust Layer (Common) */}
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex flex-col gap-2">
            <ShieldCheck className="text-blue-400" size={20} />
            <h5 className="font-bold text-xs">Escrow Secured</h5>
            <p className="text-[10px] text-white/40 leading-snug">Payments are held in escrow until work is approved.</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex flex-col gap-2">
            <Clock className="text-green-400" size={20} />
            <h5 className="font-bold text-xs">{data.creator.responseTime || "Rapid Response"}</h5>
            <p className="text-[10px] text-white/40 leading-snug">Average response time is under 1 hour.</p>
          </div>
        </section>

        {/* Social Proof / Reviews */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
              <div className="w-4 h-[1px] bg-white/20" /> Social Validation
            </h3>
            <span className="text-[10px] font-bold text-blue-400">See All</span>
          </div>
          <div className="flex flex-col gap-4">
            {data.reviews.map((rev) => (
              <div key={rev.id} className="bg-black border border-white/5 p-5 rounded-3xl flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold text-white/40 uppercase">
                      {rev.user.charAt(0)}
                    </div>
                    <span className="text-[11px] font-bold text-white/60">{rev.user}</span>
                    {rev.isRepeat && (
                      <span className="text-[8px] px-1.5 py-0.5 bg-green-500/20 text-green-500 rounded font-black uppercase tracking-widest">Repeat Client</span>
                    )}
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={8} className={i < rev.rating ? "fill-yellow-500 text-yellow-500" : "text-white/10"} />
                    ))}
                  </div>
                </div>
                <p className="text-xs font-medium text-white/80 leading-relaxed tracking-tight">"{rev.text}"</p>
                {rev.media && rev.media.length > 0 && (
                  <div className="flex gap-2">
                    {rev.media.map((img, i) => (
                      <div key={i} className="w-12 h-12 rounded-lg bg-cover bg-center border border-white/10" style={{ backgroundImage: `url(${img})` }} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Recommendations Section */}
        <section className="pb-32">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-6 flex items-center gap-2">
            <div className="w-4 h-[1px] bg-white/20" /> Similar Opportunities
          </h3>
          <div className="flex overflow-x-auto gap-4 scrollbar-hide -mx-2 px-2">
            {data.recommendations.map((rec) => (
              <motion.div 
                key={rec.id}
                whileTap={{ scale: 0.98 }}
                className="min-w-[160px] flex flex-col gap-2 group"
              >
                <div className="aspect-[4/5] bg-white/5 rounded-2xl overflow-hidden relative border border-white/5">
                  <div 
                    className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500" 
                    style={{ backgroundImage: `url(${rec.image})` }}
                  />
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                    <Heart size={10} className="text-white/60" />
                  </div>
                  {rec.price && (
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[10px] font-black text-black">
                      ${rec.price}+
                    </div>
                  )}
                </div>
                <div className="flex flex-col px-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/30 truncate">{rec.subtitle}</span>
                  <h5 className="text-[11px] font-bold text-white/80 truncate leading-tight mt-0.5">{rec.title}</h5>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {/* Floating Sticky CTA */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent pt-10">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(0,0,0,0.5)]
            ${data.type === 'service' ? 'bg-white text-black' : 
              data.type === 'product' ? 'bg-orange-600 text-white shadow-[0_0_30px_rgba(234,88,12,0.3)]' : 
              'bg-purple-600 text-white shadow-[0_0_30px_rgba(147,51,234,0.3)]'}
          `}
        >
          {data.type === 'service' && <Calendar size={18} />}
          {data.type === 'product' && <ShoppingBag size={18} />}
          {data.type === 'training' && <GraduationCap size={18} />}
          
          {data.type === 'service' ? 'Request Booking' : 
           data.type === 'product' ? 'Buy Now' : 
           'Apply for Training'}
           
          <ArrowRight size={16} />
        </motion.button>
      </div>
    </motion.div>
  );
}
