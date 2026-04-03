"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import { createNoteFromListAction, type NoteFormState } from "@/lib/actions/notes";
import { FeedbackMessage } from "@/components/ui/FeedbackMessage";

const initialState: NoteFormState = {
  status: "idle",
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-[--text-primary] px-4 py-2 text-sm font-medium text-white transition hover:bg-black disabled:cursor-wait disabled:bg-[--text-secondary]"
    >
      {pending ? "作成中..." : "新しいメモを作成"}
    </button>
  );
}

export function NoteCreateForm() {
  const [state, formAction] = useFormState(createNoteFromListAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success" && state.noteId) {
      router.push(`/notes/${state.noteId}`);
    }
  }, [router, state.noteId, state.status]);

  return (
    <section className="soft-card">
      <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">New Note</p>
      <h3 className="mt-2 text-xl font-semibold text-[--text-primary]">まずは一枚、文脈を残す</h3>
      <form action={formAction} className="mt-5 grid gap-3">
        <input
          name="title"
          placeholder="例: 比較手法のたたき台"
          className="rounded-2xl border border-[--border] bg-[--bg-primary] px-4 py-3 text-sm text-[--text-primary] outline-none placeholder:text-[--text-tertiary] focus:border-[--accent-blue]"
        />
        <input
          name="tags"
          placeholder="タグをカンマ区切りで入力"
          className="rounded-2xl border border-[--border] bg-[--bg-primary] px-4 py-3 text-sm text-[--text-primary] outline-none placeholder:text-[--text-tertiary] focus:border-[--accent-blue]"
        />
        <textarea
          name="content"
          rows={5}
          placeholder="研究中の気づき、仮説、引用したい文などをここに残す"
          className="rounded-2xl border border-[--border] bg-[--bg-primary] px-4 py-3 text-sm text-[--text-primary] outline-none placeholder:text-[--text-tertiary] focus:border-[--accent-blue]"
        />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm text-[--text-secondary]">
              `[[既存タイトル]]` でノート間リンクをつなげられます。
            </p>
            <FeedbackMessage
              status={state.status === "idle" ? "info" : state.status}
              message={state.message || "保存すると Notes 一覧にもすぐ反映されます。"}
            />
          </div>
          <SubmitButton />
        </div>
      </form>
    </section>
  );
}
