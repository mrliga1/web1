const BLOCKED_CONTAINER_TAGS = /<\s*(script|object|embed)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;
const BLOCKED_STANDALONE_TAGS = /<\s*\/?\s*(script|object|embed|base|meta|link)\b[^>]*>/gi;
const EVENT_HANDLER_ATTRIBUTES = /\s+on[a-z][\w:-]*\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const SRCDOC_ATTRIBUTE = /\s+srcdoc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const URI_ATTRIBUTE = /\s+(href|src|xlink:href|formaction)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;

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
    // Giữ nguyên kiểu hiển thị H1 nhưng hạ cấp trong cây trợ năng của nội dung nhúng.
    .replace(/<h1(?![^>]*\baria-level\s*=)/gi, '<h1 aria-level="2"');
}
