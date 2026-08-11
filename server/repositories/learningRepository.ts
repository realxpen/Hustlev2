import { SkillPath, Lesson, UserProgress } from "../types/learning";

export class LearningRepository {
  private static instance: LearningRepository;

  private paths: Map<string, SkillPath> = new Map();
  private lessons: Map<string, Lesson> = new Map();
  private progressStore: Map<string, UserProgress[]> = new Map(); // key: userId
  private userFollowedPaths: Map<string, string[]> = new Map(); // key: userId -> pathIds[]

  constructor() {
    this.seedLearningData();
  }

  public static getInstance(): LearningRepository {
    if (!LearningRepository.instance) {
      LearningRepository.instance = new LearningRepository();
    }
    return LearningRepository.instance;
  }

  private seedLearningData() {
    // 1. Seed Paths
    const pathSeeds: SkillPath[] = [
      {
        id: "path-barbering",
        title: "Master Barbering & Styling",
        category: "Grooming",
        description: "Learn advanced skin fades, texturizing, customized blade postures, and premium beard styling techniques.",
        xp_total: 450,
        featured_img: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80"
      },
      {
        id: "path-drywall",
        title: "Drywall & Interior Framing",
        category: "Trades",
        description: "Master drywall hanging, mudding coats, metal stud framing, and professional surface patching.",
        xp_total: 300,
        featured_img: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80"
      },
      {
        id: "path-ux",
        title: "Freelance UI/UX Designing",
        category: "Digital Arts",
        description: "Design spacing hierarchies, dark mode UI patterns, color theory, and responsive web animations.",
        xp_total: 600,
        featured_img: "https://images.unsplash.com/photo-1561070791-26c113006238?w=600&auto=format&fit=crop&q=80"
      },
      {
        id: "path-marketing",
        title: "TikTok Organic Growth & Sales",
        category: "Marketing",
        description: "Build high converting video hooks, master native editing tools, and setup direct calendar schedules.",
        xp_total: 400,
        featured_img: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80"
      }
    ];

    pathSeeds.forEach(p => this.paths.set(p.id, p));

    // 2. Seed Lessons (Beginner -> Intermediate -> Advanced for all paths)
    const lessonSeeds: Lesson[] = [
      // Barbering Path
      {
        id: "barber-1",
        skill_path_id: "path-barbering",
        level: "beginner",
        title: "Blade Posture & Safety Mechanics",
        duration: "8 mins",
        description: "Master direct skin touch angles, blade sanitization protocols, and natural posture ergonomics.",
        rich_content: "Professional blade grooming begins with your hand ergonomics. Hold the straight edge at exactly a 30-degree angle from the client's skin stretch line to maximize comfort and precision.\n\n### Step-by-Step Execution Guide:\n1. **Skin-Stretch Method**: Always pull the skin tight in the opposite direction of shave strokes.\n2. **Sanitation Protocols**: Spray antiseptic blades before shifting handles.\n3. **Ergonomic Leverage**: Pivot with your core, keeping your elbow relaxed near your posture line.",
        xp_reward: 100
      },
      {
        id: "barber-2",
        skill_path_id: "path-barbering",
        level: "intermediate",
        title: "Foil Shaver & Comb Blend Transitions",
        duration: "15 mins",
        description: "How to erase weight lines between Clipper Open and Half Open blade extensions.",
        rich_content: "Groomers fail most often at blending the zero line. We detail how using soft, short flicking wrist movements creates smooth gradients without dark weight bands.\n\n### Transition Roadmap:\n1. **High Fades**: Guide the comb 2 inches above ear pinna.\n2. **The Flick-Out Rule**: Apply radial angle sweeps rather than steady straight strokes.\n3. **Shaver Integration**: Transition with a dry guard layer.",
        xp_reward: 150
      },
      {
        id: "barber-3",
        skill_path_id: "path-barbering",
        level: "advanced",
        title: "Creative Texturing & Cropped Fringe",
        duration: "22 mins",
        description: "Customize slide slices to introduce top volume and create visual weight depth layers.",
        rich_content: "Advanced texturizing uses slide slicing to add movement to straight, rigid hair types. Never cut flat across the frontal fringe line unless designing micro crops.\n\n### Texturizing Principles:\n1. **Radial Partings**: Isolate crown sections relative to natural curls.\n2. **Point Cutting Angles**: Position thinning scissors at a steep 45-degree slide angle.\n3. **Clay Prep Work**: Emulsify pomade to define separated hair strands.",
        xp_reward: 200
      },

      // Drywall Path
      {
        id: "drywall-1",
        skill_path_id: "path-drywall",
        level: "beginner",
        title: "Hanging Sheets & Screw Spacing rules",
        duration: "10 mins",
        description: "Learn safe partition lifting, drywall anchor alignments, and stud-mapping math.",
        rich_content: "Always hang ceilings before walls. When screwing into timber framing structure, space elements exactly 12 inches apart on ceilings and 16 inches apart on walls.\n\n### Essential Framing Math:\n1. **Horizontal Layout**: Stagger drywall board seams to avoid double fractures.\n2. **Screw Depth Setup**: Drive screws slightly below surface index without stabbing paper backing.\n3. **Post-Framing Audit**: Run your hand flat across drywall sheets for alignment audits.",
        xp_reward: 100
      },
      {
        id: "drywall-2",
        skill_path_id: "path-drywall",
        level: "intermediate",
        title: "First mud Coats & Tape Embedding",
        duration: "18 mins",
        description: "Apply standard joint compounds, embed mesh tapings, and manage knife pressure sweeps.",
        rich_content: "The key to perfect walls is utilizing three separate chemical coats at thinning densities. This section teaches how joint tape must be compressed straight down to expel surplus mud safely.\n\n### Application Milestones:\n1. **Embedding Stage**: Use a wider 6-inch blade to guide joint compounds across lines.\n2. **Tape Smoothing**: Align the paper loop center directly on seams.\n3. **Edge Feathering**: Angle the outer blade edge downwards to shave excess layers.",
        xp_reward: 100
      },
      {
        id: "drywall-3",
        skill_path_id: "path-drywall",
        level: "advanced",
        title: "Skim Coating & Level 5 Smooth Finishes",
        duration: "25 mins",
        description: "Achieve uniform critical light sheets on high profile interior surface layouts.",
        rich_content: "Level 5 Drywall finish is the pinnacle of construction. It requires an overall tissue skimming layer to fully offset natural board and mud porosity variations.\n\n### Master Execution Requirements:\n1. **Thin-Out Ratio**: Combine water with joint compounds until it matches yogurt densities.\n2. **Wide Swept Squeegee**: Guide 24-inch compound knives smoothly downwards.\n3. **Backlit Inspection**: Shine halogen lamps at parallel angles to check micro-irregularities.",
        xp_reward: 100
      },

      // UI/UX Designing Path
      {
        id: "ux-1",
        skill_path_id: "path-ux",
        level: "beginner",
        title: "Figma Spacing & Layout Rhythm",
        duration: "12 mins",
        description: "Adopt consistent spacing metrics using the classic 8px grid constraint.",
        rich_content: "Uniform layout grids build psychological rhythm. By fixing standard component spacers to increments of 8px (e.g. 8/16/24/32/64), layouts align cleanly inside browser boxes.\n\n### Rhythm Guidelines:\n1. **The 8px Factor**: Ensure vertical gap padding values are multiples of 8.\n2. **Visual Hierarchy**: Keep headings at least 1.5x large over body scale.\n3. **Negative Space**: Give sections generous margins to allow elements breathing room.",
        xp_reward: 100
      },
      {
        id: "ux-2",
        skill_path_id: "path-ux",
        level: "intermediate",
        title: "Dark Theme Design and Contrast rules",
        duration: "16 mins",
        description: "Style premium charcoal cards, manage light highlights, and maintain strict readability indexes.",
        rich_content: "Never use absolute black (#000000) for UI backgrounds. Pure black elements eliminate shadow depths and create harsh visual fatigue. Favor rich, dark charcoal layers.\n\n### Layout Rules:\n1. **Surface Elevation**: Elevate cards with micro-borders of white opacity (#ffffff, 5%-10%).\n2. **Contrast Scoring**: Body copy must satisfy the WCAG standards (Contrast at least 4.5:1).\n3. **Saturated Accents**: Tone down accents to retain responsive visibility without flare glare.",
        xp_reward: 250
      },
      {
        id: "ux-3",
        skill_path_id: "path-ux",
        level: "advanced",
        title: "Responsive Motion & Timing Physics",
        duration: "30 mins",
        description: "Animate list additions, screen shifts, and button sweeps with ease in-and-out curve values.",
        rich_content: "Good app animations behave naturally. Standard ease-out cubic-bezier coordinates mimic the kinetic weight decelerations seen in physical instruments.\n\n### Frictionless Curves:\n1. **Entrance Transition**: Fast swipe duration (200ms - 300ms) with a sharp ease-out curve.\n2. **Exit Actions**: Shorter fade loops (150ms) to satisfy user inputs quickly.\n3. **Adaptive Staggering**: Stagger entry items by 30ms to create elegant flow dynamics.",
        xp_reward: 250
      },

      // Marketing growth path
      {
        id: "marketing-1",
        skill_path_id: "path-marketing",
        level: "beginner",
        title: "Structuring 3-Second Visual Hooks",
        duration: "7 mins",
        description: "Capture mobile feed viewers instantly with active graphic headers and movement.",
        rich_content: "Modern mobile platforms reward instant retention. The first 3 seconds of a profile video determine the algorithm's distribution tier. Learn to construct hooks.\n\n### Hook Formatting:\n1. **The Visual Pattern Disrupt**: Start in the middle of action, rather than introducing yourself.\n2. **Overlay Display Text**: Place bright, high-contrast display text in safe margins.\n3. **Dynamic Zoom sweeps**: Push or pull lenses slightly every second to maintain viewer interest.",
        xp_reward: 100
      },
      {
        id: "marketing-2",
        skill_path_id: "path-marketing",
        level: "intermediate",
        title: "Optimizing Calendar Booking Bridges",
        duration: "14 mins",
        description: "Build streamlined, single-click pipelines to convert followers into active jobs.",
        rich_content: "Minimize friction. Every additional click between a viral reel and a user booking drops your active conversions by roughly 20-30%. Keep pathways simple.\n\n### Integration Milestones:\n1. **Direct Profile CTAs**: Label buttons with clear, bold commitments (e.g., 'Book Now').\n2. **Auto-Pilot Schedule**: Sync timezone calendars to allow friction-free slot claims.\n3. **Confirmation Alerts**: Dispatch SMS notifications immediately upon purchase validation.",
        xp_reward: 150
      },
      {
        id: "marketing-3",
        skill_path_id: "path-marketing",
        level: "advanced",
        title: "Advanced Paid Funnel Shuffling",
        duration: "20 mins",
        description: "Harness localized target profiling, ad layout bidding splits, and hyper-segmented audience mapping.",
        rich_content: "To grow your localized client base sustainably, direct low-cost localized retargeting funnels to active profiles.\n\n### Strategy Blueprint:\n1. **Shatter-A/B Experiments**: Design four hook configurations for each offer profile.\n2. **Zip Code Slicing**: Confine active bidding circles to 10 miles of your home workstation.\n3. **Friction Auditing**: Verify mobile page load configurations across modern operating layouts.",
        xp_reward: 150
      }
    ];

    lessonSeeds.forEach(l => this.lessons.set(l.id, l));
  }

