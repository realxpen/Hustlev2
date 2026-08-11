import React from "react";
import { motion } from "motion/react";
import { Star, ShieldCheck, Bookmark, Eye, Zap, MapPin, Heart } from "lucide-react";
import { convertCurrency, formatCurrency, Currency } from "../../lib/currency";

export interface ServiceCardProps {
  service: any;
  isSaved: boolean;
  onSaveToggle: (serviceId: string, e: React.MouseEvent) => void;
  onView: (service: any) => void;
  onHire: (service: any, e: React.MouseEvent) => void;
  displayCurrency?: Currency;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  isSaved,
  onSaveToggle,
  onView,
  onHire,
  displayCurrency = "USD",
}) => {
  const profile = service.profiles || {};
  const providerName = profile.hustle_name || profile.full_name || "Hustle Professional";
  const avatarUrl = profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id || service.owner_id}`;
  
  // Media extraction
  const mediaUrl = service.media?.[0]?.url || "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=600&auto=format&fit=crop";

  // Price conversion
  const rawPrice = Number(service.base_price || 0);
  const selectedCurrency = (displayCurrency || "USD") as Currency;
  const convertedPrice = convertCurrency(rawPrice, "USD", selectedCurrency);
  const formattedPrice = formatCurrency(convertedPrice, selectedCurrency);

  // Trust parameters / metrics
  const rating = Number(profile.rating_average || service.rating_average || 4.9).toFixed(1);
  const reviewCount = profile.review_count || service.reviews_count || Math.floor(Math.random() * 20) + 5;
  const completionRate = service.completion_rate || 100;
  const isVerified = profile.verified || profile.is_hustler || profile.is_agent;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group relative flex flex-col bg-[#0b0b0c] md:bg-[#0c0c0d] border border-white/5 hover:border-white/15 h-full rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] select-none"
    >
      {/* Save / Bookmark Button */}
      <button
        onClick={(e) => onSaveToggle(service.id, e)}
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-red-400 active:scale-90 transition-all shadow-lg"
        title={isSaved ? "Saved to Bookmarks" : "Save Service"}
      >
        <Heart
          size={16}
          className={`transition-all ${isSaved ? "fill-red-500 text-red-500" : "text-white/80"}`}
        />
      </button>

      {/* Category Tag overlay on Image */}
      <div className="absolute top-4 left-4 z-20 flex gap-1.5 items-center bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-[#a5f3fc]">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        {service.category || "Service"}
      </div>

      {/* Service Image Header Container */}
      <div 
        onClick={() => onView(service)}
        className="relative w-full aspect-[16/10] bg-white/5 overflow-hidden cursor-pointer"
      >
        <img
          src={mediaUrl}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          alt={service.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-60" />
      </div>

      {/* Mid body & content segment */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div onClick={() => onView(service)} className="cursor-pointer">
          {/* Provider Card cluster */}
          <div className="flex items-center gap-2.5 mb-3.5">
            <div className="w-7 h-7 rounded-full border border-white/10 overflow-hidden bg-white/5 shrink-0">
              <img
                src={avatarUrl}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                alt={providerName}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase tracking-widest font-black text-white/50 truncate max-w-[120px]">
                  {providerName}
                </span>
                {isVerified && (
                  <ShieldCheck size={12} className="text-blue-400 shrink-0" title="Verified Professional" />
                )}
              </div>
            </div>

            {/* Micro rating indicator */}
            <div className="ml-auto flex items-center gap-1 text-white/60 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
              <Star size={10} className="text-yellow-400 fill-yellow-400 shrink-0" />
              <span className="text-[9px] font-black">{rating}</span>
            </div>
          </div>

          {/* Service Title */}
          <h4 className="font-display font-medium text-base tracking-tight text-white line-clamp-2 uppercase group-hover:text-blue-400 transition-colors mb-2 leading-tight">
            {service.title}
          </h4>

          {/* Service Trust Metrics Badge Grid */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#00ea87]/10 border border-[#00ea87]/10 text-[#00ea87] text-[8px] font-black uppercase tracking-widest">
              <Zap size={8} />
              {completionRate}% Complete
            </div>
            {service.delivery_time && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 border border-white/5 text-white/40 text-[8px] font-black uppercase tracking-widest">
                {service.delivery_time}
              </div>
            )}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 border border-white/5 text-white/40 text-[8px] font-black uppercase tracking-widest">
              {reviewCount} reviews
            </div>
          </div>
        </div>

        {/* Footer actions and price indicator */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Starting at</span>
            <span className="font-display font-black text-lg text-white leading-tight tracking-tight">
              {formattedPrice}
              {service.pricing_type === "hourly" && <span className="text-[10px] text-white/30 font-light">/hr</span>}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onView(service)}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 active:scale-95 transition-all"
              title="View Service Details"
            >
              <Eye size={15} />
            </button>
            <button
              onClick={(e) => onHire(service, e)}
              className="px-4 h-10 rounded-full bg-blue-600 hover:bg-blue-500 font-black text-[9px] uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all flex items-center gap-1"
            >
              <Zap size={10} />
              Hire
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
