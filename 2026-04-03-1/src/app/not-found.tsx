import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <section className="soft-card max-w-2xl">
        <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">404</p>
        <h1 className="mt-2 text-3xl font-semibold text-[--text-primary]">
          このページは見つかりませんでした
        </h1>
        <p className="mt-3 text-sm leading-7 text-[--text-secondary]">
          URL が変わったか、まだ存在しないページを開こうとした可能性があります。Dashboard か Projects に戻ると作業を再開しやすいです。
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-xl bg-[--text-primary] px-4 py-2 text-sm font-medium text-white"
          >
            Dashboard へ戻る
          </Link>
          <Link
            href="/projects"
            className="rounded-xl border border-[--border] px-4 py-2 text-sm text-[--text-secondary]"
          >
            Projects を開く
          </Link>
        </div>
      </section>
    </div>
  );
}
