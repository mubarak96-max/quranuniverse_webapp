import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Workers have no filesystem, so lib/data.ts can only read JSON at build time.
  output: "export",
};

export default nextConfig;
