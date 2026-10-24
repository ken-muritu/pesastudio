import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  output: "standalone",
  turbopack: {},
};

export default nextConfig;
