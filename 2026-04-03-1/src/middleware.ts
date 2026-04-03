import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getAppBasePath, stripAppBasePath, withAppBasePath } from "@/lib/app-paths";

const SESSION_COOKIE_NAME = "research_flow_session";

function buildReturnTo(request: NextRequest) {
  const { pathname, search } = new URL(request.url);
  return `${pathname}${search}`;
}

function isPublicPath(pathname: string) {
  const stripped = stripAppBasePath(pathname);

  return (
    stripped === "/login" ||
    stripped === "/healthz" ||
    stripped.startsWith("/auth/google") ||
    stripped.startsWith("/auth/clear-invalid-session") ||
    stripped === "/favicon.ico"
  );
}

function buildLoginUrl(request: NextRequest) {
  const url = new URL(withAppBasePath("/login"), request.url);
  url.search = "";
  const returnTo = buildReturnTo(request);
  const defaultReturnTo = withAppBasePath("/");

  if (returnTo !== defaultReturnTo) {
    url.searchParams.set("returnTo", returnTo);
  }

  return url;
}

export function middleware(request: NextRequest) {
  const basePath = getAppBasePath();
  const pathname = new URL(request.url).pathname;

  if (basePath && pathname !== basePath && !pathname.startsWith(`${basePath}/`)) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname) || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return NextResponse.redirect(buildLoginUrl(request));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-return-to", buildReturnTo(request));

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/:path*"],
};
