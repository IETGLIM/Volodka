import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: `output: "standalone"` removed for dev mode compatibility.
  // It changes chunk paths and causes ChunkLoadError in dev.
  // Re-enable only for production builds if needed.
  // output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  // Transpile Three.js ESM packages for proper bundling
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing', '@react-three/rapier'],
  // Allow cross-origin requests from the preview panel (dev only)
  allowedDevOrigins: ['.space-z.ai'],
  // Allow loading GLB models from external paths
  async headers() {
    return [
      {
        source: '/models-external/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
};

export default nextConfig;
