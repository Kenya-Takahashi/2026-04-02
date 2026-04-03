"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import { createSprintFormAction, type SprintFormState } from "@/lib/actions/sprints";
import { FeedbackMessage } from "@/components/ui/FeedbackMessage";

const initialState: SprintFormState = {
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
      {pending ? "作成中..." : "スプリントを作成"}
    </button>
  );
}

export function SprintCreateForm({
  defaultStartDate,
  defaultEndDate,
}: {
  defaultStartDate: string;
  defaultEndDate: string;
}) {
  const [state, formAction] = useFormState(createSprintFormAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <section className="soft-card">
      <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">New Sprint</p>
      <h3 className="mt-2 text-xl font-semibold text-[--text-primary]">今週のスプリントを作る</h3>
      <p className="mt-2 text-sm leading-7 text-[--text-secondary]">
        goal と期間を決めて、必要ならそのまま active にできます。進行中の sprint は同時に 1 本までです。
      </p>

      <form action={formAction} className="mt-5 grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-[--text-primary]">スプリント名</span>
          <input
            name="name"
            placeholder="例: 4月第1週 リサーチ整理"
            className="rounded-2xl border border-[--border] bg-[--bg-primary] px-4 py-3 text-sm text-[--text-primary] outline-none placeholder:text-[--text-tertiary] focus:border-[--accent-blue]"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[--text-primary]">開始日</span>
            <input
              type="date"
              name="startDate"
              defaultValue={defaultStartDate}
              className="rounded-2xl border border-[--border] bg-[--bg-primary] px-4 py-3 text-sm text-[--text-primary] outline-none focus:border-[--accent-blue]"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[--text-primary]">終了日</span>
            <input
              type="date"
              name="endDate"
              defaultValue={defaultEndDate}
              className="rounded-2xl border border-[--border] bg-[--bg-primary] px-4 py-3 text-sm text-[--text-primary] outline-none focus:border-[--accent-blue]"
            />
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-[--text-primary]">ゴール</span>
          <textarea
            name="goal"
            rows={3}
            placeholder="この週で終えたいことを一言で"
            className="rounded-2xl border border-[--border] bg-[--bg-primary] px-4 py-3 text-sm text-[--text-primary] outline-none placeholder:text-[--text-tertiary] focus:border-[--accent-blue]"
          />
        </label>

        <label className="flex items-center gap-3 text-sm text-[--text-secondary]">
          <input type="checkbox" name="startNow" className="h-4 w-4" />
          作成後すぐに active にする
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FeedbackMessage
            status={state.status === "idle" ? "info" : state.status}
            message={state.message || "planning に置いておき、後から active に切り替えることもできます。"}
          />
          <SubmitButton />
        </div>
      </form>
    </section>
  );
}
