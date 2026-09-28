import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['*.sandbox.novita.ai', '*.e2b.dev'],

  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },

  outputFileTracingExcludes: {
    '*': [
      './node_modules/@swc/**/*',
      './node_modules/esbuild/**/*',
      './node_modules/webpack/**/*',
    ],
  },
};

export default nextConfig;
