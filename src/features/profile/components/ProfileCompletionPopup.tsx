import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronRight, CheckCircle2, AlertCircle, Loader2, Check } from "lucide-react";
import { useProfileStore } from "../stores/useProfileStore";
import { useProfileCompletionStore } from "../stores/useProfileCompletionStore";
import { useAuthStore } from "../../auth/stores/useAuthStore";
import { useUsernameValidation } from "../hooks/useUsernameValidation";
import { generateUniqueUsername } from "../utils/usernameGenerator";

export default function ProfileCompletionPopup() {
  const { isProfileIncomplete, isDismissed, dismissCompletionFlow, completionPercentage } = useProfileCompletionStore();
  const { profile, updateProfile } = useProfileStore();
  const { user } = useAuthStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Step 1 local state
  const { username, handleChange: handleUsernameChange, isValidating, error: usernameError, isValid: isUsernameValid, setUsername } = useUsernameValidation("");
  const [dob, setDob] = useState("");
  
  // Step 2 local state
  const [role, setRole] = useState("user");
  const [interestsText, setInterestsText] = useState("");
  
  // Step 3 local state
  const [bio, setBio] = useState("");
  const [profession, setProfession] = useState("");

  useEffect(() => {
    // Show popup if incomplete and not dismissed temporarily
    // To not flash, we delay showing it slightly
    if (isProfileIncomplete && !isDismissed && profile && !isOpen) {
      const timer = setTimeout(async () => {
        setIsOpen(true);
        // Pre-fill only when opening for the first time
        
        let initialUsername = profile.username || "";
        if (!initialUsername) {
            // Auto suggest a name from email/name
            const base = profile.full_name || user?.email?.split('@')[0] || 'user';
            initialUsername = await generateUniqueUsername(base);
        }
        
        setUsername(initialUsername);
        
        setDob(profile.date_of_birth || "");
        setRole(profile.role || "user");
        setInterestsText((profile.interests || []).join(", "));
        setBio(profile.bio || "");
        setProfession(profile.profession || "");
      }, 1500);
      return () => clearTimeout(timer);
    } else if (!isProfileIncomplete) {
      setIsOpen(false); // smoothly hide if they finish
    }
  }, [isProfileIncomplete, isDismissed, profile, isOpen, user, setUsername]);

  const handleDismiss = () => {
    setIsOpen(false);
    dismissCompletionFlow(); // persist dismissal
  };

  if (!isOpen || !profile || !user) return null;

  const handleNextStep = async () => {
    if (step === 1) {
      // Save step 1
      if (!username || !dob || usernameError) return; // simple validation
      setIsSubmitting(true);
      try {
        await updateProfile(user.id, { username, date_of_birth: dob });
        setStep(2);
      } catch (err: any) {
        if (err?.code === '23505') { // postgres unique violation
           // fallback just in case race condition
           handleUsernameChange(username); 
        }
        console.error("Failed to update step 1", err);
      } finally {
        setIsSubmitting(false);
      }
    } else if (step === 2) {
      // Save step 2
      if (!role || !interestsText) return;
      setIsSubmitting(true);
      try {
        let currentInterests = profile.interests || [];
        const newInterests = interestsText.split(",").map(i => i.trim()).filter(Boolean);
        await updateProfile(user.id, { role, interests: Array.from(new Set([...currentInterests, ...newInterests])) });
        setStep(3);
      } catch (err) {
        console.error("Failed to update step 2", err);
      } finally {
        setIsSubmitting(false);
      }
    } else if (step === 3) {
      // Save step 3 (optional)
      setIsSubmitting(true);
      try {
        await updateProfile(user.id, { bio, profession });
        handleDismiss();
      } catch (err) {
        console.error("Failed to update step 3", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 pointer-events-none">
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="w-full max-w-4xl bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl pointer-events-auto relative overflow-hidden flex flex-col sm:flex-row items-center p-4 gap-4 sm:gap-6"
        >
          {/* Progress Bar background */}
          <div className="absolute top-0 left-0 h-1 bg-zinc-800 w-full" />
          <div 
            className="absolute top-0 left-0 h-1 bg-white transition-all duration-500 ease-out" 
            style={{ width: `${completionPercentage}%` }} 
          />

          {/* Text Section */}
          <div className="flex-1 w-full sm:min-w-[200px]">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-display font-medium text-white mb-0.5">
                  {step === 1 ? "Complete profile" : step === 2 ? "Your goals" : "Final touches"}
                </h3>
                <p className="text-xs text-zinc-400 line-clamp-1">
                  {step === 1 ? "Set up your basic identity." : step === 2 ? "Personalize your feed." : "Optional community details."}
                </p>
              </div>
              <button 
                onClick={handleDismiss}
                className="p-1.5 sm:hidden bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/50 shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Input Section */}
          <div className="flex-1 w-full min-w-[280px]">
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-2">
                 <div className="flex flex-row gap-3">
                   <div className="relative w-full">
                     <input 
                      type="text" 
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      className={`w-full bg-black/40 border rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none transition-colors ${usernameError ? 'border-red-500/50 focus:border-red-500' : isUsernameValid ? 'border-green-500/30 focus:border-green-500' : 'border-white/10 focus:border-white/30'}`}
                      placeholder="@username"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                       {isValidating && <Loader2 size={14} className="animate-spin text-zinc-500" />}
                       {!isValidating && isUsernameValid && <Check size={14} className="text-green-500" />}
                       {!isValidating && usernameError && <AlertCircle size={14} className="text-red-500" />}
                    </div>
                   </div>
                  <input 
                    type="date" 
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors [&::-webkit-calendar-picker-indicator]:invert"
                  />
                 </div>
                 <AnimatePresence>
                   {!isValidating && usernameError && (
                     <motion.p 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }}
                        className="text-xs text-red-400 pl-1"
                     >
                       {usernameError}
                     </motion.p>
                   )}
                 </AnimatePresence>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-row gap-3">
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30 transition-colors appearance-none"
                >
                  <option value="user">User / Explorer</option>
                  <option value="creator">Creator</option>
                  <option value="hustler">Provider</option>
                </select>
                <input 
                  type="text" 
                  value={interestsText}
                  onChange={(e) => setInterestsText(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
                  placeholder="Interests (comma sep)"
                />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-row gap-3">
                <input 
                  type="text" 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
                  placeholder="Short bio"
                />
                <input 
                  type="text" 
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
                  placeholder="Profession"
                />
              </motion.div>
            )}
          </div>

          {/* Action Section */}
          <div className="shrink-0 w-full sm:w-auto flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0">
            <div className="text-xs font-medium text-zinc-500 sm:hidden">
              {completionPercentage}% Complete
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleDismiss}
                className="p-2 hidden sm:flex bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/50 shrink-0"
              >
                <X size={16} />
              </button>
              <button 
                onClick={handleNextStep}
                disabled={isSubmitting || isValidating || (step === 1 && (!username || !dob || !!usernameError)) || (step === 2 && (!role || !interestsText))}
                className="px-5 py-2 sm:py-2.5 bg-white text-black text-sm font-medium rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[100px]"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : step === 3 ? (
                  <>Done <CheckCircle2 size={14} className="ml-1.5" /></>
                ) : (
                  <>Next <ChevronRight size={14} className="ml-1.5" /></>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
