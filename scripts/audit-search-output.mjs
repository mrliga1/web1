const DEFAULT_BASE_URL = "http://127.0.0.1:3100";
const PRODUCTION_ORIGIN = "https://greeniahomes.vn";
const BASE_URL = (process.env.SEARCH_AUDIT_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function getTagContent(html, tagName) {
  const match = html.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? decodeHtml(match[1].replace(/<[^>]+>/g, " ")) : "";
}

function getMetaContent(html, name) {
  const tags = html.match(/<meta\s+[^>]*>/gi) || [];
  for (const tag of tags) {
    const keyMatch = tag.match(/(?:name|property)=["']([^"']+)["']/i);
    if (!keyMatch || keyMatch[1].toLowerCase() !== name.toLowerCase()) continue;
    const contentMatch = tag.match(/content=["']([^"']*)["']/i);
    return contentMatch ? decodeHtml(contentMatch[1]) : "";
  }
  return "";
}

function getCanonical(html) {
  const tags = html.match(/<link\s+[^>]*>/gi) || [];
  for (const tag of tags) {
    if (!/rel=["']canonical["']/i.test(tag)) continue;
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
    return hrefMatch ? decodeHtml(hrefMatch[1]) : "";
  }
  return "";
}

function collectSchemaTypes(value, types = new Set()) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectSchemaTypes(item, types));
    return types;
  }
  if (!value || typeof value !== "object") return types;

  const schemaType = value["@type"];
  if (Array.isArray(schemaType)) schemaType.forEach((item) => types.add(String(item)));
  else if (schemaType) types.add(String(schemaType));

  Object.values(value).forEach((item) => collectSchemaTypes(item, types));
  return types;
}

function parseSchemaTypes(html) {
  const errors = [];
  const types = new Set();
  const pattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = pattern.exec(html))) {
    try {
      collectSchemaTypes(JSON.parse(match[1]), types);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  return { types, errors };
}

function getExpectedPrimarySchema(pathname) {
  if (pathname === "/") return "WebPage";
  if (pathname === "/lien-he") return "ContactPage";
  if (
    pathname === "/san-pham" ||
    pathname === "/du-an" ||
    pathname === "/tin-tuc" ||
    pathname === "/latest-sales" ||
    pathname === "/latest-rents" ||
    pathname.startsWith("/category-product/") ||
    pathname.startsWith("/category-news/")
  ) {
    return "CollectionPage";
  }
  return "WebPage";
}

function hasSuspiciousPublishedTitle(title) {
  return /^(?:test|text|kiểm tra)\b/i.test(title) || /\bh{10,}\b/i.test(title);
}

function getVisibleText(html) {
  return decodeHtml(
    html
      .replace(/<(?:script|style|noscript|svg)\b[\s\S]*?<\/(?:script|style|noscript|svg)>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "user-agent": "Greenia-Search-Audit/1.0" },
  });
  return { response, text: await response.text() };
}

async function main() {
  const sitemapResult = await fetchText(`${BASE_URL}/sitemap.xml`);
  if (!sitemapResult.response.ok) {
    throw new Error(`Không thể tải sitemap: HTTP ${sitemapResult.response.status}`);
  }

  const productionUrls = Array.from(
    sitemapResult.text.matchAll(/<loc>([^<]+)<\/loc>/g),
    (match) => decodeHtml(match[1]),
  );
  const urls = [...new Set(productionUrls)];
  const results = [];

  for (const productionUrl of urls) {
    const parsedProductionUrl = new URL(productionUrl);
    const localUrl = `${BASE_URL}${parsedProductionUrl.pathname}${parsedProductionUrl.search}`;
    const { response, text: html } = await fetchText(localUrl);
    const title = getTagContent(html, "title");
    const description = getMetaContent(html, "description");
    const canonical = getCanonical(html);
    const robots = getMetaContent(html, "robots");
    const h1Count = (html.match(/<h1\b/gi) || []).length;
    const visibleText = getVisibleText(html);
    const schemas = parseSchemaTypes(html);
    const errors = [];
    const warnings = [];
    const expectedCanonical = `${PRODUCTION_ORIGIN}${parsedProductionUrl.pathname}`;
    const expectedPrimarySchema = getExpectedPrimarySchema(parsedProductionUrl.pathname);

    if (!response.ok) errors.push(`HTTP ${response.status}`);
    if (!title) errors.push("Thiếu title");
    if (!description) errors.push("Thiếu meta description");
    if (!canonical) errors.push("Thiếu canonical");
    else if (canonical.replace(/\/$/, "") !== expectedCanonical.replace(/\/$/, "")) {
      errors.push(`Canonical sai: ${canonical}`);
    }
    if (/noindex/i.test(robots)) errors.push("URL sitemap đang bị noindex");
    if (schemas.errors.length) errors.push(`JSON-LD lỗi: ${schemas.errors.join("; ")}`);
    if (!schemas.types.has(expectedPrimarySchema)) {
      errors.push(`Thiếu schema ${expectedPrimarySchema}`);
    }
    if (parsedProductionUrl.pathname !== "/" && !schemas.types.has("BreadcrumbList")) {
      errors.push("Thiếu schema BreadcrumbList");
    }
    if (h1Count !== 1) warnings.push(`Số H1: ${h1Count}`);
    if (description && (description.length < 70 || description.length > 170)) {
      warnings.push(`Độ dài description: ${description.length}`);
    }
    if (hasSuspiciousPublishedTitle(title)) warnings.push("Tiêu đề có dấu hiệu dữ liệu thử nghiệm");
    if (/\b([a-zà-ỹ])\1{9,}\b/iu.test(visibleText)) {
      warnings.push("Nội dung có chuỗi ký tự lặp, nghi là dữ liệu thử nghiệm");
    }

    results.push({
      path: parsedProductionUrl.pathname,
      status: response.status,
      title,
      schemaCount: schemas.types.size,
      errors,
      warnings,
    });
  }

  const errorCount = results.reduce((total, item) => total + item.errors.length, 0);
  const warningCount = results.reduce((total, item) => total + item.warnings.length, 0);
  console.table(
    results.map((item) => ({
      URL: item.path,
      HTTP: item.status,
      Schema: item.schemaCount,
      Lỗi: item.errors.length,
      "Cảnh báo": item.warnings.length,
    })),
  );

  for (const item of results.filter((result) => result.errors.length || result.warnings.length)) {
    console.log(`\n${item.path}`);
    item.errors.forEach((error) => console.log(`  LỖI: ${error}`));
    item.warnings.forEach((warning) => console.log(`  CẢNH BÁO: ${warning}`));
  }

  console.log(`\nĐã kiểm tra ${results.length} URL: ${errorCount} lỗi, ${warningCount} cảnh báo.`);
  if (errorCount > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error("Kiểm tra đầu ra tìm kiếm thất bại:", error);
  process.exitCode = 1;
});
