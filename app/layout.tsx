import type { Metadata } from "next";
import Providers from "./providers";
import ClientLayout from "../src/components/ClientLayout";
import SchemaMarkup from "../src/components/SchemaMarkup";
import {
  createSiteNavigationSchema,
  getSemanticKeywords,
  SITE_URL,
} from "../src/lib/internalLinks";
import { getInitialSiteSettings } from "../src/lib/serverData";
import "../src/index.css";

const semanticKeywords = getSemanticKeywords();

/* Metadata mặc định cho toàn bộ site */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Greenia Homes - Cố Vấn Đầu Tư Bất Động Sản Chuyên Sâu",
    template: "%s | Greenia Homes",
  },
  description:
    "Chào mừng đến với Greenia Homes - Đồng hành cùng nhà đầu tư bất động sản với pháp lý minh bạch và dữ liệu thực chiến.",
  keywords: semanticKeywords,
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
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialSiteSettings = await getInitialSiteSettings();

  return (
    <html lang="vi">
      <head>
        {/* PWA Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#04352A" />
        <SchemaMarkup schema={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Greenia Homes",
          "url": SITE_URL,
          "description": "Cố vấn đầu tư bất động sản chuyên sâu, uy tín tại Việt Nam.",
          "about": semanticKeywords.slice(0, 12),
        }} />
        <SchemaMarkup schema={createSiteNavigationSchema()} />
        <SchemaMarkup schema={{
          "@context": "https://schema.org",
          "@type": "RealEstateAgent",
          "name": "Greenia Homes",
          "url": SITE_URL,
          "logo": "https://greeniahomes.vn/favicon.webp",
          "image": "https://greeniahomes.vn/og-image.jpg",
          "description": "Greenia Homes - Đồng hành cùng nhà đầu tư bất động sản với pháp lý minh bạch và dữ liệu thực chiến.",
          "telephone": "0932966700",
          "email": "sales.greeniahomes@gmail.com",
          "knowsAbout": semanticKeywords.slice(0, 24),
          "areaServed": ["TP.HCM", "Quận 7", "Phú Mỹ Hưng", "Việt Nam"],
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
      <body className="min-h-screen bg-bg-base text-text-primary antialiased">
        <Providers>
          <ClientLayout
            initialLogoUrl={initialSiteSettings.logoUrl}
            initialSettingsLoaded={initialSiteSettings.loaded}
          >
            {children}
          </ClientLayout>
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
                    .then(function(registration) {
                      return registration.update();
                    })
                    .catch(function(err) {
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
