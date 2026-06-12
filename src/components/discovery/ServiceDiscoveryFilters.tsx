import React from "react";
import { SlidersHorizontal, ShieldCheck, MapPin, Search, Star, Clock, Sparkles, X } from "lucide-react";

export interface FilterState {
  category: string;
  priceMin: number;
  priceMax: number;
  location: "all" | "local" | "remote";
  verifiedOnly: boolean;
  availableOnly: boolean;
}

export const CATEGORIES = [
  { id: "all", name: "All", icon: "🌐" },
  { id: "Designers", name: "Designers", icon: "🎨" },
  { id: "Barbers", name: "Barbers", icon: "✂️" },
  { id: "Tailors", name: "Tailors", icon: "🧵" },
  { id: "Makeup", name: "Makeup", icon: "💄" },
  { id: "Devs", name: "Devs", icon: "💻" },
  { id: "Photo", name: "Photo", icon: "📸" },
  { id: "Writers", name: "Writers", icon: "✍️" },
];

interface ServiceDiscoveryFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClose?: () => void;
  isInline?: boolean;
}

export function ServiceDiscoveryFilters({
  filters,
  onFilterChange,
  onClose,
  isInline = false,
}: ServiceDiscoveryFiltersProps) {
  
  const handleCategorySelect = (categoryId: string) => {
    onFilterChange({ ...filters, category: categoryId });
  };

  const setLocationMode = (mode: "all" | "local" | "remote") => {
    onFilterChange({ ...filters, location: mode });
  };

  const handleVerifiedToggle = () => {
    onFilterChange({ ...filters, verifiedOnly: !filters.verifiedOnly });
  };

  const handleAvailableToggle = () => {
    onFilterChange({ ...filters, availableOnly: !filters.availableOnly });
  };

  const handlePriceMaxChange = (val: number) => {
    onFilterChange({ ...filters, priceMax: val });
  };

  const clearFilters = () => {
    onFilterChange({
      category: "all",
      priceMin: 0,
      priceMax: 1000,
      location: "all",
      verifiedOnly: false,
      availableOnly: false,
    });
  };

  // Header segment for drawers
  const renderHeader = () => (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-2">
        <SlidersHorizontal size={16} className="text-blue-400" />
        <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">
          Discovery Scope
        </h3>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={clearFilters}
          className="text-[9px] font-black uppercase tracking-widest text-[#00ea87] hover:text-white transition-colors"
        >
          Reset All
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );

  const filtersContent = (
    <div className="space-y-6">
      {/* Category selection */}
      <div className="space-y-3">
        <h4 className="text-[9px] uppercase tracking-[0.25em] font-black text-white/30 italic px-1">
          Explore by Category
        </h4>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map((cat) => {
            const isSelected = filters.category.toLowerCase() === cat.id.toLowerCase();
            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`px-4 py-2.5 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                  isSelected
                    ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20 scale-105"
                    : "bg-white/5 border-transparent text-white/40 hover:bg-white/10"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Location preferences */}
      <div className="space-y-3">
        <h4 className="text-[9px] uppercase tracking-[0.25em] font-black text-white/30 italic px-1">
          Location Scope
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "all", label: "Global/All", icon: <Sparkles size={11} /> },
            { id: "local", label: "Local (< 5km)", icon: <MapPin size={11} /> },
            { id: "remote", label: "Remote", icon: <Clock size={11} /> },
          ].map((mode) => {
            const isSelected = filters.location === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setLocationMode(mode.id as any)}
                className={`py-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all border text-[9px] font-black uppercase tracking-widest ${
                  isSelected
                    ? "bg-blue-600 border-blue-500 text-white shadow-lg"
                    : "bg-white/5 border-transparent text-white/40 hover:bg-white/10"
                }`}
              >
                {mode.icon}
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Verification toggler checkboxes & available checkers */}
      <div className="grid grid-cols-2 gap-2 pb-1">
        {/* Toggle Verified */}
        <button
          onClick={handleVerifiedToggle}
          className={`p-4 rounded-2xl flex items-center gap-3 border text-left transition-all ${
            filters.verifiedOnly
              ? "bg-[#00ea87]/10 border-[#00ea87]/30 text-[#00ea87]"
              : "bg-white/5 border-transparent text-white/50 hover:bg-white/10"
          }`}
        >
          <ShieldCheck size={16} className={filters.verifiedOnly ? "text-[#00ea87]" : "text-white/20"} />
          <div className="leading-tight">
            <span className="block text-[9px] font-black uppercase tracking-widest">Verified Pro</span>
            <span className="text-[7.5px] opacity-40 uppercase font-bold tracking-wider">Top-rated certified</span>
          </div>
        </button>

        {/* Toggle Available */}
        <button
          onClick={handleAvailableToggle}
          className={`p-4 rounded-2xl flex items-center gap-3 border text-left transition-all ${
            filters.availableOnly
              ? "bg-blue-600/10 border-blue-500/30 text-blue-400"
              : "bg-white/5 border-transparent text-white/50 hover:bg-white/10"
          }`}
        >
          <Clock size={16} className={filters.availableOnly ? "text-blue-400" : "text-white/20"} />
          <div className="leading-tight">
            <span className="block text-[9px] font-black uppercase tracking-widest">Available Now</span>
            <span className="text-[7.5px] opacity-40 uppercase font-bold tracking-wider">With open slots</span>
          </div>
        </button>
      </div>

      {/* Pricing Range Slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h4 className="text-[9px] uppercase tracking-[0.25em] font-black text-white/30 italic">
            Max Scope Price
          </h4>
          <span className="text-xs font-black text-white">
            Up to ${filters.priceMax >= 1000 ? "1,000+" : filters.priceMax}
          </span>
        </div>
        <div className="relative pt-2">
          <input
            type="range"
            min="10"
            max="1000"
            step="10"
            value={filters.priceMax}
            onChange={(e) => handlePriceMaxChange(Number(e.target.value))}
            className="w-full select-none h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-600 outline-none"
          />
          <div className="flex justify-between text-[7px] text-white/20 tracking-widest font-black uppercase mt-1 px-1">
            <span>$10</span>
            <span>$500</span>
            <span>$1,000+</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (isInline) {
    return (
      <div className="p-6 bg-[#0c0c0e] border border-white/5 rounded-[2.5rem] shadow-2xl">
        {renderHeader()}
        {filtersContent}
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {renderHeader()}
      {filtersContent}
    </div>
  );
}
