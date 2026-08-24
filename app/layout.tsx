import type { Metadata } from "next";
import Providers from "./providers";
import ClientLayout from "../src/components/ClientLayout";
import {
  DEFAULT_SOCIAL_IMAGE,
  getSemanticKeywords,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "../src/lib/internalLinks";
import { getInitialSiteSettings } from "../src/lib/serverData";
import "../src/index.css";

const semanticKeywords = getSemanticKeywords();

/* Metadata mặc định cho toàn bộ site */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Greenia Homes - Cố vấn đầu tư bất động sản chuyên sâu",
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
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
    siteName: SITE_NAME,
    title: "Greenia Homes - Cố vấn đầu tư bất động sản chuyên sâu",
    description: SITE_DESCRIPTION,
    url: "/",
    images: [{ url: DEFAULT_SOCIAL_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Greenia Homes - Cố vấn đầu tư bất động sản chuyên sâu",
    description: SITE_DESCRIPTION,
    images: [DEFAULT_SOCIAL_IMAGE],
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
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var recentlyViewedIds=JSON.parse(localStorage.getItem('recentlyViewed')||'[]');if(Array.isArray(recentlyViewedIds)&&recentlyViewedIds.length>0){document.documentElement.setAttribute('data-has-recently-viewed','true');document.documentElement.style.setProperty('--recently-viewed-count',String(Math.min(recentlyViewedIds.length,5)));}}catch(e){}`,
          }}
        />
        {/* PWA Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#04352A" />
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
