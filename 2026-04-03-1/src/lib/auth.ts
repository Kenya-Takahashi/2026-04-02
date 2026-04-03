import "server-only";

import { createHmac, randomBytes } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAppBasePath, normalizeReturnTo, withAppBasePath } from "@/lib/app-paths";
import { getDb } from "@/lib/db";
import type { OAuthAccount, Session, User } from "@/types";

const SESSION_COOKIE_NAME = "research_flow_session";
const OAUTH_FLOW_COOKIE_NAME = "research_flow_oauth_flow";
const SESSION_TTL_DAYS = 30;

type OAuthFlowPayload = {
  state: string;
  returnTo: string;
};

function getSessionSecret() {
  return process.env.SESSION_SECRET ?? "research-flow-development-secret";
}

function getCookieStore() {
  return cookies();
}

function toIsoDate(value: Date) {
  return value.toISOString().replace("T", " ").slice(0, 19);
}

function encodeFlowPayload(payload: OAuthFlowPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeFlowPayload(value: string): OAuthFlowPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<OAuthFlowPayload>;

    if (typeof parsed.state !== "string" || typeof parsed.returnTo !== "string") {
      return null;
    }

    return {
      state: parsed.state,
      returnTo: normalizeReturnTo(parsed.returnTo),
    };
  } catch {
    return null;
  }
}

function hashToken(token: string) {
  return createHmac("sha256", getSessionSecret()).update(token).digest("hex");
}

function getSessionExpiryDate() {
  const value = new Date();
  value.setDate(value.getDate() + SESSION_TTL_DAYS);
  return value;
}

function cleanupExpiredSessions() {
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
}

function deleteCookieSafely(name: string) {
  try {
    getCookieStore().delete(name);
  } catch {
    // Server Components may not allow mutation. Route handlers and actions will still clear it.
  }
}

export function getSessionCookieValue() {
  return getCookieStore().get(SESSION_COOKIE_NAME)?.value ?? null;
}

export function clearSessionCookie() {
  deleteCookieSafely(SESSION_COOKIE_NAME);
}

export function getMissingOAuthEnvVars() {
  const required = [
    "APP_BASE_URL",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "SESSION_SECRET",
  ] as const;

  return required.filter((key) => !process.env[key]);
}

export function isGoogleOAuthConfigured() {
  return getMissingOAuthEnvVars().length === 0;
}

export function getGoogleOAuthCallbackUrl() {
  if (!process.env.APP_BASE_URL) {
    throw new Error("APP_BASE_URL is required for Google OAuth.");
  }

  return new URL(withAppBasePath("/auth/google/callback"), process.env.APP_BASE_URL).toString();
}

export function buildLoginPath(options?: { error?: string; returnTo?: string }) {
  const params = new URLSearchParams();
  const error = options?.error?.trim();
  const returnTo = normalizeReturnTo(options?.returnTo);
  const defaultReturnTo = withAppBasePath("/");

  if (error) {
    params.set("error", error);
  }

  if (returnTo !== defaultReturnTo) {
    params.set("returnTo", returnTo);
  }

  const loginPath = withAppBasePath("/login");
  return params.size > 0 ? `${loginPath}?${params.toString()}` : loginPath;
}

export async function getCurrentUser(): Promise<User | null> {
  cleanupExpiredSessions();

  const sessionToken = getSessionCookieValue();

  if (!sessionToken) {
    return null;
  }

  const db = getDb();
  const session = db
    .prepare(
      `SELECT
         s.*,
         u.id AS user_id,
         u.email,
         u.name,
         u.image,
         u.created_at AS user_created_at,
         u.updated_at AS user_updated_at
       FROM sessions s
       INNER JOIN users u ON u.id = s.user_id
       WHERE s.session_token_hash = ?
         AND s.expires_at >= datetime('now')
       LIMIT 1`
    )
    .get(hashToken(sessionToken)) as
    | (Session & {
        user_id: string;
        email: string;
        name: string | null;
        image: string | null;
        user_created_at: string;
        user_updated_at: string;
      })
    | undefined;

  if (!session) {
    clearSessionCookie();
    return null;
  }

  return {
    id: session.user_id,
    email: session.email,
    name: session.name,
    image: session.image,
    created_at: session.user_created_at,
    updated_at: session.user_updated_at,
  };
}

