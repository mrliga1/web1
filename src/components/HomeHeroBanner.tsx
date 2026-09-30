import React from 'react';
import Link from 'next/link';
import { getImageProps } from 'next/image';
import { ArrowRight } from 'lucide-react';

// Nội dung banner tĩnh được dựng tại máy chủ, không tải mã trình bày vào component trang chủ.
export default function HomeHeroBanner() {
  const { props: heroImage } = getImageProps({
    src: '/uploads/nha-pho-vinhomes-saigon-park-1780522235670.webp',
    alt: 'Phối cảnh dãy nhà phố và đường nội khu trong một dự án bất động sản',
    width: 1443,
    height: 770,
    sizes: '(max-width: 1023px) 100vw, 55vw',
    quality: 65,
    loading: 'lazy',
    className: 'aspect-[4/3] w-full object-cover object-center sm:aspect-[16/10] lg:aspect-[4/3]',
  });
  // React 18 dùng tên thuộc tính HTML; React mới hỗ trợ fetchPriority trực tiếp.
  const preloadPriority = 'use' in React
    ? { fetchPriority: 'high' as const }
    : { fetchpriority: 'high' };

  return (
    <>
      {/* Ảnh nằm cạnh tiêu đề trên desktop; di động chỉ tải khi gần vùng đang xem. */}
      <link
        rel="preload"
        as="image"
        href={heroImage.src}
        imageSrcSet={heroImage.srcSet}
        imageSizes={heroImage.sizes}
        media="(min-width: 1024px)"
        {...preloadPriority}
      />
      <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-5 pb-10 pt-12 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12 lg:py-16">
        <div className="home-hero-reveal max-w-[620px] text-left" id="banner-intro-txt">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            Greenia Homes · TP. Hồ Chí Minh
          </p>
          <h1 className="max-w-[630px] font-display text-[clamp(2.3rem,4.3vw,4.5rem)] font-bold leading-[1.08] tracking-tight text-primary">
            Tìm bất động sản phù hợp, an tâm trong từng quyết định
          </h1>
          <p className="mt-6 max-w-[570px] text-base leading-7 text-text-secondary sm:text-lg">
            Khám phá căn hộ, nhà phố và biệt thự tại TP. Hồ Chí Minh. Greenia Homes đồng hành từ chọn lựa, tìm hiểu thông tin pháp lý đến các bước giao dịch.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/san-pham" prefetch={false} className="motion-button inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-light">
              Xem bất động sản <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a href="#home-hero-consultation" className="motion-button inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary/25 bg-white px-6 py-3 text-sm font-bold text-primary hover:bg-primary/5">
              Nhận tư vấn phù hợp
            </a>
          </div>
          <div className="mt-10 grid max-w-[540px] grid-cols-3 gap-3 border-t border-primary/15 pt-6 text-[11px] leading-5 text-text-secondary sm:text-xs">
            <span><strong className="block text-sm text-primary">Lựa chọn</strong>Theo nhu cầu thực tế</span>
            <span><strong className="block text-sm text-primary">Thông tin</strong>Dễ xem và đối chiếu</span>
            <span><strong className="block text-sm text-primary">Đồng hành</strong>Trong quá trình giao dịch</span>
          </div>
        </div>

        <figure className="relative m-0 overflow-hidden rounded-[28px] bg-primary shadow-[0_30px_70px_rgba(3,53,42,0.18)] lg:rounded-[36px]">
          <img {...heroImage} alt={heroImage.alt} />
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-emerald-950/85 via-emerald-950/35 to-transparent px-6 pb-5 pt-16 text-xs font-medium text-white sm:px-8 sm:pb-7">
            Hình ảnh phối cảnh minh họa · Tìm hiểu thông tin chi tiết tại từng dự án
          </figcaption>
        </figure>
      </div>
    </>
  );
}
