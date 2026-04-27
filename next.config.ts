import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [{ source: "/favicon.ico", destination: "/icon.svg", permanent: false }];
  },

  /**
   * Turbopack (`next dev`, `next build --turbo`).
   * `resolveExtensions` replaces the default list — keep Next.js defaults and add `.glb`.
   * `*.glb` as `asset`: emit URL without treating imports like the image optimization pipeline.
   * Heap for heavy builds: set in `package.json` `build` via `NODE_OPTIONS` (not `turbo.tasks` — that is Turborepo, not Next).
   */
  turbopack: {
    resolveExtensions: [".mdx", ".tsx", ".ts", ".jsx", ".js", ".mjs", ".json", ".glb"],
    rules: {
      "*.glb": { type: "asset" },
    },
  },

  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,

  /** Used when building without `--turbo`. Draco batch: `npm run optimize-models` in CI. */
  webpack: (config, { isServer }) => {
    if (!isServer && process.env.NODE_ENV === "production") {
      // Model compression is not wired here; see `scripts/optimize-models/`.
    }
    return config;
  },
};

export default nextConfig;
