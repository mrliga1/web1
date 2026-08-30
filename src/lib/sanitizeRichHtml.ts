import { generateSrcSet, optimizeImageUrl } from "./utils";

const BLOCKED_CONTAINER_TAGS = /<\s*(script|object|embed)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;
const BLOCKED_STANDALONE_TAGS = /<\s*\/?\s*(script|object|embed|base|meta|link)\b[^>]*>/gi;
const EVENT_HANDLER_ATTRIBUTES = /\s+on[a-z][\w:-]*\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const SRCDOC_ATTRIBUTE = /\s+srcdoc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const URI_ATTRIBUTE = /\s+(href|src|xlink:href|formaction)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const IMAGE_WITHOUT_ALT_ATTRIBUTE = /<img\b(?![^>]*\balt\s*=)([^>]*)>/gi;
const IMAGE_WITHOUT_LOADING_ATTRIBUTE = /<img\b(?![^>]*\bloading\s*=)([^>]*)>/gi;
const IMAGE_WITHOUT_DECODING_ATTRIBUTE = /<img\b(?![^>]*\bdecoding\s*=)([^>]*)>/gi;
const IMAGE_WITHOUT_WIDTH_ATTRIBUTE = /<img\b(?![^>]*\bwidth\s*=)([^>]*)>/gi;
const IMAGE_WITHOUT_HEIGHT_ATTRIBUTE = /<img\b(?![^>]*\bheight\s*=)([^>]*)>/gi;
const IFRAME_WITHOUT_TITLE_ATTRIBUTE = /<iframe\b(?![^>]*\btitle\s*=)([^>]*)>/gi;
const IFRAME_WITHOUT_LOADING_ATTRIBUTE = /<iframe\b(?![^>]*\bloading\s*=)([^>]*)>/gi;
const IMAGE_TAG = /<img\b[^>]*>/gi;
const HEADING_OPEN_TAG = /<(h[1-6])\b([^>]*)>/gi;

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

  let previousHeadingLevel = 1;

  return value
    .replace(BLOCKED_CONTAINER_TAGS, "")
    .replace(BLOCKED_STANDALONE_TAGS, "")
    .replace(EVENT_HANDLER_ATTRIBUTES, "")
    .replace(SRCDOC_ATTRIBUTE, "")
    .replace(URI_ATTRIBUTE, (attribute, name: string, uri: string) => {
      return isUnsafeUri(uri) ? "" : ` ${name}=${uri}`;
    })
    .replace(IMAGE_WITHOUT_ALT_ATTRIBUTE, (_tag, attributes: string) => {
      return `<img alt="${getAltFromImageAttributes(attributes)}"${attributes}>`;
    })
    .replace(IMAGE_TAG, (tag: string) => {
      const sourceMatch = tag.match(/\bsrc\s*=\s*(["'])([^"']+)\1/i);
      const source = sourceMatch?.[2];
      if (!source || /^(data:|blob:)/i.test(source)) return tag;

      const optimizedSource = optimizeImageUrl(source, 1200) || source;
      let responsiveTag = tag.replace(
        /\bsrc\s*=\s*(["'])[^"']+\1/i,
        `src="${optimizedSource}"`,
      );
      const srcSet = generateSrcSet(source);
      if (srcSet && !/\bsrcset\s*=/i.test(responsiveTag)) {
        responsiveTag = responsiveTag.replace(/\s*\/>$|>$/, ` srcset="${srcSet}">`);
      }
      if (!/\bsizes\s*=/i.test(responsiveTag)) {
        responsiveTag = responsiveTag.replace(
          /\s*\/>$|>$/,
          ' sizes="(max-width: 767px) 100vw, (max-width: 1279px) 90vw, 1200px">',
        );
      }
      return responsiveTag;
    })
    .replace(IMAGE_WITHOUT_WIDTH_ATTRIBUTE, '<img width="1200"$1>')
    .replace(IMAGE_WITHOUT_HEIGHT_ATTRIBUTE, '<img height="675"$1>')
    .replace(IMAGE_WITHOUT_LOADING_ATTRIBUTE, '<img loading="lazy"$1>')
    .replace(IMAGE_WITHOUT_DECODING_ATTRIBUTE, '<img decoding="async"$1>')
    .replace(IFRAME_WITHOUT_TITLE_ATTRIBUTE, '<iframe title="Bản đồ và nội dung nhúng"$1>')
    .replace(IFRAME_WITHOUT_LOADING_ATTRIBUTE, '<iframe loading="lazy"$1>')
    .replace(HEADING_OPEN_TAG, (_tag, headingTag: string, attributes: string) => {
      const sourceLevel = Number(headingTag.slice(1));
      const requestedLevel = sourceLevel === 1 ? 2 : sourceLevel;
      const semanticLevel = Math.min(requestedLevel, previousHeadingLevel + 1);
      previousHeadingLevel = semanticLevel;
      const cleanAttributes = attributes.replace(/\s+aria-level\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
      return `<${headingTag} aria-level="${semanticLevel}"${cleanAttributes}>`;
    });
}
