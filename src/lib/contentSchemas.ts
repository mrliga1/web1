import type { News, Product, Project } from "../types";
import { SITE_URL } from "./internalLinks";
import { getSearchIntentProfile, getSemanticTerms } from "./searchIntent";
import { generateSlug } from "./utils";

export type SchemaObject = Record<string, unknown>;

export interface CollectionSchemaItem {
  name: string;
  url: string;
  image?: string;
  description?: string;
}

interface PageSchemaOptions {
  path: string;
  name: string;
  description: string;
  topics?: string[];
  breadcrumbs?: Array<{ name: string; path: string }>;
}

interface CollectionPageSchemaOptions extends PageSchemaOptions {
  items: CollectionSchemaItem[];
}

function plainText(value: string | undefined) {
  return (value || "").replace(/<[^>]*>?/g, " ").replace(/\s+/g, " ").trim();
}

function absoluteImageUrl(value: string | undefined) {
  const image = value || "/no-image.svg";
  if (/^https?:\/\//i.test(image)) return image;
  return `${SITE_URL}${image.startsWith("/") ? image : `/${image}`}`;
}

function absoluteUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return `${SITE_URL}${value.startsWith("/") ? value : `/${value}`}`;
}

function createBreadcrumbSchema(
  canonicalUrl: string,
  breadcrumbs: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${canonicalUrl}#breadcrumb`,
    itemListElement: breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  } satisfies SchemaObject;
}

function createBasePageSchema({
  path,
  name,
  description,
  topics = [],
}: PageSchemaOptions): SchemaObject {
  const canonicalUrl = absoluteUrl(path);
  const profile = getSearchIntentProfile(path);
  const semanticTerms = getSemanticTerms({
    path,
    title: name,
    attributes: topics,
    limit: 18,
  });

  return {
    "@context": "https://schema.org",
    "@type": profile.schemaType,
    "@id": `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name,
    description,
    inLanguage: "vi-VN",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    breadcrumb: { "@id": `${canonicalUrl}#breadcrumb` },
    audience: {
      "@type": "Audience",
      audienceType: profile.audience,
    },
    about: semanticTerms.slice(0, 10).map((term) => ({
      "@type": "Thing",
      name: term,
    })),
    keywords: semanticTerms.join(", "),
    relatedLink: profile.relatedPaths.map(absoluteUrl),
  };
}

export function createWebPageSchemas(options: PageSchemaOptions) {
  const canonicalUrl = absoluteUrl(options.path);
  return {
    webPage: createBasePageSchema(options),
    breadcrumb: createBreadcrumbSchema(canonicalUrl, options.breadcrumbs || []),
  };
}

export function createCollectionPageSchemas({
  items,
  ...pageOptions
}: CollectionPageSchemaOptions) {
  const canonicalUrl = absoluteUrl(pageOptions.path);
  const itemListId = `${canonicalUrl}#item-list`;
  const webPage = createBasePageSchema(pageOptions);
  webPage.mainEntity = { "@id": itemListId };

  const itemList: SchemaObject = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": itemListId,
    name: pageOptions.name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(item.url),
      name: item.name,
      ...(item.image ? { image: absoluteImageUrl(item.image) } : {}),
      ...(item.description ? { description: plainText(item.description).slice(0, 160) } : {}),
    })),
  };

  return {
    webPage,
    itemList,
    breadcrumb: createBreadcrumbSchema(canonicalUrl, pageOptions.breadcrumbs || []),
  };
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
      seller: { "@id": `${SITE_URL}/#organization` },
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
  const webPageId = `${canonicalUrl}#webpage`;
  const listingId = `${canonicalUrl}#real-estate-listing`;
  const breadcrumbId = `${canonicalUrl}#breadcrumb`;
  const description =
    plainText(product.description).slice(0, 160) ||
    `${product.title} tại ${product.district || product.location || "Việt Nam"}.`;
  const images = (product.imageUrls?.length
    ? product.imageUrls
    : [product.imageUrl || "/no-image.svg"]
  ).map(absoluteImageUrl);
  const semanticTerms = getSemanticTerms({
    path: canonicalUrl,
    title: product.title,
    category: product.category,
    location: product.district || product.location,
    attributes: [
      product.type === "rent" ? "bất động sản cho thuê" : "bất động sản chuyển nhượng",
      product.legalStatus,
      product.interior,
    ],
    customKeywords: product.seoKeywords || product.metaKeywords,
    limit: 18,
  });

  const listing: SchemaObject = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": listingId,
    url: canonicalUrl,
    mainEntityOfPage: { "@id": webPageId },
    name: product.title,
    image: images,
    description,
    datePosted: product.createdAt,
    seller: { "@id": `${SITE_URL}/#organization` },
    address: {
      "@type": "PostalAddress",
      streetAddress: product.street || undefined,
      addressLocality: product.district || product.location || undefined,
      addressCountry: "VN",
    },
    numberOfRooms: product.bedrooms || undefined,
    numberOfBedrooms: product.bedrooms || undefined,
    numberOfBathroomsTotal: product.toilets || undefined,
    floorSize: product.area
      ? { "@type": "QuantitativeValue", value: product.area, unitCode: "MTK" }
      : undefined,
    category: product.category || undefined,
    keywords: semanticTerms.join(", "),
  };
  addListingDetails(listing, product, canonicalUrl);

  const breadcrumb = createBreadcrumbSchema(canonicalUrl, [
    { name: "Trang chủ", path: "/" },
    {
      name: product.type === "rent" ? "Bất động sản cho thuê" : "Bất động sản chuyển nhượng",
      path: "/san-pham",
    },
    { name: product.title, path: canonicalUrl },
  ]);

  const webPage = createBasePageSchema({
    path: canonicalUrl,
    name: product.title,
    description,
    topics: [
      product.category,
      product.district || product.location,
      product.type === "rent" ? "Bất động sản cho thuê" : "Bất động sản chuyển nhượng",
    ].filter(Boolean) as string[],
  });
  webPage.mainEntity = { "@id": listingId };
  webPage.breadcrumb = { "@id": breadcrumbId };

  return { listing, breadcrumb, webPage };
}

