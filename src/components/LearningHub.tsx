import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, Award, Bookmark, Trophy, Play, CheckCircle, 
  Check, Sparkles, TrendingUp, ChevronRight, ArrowLeft, 
  Clock, Heart, Star, ChevronLeft, ShieldCheck, Lock, Eye
} from "lucide-react";

// Types for the Learning System
export interface Lesson {
  id: string;
  skillId: string;
  level: "beginner" | "intermediate" | "advanced";
  title: string;
  duration: string;
  description: string;
  richContent: string;
  youtubeId?: string;
  coverImage: string;
  videoUrl?: string; // fallback
  xpReward: number;
}

export interface SkillPath {
  id: string;
  title: string;
  category: string;
  iconName: string;
  description: string;
  xpTotal: number;
  featuredImg: string;
  colorGrad: string;
  accentColor: string;
}

// Pre-seeded high fidelity Skill Paths
const SKILL_PATHS: SkillPath[] = [
  {
    id: "path-barbering",
    title: "Master Barbering & Styling",
    category: "Grooming",
    iconName: "Scissors",
    description: "Learn advanced skin fades, texturizing, customized blade postures, and premium beard styling techniques.",
    xpTotal: 450,
    featuredImg: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80",
    colorGrad: "from-amber-600/20 to-orange-950/10",
    accentColor: "border-orange-500/30 text-orange-400"
  },
  {
    id: "path-drywall",
    title: "Drywall & Interior Framing",
    category: "Trades",
    iconName: "Hammer",
    description: "Master drywall hanging, mudding coats, metal stud framing, and professional surface patching.",
    xpTotal: 300,
    featuredImg: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80",
    colorGrad: "from-blue-600/20 to-indigo-950/10",
    accentColor: "border-blue-500/30 text-blue-400"
  },
  {
    id: "path-ux",
    title: "Freelance UI/UX Designing",
    category: "Digital Arts",
    iconName: "Figma",
    description: "Design spacing hierarchies, dark mode UI patterns, color theory, and responsive web animations.",
    xpTotal: 600,
    featuredImg: "https://images.unsplash.com/photo-1561070791-26c113006238?w=600&auto=format&fit=crop&q=80",
    colorGrad: "from-purple-600/20 to-pink-950/10",
    accentColor: "border-purple-500/30 text-purple-400"
  },
  {
    id: "path-marketing",
    title: "TikTok Organic Growth & Sales",
    category: "Marketing",
    iconName: "TrendingUp",
    description: "Build high converting video hooks, master native editing tools, and setup direct calendar schedules.",
    xpTotal: 400,
    featuredImg: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80",
    colorGrad: "from-emerald-600/20 to-teal-950/10",
    accentColor: "border-emerald-500/30 text-emerald-400"
  }
];

