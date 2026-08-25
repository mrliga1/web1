import type { Metadata } from "next";
import { createSearchDescription, getSemanticTerms } from "./searchIntent";

export const SITE_URL = "https://greeniahomes.vn";

export const SITE_NAME = "Greenia Homes";
export const SITE_DESCRIPTION =
  "Greenia Homes tư vấn đầu tư, mua bán, chuyển nhượng và cho thuê bất động sản tại TP.HCM; thông tin dự án, pháp lý minh bạch, hotline 0932 966 700.";
export const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/og-image.jpg`;

export type SitemapChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export interface InternalLinkItem {
  href: string;
  label: string;
  group: "core" | "product" | "news" | "legal";
  priority: number;
  changeFrequency: SitemapChangeFrequency;
  topics: string[];
}

export interface SemanticKeywordCluster {
  topic: string;
  terms: string[];
}

export const CORE_INTERNAL_LINKS: InternalLinkItem[] = [
  {
    href: "/",
    label: "Trang chủ Greenia Homes",
    group: "core",
    priority: 1,
    changeFrequency: "daily",
    topics: ["Greenia Homes", "tư vấn bất động sản", "bất động sản TP.HCM"],
  },
  {
    href: "/san-pham",
    label: "Danh sách bất động sản",
    group: "product",
    priority: 0.9,
    changeFrequency: "daily",
    topics: ["mua bán nhà đất", "chuyển nhượng bất động sản", "cho thuê bất động sản"],
  },
  {
    href: "/category-product/chuyen-nhuong",
    label: "Bất động sản chuyển nhượng",
    group: "product",
    priority: 0.75,
    changeFrequency: "daily",
    topics: ["chuyển nhượng căn hộ", "nhà phố biệt thự", "bất động sản cao cấp"],
  },
  {
    href: "/category-product/cho-thue",
    label: "Bất động sản cho thuê",
    group: "product",
    priority: 0.75,
    changeFrequency: "daily",
    topics: ["cho thuê căn hộ", "cho thuê nhà phố", "thuê bất động sản TP.HCM"],
  },
  {
    href: "/category-product/can-ho",
    label: "Căn hộ",
    group: "product",
    priority: 0.7,
    changeFrequency: "weekly",
    topics: ["căn hộ TP.HCM", "căn hộ cao cấp", "căn hộ Phú Mỹ Hưng"],
  },
  {
    href: "/category-product/nha-pho-biet-thu",
    label: "Nhà phố - biệt thự",
    group: "product",
    priority: 0.7,
    changeFrequency: "weekly",
    topics: ["nhà phố biệt thự", "biệt thự Phú Mỹ Hưng", "nhà phố cao cấp"],
  },
  {
    href: "/du-an",
    label: "Dự án bất động sản",
    group: "core",
    priority: 0.8,
    changeFrequency: "weekly",
    topics: ["dự án bất động sản", "dự án đô thị", "Vinhomes Cần Giờ"],
  },
  {
    href: "/tin-tuc",
    label: "Tin tức bất động sản",
    group: "news",
    priority: 0.8,
    changeFrequency: "daily",
    topics: ["tin tức bất động sản", "thị trường bất động sản", "phân tích thị trường"],
  },
  {
    href: "/category-news/thi-truong",
    label: "Tin thị trường",
    group: "news",
    priority: 0.65,
    changeFrequency: "daily",
    topics: ["thị trường nhà đất", "xu hướng bất động sản", "pháp lý bất động sản"],
  },
  {
    href: "/latest-sales",
    label: "Bất động sản bán mới nhất",
    group: "product",
    priority: 0.7,
    changeFrequency: "daily",
    topics: ["nhà đất bán mới", "bất động sản mới đăng", "mua nhà TP.HCM"],
  },
  {
    href: "/latest-rents",
    label: "Bất động sản thuê mới nhất",
    group: "product",
    priority: 0.7,
    changeFrequency: "daily",
    topics: ["nhà đất cho thuê mới", "căn hộ thuê mới", "thuê nhà TP.HCM"],
  },
  {
    href: "/lien-he",
    label: "Liên hệ Greenia Homes",
    group: "core",
    priority: 0.5,
    changeFrequency: "monthly",
    topics: ["hotline bất động sản", "tư vấn mua nhà", "ký gửi nhà đất"],
  },
  {
    href: "/chinh-sach-bao-mat",
    label: "Chính sách bảo mật",
    group: "legal",
    priority: 0.3,
    changeFrequency: "yearly",
    topics: ["bảo mật dữ liệu", "dữ liệu cá nhân"],
  },
  {
    href: "/dieu-khoan-su-dung",
    label: "Điều khoản sử dụng",
    group: "legal",
    priority: 0.3,
    changeFrequency: "yearly",
    topics: ["điều khoản dịch vụ", "quy định sử dụng"],
  },
];

export const SEMANTIC_KEYWORD_CLUSTERS: SemanticKeywordCluster[] = [
  {
    topic: "Tư vấn bất động sản chuyên sâu",
    terms: [
      "cố vấn đầu tư bất động sản",
      "tư vấn mua nhà",
      "tư vấn chuyển nhượng",
      "phân tích pháp lý sổ hồng",
      "định giá bất động sản",
    ],
  },
  {
    topic: "Bất động sản cao cấp TP.HCM",
    terms: [
      "biệt thự Phú Mỹ Hưng",
      "nhà phố biệt thự Quận 7",
      "căn hộ cao cấp TP.HCM",
      "bất động sản ven sông",
      "khu đô thị cao cấp",
    ],
  },
  {
    topic: "Thị trường và dự án",
    terms: [
      "thị trường bất động sản",
      "dự án đô thị",
      "Vinhomes Cần Giờ",
      "quy hoạch khu đô thị",
      "tiềm năng đầu tư",
    ],
  },
  {
    topic: "Giao dịch an toàn",
    terms: [
      "ký gửi nhà đất",
      "mua bán nhà đất an toàn",
      "kiểm tra pháp lý",
      "hồ sơ chuyển nhượng",
      "tư vấn tài chính bất động sản",
    ],
  },
];

export function getAbsoluteUrl(href: string) {
  if (/^https?:\/\//i.test(href)) return href;
  return `${SITE_URL}${href.startsWith("/") ? href : `/${href}`}`;
}

export function getSemanticKeywords(path = "/") {
  const keywords = new Set<string>();
  CORE_INTERNAL_LINKS.forEach((link) => {
    keywords.add(link.label);
    link.topics.forEach((topic) => keywords.add(topic));
  });
  SEMANTIC_KEYWORD_CLUSTERS.forEach((cluster) => {
    keywords.add(cluster.topic);
    cluster.terms.forEach((term) => keywords.add(term));
  });
  getSemanticTerms({ path }).forEach((term) => keywords.add(term));
  return Array.from(keywords);
}

export function createCoreSitemapRoutes() {
  return CORE_INTERNAL_LINKS.map((link) => ({
    url: getAbsoluteUrl(link.href),
    changeFrequency: link.changeFrequency,
    priority: link.priority,
  }));
}

interface StaticPageMetadataOptions {
  title: string;
  description: string;
  path: string;
  keywords?: Metadata["keywords"];
}

export function createStaticPageMetadata({
  title,
  description,
  path,
  keywords,
}: StaticPageMetadataOptions): Metadata {
  const canonical = getAbsoluteUrl(path);
  const brandedTitle = `${title} | ${SITE_NAME}`;
  const searchDescription = createSearchDescription({
    path,
    source: description,
    fallback: SITE_DESCRIPTION,
  });

  return {
    title,
    description: searchDescription,
    keywords: keywords || getSemanticTerms({ path, title }),
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "vi_VN",
      siteName: SITE_NAME,
      title: brandedTitle,
      description: searchDescription,
      url: canonical,
      images: [
        {
          url: DEFAULT_SOCIAL_IMAGE,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: brandedTitle,
      description: searchDescription,
      images: [DEFAULT_SOCIAL_IMAGE],
    },
  };
}

export function createHomePageSchema() {
  const organizationId = `${SITE_URL}/#organization`;
  const websiteId = `${SITE_URL}/#website`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        alternateName: "greeniahomes.vn",
        description: SITE_DESCRIPTION,
        inLanguage: "vi-VN",
        publisher: { "@id": organizationId },
      },
      {
        "@type": ["Organization", "RealEstateAgent"],
        "@id": organizationId,
        name: SITE_NAME,
        alternateName: "greeniahomes.vn",
        url: `${SITE_URL}/`,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/favicon.webp`,
          contentUrl: `${SITE_URL}/favicon.webp`,
          width: 150,
          height: 150,
        },
        image: DEFAULT_SOCIAL_IMAGE,
        description: SITE_DESCRIPTION,
        telephone: "+84 932 966 700",
        email: "sales.greeniahomes@gmail.com",
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "sales",
          telephone: "+84 932 966 700",
          email: "sales.greeniahomes@gmail.com",
          availableLanguage: ["vi"],
        },
        knowsAbout: getSemanticKeywords().slice(0, 24),
        areaServed: ["TP.HCM", "Quận 7", "Phú Mỹ Hưng", "Việt Nam"],
        sameAs: [
          "https://www.facebook.com/greeniahomes",
          "https://www.tiktok.com/@greeniahomes.vn",
          "https://www.youtube.com/@greeniahomes.vn",
          "https://zalo.me/0932966700",
        ],
        address: {
          "@type": "PostalAddress",
          streetAddress: "Tòa nhà Greenia, Khu biệt thự Phú Mỹ Hưng",
          addressLocality: "Quận 7",
          addressRegion: "TP.HCM",
          postalCode: "700000",
          addressCountry: "VN",
        },
        priceRange: "$$$",
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#webpage`,
        url: `${SITE_URL}/`,
        name: `${SITE_NAME} - Cố vấn đầu tư bất động sản chuyên sâu`,
        description: SITE_DESCRIPTION,
        isPartOf: { "@id": websiteId },
        about: { "@id": organizationId },
        inLanguage: "vi-VN",
      },
    ],
  };
}
