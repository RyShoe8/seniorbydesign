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
  async headers() {
    return [
      {
        source: '/email-assets/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.seniorbydesign.com' }],
        destination: 'https://seniorbydesign.com/:path*',
        permanent: true,
      },
      {
        source: '/design-guide',
        destination: '/experience',
        permanent: true,
      },
      {
        source: '/our-design-guide',
        destination: '/experience',
        permanent: true,
      },
      {
        source: '/team/Cynthia',
        destination: '/team/cynthia-vrba',
        permanent: true,
      },
      {
        source: '/team/Gianna',
        destination: '/team/gianna-niccolai',
        permanent: true,
      },
      {
        source: '/the-firm',
        destination: '/senior-living-design-firm',
        permanent: true,
      },
      {
        source: '/the-firm/:path*',
        destination: '/senior-living-design-firm/:path*',
        permanent: true,
      },
      {
        source: '/blog/The_SBD_Chair_Test_Yes_We_Sit_in_Every_Single_One',
        destination: '/blog/the-sbd-chair-test',
        permanent: true,
      },
      {
        source: '/images/The Team/The Team Hero.jpg',
        destination: '/images/senior-living-team-hero-design-sbd.jpg',
        permanent: true,
      },
      {
        source: '/images/Portfolio/portfolio hero.jpg',
        destination: '/images/senior-living-portfolio-index-design-sbd.jpg',
        permanent: true,
      },
      {
        source: '/images/Services/Senior By Design Services Hero.jpg',
        destination: '/images/senior-living-services-hero-design-sbd.jpg',
        permanent: true,
      },
      {
        source: '/images/Blog/principled design hero.jpg',
        destination: '/images/senior-living-blog-journal-hero-design-sbd.jpg',
        permanent: true,
      },
      {
        source: '/images/Blog/principled%20design%20hero.jpg',
        destination: '/images/senior-living-blog-journal-hero-design-sbd.jpg',
        permanent: true,
      },
      {
        source: '/images/The Firm/The Firm Header.webp',
        destination: '/images/senior-living-firm-hero-design-sbd.webp',
        permanent: true,
      },
      {
        source: '/images/The Firm/Culture.webp',
        destination: '/images/senior-living-firm-culture-design-sbd.webp',
        permanent: true,
      },
      {
        source: '/images/The Firm/The Firm Warehouse 2.webp',
        destination: '/images/senior-living-warehouse-design-sbd-2.webp',
        permanent: true,
      },
      {
        source: '/images/The Firm/The Firm Warehouse 3.webp',
        destination: '/images/senior-living-warehouse-design-sbd-3.webp',
        permanent: true,
      },
      {
        source: '/images/The Firm/The Firm Warehouse 4.webp',
        destination: '/images/senior-living-warehouse-design-sbd-4.webp',
        permanent: true,
      },
      {
        source: '/images/The Firm/The Firm Warehouse 5.webp',
        destination: '/images/senior-living-warehouse-design-sbd-5.webp',
        permanent: true,
      },
      {
        source: '/images/The Firm/The Firm Warehouse 6.webp',
        destination: '/images/senior-living-warehouse-design-sbd-6.webp',
        permanent: true,
      },
      {
        source: '/images/Newsletter and Brochure Hero Image.jpg',
        destination: '/images/senior-living-newsletter-hero-design-sbd.jpg',
        permanent: true,
      },
      {
        source: '/images/SBD Logo.webp',
        destination: '/images/senior-living-logo-design-sbd.webp',
        permanent: true,
      },
    ];
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

