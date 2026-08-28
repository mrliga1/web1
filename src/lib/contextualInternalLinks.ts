export type InternalLinkType = "news" | "product" | "project";

export interface InternalLinkSourceItem {
  id: string;
  title: string;
  category?: string;
  description?: string;
  content?: string;
  seoKeywords?: string;
  metaKeywords?: string;
  imageUrl?: string;
  createdAt?: string;
  approvalStatus?: "approved" | "pending" | "rejected";
}

export interface InternalLinkTarget {
  id: string;
  type: InternalLinkType;
  title: string;
  url: string;
  category: string;
  description: string;
  content: string;
  keywords: string[];
  imageUrl: string;
  createdAt: string;
  aliases: string[];
}

export interface InternalLinkRecord {
  targetType: InternalLinkType;
  targetId: string;
  anchor: string;
  url: string;
  source: "automatic" | "related" | "manual";
}

export interface RelatedNewsSuggestion {
  target: InternalLinkTarget;
  score: number;
  reasons: string[];
}

export interface AmbiguousInternalLinkMatch {
  term: string;
  targets: InternalLinkTarget[];
}

const RELATED_TRIGGERS = [
  "có thể bạn quan tâm",
  "xem thêm",
  "bài viết liên quan",
] as const;

const INTERNAL_LINK_MARKER_PATTERN = /#gh-il-(automatic|related|manual)-(news|product|project)-([^#\s"'>]+)$/i;

const GENERIC_KEYWORDS = new Set([
  "bất động sản",
  "nhà đất",
  "dự án",
  "sản phẩm",
  "tin tức",
  "thị trường",
  "căn hộ",
  "nhà phố",
  "biệt thự",
  "mua bán",
  "cho thuê",
  "đầu tư",
]);

const STOP_WORDS = new Set([
  "và",
  "của",
  "cho",
  "tại",
  "trong",
  "với",
  "các",
  "một",
  "những",
  "được",
  "là",
  "về",
  "đến",
  "từ",
  "theo",
  "này",
  "mới",
  "nhất",
]);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function slugify(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("vi")
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTextPreservingLength(value: string) {
  return value
    .toLocaleLowerCase("vi")
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, " ");
}

function stripHtml(value: string) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function splitKeywords(value?: string) {
  if (!value) return [];
  return Array.from(
    new Set(
      value
        .split(/[,;|\n]+/)
        .map((keyword) => keyword.trim())
        .filter(Boolean),
    ),
  );
}

function isPublished(item: InternalLinkSourceItem) {
  return !item.approvalStatus || item.approvalStatus === "approved";
}

function isSpecificAlias(alias: string, source: "title" | "keyword") {
  const normalized = normalizeText(alias);
  if (!normalized || GENERIC_KEYWORDS.has(normalized)) return false;
  const words = normalized.split(" ").filter(Boolean);
  if (source === "title") return words.length >= 2 && normalized.length >= 8;
  return words.length >= 2 ? normalized.length >= 7 : normalized.length >= 8;
}

function createTargets(items: InternalLinkSourceItem[], type: InternalLinkType) {
  const route = type === "news" ? "tin-tuc" : type === "product" ? "san-pham" : "du-an";

  return items
    .filter((item) => item.id && item.title?.trim() && isPublished(item))
    .map<InternalLinkTarget>((item) => {
      const keywords = Array.from(
        new Set([...splitKeywords(item.seoKeywords), ...splitKeywords(item.metaKeywords)]),
      );
      const aliases = [
        ...(isSpecificAlias(item.title, "title") ? [item.title.trim()] : []),
        ...keywords.filter((keyword) => isSpecificAlias(keyword, "keyword")),
      ];

      return {
        id: item.id,
        type,
        title: item.title.trim(),
        url: `/${route}/${slugify(item.title)}`,
        category: item.category?.trim() || "",
        description: item.description || "",
        content: item.content || "",
        keywords,
        imageUrl: item.imageUrl || "",
        createdAt: item.createdAt || "",
        aliases: Array.from(new Set(aliases)),
      };
    });
}

