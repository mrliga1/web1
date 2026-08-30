import 'server-only';

import type { Metadata } from 'next';
import { createStaticPageMetadata, DEFAULT_SOCIAL_IMAGE } from './internalLinks';
import { getPublicSettings } from './serverContent';

export type StaticSeoPageConfig = {
  title: string;
  description: string;
  keywords: string;
  socialImage: string;
  index: boolean;
};

export const STATIC_SEO_DEFAULTS: Record<string, StaticSeoPageConfig & { label: string }> = {
  '/': {
    label: 'Trang chủ',
    title: 'Greenia Homes - Cố vấn đầu tư bất động sản chuyên sâu',
    description: 'Đồng hành tư vấn đầu tư bất động sản cá nhân hóa, từ pháp lý sổ hồng đến phân tích thị trường.',
    keywords: 'Greenia Homes, bất động sản, tư vấn đầu tư bất động sản',
    socialImage: DEFAULT_SOCIAL_IMAGE,
    index: true,
  },
  '/san-pham': {
    label: 'Sản phẩm', title: 'Bất động sản',
    description: 'Danh sách sản phẩm bất động sản tại Greenia Homes. Tìm kiếm căn hộ, nhà phố, biệt thự phù hợp nhu cầu.',
    keywords: 'bất động sản, căn hộ, nhà phố, biệt thự', socialImage: DEFAULT_SOCIAL_IMAGE, index: true,
  },
  '/du-an': {
    label: 'Dự án', title: 'Dự án bất động sản',
    description: 'Các dự án bất động sản nổi bật tại TP.HCM. Thông tin chi tiết, tiến độ, giá bán từ Greenia Homes.',
    keywords: 'dự án bất động sản, dự án TP.HCM', socialImage: DEFAULT_SOCIAL_IMAGE, index: true,
  },
  '/tin-tuc': {
    label: 'Tin tức', title: 'Tin tức bất động sản',
    description: 'Tin tức bất động sản mới nhất. Phân tích thị trường, xu hướng đầu tư, kiến thức mua bán nhà đất.',
    keywords: 'tin tức bất động sản, thị trường nhà đất', socialImage: DEFAULT_SOCIAL_IMAGE, index: true,
  },
  '/lien-he': {
    label: 'Liên hệ', title: 'Liên hệ',
    description: 'Liên hệ Greenia Homes để được tư vấn bất động sản chuyên nghiệp. Hotline: 0932 966 700.',
    keywords: 'liên hệ Greenia Homes, tư vấn bất động sản', socialImage: DEFAULT_SOCIAL_IMAGE, index: true,
  },
  '/latest-sales': {
    label: 'Chuyển nhượng mới', title: 'Bất động sản chuyển nhượng mới nhất',
    description: 'Danh sách bất động sản chuyển nhượng mới nhất tại Greenia Homes.',
    keywords: 'bất động sản bán mới nhất, chuyển nhượng nhà đất', socialImage: DEFAULT_SOCIAL_IMAGE, index: true,
  },
  '/latest-rents': {
    label: 'Cho thuê mới', title: 'Bất động sản cho thuê mới nhất',
    description: 'Khám phá danh sách bất động sản cho thuê mới nhất tại Greenia Homes.',
    keywords: 'bất động sản cho thuê, căn hộ cho thuê', socialImage: DEFAULT_SOCIAL_IMAGE, index: true,
  },
  '/dieu-khoan-su-dung': {
    label: 'Điều khoản sử dụng', title: 'Điều khoản sử dụng',
    description: 'Điều khoản sử dụng website Greenia Homes. Quy định về quyền và trách nhiệm khi sử dụng dịch vụ.',
    keywords: 'điều khoản sử dụng Greenia Homes', socialImage: DEFAULT_SOCIAL_IMAGE, index: true,
  },
  '/chinh-sach-bao-mat': {
    label: 'Chính sách bảo mật', title: 'Chính sách bảo mật',
    description: 'Chính sách bảo mật thông tin cá nhân của Greenia Homes. Cam kết bảo vệ dữ liệu khách hàng.',
    keywords: 'chính sách bảo mật Greenia Homes', socialImage: DEFAULT_SOCIAL_IMAGE, index: true,
  },
  '/yeu-thich': {
    label: 'Tin đã lưu', title: 'Tin đã lưu',
    description: 'Danh sách bất động sản yêu thích của bạn tại Greenia Homes.',
    keywords: '', socialImage: DEFAULT_SOCIAL_IMAGE, index: false,
  },
};

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
