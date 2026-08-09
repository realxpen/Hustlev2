import React, { useState } from 'react';
import type { FeedPost } from '../../../types/feed';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import { bookingService } from '../services/bookingService';

interface BookingWizardProps {
    post: FeedPost;
    onClose: () => void;
    onSuccess: (bookingId: string) => void;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({ post, onClose, onSuccess }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [milestoneType, setMilestoneType] = useState<'single' | 'milestones'>('single');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorText, setErrorText] = useState<string | null>(null);

    // Grab the currently authenticated client user metadata safely
    const { user } = useAuthStore();

    const basePrice = post.service_starting_price || 0;
    const currency = post.currency || 'NGN';

    // Configured milestone defaults
    const [milestones, setMilestones] = useState<{ id: string; title: string; percent: number }[]>([
        { id: 'm1', title: 'Initial Project Blueprint', percent: 30 },
        { id: 'm2', title: 'Midpoint Handover & Core Demo', percent: 40 },
        { id: 'm3', title: 'Final Deployment Optimization', percent: 30 },
    ]);

    const handleMilestonePercentChange = (id: string, newPercent: number) => {
        setMilestones(prev => prev.map(m => m.id === id ? { ...m, percent: newPercent } : m));
    };

    const totalPercent = milestones.reduce((sum, m) => sum + m.percent, 0);

