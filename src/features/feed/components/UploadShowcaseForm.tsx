import React, { useState, useRef } from 'react';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import { useFeedStore } from '../stores/useFeedStore';
import { supabase } from '../../../lib/supabase';

interface UploadShowcaseFormProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const UploadShowcaseForm: React.FC<UploadShowcaseFormProps> = ({ onClose, onSuccess }) => {
    const { user } = useAuthStore();
    const { fetchDiscoveryFeed } = useFeedStore();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [serviceTitle, setServiceTitle] = useState('');
    const [startingPrice, setStartingPrice] = useState('');
    const [currency, setCurrency] = useState('NGN');

    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate size and format to fit informal market connectivity bandwidth constraints
        if (!file.type.startsWith('video/')) {
            setErrorMessage('Unsupported file format. Please select a valid MP4/MOV short video.');
            return;
        }
        if (file.size > 25 * 1024 * 1024) { // 25MB limit constraint
            setErrorMessage('Video size exceeds 25MB. Please compress files to support mobile data saving rules.');
            return;
        }

        setErrorMessage(null);
        setVideoFile(file);
        setVideoPreviewUrl(URL.createObjectURL(file));
    };

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!videoFile) {
            setErrorMessage('Please capture or select a proof-of-work showcase video clip.');
            return;
        }

        setIsUploading(true);
        setUploadProgress(15);
        setErrorMessage(null);

        try {
            // 1. Generate pathing signatures matching user session context logs
            const fileExt = videoFile.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;
            const bucketPath = `showcases/${fileName}`;

            // Guest simulation bypass check logic
            if (user.id.startsWith('guest-') || user.id === 'usr_lagos_9081') {
                setUploadProgress(60);
                await new Promise(resolve => setTimeout(resolve, 1200));
                setUploadProgress(100);
                onSuccess();
                return;
            }

            // 2. Upload video binary object up to Supabase storage buckets
            const { error: storageError } = await supabase.storage
                .from('feed_assets')
                .upload(bucketPath, videoFile, { cacheControl: '3600', upsert: false });

            if (storageError) throw storageError;
            setUploadProgress(50);

            // 3. Resolve deployment url pointer mapping strings
            const { data: { publicUrl } } = supabase.storage
                .from('feed_assets')
                .getPublicUrl(bucketPath);

            // 4. Record new showcase metadata directly down into feed table collections
            const { error: insertError } = await supabase
                .from('feed_posts')
                .insert({
                    hustler_id: user.id,
                    video_url: publicUrl,
                    title: title,
                    description: description,
                    service_title: serviceTitle || null,
                    service_starting_price: startingPrice ? parseFloat(startingPrice) : null,
                    currency: currency,
                    likes_count: 0,
                    views_count: 0
                });

            if (insertError) throw insertError;
            setUploadProgress(100);

            // Refresh global streams context to prepend item instantly
            await fetchDiscoveryFeed(true);
            onSuccess();
        } catch (err: any) {
            console.error('[Upload Pipeline Fault]', err);
            setErrorMessage(err.message || 'Transmission disrupted. Check network connectivity thresholds and repeat.');
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto select-none">
            <div className="w-full max-w-md bg-zinc-950 border border-zinc-900 rounded-2xl p-6 text-white shadow-2xl animate-fade-in my-auto">

                {/* Modal Form Title Header */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-900">
                    <div>
                        <h2 className="font-black text-sm uppercase tracking-wider text-amber-400">Post New Proof</h2>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Publish your short-form skill résumé showcase</p>
                    </div>
                    {!isUploading && (
                        <button onClick={onClose} className="text-zinc-500 hover:text-white p-1 text-sm font-bold cursor-pointer">
                            ✕
                        </button>
                    )}
                </div>

                {errorMessage && (
                    <div className="mt-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl font-medium">
                        ⚠️ {errorMessage}
                    </div>
                )}

                {/* Unified Processing Tracking Template Overlay View */}
                {isUploading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4 animate-fade-in">
                        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        <div className="w-full max-w-[200px] h-1.5 bg-zinc-900 rounded-full overflow-hidden mt-2">
                            <div
                                className="h-full bg-amber-500 rounded-full transition-all duration-300 scroll-smooth"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mt-1">Encoding Video Track ({uploadProgress}%)</p>
                    </div>
                ) : (
                    <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4 mt-4 text-xs font-semibold">

                        {/* Short-form Video Object Picker Layer Control */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider">Showcase Clip</label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="video/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            {videoPreviewUrl ? (
                                <div className="relative w-full aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                                    <video src={videoPreviewUrl} className="w-full h-full object-cover" muted playsInline autoPlay loop />
                                    <button
                                        type="button"
                                        onClick={() => { setVideoFile(null); setVideoPreviewUrl(null); }}
                                        className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 p-1.5 rounded-full text-white text-[10px]"
                                    >
                                        Change Video
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full aspect-video bg-zinc-900/40 hover:bg-zinc-900/80 border border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center text-zinc-500 gap-2 transition cursor-pointer group"
                                >
                                    <span className="text-3xl transition-transform transform group-hover:scale-105">📹</span>
                                    <span className="text-[11px] font-bold">Pick raw proof video (Max 25MB)</span>
                                </button>
                            )}
                        </div>

                        {/* Basic Information Input Strip Block fields */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider">Showcase Title</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g., Fixing core memory latency faults on native apps"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800/60 rounded-xl p-3 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider">Description</label>
                            <textarea
                                placeholder="Briefly break down the proof execution steps displayed in the video frame timeline context..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800/60 rounded-xl p-3 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 h-16 resize-none"
                            />
                        </div>

                        {/* Core Direct Tagged Service Metadata Layer Expansion */}
                        <div className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-xl flex flex-col gap-3.5">
                            <span className="text-[10px] text-amber-500/80 uppercase font-black tracking-widest">Link Direct Hiring Service (Optional)</span>

                            <div className="flex flex-col gap-1.5">
                                <input
                                    type="text"
                                    placeholder="Service Name (e.g., Premium Performance Optimization)"
                                    value={serviceTitle}
                                    onChange={(e) => setServiceTitle(e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-800/60 rounded-lg p-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="col-span-1">
                                    <select
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800/60 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 font-bold text-center"
                                    >
                                        <option value="NGN">NGN (₦)</option>
                                        <option value="USD">USD ($)</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <input
                                        type="number"
                                        placeholder="Starting Price"
                                        value={startingPrice}
                                        onChange={(e) => setStartingPrice(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800/60 rounded-lg p-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-bold"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-black font-black text-xs uppercase tracking-widest rounded-xl transition transform active:scale-95 mt-1 cursor-pointer shadow-xl shadow-amber-500/5"
                        >
                            Broadcast Proof-Of-Work
                        </button>
                    </form>
                )}

            </div>
        </div>
    );
};