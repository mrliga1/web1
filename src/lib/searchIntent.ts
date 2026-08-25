export type SearchIntent =
  | "navigational"
  | "informational"
  | "commercial"
  | "transactional"
  | "local";

export type SemanticPageType =
  | "home"
  | "product-hub"
  | "product-category"
  | "product-detail"
  | "project-hub"
  | "project-detail"
  | "news-hub"
  | "news-category"
  | "news-detail"
  | "contact"
  | "legal";

export interface SearchIntentProfile {
  pageType: SemanticPageType;
  primaryIntent: SearchIntent;
  secondaryIntents: SearchIntent[];
  schemaType: "WebPage" | "CollectionPage" | "ContactPage";
  primaryTopic: string;
  audience: string;
  entities: string[];
  semanticTerms: string[];
  relatedPaths: string[];
}

export interface SemanticTermInput {
  path: string;
  title?: string;
  category?: string;
  location?: string;
  attributes?: Array<string | number | null | undefined>;
  customKeywords?: string | string[];
  limit?: number;
}

interface SearchDescriptionInput {
  path: string;
  source?: string;
  fallback: string;
}

const HOME_PROFILE: SearchIntentProfile = {
  pageType: "home",
  primaryIntent: "navigational",
  secondaryIntents: ["commercial", "local"],
  schemaType: "WebPage",
  primaryTopic: "Greenia Homes",
  audience: "Người mua, bán, thuê và đầu tư bất động sản tại TP.HCM",
  entities: ["Greenia Homes", "TP.HCM", "Phú Mỹ Hưng", "Quận 7"],
  semanticTerms: [
    "cố vấn đầu tư bất động sản",
    "tư vấn mua bán nhà đất",
    "chuyển nhượng bất động sản",
    "cho thuê bất động sản",
    "pháp lý bất động sản",
  ],
  relatedPaths: ["/san-pham", "/du-an", "/tin-tuc", "/lien-he"],
};

const PRODUCT_HUB_PROFILE: SearchIntentProfile = {
  pageType: "product-hub",
  primaryIntent: "commercial",
  secondaryIntents: ["transactional", "local"],
  schemaType: "CollectionPage",
  primaryTopic: "Bất động sản",
  audience: "Người đang tìm mua, chuyển nhượng hoặc thuê bất động sản",
  entities: ["Bất động sản", "Căn hộ", "Nhà phố", "Biệt thự", "TP.HCM"],
  semanticTerms: [
    "mua bán nhà đất",
    "bất động sản chuyển nhượng",
    "bất động sản cho thuê",
    "giá bán bất động sản",
    "diện tích và pháp lý nhà đất",
  ],
  relatedPaths: ["/latest-sales", "/latest-rents", "/du-an", "/lien-he"],
};

const PRODUCT_CATEGORY_PROFILE: SearchIntentProfile = {
  ...PRODUCT_HUB_PROFILE,
  pageType: "product-category",
  primaryTopic: "Danh mục bất động sản",
};

const PRODUCT_DETAIL_PROFILE: SearchIntentProfile = {
  ...PRODUCT_HUB_PROFILE,
  pageType: "product-detail",
  primaryIntent: "transactional",
  secondaryIntents: ["commercial", "local"],
  schemaType: "WebPage",
  primaryTopic: "Chi tiết bất động sản",
  semanticTerms: [
    "giá bán hoặc giá thuê",
    "vị trí bất động sản",
    "diện tích sử dụng",
    "số phòng ngủ",
    "tình trạng pháp lý",
    "liên hệ tư vấn",
  ],
  relatedPaths: ["/san-pham", "/du-an", "/tin-tuc", "/lien-he"],
};

const PROJECT_HUB_PROFILE: SearchIntentProfile = {
  pageType: "project-hub",
  primaryIntent: "commercial",
  secondaryIntents: ["informational", "transactional", "local"],
  schemaType: "CollectionPage",
  primaryTopic: "Dự án bất động sản",
  audience: "Người tìm hiểu và so sánh dự án bất động sản",
  entities: ["Dự án bất động sản", "Chủ đầu tư", "TP.HCM", "Greenia Homes"],
  semanticTerms: [
    "vị trí dự án",
    "quy mô dự án",
    "tiến độ dự án",
    "pháp lý dự án",
    "giá bán dự án",
    "tiện ích và mặt bằng",
  ],
  relatedPaths: ["/san-pham", "/tin-tuc", "/lien-he"],
};

