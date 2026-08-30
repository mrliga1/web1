import React, { useMemo, useState } from 'react';
import { locationTree, formatLocationName } from '../lib/locationMapping';
import type { StaticSeoPageConfig } from '../lib/staticSeo';

type Props = {
  value: Record<string, StaticSeoPageConfig>;
  onChange: (value: Record<string, StaticSeoPageConfig>) => void;
};

export default function LocationSeoSettings({ value, onChange }: Props) {
  const provinces = useMemo(() => locationTree.map(item => formatLocationName(item.name)), []);
  const [selectedLocation, setSelectedLocation] = useState(provinces[0] || 'TP. HCM');
  const defaults: StaticSeoPageConfig = {
    title: `Bất động sản tại ${selectedLocation}`,
    description: `Danh sách căn hộ, nhà phố, biệt thự mua bán và cho thuê tại ${selectedLocation}, cập nhật từ Greenia Homes.`,
    keywords: `bất động sản ${selectedLocation}, nhà đất ${selectedLocation}, căn hộ ${selectedLocation}`,
    socialImage: 'https://greeniahomes.vn/og-image.jpg',
    index: true,
  };
  const config = { ...defaults, ...value[selectedLocation] };
  const update = (field: keyof StaticSeoPageConfig, fieldValue: string | boolean) => {
    onChange({ ...value, [selectedLocation]: { ...config, [field]: fieldValue } });
  };

  return (
    <section className="space-y-4 rounded-xl border border-emerald-900/15 bg-white p-4" aria-labelledby="location-seo-title">
      <div>
        <h4 id="location-seo-title" className="text-sm font-bold text-emerald-950">SEO cho trang tỉnh/thành</h4>
        <p className="mt-1 text-[10px] text-slate-600">Áp dụng cho trang sản phẩm khi lọc theo tỉnh/thành.</p>
      </div>
      <label className="block space-y-1">
        <span className="text-[10px] font-bold text-slate-700">Tỉnh/thành cần cấu hình</span>
        <select value={selectedLocation} onChange={event => setSelectedLocation(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-700 md:max-w-sm">
          {provinces.map(province => <option key={province} value={province}>{province}</option>)}
        </select>
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 md:col-span-2">
          <span className="text-[10px] font-bold text-slate-700">Meta title</span>
          <input value={config.title} onChange={event => update('title', event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-700" />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-[10px] font-bold text-slate-700">Meta description</span>
          <textarea rows={3} value={config.description} onChange={event => update('description', event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-700" />
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-bold text-slate-700">Từ khóa</span>
          <input value={config.keywords} onChange={event => update('keywords', event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-700" />
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-bold text-slate-700">Ảnh chia sẻ 1200×630</span>
          <input type="url" value={config.socialImage} onChange={event => update('socialImage', event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-700" />
        </label>
        <label className="inline-flex items-center gap-2 text-[11px] font-semibold text-slate-700 md:col-span-2">
          <input type="checkbox" checked={config.index} onChange={event => update('index', event.target.checked)} className="h-4 w-4 accent-emerald-800" />
          Cho phép lập chỉ mục trang tỉnh/thành này
        </label>
      </div>
    </section>
  );
}
