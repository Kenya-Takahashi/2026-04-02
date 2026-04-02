export const LAYOUT_PATTERNS = [
  { value: 'header-main', label: 'ヘッダー＋メイン' },
  { value: 'header-sidebar-main', label: 'ヘッダー＋サイドバー＋メイン' },
  { value: 'header-tabs-main', label: 'ヘッダー＋タブナビ＋メイン' },
  { value: 'other', label: 'その他（自由記述）' },
];

export const FRONTEND_OPTIONS = [
  { value: 'react-vite', label: 'React + Vite' },
  { value: 'nextjs', label: 'Next.js' },
  { value: 'vanilla', label: 'HTML/CSS/JS（バニラ）' },
  { value: 'other', label: 'その他' },
];

export const BACKEND_OPTIONS = [
  { value: 'express', label: 'Express' },
  { value: 'hono', label: 'Hono' },
  { value: 'none', label: 'なし（フロント単体）' },
  { value: 'other', label: 'その他' },
];

export const DATABASE_OPTIONS = [
  { value: 'sqlite', label: 'SQLite' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'none', label: 'なし' },
  { value: 'other', label: 'その他' },
];

export const LANGUAGE_OPTIONS = [
  { value: 'TypeScript', label: 'TypeScript' },
  { value: 'JavaScript', label: 'JavaScript' },
];

export const DESIGN_STYLE_OPTIONS = [
  { value: 'notion', label: 'Notion風（柔らかい、余白多め）' },
  { value: 'apple', label: 'Apple風（ミニマル、白基調）' },
  { value: 'other', label: 'その他（自由記述）' },
];

export const COLOR_THEME_OPTIONS = [
  { value: 'light', label: 'ライト' },
  { value: 'dark', label: 'ダーク' },
  { value: 'auto', label: '自動（OS設定に追従）' },
];

export const AUTH_OPTIONS = [
  { value: 'none', label: 'なし' },
  { value: 'email-password', label: 'メール/パスワード' },
  { value: 'oauth-google', label: 'OAuth (Google)' },
  { value: 'other', label: 'その他' },
];

export const CONTAINER_OPTIONS = [
  { value: 'docker-compose', label: 'Docker Compose（フロント＋バック＋DB）' },
  { value: 'single-dockerfile', label: '単一Dockerfile' },
  { value: 'none', label: 'なし' },
  { value: 'other', label: 'その他' },
];

export const DEPLOY_OPTIONS = [
  { value: 'aws-lightsail', label: 'AWS Lightsail' },
  { value: 'vercel', label: 'Vercel' },
  { value: 'vps', label: 'VPS' },
  { value: 'other', label: 'その他' },
];

export const CI_OPTIONS = [
  { value: 'github-actions', label: 'GitHub Actions' },
  { value: 'none', label: 'なし' },
  { value: 'other', label: 'その他' },
];
