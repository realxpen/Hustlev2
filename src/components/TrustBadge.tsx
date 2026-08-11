import { motion } from "motion/react";
import { ShieldCheck, BadgeCheck, Zap, ShieldAlert, CheckCircle2 } from "lucide-react";

export type BadgeType = "verified" | "trusted_hustler" | "secure_transaction" | "escrow_protected" | "milestone_success";

interface TrustBadgeProps {
  type: BadgeType;
  size?: "xs" | "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

export default function TrustBadge({ type, size = "sm", showLabel = true, className = "" }: TrustBadgeProps) {
  const getBadgeConfig = () => {
    switch (type) {
      case "verified":
        return {
          icon: <BadgeCheck size={size === "xs" ? 10 : size === "sm" ? 12 : 14} className="text-blue-400" />,
          label: "Identity Verified",
          colors: "bg-blue-500/10 border-blue-500/20 text-blue-400"
        };
      case "trusted_hustler":
        return {
          icon: <Zap size={size === "xs" ? 10 : size === "sm" ? 12 : 14} className="text-orange-400" />,
          label: "Trusted Hustler",
          colors: "bg-orange-500/10 border-orange-500/20 text-orange-400"
        };
      case "secure_transaction":
        return {
          icon: <ShieldCheck size={size === "xs" ? 10 : size === "sm" ? 12 : 14} className="text-green-400" />,
          label: "Encrypted Payment",
          colors: "bg-green-500/10 border-green-500/20 text-green-400"
        };
      case "escrow_protected":
        return {
          icon: <ShieldCheck size={size === "xs" ? 10 : size === "sm" ? 12 : 14} className="text-blue-400" />,
          label: "Escrow Protected",
          colors: "bg-blue-500/10 border-blue-500/20 text-blue-400"
        };
      case "milestone_success":
        return {
          icon: <CheckCircle2 size={size === "xs" ? 10 : size === "sm" ? 12 : 14} className="text-green-400" />,
          label: "Payout Reliable",
          colors: "bg-green-500/10 border-green-500/20 text-green-400"
        };
      default:
        return {
          icon: <ShieldAlert size={size === "xs" ? 10 : size === "sm" ? 12 : 14} />,
          label: "Security Checked",
          colors: "bg-white/5 border-white/10 text-white/60"
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${config.colors} ${className}`}>
      {config.icon}
      {showLabel && (
        <span className={`font-black uppercase tracking-widest ${size === "xs" ? "text-[7px]" : "text-[8px]"}`}>
          {config.label}
        </span>
      )}
    </div>
  );
}