    const executeEscrowDepositSequence = async () => {
        if (!user) {
            setErrorText('Authentication session expired. Please sign in to book a service.');
            return;
        }

        setStep(3);
        setIsSubmitting(true);
        setErrorText(null);

        try {
            // Compile milestones structure dynamically depending on client setup choice
            const finalMilestones = milestoneType === 'single'
                ? [{ title: 'Full Contract Delivery Milestone', percent: 100 }]
                : milestones.map(m => ({ title: m.title, percent: m.percent }));

            const payload = {
                clientId: user.id,
                hustlerId: post.hustler_id,
                serviceId: post.service_id,
                totalAmount: basePrice,
                currency: currency,
                milestones: finalMilestones
            };

            // Direct secure transaction insertion down into Supabase
            const generatedBookingId = await bookingService.createEscrowBooking(payload);

            onSuccess(generatedBookingId);
        } catch (err: any) {
            console.error('[Escrow Transaction Error]', err);
            setErrorText(err.message || 'Escrow initialization failed. Please adjust values and try again.');
            setStep(2); // Bounce user back to summary step gracefully to correct parameters
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end justify-center select-none">
            <div className="w-full max-w-md bg-zinc-950 border-t border-zinc-900 rounded-t-2xl p-6 text-white max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">

                {/* Top Header Section */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-900">
                    <div>
                        <h2 className="font-black text-sm uppercase tracking-wider text-amber-400">Secure Escrow Setup</h2>
                        <p className="text-[11px] text-zinc-400 mt-0.5">Hiring @{post.hustler.username}</p>
                    </div>
                    {step < 3 && (
                        <button
                            onClick={onClose}
                            className="text-zinc-500 hover:text-white p-1 text-sm font-bold cursor-pointer"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Dynamic Error Messaging Output Strip */}
                {errorText && (
                    <div className="mt-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl font-medium">
                        ⚠️ {errorText}
                    </div>
                )}

                {/* STEP 1: Plan Contract Configuration Choice */}
                {step === 1 && (
                    <div className="flex flex-col gap-5 mt-4">
                        <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-900">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Selected Offering</span>
                            <h4 className="font-bold text-sm mt-0.5 text-zinc-200">{post.service_title}</h4>
                            <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{post.description}</p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-zinc-400">Choose Trust/Payment Layout</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setMilestoneType('single')}
                                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${milestoneType === 'single' ? 'border-amber-500 bg-amber-500/5' : 'border-zinc-900 bg-zinc-900/20'
                                        }`}
                                >
                                    <p className="text-xs font-black">100% Upfront Escrow</p>
                                    <p className="text-[10px] text-zinc-400 mt-1">Funds completely secure. Held as single contract.</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMilestoneType('milestones')}
                                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${milestoneType === 'milestones' ? 'border-amber-500 bg-amber-500/5' : 'border-zinc-900 bg-zinc-900/20'
                                        }`}
                                >
                                    <p className="text-xs font-black">Progress Milestones</p>
                                    <p className="text-[10px] text-zinc-400 mt-1">Split funds across phase approvals. Highly flexible.</p>
                                </button>
                            </div>
                        </div>

                        {milestoneType === 'single' && (
                            <div className="bg-zinc-900 p-4 rounded-xl flex justify-between items-center">
                                <span className="text-xs font-bold text-zinc-400">Total Contract Value:</span>
                                <span className="text-base font-black text-amber-400">{currency} {basePrice.toLocaleString()}</span>
                            </div>
                        )}

                        <button
                            onClick={() => setStep(2)}
                            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black font-black text-xs uppercase tracking-widest rounded-xl transition transform active:scale-95 mt-2 cursor-pointer"
                        >
                            Continue to Terms
                        </button>
                    </div>
                )}

                {/* STEP 2: Breakdown Weight Adjustments & Terms Review */}
                {step === 2 && (
                    <div className="flex flex-col gap-4 mt-4">
                        {milestoneType === 'milestones' ? (
                            <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-zinc-400">Configure Phase Split Weights</label>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${totalPercent === 100 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                        {totalPercent}% Allocated
                                    </span>
                                </div>

                                <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                                    {milestones.map((m) => (
                                        <div key={m.id} className="bg-zinc-900 p-3 rounded-xl flex flex-col gap-2 border border-zinc-800/40">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-zinc-200 truncate pr-2">{m.title}</span>
                                                <span className="text-amber-400 shrink-0">{currency} {((m.percent / 100) * basePrice).toLocaleString()}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="10"
                                                max="80"
                                                step="5"
                                                value={m.percent}
                                                onChange={(e) => handleMilestonePercentChange(m.id, parseInt(e.target.value))}
                                                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                            />
                                            <div className="text-[10px] text-zinc-500 text-right">{m.percent}% Weight</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-zinc-900 p-4 rounded-xl flex flex-col gap-2 text-zinc-300 text-xs font-light leading-relaxed">
                                <p className="font-bold text-zinc-200 uppercase text-[9px] tracking-widest text-amber-500">How Escrow Operates</p>
                                <p>1. Your payment of <strong className="text-zinc-100">{currency} {basePrice.toLocaleString()}</strong> is securely transferred into a local trust vault contract account instantly.</p>
                                <p>2. Funds remain isolated. The provider can view confirmed backing but cannot make withdrawals.</p>
                                <p>3. Once proof of delivery is satisfied, tap "Release Funds" to finalize payment directly to the provider.</p>
                            </div>
                        )}

                        <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-zinc-900">
                            <div className="flex justify-between items-center text-xs px-1">
                                <span className="text-zinc-400">Total Escrow Deposit</span>
                                <span className="font-black text-zinc-100 text-sm">{currency} {basePrice.toLocaleString()}</span>
                            </div>
                            <div className="flex gap-3 mt-2">
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={executeEscrowDepositSequence}
                                    disabled={milestoneType === 'milestones' && totalPercent !== 100}
                                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 disabled:opacity-40 disabled:pointer-events-none text-black font-black text-xs uppercase tracking-widest rounded-xl transition transform active:scale-95 text-center cursor-pointer"
                                >
                                    Authorize Secure Lock
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: Active Loading Engine Statement */}
                {step === 3 && (
                    <div className="flex flex-col items-center justify-center py-10 gap-4 animate-fade-in">
                        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        <div className="text-center">
                            <h4 className="font-black text-sm uppercase tracking-wide">Syncing Escrow Vault...</h4>
                            <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-relaxed">
                                Routing tokens through secure verification proxies to lock project capital down into the database ledger. One moment.
                            </p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};