export function buildInternalLinkTargets(input: {
  news?: InternalLinkSourceItem[];
  products?: InternalLinkSourceItem[];
  projects?: InternalLinkSourceItem[];
  currentArticleId?: string;
}) {
  return [
    ...createTargets(input.news || [], "news"),
    ...createTargets(input.products || [], "product"),
    ...createTargets(input.projects || [], "project"),
  ].filter((target) => !(target.type === "news" && target.id === input.currentArticleId));
}

function getMeaningfulTokens(value: string) {
  return Array.from(
    new Set(
      normalizeText(stripHtml(value))
        .split(" ")
        .filter((word) => word.length >= 3 && !STOP_WORDS.has(word)),
    ),
  );
}

export function getRelatedNewsSuggestions(input: {
  title: string;
  content: string;
  category?: string;
  keywords?: string;
  targets: InternalLinkTarget[];
  limit?: number;
}) {
  const sourceTokens = new Set(
    getMeaningfulTokens(`${input.title} ${stripHtml(input.content)} ${input.keywords || ""}`),
  );
  const normalizedCategory = normalizeText(input.category || "");

  const rankedSuggestions = input.targets
    .filter((target) => target.type === "news")
    .map<RelatedNewsSuggestion>((target) => {
      const reasons: string[] = [];
      let score = 0;
      if (normalizedCategory && normalizeText(target.category) === normalizedCategory) {
        score += 35;
        reasons.push("Cùng danh mục");
      }

      const titleTokens = getMeaningfulTokens(target.title);
      const titleOverlap = titleTokens.filter((token) => sourceTokens.has(token)).length;
      if (titleOverlap) {
        score += Math.min(30, titleOverlap * 6);
        reasons.push(`${titleOverlap} cụm chủ đề trùng khớp`);
      }

      const keywordTokens = getMeaningfulTokens(target.keywords.join(" "));
      const keywordOverlap = keywordTokens.filter((token) => sourceTokens.has(token)).length;
      if (keywordOverlap) {
        score += Math.min(20, keywordOverlap * 5);
        reasons.push("Từ khóa SEO liên quan");
      }

      const contentTokens = getMeaningfulTokens(`${target.description} ${target.content}`);
      const contentOverlap = contentTokens.filter((token) => sourceTokens.has(token)).length;
      if (contentOverlap >= 2) {
        score += Math.min(12, contentOverlap * 2);
        reasons.push("Nội dung cùng ngữ cảnh");
      }

      if (target.createdAt) {
        const timestamp = new Date(target.createdAt).getTime();
        if (Number.isFinite(timestamp)) score += Math.max(0, timestamp / 1e13);
      }

      return { target, score, reasons };
    })
    .sort((left, right) => right.score - left.score);

  const relatedSuggestions = rankedSuggestions.filter((suggestion) => suggestion.score >= 6);
  const recentFallbacks = rankedSuggestions
    .filter((suggestion) => suggestion.score < 6)
    .map((suggestion) => ({
      ...suggestion,
      reasons: suggestion.reasons.length ? suggestion.reasons : ["Bài viết gần đây"],
    }));

  return [...relatedSuggestions, ...recentFallbacks]
    .slice(0, Math.min(5, Math.max(1, input.limit || 5)));
}

export function detectRelatedContentTrigger(value: string) {
  if (!value.trim()) return null;
  const normalizedPlainText = normalizeText(stripHtml(value));
  const normalizedRaw = normalizeText(value.replace(/<[^>]*>/g, "\n"));
  const candidates = [normalizedRaw, normalizedPlainText];

  for (const trigger of RELATED_TRIGGERS) {
    const normalizedTrigger = normalizeText(trigger);
    if (candidates.some((candidate) => candidate.endsWith(normalizedTrigger))) return trigger;
  }

  const htmlTriggerPattern = new RegExp(
    `<(?:p|div|h[2-6])[^>]*>\\s*${RELATED_TRIGGERS.map((trigger) =>
      trigger.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    ).join("|")}\\s*</(?:p|div|h[2-6])>\\s*<(?:p|div)[^>]*>(?:\\s|<br\\s*\\/?>|&nbsp;)*</(?:p|div)>\\s*$`,
    "i",
  );
  const match = value.match(htmlTriggerPattern);
  if (!match) return null;
  const matchedTrigger = RELATED_TRIGGERS.find((trigger) => normalizeText(match[0]).includes(normalizeText(trigger)));
  return matchedTrigger || null;
}

