import type { Metadata } from "next";
import Providers from "./providers";
import ClientLayout from "../src/components/ClientLayout";
import "../src/index.css";

/* Metadata máº·c Ä‘á»‹nh cho toÃ n bá»™ site */
export const metadata: Metadata = {
  title: {
    default: "Greenia Homes - Cá»‘ Váº¥n Äáº§u TÆ° Báº¥t Äá»™ng Sáº£n ChuyÃªn SÃ¢u",
    template: "%s | Greenia Homes",
  },
  description:
    "ChÃ o má»«ng Ä‘áº¿n vá»›i Greenia Homes - Äá»“ng hÃ nh cÃ¹ng nhÃ  Ä‘áº§u tÆ° báº¥t Ä‘á»™ng sáº£n vá»›i phÃ¡p lÃ½ minh báº¡ch vÃ  dá»¯ liá»‡u thá»±c chiáº¿n.",
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
    "geo.placename": "Viá»‡t Nam",
    "geo.position": "10.733852;106.715344",
    ICBM: "10.733852, 106.715344",
  },
};

/**
 * Root Layout - Server Component.
 * Bao bá»c toÃ n bá»™ app vá»›i HTML, font, vÃ  providers.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        {/* Preconnect cho Google Fonts vÃ  Firebase */}
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
        {/* Font loading khÃ´ng block render */}
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
          <div id="root">
            <ClientLayout>{children}</ClientLayout>
          </div>
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
