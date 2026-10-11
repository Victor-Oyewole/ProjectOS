import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @schoolos/db ships plain TypeScript source (no build step) -- Next.js
  // needs to transpile it itself rather than treating it as pre-built JS.
  transpilePackages: ["@schoolos/db"],
};

export default nextConfig;
