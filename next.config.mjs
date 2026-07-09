import withBundleAnalyzer from '@next/bundle-analyzer';
const analyzer = withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });
const nextConfig = { reactStrictMode: true, images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] }, typescript: { ignoreBuildErrors: true }, eslint: { ignoreDuringBuilds: true }, experimental: { serverComponentsExternalPackages: ['nodemailer'], optimizePackageImports: ['lucide-react', 'framer-motion', '@supabase/supabase-js'] }, async redirects() { return [{ source: '/:path*', has: [{ type: 'host', value: 'www.greeniahomes.vn' }], destination: 'https://greeniahomes.vn/:path*', permanent: true }]; } };
export default analyzer(nextConfig);
