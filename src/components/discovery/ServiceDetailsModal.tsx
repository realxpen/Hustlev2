import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, ShieldCheck, Star, Calendar, Clock, Sparkles, CheckCircle2, 
  MessageSquare, Share2, MapPin, Zap, Check, Heart, Briefcase, 
  Award, ThumbsUp, ChevronRight, Send, HelpCircle
} from "lucide-react";
import { convertCurrency, formatCurrency, Currency } from "../../lib/currency";

export interface ServiceDetailsModalProps {
  service: any;
  isSaved: boolean;
  onSaveToggle: (serviceId: string) => void;
  onClose: () => void;
  onHire: (service: any) => void;
  displayCurrency?: Currency;
}

export function ServiceDetailsModal({
  service,
  isSaved,
  onSaveToggle,
  onClose,
  onHire,
  displayCurrency = "USD",
}: ServiceDetailsModalProps) {
  const profile = service.profiles || {};
  const providerName = profile.hustle_name || profile.full_name || "Hustle Professional";
  const avatarUrl = profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id || service.owner_id}`;
  
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDay());
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [isMessaging, setIsMessaging] = useState(false);

  // Price conversion
  const rawPrice = Number(service.base_price || 0);
  const selectedCurrency = (displayCurrency || "USD") as Currency;
  const convertedPrice = convertCurrency(rawPrice, "USD", selectedCurrency);
  const formattedPrice = formatCurrency(convertedPrice, selectedCurrency);

  // Media Gallery Setup
  const mediaList = service.media && service.media.length > 0
    ? service.media
    : [
        { url: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1000&auto=format&fit=crop", type: "image" },
        { url: "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?q=80&w=1000&auto=format&fit=crop", type: "image" },
        { url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000&auto=format&fit=crop", type: "image" }
      ];

  const rating = Number(profile.rating_average || service.rating_average || 4.9).toFixed(1);
  const reviewCount = profile.review_count || service.reviews_count || 12;
  const isVerified = profile.verified || profile.is_hustler || profile.is_agent || service.verified;

  // Curated Portfolio Mock Items based on category
  const getPortfolioItems = () => {
    const defaultPortfolio = [
      {
        title: "Enterprise System Architecture",
        desc: "Designed and scaled decentralized workflows handling 10k+ concurrent websocket relays.",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop"
      },
      {
        title: "Interactive Web Portal v2",
        desc: "High-performance interface leveraging reactive UI states and real-time ledger mechanics.",
        image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=800&auto=format&fit=crop"
      },
      {
        title: "Optimized Payment Hub Integration",
        desc: "Escrow holding and smart release flows engineered for professional freelancer operations.",
        image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=800&auto=format&fit=crop"
      }
    ];

    const designPortfolio = [
      {
        title: "Neo-Brutalist Branding System",
        desc: "Full identity design combining striking typography layouts with high-contrast color tones.",
        image: "https://images.unsplash.com/photo-1561070791-26c113006238?q=80&w=800&auto=format&fit=crop"
      },
      {
        title: "Mobile App Wireframe Blueprint",
        desc: "High-fidelity mobile UI layouts focusing on strict interaction logic and clean padding.",
        image: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=800&auto=format&fit=crop"
      },
      {
        title: "E-Commerce Experience Design",
        desc: "Tailored checkouts, visual products grids, and micro-animations leading to 25% CTR boost.",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop"
      }
    ];

    const serviceCat = (service.category || "").toLowerCase();
    if (serviceCat.includes("design") || serviceCat.includes("creative") || serviceCat.includes("art") || serviceCat.includes("marketing")) {
      return designPortfolio;
    }
    return defaultPortfolio;
  };

  // Structured reviews list
  const getReviews = () => {
    return [
      {
        name: "Alex Thorne",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
        role: "Contract Director",
        rating: 5,
        date: "2 weeks ago",
        text: "Outstanding implementation capability. Provided exceptional milestone communication and delivered exactly what was structured in the escrow agreement ahead of schedule. Highly recommended."
      },
      {
        name: "Sofia Mendez",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia",
        role: "Creative Director",
        rating: 5,
        date: "3 weeks ago",
        text: "Incredibly attentive to technical specifics. The project execution was pristine, formatting has no typos, and integration works beautifully. Will hire again next month."
      },
      {
        name: "Devon Carter",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Devon",
        role: "Operations Lead",
        rating: 4.8,
        date: "1 month ago",
        text: "Professional, skilled, and reliable. The delivery was slightly delayed due to custom scope amendments we made, but the absolute premium quality of the output made it 100% worth it."
      }
    ];
  };

  const handleShare = () => {
    setCopiedLink(true);
    navigator.clipboard.writeText(window.location.href);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setMessageSent(true);
    setMessageText("");
    setTimeout(() => {
      setMessageSent(false);
      setIsMessaging(false);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[1050] flex items-end md:items-center justify-center p-0 md:p-6">
      {/* Dark overlay backdrop with click-to-close */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Main Service Detail Window */}
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-2xl h-[92vh] md:h-auto md:max-h-[90vh] bg-[#0c0c0e] border-t md:border border-white/10 rounded-t-[3rem] md:rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Floating Top Header Bar */}
        <div className="absolute top-4 left-4 z-40 flex gap-2">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white active:scale-95 transition-all shadow-lg"
          >
            <X size={18} />
          </button>
        </div>

        <div className="absolute top-4 right-4 z-40 flex gap-2">
          {/* Share Action */}
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white active:scale-95 transition-all shadow-lg"
          >
            {copiedLink ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
          </button>
          
          {/* Save / Pinned Heart action */}
          <button
            onClick={() => onSaveToggle(service.id)}
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-red-400 active:scale-95 transition-all shadow-lg"
          >
            <Heart size={16} className={isSaved ? "fill-red-500 text-red-500" : "text-white"} />
          </button>
        </div>

        {/* Core Detail Page Body (Scrollable, leaving sticky hire bar at bottom) */}
        <div id="service-detail-scroll-body" className="flex-1 overflow-y-auto no-scrollbar pb-32">
          
          {/* ================= HERO SECTION ================= */}
          <section className="relative w-full aspect-[16/9] md:aspect-[16/10] bg-white/5 overflow-hidden">
            <img
              src={mediaList[activeMediaIndex].url}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              alt={service.title}
            />
            {/* Ambient gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-[#0c0c0e]/30 to-black/20" />
            
            {/* Media switches indicators */}
            {mediaList.length > 1 && (
              <div className="absolute bottom-6 left-6 flex gap-1.5 z-30 bg-black/40 backdrop-blur-md py-1.5 px-3 rounded-full">
                {mediaList.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveMediaIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${idx === activeMediaIndex ? "bg-blue-500 w-4" : "bg-white/35 hover:bg-white/60"}`}
                  />
                ))}
              </div>
            )}

            {/* Location & Trust Floating Pill badges */}
            <div className="absolute top-20 left-6 z-30 flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 text-[8.5px] font-black uppercase tracking-wider text-green-400 bg-green-950/40 border border-green-500/20 px-3 py-1.5 rounded-full backdrop-blur-md shadow-sm">
                <CheckCircle2 size={10} /> Active Professional
              </span>
              <span className="flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-950/40 border border-cyan-500/20 px-3 py-1.5 rounded-full backdrop-blur-md shadow-sm">
                <MapPin size={10} /> {service.location_mode === "remote" ? "Remote Global" : "Local Verified"}
              </span>
            </div>
          </section>

          {/* Core Content Padding Container */}
          <div className="p-6 md:p-8 space-y-10">
            
            {/* Title Block */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase font-black tracking-widest text-cyan-400 bg-cyan-400/5 border border-cyan-400/10 px-3 py-1 rounded-md">
                  {service.category || "Service Catalog"}
                </span>
                {isVerified && (
                  <span className="flex items-center gap-1 text-[9px] uppercase font-black tracking-widest text-blue-400 bg-blue-500/5 border border-blue-500/10 px-3 py-1 rounded-md">
                    <Award size={10} /> Trusted Specialist
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-white uppercase leading-tight">
                {service.title}
              </h1>
            </div>

            {/* Provider and trust profile section */}
            <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between transition-all hover:bg-white/[0.03]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 overflow-hidden shrink-0 relative">
                  <img
                    src={avatarUrl}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    alt={providerName}
                  />
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0c0c0e] rounded-full" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-black text-sm uppercase text-white tracking-widest">
                      {providerName}
                    </h5>
                    {isVerified && (
                      <ShieldCheck size={14} className="text-blue-400 fill-current" />
                    )}
                  </div>
                  <p className="text-[9px] font-black uppercase text-white/40 tracking-wider">
                    {profile.primary_skill || "Independent Service Provider"}
                  </p>
                </div>
              </div>

              {/* Verified ratings metrics */}
              <div className="flex sm:flex-col items-start sm:items-end gap-3 sm:gap-1.5 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5">
                <div className="flex items-center gap-1.5 text-white bg-white/5 py-1.5 px-3 rounded-xl border border-white/5 text-xs font-black">
                  <Star size={12} className="text-yellow-400 fill-yellow-400" />
                  <span>{rating}</span>
                  <span className="text-white/35 text-[10px] font-medium">({reviewCount} reviews)</span>
                </div>
                <div className="text-[9px] font-bold text-[#00ea87] uppercase tracking-wider">
                  ⚡ 100% Reliable Escrow Release
                </div>
              </div>
            </div>

            {/* ================= PRICING SECTION ================= */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2 border-b border-white/5">
              <div className="p-5 rounded-3xl bg-blue-950/10 border border-blue-500/10 flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="text-[8.5px] uppercase tracking-[0.25em] font-black text-blue-400">Escrow Pricing Contract</h4>
                  <p className="text-2xl font-display font-black text-white mt-1">
                    {formattedPrice}
                    {service.pricing_type === "hourly" && <span className="text-xs font-light text-white/35 font-sans"> /hr</span>}
                  </p>
                </div>
                <div className="text-[10px] text-white/40 font-light leading-normal">
                  Funds remain fully secure within holding. Specialist begins working immediately.
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-yellow-950/10 border border-yellow-500/10 flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="text-[8.5px] uppercase tracking-[0.25em] font-black text-yellow-400">Delivery Estimate</h4>
                  <p className="text-sm font-black text-white uppercase tracking-widest mt-2 flex items-center gap-2">
                    <Clock size={16} className="text-yellow-400" />
                    {service.delivery_time || "Flexible Terms"}
                  </p>
                </div>
                <div className="text-[10px] text-white/40 font-light leading-normal">
                  The provider is bound to upload checkout proof within this scheduled delivery window.
                </div>
              </div>
            </section>

            {/* ================= ABOUT SERVICE ================= */}
            <section className="space-y-3.5">
              <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/30 italic">
                About the service
              </h4>
              <p className="text-white/70 text-sm leading-relaxed font-light whitespace-pre-wrap">
                {service.description || "No customized service narrative defined. Use the messaging tool below to communicate instructions, specs, and timeline requirements directly with this specialist."}
              </p>
            </section>

            {/* ================= PORTFOLIO / COMPLETED WORK ================= */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/30 italic">
                  Specialist Portfolio / Work
                </h4>
                <span className="text-[9px] uppercase tracking-wider font-bold text-cyan-400 bg-cyan-400/5 px-2 px-3 py-1 rounded-md">
                  Previous Proofs
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {getPortfolioItems().map((work, idx) => (
                  <div key={idx} className="group rounded-2xl bg-white/[0.01] border border-white/5 overflow-hidden transition-all hover:bg-white/[0.02]">
                    <div className="aspect-[4/3] bg-white/5 overflow-hidden relative">
                      <img
                        src={work.image}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-all group-hover:scale-105 duration-500"
                        alt={work.title}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                        <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                          Completed project <ChevronRight size={10} />
                        </span>
                      </div>
                    </div>
                    <div className="p-3.5 space-y-1">
                      <h5 className="text-[10.5px] font-black text-white uppercase tracking-tight truncate">
                        {work.title}
                      </h5>
                      <p className="text-[9px] text-white/40 leading-normal line-clamp-2">
                        {work.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ================= WEEKLY AVAILABILITY ================= */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/30 italic flex items-center gap-2">
                  <Calendar size={12} className="text-blue-400" /> Weekly Live Availability
                </h4>
                <span className="text-[9px] font-black text-blue-400 bg-blue-500/10 px-3 py-1 rounded-md">
                  Timezone: UTC / Global
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {[
                  { day: 1, name: "M", working: true },
                  { day: 2, name: "T", working: true },
                  { day: 3, name: "W", working: true },
                  { day: 4, name: "T", working: true },
                  { day: 5, name: "F", working: true },
                  { day: 6, name: "S", working: false },
                  { day: 0, name: "S", working: false },
                ].map((sched) => {
                  const isCurrent = selectedDay === sched.day;
                  return (
                    <button
                      key={sched.day}
                      onClick={() => setSelectedDay(sched.day)}
                      className={`py-3 rounded-xl flex flex-col items-center gap-1 transition-all border ${
                        isCurrent
                          ? "bg-blue-600 border-blue-500 text-white shadow-lg"
                          : sched.working
                            ? "bg-white/5 border-transparent text-white/50 hover:bg-white/10"
                            : "bg-transparent border-white/5 text-white/20 cursor-default"
                      }`}
                    >
                      <span className="text-[9px] font-black uppercase tracking-widest">
                        {sched.name}
                      </span>
                      <span className={`w-1.5 h-1.5 rounded-full ${sched.working ? 'bg-sky-400' : 'bg-transparent'}`} />
                    </button>
                  );
                })}
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 text-[10px] text-white/50">
                ⚡ Provider starts escrow contracts dynamically on working intervals. Payout is released on milestones approval.
              </div>
            </section>

            {/* ================= REVIEWS SECTION ================= */}
            <section className="space-y-5">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/30 italic">
                  Verified Testimonials
                </h4>
                <span className="text-[9px] text-[#00ea87] font-black uppercase tracking-widest bg-emerald-500/5 border border-emerald-500/10 px-3 py-1 rounded-md flex items-center gap-1">
                  Verified Client Proofs
                </span>
              </div>

              <div className="space-y-4">
                {getReviews().map((rev, ix) => (
                  <div key={ix} className="p-5 rounded-3xl bg-white/[0.01] border border-white/5 space-y-3.5 hover:border-white/10 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 overflow-hidden">
                          <img src={rev.avatar} className="w-full h-full object-cover" alt={rev.name} referrerPolicy="no-referrer" />
                        </div>
                        <div>
                          <h5 className="font-black text-xs text-white uppercase tracking-tight">{rev.name}</h5>
                          <p className="text-[9px] text-white/30 uppercase font-bold">{rev.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Star size={10} className="fill-current" />
                          <span className="text-[10px] font-black text-white">{rev.rating}</span>
                        </div>
                        <span className="text-[8px] text-white/25 uppercase font-medium mt-0.5 block">{rev.date}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-white/60 font-light leading-relaxed">
                      "{rev.text}"
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Verified Escrow platform guarantee */}
            <section className="p-6 rounded-[2.5rem] bg-gradient-to-br from-blue-950/20 to-transparent border border-blue-500/15 space-y-2">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Sparkles size={16} className="text-blue-400" />
                </div>
                <div>
                  <h6 className="font-black text-xs uppercase text-white tracking-widest mb-1">
                    Verified Escrow Safeguard
                  </h6>
                  <p className="text-[10px] text-white/50 leading-relaxed font-light">
                    Your escrow deposits are fully managed and secure. Milestone disbursements are only transferred to the freelance contract specialist once you approve the results in your activity dashboard.
                  </p>
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* Dynamic Interactive Messaging Modal overlay */}
        <AnimatePresence>
          {isMessaging && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="absolute inset-x-0 bottom-24 p-6 bg-[#09090b] border-t border-white/10 rounded-t-[2.5rem] z-50 space-y-4 shadow-xl"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-cyan-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-white">Direct Message to {providerName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMessaging(false)}
                  className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white"
                >
                  <X size={12} />
                </button>
              </div>

              {messageSent ? (
                <div className="py-6 flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                    <Check size={18} />
                  </div>
                  <p className="text-[10px] font-black uppercase text-white/80 tracking-widest">Message Dispatched Successfully</p>
                  <p className="text-[8.5px] text-white/40 uppercase font-black">Connecting in messenger channel...</p>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="space-y-3">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    required
                    placeholder={`Compose specifications, custom scope budget details or questions for ${providerName}...`}
                    rows={3}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-xs font-light text-white outline-none focus:border-cyan-500/30 transition-all focus:bg-white/5 placeholder-white/20 resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-6 h-11 bg-cyan-600 hover:bg-cyan-500 rounded-full text-[9px] font-black uppercase tracking-widest text-[#0c0c0e] flex items-center gap-1.5 shadow-md"
                    >
                      <Send size={11} /> Send Message
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic checkout Action Panel at bottom (STAY ALWAYS VISIBLE) */}
        <div className="absolute bottom-0 inset-x-0 p-6 bg-[#0c0c0e]/95 border-t border-white/10 backdrop-blur-md flex items-center justify-between z-[40]">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] leading-none mb-1.5">Project Scope Price</span>
            <span className="font-display font-black text-xl text-white tracking-tight flex items-baseline">
              {formattedPrice}
              {service.pricing_type === "hourly" && <span className="text-[10px] font-light text-white/30 font-sans ml-0.5"> /hr</span>}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct Message Button */}
            <button
              onClick={() => setIsMessaging(!isMessaging)}
              className="w-14 h-14 rounded-full border border-white/15 bg-white/5 text-white flex items-center justify-center hover:bg-white/10 hover:border-white/30 transition-all active:scale-95"
              title="Message Provider"
            >
              <MessageSquare size={18} />
            </button>

            {/* Pin Save Button */}
            <button
              onClick={() => onSaveToggle(service.id)}
              className="w-14 h-14 rounded-full border border-white/15 bg-white/5 text-white flex items-center justify-center hover:bg-white/10 hover:border-white/30 transition-all active:scale-95"
              title="Toggle Saved state"
            >
              <Heart size={18} className={isSaved ? "fill-red-500 text-red-500" : ""} />
            </button>

            {/* Standout "Hire Now" button - Always fully visible at bottom */}
            <button
              onClick={() => onHire(service)}
              className="px-8 h-14 rounded-full bg-white hover:bg-neutral-100 font-black text-xs uppercase tracking-[0.15em] text-black shadow-2xl active:scale-[0.97] transition-all flex items-center gap-2"
            >
              <Zap size={14} className="fill-black text-black" />
              Hire Now
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
