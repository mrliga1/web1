import withBundleAnalyzer from '@next/bundle-analyzer';
const analyzer = withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });
const nextConfig = {
  reactStrictMode: true,
  images: {
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
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    serverComponentsExternalPackages: ['nodemailer'],
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js']
  },
  async redirects() {
    return [{ source: '/:path*', has: [{ type: 'host', value: 'www.greeniahomes.vn' }], destination: 'https://greeniahomes.vn/:path*', permanent: true }];
  }
};
export default analyzer(nextConfig);
