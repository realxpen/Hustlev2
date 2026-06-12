import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { 
  X, ChevronLeft, ChevronRight, Video, Camera, Briefcase, 
  Sparkles, Image as ImageIcon, Music, Volume2, Type, Sliders, Scissors, Plus,
  Bookmark, CheckCircle2, DollarSign, Calendar, Clock,
  ArrowRight, Globe, Lock, Users, Zap, Eye, Save, Trash2, MapPin, RotateCw, MapIcon, Award
} from "lucide-react";
import { usePostActions } from '../features/feed/hooks/usePostActions';
import { supabase } from '../lib/supabase';

interface UnifiedCreatorFlowProps {
  initialType?: string;
  onClose: () => void;
  onPublish: (data: any) => void;
}

// 6 content options requested
const CREATE_OPTIONS = [
  {
    id: "record_video",
    title: "1. Record Video",
    description: "Shoot a quick demo or intro with your camera",
    icon: <Camera className="text-red-400" />,
    color: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
  {
    id: "upload_video",
    title: "2. Upload Video",
    description: "Select and share an existing video from your device",
    icon: <Video className="text-blue-400" />,
    color: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  {
    id: "upload_images",
    title: "3. Upload Images",
    description: "Share high-quality photos of your process",
    icon: <ImageIcon className="text-emerald-400" />,
    color: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
  {
    id: "create_service",
    title: "4. Create Service",
    description: "Offer a new commercial booking option",
    icon: <Briefcase className="text-purple-400" />,
    color: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
  },
  {
    id: "share_project",
    title: "5. Share Project",
    description: "Show off a finished project and case study",
    icon: <Sparkles className="text-yellow-400" />,
    color: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
  },
  {
    id: "share_customer_result",
    title: "6. Share Customer Result",
    description: "Post before & after proof of your hard work",
    icon: <CheckCircle2 className="text-pink-400" />,
    color: "bg-pink-500/10",
    borderColor: "border-pink-500/20",
  }
];

const SUGGESTED_SKILL_TAGS = [
  "Woodworking", 
  "Drywall Repair", 
  "Deep Cleaning", 
  "Plumbing", 
  "Fitted Kitchens", 
  "Electrical Work", 
  "Bricklaying", 
  "Roof Repair", 
  "Plastering", 
  "Car Detailing"
];

const SUGGESTED_HASHTAGS = [
  "#handyman", 
  "#plumbingsolutions", 
  "#carpentrylife", 
  "#constructionhustle", 
  "#beforeandafter", 
  "#craftmanship", 
  "#hustlehard"
];

// Content Type Categories with illustrative human-facing examples
const CONTENT_TYPES = [
  {
    id: "skill_demonstration",
    title: "Skill Demonstration",
    desc: "Prove your trade craftsmanship live",
    example: "Showing how you sand and seal a raw wooden dining table to look perfect.",
    icon: "🔥"
  },
  {
    id: "project_showcase",
    title: "Project Showcase",
    desc: "A beautiful walk-through of a finished job",
    example: "A slow pan showing kitchen cabinets model and details remodel you completed.",
    icon: "build_con"
  },
  {
    id: "before_after",
    title: "Before & After",
    desc: "Dramatic visual proof of your effectiveness",
    example: "Showing copper heating pipes covered in heavy rust alongside polished shiny pipework.",
    icon: "⚡"
  },
  {
    id: "educational_tip",
    title: "Educational Tip",
    desc: "Teach your professional knowledge to win trust",
    example: "A rapid 3-step method to cleanly patch a circular hole in drywall.",
    icon: "💡"
  },
  {
    id: "customer_testimonial",
    title: "Customer Testimonial",
    desc: "Let satisfied customers sell for you",
    example: "A quick client endorsement sharing how fast you repaired their heating system.",
    icon: "⭐️"
  },
  {
    id: "service_promotion",
    title: "Service Promotion",
    desc: "Promote a structured service option directly",
    example: "An overview of a $120 home gutter deep-clean service ready for bookings.",
    icon: "🏷️"
  }
];

export default function UnifiedCreatorFlow({ initialType, onClose, onPublish }: UnifiedCreatorFlowProps) {
  const { createPost, isUploading: isPostUploading } = usePostActions();
  const [workflow, setWorkflow] = useState<string | null>(initialType || null);
  const [stepIndex, setStepIndex] = useState(0);

  // Form Fields
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [duration, setDuration] = useState("2 Hours");
  const [location, setLocation] = useState("");
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [newSkillTag, setNewSkillTag] = useState("");
  const [selectedContentType, setSelectedContentType] = useState("skill_demonstration");
  const [visibility, setVisibility] = useState<"public" | "clients" | "private">("public");

  // Video State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(15);
  const [coverOnSecond, setCoverOnSecond] = useState(2);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [flashOn, setFlashOn] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  // Image State
  const [imageFiles, setImageFiles] = useState<{ id: string; file: File; url: string }[]>([]);

  // Camera stream
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const intervalRef = useRef<any>(null);

  // UX Improvement: Smart Defaults
  const [isScanning, setIsScanning] = useState(false);
  const [showSmartBanner, setShowSmartBanner] = useState(false);
  const [suggestedDefaults, setSuggestedDefaults] = useState<{
    title: string;
    description: string;
    skill: string;
    contentType: string;
    location: string;
    price: string;
    duration: string;
  } | null>(null);

  const triggerSmartDefaults = (name: string) => {
    setIsScanning(true);
    const lowercaseName = name.toLowerCase();
    
    // Choose the best defaults depending on filename keywords
    let skill = "Woodworking";
    let defaultsTitle = "Premium Live-Edge Sanding & Finish";
    let defaultsDesc = "Restoring solid raw oak board. Premium multi-step sanding with orbital tools for a pristine satin smooth touch & durable water protection.";
    let category = "skill_demonstration";
    let price = "180";
    let durationVal = "3 Hours";

    if (lowercaseName.includes("barber") || lowercaseName.includes("hair") || lowercaseName.includes("fade") || lowercaseName.includes("shave") || lowercaseName.includes("cut")) {
      skill = "Barbering";
      defaultsTitle = "Cinematic Skin Fade & Textured Crop Styling";
      defaultsDesc = "Ultra-sharp skin fade blend paired with textured scissor crop styling, finished with foil shaving and premium oil edge lineup.";
      category = "skill_demonstration";
      price = "45";
      durationVal = "45 Mins";
    } else if (lowercaseName.includes("plumb") || lowercaseName.includes("pipe") || lowercaseName.includes("leak") || lowercaseName.includes("water") || lowercaseName.includes("heater")) {
      skill = "Plumbing";
      defaultsTitle = "Emergency Copper Pipe Soldering & Repair";
      defaultsDesc = "Solving a localized active copper pipe burst under high pressure. Clean solder union coupled with reinforced safety checks.";
      category = "before_after";
      price = "120";
      durationVal = "1 Hour";
    } else if (lowercaseName.includes("wall") || lowercaseName.includes("drywall") || lowercaseName.includes("patch") || lowercaseName.includes("plaster")) {
      skill = "Drywall Repair";
      defaultsTitle = "Drywall Hole Patching & Preparation";
      defaultsDesc = "Technique to cleanly patch a circular hole caused by handle impact. Applying dual quick-setting coats for perfect paint-ready finish.";
      category = "educational_tip";
      price = "95";
      durationVal = "2 Hours";
    } else if (lowercaseName.includes("clean") || lowercaseName.includes("dust") || lowercaseName.includes("carpet") || lowercaseName.includes("mop") || lowercaseName.includes("deep")) {
      skill = "Deep Cleaning";
      defaultsTitle = "Post-Remodel Deep Dust Extraction Cleaning";
      defaultsDesc = "Exacting commercial sanitation of work-surfaces, cabinetry, tiles and floor detailing to remove fine drywall and installation dust.";
      category = "project_showcase";
      price = "150";
      durationVal = "4 Hours";
    } else if (lowercaseName.includes("elect") || lowercaseName.includes("wire") || lowercaseName.includes("light") || lowercaseName.includes("switch")) {
      skill = "Electrical Work";
      defaultsTitle = "Commercial LED Sconce Wiring & Install";
      defaultsDesc = "Securely wiring local commercial display sconces. Tested continuity, dual insulation sleeves and certified code compliance.";
      category = "skill_demonstration";
      price = "110";
      durationVal = "1.5 Hours";
    }

    setSuggestedDefaults({
      title: defaultsTitle,
      description: defaultsDesc,
      skill,
      contentType: category,
      location: "Covent Garden, London", // From current city template defaults
      price,
      duration: durationVal,
    });

    setTimeout(() => {
      setIsScanning(false);
      setShowSmartBanner(true);
    }, 1200);
  };

  // Step sequences based on the workflow
  const getSteps = () => {
    switch(workflow) {
      case 'record_video':
        return ['camera_capture', 'trim_cover', 'metadata_form', 'type_selector', 'publish_portal'];
      case 'upload_video':
        return ['media_selection', 'trim_cover', 'metadata_form', 'type_selector', 'publish_portal'];
      case 'upload_images':
        return ['media_selection', 'metadata_form', 'type_selector', 'publish_portal'];
      case 'create_service':
        return ['service_details', 'metadata_form', 'type_selector', 'publish_portal'];
      case 'share_project':
        return ['media_selection', 'metadata_form', 'type_selector', 'publish_portal'];
      case 'share_customer_result':
        return ['before_after_upload', 'metadata_form', 'type_selector', 'publish_portal'];
      default:
        return ['select_workflow'];
    }
  };

  const steps = getSteps();
  const currentStep = steps[stepIndex];

  // Initialize camera for capture step
  useEffect(() => {
    if (workflow === 'record_video' && currentStep === 'camera_capture') {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: isFrontCamera ? 'user' : 'environment' }, audio: true })
        .then(s => {
          setStream(s);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(err => {
          console.warn("Camera hardware not available or denied, using virtual simulator.", err);
        });
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [workflow, currentStep, isFrontCamera]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Recording countdown
  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev >= 30) {
            handleStopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRecording]);

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // Create high-street mock video file for simulator fallback representation
    const mockBlob = new Blob(["mock video stream"], { type: "video/mp4" });
    const file = new File([mockBlob], "captured-demonstration.mp4", { type: "video/mp4" });
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    
    // Trigger smart default suggestions
    triggerSmartDefaults("captured-demonstration.mp4");
    
    // Immediately proceed to trim/cover screen
    setStepIndex(1); 
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      
      // Trigger smart default suggestions
      triggerSmartDefaults(file.name);
      
      setStepIndex(prev => prev + 1);
    }
  };

  const handleMultipleImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    const newImgs = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      url: URL.createObjectURL(file)
    }));
    setImageFiles(prev => [...prev, ...newImgs]);

    // Trigger smart default suggestions using the first image file name
    if (files.length > 0) {
      triggerSmartDefaults(files[0].name);
    }
  };

  const handleRemoveImage = (id: string) => {
    setImageFiles(prev => prev.filter(img => img.id !== id));
  };

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    const nextList = [...imageFiles];
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx >= 0 && targetIdx < nextList.length) {
      const temp = nextList[index];
      nextList[index] = nextList[targetIdx];
      nextList[targetIdx] = temp;
      setImageFiles(nextList);
    }
  };

  const handleAddSkillTag = (tagText: string) => {
    const formatted = tagText.trim();
    if (formatted && !skillTags.includes(formatted)) {
      setSkillTags(prev => [...prev, formatted]);
      setNewSkillTag("");
      setValidationError(null);
    }
  };

  const handleToggleSuggestedSkillTag = (tag: string) => {
    if (skillTags.includes(tag)) {
      setSkillTags(prev => prev.filter(t => t !== tag));
    } else {
      setSkillTags(prev => [...prev, tag]);
      setValidationError(null);
    }
  };

  const handleToggleHashtag = (tag: string) => {
    if (hashtags.includes(tag)) {
      setHashtags(prev => prev.filter(h => h !== tag));
    } else {
      setHashtags(prev => [...prev, tag]);
    }
  };

  const applySmartAutofill = () => {
    if (!suggestedDefaults) return;
    setTitle(suggestedDefaults.title);
    setDescription(suggestedDefaults.description);
    setSkillTags([suggestedDefaults.skill]);
    setSelectedContentType(suggestedDefaults.contentType);
    setLocation(suggestedDefaults.location);
    setBasePrice(suggestedDefaults.price);
    setDuration(suggestedDefaults.duration);
    
    // Fast-forward directly to the final publish stage
    const currentSteps = getSteps();
    const finalIdx = currentSteps.indexOf('publish_portal');
    if (finalIdx !== -1) {
      setStepIndex(finalIdx);
    }
    
    setShowSmartBanner(false);
  };

  const handleStepValidation = () => {
    setValidationError(null);

    // Validate video uploads on media selection step
    if (currentStep === 'media_selection' && (workflow === 'upload_video') && !videoFile) {
      setValidationError("⚠️ Please select a video file to continue.");
      return false;
    }

    if (currentStep === 'media_selection' && workflow === 'upload_images' && imageFiles.length === 0) {
      setValidationError("⚠️ Please upload at least one image file to continue.");
      return false;
    }

    // Validate at least one service media
    if (currentStep === 'service_details') {
      if (!title.trim()) {
        setValidationError("⚠️ Please enter a title for your service.");
        return false;
      }
      if (!basePrice.trim() || isNaN(Number(basePrice))) {
        setValidationError("⚠️ Please enter a valid numerical price for booking.");
        return false;
      }
    }

    // MANDATORY REQUIREMENT: At least one skill tag validated
    if (currentStep === 'metadata_form') {
      if (skillTags.length === 0) {
        setValidationError("⚠️ Skill Tag Required: Please select or type at least one trade skill tag so clients can search and find your work!");
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (handleStepValidation()) {
      setStepIndex(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setValidationError(null);
    if (stepIndex === 0) {
      if (workflow) {
        setWorkflow(null);
        setStepIndex(0);
      } else {
        onClose();
      }
    } else {
      setStepIndex(prev => prev - 1);
    }
  };

  const executePublish = async () => {
    setValidationError(null);

    // Final security check for skill tag requirement
    if (skillTags.length === 0) {
      setValidationError("⚠️ Please return and add at least one Skill Tag. It is required for publishing.");
      return;
    }

    // Build beautiful formatted caption containing tags, locations, category examples
    const selectedCatDetails = CONTENT_TYPES.find(c => c.id === selectedContentType);
    const catLabel = selectedCatDetails ? selectedCatDetails.title : selectedContentType;

    const formattedCaption = `${title ? `[${title}] ` : ''}${description}

📍 ${location || 'On-site'}
🏷️ Applied Skills: ${skillTags.map(s => `#${s}`).join(' ')}
📂 Category: ${catLabel}
${hashtags.join(' ')}`;

    // Get primary media file
    let fileToUpload: File | null = null;
    let mediaType: 'image' | 'video' | 'none' = 'none';

    if (workflow === 'record_video' || workflow === 'upload_video') {
      fileToUpload = videoFile;
      mediaType = 'video';
    } else if (imageFiles.length > 0) {
      fileToUpload = imageFiles[0].file;
      mediaType = 'image';
    }

    try {
      // Create real service listing first if service flow
      let attachedListingId = null;
      let attachedListingType = null;

      if (workflow === 'create_service') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: service, error: sErr } = await supabase
            .from('services')
            .insert({
              owner_id: user.id,
              title: title,
              description: description || `Professional ${skillTags[0] || 'skilled'} help`,
              base_price: parseFloat(basePrice) || 0,
              is_active: true
            })
            .select()
            .single();

          if (sErr) throw sErr;
          if (service) {
            attachedListingId = service.id;
            attachedListingType = 'service';
          }
        }
      }

      const post = await createPost(formattedCaption, fileToUpload, mediaType, attachedListingType, attachedListingId);
      if (post) {
        onPublish(post);
        onClose();
      } else {
        setValidationError("⚠️ An error occurred while uploading. Please try again.");
      }
    } catch (e: any) {
      console.error(e);
      setValidationError(`⚠️ Failed to publish: ${e.message || e}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black text-white flex flex-col font-sans overflow-hidden">
      {/* Visual background accents */}
      <div className="absolute inset-0 bg-[#070708] overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-brand-primary/5 via-transparent to-black" />
        <div className="noise-overlay opacity-[0.03]" />
      </div>

      {/* Progress & Header */}
      <header className="relative z-10 px-6 pt-12 pb-5 flex items-center justify-between border-b border-white/5 bg-black/60 backdrop-blur-2xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBack}
            className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-all text-xl cursor-pointer"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 italic">
              {workflow ? `Workflow: ${workflow.replace('_', ' ')}` : "Hustle Creation Platform"}
            </h2>
            <h1 className="text-base font-black uppercase tracking-tight italic text-brand-primary">
              {currentStep === 'select_workflow' && 'Choose Your Creation Option'}
              {currentStep === 'camera_capture' && 'Record Video Demo'}
              {currentStep === 'media_selection' && 'Choose Device Media'}
              {currentStep === 'trim_cover' && 'Trim Screen & Cover Frame'}
              {currentStep === 'service_details' && 'Define Service details'}
              {currentStep === 'before_after_upload' && 'Upload Comparative Screens'}
              {currentStep === 'metadata_form' && 'Tags & Details'}
              {currentStep === 'type_selector' && 'Who is this for? Content Type'}
              {currentStep === 'publish_portal' && 'Cinematic Publishing Preview'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {workflow && currentStep !== 'publish_portal' && (
            <button 
              onClick={handleNext}
              className="px-6 h-12 rounded-full bg-brand-primary hover:bg-[#ff4e4e] active:scale-95 text-white text-xs font-black uppercase tracking-widest shadow-glow-red flex items-center justify-center transition-all cursor-pointer"
            >
              Next <ChevronRight size={16} className="ml-1" />
            </button>
          )}
          {currentStep === 'publish_portal' && (
            <button 
              onClick={executePublish}
              disabled={isPostUploading}
              className={`px-8 h-12 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                isPostUploading ? 'bg-white/10 text-white/40 cursor-not-allowed' : 'bg-white text-black hover:bg-brand-primary hover:text-white cursor-pointer shadow-[0_0_30px_rgba(255,255,255,0.3)]'
              }`}
            >
              {isPostUploading ? 'Launching...' : 'Launch Now'}
            </button>
          )}
        </div>
      </header>

      {/* Validation alert banner */}
      <AnimatePresence>
        {validationError && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-20 bg-red-500/25 border-y border-red-500/40 px-6 py-4 text-xs font-bold text-red-100 flex items-center gap-3 backdrop-blur-md"
          >
            <div className="w-2 h-2 rounded-full bg-red-400 animate-ping shrink-0" />
            <div className="flex-1">{validationError}</div>
            <button onClick={() => setValidationError(null)} className="text-white/40 hover:text-white p-1">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Workstation */}
      <main className="relative z-10 flex-1 overflow-y-auto px-6 py-8 no-scrollbar pb-32">
        <AnimatePresence mode="wait">

          {/* CHOOSE WORKFLOW ENTRY GRID */}
          {currentStep === 'select_workflow' && (
            <motion.div 
              key="step-select"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6 max-w-xl mx-auto"
            >
              <div className="text-center mb-8">
                <h3 className="text-3xl font-black italic tracking-tighter uppercase mb-2 text-white">Create with Hustle</h3>
                <p className="text-sm text-white/50">Gain high revenue clients through simple portfolio content creation.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CREATE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setWorkflow(opt.id);
                      setStepIndex(0);
                    }}
                    className={`p-6 rounded-3xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-5 text-left group cursor-pointer`}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-black/60 border border-white/5 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                      {opt.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-sm uppercase tracking-wider mb-1 text-white">{opt.title}</h4>
                      <p className="text-xs text-white/40 leading-snug">{opt.description}</p>
                    </div>
                    <ChevronRight size={18} className="text-white/20 group-hover:text-white/80 group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* 1. CAMERA CAPTURE WORKFLOW VIEW */}
          {currentStep === 'camera_capture' && (
            <motion.div 
              key="camera_screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center max-w-lg mx-auto relative h-full"
            >
              {/* Camera Preview Box */}
              <div className="relative w-full aspect-[9/16] bg-black rounded-[2.5rem] border-2 border-white/10 overflow-hidden shadow-2xl flex items-center justify-center">
                
                {stream ? (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    playsInline 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  // Virtual Scenic Viewfinder simulation layout
                  <div className="absolute inset-0 bg-[#0b0c10] flex flex-col items-center justify-center relative">
                    {/* Viewfinder crosshairs and HUD overlays */}
                    <div className="absolute top-6 left-6 font-mono text-[9px] text-red-500 flex items-center gap-1.5 uppercase">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      REC SIM • [4K RAW 60FPS]
                    </div>
                    <div className="absolute top-6 right-6 font-mono text-[9px] text-white/40">
                      BATT: 98%
                    </div>
                    <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-[1px] bg-white/5 pointer-events-none" />
                    <div className="absolute inset-y-12 left-1/2 -translate-x-1/2 w-[1px] bg-white/5 pointer-events-none" />
                    
                    {/* Lenses graphic */}
                    <div className="relative w-32 h-32 rounded-full border border-white/10 flex items-center justify-center mb-6">
                      <div className="absolute inset-3 rounded-full bg-gradient-to-tr from-brand-primary/10 to-[#4e7dff]/20 animate-spin duration-10000" />
                      <div className="w-16 h-16 rounded-full bg-black/60 border border-white/20 flex items-center justify-center">
                        <Camera size={26} className="text-white/20 animate-pulse" />
                      </div>
                    </div>
                    
                    <div className="text-center px-8 z-10">
                      <p className="text-sm font-black uppercase tracking-widest text-white/80 italic mb-2">Simulated Video Studio</p>
                      <p className="text-[11px] text-white/40 leading-relaxed max-w-xs mx-auto">
                        Your browser camera is offline, but you can tap the big red button below to trigger our cinematic simulation.
                      </p>
                    </div>
                  </div>
                )}

                {/* Laser scanline overlay */}
                <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand-primary/30 to-transparent shadow-glow-red animate-bounce top-1/3 pointer-events-none" />

                {/* Left/Right Overlays */}
                <div className="absolute bottom-24 inset-x-6 flex justify-between items-center z-10 pointer-events-none">
                  <div className="flex flex-col gap-3 pointer-events-auto">
                    <button 
                      onClick={() => setFlashOn(!flashOn)}
                      className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${
                        flashOn ? 'bg-yellow-500 text-black border-yellow-400 shadow-glow-white' : 'bg-black/60 text-white/60 border-white/15'
                      }`}
                    >
                      <Zap size={18} />
                    </button>
                    <button 
                      onClick={() => setIsFrontCamera(!isFrontCamera)}
                      className="w-11 h-11 rounded-full bg-black/60 text-white/60 border border-white/15 flex items-center justify-center hover:text-white"
                    >
                      <RotateCw size={18} />
                    </button>
                  </div>
                  <div className="pointer-events-auto">
                    <div className="bg-black/80 backdrop-blur-md px-4 py-2 border border-white/10 rounded-2xl text-xs font-mono font-bold tracking-widest text-[#ff4e4e] flex items-center gap-1.5 shrink-0">
                      <Clock size={12} />
                      00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds} / 00:30
                    </div>
                  </div>
                </div>

                {/* Centered capture action triggers */}
                <div className="absolute bottom-6 inset-x-6 flex items-center justify-between z-10">
                  {/* Gallery picker option */}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-12 h-12 rounded-xl bg-black/70 border border-white/15 hover:border-white/40 flex flex-col items-center justify-center text-white/60 hover:text-white cursor-pointer"
                  >
                    <ImageIcon size={18} />
                    <span className="text-[6px] uppercase font-black mt-1">Import</span>
                  </button>

                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleGalleryUpload}
                    className="hidden"
                    accept="video/*"
                  />

                  {/* Gigantic Record Button */}
                  <button 
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    className="relative w-20 h-20 rounded-full flex items-center justify-center focus:outline-none cursor-pointer group active:scale-95 transition-transform"
                  >
                    <div className="absolute inset-0 rounded-full border-[3px] border-white/40 group-hover:border-white" />
                    <div className={`rounded-full transition-all duration-300 ${isRecording ? 'w-10 h-10 bg-red-500 rounded-lg shadow-glow-red' : 'w-15 h-15 bg-white shadow-lg'}`} />
                  </button>

                  {/* Empty balance spacer */}
                  <div className="w-12 h-12" />
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. GALLERY MEDIA SELECTION */}
          {currentStep === 'media_selection' && (
            <motion.div 
              key="media_select_screen"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-lg mx-auto space-y-6"
            >
              <div className="bg-white/5 border border-white/10 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <input 
                  type="file"
                  id="media-uploader-input"
                  multiple={workflow === 'upload_images' || workflow === 'share_project'}
                  accept={workflow === 'upload_video' ? 'video/*' : 'image/*'}
                  onChange={workflow === 'upload_video' ? handleGalleryUpload : handleMultipleImagesUpload}
                  className="hidden"
                />

                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-105 group-hover:border-white/20 transition-all text-white/50">
                  {workflow === 'upload_video' ? <Video size={36} /> : <ImageIcon size={36} />}
                </div>

                <div className="space-y-2 mb-6">
                  <h4 className="text-xl font-black italic uppercase tracking-tight text-white">Import Device Gallery</h4>
                  <p className="text-xs text-white/40 leading-relaxed max-w-xs mx-auto">
                    {workflow === 'upload_video' ? 'Choose professional high-definition video showing your active work process.' : 'Select one or multiple photos illustrating your work results.'}
                  </p>
                </div>

                <button 
                  onClick={() => document.getElementById('media-uploader-input')?.click()}
                  className="px-8 h-14 rounded-full bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all cursor-pointer shadow-premium"
                >
                  Browse Device files
                </button>
              </div>

              {/* Show selected files list / Multi Image sequence list */}
              {workflow === 'upload_images' && imageFiles.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">✨ Drag & Sequence Image (Tap arrows)</span>
                    <span className="text-[10px] font-mono text-emerald-400">{imageFiles.length} photos selected</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {imageFiles.map((img, idx) => (
                      <div key={img.id} className="relative aspect-square rounded-2xl bg-white/5 border border-white/10 overflow-hidden group flex flex-col">
                        <img src={img.url} alt="Preview" className="w-full h-full object-cover flex-1" />
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/80 backdrop-blur-md flex items-center justify-center text-[10px] font-black text-white/80">
                          {idx + 1}
                        </div>
                        <button 
                          onClick={() => handleRemoveImage(img.id)}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white cursor-pointer shadow-lg"
                        >
                          <Trash2 size={14} />
                        </button>

                        {/* Reorder actions block */}
                        <div className="absolute bottom-2 inset-x-2 flex justify-between gap-1">
                          <button 
                            disabled={idx === 0}
                            onClick={() => handleMoveImage(idx, 'left')}
                            className="flex-1 py-1 px-1 bg-black/80 hover:bg-black font-black text-[8px] uppercase tracking-tighter text-white/60 disabled:opacity-30 rounded cursor-pointer"
                          >
                            ◀ Left
                          </button>
                          <button 
                            disabled={idx === imageFiles.length - 1}
                            onClick={() => handleMoveImage(idx, 'right')}
                            className="flex-1 py-1 px-1 bg-black/80 hover:bg-black font-black text-[8px] uppercase tracking-tighter text-white/60 disabled:opacity-30 rounded cursor-pointer"
                          >
                            Right ▶
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show selected single video file */}
              {workflow === 'upload_video' && videoFile && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-400" />
                    <div>
                      <p className="text-xs font-black uppercase text-white tracking-widest">{videoFile.name}</p>
                      <p className="text-[10px] text-white/40 uppercase font-bold tracking-tight">{(videoFile.size / 1024 / 1024).toFixed(1)} MB • Video format</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setVideoFile(null); setVideoUrl(null); }}
                    className="p-2 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* 3. TRIM & COVER SELECTION SCREEN */}
          {currentStep === 'trim_cover' && (
            <motion.div 
              key="trim_screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto space-y-8"
            >
              {/* Active Player */}
              <div className="relative aspect-video rounded-[2rem] bg-black border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center">
                {videoUrl ? (
                  <video src={videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                ) : (
                  <div className="text-white/40 uppercase text-[10px] font-black">Simulation Video Loading...</div>
                )}
                <div className="absolute bottom-4 left-4 bg-black/80 px-3 py-1.5 rounded-full text-[9px] font-mono tracking-widest text-emerald-400 border border-white/5 uppercase">
                  ACTIVE RANGE: {trimStart}S to {trimEnd}S
                </div>
              </div>

              {/* Video Trim scrubber handles */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/40 italic flex items-center gap-1.5">
                    <Scissors size={12} className="text-brand-primary" /> TRIM VIDEO LENGTH
                  </span>
                  <span className="text-xs font-mono font-bold text-white">{(trimEnd - trimStart).toFixed(1)} Seconds</span>
                </div>

                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4">
                  <div>
                    <label className="text-[9px] font-black uppercase text-white/40 block mb-1">Start offset ({trimStart}s)</label>
                    <input 
                      type="range"
                      min={0}
                      max={15}
                      step={0.5}
                      value={trimStart}
                      onChange={(e) => setTrimStart(parseFloat(e.target.value))}
                      className="w-full accent-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-white/40 block mb-1">End offset ({trimEnd}s)</label>
                    <input 
                      type="range"
                      min={15}
                      max={30}
                      step={0.5}
                      value={trimEnd}
                      onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
                      className="w-full accent-brand-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Cover selector carousel scrubber */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-white/40 italic flex items-center gap-1.5">
                  <Eye size={12} className="text-brand-primary" /> SELECT COVER PHOTO FRAME
                </span>

                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                  <input 
                    type="range"
                    min={trimStart}
                    max={trimEnd}
                    step={0.2}
                    value={coverOnSecond}
                    onChange={(e) => setCoverOnSecond(parseFloat(e.target.value))}
                    className="w-full accent-white"
                  />
                  <div className="flex justify-between font-mono text-[8px] text-white/30 uppercase mt-2">
                    <span>Frame: {trimStart}s</span>
                    <span className="text-white font-bold">Selected Cover: {coverOnSecond.toFixed(1)}s</span>
                    <span>Frame: {trimEnd}s</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 4. BEFORE & AFTER comparative screens */}
          {currentStep === 'before_after_upload' && (
            <motion.div 
              key="before_after_screen"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-lg mx-auto space-y-6"
            >
              <div className="text-center mb-4">
                <h4 className="text-xl font-black italic uppercase tracking-tight text-white mb-2">COMPARATIVE PROOF</h4>
                <p className="text-xs text-white/40 leading-relaxed">Publish dramatic visual before and after files side-by-side.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* BEFORE drop block */}
                <div 
                  onClick={() => document.getElementById('before-img-picker')?.click()}
                  className="aspect-square bg-white/5 border-2 border-dashed border-white/10 hover:border-white/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden relative"
                >
                  <input 
                    type="file"
                    id="before-img-picker"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const newImg = { id: 'before', file, url: URL.createObjectURL(file) };
                        setImageFiles(prev => [newImg, ...prev.filter(i => i.id !== 'before')]);
                      }
                    }}
                    className="hidden"
                  />
                  
                  {imageFiles.find(i => i.id === 'before') ? (
                    <>
                      <img src={imageFiles.find(i => i.id === 'before')?.url} className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute bottom-2 text-[10px] font-black uppercase bg-red-600 px-3 py-1 rounded-full text-white shadow-lg">BEFORE</div>
                    </>
                  ) : (
                    <>
                      <ImageIcon size={24} className="text-white/30 mb-2" />
                      <span className="text-xs font-black uppercase text-white/60 tracking-wider">Before Image</span>
                      <span className="text-[9px] text-white/30 lowercase mt-1">Tap sandbox photo</span>
                    </>
                  )}
                </div>

                {/* AFTER drop block */}
                <div 
                  onClick={() => document.getElementById('after-img-picker')?.click()}
                  className="aspect-square bg-white/5 border-2 border-dashed border-white/10 hover:border-white/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden relative"
                >
                  <input 
                    type="file"
                    id="after-img-picker"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const newImg = { id: 'after', file, url: URL.createObjectURL(file) };
                        setImageFiles(prev => [...prev.filter(i => i.id !== 'after'), newImg]);
                      }
                    }}
                    className="hidden"
                  />
                  
                  {imageFiles.find(i => i.id === 'after') ? (
                    <>
                      <img src={imageFiles.find(i => i.id === 'after')?.url} className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute bottom-2 text-[10px] font-black uppercase bg-emerald-600 px-3 py-1 rounded-full text-white shadow-lg">AFTER</div>
                    </>
                  ) : (
                    <>
                      <ImageIcon size={24} className="text-white/30 mb-2" />
                      <span className="text-xs font-black uppercase text-white/60 tracking-wider">After Image</span>
                      <span className="text-[9px] text-white/30 lowercase mt-1">Tap sandbox photo</span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* 5. SERVICE SPECIFIC REGISTRATION */}
          {currentStep === 'service_details' && (
            <motion.div 
              key="service_step"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-lg mx-auto space-y-6"
            >
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#ff4e4e] italic block mb-2 px-1">Service category Offering Title</label>
                  <input 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Premium Shelf Carpentry & Install"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-primary transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 italic block mb-2 px-1">Starting Booking Price ($)</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-white/40 text-sm">$</span>
                      <input 
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value)}
                        placeholder="120"
                        type="number"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-6 py-4 text-sm font-black text-white focus:outline-none focus:border-brand-primary transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 italic block mb-2 px-1">Completion duration</label>
                    <input 
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g., 2 Hours"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-primary transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 italic block mb-2 px-1">Describe standard details</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details about what the pricing is for, material options, and preparation..."
                    className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-5 text-sm font-medium text-white/80 h-32 resize-none focus:outline-none"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* 6. GENERAL CONTENT DETAILS FORM (Tags, hashtags, location) */}
          {currentStep === 'metadata_form' && (
            <motion.div 
              key="metadata_screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-lg mx-auto space-y-6"
            >
              {/* If there is a caption form to display */}
              {workflow !== 'create_service' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff4e4e] block px-1 italic">What are you showing? Caption Description</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Sanding down this robust live-edge oak board to prep for satin oil finish..."
                    className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-5 text-sm font-medium text-white h-32 resize-none focus:outline-none focus:border-brand-primary transition-all"
                  />
                </div>
              )}

              {/* MANDATORY REQUIREMENT: At least one skill tag required */}
              <div className="space-y-3 bg-white/5 border border-white/10 p-5 rounded-[2.5rem]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#ff4e4e] block px-1 italic">
                    ADD SKILL TAGS <span className="text-red-400">*Required</span>
                  </span>
                  <span className="text-[9px] font-bold text-emerald-400">At least 1 required</span>
                </div>

                {/* Tags field search text input */}
                <div className="flex gap-2">
                  <input 
                    value={newSkillTag}
                    onChange={(e) => setNewSkillTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkillTag(newSkillTag);
                      }
                    }}
                    placeholder="Type brand tags (e.g., Plastering) & hit Add"
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                  />
                  <button 
                    onClick={() => handleAddSkillTag(newSkillTag)}
                    className="px-5 rounded-xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-brand-primary hover:text-white transition-all cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {/* Custom and suggested select pills */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {SUGGESTED_SKILL_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleToggleSuggestedSkillTag(tag)}
                      className={`px-4 py-2 rounded-full font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                        skillTags.includes(tag) 
                          ? 'bg-brand-primary text-white scale-105 border border-white/20' 
                          : 'bg-white/5 text-white/50 border border-white/5 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {skillTags.includes(tag) ? '✓ ' : ''}{tag}
                    </button>
                  ))}
                </div>

                {/* Currently selected skill tags bucket */}
                {skillTags.length > 0 && (
                  <div className="border-t border-white/5 pt-3 mt-3">
                    <p className="text-[8px] font-black uppercase text-white/30 tracking-[0.2em] mb-2 px-1">Applied Skillset Matrix</p>
                    <div className="flex flex-wrap gap-1.5">
                      {skillTags.map(tag => (
                        <div key={tag} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                          {tag}
                          <button onClick={() => setSkillTags(prev => prev.filter(t => t !== tag))} className="text-white/40 hover:text-white font-bold font-mono">×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* QUICK SELECT EXTEMPORANEOUS HASHTAGS */}
              {workflow !== 'create_service' && (
                <div className="space-y-2 bg-white/5 border border-white/10 p-5 rounded-[2.5rem]">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 italic block px-1">QUICK HASHTAG SUGGESTIONS</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_HASHTAGS.map((hash) => (
                      <button
                        key={hash}
                        onClick={() => handleToggleHashtag(hash)}
                        className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                          hashtags.includes(hash) 
                            ? 'bg-blue-500 text-white scale-105 shadow-md shadow-blue-500/25' 
                            : 'bg-white/5 text-white/40 hover:text-white border border-white/5'
                        }`}
                      >
                        {hash}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* LOCATION PICKER */}
              <div className="space-y-3 bg-white/5 border border-white/10 p-5 rounded-[2.5rem]">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 italic block">JOB LOCATION</label>
                  <button 
                    type="button"
                    onClick={() => setLocation("Covent Garden, London")}
                    className="text-[9px] font-black text-brand-primary uppercase tracking-widest hover:underline cursor-pointer flex items-center gap-1"
                  >
                    📍 Use Current Location
                  </button>
                </div>
                <input 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Camden Market, London"
                  className="w-full bg-black/45 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none focus:border-brand-primary transition-all"
                />
              </div>
            </motion.div>
          )}

          {/* 7. CONTENT TYPE CATEGORY SELECTOR */}
          {currentStep === 'type_selector' && (
            <motion.div 
              key="type-selector-screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg mx-auto space-y-6"
            >
              <div className="text-center mb-6">
                <h4 className="text-2xl font-black italic uppercase tracking-tight text-white mb-2">CHOOSE THE BEST CONTENT FORMAT</h4>
                <p className="text-xs text-white/40 leading-relaxed">Selecting the right category structure increases visibility on client main feeds.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {CONTENT_TYPES.map((ct) => (
                  <button
                    key={ct.id}
                    onClick={() => {
                      setSelectedContentType(ct.id);
                      handleNext();
                    }}
                    className={`p-6 rounded-[2rem] border transition-all flex flex-col justify-between text-left relative overflow-hidden group cursor-pointer ${
                      selectedContentType === ct.id 
                        ? 'border-brand-primary bg-brand-primary/10' 
                        : 'border-white/5 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-xl shrink-0">
                        {ct.id === 'skill_demonstration' && <FlameIcon />}
                        {ct.id === 'project_showcase' && <Award size={20} className="text-yellow-400" />}
                        {ct.id === 'before_after' && <Zap size={20} className="text-purple-400" />}
                        {ct.id === 'educational_tip' && <Type size={20} className="text-emerald-400" />}
                        {ct.id === 'customer_testimonial' && <Users size={20} className="text-sky-400" />}
                        {ct.id === 'service_promotion' && <Briefcase size={20} className="text-pink-400" />}
                      </div>
                      <div className="flex-1">
                        <h5 className="text-xs font-black uppercase tracking-wider text-white mb-1">{ct.title}</h5>
                        <p className="text-[10px] text-white/40 font-semibold uppercase italic mb-3 tracking-wide">{ct.desc}</p>
                        
                        {/* Clear user illustrative template example */}
                        <div className="bg-black/40 border border-white/5 p-3 rounded-xl">
                          <span className="text-[8px] font-black uppercase text-brand-primary tracking-widest block mb-1">ILLUSTRATIVE EXAMPLE:</span>
                          <span className="text-[11px] text-white/70 italic leading-relaxed">"{ct.example}"</span>
                        </div>
                      </div>
                    </div>
                    {selectedContentType === ct.id && (
                      <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-brand-primary border border-white/20 flex items-center justify-center text-black font-bold text-[10px]">
                        ✓
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* 8. PUBLISHING PORTAL SYSTEM PREVIEW */}
          {currentStep === 'publish_portal' && (
            <motion.div 
              key="publish_portal_screen"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-lg mx-auto space-y-8"
            >
              {/* Device Mobile Screen layout Preview */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#ff4e4e] block px-2 italic">LIVE HIGH-STREET CARD PREVIEW</span>
                
                <div className="relative aspect-[3/4] rounded-[2.5rem] bg-black border-2 border-white/10 overflow-hidden shadow-2xl">
                  {/* Visual background matching selected workflow */}
                  {workflow === 'upload_images' && imageFiles.length > 0 ? (
                    <img src={imageFiles[0].url} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                  ) : workflow === 'share_customer_result' && imageFiles.length > 0 ? (
                    <img src={imageFiles[0].url} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 via-black to-[#4e7dff]/10" />
                  )}

                  {/* Overlay grids */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/50 pointer-events-none" />

                  {/* Top indicators */}
                  <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
                    <span className="bg-black/80 backdrop-blur-md border border-white/15 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-emerald-400">
                      {selectedContentType.toUpperCase().replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-mono text-white/40 lowercase">@FelixTheHustler</span>
                  </div>

                  {/* Bottom context details display */}
                  <div className="absolute bottom-8 left-6 right-6 z-10 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border-2 border-brand-primary p-0.5 shadow-glow-red">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Me" className="w-full h-full rounded-full" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide">Felix The Hustler</p>
                        <p className="text-[8px] text-white/40 uppercase font-black uppercase tracking-widest">Covent Garden, London</p>
                      </div>
                    </div>

                    <p className="text-sm font-black uppercase text-white leading-tight italic tracking-tight">{title || 'Demonstrating trade skill'}</p>
                    <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">{description || 'No details provided'}</p>

                    <div className="flex flex-wrap gap-1">
                      {skillTags.map(tag => (
                        <span key={tag} className="text-[8px] bg-brand-primary/20 border border-brand-primary/30 text-white/90 font-black uppercase tracking-widest px-2 py-1 rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* VISIBILITY SETTINGS */}
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30 block px-2 italic">WHO CAN SEE THIS?</span>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button 
                    onClick={() => setVisibility("public")}
                    className={`p-5 rounded-[1.75rem] border text-left transition-all cursor-pointer flex flex-col gap-3 ${
                      visibility === 'public' ? 'border-brand-primary bg-brand-primary/10 shadow-glow-red-sm scale-[1.02]' : 'border-white/5 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <Globe size={20} className={visibility === 'public' ? 'text-brand-primary' : 'text-white/40'} />
                    <div>
                      <h6 className="text-[10px] font-black uppercase text-white tracking-wider mb-1">Make Public</h6>
                      <p className="text-[9px] text-white/40 leading-snug">Anyone can discover and book your service.</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => setVisibility("clients")}
                    className={`p-5 rounded-[1.75rem] border text-left transition-all cursor-pointer flex flex-col gap-3 ${
                      visibility === 'clients' ? 'border-brand-primary bg-brand-primary/10 shadow-glow-red-sm scale-[1.02]' : 'border-white/5 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <Users size={20} className={visibility === 'clients' ? 'text-blue-400' : 'text-white/40'} />
                    <div>
                      <h6 className="text-[10px] font-black uppercase text-white tracking-wider mb-1">Clients Only</h6>
                      <p className="text-[9px] text-white/40 leading-snug">Only hired clients and followers see this.</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => setVisibility("private")}
                    className={`p-5 rounded-[1.75rem] border text-left transition-all cursor-pointer flex flex-col gap-3 ${
                      visibility === 'private' ? 'border-brand-primary bg-brand-primary/10 shadow-glow-red-sm scale-[1.02]' : 'border-white/5 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <Lock size={20} className={visibility === 'private' ? 'text-yellow-400' : 'text-white/40'} />
                    <div>
                      <h6 className="text-[10px] font-black uppercase text-white tracking-wider mb-1 font-black">Save Draft</h6>
                      <p className="text-[9px] text-white/40 leading-snug">Only you can view and edit this locally.</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* SAVE WORK DRAFT BUTTON */}
              <button 
                onClick={() => {
                  alert("Draft saved to offline browser memory!");
                  onClose();
                }}
                className="w-full h-15 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-xs font-black uppercase tracking-wider text-white/60 hover:text-white flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save size={16} /> Save Offline Work Draft
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* 1. HUSTLE PATTERN RECOGNITION SCANNING OVERLAY */}
      <AnimatePresence>
        {isScanning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[150] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center text-center p-6"
          >
            {/* Ambient scanning light rings */}
            <div className="absolute inset-x-0 h-1/2 bg-gradient-to-b from-brand-primary/10 to-transparent top-0 pointer-events-none animate-pulse" />
            <div className="relative w-40 h-40 rounded-full border border-brand-primary/20 flex items-center justify-center mb-8">
              {/* Laser scanner effect */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-brand-primary/40 animate-spin duration-3000" />
              <div className="absolute inset-3 rounded-full bg-brand-primary/5 animate-pulse" />
              <div className="w-20 h-20 rounded-full bg-black/60 border border-brand-primary/40 flex items-center justify-center shadow-glow-red-sm">
                <Sparkles size={36} className="text-brand-primary animate-bounce duration-2000" />
              </div>
            </div>

            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">🔍 Hustle Trade-Lens Active</h3>
            <p className="text-xs font-mono tracking-widest text-[#ff4e4e] uppercase mb-4 animate-pulse">Running automagic asset analysis...</p>
            
            <div className="max-w-xs space-y-2 bg-white/5 border border-white/5 px-5 py-4 rounded-2xl text-[11px] text-white/60 font-medium w-full">
              <div className="flex justify-between border-b border-white/5 pb-1.5 font-mono">
                <span>⚡ WAVE SPECTRUM</span>
                <span className="text-brand-primary">SCANNING...</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5 font-mono">
                <span>🔊 ACOUSTICAL HUM</span>
                <span className="text-brand-primary">RECOGNIZED</span>
              </div>
              <div className="flex justify-between font-mono">
                <span>📍 CITY GEOFENCE</span>
                <span className="text-emerald-400">ACTIVE</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. AUTOMAGIC CONFIRMATION DRAWER */}
      <AnimatePresence>
        {showSmartBanner && suggestedDefaults && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute inset-0 z-[140] bg-[#070708]/95 backdrop-blur-3xl flex items-end md:items-center justify-center p-4 md:p-6"
          >
            <div className="w-full max-w-lg bg-[#0d0e12] border border-white/10 rounded-[2.5rem] p-6 space-y-6 shadow-2xl relative overflow-hidden">
              {/* Visual red/gold top lip spacer */}
              <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-brand-primary via-[#ffd700] to-brand-primary" />
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shrink-0">
                  <Sparkles size={22} className="text-brand-primary animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black italic uppercase tracking-wider text-white">✨ Pattern Match Found!</h3>
                  <p className="text-[11px] text-white/50 leading-relaxed uppercase font-semibold">
                    We've matched your uploaded file to dynamic trade defaults with zero typing!
                  </p>
                </div>
              </div>

              {/* Dynamic properties card */}
              <div className="bg-white/5 border border-white/5 rounded-3xl p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-white/5">
                  <div>
                    <span className="text-[8px] font-black uppercase text-white/30 tracking-widest block mb-1">🛠️ SUGGESTED SKILL</span>
                    <span className="bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md inline-block">
                      {suggestedDefaults.skill}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase text-white/30 tracking-widest block mb-1">📂 FEED FORMAT</span>
                    <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md inline-block">
                      {CONTENT_TYPES.find(c => c.id === suggestedDefaults.contentType)?.title || "Skill Demonstration"}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[8px] font-black uppercase text-white/30 tracking-widest block">🏷️ SUGGESTED TITLE</span>
                    <p className="text-xs font-black uppercase italic tracking-tight text-white mt-1">
                      "{suggestedDefaults.title}"
                    </p>
                  </div>

                  <div>
                    <span className="text-[8px] font-black uppercase text-white/30 tracking-widest block">📝 PRE-FILLED DESCRIPTION</span>
                    <p className="text-[11px] text-white/70 italic leading-relaxed mt-1">
                      "{suggestedDefaults.description}"
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 text-[10px] font-mono text-emerald-400 font-bold border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <span>📍 Covent Garden, London</span>
                    </div>
                    <div className="text-right">
                      <span>💰 Est. Booking: ${suggestedDefaults.price}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instant Acceptance and secondary edits actions */}
              <div className="flex flex-col gap-2">
                <button 
                  onClick={applySmartAutofill}
                  className="w-full h-14 rounded-2xl bg-brand-primary hover:bg-[#ff4e4e] active:scale-95 text-white font-black text-xs uppercase tracking-widest shadow-glow-red flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  Confirm & Skip to Review ✓
                </button>
                <button 
                  onClick={() => setShowSmartBanner(false)}
                  className="w-full h-11 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                >
                  No, I want to type descriptions manually
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Flame icon path helper
function FlameIcon() {
  return (
    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
    </svg>
  );
}