export function createProjectSchemas(project: Project, slug: string) {
  const canonicalUrl = `${SITE_URL}/du-an/${slug || generateSlug(project.title)}`;
  const webPageId = `${canonicalUrl}#webpage`;
  const listingId = `${canonicalUrl}#real-estate-listing`;
  const breadcrumbId = `${canonicalUrl}#breadcrumb`;
  const description =
    plainText(project.description).slice(0, 160) ||
    `${project.title} tại ${project.location || "Việt Nam"}.`;
  const images = (project.imageUrls?.length
    ? project.imageUrls
    : [project.imageUrl || "/no-image.svg"]
  ).map(absoluteImageUrl);
  const semanticTerms = getSemanticTerms({
    path: canonicalUrl,
    title: project.title,
    location: project.location,
    attributes: [
      project.developer,
      project.productType,
      project.status,
      project.ownership,
    ],
    customKeywords: project.seoKeywords || project.metaKeywords,
    limit: 20,
  });

  const listing: SchemaObject = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": listingId,
    url: canonicalUrl,
    mainEntityOfPage: { "@id": webPageId },
    name: project.title,
    image: images,
    description,
    seller: { "@id": `${SITE_URL}/#organization` },
    address: {
      "@type": "PostalAddress",
      streetAddress: project.location || undefined,
      addressCountry: "VN",
    },
    category: project.productType || "Dự án bất động sản",
    keywords: semanticTerms.join(", "),
  };
  addListingDetails(listing, project, canonicalUrl);

  const breadcrumb = createBreadcrumbSchema(canonicalUrl, [
    { name: "Trang chủ", path: "/" },
    { name: "Dự án", path: "/du-an" },
    { name: project.title, path: canonicalUrl },
  ]);

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

  const webPage = createBasePageSchema({
    path: canonicalUrl,
    name: project.title,
    description,
    topics: [project.location, project.developer, project.productType].filter(Boolean) as string[],
  });
  webPage.mainEntity = { "@id": listingId };
  webPage.breadcrumb = { "@id": breadcrumbId };
  webPage.hasPart = sectionNames.map(([id, name]) => ({
    "@type": "WebPageElement",
    "@id": `${canonicalUrl}#${id}`,
    url: `${canonicalUrl}#${id}`,
    name,
  }));

  return { listing, breadcrumb, webPage };
}

export function createNewsSchemas(article: News, slug: string) {
  const canonicalUrl = `${SITE_URL}/tin-tuc/${slug || generateSlug(article.title)}`;
  const articleId = `${canonicalUrl}#article`;
  const description = plainText(article.description || article.content).slice(0, 160);
  const semanticTerms = getSemanticTerms({
    path: canonicalUrl,
    title: article.title,
    category: article.category,
    customKeywords: article.seoKeywords || article.metaKeywords,
    limit: 18,
  });

  const articleSchema: SchemaObject = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": articleId,
    url: canonicalUrl,
    mainEntityOfPage: { "@id": `${canonicalUrl}#webpage` },
    headline: article.title,
    image: [absoluteImageUrl(article.imageUrl)],
    datePublished: article.createdAt,
    dateModified: article.updatedAt || article.createdAt,
    author: article.author
      ? [{ "@type": "Person", name: article.author }]
      : [{ "@id": `${SITE_URL}/#organization` }],
    publisher: { "@id": `${SITE_URL}/#organization` },
    articleSection: article.category || undefined,
    keywords: semanticTerms.join(", "),
    description,
  };

  const categoryPath = article.category
    ? `/category-news/${generateSlug(article.category)}`
    : "/tin-tuc";
  const breadcrumb = createBreadcrumbSchema(canonicalUrl, [
    { name: "Trang chủ", path: "/" },
    { name: "Tin tức", path: "/tin-tuc" },
    { name: article.category || "Tin tức", path: categoryPath },
    { name: article.title, path: canonicalUrl },
  ]);

  const webPage = createBasePageSchema({
    path: canonicalUrl,
    name: article.title,
    description,
    topics: [article.category].filter(Boolean),
  });
  webPage.mainEntity = { "@id": articleId };

  return { article: articleSchema, breadcrumb, webPage };
}
