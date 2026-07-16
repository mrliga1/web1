import withBundleAnalyzer from '@next/bundle-analyzer';
const analyzer = withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['nodemailer'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: 'wsrv.nl' },
      { protocol: 'https', hostname: 'cdn.jsdelivr.net' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
    ]
  },
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
  experimental: {
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js']
  },
  // Header bảo mật dùng chung cho toàn bộ ứng dụng.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
    ];
  },
  async redirects() {
    return [{ source: '/:path*', has: [{ type: 'host', value: 'www.greeniahomes.vn' }], destination: 'https://greeniahomes.vn/:path*', permanent: true }];
  }
};
export default analyzer(nextConfig);
