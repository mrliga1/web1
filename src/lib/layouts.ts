import { VisualSection } from "../types";

// Backwards compatibility layout for Home screen
export const DEFAULT_HOME_SECTIONS: VisualSection[] = [
  {
    id: "hero",
    name: "Banner Hero",
    visible: true,
    paddingTop: 12,
    paddingBottom: 24,
    title: "Greenia Homes",
    subtitle: "Đồng hành - Tận Tâm - Vững Bước Tương Lai",
    description:
      "Greenia Homes là điểm tựa, sự đảm bảo và đồng hành xuyên suốt quá trình để sở hữu căn nhà mơ ước của khách hàng mua để ở, đối với quý khách hàng đầu tư Greenia Homes tự tin mang đến khách hàng những sản phẩm đầu tư an toàn, sinh lời ổn định và an tâm về pháp lý BĐS.\n\nGreenia Homes chuyên cung cấp và phân phối các sản phẩm từ những CĐT uy tín như: Vinhomes, Masteri Homes, Sun Group... Các dòng sản phẩm chủ lực: Căn hộ Cao cấp, Nhà phố, Biệt thự, Dinh thự...",
    imageUrl:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1600",
    extraData: {
      buttonText: "Tư Vấn Ngay",
      hotlineText: "Hotline Trực Tiếp: 0932 966 700",
    },
  },
  {
    id: "corporate_intro",
    name: "Hành Trình & Tầm Nhìn",
    visible: true,
    paddingTop: 80,
    paddingBottom: 80,
    title: "Greenia Homes Phân phối, Chuyển nhượng BĐS Chuyên nghiệp",
    subtitle: "Đồng hành cùng nhà đầu tư bất động sản",
    description:
      "Greenia Homes là điểm tựa, sự đảm bảo và đồng hành xuyên suốt quá trình để sở hữu căn nhà mơ ước của khách hàng mua để ở, đối với quý khách hàng đầu tư Greenia Homes tự tin mang đến khách hàng những sản phẩm đầu tư an toàn, sinh lời ổn định và an tâm về pháp lý BĐS.",
    extraData: {
      visionTitle: "Tầm Nhìn Sứ Mệnh",
      visionDesc:
        "Trở thành công ty tư vấn đầu tư và quản lý tài sản bất động sản hàng đầu, nơi kiến tạo và định chuẩn lại chất lượng phục vụ cho giới thượng lưu.",
      strategyTitle: "Chiến Lược Phát Triển",
      strategyDesc:
        "Kết hợp sự am hiểu thị trường sâu sắc của chuyên gia địa phương với hệ thống vận hành doanh nghiệp chuyên nghiệp: bám sát từng biên độ biến động giá, phân tích tính thanh khoản và đánh giá tiềm năng tăng trưởng thực tế.",
      processTitle: "Quy Trình Nghiệp Vụ",
      processDesc:
        "Tuyệt đối không chạy theo số lượng bề nổi. Mỗi giao dịch đều được thẩm định chéo qua 3 vòng: Tính pháp lý sạch, Dòng tiền kỳ vọng, và Yếu tố vượng khí phong thủy.",
    },
  },
  {
    id: "reasons",
    name: "Giá Trị Cốt Lõi",
    visible: true,
    paddingTop: 80,
    paddingBottom: 80,
    title: "Bảo Chứng Giá Trị Từ Uy Tín Cá Nhân Gắn Liền Trách Nhiệm Công Ty",
    subtitle: "Tại sao chọn chúng tôi",
    description:
      'Sự mở rộng quy mô thành Greenia Homes không làm mất đi "chất" tận tụy của người làm nghề nguyên bản, mà càng củng cố thêm sức mạnh nguồn lực để bảo vệ quyền lợi tối thượng cho khách hàng.',
    extraData: {
      item1Title: "Bảo mật thông tin tối thượng",
      item1Desc:
        "Đối với những thương vụ lớn, Founder trực tiếp dẫn dắt quá trình đàm phán, đảm bảo không một chi tiết pháp lý hay điều khoản nào bị bỏ sót.",
      item2Title: "Tập trung rạch ròi mảng xanh",
      item2Desc:
        "Nhờ mạng lưới quan hệ sâu rộng cá nhân, chúng tôi nắm giữ nhiều danh mục tài sản khan hiếm chưa từng public ra thị trường.",
      item3Title: "Thủ tục pháp lý mượt mà",
      item3Desc:
        "Quy trình hậu mãi (sang tên, thủ tục ngân hàng, hoàn thiện nội thất) được đội ngũ back-office của công ty xử lý nhanh chóng.",
      stat1Val: "7+ Năm",
      stat1Label: "Kinh Nghiệm Thực Chiến",
      stat1Desc:
        "Am tường mọi biến động và chu kỳ của thị trường bất động sản.",
      stat2Val: "100%",
      stat2Label: "Minh Bạch Pháp Lý",
      stat2Desc:
        "Kiểm chứng độc lập toàn bộ pháp lý trước khi đề xuất cho khách hàng.",
      stat3Val: "Cá Nhân Hoá",
      stat3Label: "Tư Vấn Chuyên Sâu",
      stat3Desc:
        "Thiết kế riêng chiến lược cho từng chân dung tài chính và khẩu vị rủi ro.",
    },
  },
  {
    id: "featured_listings",
    name: "Sản phẩm Nổi bật",
    visible: true,
    paddingTop: 80,
    paddingBottom: 80,
    title: "Danh Mục Đầu Tư Chắt Lọc Chọn Lọc",
    subtitle: "Quỹ căn giá trị cao",
    description:
      "Mỗi sản phẩm đều qua sự thẩm định gắt gao của Greenia Homes trước khi giới thiệu đến Quý nhà đầu tư.",
  },
  {
    id: "projects",
    name: "Khu Đại Đô Thị Nổi Bật",
    visible: true,
    paddingTop: 80,
    paddingBottom: 80,
    title: "Dự Án Trọng Điểm & Tiềm Năng Bứt Phá",
    subtitle: "Phân tích quy hoạch",
    description:
      "Danh mục các dự án đang tạo sóng hạ tầng, được bảo chứng bởi các chủ đầu tư uy tín nhất.",
  },
  {
    id: "news",
    name: "Góc Nhìn Chuyên Gia",
    visible: true,
    paddingTop: 80,
    paddingBottom: 80,
    title: "Phân Tích Bối Cảnh & Định Hướng Phân Khúc",
    subtitle: "Góc nhìn chuyên gia",
    description:
      "Những chia sẻ thực chiến, kiến thức vĩ mô và cẩm nang đầu tư được biên soạn trực tiếp bởi Founder và ban cố vấn.",
  },
];

