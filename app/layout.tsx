import type { Metadata } from "next";
import Providers from "./providers";
import ClientLayout from "../src/components/ClientLayout";
import {
  SITE_NAME,
  SITE_URL,
} from "../src/lib/internalLinks";
import { getInitialSiteSettings } from "../src/lib/serverData";
import { getManagedStaticMetadata } from "../src/lib/staticSeo";
import { getPublicSettings } from "../src/lib/serverContent";
import {
  ADSENSE_SCRIPT_ID,
  normalizeAdSenseSettings,
} from "../src/lib/adsense";
import "../src/index.css";

/* Metadata mặc định cho toàn bộ site */
export async function generateMetadata(): Promise<Metadata> {
  const managed = await getManagedStaticMetadata('/');
  const homeTitle = typeof managed.title === 'string'
    ? managed.title
    : 'Greenia Homes - Cố vấn đầu tư bất động sản chuyên sâu';
  return {
    ...managed,
    metadataBase: new URL(SITE_URL),
    title: { default: homeTitle, template: `%s | ${SITE_NAME}` },
    authors: [{ name: SITE_NAME }],
    icons: { icon: '/favicon.webp', apple: '/favicon.webp' },
    other: {
      'geo.region': 'VN',
      'geo.placename': 'Việt Nam',
      'geo.position': '10.733852;106.715344',
      ICBM: '10.733852, 106.715344',
    },
  };
}

/**
 * Root Layout - Server Component.
 * Bao bọc toàn bộ app với HTML, font, và providers.
 */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [initialSiteSettings, generalSettings] = await Promise.all([
    getInitialSiteSettings(),
    getPublicSettings("general").catch(() => null),
  ]);
  const adSenseSettings = normalizeAdSenseSettings(generalSettings?.adSenseSettings);

  return (
    <html lang="vi">
      <head>
        {adSenseSettings.enabled && (
          <script
            id={ADSENSE_SCRIPT_ID}
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseSettings.publisherId}`}
            crossOrigin="anonymous"
          />
        )}
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
