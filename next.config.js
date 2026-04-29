/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@seniorbydesign/signature-engine'],
  reactStrictMode: true,
  // Optimize for production
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.private.blob.vercel-storage.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Exclude canvas from client-side bundle (PDF.js tries to import it but we use browser canvas)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        path: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig

