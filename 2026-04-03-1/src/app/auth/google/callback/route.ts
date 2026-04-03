import { NextRequest, NextResponse } from "next/server";

import {
  buildLoginPath,
  consumeOAuthFlow,
  createSession,
  getGoogleOAuthCallbackUrl,
  isGoogleOAuthConfigured,
  normalizeReturnTo,
  upsertGoogleUser,
} from "@/lib/auth";

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
};

type GoogleProfile = {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
};

function redirectToLogin(request: NextRequest, error: string, returnTo = "/") {
  const loginPath = buildLoginPath({
    error,
    returnTo,
  });

  return NextResponse.redirect(new URL(loginPath, request.url));
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const flow = consumeOAuthFlow();
  const returnTo = normalizeReturnTo(flow?.returnTo ?? url.searchParams.get("returnTo"));

  if (!isGoogleOAuthConfigured()) {
    return redirectToLogin(request, "oauth_config_missing", returnTo);
  }

  if (error) {
    return redirectToLogin(request, error, returnTo);
  }

  if (!code || !state || !flow || state !== flow.state) {
    return redirectToLogin(request, "invalid_state", returnTo);
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: getGoogleOAuthCallbackUrl(),
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });

  if (!tokenResponse.ok) {
    return redirectToLogin(request, "oauth_exchange_failed", returnTo);
  }

  const tokens = (await tokenResponse.json()) as GoogleTokenResponse;

  if (!tokens.access_token) {
    return redirectToLogin(request, "oauth_exchange_failed", returnTo);
  }

  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
    },
    cache: "no-store",
  });

  if (!profileResponse.ok) {
    return redirectToLogin(request, "oauth_profile_failed", returnTo);
  }

  const profile = (await profileResponse.json()) as GoogleProfile;

  if (!profile.sub || !profile.email) {
    return redirectToLogin(request, "oauth_profile_failed", returnTo);
  }

  try {
    const user = upsertGoogleUser({
      providerAccountId: profile.sub,
      email: profile.email,
      name: profile.name ?? null,
      image: profile.picture ?? null,
    });

    await createSession(user.id);

    return NextResponse.redirect(new URL(returnTo, request.url));
  } catch {
    return redirectToLogin(request, "session_error", returnTo);
  }
}