export const DEFAULT_PRODUCT_SECTIONS: VisualSection[] = [
  {
    id: "products_header",
    name: "Tiêu Đề & Giới Thiệu Sàn Giao Dịch",
    visible: true,
    paddingTop: 40,
    paddingBottom: 24,
    title: "Thương Mục [gradient]Bất Động Sản Cao Cấp[/gradient]",
    subtitle: "Hệ thống giao dịch Greenia",
    description:
      "Mục lục lọc tìm thông minh biệt thự rợp bóng mây, Duplex sân vườn bạt ngàn sinh khí, hoặc penthouse trọn vẹn đặc quyền sống vương giả.",
  },
  {
    id: "products_filter",
    name: "Thanh Tìm Kiếm & Bộ Lọc Đa Năng",
    visible: true,
    paddingTop: 0,
    paddingBottom: 32,
    title: "Vui lòng điền tiêu điểm tìm kiếm",
    subtitle: "CÔNG CỤ TRA CỨU TIỆN ÍCH",
    description:
      "Phân loại rạch ròi biệt thự mua bán, căn hộ cho thuê, chọn giá trị đầu tư và địa hạt quận huyện hỗ trợ nhanh.",
  },
  {
    id: "products_grid",
    name: "Lưới Tin Giao Dịch Chính Toàn Sàn",
    visible: true,
    paddingTop: 0,
    paddingBottom: 48,
    title: "Bàn giao đúng hạn, đắc lộc cát tường",
    subtitle: "TIN ĐĂNG MỚI ĐƯỢC DUYỆT",
    description:
      "Sắp xếp chuẩn vĩ mô theo dòng thời gian tin đăng, tối ưu hóa thông điệp pháp lý của biệt phủ sang nhượng.",
  },
  {
    id: "recently_viewed",
    name: "Bất Động Sản Đã Xem (Lịch Sử Riêng)",
    visible: true,
    paddingTop: 40,
    paddingBottom: 40,
    title: "Bất Động Sản [gradient]Dành Cho Riêng Bạn[/gradient]",
    subtitle: "Khám phá sở thích cá nhân",
    description:
      "Lịch sử lưu vết bảo mật thiết bị đầu cuối các sản phẩm biệt thự, dinh thự Chateau mà quý khách vừa xem.",
  },
  {
    id: "latest_sales",
    name: "Dãy Sản Phẩm Bán Mới Nhất (Slide Ngang)",
    visible: true,
    paddingTop: 20,
    paddingBottom: 20,
    title: "Danh Sách Bán Mới Nhất",
    subtitle: "QUỸ ĐẤT VÀNG PHÚ MỸ HƯNG",
    description:
      "Tuyển tập dinh thự biệt lập ôm dải công viên ven sông, bàn giao sổ hồng vĩnh viễn trao tay giao dịch nhanh.",
  },
  {
    id: "latest_rents",
    name: "Dãy Cho Thuê Cao Cấp (Slide Ngang)",
    visible: true,
    paddingTop: 20,
    paddingBottom: 20,
    title: "Danh Sách Cho Thuê Mới Nhất",
    subtitle: "CĂN HỘ CAO CẤP & SKY VILLA",
    description:
      "Penthouse thông tầng sầm uất view ngắm pháo hoa Thảo Điền bàn giao hoàn hảo nội thất hoàng gia siêu đắt đỏ.",
  },
  {
    id: "featured_projects",
    name: "Khu Dự Án Đô Thị Nhộn Nhịp (Slide Ngang)",
    visible: true,
    paddingTop: 20,
    paddingBottom: 40,
    title: "Dự Án Kiến Trúc Tiêu Điểm",
    subtitle: "ĐẠI ĐỒ THỊ XANH QUY MÔ",
    description:
      "Đón đầu quy hoạch vĩ mô lấn biển và bán đảo xanh an lành, được chứng thực quy hoạch thông minh từ ban trị sự.",
  },
];