  // Paths
  public getAllPaths(): SkillPath[] {
    return Array.from(this.paths.values());
  }

  public getPathById(id: string): SkillPath | undefined {
    return this.paths.get(id);
  }

  // Lessons
  public getAllLessons(): Lesson[] {
    return Array.from(this.lessons.values());
  }

  public getLessonById(id: string): Lesson | undefined {
    return this.lessons.get(id);
  }

  public getLessonsByPathId(pathId: string): Lesson[] {
    return Array.from(this.lessons.values()).filter(l => l.skill_path_id === pathId);
  }

  // Progress Logging
  public getProgressForUser(userId: string): UserProgress[] {
    if (!this.progressStore.has(userId)) {
      this.progressStore.set(userId, []);
    }
    return this.progressStore.get(userId) || [];
  }

  public getProgressForUserAndLesson(userId: string, lessonId: string): UserProgress | undefined {
    const userProgress = this.getProgressForUser(userId);
    return userProgress.find(p => p.lesson_id === lessonId);
  }

  public saveProgress(progress: UserProgress): UserProgress {
    const userId = progress.user_id;
    const records = this.getProgressForUser(userId);
    const existingIndex = records.findIndex(r => r.lesson_id === progress.lesson_id);

    if (existingIndex !== -1) {
      records[existingIndex] = progress;
    } else {
      records.push(progress);
    }

    this.progressStore.set(userId, records);
    return progress;
  }

  // Followed Paths mappings
  public getFollowedPathIdsOfUser(userId: string): string[] {
    if (!this.userFollowedPaths.has(userId)) {
      // By default, match with active or featured paths to start with some guidance
      this.userFollowedPaths.set(userId, []);
    }
    return this.userFollowedPaths.get(userId) || [];
  }

  public followPathForUser(userId: string, pathId: string): string[] {
    const current = this.getFollowedPathIdsOfUser(userId);
    if (!current.includes(pathId)) {
      current.push(pathId);
      this.userFollowedPaths.set(userId, current);
    }
    return current;
  }

  public unfollowPathForUser(userId: string, pathId: string): string[] {
    let current = this.getFollowedPathIdsOfUser(userId);
    current = current.filter(id => id !== pathId);
    this.userFollowedPaths.set(userId, current);
    return current;
  }
}
