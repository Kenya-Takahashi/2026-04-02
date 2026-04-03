import { NextResponse } from "next/server";

import { isGoogleOAuthConfigured } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    db.prepare("SELECT 1").get();

    return NextResponse.json(
      {
        status: "ok",
        service: "research-flow",
        oauthConfigured: isGoogleOAuthConfigured(),
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        service: "research-flow",
        oauthConfigured: isGoogleOAuthConfigured(),
        message: error instanceof Error ? error.message : "health check failed",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
