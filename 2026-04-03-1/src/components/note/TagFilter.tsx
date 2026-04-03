import Link from "next/link";

import { cn } from "@/lib/utils";
import type { TagSummary } from "@/types";

function buildTagHref(tag: string | null, query?: string, taskId?: string) {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  if (taskId) {
    params.set("taskId", taskId);
  }

  if (tag) {
    params.set("tag", tag);
  }

  const suffix = params.toString();
  return suffix ? `/notes?${suffix}` : "/notes";
}

export function TagFilter({
  tags,
  selectedTag,
  query,
  taskId,
}: {
  tags: TagSummary[];
  selectedTag?: string;
  query?: string;
  taskId?: string;
}) {
  return (
    <section className="soft-card">
      <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">Tags</p>
      <h3 className="mt-2 text-xl font-semibold text-[--text-primary]">タグで絞り込む</h3>
      <div className="mt-4 grid gap-2">
        <Link
          href={buildTagHref(null, query, taskId)}
          className={cn(
            "flex items-center justify-between rounded-2xl px-3 py-2 text-sm transition",
            !selectedTag
              ? "bg-[--text-primary] text-white"
              : "bg-[--bg-secondary] text-[--text-secondary] hover:bg-[--bg-tertiary]"
          )}
        >
          <span>すべてのタグ</span>
        </Link>
        {tags.length === 0 ? (
          <p className="rounded-2xl bg-[--bg-secondary] px-3 py-3 text-sm text-[--text-secondary]">
            まだタグがありません。
          </p>
        ) : (
          tags.map((tag) => (
            <Link
              key={tag.tag}
              href={buildTagHref(tag.tag, query, taskId)}
              className={cn(
                "flex items-center justify-between rounded-2xl px-3 py-2 text-sm transition",
                selectedTag === tag.tag
                  ? "bg-[--accent-blue] text-white"
                  : "bg-[--bg-secondary] text-[--text-secondary] hover:bg-[--bg-tertiary]"
              )}
            >
              <span>#{tag.tag}</span>
              <span>{tag.count}</span>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
