import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uimucvwyultgmbobnzwg.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'cafe.daum.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