function isBoundary(value: string | undefined) {
  return !value || value === " ";
}

function findAliasIndex(text: string, alias: string) {
  const normalizedText = normalizeTextPreservingLength(text);
  const normalizedAlias = normalizeText(alias);
  let index = normalizedText.indexOf(normalizedAlias);

  while (index >= 0) {
    const before = normalizedText[index - 1];
    const after = normalizedText[index + normalizedAlias.length];
    if (isBoundary(before) && isBoundary(after)) return index;
    index = normalizedText.indexOf(normalizedAlias, index + normalizedAlias.length);
  }
  return -1;
}

function getAliasGroups(targets: InternalLinkTarget[]) {
  const groups = new Map<string, { alias: string; targets: InternalLinkTarget[] }>();
  targets.forEach((target) => {
    target.aliases.forEach((alias) => {
      const key = normalizeText(alias);
      if (!key) return;
      const group = groups.get(key) || { alias, targets: [] };
      if (!group.targets.some((item) => item.type === target.type && item.id === target.id)) {
        group.targets.push(target);
      }
      groups.set(key, group);
    });
  });
  return groups;
}

export function findAmbiguousInternalLinkMatches(html: string, targets: InternalLinkTarget[]) {
  const plainText = stripHtml(html.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, " "));
  return Array.from(getAliasGroups(targets).values())
    .filter((group) => group.targets.length > 1 && findAliasIndex(plainText, group.alias) >= 0)
    .sort((left, right) => right.alias.length - left.alias.length)
    .map<AmbiguousInternalLinkMatch>((group) => ({
      term: group.alias,
      targets: group.targets,
    }));
}

function createAnchor(target: InternalLinkTarget, anchor: string, source: InternalLinkRecord["source"]) {
  const persistentUrl = `${target.url}#gh-il-${source}-${target.type}-${encodeURIComponent(target.id)}`;
  return `<a href="${escapeHtml(persistentUrl)}" data-internal-type="${target.type}" data-internal-id="${escapeHtml(target.id)}" data-internal-source="${source}" title="${escapeHtml(target.title)}">${escapeHtml(anchor)}</a>`;
}

export function createInternalLinkHtml(
  target: InternalLinkTarget,
  anchor?: string,
  source: InternalLinkRecord["source"] = "manual",
) {
  return createAnchor(target, anchor?.trim() || target.title, source);
}

function getAutomaticLinkLimit(html: string) {
  const wordCount = stripHtml(html).split(/\s+/).filter(Boolean).length;
  if (wordCount <= 600) return 3;
  if (wordCount <= 1200) return 5;
  return 8;
}

