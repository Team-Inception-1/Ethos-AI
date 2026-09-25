import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
