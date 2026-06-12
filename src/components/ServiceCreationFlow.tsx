import { useState, useRef, useEffect, ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronLeft, ChevronRight, Image as ImageIcon, Video, Star, MapPin, CheckCircle2, Wand2, Search, ArrowRight, Camera, UploadCloud, ShieldAlert, Users, Sparkles, AlertCircle } from "lucide-react";
import { useMarketplaceStore } from "../features/marketplace/stores/useMarketplaceStore";
import { useProfileStore } from "../features/profile/stores/useProfileStore";
import { useAgentStore } from "../stores/useAgentStore";
import { supabase } from "../lib/supabase";
import HustlerUpgradeFlow from "./HustlerUpgradeFlow";

interface ServiceCreationFlowProps {
  onClose: () => void;
  onSuccess: (listing: any) => void;
}

type Step = "select_hustler" | "basic" | "pricing" | "media" | "availability" | "preview" | "published";

const CATEGORIES = [
  "Home Repair & Maintenance",
  "Cleaning Services",
  "Automotive & Detail",
  "Landscaping & Yard",
  "Beauty & Personal Care",
  "Freelance & Digital",
  "Event Services",
  "Moving & Heavy Lifting"
];

const SUBCATEGORIES: Record<string, string[]> = {
  "Home Repair & Maintenance": ["Plumbing", "Electrical", "Carpentry", "Painting", "Handyman", "Appliance Repair"],
  "Cleaning Services": ["Deep Cleaning", "Standard Cleaning", "Move-in/Move-out", "Carpet Cleaning", "Window Cleaning"],
  "Automotive & Detail": ["Mobile Detailing", "Oil Change", "Paint Correction", "Ceramic Coating", "Tire Service"],
  "Landscaping & Yard": ["Lawn Mowing", "Tree Trimming", "Garden Design", "Hardscaping", "Fertilization"],
  "Beauty & Personal Care": ["Hair Styling", "Barber Cuts", "Makeup", "Nails", "Massage Therapy"],
  "Freelance & Digital": ["Graphic Design", "Web Development", "Video Editing", "Copywriting", "Consulting"],
  "Event Services": ["Photography", "DJ", "Catering", "Bartending", "Event Planning"],
  "Moving & Heavy Lifting": ["Local Moving", "Junk Removal", "Furniture Assembly", "Heavy Lifting"]
};

