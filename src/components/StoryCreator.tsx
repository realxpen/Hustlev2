import React, { useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Image as ImageIcon,
  Video as VideoIcon,
  Type,
  Navigation,
  Loader2,
} from "lucide-react";
import { useStoryDraftStore } from "../features/feed/stores/useStoryDraftStore";
import { useAuthStore } from "../features/auth/stores/useAuthStore";

export default function StoryCreator() {
  const { user } = useAuthStore();

  const {
    isOpen,
    mediaType,
    caption,
    mediaUrl,
    linkedType,
    isUploading,
    closeStoryCreator,
    setMedia,
    setCaption,
    setLinkedEntity,
    createStory,
  } = useStoryDraftStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type.startsWith("video/")) {
        setMedia(selectedFile, "video");
      } else {
        setMedia(selectedFile, "image");
      }
    }
  };

  const handlePost = async () => {
    if (!user) return;
    const success = await createStory(user.id);
    if (success) {
      closeStoryCreator();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed inset-0 z-[200] bg-black pointer-events-auto flex flex-col"
      >
        <div className="flex items-center justify-between p-4 pt-12 z-10 bg-gradient-to-b from-black/80 to-transparent">
          <button onClick={closeStoryCreator} className="p-2 text-white">
            <X size={24} />
          </button>
          <div className="flex gap-2">
            {(["general", "service", "training", "product"] as const).map(
              (type) => (
                <button
                  key={type}
                  onClick={() => setLinkedEntity(type, null)}
                  className={`px-3 py-1 text-xs uppercase font-bold rounded-full border transition-colors ${linkedType === type ? "bg-white text-black border-white" : "border-white/20 text-white/50 bg-black/50"} backdrop-blur-md`}
                >
                  {type}
                </button>
              ),
            )}
          </div>
        </div>

        <div className="flex-1 relative flex items-center justify-center p-6">
          {mediaUrl ? (
            mediaType === "image" ? (
              <img
                src={mediaUrl}
                alt="preview"
                className="absolute inset-0 w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <video
                src={mediaUrl}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover rounded-2xl"
              />
            )
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-zinc-900 rounded-3xl m-2">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Tap to type"
                className="w-full bg-transparent text-center text-4xl font-bold italic text-white placeholder-white/30 resize-none focus:outline-none h-64"
              />
            </div>
          )}

          {/* Caption Overlay if there is media */}
          {mediaUrl && (
            <div className="absolute bottom-[100px] left-4 right-4 z-20">
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full bg-black/50 border border-white/20 backdrop-blur-md text-white px-4 py-3 rounded-xl focus:outline-none"
              />
            </div>
          )}
        </div>

        <div className="h-[100px] bg-black flex items-center justify-between px-6 pb-8 shrink-0">
          <div className="flex gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition"
            >
              <ImageIcon size={24} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,video/*"
              onChange={handleFileChange}
            />

            {mediaUrl && (
              <button
                onClick={() => setMedia(null, "text")}
                className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition"
              >
                <Type size={24} />
              </button>
            )}
          </div>
          <button
            onClick={handlePost}
            disabled={
              isUploading ||
              (mediaType === "text" && !caption.trim()) ||
              (mediaType !== "text" && !mediaUrl)
            }
            className="px-6 py-3 bg-white text-black font-bold rounded-full disabled:opacity-50 flex items-center gap-2 transition"
          >
            {isUploading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                Post <Navigation size={18} className="rotate-90" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
