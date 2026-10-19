import type { NextConfig } from "next";
import path from "path";

// Monorepo: lockfile ở repo root + file:../.. — Vercel cần trace từ root repo
const monorepoRoot = path.resolve(__dirname, "../..");

const nextConfig: NextConfig = {
  turbopack: {
    root: monorepoRoot,
  },
  outputFileTracingRoot: monorepoRoot,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
