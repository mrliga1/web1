import React, { useEffect } from 'react';
import { RouteState } from '../types';
import { FileText, ShieldCheck, Scale, Globe, Copyright, AlertTriangle, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface TermsOfUseProps {
  onNavigate: (route: RouteState) => void;
}

export default function TermsOfUse({ onNavigate }: TermsOfUseProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    },
  };

  const sections = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-primary" />,
      title: "1. Chấp nhận các Điều khoản",
      content: "Bằng việc truy cập và sử dụng trang web Greenia Homes, bạn đồng ý tuân thủ và bị ràng buộc bởi các điều khoản và điều kiện này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản, bạn không được truy cập dịch vụ."
    },
    {
      icon: <Globe className="w-6 h-6 text-primary" />,
      title: "2. Mô tả Dịch vụ",
      content: "Greenia Homes cung cấp dịch vụ tìm kiếm, tư vấn và cung cấp thông tin bất động sản bao gồm chuyển nhượng, cho thuê và dự án. Các dịch vụ bao gồm nhưng không giới hạn ở:",
      list: [
        "Thông tin dự án và bất động sản đang mở bán hoặc cho thuê.",
        "Kiến thức phong thủy và kinh nghiệm đầu tư địa ốc.",
        "Công cụ tìm kiếm và lọc bất động sản.",
        "Nền tảng liên hệ và hẹn lịch xem nhà trực tuyến."
      ]
    },
    {
      icon: <Scale className="w-6 h-6 text-primary" />,
      title: "3. Trách nhiệm của Người dùng",
      content: "Bạn chịu trách nhiệm cung cấp thông tin chính xác khi gửi yêu cầu hoặc liên hệ tư vấn. Hành vi sử dụng trang web cho các mục đích sai trái, lừa đảo, phát tán mã độc hoặc gây hại đến hệ thống đều bị nghiêm cấm."
    },
    {
      icon: <Copyright className="w-6 h-6 text-primary" />,
      title: "4. Quyền sở hữu trí tuệ",
      content: "Toàn bộ nội dung, hình ảnh, văn bản, đồ họa và logo trên trang web đều thuộc quyền sở hữu của Greenia Homes hoặc được cung cấp có giấy phép sử dụng. Không sao chép hoặc phân phối nếu chưa được sự đồng ý bằng văn bản."
    },
    {
      icon: <AlertTriangle className="w-6 h-6 text-primary" />,
      title: "5. Giới hạn trách nhiệm",
      content: "Greenia Homes nỗ lực để thông tin trên website là chính xác tại thời điểm đăng tải. Tuy nhiên, chúng tôi không đảm bảo nội dung hoàn toàn không có lỗi hoặc kịp thời trước những biến động thị trường. Quyết định giao dịch cuối cùng do người dùng tự đánh giá pháp lý và thương thảo trực tiếp."
    },
    {
      icon: <RefreshCcw className="w-6 h-6 text-primary" />,
      title: "6. Cập nhật & Thêm bớt Điều khoản",
      content: "Chúng tôi bảo lưu quyền sửa đổi các tài liệu này bất cứ lúc nào. Những thay đổi sẽ ngay lập tức có hiệu lực khi được cập nhật tại đường dẫn này."
    }
  ];

  return (
    <div className="bg-bg-surface font-sans text-text-secondary min-h-screen relative overflow-hidden pb-20 pt-10">
      
      {/* Background Decorators */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Hero Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-[#064E3B] to-primary rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/20 rotate-3 hover:rotate-0 transition-transform duration-300">
             <FileText className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-text-primary mb-6 tracking-tight">
            Điều Khoản Sử Dụng
          </h1>
          <p className="text-text-secondary text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Vui lòng đọc kỹ các điều khoản dưới đây để hiểu rõ quyền lợi và trách nhiệm của bạn khi truy cập, sử dụng các dịch vụ của <strong className="text-primary font-semibold">Greenia Homes</strong>.
          </p>
        </motion.div>

        {/* Content Cards */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {sections.map((section, index) => (
            <motion.div 
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.01, translateY: -2 }}
              className="bg-bg-surface-alt/80 backdrop-blur-md border border-border-color rounded-2xl p-6 md:p-8 shadow-lg shadow-black/5 hover:shadow-xl hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 mt-1">
                  {section.icon}
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-3 font-display">{section.title}</h2>
                  <p className="text-text-secondary leading-relaxed text-sm md:text-base">
                    {section.content}
                  </p>
                  {section.list && (
                    <ul className="mt-4 space-y-2">
                      {section.list.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm md:text-base text-text-secondary">
                          <span className="text-primary font-bold mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer Note */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-16 pt-8 border-t border-border-color text-center"
        >
          <p className="text-sm md:text-base text-text-secondary italic bg-bg-surface-alt/50 inline-block px-6 py-3 rounded-full border border-border-color/50">
            Cập nhật lần cuối: <span className="font-semibold text-text-primary">Tháng 05/2026</span>. Nếu có bất kỳ câu hỏi nào, vui lòng truy cập trang <button className="text-primary hover:text-primary-dark font-semibold hover:underline inline-flex items-center gap-1 transition-colors" onClick={() => onNavigate({ screen: 'lien-he' })}>Liên hệ</button> để được giải đáp.
          </p>
        </motion.div>

      </div>
    </div>
  );
}
