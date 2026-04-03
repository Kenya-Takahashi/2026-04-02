import { headers } from "next/headers";

import { QuickCapture } from "@/components/focus/QuickCapture";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { requireUser } from "@/lib/auth";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const returnTo = headers().get("x-return-to") ?? "/";
  const user = await requireUser(returnTo);

  return (
    <>
      <div className="flex min-h-screen">
        <Sidebar user={user} />
        <main className="min-w-0 flex-1">
          <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pt-6">
            <MobileNav user={user} />
            {children}
          </div>
        </main>
      </div>
      <QuickCapture />
    </>
  );
}
