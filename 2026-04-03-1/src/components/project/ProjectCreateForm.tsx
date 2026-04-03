"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createProject } from "@/lib/actions/tasks";
import { FeedbackMessage } from "@/components/ui/FeedbackMessage";
import { cn } from "@/lib/utils";

export function ProjectCreateForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  return (
    <form
      ref={formRef}
      action={(formData) => {
        const name = String(formData.get("name") ?? "");
        const description = String(formData.get("description") ?? "");

        setStatus("pending");
        setMessage("プロジェクトを作成しています...");

        startTransition(async () => {
          try {
            await createProject({ name, description });
            formRef.current?.reset();
            setStatus("success");
            setMessage("プロジェクトを作成しました。");
            router.refresh();
          } catch (error) {
            setStatus("error");
            setMessage(error instanceof Error ? error.message : "プロジェクトの作成に失敗しました。");
          }
        });
      }}
      className="mt-5 space-y-3"
    >
      <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_auto]">
        <input
          name="name"
          placeholder="例: 文献レビュー基盤づくり"
          className="rounded-2xl border border-[--border] bg-[--bg-primary] px-4 py-3 text-sm text-[--text-primary] outline-none placeholder:text-[--text-tertiary] focus:border-[--accent-blue]"
        />
        <input
          name="description"
          placeholder="補足説明や今回の狙い"
          className="rounded-2xl border border-[--border] bg-[--bg-primary] px-4 py-3 text-sm text-[--text-primary] outline-none placeholder:text-[--text-tertiary] focus:border-[--accent-blue]"
        />
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "rounded-2xl px-5 py-3 text-sm font-medium text-white transition",
            isPending ? "cursor-wait bg-[--text-secondary]" : "bg-[--text-primary] hover:bg-black"
          )}
        >
          {isPending ? "作成中..." : "作成"}
        </button>
      </div>

      <FeedbackMessage status={status} message={message} />
    </form>
  );
}