const PROJECT_DETAIL_PROFILE: SearchIntentProfile = {
  ...PROJECT_HUB_PROFILE,
  pageType: "project-detail",
  primaryIntent: "informational",
  secondaryIntents: ["commercial", "transactional", "local"],
  schemaType: "WebPage",
  primaryTopic: "Thông tin dự án bất động sản",
  semanticTerms: [
    "tổng quan dự án",
    "chủ đầu tư",
    "vị trí và kết nối",
    "phân khu",
    "tiện ích",
    "mặt bằng",
    "giá bán và chính sách",
    "tiến độ và pháp lý",
    "tư vấn dự án",
  ],
};

const NEWS_HUB_PROFILE: SearchIntentProfile = {
  pageType: "news-hub",
  primaryIntent: "informational",
  secondaryIntents: ["commercial", "local"],
  schemaType: "CollectionPage",
  primaryTopic: "Tin tức bất động sản",
  audience: "Người theo dõi thị trường và kiến thức giao dịch bất động sản",
  entities: ["Thị trường bất động sản", "Greenia Homes", "TP.HCM"],
  semanticTerms: [
    "tin thị trường bất động sản",
    "phân tích dự án",
    "kiến thức mua bán nhà đất",
    "pháp lý bất động sản",
    "xu hướng đầu tư",
  ],
  relatedPaths: ["/du-an", "/san-pham", "/lien-he"],
};

const NEWS_CATEGORY_PROFILE: SearchIntentProfile = {
  ...NEWS_HUB_PROFILE,
  pageType: "news-category",
  primaryTopic: "Chuyên mục tin tức bất động sản",
};

const NEWS_DETAIL_PROFILE: SearchIntentProfile = {
  ...NEWS_HUB_PROFILE,
  pageType: "news-detail",
  schemaType: "WebPage",
  primaryTopic: "Bài viết bất động sản",
  semanticTerms: [
    "thông tin bất động sản",
    "phân tích thị trường",
    "thông tin dự án",
    "kinh nghiệm giao dịch",
  ],
};

const CONTACT_PROFILE: SearchIntentProfile = {
  pageType: "contact",
  primaryIntent: "transactional",
  secondaryIntents: ["navigational", "local"],
  schemaType: "ContactPage",
  primaryTopic: "Liên hệ tư vấn bất động sản",
  audience: "Khách hàng cần tư vấn, ký gửi hoặc giao dịch bất động sản",
  entities: ["Greenia Homes", "Quận 7", "TP.HCM"],
  semanticTerms: [
    "hotline tư vấn bất động sản",
    "đăng ký tư vấn mua nhà",
    "ký gửi bất động sản",
    "địa chỉ Greenia Homes",
  ],
  relatedPaths: ["/san-pham", "/du-an", "/tin-tuc"],
};

const LEGAL_PROFILE: SearchIntentProfile = {
  pageType: "legal",
  primaryIntent: "informational",
  secondaryIntents: ["navigational"],
  schemaType: "WebPage",
  primaryTopic: "Thông tin pháp lý website",
  audience: "Người sử dụng website Greenia Homes",
  entities: ["Greenia Homes", "Dữ liệu cá nhân", "Điều khoản dịch vụ"],
  semanticTerms: ["quyền riêng tư", "bảo vệ dữ liệu", "quy định sử dụng website"],
  relatedPaths: ["/lien-he"],
};

const STATIC_PROFILES: Record<string, SearchIntentProfile> = {
  "/": HOME_PROFILE,
  "/san-pham": PRODUCT_HUB_PROFILE,
  "/latest-sales": PRODUCT_HUB_PROFILE,
  "/latest-rents": PRODUCT_HUB_PROFILE,
  "/du-an": PROJECT_HUB_PROFILE,
  "/tin-tuc": NEWS_HUB_PROFILE,
  "/lien-he": CONTACT_PROFILE,
  "/chinh-sach-bao-mat": LEGAL_PROFILE,
  "/dieu-khoan-su-dung": LEGAL_PROFILE,
};

