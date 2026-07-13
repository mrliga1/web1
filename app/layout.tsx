import type { Metadata } from "next";
import Providers from "./providers";
import ClientLayout from "../src/components/ClientLayout";
import SchemaMarkup from "../src/components/SchemaMarkup";
import "../src/index.css";

/* Metadata mặc định cho toàn bộ site */
export const metadata: Metadata = {
  title: {
    default: "Greenia Homes - Cố Vấn Đầu Tư Bất Động Sản Chuyên Sâu",
    template: "%s | Greenia Homes",
  },
  description:
    "Chào mừng đến với Greenia Homes - Đồng hành cùng nhà đầu tư bất động sản với pháp lý minh bạch và dữ liệu thực chiến.",
  keywords:
    "greenia homes, biet thu chateau, phu my hung, vinhomes, can ho hang sang, phong thuy bat dong san",
  authors: [{ name: "Greenia Homes" }],
  robots: "index, follow",
  icons: {
    icon: "/favicon.webp",
    apple: "/favicon.webp",
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "Greenia Homes",
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
        {/* Preconnect cho Google Fonts và Firebase */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://firestore.googleapis.com"
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
        <meta name="theme-color" content="#ffffff" />
        <SchemaMarkup schema={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Greenia Homes",
          "url": "https://greeniahomes.vn",
          "description": "Cố vấn đầu tư bất động sản chuyên sâu, uy tín tại Việt Nam.",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://greeniahomes.vn/?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        }} />
        <SchemaMarkup schema={{
          "@context": "https://schema.org",
          "@type": "RealEstateAgent",
          "name": "Greenia Homes",
          "url": "https://greeniahomes.vn",
          "logo": "https://greeniahomes.vn/logo.png",
          "image": "https://greeniahomes.vn/default-share.jpg",
          "description": "Greenia Homes - Đồng hành cùng nhà đầu tư bất động sản với pháp lý minh bạch và dữ liệu thực chiến.",
          "telephone": "0932966700",
          "email": "cskh@greeniahomes.vn",
          "sameAs": [
            "https://www.facebook.com/GreeniaHomes",
            "https://www.tiktok.com/@greeniahomes",
            "https://www.youtube.com/@GreeniaHomes",
            "https://zalo.me/greeniahomes"
          ],
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "67 Võ Văn Kiệt, Phường An Lạc",
            "addressLocality": "Quận Bình Tân",
            "addressRegion": "Hồ Chí Minh",
            "postalCode": "700000",
            "addressCountry": "VN"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": 10.733852,
            "longitude": 106.715344
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
