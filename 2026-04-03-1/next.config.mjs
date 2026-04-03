/** @type {import('next').NextConfig} */
const basePath =
  process.env.APP_BASE_PATH && process.env.APP_BASE_PATH !== "/"
    ? process.env.APP_BASE_PATH.replace(/\/+$/, "")
    : "";

const nextConfig = {
  output: "standalone",
  basePath,
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
};

export default nextConfig;
