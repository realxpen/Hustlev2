import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ShieldCheck, Star, Clock, Info, AlertCircle, FileText, Trash2, Upload, Zap, ChevronRight, Check
} from "lucide-react";
import { convertCurrency, formatCurrency, Currency } from "../../lib/currency";

declare module 'react';

export interface ServiceProfile {
  id?: string;
  hustle_name?: string;
  full_name?: string;
  avatar_url?: string;
  verified?: boolean;
  rating_average?: string | number;
  review_count?: number;
}

export interface HustleServiceItem {
  id: string;
  owner_id: string;
  title: string;
  category?: string;
  verified?: boolean;
  base_price: string | number;
  pricing_type?: "fixed" | "hourly" | "milestone";
  rating_average?: string | number;
  profiles?: ServiceProfile;
}

export interface HireFlowModalProps {
  service: HustleServiceItem;
  onClose: () => void;
  onConfirmHire: (hiringPayload: {
    service: HustleServiceItem;
    notes: string;
    timeline: string;
    attachments: File[];
  }) => void;
  displayCurrency?: Currency;
}

export function HireFlowModal({
  service,
  onClose,
  onConfirmHire,
  displayCurrency = "USD",
}: HireFlowModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [notes, setNotes] = useState("");
  const [timeline, setTimeline] = useState("3 Days");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profile = service.profiles || {};
  const providerName = profile.hustle_name || profile.full_name || "Hustle Professional";
  const avatarUrl = profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id || service.owner_id}`;
  const isVerified = profile.verified || service.verified;
  const rating = Number(profile.rating_average || service.rating_average || 4.9).toFixed(1);

  // Price calculations
  const rawPrice = Number(service.base_price || 0);
  const selectedCurrency = (displayCurrency || "USD") as Currency;
  const subtotal = convertCurrency(rawPrice, "USD", selectedCurrency);
  const fee = subtotal * 0.05; // 5% secure holding fee
  const total = subtotal + fee;

  const formattedSubtotal = formatCurrency(subtotal, selectedCurrency);
  const formattedFee = formatCurrency(fee, selectedCurrency);
  const formattedTotal = formatCurrency(total, selectedCurrency);

  // File Upload Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const validFiles: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      // Max 10MB per file and prevent duplicate names
      if (file.size <= 10 * 1024 * 1024 && !attachments.some(f => f.name === file.name)) {
        validFiles.push(file);
      }
    }
    setAttachments([...attachments, ...validFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments(attachments.filter((_, idx) => idx !== indexToRemove));
  };

  const handleContinue = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!notes.trim()) return;
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    }
  };

  const handlePayAndConfirm = () => {
    onConfirmHire({
      service,
      notes,
      timeline,
      attachments
    });
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-end md:items-center justify-center p-0 md:p-6">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Hire Wizard Card Container */}
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-lg bg-[#0c0c0e] border-t md:border border-white/10 rounded-t-[2.5rem] md:rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl h-[85vh] md:h-auto md:max-h-[85vh]"
      >
        {/* Top Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Zap size={16} className="fill-current animate-pulse" />
            </div>
            <div>
              <h3 className="text-[11px] font-black uppercase text-white tracking-widest">
                Hiring Escrow Blueprint
              </h3>
              <p className="text-[9px] text-[#00ea87] uppercase tracking-wider font-extrabold">
                Step {currentStep} of 3: {currentStep === 1 ? "Confirm Assignment" : currentStep === 2 ? "Project Requirements" : "Escrow Review"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all active:scale-95"
          >
            <X size={16} />
          </button>
        </div>

        {/* Dynamic Progress indicator bar */}
        <div className="w-full bg-white/5 h-[2px]">
          <div
            className="bg-gradient-to-r from-blue-500 to-[#00ea87] h-full transition-all duration-300"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>

        {/* Scrollable Step Forms Room */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 no-scrollbar pb-24">
          <AnimatePresence mode="wait">
            {/* SCREEN 1: CONFIRM SERVICE */}
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                {/* Service Details Card */}
                <div className="p-5 rounded-3xl bg-white/[0.01] border border-white/5 space-y-4">
                  <div className="text-[9px] uppercase font-black tracking-widest text-cyan-400 bg-cyan-400/5 border border-cyan-400/10 px-3 py-1 rounded-md inline-block">
                    {service.category || "General Catalog"}
                  </div>
                  <h4 className="text-lg font-display font-black text-white uppercase tracking-tight leading-snug">
                    {service.title}
                  </h4>

                  {/* Provider Row */}
                  <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden shrink-0">
                      <img src={avatarUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover" alt={providerName} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-black uppercase text-white tracking-widest">{providerName}</span>
                        {isVerified && <ShieldCheck size={12} className="text-blue-400 fill-current" />}
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-white/50">
                        <Star size={10} className="text-yellow-400 fill-yellow-400" />
                        <span>{rating} Rating</span>
                        <span>•</span>
                        <span>{profile.review_count || 0} successful deliveries</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown Details */}
                <div className="space-y-3">
                  <h5 className="text-[9px] uppercase tracking-widest text-white/40 font-black">Holdings Cost Breakdown</h5>
                  <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/50">Base Price Service Rate ({service.pricing_type || "fixed"})</span>
                      <span className="font-mono text-white font-bold">{formattedSubtotal}</span>
</div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/50 flex items-center gap-1.5">
                        Escrow Contract Processing Fee
                        <span title="5% flat fee covers secure hold custody & payment clearing">
                          <Info size={12} className="text-white/30 cursor-help" />
                        </span>
                      </span>
                      <span className="font-mono text-white font-bold">{formattedFee}</span>
                    </div>
                    <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                      <span className="text-xs font-black uppercase tracking-wider text-white">Guaranteed Escrow Total</span>
                      <span className="font-display font-black text-lg text-[#00ea87]">{formattedTotal}</span>
                    </div>
                  </div>
                </div>

                {/* Trust banner */}
                <div className="p-5 rounded-2xl bg-blue-950/20 border border-blue-500/10 flex gap-4 text-[10px] text-white/60 leading-relaxed font-light">
                  <ShieldCheck size={24} className="text-blue-400 shrink-0" />
                  <div>
                    <strong className="text-white text-xs block mb-1">Your payment is protected by Hustle Escrow.</strong>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Money is held securely in our vault.</li>
                      <li>The provider only gets paid after you sign off on completion.</li>
                      <li>Full dispute protection is available if things go wrong.</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SCREEN 2: PROJECT DETAILS */}
            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                {/* Requirements Field */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline px-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Project Description & Specifications</label>
                    <span className="text-[8px] text-red-400 font-bold uppercase">Required</span>
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    required
                    rows={4}
                    placeholder="Describe exactly what needs to be done. Please include constraints, sizes, content copy guidelines, colors, or direct expectations..."
                    className="w-full bg-white/[0.03] border border-white/5 rounded-3xl p-4 text-xs font-light text-white outline-none focus:border-blue-500/30 transition-all focus:bg-white/5 placeholder-white/20 resize-none leading-relaxed"
                  />
                </div>

                {/* Preferred Timeline */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/30 px-1">Preferred Handover Timeline</label>
                  <select
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 hover:border-white/10 rounded-2xl p-4 text-xs font-medium text-white outline-none focus:border-blue-500/30 focus:bg-[#121215] transition-all cursor-pointer"
                  >
                    <option value="24 Hours" className="bg-[#121215] text-white py-2">⚡ Express Handover (24 Hours)</option>
                    <option value="3 Days" className="bg-[#121215] text-white py-2">📅 Standard Delivery (3 Days)</option>
                    <option value="1 Week" className="bg-[#121215] text-white py-2">📅 Extended Term (1 Week)</option>
                    <option value="2 Weeks" className="bg-[#121215] text-white py-2">📅 Enterprise Phase (2 Weeks)</option>
                    <option value="Flexible Schedule" className="bg-[#121215] text-white py-2">💬 Flexible Schedule (Coordinate in messages)</option>
                  </select>
                </div>

                {/* Attachments Section */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/30 px-1">Concept Attachments / Mockups</label>

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all ${isDragging
                        ? "border-blue-500 bg-blue-950/20"
                        : "border-white/10 hover:border-white/25 bg-white/[0.01]"
                      }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      multiple
                      className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60">
                        <Upload size={18} />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-white">Drag & drop asset mockups</p>
                      <p className="text-[9px] text-white/40">or click to choose files (Max 10MB each)</p>
                    </div>
                  </div>

                  {attachments.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <p className="text-[8px] uppercase tracking-widest font-black text-white/30 px-1">Selected Assets ({attachments.length})</p>
                      <div className="grid grid-cols-1 gap-2">
                        {attachments.map((file, idx) => (
                          <div
                            key={idx}
                            className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <FileText size={14} className="text-blue-400 shrink-0" />
                              <span className="text-[10.5px] text-white/80 font-medium truncate max-w-[200px]">
                                {file.name}
                              </span>
                              <span className="text-[9px] font-mono text-white/25 shrink-0">
                                ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeAttachment(idx);
                              }}
                              className="w-6 h-6 rounded-full bg-red-950/10 hover:bg-red-500/10 text-red-400 flex items-center justify-center transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* SCREEN 3: REVIEW */}
            {currentStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                {/* Project Overview summary block */}
                <div className="p-5 rounded-[2rem] bg-white/[0.01] border border-white/5 space-y-4">
                  <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#00ea87]">Contract Listing</span>
                    <h5 className="font-display font-black text-sm uppercase text-white truncate">{service.title}</h5>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5 text-xs">
                    <div>
                      <span className="text-white/30 text-[9px] font-black uppercase tracking-widest block mb-0.5">Assigned Specialist</span>
                      <span className="font-bold text-white uppercase tracking-wider">{providerName}</span>
                    </div>
                    <div>
                      <span className="text-white/30 text-[9px] font-black uppercase tracking-widest block mb-0.5">Agreed Timeline</span>
                      <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1">
                        <Clock size={12} className="text-yellow-400" /> {timeline}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 space-y-1">
                    <span className="text-white/30 text-[9px] font-black uppercase tracking-widest block">Project Instructions</span>
                    <p className="text-[11px] text-white/70 leading-relaxed font-light line-clamp-3 italic">
                      "{notes}"
                    </p>
                  </div>

                  {attachments.length > 0 && (
                    <div className="pt-3 border-t border-white/5">
                      <span className="text-white/30 text-[9px] font-black uppercase tracking-widest block mb-1">Attached files</span>
                      <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                        📎 {attachments.length} files successfully embedded
                      </p>
                    </div>
                  )}
                </div>

                {/* Lock Holding Details Card */}
                <div className="p-5 rounded-3xl bg-blue-950/10 border border-blue-500/15 flex items-center justify-between">
                  <div className="space-y-1">
                    <h6 className="text-[9px] font-black uppercase text-blue-400 tracking-widest">Locked Escrow Hold Deposit</h6>
                    <p className="text-[10px] text-white/55 leading-normal font-light">Includes base provider rate + flat 5% ledger processing fee.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-display font-black text-[#00ea87]">{formattedTotal}</span>
                    <span className="text-[8px] font-black uppercase text-[#00ea87] block tracking-widest mt-0.5">Guaranteed Secure</span>
                  </div>
                </div>

                {/* Escrow notice rules */}
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/10 flex gap-3 text-[10px] text-white/60 leading-normal font-light">
                  <AlertCircle size={18} className="text-amber-500 shrink-0" />
                  <span><strong>Escrow Guard Notice:</strong> The hold funds will remain held by our clearing system. Release of money starts purely upon your confirmation of delivery files. Cancel operations or dispute queries are fully managed in your account dashboard.</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM FIXED SIGNED ACTS CONTAINER */}
        <div className="absolute bottom-0 inset-x-0 p-6 bg-[#0c0c0e]/95 border-t border-white/10 backdrop-blur-md flex items-center justify-between z-[40]">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-6 h-12 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all"
              >
                Go Back
              </button>
            ) : (
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-white/30 uppercase tracking-wider mb-1">Contract Total</span>
                <span className="font-display font-black text-lg text-white font-bold">{formattedTotal}</span>
              </div>
            )}
          </div>

          <div>
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleContinue}
                disabled={currentStep === 2 && !notes.trim()}
                className={`px-8 h-12 rounded-full font-black text-[9px] uppercase tracking-widest shadow-lg flex items-center gap-1.5 active:scale-95 transition-all ${currentStep === 2 && !notes.trim()
                    ? "bg-white/5 border border-white/10 text-white/20 cursor-not-allowed"
                    : "bg-white hover:bg-neutral-100 text-black"
                  }`}
              >
                Continue <ChevronRight size={12} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePayAndConfirm}
                className="px-8 h-12 rounded-full bg-[#00ea87] hover:bg-[#00d575] font-black text-[9px] uppercase tracking-[0.15em] text-[#0c0c0e] shadow-2xl active:scale-[0.97] transition-all flex items-center gap-1.5"
              >
                <Check size={14} /> Pay & Continue
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}