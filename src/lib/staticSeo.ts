import 'server-only';

import type { Metadata } from 'next';
import { createStaticPageMetadata, DEFAULT_SOCIAL_IMAGE } from './internalLinks';
import { getPublicSettings } from './serverContent';
import { STATIC_SEO_DEFAULTS, type StaticSeoPageConfig } from './staticSeoConfig';

export type { StaticSeoPageConfig } from './staticSeoConfig';

function cleanConfig(path: string, input: Partial<StaticSeoPageConfig> | undefined) {
  const defaults = STATIC_SEO_DEFAULTS[path] || STATIC_SEO_DEFAULTS['/'];
  return {
    title: input?.title?.trim() || defaults.title,
    description: input?.description?.trim() || defaults.description,
    keywords: input?.keywords?.trim() || defaults.keywords,
    socialImage: input?.socialImage?.trim() || defaults.socialImage,
    index: path === '/yeu-thich' ? false : input?.index !== false,
  };
}

export async function getManagedStaticMetadata(path: string): Promise<Metadata> {
  const settings = await getPublicSettings('general').catch(() => null);
  const pages = settings?.staticSeoPages && typeof settings.staticSeoPages === 'object'
    ? settings.staticSeoPages as Record<string, Partial<StaticSeoPageConfig>>
    : {};
  const config = cleanConfig(path, pages[path]);
  return createStaticPageMetadata({
    title: config.title,
    description: config.description,
    path,
    keywords: config.keywords.split(',').map(keyword => keyword.trim()).filter(Boolean),
    socialImage: config.socialImage,
    index: config.index,
  });
}

export async function getManagedLocationMetadata(location: string): Promise<Metadata> {
  const normalizedLocation = location.trim();
  if (!normalizedLocation) return getManagedStaticMetadata('/san-pham');
  const settings = await getPublicSettings('general').catch(() => null);
  const pages = settings?.locationSeoPages && typeof settings.locationSeoPages === 'object'
    ? settings.locationSeoPages as Record<string, Partial<StaticSeoPageConfig>>
    : {};
  const configured = pages[normalizedLocation];
  const title = configured?.title?.trim() || `Bất động sản tại ${normalizedLocation}`;
  const description = configured?.description?.trim()
    || `Danh sách căn hộ, nhà phố, biệt thự mua bán và cho thuê tại ${normalizedLocation}, cập nhật từ Greenia Homes.`;
  const keywords = configured?.keywords?.trim()
    || `bất động sản ${normalizedLocation}, nhà đất ${normalizedLocation}, căn hộ ${normalizedLocation}`;
  return createStaticPageMetadata({
    title,
    description,
    path: `/san-pham?location=${encodeURIComponent(normalizedLocation)}`,
    keywords: keywords.split(',').map(keyword => keyword.trim()).filter(Boolean),
    socialImage: configured?.socialImage?.trim() || DEFAULT_SOCIAL_IMAGE,
    index: configured?.index !== false,
  });
}