function normalizePath(path: string) {
  try {
    const pathname = path.startsWith("http") ? new URL(path).pathname : path.split(/[?#]/, 1)[0];
    if (!pathname || pathname === "/") return "/";
    return `/${pathname.replace(/^\/+|\/+$/g, "")}`;
  } catch {
    return "/";
  }
}

function splitCustomKeywords(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value;
  return value ? value.split(/[,;\n|]+/) : [];
}

function normalizeTerm(value: string | number | null | undefined) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function plainText(value: string | undefined) {
  return normalizeTerm((value || "").replace(/<[^>]*>?/g, " "));
}

function trimDescription(value: string, limit = 165) {
  if (value.length <= limit) return value;
  const shortened = value.slice(0, limit + 1);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, lastSpace > 120 ? lastSpace : limit).replace(/[\s,;:.!?-]+$/, "")}…`;
}

export function getSearchIntentProfile(path: string): SearchIntentProfile {
  const normalizedPath = normalizePath(path);
  const staticProfile = STATIC_PROFILES[normalizedPath];
  if (staticProfile) return staticProfile;

  if (normalizedPath.startsWith("/category-product/")) return PRODUCT_CATEGORY_PROFILE;
  if (normalizedPath.startsWith("/san-pham/")) return PRODUCT_DETAIL_PROFILE;
  if (normalizedPath.startsWith("/du-an/")) return PROJECT_DETAIL_PROFILE;
  if (normalizedPath.startsWith("/category-news/")) return NEWS_CATEGORY_PROFILE;
  if (normalizedPath.startsWith("/tin-tuc/")) return NEWS_DETAIL_PROFILE;

  return HOME_PROFILE;
}

export function getSemanticTerms({
  path,
  title,
  category,
  location,
  attributes = [],
  customKeywords,
  limit = 30,
}: SemanticTermInput) {
  const profile = getSearchIntentProfile(path);
  const candidates = [
    title,
    category,
    location,
    ...attributes,
    ...splitCustomKeywords(customKeywords),
    profile.primaryTopic,
    ...profile.entities,
    ...profile.semanticTerms,
  ];
  const seen = new Set<string>();
  const terms: string[] = [];

  for (const candidate of candidates) {
    const term = normalizeTerm(candidate);
    if (term.length < 2) continue;
    const key = term.toLocaleLowerCase("vi-VN");
    if (seen.has(key)) continue;
    seen.add(key);
    terms.push(term);
    if (terms.length >= limit) break;
  }

  return terms;
}

export function createSearchDescription({
  path,
  source,
  fallback,
}: SearchDescriptionInput) {
  const profile = getSearchIntentProfile(path);
  const baseDescription = plainText(source) || plainText(fallback);
  if (baseDescription.length >= 70) return trimDescription(baseDescription);

  const suffixByType: Record<SemanticPageType, string> = {
    home: "Khám phá dịch vụ tư vấn bất động sản chuyên sâu và thông tin giao dịch minh bạch từ Greenia Homes.",
    "product-hub": "Xem vị trí, giá, diện tích, pháp lý và thông tin liên hệ được cập nhật tại Greenia Homes.",
    "product-category": "Xem vị trí, giá, diện tích, pháp lý và thông tin liên hệ được cập nhật tại Greenia Homes.",
    "product-detail": "Xem vị trí, giá, diện tích, pháp lý và đăng ký tư vấn trực tiếp với Greenia Homes.",
    "project-hub": "Tìm hiểu vị trí, quy mô, tiến độ, tiện ích và giá bán dự án tại Greenia Homes.",
    "project-detail": "Tìm hiểu vị trí, quy mô, tiến độ, tiện ích, mặt bằng và giá bán dự án tại Greenia Homes.",
    "news-hub": "Theo dõi phân tích thị trường, thông tin dự án và kiến thức giao dịch từ Greenia Homes.",
    "news-category": "Theo dõi phân tích thị trường, thông tin dự án và kiến thức giao dịch từ Greenia Homes.",
    "news-detail": "Đọc nội dung chi tiết, thông tin liên quan và cập nhật bất động sản từ Greenia Homes.",
    contact: "Đăng ký tư vấn mua bán, chuyển nhượng, cho thuê hoặc ký gửi bất động sản với Greenia Homes.",
    legal: "Tìm hiểu quyền, trách nhiệm và cách Greenia Homes bảo vệ thông tin của người sử dụng website.",
  };
  const punctuation = /[.!?…]$/.test(baseDescription) ? "" : ".";
  return trimDescription(`${baseDescription}${punctuation} ${suffixByType[profile.pageType]}`);
}
