"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookMarked,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  LogOut,
  NotebookPen,
  RefreshCw,
} from "lucide-react";

import { logoutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/sprint", label: "Sprint", icon: BookMarked },
  { href: "/notes", label: "Notes", icon: NotebookPen },
  { href: "/review", label: "Review", icon: RefreshCw },
];

function displayName(user: User) {
  return user.name?.trim() || user.email;
}

export function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-[--border] bg-[--bg-secondary] px-4 py-6 lg:block">
      <div className="px-2">
        <p className="text-xs uppercase tracking-[0.3em] text-[--text-tertiary]">Research Flow</p>
        <h1 className="mt-2 text-xl font-semibold text-[--text-primary]">
          研究の流れをほどよく整える
        </h1>
      </div>

      <nav className="mt-8 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-white text-[--text-primary] shadow-card"
                  : "text-[--text-secondary] hover:bg-white/70 hover:text-[--text-primary]"
              )}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <form action={logoutAction} className="mt-3">
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[--border] bg-white px-4 py-2.5 text-sm text-[--text-secondary] transition hover:bg-[--bg-secondary] hover:text-[--text-primary]"
        >
          <LogOut size={14} />
          ログアウト
        </button>
      </form>

      <div className="mt-8 rounded-2xl border border-dashed border-[--border] bg-white/80 p-4 text-sm text-[--text-secondary]">
        <p className="font-medium text-[--text-primary]">Phase 8</p>
        <p className="mt-1 leading-6">
          Google ログインとユーザー分離に加えて、`/research-flow`
          のサブパス配置にも対応しています。
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-[--border] bg-white p-4 shadow-card">
        <p className="text-xs uppercase tracking-[0.2em] text-[--text-tertiary]">Signed In</p>
        <p className="mt-2 text-sm font-medium text-[--text-primary]">{displayName(user)}</p>
        <p className="mt-1 text-xs text-[--text-secondary]">{user.email}</p>
      </div>
    </aside>
  );
}
