"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <section className="soft-card max-w-2xl">
        <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">Application Error</p>
        <h1 className="mt-2 text-3xl font-semibold text-[--text-primary]">
          いまはこの画面を読み込めません
        </h1>
        <p className="mt-3 text-sm leading-7 text-[--text-secondary]">
          一時的な問題の可能性があります。再読み込みしても直らない場合は、Dashboard に戻って別の導線から開き直してください。
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-[--text-primary] px-4 py-2 text-sm font-medium text-white"
          >
            もう一度試す
          </button>
          <Link
            href="/"
            className="rounded-xl border border-[--border] px-4 py-2 text-sm text-[--text-secondary]"
          >
            Dashboard へ戻る
          </Link>
        </div>
      </section>
    </div>
  );
}
