import { AlertCircle, CheckCircle2, Loader2, Info } from "lucide-react";

import { cn } from "@/lib/utils";

type FeedbackStatus = "idle" | "pending" | "success" | "error" | "info";

const ICONS = {
  pending: Loader2,
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const;

export function FeedbackMessage({
  status,
  message,
  compact = false,
}: {
  status: FeedbackStatus;
  message?: string;
  compact?: boolean;
}) {
  if (status === "idle" || !message) {
    return null;
  }

  const Icon = ICONS[status === "pending" ? "pending" : status];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm",
        compact ? "rounded-full px-3 py-1.5 text-xs" : "",
        status === "pending" && "bg-[--bg-secondary] text-[--text-secondary]",
        status === "success" && "bg-[--status-done] text-[--accent-teal]",
        status === "error" && "bg-[--status-blocked] text-[--accent-coral]",
        status === "info" && "bg-[--status-progress] text-[--accent-blue]"
      )}
    >
      <Icon size={compact ? 14 : 16} className={cn(status === "pending" && "animate-spin")} />
      <span>{message}</span>
    </div>
  );
}
