import type { Metadata } from "next";
import Providers from "./providers";
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
        {/* Font loading với display=swap */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400..800;1,400..800&display=swap"
        />
        {/* Preload hero image */}
        <link
          rel="preload"
          as="image"
          imageSrcSet="https://wsrv.nl/?url=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1600585154340-be6161a56a0c&q=65&a=attention&w=400 400w, https://wsrv.nl/?url=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1600585154340-be6161a56a0c&q=65&a=attention&w=800 800w, https://wsrv.nl/?url=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1600585154340-be6161a56a0c&q=65&a=attention&w=1200 1200w"
          imageSizes="100vw"
          fetchPriority="high"
        />
      </head>
      <body
        style={{
          backgroundColor: "#05080f",
          margin: 0,
          padding: 0,
          fontFamily: '"Inter", sans-serif',
        }}
      >
        <Providers>
          <div id="root">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
