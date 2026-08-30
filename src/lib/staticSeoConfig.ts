import { DEFAULT_SOCIAL_IMAGE } from './internalLinks';

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
