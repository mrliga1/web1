import React, { useEffect } from 'react';
import { RouteState } from '../types';
import { Shield, Lock, Eye, CheckCircle2, UserCheck, HardDrive } from 'lucide-react';
import { motion } from 'framer-motion';

interface PrivacyPolicyProps {
  onNavigate: (route: RouteState) => void;
}

export default function PrivacyPolicy({ onNavigate }: PrivacyPolicyProps) {
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
      icon: <UserCheck className="w-6 h-6 text-accent" />,
      title: "1. Thu thập thông tin cá nhân",
      content: "Chúng tôi chỉ thu thập các thông tin bạn tự nguyện cung cấp thông qua biểu mẫu: Yêu cầu tư vấn, Hẹn lịch xem nhà, Đăng ký nhận tin. Các thông tin có thể bao gồm:",
      list: [
        "Họ và tên",
        "Số điện thoại liên lạc",
        "Địa chỉ email",
        "Lịch sử truy cập và cookie trình duyệt (ẩn danh dùng cho tối ưu hóa hệ thống)."
      ]
    },
    {
      icon: <CheckCircle2 className="w-6 h-6 text-accent" />,
      title: "2. Mục đích sử dụng dữ liệu",
      content: "Mọi dữ liệu cá nhân thu thập sẽ chỉ được sử dụng cho các mục đích:",
      list: [
        "Xác nhận lịch hẹn xem bất động sản.",
        "Giải đáp các câu hỏi, phản hồi về báo giá hoặc thông tin dự án bạn yêu cầu.",
        "Gửi thông báo về sản phẩm mới, bản tin thị trường (nếu được đồng ý nhận thông tin).",
        "Cải thiện trải nghiệm trang web và thiết kế hệ thống tính năng phù hợp người dùng."
      ]
    },
    {
      icon: <Lock className="w-6 h-6 text-accent" />,
      title: "3. Chia sẻ thông tin",
      content: "Greenia Homes CAM KẾT KHÔNG bán, trao đổi hoặc chia sẻ dữ liệu cá nhân của bạn với bất kỳ bên thứ ba vì mục đích thương mại tiếp thị độc lập. Dữ liệu chỉ được chia sẻ trong trường hợp có sự yêu cầu từ Cơ quan pháp luật theo điều lệ của nhà nước."
    },
    {
      icon: <Eye className="w-6 h-6 text-accent" />,
      title: "4. Cookie & Theo dõi kỹ thuật số",
      content: "Chúng tôi sử dụng Cookie và các công nghệ tương đương (từ Google Analytics, Facebook Pixel) để phân tích lưu lượng. Các thông tin thu thập bao gồm hành vi bấm, thời gian xem trang, nhưng tất cả đều ở trạng thái phi định danh."
    },
    {
      icon: <HardDrive className="w-6 h-6 text-accent" />,
      title: "5. Lưu trữ & Bảo mật",
      content: "Thông tin người dùng được mã hóa SSL trên đường truyền nối và lưu trữ an toàn định kỳ trong Database được bảo vệ nghiêm ngặt. Chúng tôi áp dụng chuẩn bảo mật cao cấp quốc tế cho việc bảo tồn danh tính khách VIP và thông tin giao dịch đầu tư."
    }
  ];

  return (
    <div className="bg-bg-surface font-sans text-text-secondary min-h-screen relative overflow-hidden pb-20 pt-10">
      
      {/* Background Decorators */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-accent/10 via-accent/5 to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Hero Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-[#047857] to-accent rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-accent/20 -rotate-3 hover:rotate-0 transition-transform duration-300">
             <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-text-primary mb-6 tracking-tight">
            Chính Sách Bảo Mật
          </h1>
          <p className="text-text-secondary text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            <strong className="text-accent font-semibold">Greenia Homes</strong> coi trọng sự riêng tư của bạn. Chính sách này minh bạch hóa cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn.
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
              className="bg-bg-surface-alt/80 backdrop-blur-md border border-border-color rounded-2xl p-6 md:p-8 shadow-lg shadow-black/5 hover:shadow-xl hover:border-accent/30 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center shrink-0 mt-1">
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
                          <span className="text-accent font-bold mt-0.5">•</span>
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
            Văn bản có mục đích tham khảo và thực thi ngay khi phát hành công khai. Nếu quý khách muốn gỡ bỏ dữ liệu khỏi hệ thống, vui lòng truy cập trang <button className="text-accent hover:text-emerald-500 font-semibold hover:underline inline-flex items-center gap-1 transition-colors" onClick={() => onNavigate({ screen: 'lien-he' })}>Liên hệ</button> và gửi yêu cầu, chúng tôi sẽ xử lý ngay lập tức.
          </p>
        </motion.div>

      </div>
    </div>
  );
}