export async function requireUser(returnTo = "/"): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    if (getSessionCookieValue()) {
      redirect(
        `${withAppBasePath("/auth/clear-invalid-session")}?returnTo=${encodeURIComponent(
          normalizeReturnTo(returnTo)
        )}`
      );
    }

    redirect(buildLoginPath({ returnTo }));
  }

  return user;
}

export async function createSession(userId: string): Promise<void> {
  const db = getDb();
  const rawToken = randomBytes(32).toString("hex");
  const expiry = getSessionExpiryDate();

  db.prepare(
    `INSERT INTO sessions (user_id, session_token_hash, expires_at)
     VALUES (?, ?, ?)`
  ).run(userId, hashToken(rawToken), toIsoDate(expiry));

  getCookieStore().set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiry,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const sessionToken = getSessionCookieValue();

  if (sessionToken) {
    getDb().prepare("DELETE FROM sessions WHERE session_token_hash = ?").run(hashToken(sessionToken));
  }

  clearSessionCookie();
}

export function createOAuthState(): string {
  return randomBytes(24).toString("hex");
}

export function storeOAuthFlow(payload: OAuthFlowPayload) {
  getCookieStore().set(OAUTH_FLOW_COOKIE_NAME, encodeFlowPayload(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/",
  });
}

export function consumeOAuthFlow(): OAuthFlowPayload | null {
  const cookieStore = getCookieStore();
  const value = cookieStore.get(OAUTH_FLOW_COOKIE_NAME)?.value ?? null;
  deleteCookieSafely(OAUTH_FLOW_COOKIE_NAME);

  if (!value) {
    return null;
  }

  return decodeFlowPayload(value);
}

export { getAppBasePath, normalizeReturnTo, withAppBasePath };

export function findOAuthAccount(provider: OAuthAccount["provider"], providerAccountId: string) {
  const db = getDb();
  return db
    .prepare(
      `SELECT *
       FROM oauth_accounts
       WHERE provider = ? AND provider_account_id = ?
       LIMIT 1`
    )
    .get(provider, providerAccountId) as OAuthAccount | undefined;
}

export function upsertGoogleUser(profile: {
  providerAccountId: string;
  email: string;
  name?: string | null;
  image?: string | null;
}): User {
  const db = getDb();

  const userId = db.transaction(() => {
    const existingAccount = findOAuthAccount("google", profile.providerAccountId);

    if (existingAccount) {
      db.prepare(
        `UPDATE users
         SET email = ?, name = ?, image = ?, updated_at = datetime('now')
         WHERE id = ?`
      ).run(profile.email, profile.name ?? null, profile.image ?? null, existingAccount.user_id);

      db.prepare(
        `UPDATE oauth_accounts
         SET email = ?, updated_at = datetime('now')
         WHERE provider = 'google' AND provider_account_id = ?`
      ).run(profile.email, profile.providerAccountId);

      return existingAccount.user_id;
    }

    const existingUser = db
      .prepare(
        `SELECT *
         FROM users
         WHERE email = ?
         LIMIT 1`
      )
      .get(profile.email) as User | undefined;

    const resolvedUserId =
      existingUser?.id ??
      (() => {
        db.prepare(
          `INSERT INTO users (email, name, image)
           VALUES (?, ?, ?)`
        ).run(profile.email, profile.name ?? null, profile.image ?? null);

        const created = db.prepare("SELECT * FROM users WHERE rowid = last_insert_rowid()").get() as
          | User
          | undefined;

        if (!created) {
          throw new Error("Failed to create user.");
        }

        return created.id;
      })();

    db.prepare(
      `UPDATE users
       SET email = ?, name = ?, image = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(profile.email, profile.name ?? null, profile.image ?? null, resolvedUserId);

    db.prepare(
      `INSERT INTO oauth_accounts (user_id, provider, provider_account_id, email)
       VALUES (?, 'google', ?, ?)`
    ).run(resolvedUserId, profile.providerAccountId, profile.email);

    return resolvedUserId;
  })();

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as User | undefined;

  if (!user) {
    throw new Error("Failed to load user after OAuth.");
  }

  return user;
}
