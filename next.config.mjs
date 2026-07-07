/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Bật reactStrictMode */
  reactStrictMode: true,
  
  /* Cho phép tải ảnh từ mọi domain */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  /* Bỏ qua lỗi TypeScript và ESLint khi build (dự án đang chuyển đổi) */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  /* Chuyển hướng các dependencies cần thiết sang client-only */
  experimental: {
    serverComponentsExternalPackages: ['nodemailer'],
  },

  /* Tự động chuyển hướng từ www sang non-www */
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.greeniahomes.vn',
          },
        ],
        destination: 'https://greeniahomes.vn/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