export const DEFAULT_PROJECT_SECTIONS: VisualSection[] = [
  {
    id: "projects_header",
    name: "Tiêu Đề Khu Quy Hoạch Cao Cấp",
    visible: true,
    paddingTop: 40,
    paddingBottom: 24,
    title: "Khu Đại [gradient]Đô Thị Đăng Cấp[/gradient]",
    subtitle: "Bản đồ quy hoạch vĩ mô",
    description:
      "Nơi quy tập các dự án xanh, bến du thuyền cao sang và hòn ngọc thiết kế có đầy đủ quy hoạch tổng khu an lành từ tập đoàn hàng đầu.",
  },
  {
    id: "projects_grid",
    name: "Danh Sách Quy Hoạch Mở Bán AJAX",
    visible: true,
    paddingTop: 0,
    paddingBottom: 48,
    title: "Lộ trình mở bán công bố đợt này",
    subtitle: "HỒ SƠ BẤT ĐỘNG SẢN",
    description:
      "Cập nhật dòng tiền vĩ mô, sa bàn hạ tầng quy mô bứt phá của dự án lớn đón đầu đầu tư.",
  },
  {
    id: "projects_featured_products",
    name: "Biệt Thự & Căn Hộ Hot View (Lượt Xem Cao)",
    visible: true,
    paddingTop: 40,
    paddingBottom: 40,
    title: "Sản Phẩm Nổi Bật",
    subtitle: "TÚC TRỰC SỰ CHÚ Ý",
    description:
      "Bộ sưu tập các bất động sản cao cấp được săn đón nhiều nhất, hội tụ giá trị đầu tư và chuẩn mực sống đẳng cấp.",
  },
];

