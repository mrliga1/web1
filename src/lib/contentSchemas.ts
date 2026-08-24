import type { News, Product, Project } from "../types";
import { generateSlug } from "./utils";

const SITE_URL = "https://greeniahomes.vn";

export type SchemaObject = Record<string, unknown>;

function plainText(value: string | undefined) {
  return (value || "").replace(/<[^>]*>?/g, " ").replace(/\s+/g, " ").trim();
}

function absoluteImageUrl(value: string | undefined) {
  const image = value || "/no-image.svg";
  if (/^https?:\/\//i.test(image)) return image;
  return `${SITE_URL}${image.startsWith("/") ? image : `/${image}`}`;
}

function addListingDetails(
  schema: SchemaObject,
  item: Product | Project,
  canonicalUrl: string,
) {
  if (Number.isFinite(item.priceVal) && item.priceVal > 0) {
    schema.offers = {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: "VND",
      price: item.priceVal,
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "Greenia Homes" },
    };
  }

  const baseRating = item.baseRating || 5;
  const baseCount = item.baseReviewCount || 0;
  const totalStars = baseRating * baseCount + (item.userTotalRating || 0);
  const totalCount = baseCount + (item.userReviewCount || 0);

  if (totalCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: (totalStars / totalCount).toFixed(1),
      reviewCount: totalCount,
    };
  }

  if (item.latitude != null && item.longitude != null) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: item.latitude,
      longitude: item.longitude,
    };
  }
}

export function createProductSchemas(product: Product, slug: string) {
  const canonicalUrl = `${SITE_URL}/san-pham/${slug || generateSlug(product.title)}`;
  const images = (product.imageUrls?.length
    ? product.imageUrls
    : [product.imageUrl || "/no-image.svg"]
  ).map(absoluteImageUrl);

  const listing: SchemaObject = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: product.title,
    image: images,
    description: plainText(product.description).slice(0, 160),
    datePosted: product.createdAt,
    address: {
      "@type": "PostalAddress",
      streetAddress: product.street || undefined,
      addressLocality: product.district || undefined,
      addressRegion: "Hồ Chí Minh",
      addressCountry: "VN",
    },
    numberOfRooms: product.bedrooms || undefined,
    numberOfBedrooms: product.bedrooms || undefined,
    numberOfBathroomsTotal: product.toilets || undefined,
    floorSize: product.area
      ? { "@type": "QuantitativeValue", value: product.area, unitCode: "MTK" }
      : undefined,
  };
  addListingDetails(listing, product, canonicalUrl);

  const breadcrumb: SchemaObject = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Trang chủ", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: product.type === "rent" ? "Cho Thuê" : "Mua Bán",
        item: `${SITE_URL}/san-pham`,
      },
      { "@type": "ListItem", position: 3, name: product.title, item: canonicalUrl },
    ],
  };

  return { listing, breadcrumb };
}

export function createProjectSchemas(project: Project, slug: string) {
  const canonicalUrl = `${SITE_URL}/du-an/${slug || generateSlug(project.title)}`;
  const webPageId = `${canonicalUrl}#webpage`;
  const listingId = `${canonicalUrl}#real-estate-listing`;
  const breadcrumbId = `${canonicalUrl}#breadcrumb`;
  const description = plainText(project.description).slice(0, 160);
  const images = (project.imageUrls?.length
    ? project.imageUrls
    : [project.imageUrl || "/no-image.svg"]
  ).map(absoluteImageUrl);

  const listing: SchemaObject = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": listingId,
    url: canonicalUrl,
    mainEntityOfPage: { "@id": webPageId },
    name: project.title,
    image: images,
    description,
    address: {
      "@type": "PostalAddress",
      streetAddress: project.location || undefined,
      addressRegion: "Hồ Chí Minh",
      addressCountry: "VN",
    },
  };
  addListingDetails(listing, project, canonicalUrl);

  const breadcrumb: SchemaObject = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": breadcrumbId,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Trang chủ", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Dự án", item: `${SITE_URL}/du-an` },
      { "@type": "ListItem", position: 3, name: project.title, item: canonicalUrl },
    ],
  };

  const subdivisionHtml = project.subdivisionTab || "";
  const hasSubdivisionContent = Boolean(
    project.subdivisionsCards?.some(
      (card) => card.name?.trim() || card.imageUrl?.trim(),
    ) ||
      plainText(subdivisionHtml) ||
      /<(?:img|iframe)\b/i.test(subdivisionHtml),
  );
  const sectionNames: Array<[string, string]> = [
    ["overview", `Tổng quan dự án ${project.title}`],
    ...(hasSubdivisionContent
      ? [["subdivision", `Phân khu ${project.title}`] as [string, string]]
      : []),
    ["location", `Vị trí ${project.title}`],
    ["amenity", `Tiện ích ${project.title}`],
    ["floor-plan", `Mặt bằng ${project.title}`],
    ["price", `Giá bán ${project.title}`],
    ["qa", `Hỏi đáp ${project.title}`],
    ["news", `Tin tức dự án ${project.title}`],
    ["contact", `Liên hệ tư vấn ${project.title}`],
  ];

  const webPage: SchemaObject = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": webPageId,
    url: canonicalUrl,
    name: project.title,
    description,
    inLanguage: "vi-VN",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    breadcrumb: { "@id": breadcrumbId },
    mainEntity: { "@id": listingId },
    hasPart: sectionNames.map(([id, name]) => ({
      "@type": "WebPageElement",
      "@id": `${canonicalUrl}#${id}`,
      url: `${canonicalUrl}#${id}`,
      name,
    })),
  };

  return { listing, breadcrumb, webPage };
}

export function createNewsSchemas(article: News, slug: string) {
  const canonicalUrl = `${SITE_URL}/tin-tuc/${slug || generateSlug(article.title)}`;
  const articleSchema: SchemaObject = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    headline: article.title,
    image: [absoluteImageUrl(article.imageUrl)],
    datePublished: article.createdAt,
    dateModified: article.updatedAt || article.createdAt,
    author: [{ "@type": "Person", name: article.author || "Greenia Admin" }],
    publisher: {
      "@type": "Organization",
      name: "Greenia Homes",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon.webp` },
    },
    description: plainText(article.description).slice(0, 160),
  };

  const breadcrumb: SchemaObject = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Trang chủ", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Tin tức", item: `${SITE_URL}/tin-tuc` },
      {
        "@type": "ListItem",
        position: 3,
        name: article.category || "Danh mục",
        item: `${SITE_URL}/category-news/${generateSlug(article.category || "")}`,
      },
      { "@type": "ListItem", position: 4, name: article.title, item: canonicalUrl },
    ],
  };

  return { article: articleSchema, breadcrumb };
}
