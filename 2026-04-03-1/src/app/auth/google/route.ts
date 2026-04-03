import { NextRequest, NextResponse } from "next/server";

import {
  buildLoginPath,
  createOAuthState,
  getGoogleOAuthCallbackUrl,
  isGoogleOAuthConfigured,
  normalizeReturnTo,
  storeOAuthFlow,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  const returnTo = normalizeReturnTo(request.nextUrl.searchParams.get("returnTo"));

  if (!isGoogleOAuthConfigured()) {
    const loginPath = buildLoginPath({
      error: "oauth_config_missing",
      returnTo,
    });

    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  const state = createOAuthState();
  storeOAuthFlow({ state, returnTo });

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: getGoogleOAuthCallbackUrl(),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
