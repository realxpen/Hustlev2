import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "../features/auth";
import { useAuthStore } from "../features/auth/stores/useAuthStore";

interface AuthScreenProps {
  onLogin: () => void;
  key?: string;
}

type AuthView = "gate" | "login" | "signup" | "forgot" | "forgot-sent" | "update-password";

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  const [view, setView] = useState<AuthView>("gate");
  const { signIn, signUp, isLoading, error, session, isRecoveryMode, resetPassword, updatePassword, setRecoveryMode } = useAuth();
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  // Local error (for clearing on view change)
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (isRecoveryMode) {
      setView("update-password");
    }
  }, [isRecoveryMode]);

  // If session is naturally detected, continue to login.
  useEffect(() => {
    if (session && !isRecoveryMode) {
      onLogin();
    }
  }, [session, isRecoveryMode, onLogin]);

  const handleLogin = async () => {
    try {
      setLocalError(null);
      await signIn({ email, password });
      onLogin();
    } catch (err: any) {
      setLocalError(err.message || "Failed to sign in");
    }
  };

  const handleSignup = async () => {
    try {
      setLocalError(null);
      await signUp({ 
        email, 
        password,
        options: {
          data: { full_name: fullName }
        }
      });
      onLogin();
    } catch (err: any) {
      setLocalError(err.message || "Failed to sign up");
    }
  };

  const handleResetPassword = async () => {
    try {
      setLocalError(null);
      if (!email) {
        throw new Error("Please enter your email address");
      }
      await resetPassword(email);
      setView("forgot-sent");
    } catch (err: any) {
      setLocalError(err.message || "Failed to send reset link");
    }
  };

  const handleUpdatePassword = async () => {
    try {
      setLocalError(null);
      if (!newPassword || newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }
      await updatePassword(newPassword);
      setRecoveryMode(false);
      onLogin();
    } catch (err: any) {
      setLocalError(err.message || "Failed to update password");
    }
  };

  // Switch view helper, clears state
  const goToView = (v: AuthView) => {
    setView(v);
    setLocalError(null);
    setEmail("");
    setPassword("");
    setFullName("");
    setNewPassword("");
  };

  // Reusable components
  const BackButton = () => (
    <div className="mb-6 -ml-2">
      <button
        type="button"
        onClick={() => goToView("gate")}
        className="p-2 text-white/50 hover:text-white transition-colors cursor-pointer relative z-20"
      >
        <ChevronLeft size={24} strokeWidth={1.5} />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden flex flex-col items-center justify-center p-6 text-white" id="auth-screen">
      {/* Immersive UI Overlays */}
      <div className="grain-overlay" />
      <div className="absolute inset-10 border border-white/[0.03] pointer-events-none hidden md:block" />

      {/* Background glow specific to auth */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] h-[400px] bg-white/[0.02] blur-[100px] rounded-full pointer-events-none" />

      <AnimatePresence mode="wait">
        {/* GATE VIEW */}
        {view === "gate" && (
          <motion.div
            key="gate"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm flex flex-col items-center relative z-10"
          >
            <h1 className="text-4xl font-display font-black tracking-[0.2em] mb-4">HUSTLE</h1>
            <p className="text-white/60 text-sm mb-12 font-light tracking-wide text-center">
              Step into the economy of real people
            </p>

            <div className="w-full flex flex-col gap-3">
              <button 
                type="button"
                className="w-full h-14 bg-white text-black rounded-xl font-medium flex items-center justify-center gap-3 hover:bg-white/90 transition-colors active:scale-[0.98] relative opacity-50 cursor-not-allowed"
                disabled
              >
                <div className="absolute left-6">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
                </div>
                <span>Continue with Google</span>
              </button>
              
              <button 
                type="button"
                className="w-full h-14 bg-transparent border border-white/20 text-white rounded-xl font-medium flex items-center justify-center gap-3 hover:bg-white/5 transition-colors active:scale-[0.98] relative opacity-50 cursor-not-allowed"
                disabled
              >
                <div className="absolute left-6">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.05 20.28c-.96 1.39-1.96 2.76-3.48 2.79-1.47.03-1.94-.87-3.63-.87-1.69 0-2.22.86-3.61.91-1.47.05-2.61-1.49-3.58-2.89-1.97-2.84-3.47-8.03-1.44-11.55 1-1.74 2.8-2.85 4.75-2.88 1.48-.03 2.88.99 3.79.99h.2c.9-.99 2.16-1.87 3.52-1.74 1.42.06 2.73.57 3.65 1.5-3.32 2.78-2.8 8.16.89 11.75M12.03 4.72c-.14-1.67.62-3.33 1.76-4.5h.14c1.69.14 3.16 1.44 3.44 3.16 0 .09 0 .17-.02.26-1.57.14-3.32-.23-4.46-1.2h-.14"/></svg>
                </div>
                <span>Continue with Apple</span>
              </button>

              <button 
                onClick={() => goToView("login")}
                className="w-full h-14 bg-transparent border border-white/10 text-white/80 rounded-xl font-medium flex items-center justify-center gap-3 hover:bg-white/5 transition-colors mt-2 active:scale-[0.98] relative"
              >
                <div className="absolute left-6">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
                </div>
                <span>Continue with Email</span>
              </button>

              <button 
                onClick={() => {
                  useAuthStore.getState().loginAsGuest();
                  onLogin();
                }}
                className="w-full h-14 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl font-medium flex items-center justify-center gap-3 hover:from-emerald-500/35 hover:to-teal-500/35 transition-colors mt-2 active:scale-[0.98] relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative z-10 flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-emerald-400 animate-pulse"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" /></svg>
                  Explore in Offline Demo Mode <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-200 uppercase font-bold">Fast</span>
                </span>
              </button>
            </div>

            <button 
              onClick={() => goToView("signup")}
              className="mt-8 text-sm text-white/40 hover:text-white transition-colors"
            >
              Don't have an account? Sign up
            </button>
            
            <p className="mt-auto pt-12 pb-4 text-[10px] text-white/20 uppercase tracking-widest text-center px-8">
              By continuing, you agree to our Terms
            </p>
          </motion.div>
        )}

        {/* LOGIN VIEW */}
        {view === "login" && (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm flex flex-col relative z-10"
          >
            <BackButton />
            <h2 className="text-2xl font-display font-bold mb-2">Welcome back</h2>
            <p className="text-white/40 text-sm mb-8 font-light">Enter your details to sign in.</p>

            {(localError || error) && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-4 rounded-lg mb-4 text-center">
                <p className="font-semibold mb-2">{localError || error}</p>
                <div className="border-t border-red-500/10 my-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      useAuthStore.getState().loginAsGuest();
                      onLogin();
                    }}
                    className="w-full py-2 bg-emerald-500 text-black hover:bg-emerald-400 font-bold text-xs uppercase tracking-wider rounded transition-colors active:scale-[0.98] cursor-pointer relative z-30"
                  >
                    Enter Offline Demo Mode
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email" 
                className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-white/30 focus:border-white/30 focus:bg-white/10 outline-none transition-all"
              />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password" 
                className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-white/30 focus:border-white/30 focus:bg-white/10 outline-none transition-all"
              />
              
              <div className="flex justify-end">
                <button 
                  onClick={() => goToView("forgot")}
                  className="text-xs text-white/40 hover:text-white transition-colors cursor-pointer relative z-20"
                >
                  Forgot password?
                </button>
              </div>

              <button 
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full h-14 bg-white text-black mt-2 rounded-xl font-medium hover:bg-white/90 transition-colors active:scale-[0.98] disabled:opacity-50 relative z-20 cursor-pointer"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </div>

            <div className="mt-8 text-center relative z-20">
              <span className="text-white/40 text-sm">Don't have an account? </span>
              <button 
                onClick={() => goToView("signup")}
                className="text-white text-sm font-medium hover:underline cursor-pointer"
              >
                Create one
              </button>
            </div>
          </motion.div>
        )}

        {/* SIGNUP VIEW */}
        {view === "signup" && (
          <motion.div
            key="signup"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm flex flex-col relative z-10"
          >
            <BackButton />
            <h2 className="text-2xl font-display font-bold mb-2">Create account</h2>
            <p className="text-white/40 text-sm mb-8 font-light">Join the Hustle marketplace.</p>

            {(localError || error) && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-4 rounded-lg mb-4 text-center">
                <p className="font-semibold mb-2">{localError || error}</p>
                <div className="border-t border-red-500/10 my-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      useAuthStore.getState().loginAsGuest();
                      onLogin();
                    }}
                    className="w-full py-2 bg-emerald-500 text-black hover:bg-emerald-400 font-bold text-xs uppercase tracking-wider rounded transition-colors active:scale-[0.98] cursor-pointer relative z-30"
                  >
                    Enter Offline Demo Mode
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name (optional)" 
                className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-white/30 focus:border-white/30 focus:bg-white/10 outline-none transition-all"
              />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email" 
                className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-white/30 focus:border-white/30 focus:bg-white/10 outline-none transition-all"
              />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password" 
                className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-white/30 focus:border-white/30 focus:bg-white/10 outline-none transition-all"
              />

              <button 
                onClick={handleSignup}
                disabled={isLoading}
                className="w-full h-14 bg-white text-black mt-4 rounded-xl font-medium hover:bg-white/90 transition-colors active:scale-[0.98] disabled:opacity-50 relative z-20 cursor-pointer"
              >
                {isLoading ? "Creating..." : "Create account"}
              </button>
            </div>
          </motion.div>
        )}

        {/* FORGOT PASSWORD VIEW */}
        {view === "forgot" && (
          <motion.div
            key="forgot"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm flex flex-col relative z-10"
          >
            <BackButton />
            <h2 className="text-2xl font-display font-bold mb-2">Reset password</h2>
            <p className="text-white/40 text-sm mb-8 font-light">Enter your email to receive a recovery link.</p>

            {localError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg mb-4">
                {localError}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address" 
                className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-white/30 focus:border-white/30 focus:bg-white/10 outline-none transition-all"
              />

              <button 
                onClick={handleResetPassword}
                disabled={isLoading}
                className="w-full h-14 bg-white text-black mt-2 rounded-xl font-medium hover:bg-white/90 transition-colors active:scale-[0.98] relative z-20 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? "Sending..." : "Send recovery link"}
              </button>
            </div>
          </motion.div>
        )}

        {/* FORGOT PASSWORD SENT VIEW */}
        {view === "forgot-sent" && (
          <motion.div
            key="forgot-sent"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm flex flex-col items-center text-center relative z-10"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
            </div>
            
            <h2 className="text-2xl font-display font-bold mb-2">Check your inbox</h2>
            <p className="text-white/60 text-sm mb-8 font-light">
              We've sent a recovery link. Tap it to securely log back in and set a brand-new password.
            </p>

            <button 
              onClick={() => goToView("gate")}
              className="w-full h-14 border border-white/20 text-white rounded-xl font-medium hover:bg-white/5 transition-colors active:scale-[0.98] relative z-20 cursor-pointer"
            >
              Back to entry
            </button>
          </motion.div>
        )}

        {/* UPDATE PASSWORD VIEW */}
        {view === "update-password" && (
          <motion.div
            key="update-password"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm flex flex-col relative z-10"
          >
            <h2 className="text-2xl font-display font-bold mb-2">Create new password</h2>
            <p className="text-white/40 text-sm mb-8 font-light">Set a secure password for your Hustle account.</p>

            {localError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg mb-4">
                {localError}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password" 
                className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-white/30 focus:border-white/30 focus:bg-white/10 outline-none transition-all"
              />

              <button 
                onClick={handleUpdatePassword}
                disabled={isLoading}
                className="w-full h-14 bg-white text-black mt-2 rounded-xl font-medium hover:bg-white/90 transition-colors active:scale-[0.98] relative z-20 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? "Updating..." : "Update password"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
