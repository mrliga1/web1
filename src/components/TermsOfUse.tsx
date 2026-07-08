import React, { useEffect, useState } from 'react';
import { RouteState } from '../types';
import { FileText, Shield } from 'lucide-react';
import AdBanner from './AdBanner';
import { db, doc, getDoc } from '../firebase';

interface TermsOfUseProps {
  onNavigate: (route: RouteState) => void;
}

export default function TermsOfUse({ onNavigate }: TermsOfUseProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-bg-surface font-sans text-text-secondary min-h-screen">
      <div 
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500"
        style={{ paddingTop: '20px', paddingBottom: '20px' }}
      >
        
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-[#064E3B]/10 rounded-full flex items-center justify-center mx-auto mb-6">
             <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-primary  mb-6 tracking-tight">Điều Khoản Sử Dụng</h1>
          <p className="text-text-secondary text-sm md:text-base max-w-2xl mx-auto">
            Vui lòng đọc kỹ các điều khoản sử dụng dưới đây trước khi truy cập hoặc sử dụng các dịch vụ của Greenia Homes.
          </p>
        </div>

        <div className="bg-bg-surface/50 border border-border-color rounded-2xl p-6 md:p-10 shadow-xl space-y-8 prose prose-invert max-w-none prose-amber">
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">1. Chấp nhận các Điều khoản</h2>
            <p className="text-text-secondary leading-relaxed text-sm md:text-base">
              Bằng việc truy cập và sử dụng trang web Greenia Homes, bạn đồng ý tuân thủ và bị ràng buộc bởi các điều khoản và điều kiện này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản, bạn không được truy cập dịch vụ.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">2. Mô tả Dịch vụ</h2>
            <p className="text-text-secondary leading-relaxed text-sm md:text-base mb-4">
              Greenia Homes cung cấp dịch vụ tìm kiếm, tư vấn và cung cấp thông tin bất động sản bao gồm chuyển nhượng, cho thuê và dự án. Các dịch vụ bao gồm nhưng không giới hạn ở:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-text-secondary text-sm md:text-base marker:text-primary/50">
              <li>Thông tin dự án và bất động sản đang mở bán hoặc cho thuê.</li>
              <li>Kiến thức phong thủy và kinh nghiệm đầu tư địa ốc.</li>
              <li>Công cụ tìm kiếm và lọc bất động sản.</li>
              <li>Nền tảng liên hệ và hẹn lịch xem nhà trực tuyến.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">3. Trách nhiệm của Người dùng</h2>
            <p className="text-text-secondary leading-relaxed text-sm md:text-base">
              Bạn chịu trách nhiệm cung cấp thông tin chính xác khi gửi yêu cầu hoặc liên hệ tư vấn. Hành vi sử dụng trang web cho các mục đích sai trái, lừa đảo, phát tán mã độc hoặc gây hại đến hệ thống đều bị nghiêm cấm.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">4. Quyền sở hữu trí tuệ</h2>
            <p className="text-text-secondary leading-relaxed text-sm md:text-base">
              Toàn bộ nội dung, hình ảnh, văn bản, đồ họa và logo trên trang web đều thuộc quyền sở hữu của Greenia Homes hoặc được cung cấp có giấy phép sử dụng. Không sao chép hoặc phân phối nếu chưa được sự đồng ý bằng văn bản.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">5. Giới hạn trách nhiệm</h2>
            <p className="text-text-secondary leading-relaxed text-sm md:text-base">
              Greenia Homes nỗ lực để thông tin trên website là chính xác tại thời điểm đăng tải. Tuy nhiên, chúng tôi không đảm bảo nội dung hoàn toàn không có lỗi hoặc kịp thời trước những biến động thị trường. Quyết định giao dịch cuối cùng do người dùng tự đánh giá pháp lý và thương thảo trực tiếp.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">6. Cập nhật & Thêm bớt Điều khoản</h2>
            <p className="text-text-secondary leading-relaxed text-sm md:text-base">
               Chúng tôi bảo lưu quyền sửa đổi các tài liệu này bất cứ lúc nào. Những thay đổi sẽ ngay lập tức có hiệu lực khi được cập nhật tại đường dẫn này.
            </p>
          </section>

          <div className="pt-8 mt-12 border-t border-border-color">
             <p className="text-sm text-white/70 italic">Cập nhật lần cuối: Tháng 05/2026. Nếu có bất kỳ câu hỏi nào, xin vui lòng truy cập trang <button className="text-primary hover:text-primary font-medium hover:underline" onClick={() => onNavigate({ screen: 'lien-he' })}>Liên hệ</button> để được giải đáp.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
