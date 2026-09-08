import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*.sandbox.novita.ai', '*.e2b.dev'],

  turbopack: {
    // Explicitly set workspace root so Turbopack doesn't warn about
    // multiple lockfiles (monorepo root vs apps/web root)
    root: path.resolve(__dirname, '../..'),
  },

  // Exclude heavy folders from build output tracing (speeds up cold starts)
  outputFileTracingExcludes: {
    '*': [
      './node_modules/@swc/**/*',
      './node_modules/esbuild/**/*',
      './node_modules/webpack/**/*',
    ],
  },
};

export default nextConfig;
