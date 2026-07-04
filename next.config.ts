import type { NextConfig } from 'next';

const apiBaseUrl = process.env.EXPENSIA_API_BASE_URL ?? 'http://localhost:8080';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiBaseUrl.replace(/\/$/, '')}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