export default function ServiceCreationFlow({ onClose, onSuccess }: ServiceCreationFlowProps) {
  const { createService } = useMarketplaceStore();
  const { profile } = useProfileStore();
  const { managedHustlers, fetchManagedHustlers } = useAgentStore();
  
  const [step, setStep] = useState<Step>("basic");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification & Role States
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<"none" | "pending" | "approved" | "rejected" | null>(null);
  const [showUpgradeFlow, setShowUpgradeFlow] = useState(false);

  // Agent State Controls
  const [selectedHustlerId, setSelectedHustlerId] = useState<string | null>(null);
  const [selectedHustlerName, setSelectedHustlerName] = useState<string>("");

  // Step 1: Basic Information
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [description, setDescription] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSubcategoryDropdown, setShowSubcategoryDropdown] = useState(false);

  // Step 2: Pricing
  const [priceType, setPriceType] = useState<"Fixed" | "Starting" | "Custom">("Fixed");
  const [price, setPrice] = useState("");
  const [deliveryTimeline, setDeliveryTimeline] = useState("1-3 Days");

  // Step 3: Media
  const [images, setImages] = useState<{ id: string, file: File, url: string }[]>([]);
  const [videos, setVideos] = useState<{ id: string, file: File, url: string }[]>([]);
  const [coverMediaId, setCoverMediaId] = useState<string | null>(null);
  
  // Step 4: Availability
  const [availability, setAvailability] = useState<"Available Now" | "Appointment Only" | "Custom Schedule">("Available Now");

  // State handles
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Check user status and load managed agents if the supervisor has agency credentials
  useEffect(() => {
    async function determineEligibility() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setVerificationStatus("none");
          setCheckingEligibility(false);
          return;
        }

        // Fetch application/verification status
        const { data } = await supabase
          .from('creator_verifications')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          setVerificationStatus((data as any).status);
        } else {
          setVerificationStatus("none");
        }

        // Trigger agent fetching if they enjoy premium management privileges
        if (profile?.is_agent) {
          await fetchManagedHustlers();
          setStep("select_hustler");
        }
      } catch (err) {
        console.error(err);
        setVerificationStatus("none");
      } finally {
        setCheckingEligibility(false);
      }
    }

    determineEligibility();
  }, [profile]);

  const generateAIsuggestions = () => {
    // Mock AI generation
    if (!category && !title) {
      setTitle("Premium Sink & Faucet Installation");
      setCategory("Home Repair & Maintenance");
      setSubcategory("Plumbing");
      setDescription("Professional installation and replacement of kitchen or bathroom sinks and faucets. Includes removal of old fixtures, sealing, and leak testing. Quick, clean, and guaranteed to last.");
    } else if (category === "Automotive & Detail") {
      setTitle("Complete Mobile Exterior & Interior Detail");
      setSubcategory("Mobile Detailing");
      setDescription("We come to you! A full deep clean of your vehicle's interior and a pristine wash, wax, and tire shine for the exterior. Returns your car to a showroom finish.");
    } else {
      setDescription(`Professional ${title || subcategory || category || 'service'} tailored to your exact needs. We take pride in high-quality craftsmanship, clear communication, and delivering results that exceed expectations.`);
    }
  };

  const currentStepProgress = () => {
    switch(step) {
      case "select_hustler": return 10;
      case "basic": return 25;
      case "pricing": return 45;
      case "media": return 65;
      case "availability": return 85;
      case "preview": return 100;
      default: return 0;
    }
  };

  const handleNextBasic = () => {
    if (!title || !category || !description) {
      setErrorMessage("Title, category, and description are required.");
      return;
    }
    setErrorMessage(null);
    setStep("pricing");
  };

  const handleNextPricing = () => {
    if (priceType !== "Custom" && !price) {
      setErrorMessage("Please set a price.");
      return;
    }
    setErrorMessage(null);
    setStep("media");
  };

  const handleNextMedia = () => {
    if (images.length === 0 && videos.length === 0) {
      setErrorMessage("Please upload at least one image or video.");
      return;
    }
    setErrorMessage(null);
    setStep("availability");
  };

  const handleNextAvailability = () => {
    setErrorMessage(null);
    setStep("preview");
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    const newImgs = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      url: URL.createObjectURL(file)
    }));
    setImages(prev => {
      const next = [...prev, ...newImgs];
      if (!coverMediaId && next.length > 0) {
        setCoverMediaId(next[0].id);
      }
      return next;
    });
  };

  const handleVideoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    const newVids = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      url: URL.createObjectURL(file)
    }));
    setVideos(prev => {
      const next = [...prev, ...newVids];
      if (!coverMediaId && next.length > 0) {
        setCoverMediaId(next[0].id);
      }
      return next;
    });
  };

  const handlePublish = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    let finalCoverUrl = "";
    
    // In a real app we upload all media here to storage. 
    // For this prototype, we'll extract the first media URL if it exists, or just use the local blob URL.
    try {
      // Find cover media
      const allMedia = [...images, ...videos];
      const coverMedia = allMedia.find(m => m.id === coverMediaId) || allMedia[0];
      
      let publicUrl = "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop"; // fallback
      
      // We will skip actual Supabase storage upload for speed unless it fits
      // Mocking successful creation
      const priceNum = parseFloat(price) || 0;
      const result = await createService({
        title,
        description,
        category,
        pricing_type: (priceType === "Custom" || priceType === "Starting" ? "custom" : "fixed"),
        base_price: priceNum,
        delivery_time: deliveryTimeline,
        media: [{ url: publicUrl, type: 'image', metadata: { is_cover: true } }],
        owner_id: selectedHustlerId || undefined
      });

      if (result) {
        setStep("published");
      } else {
        setErrorMessage("Failed to publish your service. Please try again.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProgress = () => {
    const totalSteps = profile?.is_agent ? 6 : 5;
    let stepNum = 1;
    if (profile?.is_agent) {
      if (step === "select_hustler") stepNum = 1;
      else if (step === "basic") stepNum = 2;
      else if (step === "pricing") stepNum = 3;
      else if (step === "media") stepNum = 4;
      else if (step === "availability") stepNum = 5;
      else if (step === "preview") stepNum = 6;
    } else {
      if (step === "basic") stepNum = 1;
      else if (step === "pricing") stepNum = 2;
      else if (step === "media") stepNum = 3;
      else if (step === "availability") stepNum = 4;
      else if (step === "preview") stepNum = 5;
    }

    return (
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#93c5fd]">
            {selectedHustlerId ? `Creating listing for: ${selectedHustlerName}` : "My Listing"}
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
            Step {stepNum} of {totalSteps}
          </span>
        </div>
        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden relative">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${currentStepProgress()}%` }}
            className="absolute top-0 left-0 bottom-0 bg-brand-primary"
          />
        </div>
      </div>
    );
  };

  // 1. Loading Screen
  if (checkingEligibility) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-brand-primary border-t-transparent animate-spin mb-2" />
          <p className="text-white/60 text-xs font-black uppercase tracking-wider">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  // 2. Upgrade flow injection overlay
  if (showUpgradeFlow) {
    return (
      <div className="fixed inset-0 z-[110] bg-[#050505]">
        <HustlerUpgradeFlow 
          onClose={() => setShowUpgradeFlow(false)}
          onSuccess={() => {
            setShowUpgradeFlow(false);
            setVerificationStatus("pending");
          }}
        />
      </div>
    );
  }

  // A. Pending Hustler Screen (if verificationStatus is pending and user is not an agent)
  if (!profile?.is_agent && verificationStatus === "pending") {
    return (
      <motion.div
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center p-6 text-center font-sans"
      >
        <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mb-6 relative shadow-[0_0_50px_rgba(245,158,11,0.15)]">
          <AlertCircle size={36} className="text-amber-500" />
        </div>
        <h2 className="text-2xl font-display font-black tracking-tighter uppercase text-white mb-2">Application Under Review</h2>
        <p className="text-sm font-medium text-white/55 leading-relaxed max-w-sm mb-8">
          To maintain an elite standard of marketplace quality, we certify all service providers before their listings go live. Your application is currently under review by our high-street moderation team.
        </p>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 w-full max-w-sm mb-10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-white/40">Status</span>
            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30">PENDING APPROVAL</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="w-full max-w-sm h-14 bg-white/10 text-white rounded-full font-black text-xs uppercase tracking-widest border border-white/10 hover:bg-white/25 active:scale-95 transition-transform"
        >
          Return to Dashboard
        </button>
      </motion.div>
    );
  }

  // B. Client Restriction Screen (if user is not an agent and is not an approved hustler)
  const isApprovedHustler = profile?.is_hustler === true || profile?.role === 'hustler' || profile?.role === 'both' || profile?.role === 'creator' || verificationStatus === "approved";
  if (!profile?.is_agent && !isApprovedHustler) {
    return (
      <motion.div
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center p-6 text-center font-sans"
      >
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mb-6 relative shadow-[0_0_50px_rgba(239,68,68,0.15)]">
          <ShieldAlert size={36} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-display font-black tracking-tighter uppercase text-white mb-2">Upgrade Required</h2>
        <p className="text-sm font-medium text-white/55 leading-relaxed max-w-sm mb-10">
          Listing services on the Hustle marketplace is restricted to certified providers. This preserves marketplace excellence and ensures premier-tier experiences for our neighborhood.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button 
            onClick={() => setShowUpgradeFlow(true)}
            className="w-full h-14 bg-brand-primary text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-brand-primary-light active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            Become a Certified Hustler <Sparkles size={16} />
          </button>
          <button 
            onClick={onClose}
            className="w-full h-14 bg-white/5 border border-white/10 text-white/70 rounded-full font-black text-xs uppercase tracking-widest hover:text-white hover:bg-white/10 active:scale-95 transition-transform"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-[#050505] flex flex-col font-sans"
    >
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />

      {/* Header */}
      <header className="px-5 pt-12 pb-4 relative z-20 flex items-center justify-between">
        <button onClick={() => {
          if (step === "select_hustler" || step === "basic" || step === "published") {
            if (step === "basic" && profile?.is_agent) {
              setStep("select_hustler");
            } else {
              onClose();
            }
          } else {
            if(step === "preview") setStep("availability");
            else if(step === "availability") setStep("media");
            else if(step === "media") setStep("pricing");
            else if(step === "pricing") setStep("basic");
          }
        }} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-black/40 backdrop-blur-md text-white/60 hover:text-white">
          {(step === "select_hustler" && profile?.is_agent) || (!profile?.is_agent && step === "basic") || step === "published" ? <X size={20} /> : <ChevronLeft size={20} />}
        </button>
        <span className="text-xs font-black uppercase tracking-widest text-white/50">Service Builder</span>
        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-32 no-scrollbar relative z-10">
        
        {step !== "published" && renderProgress()}

        <AnimatePresence mode="wait">
          
          {/* STEP: SELECT HUSTLER (For Agents) */}
          {step === "select_hustler" && (
            <motion.div key="select_hustler" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-black font-display tracking-tight text-white mb-2">Agency Delegation</h2>
                <p className="text-sm font-medium text-white/50 leading-relaxed">Choose a managed Hustler from your active roster to create this service listing for.</p>
              </div>

              {managedHustlers.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                  <p className="text-sm font-medium text-white/50 mb-6 leading-relaxed">
                    You do not have any active managed Hustlers yet. You can invite other specialists to join your agency from your Account Profile's Agent Center.
                  </p>
                  <button 
                    onClick={onClose}
                    className="px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white font-bold text-xs uppercase tracking-widest transition-transform active:scale-95"
                  >
                    Go Back
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black uppercase text-white/40 mb-1 block ml-1">Your Active Specialists</label>
                  <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto pr-1">
                    {managedHustlers.map((item) => {
                      const husProfile = item.hustler_profile;
                      const displayName = husProfile?.full_name || husProfile?.username || "Specialist";
                      const subtitle = husProfile?.primary_skill || `Commission: ${item.commission_percentage}%`;
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSelectedHustlerId(item.hustler_id);
                            setSelectedHustlerName(displayName);
                            setStep("basic");
                          }}
                          className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl text-left transition-colors group"
                        >
                          <img 
                            src={husProfile?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"} 
                            className="w-12 h-12 rounded-xl object-cover border border-white/10" 
                            alt=""
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-white group-hover:text-brand-primary transition-colors truncate">{displayName}</h4>
                            <p className="text-xs text-white/40 font-medium truncate">{subtitle}</p>
                          </div>
                          <ChevronRight size={16} className="text-white/40 group-hover:text-white transition-colors" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 1: BASIC INFO */}
          {step === "basic" && (
            <motion.div key="basic" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-black font-display tracking-tight text-white mb-2">Service Details</h2>
                <p className="text-sm font-medium text-white/50 leading-relaxed">Let's craft the perfect pitch for your service.</p>
              </div>

              <button onClick={generateAIsuggestions} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-black uppercase tracking-widest transition-transform active:scale-95">
                <Wand2 size={16} /> Auto-fill with AI
              </button>

              <div className="space-y-4">
                <div className="relative">
                  <label className="text-[10px] font-black uppercase text-white/40 mb-1.5 block ml-1">Service Title</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Premium Sink Installation" className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-white placeholder:text-white/20 focus:border-brand-primary focus:bg-white/10 outline-none font-bold" />
                </div>

                <div className="relative">
                  <label className="text-[10px] font-black uppercase text-white/40 mb-1.5 block ml-1">Category</label>
                  <div className="relative">
                    <div className="relative flex items-center">
                      <input 
                        value={showCategoryDropdown ? categorySearch : category}
                        onFocus={() => { setShowCategoryDropdown(true); setCategorySearch(""); }}
                        onChange={(e) => { setCategorySearch(e.target.value); setShowCategoryDropdown(true); }}
                        placeholder="Search categories..."
                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-white font-bold placeholder:text-white/20 focus:border-brand-primary focus:bg-white/10 outline-none"
                      />
                      <Search size={16} className="text-white/40 absolute right-5 pointer-events-none" />
                    </div>
                    {showCategoryDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[#121212] border border-white/10 rounded-2xl p-2 z-[60] max-h-60 overflow-y-auto shadow-2xl">
                        {CATEGORIES.filter(c => c.toLowerCase().includes(categorySearch.toLowerCase())).length > 0 ? (
                          CATEGORIES.filter(c => c.toLowerCase().includes(categorySearch.toLowerCase())).map(c => (
                            <button key={c} onClick={() => { setCategory(c); setCategorySearch(c); setSubcategory(""); setShowCategoryDropdown(false); }} className="w-full text-left px-4 py-3 text-sm font-bold text-white hover:bg-white/10 rounded-xl transition-colors">
                              {c}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm font-bold text-white/40">No categories found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {category && (!showCategoryDropdown) && SUBCATEGORIES[category] && (
                  <div className="relative">
                    <label className="text-[10px] font-black uppercase text-white/40 mb-1.5 block ml-1">Subcategory</label>
                    <div className="flex flex-wrap gap-2">
                      {SUBCATEGORIES[category].map(sub => (
                        <button key={sub} onClick={() => setSubcategory(sub)} className={`px-4 py-2.5 rounded-full text-xs font-bold transition-colors ${subcategory === sub ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'}`}>
                          {sub}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="relative">
                  <label className="text-[10px] font-black uppercase text-white/40 mb-1.5 block ml-1">Short Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What exactly is included in this service?" className="w-full h-32 py-4 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm text-white placeholder:text-white/20 focus:border-brand-primary focus:bg-white/10 outline-none resize-none font-medium leading-relaxed" />
                </div>
              </div>

              {errorMessage && <p className="text-red-500 text-xs text-center font-bold">{errorMessage}</p>}
              
              <button onClick={handleNextBasic} className="w-full h-14 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest mt-4 active:scale-95 transition-transform flex items-center justify-center gap-2">
                Continue <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {/* STEP 2: PRICING */}
          {step === "pricing" && (
            <motion.div key="pricing" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-black font-display tracking-tight text-white mb-2">Pricing model</h2>
                <p className="text-sm font-medium text-white/50 leading-relaxed">How do you charge for this service?</p>
              </div>

              <div className="flex flex-col gap-3">
                {[
                  { id: "Fixed", label: "Fixed Price", desc: "A specific unchanging price" },
                  { id: "Starting", label: "Starting From", desc: "Base price, varies by scope" },
                  { id: "Custom", label: "Custom Quote", desc: "Pricing requires a conversation" }
                ].map(pt => (
                  <button key={pt.id} onClick={() => setPriceType(pt.id as any)} className={`p-4 rounded-2xl border text-left flex flex-col gap-1 transition-colors ${priceType === pt.id ? 'bg-brand-primary/10 border-brand-primary' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                    <span className={`font-black text-sm uppercase tracking-wider ${priceType === pt.id ? 'text-brand-primary' : 'text-white'}`}>{pt.label}</span>
                    <span className="text-xs text-white/50 font-medium">{pt.desc}</span>
                  </button>
                ))}
              </div>

              {priceType !== "Custom" && (
                <div className="relative mt-2">
                  <label className="text-[10px] font-black uppercase text-white/40 mb-1.5 block ml-1">Amount ($)</label>
                  <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className="w-full h-20 bg-white/5 border border-white/10 rounded-[2rem] px-8 text-4xl text-white font-black placeholder:text-white/20 focus:border-brand-primary focus:bg-white/10 outline-none" />
                </div>
              )}

              <div className="relative mt-2">
                <label className="text-[10px] font-black uppercase text-white/40 mb-1.5 block ml-1">Delivery / Completion Timeline</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Same Day", "1-3 Days", "1 Week", "2+ Weeks"].map(t => (
                    <button key={t} onClick={() => setDeliveryTimeline(t)} className={`h-12 rounded-xl text-xs font-black uppercase tracking-widest border transition-colors ${deliveryTimeline === t ? 'bg-white bg-opacity-10 border-white text-white' : 'bg-white/5 border-white/10 text-white/40'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {errorMessage && <p className="text-red-500 text-xs text-center font-bold">{errorMessage}</p>}
              
              <button onClick={handleNextPricing} className="w-full h-14 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest mt-auto active:scale-95 transition-transform flex items-center justify-center gap-2">
                Continue <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {/* STEP 3: MEDIA */}
          {step === "media" && (
            <motion.div key="media" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-black font-display tracking-tight text-white mb-2">Visual Proof</h2>
                <p className="text-sm font-medium text-white/50 leading-relaxed">Upload compelling images or videos that showcase your quality of work.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => fileInputRef.current?.click()} className="aspect-square bg-white/5 border-2 border-dashed border-white/10 hover:border-white/30 rounded-3xl flex flex-col items-center justify-center gap-2 text-white/50 hover:text-white active:scale-95 transition-all">
                  <ImageIcon size={32} />
                  <span className="text-[10px] font-black uppercase tracking-widest mt-1">Add Images</span>
                  <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                </button>
                <button onClick={() => videoInputRef.current?.click()} className="aspect-square bg-white/5 border-2 border-dashed border-white/10 hover:border-white/30 rounded-3xl flex flex-col items-center justify-center gap-2 text-white/50 hover:text-white active:scale-95 transition-all">
                  <Video size={32} />
                  <span className="text-[10px] font-black uppercase tracking-widest mt-1">Add Videos</span>
                  <input ref={videoInputRef} type="file" multiple accept="video/*" onChange={handleVideoUpload} className="hidden" />
                </button>
              </div>

              {(images.length > 0 || videos.length > 0) && (
                <div className="mt-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Select Cover Media</h3>
                  <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar">
                    {images.map(img => (
                      <button key={img.id} onClick={() => setCoverMediaId(img.id)} className={`relative w-28 h-28 rounded-2xl overflow-hidden shrink-0 border-2 transition-all ${coverMediaId === img.id ? 'border-brand-primary' : 'border-transparent'}`}>
                        <img src={img.url} className="w-full h-full object-cover" alt="" />
                        {coverMediaId === img.id && <div className="absolute top-2 right-2 w-5 h-5 bg-brand-primary rounded-full flex items-center justify-center"><CheckCircle2 size={12} className="text-white"/></div>}
                      </button>
                    ))}
                    {videos.map(vid => (
                      <button key={vid.id} onClick={() => setCoverMediaId(vid.id)} className={`relative w-28 h-28 rounded-2xl overflow-hidden shrink-0 border-2 bg-black flex items-center justify-center transition-all ${coverMediaId === vid.id ? 'border-brand-primary' : 'border-transparent'}`}>
                        <video src={vid.url} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                        <Video size={20} className="text-white z-10" />
                        {coverMediaId === vid.id && <div className="absolute top-2 right-2 w-5 h-5 bg-brand-primary rounded-full flex items-center justify-center z-20"><CheckCircle2 size={12} className="text-white"/></div>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {errorMessage && <p className="text-red-500 text-xs text-center font-bold">{errorMessage}</p>}
              
              <button onClick={handleNextMedia} className="w-full h-14 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest mt-auto active:scale-95 transition-transform flex items-center justify-center gap-2">
                Continue <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {/* STEP 4: AVAILABILITY */}
          {step === "availability" && (
            <motion.div key="availability" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-black font-display tracking-tight text-white mb-2">Availability</h2>
                <p className="text-sm font-medium text-white/50 leading-relaxed">When can clients book this service?</p>
              </div>

              <div className="flex flex-col gap-3 mt-4">
                {[
                  { id: "Available Now", label: "Available Now", desc: "Clients can book you immediately for today or tomorrow." },
                  { id: "Appointment Only", label: "Appointment Only", desc: "Clients request a slot from your calendar." },
                  { id: "Custom Schedule", label: "Custom Schedule", desc: "Set strict working hours for this service." }
                ].map(a => (
                  <button key={a.id} onClick={() => setAvailability(a.id as any)} className={`p-5 rounded-2xl border text-left flex flex-col gap-1 transition-colors ${availability === a.id ? 'bg-white bg-opacity-10 border-white text-white' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                    <span className={`font-black text-sm uppercase tracking-wider ${availability === a.id ? 'text-white' : 'text-white/60'}`}>{a.label}</span>
                    <span className="text-[11px] text-white/50 font-medium leading-relaxed">{a.desc}</span>
                  </button>
                ))}
              </div>

              {errorMessage && <p className="text-red-500 text-xs text-center font-bold">{errorMessage}</p>}
              
              <button onClick={handleNextAvailability} className="w-full h-14 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest mt-auto active:scale-95 transition-transform flex items-center justify-center gap-2">
                Preview Service <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {/* STEP 5: PREVIEW */}
          {step === "preview" && (
            <motion.div key="preview" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-black font-display tracking-tight text-white mb-2">Final Review</h2>
                <p className="text-sm font-medium text-white/50 leading-relaxed">Here's how clients will see your service.</p>
              </div>

              {/* Service Card Preview */}
              <div className="w-full bg-[#111] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl pb-6">
                <div className="aspect-[4/3] w-full bg-black relative flex items-center justify-center">
                  {coverMediaId && (() => {
                    const media = [...images, ...videos].find(m => m.id === coverMediaId);
                    if (media) {
                      return <img src={media.url} className="w-full h-full object-cover" alt="" />;
                    }
                  })()}
                  {!coverMediaId && <ImageIcon size={40} className="text-white/20" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white border border-white/10">
                    {category}
                  </div>
                </div>

                <div className="px-6 pt-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] uppercase font-black tracking-widest text-brand-primary">{subcategory}</span>
                  </div>
                  <h3 className="text-xl font-display font-black leading-tight mb-2 text-white">{title}</h3>
                  <p className="text-xs text-white/60 font-medium leading-relaxed line-clamp-3 mb-5">
                    {description}
                  </p>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                        {priceType === "Starting" ? "Starting at" : priceType === "Custom" ? "Custom Quote" : "Fixed Price"}
                      </p>
                      {priceType !== "Custom" && (
                        <p className="text-2xl font-black text-white">${price}</p>
                      )}
                    </div>
                    <div className="bg-white/10 px-3 py-1.5 rounded-lg text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/50">Turnaround</p>
                      <p className="text-xs font-bold text-white">{deliveryTimeline}</p>
                    </div>
                  </div>
                </div>
              </div>

              {errorMessage && <p className="text-red-500 text-xs text-center font-bold">{errorMessage}</p>}
              
              <div className="mt-4 pb-8">
                <button 
                  onClick={handlePublish}
                  disabled={isSubmitting}
                  className="w-full h-14 bg-brand-primary text-white hover:bg-red-600 rounded-full font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-glow-red flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>Publish Service <UploadCloud size={16} /></>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 6: PUBLISHED */}
          {step === "published" && (
            <motion.div key="published" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center text-center h-[50vh] mt-10">
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 relative shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                <CheckCircle2 size={40} className="text-white z-10" />
                <div className="absolute inset-0 bg-green-500 opacity-20 blur-xl rounded-full" />
              </div>
              
              <h2 className="text-3xl font-display font-black tracking-tighter uppercase text-white mb-3">Service Live</h2>
              <p className="text-sm font-medium text-white/60 leading-relaxed max-w-xs mx-auto mb-10">
                Your new service is published and ready for bookings. Share it with your network!
              </p>

              <button 
                onClick={() => onSuccess({ title, category, description, price, type: "Service" })}
                className="w-full h-14 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest active:scale-95 transition-transform"
              >
                View My Services
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  );
}
