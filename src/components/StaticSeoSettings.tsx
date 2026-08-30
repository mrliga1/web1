import React, { useState } from 'react';
import type { StaticSeoPageConfig } from '../lib/staticSeoConfig';

const PAGES: Array<{ path: string; label: string; defaults: StaticSeoPageConfig }> = [
  { path: '/', label: 'Trang chủ', defaults: { title: 'Greenia Homes - Cố vấn đầu tư bất động sản chuyên sâu', description: 'Đồng hành tư vấn đầu tư bất động sản cá nhân hóa, từ pháp lý sổ hồng đến phân tích thị trường.', keywords: 'Greenia Homes, bất động sản, tư vấn đầu tư bất động sản', socialImage: 'https://greeniahomes.vn/og-image.jpg', index: true } },
  { path: '/san-pham', label: 'Sản phẩm', defaults: { title: 'Bất động sản', description: 'Danh sách sản phẩm bất động sản tại Greenia Homes.', keywords: 'bất động sản, căn hộ, nhà phố, biệt thự', socialImage: 'https://greeniahomes.vn/og-image.jpg', index: true } },
  { path: '/du-an', label: 'Dự án', defaults: { title: 'Dự án bất động sản', description: 'Các dự án bất động sản nổi bật tại TP.HCM.', keywords: 'dự án bất động sản, dự án TP.HCM', socialImage: 'https://greeniahomes.vn/og-image.jpg', index: true } },
  { path: '/tin-tuc', label: 'Tin tức', defaults: { title: 'Tin tức bất động sản', description: 'Tin tức và phân tích thị trường bất động sản mới nhất.', keywords: 'tin tức bất động sản, thị trường nhà đất', socialImage: 'https://greeniahomes.vn/og-image.jpg', index: true } },
  { path: '/lien-he', label: 'Liên hệ', defaults: { title: 'Liên hệ', description: 'Liên hệ Greenia Homes để được tư vấn bất động sản chuyên nghiệp.', keywords: 'liên hệ Greenia Homes, tư vấn bất động sản', socialImage: 'https://greeniahomes.vn/og-image.jpg', index: true } },
  { path: '/latest-sales', label: 'Chuyển nhượng mới', defaults: { title: 'Bất động sản chuyển nhượng mới nhất', description: 'Danh sách bất động sản chuyển nhượng mới nhất tại Greenia Homes.', keywords: 'bất động sản bán mới nhất, chuyển nhượng nhà đất', socialImage: 'https://greeniahomes.vn/og-image.jpg', index: true } },
  { path: '/latest-rents', label: 'Cho thuê mới', defaults: { title: 'Bất động sản cho thuê mới nhất', description: 'Danh sách bất động sản cho thuê mới nhất tại Greenia Homes.', keywords: 'bất động sản cho thuê, căn hộ cho thuê', socialImage: 'https://greeniahomes.vn/og-image.jpg', index: true } },
  { path: '/dieu-khoan-su-dung', label: 'Điều khoản sử dụng', defaults: { title: 'Điều khoản sử dụng', description: 'Điều khoản sử dụng website Greenia Homes.', keywords: 'điều khoản sử dụng Greenia Homes', socialImage: 'https://greeniahomes.vn/og-image.jpg', index: true } },
  { path: '/chinh-sach-bao-mat', label: 'Chính sách bảo mật', defaults: { title: 'Chính sách bảo mật', description: 'Chính sách bảo mật thông tin cá nhân của Greenia Homes.', keywords: 'chính sách bảo mật Greenia Homes', socialImage: 'https://greeniahomes.vn/og-image.jpg', index: true } },
  { path: '/yeu-thich', label: 'Tin đã lưu', defaults: { title: 'Tin đã lưu', description: 'Danh sách bất động sản yêu thích của bạn tại Greenia Homes.', keywords: '', socialImage: 'https://greeniahomes.vn/og-image.jpg', index: false } },
];

