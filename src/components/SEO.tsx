import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  structuredData?: any;
}

export const SEO: React.FC<SEOProps> = ({ 
  title, 
  description = "Nền tảng giao dịch bất động sản uy tín, chuyên nghiệp. Mua bán, ký gửi nhà đất với thủ tục nhanh chóng, an toàn.", 
  image = "/og-image.jpg", 
  url = "https://greeniahomes.vn",
  structuredData
}) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="apple-touch-icon" href="/favicon.svg" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Schema.org / JSON-LD */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}

      {/* Geo Meta Tags for Local SEO */}
      <meta name="geo.region" content="VN" />
      <meta name="geo.placename" content="Việt Nam" />
      <meta name="geo.position" content="10.733852;106.715344" />
      <meta name="ICBM" content="10.733852, 106.715344" />
    </Helmet>
  );
};
