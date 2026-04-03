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

export function MobileNav({ user }: { user: User }) {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-30 -mx-4 mb-6 border-b border-[--border] bg-white/90 px-4 py-3 backdrop-blur lg:hidden sm:-mx-6 sm:px-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[--text-primary]">
            {user.name?.trim() || user.email}
          </p>
          <p className="truncate text-xs text-[--text-secondary]">{user.email}</p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full border border-[--border] px-3 py-2 text-xs text-[--text-secondary]"
          >
            <LogOut size={12} />
            ログアウト
          </button>
        </form>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm transition",
                active
                  ? "border-[--accent-blue] bg-[--status-progress] text-[--text-primary]"
                  : "border-[--border] bg-white text-[--text-secondary]"
              )}
            >
              <Icon size={14} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