export const DEFAULT_NEWS_SECTIONS: VisualSection[] = [
  {
    id: "news_header",
    name: "Kênh Phân Tích & Tư Vấn Phong Thủy",
    visible: true,
    paddingTop: 45,
    paddingBottom: 24,
    title: "Kênh [gradient]Tin Tức & Phân Tích[/gradient] Chuyên Sâu",
    subtitle: "Nhãn quan vĩ mô từ chuyên khoa địa lý",
    description:
      "Giúp bạn có bối cảnh minh triết trước khi đầu tư vạn lộc đất vàng, cẩm nang xem bát trạch đặt bàn thờ và cổng ngõ tài lộc.",
  },
  {
    id: "news_categories",
    name: "Thanh Phân Loại Tab Đọc Tin",
    visible: true,
    paddingTop: 0,
    paddingBottom: 24,
    title: "Tìm thấy chủ đề đặc biệt tư vấn",
    subtitle: "PHÂN LOẠI DANH MỤC",
    description:
      "Chọn rạch ròi phân loại tin tức thị trường, kiến thức phong thủy và kinh nghiệm đầu tư vĩ mô thích hợp.",
  },
  {
    id: "news_tri_column",
    name: "Sơ Đồ Tam Cột Khám Phá Bài Tin Đỉnh",
    visible: true,
    paddingTop: 0,
    paddingBottom: 48,
    title: "Luồng bài phân tích tương tác tức thì",
    subtitle: "MỤC LỤC CHUYÊN SÂU",
    description:
      "Sự bài bố tam cột độc bản giúp bạn tiếp cận nhanh mục lục bài đọc hot nhất, bài viết theo định kỳ và xu hướng đọc cao.",
  },
  {
    id: "news_interests",
    name: "Phần Bài Viết Bạn Có Thể Muốn Đọc",
    visible: true,
    paddingTop: 40,
    paddingBottom: 40,
    title: "Cơ Cấu Bạn Có Thể Cần Quan Tâm",
    subtitle: "GIÁ TRỊ KIẾN THỨC BỒI ĐẤP",
    description:
      "Duyệt theo chiều rộng những bài viết chọn lọc kỹ càng cùng tính năng đồng bộ sản phẩm tương ứng.",
  },
  {
    id: "news_bottom_sales",
    name: "BĐS Bán Mới Hot (Slide Gót Chân)",
    visible: true,
    paddingTop: 20,
    paddingBottom: 20,
    title: "Sản Phẩm Bán Mới Đề Xuất Sâu",
    subtitle: "VẬN CHUYỂN TÀI LỘC",
    description:
      "Quỹ đất nền biệt thự vương giã sát đắp bờ sông xanh Phú Mỹ Hưng đang mở bán đợt đặc biệt.",
  },
  {
    id: "news_bottom_rents",
    name: "BĐS Thuê Cao Cấp (Slide Gót Chân)",
    visible: true,
    paddingTop: 20,
    paddingBottom: 40,
    title: "Sản Phẩm Cho Thuê Xu Hướng",
    subtitle: "GIA TĂNG TRẢI NGHIỆM",
    description:
      "Căn hộ Sky Villa đẳng cấp có đầy đủ nội thất túc trực chờ đón cư dân thượng lưu xách vali vào ở ngay.",
  },
];

export const DEFAULT_CONTACT_SECTIONS: VisualSection[] = [
  {
    id: "contact_header",
    name: "Tiêu Đề Trực Diện Khởi Sự",
    visible: true,
    paddingTop: 50,
    paddingBottom: 24,
    title: "Khởi Sự [gradient]Thương Lượng Đồng Hành[/gradient]",
    subtitle: "LIÊN HỆ QUY CÔNG TY CHÚNG TÔI",
    description:
      "Văn phòng giao dịch khép kín túc trực giải quyết vấn đề ký gửi, tham quan hoặc nghiên cứu giấy tờ sổ hồng trực tiếp.",
  },
  {
    id: "contact_body",
    name: "Trụ sở Hành chính & Biểu mẫu Ký gửi",
    visible: true,
    paddingTop: 0,
    paddingBottom: 80,
    title: "Nhận thư mời trà tham kiến",
    subtitle: "KẾT NỐI CHUYÊN VIÊN TRỊ SỰ",
    description:
      "Kính mong Quý nhà đầu tư trao gởi băn khoăn về đặc tính và bản mệnh nhà ở để được giải đáp bằng lòng chân thành tối thượng.",
  },
];