// Pre-seeded Skill Lessons matching paths & levels
const LESSONS: Lesson[] = [
  // --- BARBERING ---
  {
    id: "barber-1",
    skillId: "path-barbering",
    level: "beginner",
    title: "Blade Posture & Safety Mechanics",
    duration: "8 mins",
    description: "Master direct skin touch angles, blade sanitization protocols, and natural posture ergonomics.",
    richContent: "Professional blade grooming begins with your hand ergonomics. Hold the straight edge at exactly a 30-degree angle from the client's skin stretch line to maximize comfort and precision.\n\n### Step-by-Step Execution Guide:\n1. **Skin-Stretch Method**: Always pull the skin tight in the opposite direction of shave strokes.\n2. **Sanitation Protocols**: Spray antiseptic blades before shifting handles.\n3. **Ergonomic Leverage**: Pivot with your core, keeping your elbow relaxed near your posture line.",
    coverImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&auto=format&fit=crop&q=80",
    youtubeId: "vB6u1rF0E5s",
    xpReward: 100
  },
  {
    id: "barber-2",
    skillId: "path-barbering",
    level: "intermediate",
    title: "Foil Shaver & Comb Blend Transitions",
    duration: "15 mins",
    description: "How to erase weight lines between Clipper Open and Half Open blade extensions.",
    richContent: "Groomers fail most often at blending the zero line. We details how using soft, short flicking wrist movements creates smooth gradients without dark weight bands.\n\n### Transition Roadmap:\n1. **High Fades**: Guide the comb 2 inches above ear pinna.\n2. **The Flick-Out Rule**: Apply radial angle sweeps rather than steady straight strokes.\n3. **Shaver Integration**: Transition with a dry guard layer.",
    coverImage: "https://images.unsplash.com/photo-1532710093739-9470acff878f?w=500&auto=format&fit=crop&q=80",
    xpReward: 150
  },
  {
    id: "barber-3",
    skillId: "path-barbering",
    level: "advanced",
    title: "Creative Texturing & Cropped Fringe",
    duration: "22 mins",
    description: "Customize slide slices to introduce top volume and create visual weight depth layers.",
    richContent: "Advanced texturizing uses slide slicing to add movement to straight, rigid hair types. Never cut flat across the frontal fringe line unless designing micro crops.\n\n### Texturizing Principles:\n1. **Radial Partings**: Isolate crown sections relative to natural curls.\n2. **Point Cutting Angles**: Position thinning scissors at a steep 45-degree slide angle.\n3. **Clay Prep Work**: Emulsify pomade to define separated hair strands.",
    coverImage: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=500&auto=format&fit=crop&q=80",
    xpReward: 200
  },

  // --- DRYWALL ---
  {
    id: "drywall-1",
    skillId: "path-drywall",
    level: "beginner",
    title: "Hanging Sheets & Screw Spacing rules",
    duration: "10 mins",
    description: "Learn safe partition lifting, drywall anchor alignments, and stud-mapping math.",
    richContent: "Always hang ceilings before walls. When screwing into timber framing structure, space elements exactly 12 inches apart on ceilings and 16 inches apart on walls.\n\n### Essential Framing Math:\n1. **Horizontal Layout**: Stagger drywall board seams to avoid double fractures.\n2. **Screw Depth Setup**: Drive screws slightly below surface index without stabbing paper backing.\n3. **Post-Framing Auditi**: Run your hand flat across drywall sheets for alignment audits.",
    coverImage: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=80",
    xpReward: 100
  },
  {
    id: "drywall-2",
    skillId: "path-drywall",
    level: "intermediate",
    title: "First mud Coats & Tape Embedding",
    duration: "18 mins",
    description: "Apply standard joint compounds, embed mesh tapings, and manage knife pressure sweeps.",
    richContent: "The key to perfect walls is utilizing three separate chemical coats at thinning densities. This video teaches how joint tape must be compressed straight down to expel surplus mud safely.\n\n### Application Milestones:\n1. **Embedding Stage**: Use a wider 6-inch blade to guide joint compounds across lines.\n2. **Tape Smoothing**: Align the paper loop center directly on seams.\n3. **Edge Feathering**: Angle the outer blade edge downwards to shave excess layers.",
    coverImage: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&auto=format&fit=crop&q=80",
    xpReward: 100
  },
  {
    id: "drywall-3",
    skillId: "path-drywall",
    level: "advanced",
    title: "Skim Coating & Level 5 Smooth Finishes",
    duration: "25 mins",
    description: "Achieve uniform critical light sheets on high profile interior surface layouts.",
    richContent: "Level 5 Drywall finish is the pinnacle of construction. It requires an overall tissue skimming layer to fully offset natural board and mud porosity variations.\n\n### Master Execution Requirements:\n1. **Thin-Out Ratio**: Combine water with joint compounds until it matches yogurt densities.\n2. **Wide Swept Squeege**: Guide 24-inch compound knives smoothly downwards.\n3. **Backlit Inspection**: Shine halogen lamps at parallel angles to check micro-irregularities.",
    coverImage: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=500&auto=format&fit=crop&q=80",
    xpReward: 100
  },

  // --- UX ---
  {
    id: "ux-1",
    skillId: "path-ux",
    level: "beginner",
    title: "Figma Spacing & Layout Rhythm",
    duration: "12 mins",
    description: "Adopt consistent spacing metrics using the classic 8px grid constraint.",
    richContent: "Uniform layout grids build psychological rhythm. By fixing standard component spacers to increments of 8px (e.g. 8/16/24/32/64), layouts align cleanly inside browser boxes.\n\n### Rhythm Guidelines:\n1. **The 8px Factor**: Ensure vertical gap padding values are multiples of 8.\n2. **Visual Hierarchy**: Keep headings at least 1.5x large over body scale.\n3. **Negative Space**: Give sections generous margins to allow elements breathing room.",
    coverImage: "https://images.unsplash.com/photo-1561070791-26c113006238?w=500&auto=format&fit=crop&q=80",
    xpReward: 100
  },
  {
    id: "ux-2",
    skillId: "path-ux",
    level: "intermediate",
    title: "Dark Theme Design and Contrast rules",
    duration: "16 mins",
    description: "Style premium charcoal cards, manage light highlights, and maintain strict readability indexes.",
    richContent: "Never use absolute black (#000000) for UI backgrounds. Pure black elements eliminate shadow depths and create harsh visual fatigue. Favor rich, dark charcoal layers.\n\n### Layout Rules:\n1. **Surface Elevation**: Elevate cards with micro-borders of white opacity (#ffffff, 5%-10%).\n2. **Contrast Scoring**: Body copy must satisfy the WCAG standards (Contrast at least 4.5:1).\n3. **Saturated Accents**: Tone down accents to retain responsive visibility without flare glare.",
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80",
    xpReward: 250
  },
  {
    id: "ux-3",
    skillId: "path-ux",
    level: "advanced",
    title: "Responsive Motion & Timing Physics",
    duration: "30 mins",
    description: "Animate list additions, screen shifts, and button sweeps with ease in-and-out curve values.",
    richContent: "Good app animations behave naturally. Standard ease-out cubic-bezier coordinates mimic the kinetic weight decelerations seen in physical instruments.\n\n### Frictionless Curves:\n1. **Entrance Transition**: Fast swipe duration (200ms - 300ms) with a sharp ease-out curve.\n2. **Exit Actions**: Shorter fade loops (150ms) to satisfy user inputs quickly.\n3. **Adaptive Staggering**: Stagger entry items by 30ms to create elegant flow dynamics.",
    coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=80",
    xpReward: 250
  },

  // --- MARKETING ---
  {
    id: "marketing-1",
    skillId: "path-marketing",
    level: "beginner",
    title: "Structuring 3-Second Visual Hooks",
    duration: "7 mins",
    description: "Capture mobile feed viewers instantly with active graphic headers and movement.",
    richContent: "Modern mobile platforms reward instant retention. The first 3 seconds of a profile video determine the algorithm's distribution tier. Learn to construct hooks.\n\n### Hook Formatting:\n1. **The Visual Pattern Disrupt**: Start in the middle of action, rather than introducing yourself.\n2. **Overlay Display Text**: Place bright, high-contrast display text in safe margins.\n3. **Dynamic Zoom sweeps**: Push or pull lenses slightly every second to maintain viewer interest.",
    coverImage: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500&auto=format&fit=crop&q=80",
    xpReward: 100
  },
  {
    id: "marketing-2",
    skillId: "path-marketing",
    level: "intermediate",
    title: "Optimizing Calendar Booking Bridges",
    duration: "14 mins",
    description: "Build streamlined, single-click pipelines to convert followers into active jobs.",
    richContent: "Minimize friction. Every additional click between a viral reel and a user booking drops your active conversions by roughly 20-30%. Keep pathways simple.\n\n### Integration Milestones:\n1. **Direct Profile CTAs**: Label buttons with clear, bold commitments (e.g., 'Book Now').\n2. **Auto-Pilot Schedule**: Sync timezone calendars to allow friction-free slot claims.\n3. **Confirmation Alerts**: Dispatch SMS notifications immediately upon purchase validation.",
    coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=80",
    xpReward: 150
  }
];

