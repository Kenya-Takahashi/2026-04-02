"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Bolt, CornerDownLeft } from "lucide-react";

import { captureToInboxFormAction, type CaptureInboxFormState } from "@/lib/actions/inbox";
import { cn } from "@/lib/utils";
import { FeedbackMessage } from "@/components/ui/FeedbackMessage";

const initialCaptureInboxFormState: CaptureInboxFormState = {
  status: "idle",
  message: "",
  submissionKey: 0,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "rounded-xl px-4 py-2 text-sm font-medium text-white transition",
        pending ? "cursor-wait bg-[--text-secondary]" : "bg-[--text-primary] hover:bg-black"
      )}
    >
      {pending ? "追加中..." : "追加"}
    </button>
  );
}

export function QuickCapture() {
  const [state, formAction] = useFormState(
    captureToInboxFormAction,
    initialCaptureInboxFormState
  );
  const [flashMessage, setFlashMessage] = useState("");
  const [flashStatus, setFlashStatus] = useState<"idle" | "success" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }

      if (event.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (state.status === "idle" || !state.message) {
      return;
    }

    setFlashStatus(state.status);
    setFlashMessage(state.message);

    if (state.status === "success") {
      formRef.current?.reset();
      inputRef.current?.focus();
    }

    const timer = window.setTimeout(() => {
      setFlashMessage("");
      setFlashStatus("idle");
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [state]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4">
      <div className="pointer-events-auto w-full max-w-3xl">
        <form
          ref={formRef}
          action={formAction}
          className="flex items-center gap-3 rounded-2xl border border-[--border] bg-white/95 p-3 shadow-card backdrop-blur"
        >
          <input type="hidden" name="source" value="quick-capture" />
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[--bg-secondary] text-[--accent-blue]">
            <Bolt size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <label className="sr-only" htmlFor="quick-capture">
              クイックキャプチャ
            </label>
            <input
              ref={inputRef}
              id="quick-capture"
              name="content"
              placeholder="思いついたことをそのまま残す..."
              onChange={() => {
                if (flashMessage) {
                  setFlashMessage("");
                  setFlashStatus("idle");
                }
              }}
              className="w-full bg-transparent text-sm text-[--text-primary] outline-none placeholder:text-[--text-tertiary]"
            />
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-[--bg-secondary] px-3 py-1.5 text-xs text-[--text-secondary] md:flex">
            <span>Capture</span>
            <span className="flex items-center gap-1 text-[--text-primary]">
              <CornerDownLeft size={12} />
              Enter
            </span>
            <span className="text-[--text-tertiary]">/</span>
            <span className="text-[--text-primary]">Ctrl+Shift+K</span>
          </div>
          <SubmitButton />
        </form>

        <div aria-live="polite" className="mt-2 min-h-6 px-2 text-sm">
          <FeedbackMessage status={flashStatus} message={flashMessage} compact />
        </div>
      </div>
    </div>
  );
}
