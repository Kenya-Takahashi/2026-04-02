function normalizeBasePathValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();

  if (!trimmed || trimmed === "/") {
    return "";
  }

  const withoutTrailingSlash = trimmed.replace(/\/+$/, "");

  return withoutTrailingSlash.startsWith("/") ? withoutTrailingSlash : `/${withoutTrailingSlash}`;
}

export function getAppBasePath() {
  return normalizeBasePathValue(process.env.APP_BASE_PATH);
}

export function withAppBasePath(path: string) {
  const basePath = getAppBasePath();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!basePath) {
    return normalizedPath;
  }

  if (normalizedPath === basePath || normalizedPath.startsWith(`${basePath}/`)) {
    return normalizedPath;
  }

  return normalizedPath === "/" ? basePath : `${basePath}${normalizedPath}`;
}

export function stripAppBasePath(path: string) {
  const basePath = getAppBasePath();

  if (!basePath) {
    return path || "/";
  }

  if (path === basePath) {
    return "/";
  }

  if (path.startsWith(`${basePath}/`)) {
    return path.slice(basePath.length) || "/";
  }

  return path;
}

export function normalizeReturnTo(value?: string | null) {
  const fallback = withAppBasePath("/");

  if (!value || typeof value !== "string") {
    return fallback;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  const basePath = getAppBasePath();

  if (!basePath) {
    return value;
  }

  if (value === basePath || value.startsWith(`${basePath}/`)) {
    return value;
  }

  return fallback;
}