// Available generic sections to ADD dynamically
export const GENERIC_CUSTOM_SECTIONS: (Omit<VisualSection, "id"> & {
  prefix?: string;
})[] = [
  {
    prefix: "custom_banner_promo",
    name: "Khối Banner Quảng Cáo (VIP Promo)",
    visible: true,
    paddingTop: 60,
    paddingBottom: 60,
    title: "Đại Dạ Tiệc Thượng Lưu [gradient]Greenia Club VIP Gala[/gradient]",
    subtitle: "Đặc Quyền Hội Viên Thượng Vy",
    description:
      "Trân trọng kính mời cư dân thượng lưu tham gia tiệc trà du thuyền cao cấp vào ngày cuối tuần này. Cơ hội gặp gỡ giao lưu cùng các Chủ tịch Tập đoàn lớn và nghe thuyết luận cục diện phong thủy Nam Sài Gòn 2026.",
    imageUrl:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800",
    extraData: {
      buttonText: "Đăng ký nhận vé mời đặc quyền (Giấy mời bảo mật)",
      linkUrl: "#lien-he",
    },
  },
  {
    prefix: "custom_cta_call",
    name: "Khối Liên Hệ Môi Giới Nhanh (Hotline & Mail)",
    visible: true,
    paddingTop: 80,
    paddingBottom: 80,
    title: "Khơi Thông Đại Lộc [gradient]Ký Gửi & Bán Biệt Phủ[/gradient]",
    subtitle: "Ký gửi bất động sản bảo mật",
    description:
      "Chúng tôi cam kết bảo mật rạch ròi lý lịch gia chủ, đẩy mạnh liên kết cùng đội ngũ môi giới túc trực chốt cọc siêu tốc biệt thự ven sông trong vòng 3 tuần lễ.",
    extraData: {
      hotline: "Hotline ưu tiên: 0932 966 700",
      email: "sales@greeniahomes.vn",
      ctaText: "Gặp gỡ Chuyên viên thẩm định pháp lý miễn phí cực chuẩn!",
    },
  },
  {
    prefix: "custom_text_block",
    name: "Khối Văn Bản Thuyết Minh Thêm (Rich Text Block)",
    visible: true,
    paddingTop: 60,
    paddingBottom: 60,
    title: "Triết Lý Sông Nước & Tầm Quan Trọng Minh Đường",
    subtitle: "Thuyết học Phong Thủy Địa ốc cổ chỉ",
    description:
      "Một ngôi nhà vượng cát là ngôi nhà sở hữu tụ khí minh đường thoáng rộng có cỏ hoa sinh khí ngập tràn bờ bồi. Vùng đất tụ thủy tàng phong giúp gia thần an yên, bồi tụ long mạch của gia đạo. Luôn luôn chọn những căn biệt phủ cách bờ sông tự nhiên từ 50-100m để nhận làn hơi ẩm ngập sinh khí bồi tụ.",
  },
  {
    prefix: "custom_testimonials",
    name: "Khối Ý Kiến Khách Hàng VIP (Testimonials)",
    visible: true,
    paddingTop: 60,
    paddingBottom: 60,
    title: "Lời Khẳng Định Từ Quý Hội Viên Thượng Lưu",
    subtitle: "Cát đắp lòng tin bền bỉ",
    description:
      "Đồng hành xây dựng phong thủy hanh thông cho các bậc tỷ phú doanh nhân đứng đầu dòng chảy tài chính tại Việt Nam.",
    extraData: {
      client1: "Ông Nguyễn Tấn Minh (Tổng giám đốc Cảng Sài Gòn)",
      feedback1:
        "Gần 5 năm giao dịch, Greenia Homes là đơn vị duy nhất tôi tin cậy sang tên các dải đất ven sông. Sự bảo mật thông điệp của họ là lý do tôi luôn bình chọn 5 sao.",
      client2: "Bà Mai Phương Vy (Chủ tịch VyVy Jewelry)",
      feedback2:
        "Sự chu đáo của bạn Thận về nghiên cứu cung mệnh và bày trí bệ trà phong thủy trong căn penthouse Masteri Quận 2 làm gia đình tôi vô cùng an khang.",
    },
  },
  {
    prefix: "custom_partners",
    name: "Khối Biểu Đồ Đối Tác Liên Kết (Brands Grid)",
    visible: true,
    paddingTop: 40,
    paddingBottom: 40,
    title: "Liên Kết Hùng Mạnh Với Các Định Chế Tài Chính Quốc Gia",
    subtitle: "Đối tác uy tín chiến lược",
    description:
      "Chung vai sát cánh cùng Vingroup, Phú Mỹ Hưng Corp và các ngân hàng bảo lãnh tài lộc hỗ trợ duyệt lãi suất 0%.",
  },
  {
    prefix: "custom_free_canvas",
    name: "Khối LadiPage Kéo Thả Tự Do (Free-form Canvas Builder)",
    visible: true,
    paddingTop: 40,
    paddingBottom: 40,
    title: "BÀN THIẾT KẾ KÉO THẢ TỰ DO",
    subtitle: "LadiPage Visual Drag Floor",
    description: "Hãy bấm biên tập để di chuyển mọi thứ tùy ý thích",
    extraData: {
      canvasHeight: 600,
      elements: [
        {
          id: "title_1",
          type: "text",
          left: 10,
          top: 8,
          width: 80,
          content: "QUỸ CĂN CHATEAU & ĐẤT NỀN THẢO ĐIỀN ĐỘC QUYỀN",
          style: {
            fontFamily: "font-display",
            fontSize: "2xl",
            fontWeight: "extrabold",
            color: "#fbbf24",
            textAlign: "center",
            padding: "8px",
          },
        },
        {
          id: "subtitle_1",
          type: "text",
          left: 15,
          top: 18,
          width: 70,
          content:
            "Nhận bảng thẩm định phong thủy và long sinh vượng khí từ Ban Trị sự Greenia Homes",
          style: {
            fontFamily: "font-sans",
            fontSize: "xs",
            color: "#a1a1aa",
            textAlign: "center",
            padding: "4px",
          },
        },
        {
          id: "image_1",
          type: "image",
          left: 60,
          top: 28,
          width: 34,
          content:
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600",
          style: {
            borderRadius: "24px",
            borderStyle: "solid",
            borderWidth: "2px",
            borderColor: "#10b981",
          },
        },
        {
          id: "btn_1",
          type: "button",
          left: 30,
          top: 78,
          width: 40,
          content: "LIÊN HỆ KHẢO SÁT PHONG THỦY NGAY",
          linkUrl: "#lien-he",
          style: {
            fontFamily: "font-display",
            fontSize: "xs",
            fontWeight: "bold",
            color: "#020617",
            backgroundColor: "#10b981",
            borderRadius: "9999px",
            padding: "12px",
            borderStyle: "none",
            textAlign: "center",
          },
        },
      ],
    },
  },
];

export const getPageDefaultSections = (screen: string): VisualSection[] => {
  switch (screen) {
    case "home":
      return DEFAULT_HOME_SECTIONS;
    case "san-pham":
      return DEFAULT_PRODUCT_SECTIONS;
    case "du-an":
      return DEFAULT_PROJECT_SECTIONS;
    case "tin-tuc":
      return DEFAULT_NEWS_SECTIONS;
    case "lien-he":
      return DEFAULT_CONTACT_SECTIONS;
    default:
      return DEFAULT_HOME_SECTIONS;
  }
};
