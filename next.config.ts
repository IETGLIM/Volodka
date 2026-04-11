import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  
  // Disable TypeScript errors during build (temporary)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  reactStrictMode: false,
  
  // Enable Turbopack (default in Next.js 16)
  turbopack: {},
  
  // ============================================
  // CRITICAL FIX: Disable minimization for Vercel
  // This fixes "Cannot access 'ed' before initialization" error
  // caused by TDZ issues during module initialization
  // ============================================
  webpack: (config, { isServer }) => {
    // Disable minimization to avoid TDZ issues with module initialization
    if (!isServer) {
      config.optimization = config.optimization || {};
      config.optimization.minimize = false;
    }
    return config;
  },
  
  // Allow cross-origin requests from preview
  allowedDevOrigins: [
    'preview-chat-53d97cd9-d3e1-40a3-aac9-289a0ff2acb7.space.z.ai',
    '.space.z.ai',
    '.z.ai',
  ],
  
  // Optimize for Vercel
  experimental: {
    // Enable optimization
    optimizePackageImports: [
      'framer-motion',
      'lucide-react',
      '@react-three/drei',
      '@react-three/fiber',
      'three',
    ],
  },
  
  // Headers for cache control
  async headers() {
    return [
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
      {
        // Static assets can be cached
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
