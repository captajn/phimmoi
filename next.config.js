/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'phimapi.com'
      },
      {
        protocol: 'https',
        hostname: 'img.phimapi.com'
      },
      {
        protocol: 'https',
        hostname: 'phimimg.com'
      }
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compress: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001', 'phim.chjbi.net'],
      bodySizeLimit: '2mb'
    }
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? './' : '',
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'mdx'],
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 5,
  },
  webpack: (config) => {
    // Chúng ta có thể thêm các quy tắc loại trừ thư mục pages ở đây nếu cần
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=3600',
          },
        ],
      },
    ]
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/:path*',
          has: [
            {
              type: 'host',
              value: 'phim.chjbi.net',
            },
          ],
          destination: '/:path*',
        },
      ],
    }
  },
}

module.exports = nextConfig 