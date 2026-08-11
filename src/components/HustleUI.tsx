import React from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'motion/react';
import { cn } from '../lib/utils';
import { Search, X, Loader2, ChevronRight, MoreHorizontal } from 'lucide-react';

// --- Button System ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'cta';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-2xl font-black uppercase tracking-widest transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary: "bg-white text-black hover:bg-zinc-200 shadow-xl",
      secondary: "bg-white/5 border border-white/10 text-white hover:bg-white/10",
      ghost: "bg-transparent text-white/60 hover:text-white hover:bg-white/5",
      destructive: "bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white",
      cta: "bg-brand-primary text-white shadow-glow-red hover:brightness-110"
    };

    const sizes = {
      sm: "h-10 px-4 text-[9px]",
      md: "h-14 px-8 text-[11px]",
      lg: "h-16 px-10 text-[13px]",
      icon: "h-12 w-12 p-0 rounded-full"
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <>
            {leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

// --- Input System ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 px-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full bg-surface-card border border-surface-border rounded-2xl px-5 h-14 text-sm font-bold text-white placeholder:text-white/10 focus:outline-none focus:border-brand-primary/50 transition-all",
            error && "border-red-500/50",
            className
          )}
          {...props}
        />
        {error && <p className="text-[10px] font-bold text-red-500 px-1">{error}</p>}
      </div>
    );
  }
);

// --- Search Input ---
export const SearchInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative w-full group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-primary transition-colors" size={18} />
        <input
          ref={ref}
          className={cn(
            "w-full bg-white/5 backdrop-blur-xl border border-white/5 rounded-full pl-14 pr-6 h-14 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:bg-white/10 focus:border-white/10 transition-all",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

// --- Card System ---
interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'elevated' | 'glass' | 'outline';
  isHoverable?: boolean;
}

export const Card = ({ variant = 'elevated', isHoverable = true, className, children, ...props }: CardProps) => {
  const variants = {
    elevated: "bg-surface-card border border-surface-border shadow-premium",
    glass: "glass-light",
    outline: "bg-transparent border border-white/5"
  };

  return (
    <motion.div
      whileHover={isHoverable ? { y: -4, scale: 1.01 } : {}}
      className={cn(
        "rounded-[2.5rem] overflow-hidden transition-shadow",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// --- Bottom Sheet System ---
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const BottomSheet = ({ isOpen, onClose, title, children }: BottomSheetProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-xl bg-surface-bg border-t border-surface-border rounded-t-[3rem] p-8 max-h-[85vh] overflow-y-auto"
          >
            {/* Drag Handle */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/10 rounded-full" />
            
            {title && (
              <div className="flex items-center justify-between mb-8 mt-2">
                <h3 className="text-xl font-black font-display tracking-tight">{title}</h3>
                <button 
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            )}
            
            <div className="pb-12">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// --- Chips & Badges ---
export const Chip = ({ label, active, onClick, icon: Icon }: { label: string, active?: boolean, onClick?: () => void, icon?: any }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 flex items-center gap-2",
      active 
        ? "bg-brand-primary border-brand-primary text-white shadow-glow-red" 
        : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20"
    )}
  >
    {Icon && <Icon size={12} />}
    {label}
  </button>
);

// --- Skeleton System ---
export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("bg-white/5 rounded-2xl shimmer", className)} />
);

// --- Toast / Notification ---
export const Toast = ({ message, type = 'success', isOpen, onClose }: { message: string, type?: 'success' | 'error' | 'info', isOpen: boolean, onClose?: () => void }) => {
  React.useEffect(() => {
    if (isOpen && onClose) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
          className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[2000] px-6 py-4 rounded-3xl glass border border-surface-border-bright shadow-premium flex items-center gap-4 whitespace-nowrap min-w-[280px]"
        >
          <div className={cn(
            "w-2.5 h-2.5 rounded-full shadow-lg",
            type === 'success' ? "bg-brand-success shadow-brand-success/20" : type === 'error' ? "bg-brand-primary shadow-brand-primary/20" : "bg-brand-info shadow-brand-info/20"
          )} />
          <span className="text-[11px] font-black uppercase tracking-widest leading-none text-white/90">{message}</span>
          <button onClick={onClose} className="ml-auto w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white transition-colors">
             <X size={12} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
