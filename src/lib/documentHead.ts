export function resolveItemTitle(
  item: {
    title?: string;
    metaTitle?: string;
    seoTitle?: string;
  },
  suffix: string,
): string {
  const raw =
    item.seoTitle?.trim() ||
    item.metaTitle?.trim() ||
    item.title?.trim() ||
    "";
  if (!raw) return suffix;
  if (raw.includes("|")) return raw;
  return `${raw} | ${suffix}`;
}

export function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function parseSlugTitleFromPath(
  path: string,
  prefix: string,
): string | null {
  if (!path.startsWith(prefix)) return null;
  const pathPart = path.replace(prefix, "");
  const parts = pathPart.split("-");
  if (parts.length < 2) return null;

  let slugParts = parts;
  const last = parts[parts.length - 1];
  const first = parts[0];
  if (last.length >= 18 && /^[a-zA-Z0-9]+$/.test(last)) {
    slugParts = parts.slice(0, -1);
  } else if (first.length >= 18 && /^[a-zA-Z0-9]+$/.test(first)) {
    slugParts = parts.slice(1);
  }

  const slug = slugParts.join("-");
  return slug ? humanizeSlug(slug) : null;
}

export function setDocumentTitle(title: string) {
  const next = title?.trim();
  if (next) document.title = next;
}

import { optimizeImageUrl } from './utils';

export function setDocumentFavicon(href: string) {
  if (!href?.trim()) return;
  const url = optimizeImageUrl(href.trim());
  for (const rel of ["icon", "shortcut icon", "apple-touch-icon"]) {
    let link = document.querySelector<HTMLLinkElement>(
      `link[rel="${rel}"]`,
    );
    if (!link) {
      link = document.createElement("link");
      link.rel = rel;
      document.head.appendChild(link);
    }
    link.href = url;
  }
}
