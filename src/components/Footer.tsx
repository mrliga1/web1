import React from 'react';
import Link from 'next/link';
import { Building2, Compass, Home, MapPin, Search, MessageSquare, ArrowUp, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-bg-inverse border-t border-border-color pt-12 pb-8 relative overflow-hidden" id="footer">
      <div className="absolute inset-0 bg-[radial-gradient(rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:40px_40px] opacity-50 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-full h-[300px] bg-gradient-to-t from-primary/10 to-transparent pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 text-left">
          <div className="space-y-6 lg:col-span-1">
            <span className="font-display font-bold text-2xl text-accent uppercase tracking-wide">Greenia Homes</span>
            <address className="not-italic">
              <ul className="space-y-4 text-[13px] text-white/70">
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span className="text-text-inverse">
                    <strong className="text-text-inverse">Trụ sở:</strong> Tòa nhà Greenia, Khu biệt thự Phú Mỹ Hưng, Quận 7, TP.HCM.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span className="text-text-inverse">
                    <strong className="text-text-inverse">Văn phòng:</strong> Tòa nhà Greenia, Khu biệt thự Phú Mỹ Hưng, Quận 7, TP.HCM.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span className="text-text-inverse">
                    <strong className="text-text-inverse">Hotline:</strong> <a href="tel:0932966700" className="hover:text-accent transition-colors">0932 966 700</a>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span className="text-text-inverse">
                    <strong className="text-text-inverse">Email:</strong> <a href="mailto:sales.greeniahomes@gmail.com" className="hover:text-accent transition-colors">sales.greeniahomes@gmail.com</a>
                  </span>
                </li>
              </ul>
            </address>
          </div>
          <div className="space-y-6">
            <h3 className="font-display font-bold text-text-inverse text-sm uppercase tracking-wider relative pb-3 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-0.5 after:bg-accent">Về Chúng Tôi</h3>
            <ul className="space-y-3 text-[13px] text-white/70">
              <li><Link href="/" className="text-white/70 hover:text-accent hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer bg-transparent border-none text-left"><span className="text-accent text-lg leading-none">›</span> Giới Thiệu</Link></li>
              <li><Link href="/du-an" className="text-white/70 hover:text-accent hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer bg-transparent border-none text-left"><span className="text-accent text-lg leading-none">›</span> Dự Án</Link></li>
              <li><Link href="/category-product/chuyen-nhuong" className="text-white/70 hover:text-accent hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer bg-transparent border-none text-left"><span className="text-accent text-lg leading-none">›</span> Chuyển Nhượng</Link></li>
              <li><Link href="/tin-tuc" className="text-white/70 hover:text-accent hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer bg-transparent border-none text-left"><span className="text-accent text-lg leading-none">›</span> Tin Tức & Sự Kiện</Link></li>
              <li className="pb-4 border-b border-white/10"><Link href="/lien-he" className="text-white/70 hover:text-accent hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer bg-transparent border-none text-left"><span className="text-accent text-lg leading-none">›</span> Liên Hệ</Link></li>
              <li className="pt-2"><Link href="/chinh-sach-bao-mat" className="text-white/70 hover:text-accent hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer bg-transparent border-none text-left"><span className="text-accent text-lg leading-none">›</span> Chính sách bảo mật</Link></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h3 className="font-display font-bold text-text-inverse text-sm uppercase tracking-wider relative pb-3 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-0.5 after:bg-accent">Sản Phẩm</h3>
            <ul className="space-y-3 text-[13px] text-white/70">
              <li><Link href="/san-pham" className="text-white/70 hover:text-accent hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer bg-transparent border-none text-left"><span className="text-accent text-lg leading-none">›</span> Tất Cả Sản Phẩm</Link></li>
              <li><Link href="/category-product/chuyen-nhuong" className="text-white/70 hover:text-accent hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer bg-transparent border-none text-left"><span className="text-accent text-lg leading-none">›</span> Chuyển Nhượng</Link></li>
              <li><Link href="/category-product/cho-thue" className="text-white/70 hover:text-accent hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer bg-transparent border-none text-left"><span className="text-accent text-lg leading-none">›</span> Cho thuê</Link></li>
              <li><Link href="/category-product/can-ho" className="text-white/70 hover:text-accent hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer bg-transparent border-none text-left"><span className="text-accent text-lg leading-none">›</span> Căn Hộ</Link></li>
              <li className="pb-4 border-b border-white/10"><Link href="/category-product/nha-pho-biet-thu" className="text-white/70 hover:text-accent hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer bg-transparent border-none text-left"><span className="text-accent text-lg leading-none">›</span> Nhà Phố - Biệt Thự</Link></li>
              <li className="pt-2"><Link href="/dieu-khoan-su-dung" className="text-white/70 hover:text-accent hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer bg-transparent border-none text-left"><span className="text-accent text-lg leading-none">›</span> Điều khoản sử dụng</Link></li>
            </ul>
          </div>
          <div className="space-y-6 lg:col-span-1 border-l border-border-inverse pl-0 lg:pl-10">
            <h3 className="font-display font-bold text-text-inverse text-sm uppercase tracking-wider relative pb-3 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-0.5 after:bg-accent">Kết Nối</h3>
            <p className="text-[13px] text-white/70 leading-relaxed">Theo dõi Greenia Homes trên các nền tảng mạng xã hội để cập nhật thông tin dự án mới nhất.</p>
            <div className="flex items-center gap-4 pt-2">
              <a href="https://www.facebook.com/greeniahomes" target="_blank" rel="noopener noreferrer" aria-label="Facebook Greenia Homes" className="w-10 h-10 rounded-full border border-border-inverse flex items-center justify-center text-white/50 hover:bg-primary hover:text-text-inverse hover:border-primary hover:-translate-y-1 transition-all">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 320 512"><path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" /></svg>
              </a>
              <a href="https://www.youtube.com/@greeniahomes.vn" target="_blank" rel="noopener noreferrer" aria-label="YouTube Greenia Homes" className="w-10 h-10 rounded-full border border-border-inverse flex items-center justify-center text-white/50 hover:bg-primary hover:text-text-inverse hover:border-primary hover:-translate-y-1 transition-all">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 576 512"><path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" /></svg>
              </a>
              <a href="https://www.tiktok.com/@greeniahomes.vn" target="_blank" rel="noopener noreferrer" aria-label="TikTok Greenia Homes" className="w-10 h-10 rounded-full border border-border-inverse flex items-center justify-center text-white/50 hover:bg-primary hover:text-text-inverse hover:border-primary hover:-translate-y-1 transition-all">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 448 512"><path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z" /></svg>
              </a>
              <a href="https://zalo.me/0932966700" target="_blank" rel="noopener noreferrer" aria-label="Zalo Greenia Homes" className="w-10 h-10 rounded-full border border-border-inverse flex items-center justify-center text-white/50 hover:bg-primary hover:text-text-inverse hover:border-primary hover:-translate-y-1 transition-all">
                <MessageSquare className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
        <div className="pt-8 border-t border-border-inverse">
          <p className="text-[11px] text-white/50 italic leading-relaxed text-justify mb-8">* Thông tin, hình ảnh, các tiện ích trên website chỉ mang tính chất tham khảo và có thể được điều chỉnh theo quy định của Chủ đầu tư hoặc cơ quan nhà nước có thẩm quyền tại từng thời điểm. Các cam kết chính thức sẽ được quy định cụ thể tại Hợp đồng mua bán. Chúng tôi không chịu trách nhiệm cho bất kỳ tổn thất nào phát sinh từ việc sử dụng thông tin trên trang web này mà chưa qua xác nhận trực tiếp từ chuyên viên tư vấn.</p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-white/50 bg-[#0B1F16]/30 px-6 py-4 rounded-xl">
            <p>© {new Date().getFullYear()} <strong className="text-text-inverse">Greenia Homes</strong>. All Rights Reserved.</p>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-1 hover:text-accent transition-colors cursor-pointer font-medium bg-transparent border-none">
              <span>Về đầu trang</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
