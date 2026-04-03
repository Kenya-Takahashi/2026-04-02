import type { ReactNode } from "react";

export function Header({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-[--border] pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-sm text-[--text-tertiary]">Research Flow</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight text-[--text-primary]">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[--text-secondary]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