interface LearningHubProps {
  onBack: () => void;
}

export function LearningHub({ onBack }: LearningHubProps) {
  const [activeTab, setActiveTab] = useState<"feed" | "paths" | "my-classroom">("feed");
  const [selectedPath, setSelectedPath] = useState<SkillPath | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [followedPaths, setFollowedPaths] = useState<string[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [savedLessons, setSavedLessons] = useState<string[]>([]);
  const [xp, setXp] = useState<number>(0);
  const [showNotification, setShowNotification] = useState<string | null>(null);

  // Load and sync states on mount
  useEffect(() => {
    const localXP = localStorage.getItem("hustle_learning_xp");
    const localFollowed = localStorage.getItem("hustle_followed_paths");
    const localCompleted = localStorage.getItem("hustle_completed_lessons");
    const localSaved = localStorage.getItem("hustle_saved_lessons");

    if (localXP) setXp(parseInt(localXP, 10));
    if (localFollowed) setFollowedPaths(JSON.parse(localFollowed));
    if (localCompleted) setCompletedLessons(JSON.parse(localCompleted));
    if (localSaved) setSavedLessons(JSON.parse(localSaved));
  }, []);

  const triggerToast = (message: string) => {
    setShowNotification(message);
    setTimeout(() => setShowNotification(null), 3000);
  };

  // Toggle saving lessons
  const toggleSaveLesson = (lessonId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isSaved = savedLessons.includes(lessonId);
    let updated: string[];
    if (isSaved) {
      updated = savedLessons.filter(id => id !== lessonId);
      triggerToast("Lesson removed from bookmarks");
    } else {
      updated = [...savedLessons, lessonId];
      triggerToast("Lesson bookmarked successfully!");
    }
    setSavedLessons(updated);
    localStorage.setItem("hustle_saved_lessons", JSON.stringify(updated));
  };

  // Following / Subscribing to deep Skill Paths
  const toggleFollowPath = (pathId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isFollowing = followedPaths.includes(pathId);
    let updated: string[];
    if (isFollowing) {
      updated = followedPaths.filter(id => id !== pathId);
      triggerToast("Unfollowed learning path");
    } else {
      updated = [...followedPaths, pathId];
      triggerToast("Learning path followed! Pinned in your classroom.");
    }
    setFollowedPaths(updated);
    localStorage.setItem("hustle_followed_paths", JSON.stringify(updated));
  };

  // Marking lesson completion
  const handleCompleteLesson = (lesson: Lesson) => {
    if (completedLessons.includes(lesson.id)) {
      triggerToast("You've already completed this lesson!");
      return;
    }

    const updated = [...completedLessons, lesson.id];
    setCompletedLessons(updated);
    localStorage.setItem("hustle_completed_lessons", JSON.stringify(updated));

    // Experience aggregation points
    const newXP = xp + lesson.xpReward;
    setXp(newXP);
    localStorage.setItem("hustle_learning_xp", newXP.toString());

    // Auto-enroll on completion
    if (!followedPaths.includes(lesson.skillId)) {
      const updatedFollowed = [...followedPaths, lesson.skillId];
      setFollowedPaths(updatedFollowed);
      localStorage.setItem("hustle_followed_paths", JSON.stringify(updatedFollowed));
    }

    triggerToast(`Congratulations! +${lesson.xpReward} XP Earned! 🎓`);
  };

  // Helper metrics
  const getPathProgress = (pathId: string) => {
    const pathLessons = LESSONS.filter(l => l.skillId === pathId);
    if (pathLessons.length === 0) return 0;
    const completed = pathLessons.filter(l => completedLessons.includes(l.id));
    return Math.round((completed.length / pathLessons.length) * 100);
  };

  const getPathLessonsCompletedCount = (pathId: string) => {
    const pathLessons = LESSONS.filter(l => l.skillId === pathId);
    const completed = pathLessons.filter(l => completedLessons.includes(l.id));
    return `${completed.length}/${pathLessons.length}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[600] bg-[#050608] flex flex-col overflow-hidden text-white"
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/15 via-[#06070a] to-[#040507] pointer-events-none" />
      <div className="grain-overlay pointer-events-none" />

      {/* Rich Interactive Header */}
      <div className="relative z-10 px-6 pt-12 pb-5 border-b border-white/[0.04] bg-[#06070a]/85 backdrop-blur-xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={selectedLesson ? () => setSelectedLesson(null) : selectedPath ? () => setSelectedPath(null) : onBack}
              className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <p className="text-[9px] uppercase tracking-[0.25em] font-black text-[#3b82f6]">Hustle Academy</p>
              <h2 className="text-lg font-black tracking-tight italic uppercase">
                {selectedLesson ? "Viewing Lesson" : selectedPath ? selectedPath.title : "Education Arena"}
              </h2>
            </div>
          </div>

          {/* XP & Level Badge Indicator */}
          <div className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-yellow-600/10 border border-yellow-500/20 flex items-center gap-2">
            <Trophy size={14} className="text-yellow-400" />
            <span className="text-[10px] font-mono font-black text-yellow-300">
              {xp} <span className="text-[8px] text-yellow-400/60 uppercase">XP</span>
            </span>
          </div>
        </div>

        {/* Global tab selectors (only show if not inside detail views) */}
        {!selectedPath && !selectedLesson && (
          <div className="flex bg-white/[0.02] p-1 rounded-2xl border border-white/[0.05] w-full max-w-sm mx-auto">
            <button
              onClick={() => setActiveTab("feed")}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === "feed" ? "bg-white/10 text-white shadow-xl border border-white/5" : "text-white/40 hover:text-white"}`}
            >
              <BookOpen size={14} /> Feed
            </button>
            <button
              onClick={() => setActiveTab("paths")}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === "paths" ? "bg-white/10 text-white shadow-xl border border-white/5" : "text-white/40 hover:text-white"}`}
            >
              <TrendingUp size={14} /> Paths
            </button>
            <button
              onClick={() => setActiveTab("my-classroom")}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === "my-classroom" ? "bg-white/10 text-white shadow-xl border border-white/5" : "text-white/40 hover:text-white"}`}
            >
              <Award size={14} /> My Class
            </button>
          </div>
        )}
      </div>

      {/* Main Scroll Container */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 relative z-10 px-6 pt-6">
        
        {/* TOAST PANEL */}
        <AnimatePresence>
          {showNotification && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-4 left-6 right-6 z-[650] max-w-md mx-auto"
            >
              <div className="bg-[#12131a] border border-blue-500/30 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 backdrop-blur-3xl">
                <Sparkles size={16} className="text-blue-400 animate-pulse" />
                <span>{showNotification}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================
            SCREEN 1: DETAILED LESSON VIEWER
            ======================================================== */}
        {selectedLesson && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg mx-auto flex flex-col gap-6"
          >
            {/* Aspect Image Cover with Play Animation */}
            <div className="relative w-full aspect-video rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-[#0c0c0e]">
              <img 
                src={selectedLesson.coverImage} 
                alt={selectedLesson.title} 
                className="w-full h-full object-cover opacity-80" 
              />
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-black/40 to-transparent" />
              
              {/* Play overlays */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-16 h-16 rounded-full bg-blue-500/90 hover:bg-blue-400 text-white flex items-center justify-center shadow-[0_0_35px_rgba(59,130,246,0.6)] cursor-pointer"
                >
                  <Play size={24} className="fill-white ml-1" />
                </motion.div>
              </div>

              {/* Tag Overlays */}
              <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-xl text-[9px] font-mono tracking-widest uppercase border border-white/5">
                {selectedLesson.level}
              </div>
              <div className="absolute top-4 right-4 text-white/80 hover:text-white cursor-pointer p-1.5 rounded-full bg-black/45 hover:bg-black" onClick={(e) => toggleSaveLesson(selectedLesson.id, e)}>
                <Bookmark size={15} className={savedLessons.includes(selectedLesson.id) ? "fill-yellow-400 text-yellow-400" : ""} />
              </div>
            </div>

            {/* Title Block */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#3b82f6]">Duration: {selectedLesson.duration}</span>
              <h1 className="text-2xl font-black uppercase tracking-tight italic">{selectedLesson.title}</h1>
              <p className="text-xs text-white/50 leading-relaxed">{selectedLesson.description}</p>
            </div>

            {/* Rich Content markdown block */}
            <div className="p-6 rounded-3xl bg-white/[0.01] border border-white/[0.04] shadow-inner text-left">
              <div className="prose prose-invert max-w-none text-xs leading-relaxed text-gray-300 whitespace-pre-wrap">
                {selectedLesson.richContent}
              </div>
            </div>

            {/* Completion Gating */}
            <div className="mt-4 flex flex-col gap-3">
              {completedLessons.includes(selectedLesson.id) ? (
                <div className="w-full py-4.5 rounded-[1.75rem] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center gap-2 font-black uppercase tracking-wider text-[10px]">
                  <CheckCircle size={16} /> Completed • +{selectedLesson.xpReward} XP Cataloged
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCompleteLesson(selectedLesson)}
                  className="w-full py-5 rounded-[1.75rem] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] shadow-[0_10px_25px_rgba(59,130,246,0.3)] cursor-pointer"
                >
                  <Award size={16} /> Mark Lesson Complete (+{selectedLesson.xpReward} XP)
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {/* ========================================================
            SCREEN 2: DETAILED PATH SELECTOR ROADMAP
            ======================================================== */}
        {selectedPath && !selectedLesson && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-lg mx-auto flex flex-col gap-6"
          >
            {/* Cover Card */}
            <div className="relative p-6 rounded-[2.5rem] border border-white/10 overflow-hidden bg-gradient-to-b from-[#0c0d12] to-[#06070a]">
              <div className="absolute inset-0 bg-cover bg-center brightness-[0.25] opacity-50" style={{ backgroundImage: `url(${selectedPath.featuredImg})` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#06070a] to-transparent" />
              
              <div className="relative z-10 flex flex-col gap-3 pt-12">
                <span className="px-2.5 py-0.5 self-start rounded-md bg-white/5 text-[9px] font-mono uppercase tracking-widest text-blue-300">{selectedPath.category}</span>
                <h1 className="text-2xl font-black uppercase tracking-tight italic">{selectedPath.title}</h1>
                <p className="text-xs text-white/60 leading-relaxed">{selectedPath.description}</p>
                
                {/* Progress bar info */}
                {followedPaths.includes(selectedPath.id) && (
                  <div className="mt-3 flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[9px] font-mono text-white/40">
                      <span>PROGRESS</span>
                      <span>{getPathProgress(selectedPath.id)}% ({getPathLessonsCompletedCount(selectedPath.id)})</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${getPathProgress(selectedPath.id)}%` }} />
                    </div>
                  </div>
                )}

                {/* Follow Button */}
                <div className="mt-4">
                  <button 
                    onClick={(e) => toggleFollowPath(selectedPath.id, e)}
                    className={`w-full py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${followedPaths.includes(selectedPath.id) ? "bg-white/10 hover:bg-white/15 text-white/80 border border-white/5" : "bg-white text-black hover:bg-white/95"}`}
                  >
                    {followedPaths.includes(selectedPath.id) ? "Following Path (Unfollow)" : "Follow Path & Track Progress"}
                  </button>
                </div>
              </div>
            </div>

            {/* Progressive Levels (Beginner -> Intermediate -> Advanced) */}
            <div className="flex flex-col gap-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">PROGRESIVE SKILL CURRICULUM</h3>
              
              {(["beginner", "intermediate", "advanced"] as const).map((level, levelIdx) => {
                const levelLessons = LESSONS.filter(l => l.skillId === selectedPath.id && l.level === level);
                const isPreviousLevelCompleted = level === "beginner" || (() => {
                  const prevLevel = level === "intermediate" ? "beginner" : "intermediate";
                  const prevLevelLessons = LESSONS.filter(l => l.skillId === selectedPath.id && l.level === prevLevel);
                  if (prevLevelLessons.length === 0) return true;
                  return prevLevelLessons.every(l => completedLessons.includes(l.id));
                })();

                return (
                  <div key={level} className="flex flex-col gap-3">
                    {/* Level Divider Title */}
                    <div className="flex items-center gap-3">
                      <div className="h-px bg-white/10 flex-1" />
                      <span className={`text-[9px] font-bold uppercase tracking-[0.2em] font-mono px-3 py-1 rounded-full ${level === "beginner" ? "bg-emerald-500/10 text-emerald-400" : level === "intermediate" ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"}`}>
                        {level} Level {!isPreviousLevelCompleted && "🔒"}
                      </span>
                      <div className="h-px bg-white/10 flex-1" />
                    </div>

                    {/* Level lesson card blocks */}
                    <div className="flex flex-col gap-3">
                      {levelLessons.map(lesson => {
                        const isDone = completedLessons.includes(lesson.id);
                        return (
                          <div
                            key={lesson.id}
                            onClick={() => setSelectedLesson(lesson)}
                            className={`p-4 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] border ${isDone ? "border-emerald-500/20 bg-emerald-500/[0.01]" : "border-white/5"} transition-all cursor-pointer flex justify-between items-center group relative overflow-hidden`}
                          >
                            <div className="flex items-center gap-4 relative z-10">
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                                <img src={lesson.coverImage} className="w-full h-full object-cover brightness-75 group-hover:brightness-90 transition-all" />
                              </div>
                              <div className="text-left">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{lesson.title}</h4>
                                  {isDone && <CheckCircle size={12} className="text-emerald-400" />}
                                </div>
                                <p className="text-[10px] text-white/40 mt-1">Duration • {lesson.duration}</p>
                              </div>
                            </div>

                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/30 group-hover:text-white group-hover:bg-blue-500/20 transition-all">
                              <Play size={12} className="fill-white/10 group-hover:fill-white" />
                            </div>
                          </div>
                        );
                      })}
                      {levelLessons.length === 0 && (
                        <p className="text-[10px] text-white/20 italic p-3 text-center">Lessons are arriving shortly.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ========================================================
            TAB 1: LEARNING FEED
            ======================================================== */}
        {activeTab === "feed" && !selectedPath && !selectedLesson && (
          <div className="max-w-md mx-auto flex flex-col gap-6">
            <div className="text-left mb-2">
              <h3 className="text-xs uppercase tracking-widest text-[#3b82f6] font-black">Video Lessons Arena</h3>
              <p className="text-[10px] text-white/40 uppercase font-black tracking-tight mt-1">Skill deep dives, business strategies, and live-first trade procedures.</p>
            </div>

            {/* Interactive video tutorial lists */}
            <div className="flex flex-col gap-5">
              {LESSONS.map((lesson) => {
                const parentPath = SKILL_PATHS.find(p => p.id === lesson.skillId);
                const isSaved = savedLessons.includes(lesson.id);
                const isFinished = completedLessons.includes(lesson.id);

                return (
                  <motion.div
                    key={lesson.id}
                    whileHover={{ y: -3 }}
                    onClick={() => setSelectedLesson(lesson)}
                    className="group bg-gradient-to-b from-[#0c0d12] to-[#06070a] rounded-[2.2rem] border border-white/5 overflow-hidden shadow-xl hover:border-blue-500/30 transition-all cursor-pointer relative"
                  >
                    {/* Cover art image */}
                    <div className="relative aspect-video w-full overflow-hidden bg-white/5">
                      <img 
                        src={lesson.coverImage} 
                        alt={lesson.title} 
                        className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-all duration-500" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                      
                      {/* Play Hover Button */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-blue-500/80 group-hover:bg-blue-500 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all">
                          <Play size={16} className="text-white fill-white ml-0.5" />
                        </div>
                      </div>

                      {/* Header bookmark icon */}
                      <div className="absolute top-4 right-4 flex items-center gap-1.5 z-20">
                        <button
                          onClick={(e) => toggleSaveLesson(lesson.id, e)}
                          className="p-1.5 rounded-xl bg-black/60 hover:bg-black text-white/70 hover:text-white transition-all cursor-pointer border border-white/5"
                        >
                          <Bookmark size={13} className={isSaved ? "fill-yellow-400 text-yellow-400" : ""} />
                        </button>
                      </div>

                      <div className="absolute bottom-4 left-4 flex gap-2">
                        <span className="px-2.5 py-1.5 bg-black/60 backdrop-blur-md rounded-lg text-[8px] font-mono tracking-widest text-[#3b82f6] border border-white/5 uppercase">
                          {lesson.level}
                        </span>
                        <span className="px-2.5 py-1.5 bg-black/60 backdrop-blur-md rounded-lg text-[8px] font-mono tracking-widest text-emerald-400 border border-white/5">
                          {lesson.duration}
                        </span>
                      </div>
                    </div>

                    {/* Meta Section */}
                    <div className="p-5 text-left flex flex-col gap-2 relative">
                      {parentPath && (
                        <span className="text-[8px] text-[#3b82f6] font-black uppercase tracking-widest">{parentPath.category} • {parentPath.title}</span>
                      )}
                      
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="text-base font-black uppercase tracking-tight italic text-white group-hover:text-blue-400 transition-colors">
                          {lesson.title}
                        </h4>
                        {isFinished && (
                          <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center justify-center flex-shrink-0">
                            <Check size={11} strokeWidth={3} />
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-white/50 leading-relaxed max-w-sm">
                        {lesson.description}
                      </p>

                      <div className="flex items-center gap-1.5 mt-2 self-start text-[#3b82f6] hover:text-white text-[9px] font-mono font-black uppercase tracking-widest">
                        <span>LAUNCH TUTORIAL</span>
                        <ChevronRight size={12} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: PROGRESSIVE LEARNING PATHS
            ======================================================== */}
        {activeTab === "paths" && !selectedPath && !selectedLesson && (
          <div className="max-w-md mx-auto flex flex-col gap-6">
            <div className="text-left mb-2">
              <h3 className="text-xs uppercase tracking-widest text-emerald-400 font-black">Guided Trade Pathways</h3>
              <p className="text-[10px] text-white/40 uppercase font-black tracking-tight mt-1">Beginner to Advanced credentials designed to establish platform trade trust.</p>
            </div>

            {/* List the paths */}
            <div className="flex flex-col gap-5">
              {SKILL_PATHS.map((path) => {
                const totalCompletedInPath = LESSONS.filter(l => l.skillId === path.id && completedLessons.includes(l.id)).length;
                const pathTotalLessons = LESSONS.filter(l => l.skillId === path.id).length;
                const progressPercentage = getPathProgress(path.id);
                const isFollowing = followedPaths.includes(path.id);

                return (
                  <motion.div
                    key={path.id}
                    whileHover={{ y: -3 }}
                    onClick={() => setSelectedPath(path)}
                    className="p-6 rounded-[2.5rem] bg-gradient-to-br from-[#0a0d14] to-[#050609] border border-white/5 text-left relative group cursor-pointer overflow-hidden shadow-2xl hover:border-emerald-500/20 transition-all duration-300"
                  >
                    {/* Shadow visual decor */}
                    <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-400/5 blur-3xl pointer-events-none group-hover:opacity-20 transition-all" />

                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[8px] font-mono text-white/60 tracking-widest uppercase">
                        {path.category}
                      </span>
                      {isFollowing && (
                        <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1">
                          <Check size={8} strokeWidth={3} /> Followed
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-black uppercase tracking-tight italic text-white group-hover:text-emerald-400 transition-colors">
                      {path.title}
                    </h3>
                    
                    <p className="text-xs text-white/50 leading-relaxed mt-2">
                      {path.description}
                    </p>

                    {/* Progress representation */}
                    {isFollowing && (
                      <div className="mt-5 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-[9px] font-mono text-white/40">
                          <span>PATH PROGRESSION</span>
                          <span>{progressPercentage}% Completed ({totalCompletedInPath}/{pathTotalLessons})</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/[0.04]">
                      <span className="text-[10px] font-mono font-bold text-[#3b82f6]">
                        {pathTotalLessons} Curriculum Stages
                      </span>
                      <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center text-white/40 group-hover:text-white transition-all">
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: MY CLASSROOM (ENROLLED PATHS & BOOKMARKS)
            ======================================================== */}
        {activeTab === "my-classroom" && !selectedPath && !selectedLesson && (
          <div className="max-w-md mx-auto flex flex-col gap-8 text-left">
            
            {/* Active followed Paths section */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs uppercase tracking-widest text-[#3b82f6] font-black">Active Curriculum Tracker</h3>
              
              <div className="flex flex-col gap-4">
                {followedPaths.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-white/[0.01] border border-white/5 border-dashed text-center flex flex-col items-center gap-3">
                    <TrendingUp size={24} className="text-white/20" />
                    <p className="text-xs text-white/40">You are not following any skill pathways yet.</p>
                    <button onClick={() => setActiveTab("paths")} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all border border-white/10 cursor-pointer">Explore Paths</button>
                  </div>
                ) : (
                  followedPaths.map(pathId => {
                    const path = SKILL_PATHS.find(p => p.id === pathId);
                    if (!path) return null;
                    const progress = getPathProgress(pathId);
                    
                    return (
                      <div
                        key={pathId}
                        onClick={() => setSelectedPath(path)}
                        className="p-5 rounded-3xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 transition-all cursor-pointer flex flex-col gap-3 relative overflow-hidden group"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-[8px] text-[#3b82f6] font-bold uppercase tracking-widest font-mono">{path.category}</span>
                            <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors mt-0.5">{path.title}</h4>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white transition-all">
                            <ChevronRight size={14} />
                          </div>
                        </div>

                        {/* Mini progress bar */}
                        <div className="flex flex-col gap-1 mt-1">
                          <div className="flex justify-between text-[8px] text-white/40 font-mono">
                            <span>PROGRESS</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-[#3b82f6] transition-all duration-500" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Saved Bookmarked Lessons section */}
            <div className="flex flex-col gap-4 pt-4 border-t border-white/[0.04]">
              <h3 className="text-xs uppercase tracking-widest text-yellow-500 font-black">Bookmarked Lessons</h3>

              <div className="flex flex-col gap-3">
                {savedLessons.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-white/[0.01] border border-white/5 border-dashed text-center flex flex-col items-center gap-3">
                    <Bookmark size={24} className="text-white/20" />
                    <p className="text-xs text-white/40">No lessons bookmarked yet.</p>
                  </div>
                ) : (
                  savedLessons.map(lessonId => {
                    const l = LESSONS.find(lesson => lesson.id === lessonId);
                    if (!l) return null;
                    return (
                      <div
                        key={lessonId}
                        onClick={() => setSelectedLesson(l)}
                        className="p-4 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                            <img src={l.coverImage} className="w-full h-full object-cover brightness-75 group-hover:brightness-90 transition-all" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{l.title}</h4>
                            <p className="text-[9px] text-white/40 mt-1 uppercase font-mono">{l.level} • {l.duration}</p>
                          </div>
                        </div>

                        <div className="flex gap-1.5 relative z-20">
                          <button
                            onClick={(e) => toggleSaveLesson(l.id, e)}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-yellow-500/10 text-yellow-500 flex items-center justify-center transition-all cursor-pointer border border-white/5"
                          >
                            <Bookmark size={12} className="fill-yellow-500" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </motion.div>
  );
}

export default LearningHub;
