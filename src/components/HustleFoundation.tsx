import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, Heart, Shield, Sparkles, MoveRight, Eye, MousePointer2, 
  Palette, Type, Layout, Activity, Star, Layers, Hexagon,
  MousePointer, Tablet, Smartphone, Search, MessageCircle, ShoppingBag
} from 'lucide-react';
import { Button, Input, SearchInput, Card, Chip, Toast, Skeleton } from './HustleUI';

export default function HustleFoundation({ onClose }: { onClose: () => void }) {
  const [showToast, setShowToast] = useState(false);
  const [activeTab, setActiveTab] = useState('Buttons');

  const components = {
    Buttons: (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase text-white/20">Primary</p>
            <Button className="w-full">Action</Button>
          </div>
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase text-white/20">CTA / Monetize</p>
            <Button variant="cta" className="w-full" onClick={() => setShowToast(true)}>Book Now</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Button variant="secondary" className="w-full">Secondary</Button>
          <Button variant="destructive" className="w-full">Delete</Button>
        </div>
        <div className="flex gap-4">
          <Button variant="ghost">Ghost</Button>
          <Button isLoading className="w-32" />
        </div>
      </div>
    ),
    Inputs: (
      <div className="space-y-6">
        <SearchInput placeholder="Search discovery..." />
        <Input label="Stream Title" placeholder="Enter title..." />
        <Input label="Price" placeholder="$0.00" error={false ? '' : 'Market average: $12.00'} />
      </div>
    ),
    Cards: (
      <div className="space-y-6">
        <Card className="p-8 aspect-video flex flex-col justify-end bg-gradient-to-br from-brand-accent/20 to-transparent">
          <div className="space-y-2">
             <div className="w-12 h-1.5 bg-brand-primary rounded-full" />
             <h4 className="text-xl font-black italic">CINEMATIC CARD</h4>
             <p className="text-xs text-white/40">Modular, elevated, and responsive.</p>
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-4">
           <Card variant="glass" className="p-6 aspect-square flex flex-col items-center justify-center gap-3">
              <ShoppingBag className="text-brand-success" />
              <span className="text-[10px] font-black uppercase">Product</span>
           </Card>
           <Card variant="outline" className="p-6 aspect-square flex flex-col items-center justify-center gap-3 border-dashed">
              <Skeleton className="w-full h-full" />
           </Card>
        </div>
      </div>
    ),
    Systems: (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
           <Chip label="Skill Demo" active />
           <Chip label="Training" />
           <Chip label="Q&A" />
           <Chip label="Promo" icon={Zap} />
        </div>
        <div className="space-y-4">
           <Skeleton className="h-4 w-3/4" />
           <Skeleton className="h-4 w-1/2" />
           <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  };

  const sections = [
    {
      id: 'emotion',
      title: 'Emotional Identity',
      icon: <Sparkles className="text-brand-primary" />,
      description: 'Hustle feels alive, ambitious, and premium. It is the intersection of high-street authenticity and Apple-level polish.',
      tags: ['Alive', 'Ambitious', 'Creative', 'Modern']
    },
    {
      id: 'colors',
      title: 'Cinematic Color System',
      icon: <Palette className="text-brand-accent" />,
      description: 'A dark-first palette optimized for cinematic depth. Not pure black, but layers of deep obsidian and cosmic grays.',
      swatches: [
        { name: 'Primary', hex: '#FF2D55', label: 'Hustle Rose (Live Energy)' },
        { name: 'Accent', hex: '#5856D6', label: 'Indigo (Premium Hub)' },
        { name: 'Success', hex: '#34C759', label: 'Growth (Commerce)' },
        { name: 'Background', hex: '#050505', label: 'Cosmic Surface' }
      ]
    },
    {
      id: 'type',
      title: 'Typography Foundation',
      icon: <Type className="text-white/60" />,
      description: 'Bold, expressive headlines paired with functional, high-legibility UI text.',
      fonts: [
        { family: 'Outfit', usage: 'Headlines, Display, Emotional CTAs', weight: '800' },
        { family: 'Inter', usage: 'Interface, Captions, Marketplace Data', weight: '400' }
      ]
    },
    {
      id: 'motion',
      title: 'Motion Personality',
      icon: <Activity className="text-brand-warning" />,
      description: 'Responsive and reactive. Motion is used to communicate activity, reward earning, and guide the user through flows.',
      principles: ['Reactive Scaling', 'Elastic Overshoots', 'Cinematic Fades']
    },
    {
      id: 'hierarchy',
      title: 'Visual Hierarchy',
      icon: <Layers className="text-brand-info" />,
      description: 'Attention is focused using surface depth and glow. High-priority monetization elements always carry the brand-primary pulse.',
      tags: ['Surface Depth', 'Glow Accents', 'Size Contrast']
    },
    {
      id: 'brand',
      title: 'Brand Differentiation',
      icon: <Star className="text-brand-success" />,
      description: 'Hustle is not a generic fintech app. It is a creator-first local-discovery engine. It combines utility with raw cultural energy.',
      tags: ['Creator-First', 'Local-Discovery', 'Economic Empowerment']
    }
  ];

  return (
    <div className="fixed inset-0 z-[1000] bg-surface-bg text-white overflow-y-auto overflow-x-hidden font-sans">
      <div className="grain-overlay" />
      
      {/* Hero Header */}
      <section className="relative pt-24 pb-16 px-6 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[50vh] bg-gradient-to-b from-brand-accent/10 to-transparent opacity-50 pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 active-scale">
            <Hexagon size={12} className="text-brand-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Foundation V1.0</span>
          </div>
          <h1 className="text-6xl font-black italic tracking-tighter leading-none mb-4 font-display">THE HUSTLE IDENTITY</h1>
          <p className="text-white/40 max-w-sm mx-auto text-sm font-medium leading-relaxed">
            Every pixel, every transition, and every color is designed to make users feel alive with opportunity.
          </p>
        </motion.div>
        
        {/* Abstract shapes */}
        <div className="absolute top-40 left-[-10%] w-64 h-64 bg-brand-primary/10 rounded-full blur-[100px]" />
        <div className="absolute top-60 right-[-10%] w-64 h-64 bg-brand-accent/10 rounded-full blur-[100px]" />
      </section>

      {/* Grid Content */}
      <div className="px-6 pb-24 max-w-2xl mx-auto space-y-12 relative z-10">
        
        {sections.map((section, idx) => (
          <motion.div 
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="group"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl glass-light flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                {section.icon}
              </div>
              <h2 className="text-2xl font-black font-display group-hover:translate-x-1 transition-transform">{section.title}</h2>
            </div>
            
            <p className="text-white/60 text-sm leading-relaxed mb-6 border-l-2 border-white/10 pl-6">
              {section.description}
            </p>

            {/* Sub-content based on section type */}
            <div className="pl-6 space-y-4">
              {section.swatches && (
                <div className="grid grid-cols-2 gap-3">
                  {section.swatches.map(swatch => (
                    <div key={swatch.name} className="glass-light p-3 rounded-2xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg shadow-xl" style={{ backgroundColor: swatch.hex }} />
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/40">{swatch.name}</div>
                        <div className="text-[9px] font-bold text-white/60">{swatch.hex}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {section.tags && (
                <div className="flex flex-wrap gap-2">
                  {section.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/60">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {section.fonts && (
                <div className="space-y-3">
                  {section.fonts.map(font => (
                    <div key={font.family} className="glass-light p-4 rounded-2xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{font.usage}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">W:{font.weight}</span>
                      </div>
                      <div className={`text-2xl ${font.family === 'Outfit' ? 'font-display' : 'font-sans'}`} style={{ fontWeight: font.weight }}>
                         The quick brown fox jumps over the lazy dog
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {section.principles && (
                <div className="grid grid-cols-1 gap-2">
                  {section.principles.map(p => (
                    <div key={p} className="flex items-center gap-3 text-sm font-medium text-white/70">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                      {p}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="pt-12 border-t border-white/5"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl glass-light flex items-center justify-center">
              <Layers className="text-brand-success" />
            </div>
            <h2 className="text-2xl font-black font-display">Component System</h2>
          </div>

          <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
            {Object.keys(components).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-black shrink-0' : 'text-white/40 shrink-0'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="pb-12"
          >
            {components[activeTab as keyof typeof components]}
          </motion.div>
        </motion.div>

        <Toast 
          isOpen={showToast} 
          message="System Active • Feedback Reactive" 
          onClose={() => setShowToast(false)} // Need to ensure Toast takes onClose if it's meant to be dismissed
        />

        <motion.button 
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="w-full h-16 rounded-[2rem] bg-white text-black font-black uppercase tracking-[0.3em] text-xs active-scale shadow-2xl"
        >
          Close Design Spec
        </motion.button>
      </div>

      {/* Micro-feel Details Section */}
      <section className="px-6 py-24 glass mt-24 border-x-0">
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 text-center mb-12">MICRO-FEEL VISUAL RULES</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {[
            { label: 'Glow Philosophy', desc: 'Subtle 20px blurs behind active indicators' },
            { label: 'Grain Logic', desc: 'Global 2.5% fractal noise overlay for texture' },
            { label: 'Blur Depth', desc: '20px-40px background blurs for cinematic overlays' },
            { label: 'Radius System', desc: 'Multi-tiered: 16px (UI) to 40px (Hero Containers)' }
          ].map(rule => (
            <div key={rule.label} className="text-center">
              <div className="w-12 h-12 rounded-full border border-white/10 mx-auto mb-4 flex items-center justify-center">
                 <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-white/80 mb-2">{rule.label}</div>
              <p className="text-[9px] font-medium text-white/30 leading-relaxed uppercase">{rule.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="py-12 text-center">
         <p className="text-[10px] font-black uppercase tracking-widest text-white/10 underline decoration-white/5 underline-offset-4">Hustle Design Systems • 2026</p>
      </footer>
    </div>
  );
}
