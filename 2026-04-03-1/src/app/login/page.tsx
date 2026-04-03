import Link from "next/link";
import { redirect } from "next/navigation";

import { Header } from "@/components/layout/Header";
import {
  getCurrentUser,
  getMissingOAuthEnvVars,
  isGoogleOAuthConfigured,
  normalizeReturnTo,
} from "@/lib/auth";
import { withAppBasePath } from "@/lib/app-paths";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  access_denied: {
    title: "Google ログインがキャンセルされました",
    description: "認証は完了していません。必要ならもう一度 Google ログインをお試しください。",
  },
  invalid_state: {
    title: "ログイン確認に失敗しました",
    description: "認証の途中情報が一致しませんでした。もう一度最初からログインしてください。",
  },
  invalid_session: {
    title: "セッションを更新しました",
    description: "古い、または壊れたセッションを片付けました。もう一度ログインしてください。",
  },
  oauth_exchange_failed: {
    title: "Google との認証連携に失敗しました",
    description: "token exchange に失敗しました。Google Console の設定と callback URL を確認してください。",
  },
  oauth_profile_failed: {
    title: "Google プロフィールの取得に失敗しました",
    description: "userinfo の取得に失敗しました。少し待ってから再試行してください。",
  },
  oauth_config_missing: {
    title: "OAuth 設定が不足しています",
    description: "環境変数が不足しているため Google ログインを開始できません。",
  },
  session_error: {
    title: "セッション作成に失敗しました",
    description: "ユーザー登録またはセッション保存に失敗しました。少し待ってから再試行してください。",
  },
};

function summarizeReturnTo(returnTo: string) {
  if (returnTo === withAppBasePath("/")) {
    return "ログイン後は Dashboard へ移動します。";
  }

  return `ログイン後は ${returnTo} に戻ります。`;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string; returnTo?: string };
}) {
  const user = await getCurrentUser();
  const returnTo = normalizeReturnTo(searchParams?.returnTo);

  if (user) {
    redirect(returnTo);
  }

  const errorCode = searchParams?.error?.trim() ?? "";
  const errorInfo = errorCode ? ERROR_MESSAGES[errorCode] : null;
  const oauthReady = isGoogleOAuthConfigured();
  const missingVars = getMissingOAuthEnvVars();
  const authHref =
    returnTo === withAppBasePath("/")
      ? withAppBasePath("/auth/google")
      : `${withAppBasePath("/auth/google")}?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.1fr)_420px]">
        <section className="rounded-[32px] border border-[--border] bg-[linear-gradient(140deg,#ffffff_0%,#f7f6f3_58%,#eef4f9_100%)] p-8 shadow-card sm:p-10">
          <p className="text-xs uppercase tracking-[0.28em] text-[--text-tertiary]">Research Flow</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-[--text-primary] sm:text-5xl">
            研究の流れを、
            <br />
            ひとつの静かな作業面にまとめる
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[--text-secondary]">
            Projects で分解し、Inbox に逃がし、Notes で文脈をつなぎ、Sprint と Review
            で週のリズムを整えます。Google アカウントでログインすると、自分専用の workspace
            が作成されます。
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
              <p className="text-sm font-medium text-[--text-primary]">Inbox</p>
              <p className="mt-2 text-sm leading-6 text-[--text-secondary]">
                思いつきをすぐ退避して、あとで Task / Note に整理します。
              </p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
              <p className="text-sm font-medium text-[--text-primary]">Notes</p>
              <p className="mt-2 text-sm leading-6 text-[--text-secondary]">
                `[[タイトル]]` で文脈をつなぎ、研究メモを再利用しやすくします。
              </p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
              <p className="text-sm font-medium text-[--text-primary]">Sprint</p>
              <p className="mt-2 text-sm leading-6 text-[--text-secondary]">
                週の作業を 3 列ボードで回し、Review で進捗を振り返ります。
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-[--border] bg-white p-8 shadow-card sm:p-10">
          <Header
            title="ログイン"
            description="Google アカウントでログインして、自分専用の Research Flow を開始します。"
          />

          <div className="mt-8 space-y-5">
            <div className="rounded-2xl border border-[--border] bg-[--bg-secondary] px-4 py-4 text-sm leading-7 text-[--text-secondary]">
              {summarizeReturnTo(returnTo)}
            </div>

            {errorInfo ? (
              <div className="rounded-2xl border border-[--status-blocked] bg-[--status-blocked] px-4 py-4">
                <p className="text-sm font-medium text-[--accent-coral]">{errorInfo.title}</p>
                <p className="mt-2 text-sm leading-6 text-[--accent-coral]">{errorInfo.description}</p>
              </div>
            ) : null}

            {!oauthReady ? (
              <div className="rounded-2xl border border-[--border] bg-[--bg-secondary] px-4 py-4 text-sm leading-7 text-[--text-secondary]">
                <p className="font-medium text-[--text-primary]">Google OAuth の設定が不足しています</p>
                <p className="mt-2">不足している環境変数: {missingVars.join(", ") || "なし"}</p>
                <p className="mt-2">
                  `.env` と本番環境の `APP_BASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
                  `SESSION_SECRET` を確認してください。
                </p>
              </div>
            ) : null}

            <a
              href={oauthReady ? authHref : "#"}
              aria-disabled={!oauthReady}
              className={[
                "flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-medium transition",
                oauthReady
                  ? "bg-[--text-primary] text-white hover:bg-black"
                  : "cursor-not-allowed bg-[--text-tertiary] text-white/90",
              ].join(" ")}
            >
              Google でログイン
            </a>

            <p className="text-sm leading-7 text-[--text-secondary]">
              ログインすると、Projects / Notes / Inbox / Sprint / Review
              のデータはログイン中ユーザーにだけ紐づきます。
            </p>

            <div className="rounded-2xl border border-dashed border-[--border] px-4 py-4 text-sm leading-7 text-[--text-secondary]">
              ヘルスチェックは未ログインでも
              <span className="mx-1 font-medium text-[--text-primary]">/healthz</span>
              から確認できます。
              <Link href="/healthz" className="ml-2 text-[--accent-blue]">
                開く
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
