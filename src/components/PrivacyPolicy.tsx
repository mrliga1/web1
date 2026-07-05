import React, { useEffect, useState } from 'react';
import { RouteState } from '../types';
import { Shield, Lock } from 'lucide-react';

interface PrivacyPolicyProps {
  onNavigate: (route: RouteState) => void;
}

export default function PrivacyPolicy({ onNavigate }: PrivacyPolicyProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-bg-surface font-sans text-text-secondary min-h-screen">
      <div 
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500"
        style={{ paddingTop: '20px', paddingBottom: '20px', paddingLeft: '0px', paddingRight: '0px' }}
      >
        
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
             <Shield className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-accent font-serif mb-6 tracking-tight">Chính Sách Bảo Mật Dữ Liệu</h1>
          <p className="text-text-secondary text-sm md:text-base max-w-2xl mx-auto">
            Greenia Homes coi trọng sự riêng tư của bạn. Chính sách này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân.
          </p>
        </div>

        <div className="bg-bg-surface/50 border border-border-color rounded-2xl p-6 md:p-10 shadow-xl space-y-8 prose prose-invert max-w-none prose-emerald">
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">1. Thu thập thông tin cá nhân</h2>
            <p className="text-text-secondary leading-relaxed text-sm md:text-base">
              Chúng tôi chỉ thu thập các thông tin bạn tự nguyện cung cấp thông qua biểu mẫu: Yêu cầu tư vấn, Hẹn lịch xem nhà, Đăng ký nhận tin. Các thông tin có thể bao gồm:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-text-secondary text-sm md:text-base mt-3 marker:text-accent/50">
              <li>Họ và tên</li>
              <li>Số điện thoại liên lạc</li>
              <li>Địa chỉ email</li>
              <li>Lịch sử truy cập và cookie trình duyệt (ẩn danh dùng cho tối ưu hóa hệ thống).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">2. Mục đích sử dụng dữ liệu</h2>
            <p className="text-text-secondary leading-relaxed text-sm md:text-base">
              Mọi dữ liệu cá nhân thu thập sẽ chỉ được sử dụng cho các mục đích:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-text-secondary text-sm md:text-base mt-3 marker:text-accent/50">
              <li>Xác nhận lịch hẹn xem bất động sản.</li>
              <li>Giải đáp các câu hỏi, phản hồi về báo giá hoặc thông tin dự án bạn yêu cầu.</li>
              <li>Gửi thông báo về sản phẩm mới, bản tin thị trường (nếu được đồng ý nhận thông tin).</li>
              <li>Cải thiện trải nghiệm trang web và thiết kế hệ thống tính năng phù hợp người dùng.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">3. Chia sẻ thông tin</h2>
            <p className="text-text-secondary leading-relaxed text-sm md:text-base">
              Greenia Homes <strong className="text-text-primary font-medium">CAM KẾT KHÔNG</strong> bán, trao đổi hoặc chia sẻ dữ liệu cá nhân của bạn với bất kỳ bên thứ ba vì mục đích thương mại tiếp thị độc lập. Dữ liệu chỉ được chia sẻ trong trường hợp có sự yêu cầu từ Cơ quan pháp luật theo điều lệ của nhà nước.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">4. Cookie & Theo dõi kỹ thuật số</h2>
            <p className="text-text-secondary leading-relaxed text-sm md:text-base">
              Chúng tôi sử dụng Cookie và các công nghệ tương đương (từ Google Analytics, Facebook Pixel) để phân tích lưu lượng. Các thông tin thu thập bao gồm hành vi bấm, thời gian xem trang, nhưng tất cả đều ở trạng thái phi định danh.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">5. Lưu trữ & Bảo mật</h2>
            <p className="text-text-secondary leading-relaxed text-sm md:text-base">
              Thông tin người dùng được mã hóa SSL trên đường truyền nối và lưu trữ an toàn định kỳ trong Database được bảo vệ nghiêm ngặt. Chúng tôi áp dụng chuẩn bảo mật cao cấp quốc tế cho việc bảo tồn danh tính khách VIP và thông tin giao dịch đầu tư.
            </p>
          </section>

          <div className="pt-8 mt-12 border-t border-border-color">
             <p className="text-sm text-white/70 italic">Văn bản có mục đích tham khảo và thực thi ngay khi phát hành công khai. Nếu quý khách muốn gỡ bỏ dữ liệu khỏi hệ thống, vui lòng truy cập trang <button className="text-accent hover:text-emerald-400 font-medium hover:underline" onClick={() => onNavigate({ screen: 'lien-he' })}>Liên hệ</button> và gửi yêu cầu, chúng tôi sẽ xử lý ngay lập tức.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
