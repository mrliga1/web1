import { optimizeImageUrl } from "./utils";

const BLOCKED_CONTAINER_TAGS = /<\s*(script|object|embed)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;
const BLOCKED_STANDALONE_TAGS = /<\s*\/?\s*(script|object|embed|base|meta|link)\b[^>]*>/gi;
const EVENT_HANDLER_ATTRIBUTES = /\s+on[a-z][\w:-]*\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const SRCDOC_ATTRIBUTE = /\s+srcdoc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const URI_ATTRIBUTE = /\s+(href|src|xlink:href|formaction)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const IMAGE_WITHOUT_ALT_ATTRIBUTE = /<img\b(?![^>]*\balt\s*=)([^>]*)>/gi;
const IFRAME_WITHOUT_TITLE_ATTRIBUTE = /<iframe\b(?![^>]*\btitle\s*=)([^>]*)>/gi;
const IFRAME_WITHOUT_LOADING_ATTRIBUTE = /<iframe\b(?![^>]*\bloading\s*=)([^>]*)>/gi;
const IMAGE_SRC_ATTRIBUTE = /(<img\b[^>]*\bsrc\s*=\s*)(["'])([^"']+)\2/gi;

function getAltFromImageAttributes(attributes: string) {
  const srcMatch = attributes.match(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  const source = srcMatch?.[1] || srcMatch?.[2] || srcMatch?.[3] || "";
  if (!source || /^(data:|blob:)/i.test(source)) return "Hình ảnh";
  try {
    let originalSource = source;
    const parsedSource = new URL(source, "https://greeniahomes.vn");
    if (parsedSource.hostname === "wsrv.nl" && parsedSource.searchParams.get("url")) {
      originalSource = parsedSource.searchParams.get("url") || source;
    }
    const pathname = new URL(originalSource, "https://greeniahomes.vn").pathname;
    return decodeURIComponent(pathname.split("/").pop() || "")
      .replace(/\.[a-z0-9]{2,5}$/i, "")
      .replace(/^\d{10,16}[-_]?/, "")
      .replace(/[-_ ]\d{10,16}$/, "")
      .replace(/[-_]+/g, " ")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .trim() || "Hình ảnh";
  } catch {
    return "Hình ảnh";
  }
}

function isUnsafeUri(rawValue: string) {
  const value = rawValue.replace(/^['"]|['"]$/g, "").trim();
  const compactValue = value.replace(/[\u0000-\u0020]+/g, "").toLowerCase();

  return (
    compactValue.startsWith("javascript:") ||
    compactValue.startsWith("vbscript:") ||
    compactValue.startsWith("data:text/html")
  );
}

export function sanitizeRichHtml(value: unknown) {
  if (typeof value !== "string" || !value) return "";

  return value
    .replace(BLOCKED_CONTAINER_TAGS, "")
    .replace(BLOCKED_STANDALONE_TAGS, "")
    .replace(EVENT_HANDLER_ATTRIBUTES, "")
    .replace(SRCDOC_ATTRIBUTE, "")
    .replace(URI_ATTRIBUTE, (attribute, name: string, uri: string) => {
      return isUnsafeUri(uri) ? "" : ` ${name}=${uri}`;
    })
    .replace(IMAGE_SRC_ATTRIBUTE, (_attribute, prefix: string, quote: string, source: string) => {
      const optimizedSource = /^https?:/i.test(source) ? optimizeImageUrl(source, 1200) : source;
      return `${prefix}${quote}${optimizedSource}${quote}`;
    })
    .replace(IMAGE_WITHOUT_ALT_ATTRIBUTE, (_tag, attributes: string) => {
      return `<img alt="${getAltFromImageAttributes(attributes)}"${attributes}>`;
    })
    .replace(IFRAME_WITHOUT_TITLE_ATTRIBUTE, '<iframe title="Bản đồ và nội dung nhúng"$1>')
    .replace(IFRAME_WITHOUT_LOADING_ATTRIBUTE, '<iframe loading="lazy"$1>')
    // Giữ nguyên kiểu hiển thị H1 nhưng hạ cấp trong cây trợ năng của nội dung nhúng.
    .replace(/<h1(?![^>]*\baria-level\s*=)/gi, '<h1 aria-level="2"');
}
