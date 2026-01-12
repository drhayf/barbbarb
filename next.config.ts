import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    clientSegmentCache: true,
    // CORRECT LOCATION: Nested inside experimental
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        '*.app.github.dev',
        '*.github.dev',
        'bug-free-winner-pj6qg5qpw67v2g5p-3000.app.github.dev',
      ],
    },
  },
};

export default nextConfig;
