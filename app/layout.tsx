import type { Metadata } from "next";
import Providers from "./providers";
import ClientLayout from "../src/components/ClientLayout";
import SchemaMarkup from "../src/components/SchemaMarkup";
import "../src/index.css";

/* Metadata mặc định cho toàn bộ site */
export const metadata: Metadata = {
  metadataBase: new URL("https://greeniahomes.vn"),
  title: {
    default: "Greenia Homes - Cố Vấn Đầu Tư Bất Động Sản Chuyên Sâu",
    template: "%s | Greenia Homes",
  },
  description:
    "Chào mừng đến với Greenia Homes - Đồng hành cùng nhà đầu tư bất động sản với pháp lý minh bạch và dữ liệu thực chiến.",
  keywords:
    "greenia homes, biet thu chateau, phu my hung, vinhomes, can ho hang sang, phong thuy bat dong san",
  authors: [{ name: "Greenia Homes" }],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.webp",
    apple: "/favicon.webp",
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "Greenia Homes",
    title: "Greenia Homes - Cố Vấn Đầu Tư Bất Động Sản Chuyên Sâu",
    description:
      "Chào mừng đến với Greenia Homes - Đồng hành cùng nhà đầu tư bất động sản với pháp lý minh bạch và dữ liệu thực chiến.",
    url: "/",
    images: [{ url: "/og-image.jpg", alt: "Greenia Homes" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Greenia Homes - Cố Vấn Đầu Tư Bất Động Sản Chuyên Sâu",
    description:
      "Chào mừng đến với Greenia Homes - Đồng hành cùng nhà đầu tư bất động sản với pháp lý minh bạch và dữ liệu thực chiến.",
    images: ["/og-image.jpg"],
  },
  other: {
    "geo.region": "VN",
    "geo.placename": "Việt Nam",
    "geo.position": "10.733852;106.715344",
    ICBM: "10.733852, 106.715344",
  },
};

/**
 * Root Layout - Server Component.
 * Bao bọc toàn bộ app với HTML, font, và providers.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        {/* Kết nối sớm tới máy chủ Google Fonts. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Font loading không block render */}
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400..800;1,400..800&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400..800;1,400..800&display=swap"
          media="print"
          // @ts-ignore
          onLoad="this.media='all'"
        />
        <noscript>
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400..800;1,400..800&display=swap"
          />
        </noscript>
        {/* PWA Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#05080f" />
        <SchemaMarkup schema={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Greenia Homes",
          "url": "https://greeniahomes.vn",
          "description": "Cố vấn đầu tư bất động sản chuyên sâu, uy tín tại Việt Nam.",
        }} />
        <SchemaMarkup schema={{
          "@context": "https://schema.org",
          "@type": "RealEstateAgent",
          "name": "Greenia Homes",
          "url": "https://greeniahomes.vn",
          "logo": "https://greeniahomes.vn/favicon.webp",
          "image": "https://greeniahomes.vn/og-image.jpg",
          "description": "Greenia Homes - Đồng hành cùng nhà đầu tư bất động sản với pháp lý minh bạch và dữ liệu thực chiến.",
          "telephone": "0932966700",
          "email": "sales.greeniahomes@gmail.com",
          "sameAs": [
            "https://www.facebook.com/GreeniaHomes",
            "https://www.tiktok.com/@greeniahomes",
            "https://www.youtube.com/@GreeniaHomes",
            "https://zalo.me/greeniahomes"
          ],
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Tòa nhà Greenia, Khu biệt thự Phú Mỹ Hưng",
            "addressLocality": "Quận 7",
            "addressRegion": "TP.HCM",
            "postalCode": "700000",
            "addressCountry": "VN"
          },
          "priceRange": "$$$"
        }} />
      </head>
      <body
        style={{
          backgroundColor: "#ffffff",
          margin: 0,
          padding: 0,
          fontFamily: '"Inter", sans-serif',
        }}
      >
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