type Props = {
  value: Record<string, StaticSeoPageConfig>;
  onChange: (value: Record<string, StaticSeoPageConfig>) => void;
  onUploadImage?: (event: React.ChangeEvent<HTMLInputElement>, target: string) => void;
  onSelectImage?: (target: string) => void;
  isUploading?: boolean;
};

export default function StaticSeoSettings({ value, onChange, onUploadImage, onSelectImage, isUploading = false }: Props) {
  const [selectedPath, setSelectedPath] = useState('/');
  const page = PAGES.find(item => item.path === selectedPath) || PAGES[0];
  const config = { ...page.defaults, ...value[selectedPath] };
  const update = (field: keyof StaticSeoPageConfig, fieldValue: string | boolean) => {
    onChange({ ...value, [selectedPath]: { ...config, [field]: fieldValue } });
  };
  const imageTarget = `seo-static:${encodeURIComponent(selectedPath)}`;

  return (
    <section className="space-y-4 rounded-xl border border-emerald-900/15 bg-white p-4" aria-labelledby="static-seo-title">
      <div>
        <h4 id="static-seo-title" className="text-sm font-bold text-emerald-950">SEO cho từng trang tĩnh</h4>
        <p className="mt-1 text-[10px] text-slate-600">Tiêu đề, mô tả, từ khóa và ảnh chia sẻ được áp dụng phía máy chủ sau khi lưu.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="flex gap-2 overflow-x-auto lg:flex-col" role="tablist" aria-label="Chọn trang SEO">
          {PAGES.map(item => (
            <button
              key={item.path}
              type="button"
              role="tab"
              aria-selected={selectedPath === item.path}
              onClick={() => setSelectedPath(item.path)}
              className={`shrink-0 rounded-lg px-3 py-2 text-left text-[11px] font-semibold ${selectedPath === item.path ? 'bg-emerald-800 text-white' : 'bg-emerald-50 text-emerald-950 hover:bg-emerald-100'}`}
            >
              {item.label}
              <span className="mt-0.5 block font-mono text-[8px] opacity-70">{item.path}</span>
            </button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 md:col-span-2">
            <span className="text-[10px] font-bold text-slate-700">Meta title</span>
            <input value={config.title} onChange={event => update('title', event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700" />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-[10px] font-bold text-slate-700">Meta description</span>
            <textarea rows={3} value={config.description} onChange={event => update('description', event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700" />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-bold text-slate-700">Từ khóa, phân tách bằng dấu phẩy</span>
            <input value={config.keywords} onChange={event => update('keywords', event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700" />
          </label>
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-700">Ảnh chia sẻ 1200×630</span>
            {config.socialImage && (
              <img src={config.socialImage} alt={`Ảnh chia sẻ ${page.label}`} className="aspect-[1200/630] w-full rounded-lg border border-slate-200 object-cover" />
            )}
            <input type="url" value={config.socialImage} onChange={event => update('socialImage', event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700" />
            <div className="flex flex-wrap gap-2">
              <label className="relative inline-flex cursor-pointer items-center rounded-lg bg-emerald-800 px-3 py-2 text-[10px] font-bold text-white hover:bg-emerald-900">
                {isUploading ? 'Đang tải ảnh...' : 'Tải ảnh mới'}
                <input type="file" accept="image/*" className="absolute inset-0 cursor-pointer opacity-0" disabled={isUploading} onChange={event => onUploadImage?.(event, imageTarget)} />
              </label>
              <button type="button" onClick={() => onSelectImage?.(imageTarget)} className="rounded-lg border border-emerald-800/25 bg-white px-3 py-2 text-[10px] font-bold text-emerald-900 hover:bg-emerald-50">
                Chọn ảnh trong kho
              </button>
            </div>
          </div>
          {selectedPath !== '/yeu-thich' && (
            <label className="inline-flex items-center gap-2 text-[11px] font-semibold text-slate-700 md:col-span-2">
              <input type="checkbox" checked={config.index} onChange={event => update('index', event.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-emerald-800" />
              Cho phép công cụ tìm kiếm lập chỉ mục trang này
            </label>
          )}
        </div>
      </div>
    </section>
  );
}
