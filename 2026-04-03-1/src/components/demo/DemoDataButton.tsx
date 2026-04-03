"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { DatabaseZap, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  clearDemoDataAction,
  seedDemoDataAction,
  type DemoSeedFormState,
} from "@/lib/actions/demo";
import { cn } from "@/lib/utils";

const initialState: DemoSeedFormState = {
  status: "idle",
  message: "",
  stamp: 0,
};

function ActionButton({
  icon,
  label,
  pendingLabel,
  variant,
  compact = false,
}: {
  icon: ReactNode;
  label: string;
  pendingLabel: string;
  variant: "primary" | "danger";
  compact?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition",
        pending && "cursor-wait opacity-70",
        variant === "primary" &&
          (compact
            ? "border border-[--border] bg-white text-[--text-primary] hover:bg-[--bg-secondary]"
            : "bg-[--accent-blue] text-white hover:opacity-90"),
        variant === "danger" &&
          (compact
            ? "border border-[--border] bg-white text-[--accent-coral] hover:bg-[--status-blocked]"
            : "bg-[--status-blocked] text-[--accent-coral] hover:opacity-90")
      )}
    >
      {icon}
      {pending ? pendingLabel : label}
    </button>
  );
}

export function DemoDataButton({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const [seedState, seedAction] = useFormState(seedDemoDataAction, initialState);
  const [clearState, clearAction] = useFormState(clearDemoDataAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (seedState.status === "success" || clearState.status === "success") {
      router.refresh();
    }
  }, [router, seedState.status, clearState.status]);

  const activeState = clearState.stamp > seedState.stamp ? clearState : seedState;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2">
        <form action={seedAction}>
          <ActionButton
            icon={<DatabaseZap size={16} />}
            label="デモデータを入れる"
            pendingLabel="追加中..."
            variant="primary"
            compact={compact}
          />
        </form>
        <form action={clearAction}>
          <ActionButton
            icon={<Trash2 size={16} />}
            label="デモデータを削除"
            pendingLabel="削除中..."
            variant="danger"
            compact={compact}
          />
        </form>
      </div>

      {activeState.message ? (
        <p
          className={cn(
            "text-sm",
            activeState.status === "error"
              ? "text-[--accent-coral]"
              : activeState.status === "success"
                ? "text-[--accent-teal]"
                : "text-[--text-secondary]"
          )}
        >
          {activeState.message}
        </p>
      ) : null}
    </div>
  );
}
