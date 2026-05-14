export const MOCK_HUSTLERS = [
  {
    id: 1,
    creator: {
      id: 1,
      name: "Marcus V.",
      avatar: "",
      category: "UI/UX Specialist",
      location: "2.4 miles away",
      rating: 4.9,
      jobs: 142,
      verified: true,
      active: true,
    },
    content: {
      type: "video" as const,
      thumbnail: "",
      caption: "Crafting a high-conversion landing page for a local startup. Speed and intent are everything. #DesignHustle #ProductDesign",
      hasMusic: true,
      musicTrack: "Grind Mindset - Lofi Trap Beats"
    },
    embedCTA: { type: "book" as const, label: "Book Sprint", price: 500 },
    detailData: {
      id: 1,
      type: "service" as const,
      title: "Rapid Product Sprint",
      description: "Transform your vision into high-fidelity prototypes. I specialize in discovery phases that actually convert users.",
      heroMedia: [
        "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2670&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2670&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1512756783934-715949abd933?q=80&w=2670&auto=format&fit=crop"
      ],
      creator: {
        id: 1,
        name: "Marcus V.",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=2574&auto=format&fit=crop",
        category: "UI/UX Specialist",
        location: "London, UK",
        rating: 4.9,
        verified: true,
        responseTime: "Under 30 mins"
      },
      priceStructure: {
        startingPrice: 500,
        packages: [
          { name: "Concept", price: 500, features: ["Wireframes", "User flow", "2 revisions"] },
          { name: "Pro", price: 1200, features: ["High-fi Mockups", "Interactive Prototype", "Design System"] }
        ]
      },
      portfolio: [
        { type: "image" as const, url: "https://images.unsplash.com/photo-1581291518655-9523bb99cd0e?q=80&w=2670&auto=format&fit=crop" },
        { type: "image" as const, url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop" }
      ],
      reviews: [
        { id: 1, user: "SaaSMaster", rating: 5, text: "Marcus turned our chaos into a clean product in 3 days. Insane value.", time: "2d", isRepeat: true },
        { id: 2, user: "Elena_Design", rating: 5, text: "The attention to detail in his prototypes is world class.", time: "1w" }
      ],
      recommendations: [
        { id: 201, title: "Motion Systems", subtitle: "Complementary Service", price: 300, image: "https://images.unsplash.com/photo-1550745619-712399992f0?q=80&w=2670&auto=format&fit=crop", type: "service" as const }
      ],
      socialStats: { likes: 3200, shares: 128, saves: 50 }
    },
    recommendationReason: "Because you viewed Product Design"
  },
  {
    id: 2,
    creator: {
      id: 2,
      name: "Elena S.",
      avatar: "",
      category: "Streetwear Tailor",
      location: "0.8 miles away",
      rating: 5.0,
      jobs: 89,
      verified: true,
      active: false,
    },
    content: {
      type: "audio" as const,
      thumbnail: "",
      caption: "Talking through my process of upcycling vintage jackets into modern streetwear. Drop a comment if you want a custom piece.",
      hasMusic: true,
      musicTrack: "Elena's Voice Memo - Upcycling Process"
    },
    embedCTA: [
      { type: "buy" as const, label: "Buy Custom Jacket", price: 120 },
      { type: "buy" as const, label: "Indigo Cap", price: 45 }
    ],
    detailData: [
      {
        id: 2,
        type: "product" as const,
        title: "Upcycled Vintage Jacket",
        description: "One-of-a-kind hand-tailored jacket made from sustainable Japanese indigo canvas and vintage military liners.",
        heroMedia: [
          "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=2670&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1520975954732-35dd22299614?q=80&w=2574&auto=format&fit=crop"
        ],
        creator: {
          id: 2,
          name: "Elena S.",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2670&auto=format&fit=crop",
          category: "Streetwear Tailor",
          location: "Berlin, DE",
          rating: 5.0,
          verified: true,
          responseTime: "Under 1 hour"
        },
        price: 120,
        variants: [
          { name: "Size", options: ["S", "M", "L", "XL"] },
          { name: "Lining", options: ["Silk", "Quilted", "Unlined"] }
        ],
        stockStatus: "low-stock" as const,
        features: ["100% Recycled", "Hand-stitched", "Waterproof finish"],
        reviews: [
          { id: 3, user: "VintageViper", rating: 5, text: "The fit is perfect. You can tell it was made with love.", time: "1d", isRepeat: false },
          { id: 4, user: "StreetStyle", rating: 5, text: "Best jacket I own. Period.", time: "3d", isRepeat: true }
        ],
        recommendations: [
          { id: 202, title: "Cargo Pants", subtitle: "Matches your style", price: 85, image: "https://images.unsplash.com/photo-1517441530263-8a9d94943f74?q=80&w=2670&auto=format&fit=crop", type: "product" as const }
        ],
        socialStats: { likes: 1200, shares: 45, saves: 500 }
      },
      {
        id: 22,
        type: "product" as const,
        title: "Indigo Cap",
        description: "Minimalist 6-panel cap made from reclaimed indigo denim.",
        heroMedia: [
          "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=2670&auto=format&fit=crop"
        ],
        creator: {
          id: 2,
          name: "Elena S.",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2670&auto=format&fit=crop",
          category: "Streetwear Tailor",
          location: "Berlin, DE",
          rating: 5.0,
          verified: true,
        },
        price: 45,
        stockStatus: "in-stock" as const,
        features: ["Adjustable strap", "Made in Berlin"],
        reviews: [],
        recommendations: [],
        socialStats: { likes: 450, shares: 12, saves: 30 }
      }
    ],
    recommendationReason: "Trending in your area"
  },
  {
    id: 3,
    creator: {
      id: 3,
      name: "Jordan K.",
      avatar: "",
      category: "Motion Director",
      location: "5.1 miles away",
      rating: 4.8,
      jobs: 215,
      verified: true,
      active: true,
    },
    content: {
      type: "text" as const,
      thumbnail: "",
      caption: "The most underrated skill right now isn't coding, it's taste. Taste acts a filter for AI.",
    },
    repost: {
      by: "@design_junkie",
      thought: "Fact. Taste scales.",
    },
    embedCTA: { type: "apply" as const, label: "Join Mentorship" },
    detailData: {
      id: 3,
      type: "training" as const,
      title: "Mastering Taste in Design",
      description: "A 4-week intensive curriculum on how to develop professional-level design intuition and leverage AI as a tool rather than a crutch.",
      heroMedia: [
        "https://images.unsplash.com/photo-1550745619-712399992f0?q=80&w=2670&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop"
      ],
      creator: {
        id: 3,
        name: "Jordan K.",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2574&auto=format&fit=crop",
        category: "Motion Director",
        location: "NYC",
        rating: 4.8,
        verified: true,
        responseTime: "24 hours"
      },
      mentor: {
        id: 3,
        name: "Jordan K.",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2574&auto=format&fit=crop",
        category: "Motion Director",
        location: "NYC",
        rating: 4.8,
        verified: true,
      },
      curriculum: [
        { module: "The History of Esthetics", topics: ["Swiss vs. Brutalist", "Color Theory", "Psychology of Layout"] },
        { module: "AI Augmentation", topics: ["Prompting for Quality", "Iterative Filtering", "Post-process refinement"] }
      ],
      duration: "4 Weeks",
      format: "online" as const,
      outcomes: ["Portfolio Review", "Curated Asset Library", "Certification"],
      requirements: ["Basic Figma knowledge", "Minimum 1 year design exp"],
      reviews: [
        { id: 5, user: "JuniorDesigner", rating: 5, text: "My work looks completely different after just the first week.", time: "1mo", isRepeat: false }
      ],
      recommendations: [
        { id: 203, title: "Advanced AfterEffects", subtitle: "Deep Dive", price: 200, image: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2670&auto=format&fit=crop", type: "training" as const }
      ],
      socialStats: { likes: 5000, shares: 340, saves: 1200 }
    } as any
  },
  {
    id: 4,
    creator: {
      id: 4,
      name: "AudioEngine Inc.",
      avatar: "",
      category: "Software",
      location: "San Francisco",
      rating: 0,
      jobs: 0,
      verified: true,
      active: false,
    },
    content: {
      type: "video" as const,
      thumbnail: "",
      caption: "The new paradigm in mastering software. Get studio-grade mixes using AI. Try it free for 14 days.",
      hasMusic: true,
      musicTrack: "AudioEngine Promo Track"
    },
    isAd: true,
    embedCTA: { type: "ad" as const, label: "Learn More" },
  }
];