export function applyAutomaticContextualLinks(html: string, targets: InternalLinkTarget[]) {
  if (typeof DOMParser === "undefined" || !html.trim()) return { html, links: [] as InternalLinkRecord[] };

  const documentNode = new DOMParser().parseFromString(`<div id="internal-link-root">${html}</div>`, "text/html");
  const root = documentNode.getElementById("internal-link-root");
  if (!root) return { html, links: [] as InternalLinkRecord[] };

  const linkedTargets = new Set(
    Array.from(root.querySelectorAll("a"))
      .map((anchor) => {
        const marker = anchor.getAttribute("href")?.match(INTERNAL_LINK_MARKER_PATTERN);
        const type = anchor.getAttribute("data-internal-type") || marker?.[2];
        const rawId = anchor.getAttribute("data-internal-id") || marker?.[3];
        return type && rawId ? `${type}:${safeDecodeURIComponent(rawId)}` : "";
      })
      .filter(Boolean),
  );
  const uniqueAliases = Array.from(getAliasGroups(targets).values())
    .filter((group) => group.targets.length === 1)
    .map((group) => ({ alias: group.alias, target: group.targets[0] }))
    .sort((left, right) => right.alias.length - left.alias.length);
  const textNodes: Text[] = [];
  const walker = documentNode.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let currentNode = walker.nextNode();
  while (currentNode) {
    const parent = currentNode.parentElement;
    if (parent && !parent.closest("a, h1, h2, h3, h4, h5, h6, button, code, pre, script, style, textarea")) {
      textNodes.push(currentNode as Text);
    }
    currentNode = walker.nextNode();
  }

  const links: InternalLinkRecord[] = [];
  const limit = getAutomaticLinkLimit(html);

  for (const textNode of textNodes) {
    if (links.length >= limit) break;
    const value = textNode.nodeValue || "";
    let match: { index: number; alias: string; target: InternalLinkTarget } | null = null;

    uniqueAliases.forEach((candidate) => {
      const key = `${candidate.target.type}:${candidate.target.id}`;
      if (linkedTargets.has(key)) return;
      const index = findAliasIndex(value, candidate.alias);
      if (index < 0) return;
      if (!match || index < match.index || (index === match.index && candidate.alias.length > match.alias.length)) {
        match = { index, ...candidate };
      }
    });

    if (!match) continue;
    const resolvedMatch: { index: number; alias: string; target: InternalLinkTarget } = match;
    const matchedText = value.slice(resolvedMatch.index, resolvedMatch.index + resolvedMatch.alias.length);
    const fragment = documentNode.createDocumentFragment();
    fragment.append(value.slice(0, resolvedMatch.index));
    const wrapper = documentNode.createElement("span");
    wrapper.innerHTML = createAnchor(resolvedMatch.target, matchedText, "automatic");
    fragment.append(wrapper.firstElementChild as Element);
    fragment.append(value.slice(resolvedMatch.index + resolvedMatch.alias.length));
    textNode.replaceWith(fragment);

    linkedTargets.add(`${resolvedMatch.target.type}:${resolvedMatch.target.id}`);
    links.push({
      targetType: resolvedMatch.target.type,
      targetId: resolvedMatch.target.id,
      anchor: matchedText,
      url: resolvedMatch.target.url,
      source: "automatic",
    });
  }

  return { html: root.innerHTML, links };
}

export function insertInternalLinkAtSelection(input: {
  html: string;
  start?: number;
  end?: number;
  target: InternalLinkTarget;
  anchor?: string;
  source?: InternalLinkRecord["source"];
}) {
  const start = Math.max(0, input.start ?? input.html.length);
  const end = Math.max(start, input.end ?? start);
  const selectedText = input.html.slice(start, end);
  const anchor = input.anchor || selectedText || input.target.title;
  const link = createAnchor(input.target, anchor, input.source || "manual");
  return `${input.html.slice(0, start)}${link}${input.html.slice(end)}`;
}

export function linkFirstMatchingTerm(
  html: string,
  term: string,
  target: InternalLinkTarget,
) {
  if (typeof DOMParser === "undefined" || !html.trim() || !term.trim()) return html;
  const documentNode = new DOMParser().parseFromString(`<div id="term-link-root">${html}</div>`, "text/html");
  const root = documentNode.getElementById("term-link-root");
  if (!root) return html;
  const walker = documentNode.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let currentNode = walker.nextNode();

  while (currentNode) {
    const parent = currentNode.parentElement;
    const value = currentNode.nodeValue || "";
    const index = findAliasIndex(value, term);
    if (
      index >= 0 &&
      parent &&
      !parent.closest("a, h1, h2, h3, h4, h5, h6, button, code, pre, script, style, textarea")
    ) {
      const matchedText = value.slice(index, index + term.length);
      const fragment = documentNode.createDocumentFragment();
      fragment.append(value.slice(0, index));
      const wrapper = documentNode.createElement("span");
      wrapper.innerHTML = createAnchor(target, matchedText, "manual");
      fragment.append(wrapper.firstElementChild as Element);
      fragment.append(value.slice(index + term.length));
      (currentNode as Text).replaceWith(fragment);
      return root.innerHTML;
    }
    currentNode = walker.nextNode();
  }

  return html;
}

