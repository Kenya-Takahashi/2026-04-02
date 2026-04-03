import type { Metadata } from "next";

import "./globals.css";

const appBaseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appBaseUrl),
  title: {
    default: "Research Flow",
    template: "%s | Research Flow",
  },
  description:
    "Research Flow is a workspace that connects Inbox, Projects, Notes, Sprint, and Review to reduce research overhead.",
  applicationName: "Research Flow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-[--bg-primary] text-[--text-primary] antialiased">
        {children}
      </body>
    </html>
  );
}
