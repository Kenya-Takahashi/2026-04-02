import { NextRequest, NextResponse } from "next/server";

import { buildLoginPath, clearSessionCookie, normalizeReturnTo } from "@/lib/auth";

export async function GET(request: NextRequest) {
  clearSessionCookie();

  const returnTo = normalizeReturnTo(request.nextUrl.searchParams.get("returnTo"));
  const loginPath = buildLoginPath({
    error: "invalid_session",
    returnTo,
  });

  return NextResponse.redirect(new URL(loginPath, request.url));
}