export function insertRelatedNewsLinks(
  html: string,
  trigger: string,
  targets: InternalLinkTarget[],
) {
  if (!targets.length) return html;
  const list = `<ul data-related-links="true">${targets
    .slice(0, 5)
    .map(
      (target) =>
        `<li><span aria-hidden="true" data-related-link-bullet="true">•</span> ${createAnchor(target, target.title, "related")}</li>`,
    )
    .join("")}</ul>`;

  if (typeof DOMParser === "undefined") return `${html}${list}`;
  const documentNode = new DOMParser().parseFromString(`<div id="related-link-root">${html}</div>`, "text/html");
  const root = documentNode.getElementById("related-link-root");
  if (!root) return `${html}${list}`;
  const normalizedTrigger = normalizeText(trigger);
  const triggerElement = Array.from(root.querySelectorAll("p, div, h2, h3, h4, h5, h6"))
    .reverse()
    .find((element) => normalizeText(element.textContent || "") === normalizedTrigger);
  const wrapper = documentNode.createElement("div");
  wrapper.innerHTML = list;
  const listElement = wrapper.firstElementChild;
  if (!listElement) return html;

  if (triggerElement) {
    const nextElement = triggerElement.nextElementSibling;
    if (nextElement && !normalizeText(nextElement.textContent || "")) nextElement.remove();
    triggerElement.insertAdjacentElement("afterend", listElement);
  } else {
    root.append(listElement);
  }
  return root.innerHTML;
}

export function extractInternalLinkRecords(html: string) {
  const records: InternalLinkRecord[] = [];
  const anchorPattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = anchorPattern.exec(html))) {
    const attributes = match[1];
    const href = attributes.match(/\bhref=["']([^"']+)["']/i)?.[1];
    const marker = href?.match(INTERNAL_LINK_MARKER_PATTERN);
    const type = (attributes.match(/\bdata-internal-type=["'](news|product|project)["']/i)?.[1] || marker?.[2]) as InternalLinkType | undefined;
    const rawId = attributes.match(/\bdata-internal-id=["']([^"']+)["']/i)?.[1] || marker?.[3];
    const id = rawId ? safeDecodeURIComponent(rawId) : undefined;
    const source = (attributes.match(/\bdata-internal-source=["'](automatic|related|manual)["']/i)?.[1] || marker?.[1]) as InternalLinkRecord["source"] | undefined;
    if (!type || !id || !href) continue;
    records.push({
      targetType: type,
      targetId: id,
      anchor: stripHtml(match[2]),
      url: href,
      source: source || "manual",
    });
  }
  return records;
}

export function resolveInternalLinkUrls(html: string, targets: InternalLinkTarget[]) {
  if (!html.trim()) return html;
  const targetMap = new Map(targets.map((target) => [`${target.type}:${target.id}`, target.url]));
  return html.replace(/<a\b([^>]*)>/gi, (openingTag, attributes: string) => {
    const href = attributes.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
    const marker = href?.match(INTERNAL_LINK_MARKER_PATTERN);
    const type = attributes.match(/\bdata-internal-type=["'](news|product|project)["']/i)?.[1] || marker?.[2];
    const rawId = attributes.match(/\bdata-internal-id=["']([^"']+)["']/i)?.[1] || marker?.[3];
    const id = rawId ? safeDecodeURIComponent(rawId) : "";
    if (!type || !id) return openingTag;
    const currentUrl = targetMap.get(`${type}:${id}`);
    if (!currentUrl) return openingTag;
    const safeUrl = escapeHtml(currentUrl);
    if (/\bhref\s*=/i.test(attributes)) {
      return `<a${attributes.replace(/\bhref\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i, `href="${safeUrl}"`)}>`;
    }
    return `<a href="${safeUrl}"${attributes}>`;
  });
}
