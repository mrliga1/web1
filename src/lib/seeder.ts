import { collection, getDocs, addDoc, doc, setDoc, db } from '../firebase';
import { Product, Project, News, Category } from '../types';

export async function seedAllDatabase(onShowNotification?: (msg: string, type: 'success' | 'error') => void) {
  try {
    // 1. Seed Categories if empty
    const catCol = collection(db, 'categories');
    const catSnap = await getDocs(catCol);
    if (catSnap.empty) {
      const defaultCategories: Omit<Category, 'id'>[] = [
        { name: "Biệt thự & Villa", type: "product" },
        { name: "Căn hộ cao cấp", type: "product" },
        { name: "Nhà phố thương mại", type: "product" },
        { name: "Penthouse & Duplex", type: "product" },
        { name: "Đất nền dự án", type: "product" },
        { name: "Tin thị trường", type: "news" },
        { name: "Kinh nghiệm sở hữu", type: "news" },
        { name: "Phân tích đầu tư", type: "news" },
        { name: "Phong thủy nhà ở", type: "news" }
      ];
      for (const cat of defaultCategories) {
        await addDoc(catCol, cat);
      }
    }

    // 2. Seed Products if empty (Minimum 16 items for 5-column 2-row grids and AJAX loading)
    const prodCol = collection(db, 'products');
    const prodSnap = await getDocs(prodCol);
    if (prodSnap.empty) {
      const mockProducts: Omit<Product, 'id'>[] = [
        {
          title: "Biệt thự Đơn lập Greenia Riverside Phú Mỹ Hưng Q7",
          priceText: "48 Tỷ VND",
          priceVal: 48000000000,
          type: "sale",
          district: "Quận 7",
          phone: "0932 966 700",
          imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
          imageUrls: [
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800"
          ],
          area: 450,
          bedrooms: 5,
          toilets: 6,
          direction: "Đông Nam",
          roadWidth: "16m",
          legalStatus: "Sổ hồng hoàn công chính chủ",
          floors: 3,
          category: "Biệt thự & Villa",
          viewsCount: 2450,
          createdAt: new Date().toISOString(),
          createdBy: "Nguyenthanhthuan091095@gmail.com",
          createdByRole: 'admin',
          approvalStatus: 'approved'
        },
        {
          title: "Căn hộ Penthouse thông tầng Sunwah Pearl Bình Thạnh",
          priceText: "32 Tỷ VND",
          priceVal: 32000000000,
          type: "sale",
          district: "Quận Bình Thạnh",
          phone: "0932 966 700",
          imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800",
          imageUrls: [
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=800"
          ],
          area: 320,
          bedrooms: 4,
          toilets: 4,
          direction: "Đông Bắc",
          roadWidth: "20m",
          legalStatus: "Hợp đồng mua bán chính chủ",
          floors: 2,
          category: "Penthouse & Duplex",
          viewsCount: 1820,
          createdAt: new Date().toISOString(),
          createdBy: "Nguyenthanhthuan091095@gmail.com",
          createdByRole: 'admin',
          approvalStatus: 'approved'
        },
        {
          title: "Shophouse phong cách Ý dự án Global City TP Thủ Đức",
          priceText: "22.5 Tỷ VND",
          priceVal: 22500000000,
          type: "sale",
          district: "TP. Thủ Đức",
          phone: "0932 966 700",
          imageUrl: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=800",
          area: 120,
          bedrooms: 3,
          toilets: 4,
          direction: "Tây Nam",
          roadWidth: "18m",
          legalStatus: "Sổ hồng riêng từng căn",
          floors: 4,
          category: "Nhà phố thương mại",
          viewsCount: 1540,
          createdAt: new Date().toISOString(),
          createdBy: "Nguyenthanhthuan091095@gmail.com",
          createdByRole: 'admin',
          approvalStatus: 'approved'
        },
        {
          title: "Villa Sân Vườn Biệt Lập Holm Residences Thảo Điền Quận 2",
          priceText: "125 Tỷ VND",
          priceVal: 125000000000,
          type: "sale",
          district: "TP. Thủ Đức",
          phone: "0932 966 700",
          imageUrl: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=800",
          area: 600,
          bedrooms: 6,
          toilets: 7,
          direction: "Nam",
          roadWidth: "12m",
          legalStatus: "Sổ hồng hoàn công đầy đủ",
          floors: 3,
          category: "Biệt thự & Villa",
          viewsCount: 3910,
          createdAt: new Date().toISOString(),
          createdBy: "admin",
          createdByRole: 'admin',
          approvalStatus: 'approved'
        },
        {
          title: "Căn Hộ Studio Cao Cấp Studio Vinhomes Golden River Quận 1",
          priceText: "15 Triệu/tháng",
          priceVal: 15000000,
          type: "rent",
          district: "Quận 1",
          phone: "0932 966 700",
          imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800",
          area: 50,
          bedrooms: 1,
          toilets: 1,
          direction: "Đông",
          roadWidth: "30m",
          legalStatus: "Sổ hồng chính phủ",
          floors: 1,
          category: "Căn hộ cao cấp",
          viewsCount: 1200,
          createdAt: new Date().toISOString(),
          createdBy: "admin",
          createdByRole: 'admin',
          approvalStatus: 'approved'
        },
        {
          title: "Biệt thự Song lập Chateau Phú Mỹ Hưng View Nhất Sông",
          priceText: "95 Tỷ VND",
          priceVal: 95000000000,
          type: "sale",
          district: "Quận 7",
          phone: "0932 966 700",
          imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800",
          area: 380,
          bedrooms: 4,
          toilets: 5,
          direction: "Đông Nam",
          roadWidth: "14m",
          legalStatus: "Sổ hồng pháp lý hoàn chỉnh",
          floors: 3,
          category: "Biệt thự & Villa",
          viewsCount: 2950,
          createdAt: new Date().toISOString(),
          createdBy: "admin",
          createdByRole: 'admin',
          approvalStatus: 'approved'
        },
        {
          title: "Căn hộ Duplex Sân Vườn Thượng Uyển Empire City Thủ Thiêm",
          priceText: "42 Tỷ VND",
          priceVal: 42000000000,
          type: "sale",
          district: "TP. Thủ Đức",
          phone: "0932 966 700",
          imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=800",
          area: 210,
          bedrooms: 3,
          toilets: 3,
          direction: "Tây Bắc",
          roadWidth: "16m",
          legalStatus: "Hợp đồng sở hữu độc quyền",
          floors: 2,
          category: "Penthouse & Duplex",
          viewsCount: 2120,
          createdAt: new Date().toISOString(),
          createdBy: "admin",
          createdByRole: 'admin',
          approvalStatus: 'approved'
        },
        {
          title: "Căn hộ Premium 3 Phòng Ngủ Masteri Thảo Điền Giá Tốt",
          priceText: "25 Triệu/tháng",
          priceVal: 25000000,
          type: "rent",
          district: "TP. Thủ Đức",
          phone: "0932 966 700",
          imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800",
          area: 98,
          bedrooms: 3,
          toilets: 2,
          direction: "Đông Nam",
          roadWidth: "24m",
          legalStatus: "Sổ hồng căn hộ riêng",
          floors: 1,
          category: "Căn hộ cao cấp",
          viewsCount: 940,
          createdAt: new Date().toISOString(),
          createdBy: "admin",
          createdByRole: 'admin',
          approvalStatus: 'approved'
        },
        {
          title: "Nhà phố góc 2 mặt tiền khu Sala Đại Quang Minh Thủ Thiêm",
          priceText: "82 Tỷ VND",
          priceVal: 82000000000,
          type: "sale",
          district: "TP. Thủ Đức",
          phone: "0932 966 700",
          imageUrl: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&q=80&w=800",
          area: 160,
          bedrooms: 4,
          toilets: 5,
          direction: "Tây Nam",
          roadWidth: "22m",
          legalStatus: "Sổ hồng bao sang tên",
          floors: 4,
          category: "Nhà phố thương mại",
          viewsCount: 1680,
          createdAt: new Date().toISOString(),
          createdBy: "admin",
          createdByRole: 'admin',
          approvalStatus: 'approved'
        },
        {
          title: "Cho Thuê Penthouse Đỉnh Cao Tháp Landmark 81 Full Nội Thất",
          priceText: "120 Triệu/tháng",
          priceVal: 120000000,
          type: "rent",
          district: "Quận Bình Thạnh",
          phone: "0932 966 700",
          imageUrl: "https://images.unsplash.com/photo-1502672016913-74e4045f474c?auto=format&fit=crop&q=80&w=800",
          area: 280,
          bedrooms: 4,
          toilets: 4,
          direction: "Đông",
          roadWidth: "40m",
          legalStatus: "Hợp đồng dài hạn bảo đảm",
          floors: 1,
          category: "Penthouse & Duplex",
          viewsCount: 1390,
          createdAt: new Date().toISOString(),
          createdBy: "admin",
          createdByRole: 'admin',
          approvalStatus: 'approved'
        },
        // Additional products to test AJAX Load More (Needs 5 + 5 + etc.)
        {
          title: "Vinhomes Grand Park Căn Hộ 2PN Tiện Ích Đầy Đủ",
          priceText: "8.5 Triệu/tháng",
          priceVal: 8500000,
          type: "rent",
          district: "TP. Thủ Đức",
          phone: "0932 966 700",
          imageUrl: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=800",
          area: 69,
          bedrooms: 2,
          toilets: 2,
          direction: "Đông Bắc",
          roadWidth: "25m",
          legalStatus: "Sổ hồng riêng lẻ",
          floors: 1,
          category: "Căn hộ cao cấp",
          viewsCount: 880,
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          createdBy: "editor",
          createdByRole: 'editor',
          approvalStatus: 'approved'
        },
        {
          title: "Biệt Thự Đơn Lập Compound Riviera Cove Quận 9",
          priceText: "65 Tỷ VND",
          priceVal: 65000000000,
          type: "sale",
          district: "TP. Thủ Đức",
          phone: "0932 966 700",
          imageUrl: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=800",
          area: 420,
          bedrooms: 5,
          toilets: 5,
          direction: "Nam",
          roadWidth: "15m",
          legalStatus: "Sổ hồng chính phủ",
          floors: 3,
          category: "Biệt thự & Villa",
          viewsCount: 1800,
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          createdBy: "editor",
          createdByRole: 'editor',
          approvalStatus: 'approved'
        },
        {
          title: "Cho Thuê Villa Mini Thảo Điền Có Hồ Bơi Riêng Cao Cấp",
          priceText: "65 Triệu/tháng",
          priceVal: 65000000,
          type: "rent",
          district: "TP. Thủ Đức",
          phone: "0932 966 700",
          imageUrl: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&q=80&w=800",
          area: 250,
          bedrooms: 3,
          toilets: 4,
          direction: "Tây",
          roadWidth: "10m",
          legalStatus: "Lâu dài an tâm",
          floors: 2,
          category: "Biệt thự & Villa",
          viewsCount: 1110,
          createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
          createdBy: "editor",
          createdByRole: 'editor',
          approvalStatus: 'approved'
        },
        {
          title: "Căn Hộ Dual Key Độc Lạ Midtown Phú Mỹ Hưng Tiện Nghi",
          priceText: "35 Triệu/tháng",
          priceVal: 35000000,
          type: "rent",
          district: "Quận 7",
          phone: "0932 966 700",
          imageUrl: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&q=80&w=800",
          area: 125,
          bedrooms: 3,
          toilets: 3,
          direction: "Đông Nam",
          roadWidth: "16m",
          legalStatus: "Hợp đồng chính chủ",
          floors: 1,
          category: "Căn hộ cao cấp",
          viewsCount: 1240,
          createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
          createdBy: "editor",
          createdByRole: 'editor',
          approvalStatus: 'approved'
        },
        {
          title: "Biệt Thự Tân Cổ Điển Lucasta Khang Điền Sang Trọng đẳng cấp",
          priceText: "55 Tỷ VND",
          priceVal: 55000000000,
          type: "sale",
          district: "TP. Thủ Đức",
          phone: "0932 966 700",
          imageUrl: "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&q=80&w=800",
          area: 310,
          bedrooms: 4,
          toilets: 4,
          direction: "Bắc",
          roadWidth: "14m",
          legalStatus: "Sổ hồng hoàn công",
          floors: 3,
          category: "Biệt thự & Villa",
          viewsCount: 1530,
          createdAt: new Date().toISOString(),
          createdBy: "editor",
          createdByRole: 'editor',
          approvalStatus: 'approved'
        },
        {
          title: "Nền đất biệt thự sinh thái mặt tiền sông Huyện Nhà Bè",
          priceText: "19 Tỷ VND",
          priceVal: 19000000000,
          type: "sale",
          district: "Huyện Nhà Bè",
          phone: "0932 966 700",
          imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800",
          area: 300,
          bedrooms: 0,
          toilets: 0,
          direction: "Đông Nam",
          roadWidth: "12m",
          legalStatus: "Sổ đỏ riêng thổ cư 100%",
          floors: 0,
          category: "Đất nền dự án",
          viewsCount: 970,
          createdAt: new Date().toISOString(),
          createdBy: "editor",
          createdByRole: 'editor',
          approvalStatus: 'approved'
        }
      ];

      for (const item of mockProducts) {
        await addDoc(prodCol, item);
      }
    }

    // 3. Seed Projects if empty (Need at least 5 for 5-column slider)
    const projCol = collection(db, 'projects');
    const projSnap = await getDocs(projCol);
    if (projSnap.empty) {
      const mockProjects: Omit<Project, 'id'>[] = [
        {
          title: "Vinhomes Grand Park Quận 9",
          priceText: "Từ 2.8 tỷ/căn",
          priceVal: 2800000000,
          location: "Khu dân cư Long Bình & Long Thạnh Mỹ, TP. Thủ Đức",
          imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800",
          imageUrls: [
            "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800"
          ],
          status: "opening",
          description: "<h1>ĐẠI ĐÔ THỊ ĐẲNG CẤP XANH GIỮA LÒNG THỦ ĐỨC</h1><p>Vinhomes Grand Park mang mô hình phát triển sinh thái tích hợp chuẩn quốc tế với công viên 36ha quy mô hàng đầu Đông Nam Á, trường Vinschool, bệnh viện Vinmec cao cấp...</p>",
          locationTab: "<p>Nằm trên hai mặt tiền đường Nguyễn Xiển và Phước Thiện, phường Long Thạnh Mỹ, TP. Thủ Đức, TP. Hồ Chí Minh. Tiếp giáp trực tiếp đường Vành Đai 3 chạy qua trung tâm dự án kết nối cực nhanh đi vùng Tây Nam Bộ, Đông Nam Bộ.</p>",
          amenityTab: "<p>Hệ sinh thái tiện ích All-in-one rộng mở: Bến du thuyền cao cấp Manhattan Glory, Đại công viên ánh sáng nghệ thuật biểu diễn nhạc nước, trường học quốc tế liên cấp Vinschool, Bệnh viện đa khoa Vinmec lớn nhất Sài Gòn mang lại chất sống an lạc trọn vẹn.</p>",
          viewsCount: 8400,
          createdAt: new Date().toISOString()
        },
        {
          title: "Vinhomes Hóc Môn",
          priceText: "Chỉ từ 1.8 tỷ/căn",
          priceVal: 1800000000,
          location: "Huyện Hóc Môn, Tây Bắc TP. Hồ Chí Minh",
          imageUrl: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=800",
          imageUrls: [
            "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=800"
          ],
          status: "opening",
          description: "<h1>KỲ VỌNG KHU SINH THÁI MỚI TÂY BẮC SÀI GÒN</h1><p>Tổ hợp dự án được quy hoạch bài bản với định hướng bền vững xanh mát đón gió lành sông Sài Gòn, quy tụ nhiều phân khu thấp tầng đỉnh cao cùng hạ tầng liên kết vùng hiện đại.</p>",
          locationTab: "<p>Mặt tiền Quốc lộ 22 kết nối trung tâm Hóc Môn cực mượt, kết nối nhanh sang Củ Chi, Long An và Tây Ninh.</p>",
          amenityTab: "<p>Khu vui chơi cắm trại hồ cảnh quan nội khu rộng 5ha, hồ bơi sinh thái chuẩn Olympic, dãy Shophouse đa dạng đáp ứng toàn bộ văn hóa ẩm thực và thời trang.</p>",
          viewsCount: 5200,
          createdAt: new Date().toISOString()
        },
        {
          title: "An Phú New City Quận 2",
          priceText: "Từ 15 tỷ/căn biệt thự",
          priceVal: 15000000000,
          location: "Phường An Phú, Quận 2, TP. Thủ Đức",
          imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
          imageUrls: [
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800"
          ],
          status: "handed-over",
          description: "<h1>KHU BIỆT THỰ COMPUOND SANG TRỌNG BẬC NHẤT AN PHÚ</h1><p>An Phú New City mang phong cách Tây Âu bán cổ điển tao nhã uy nghiêm phù hợp cho những chủ nhân trân trọng sự bình yên rợp bóng cây cổ thụ giữa lòng thành phố náo nhiệt.</p>",
          locationTab: "<p>Nằm ngay góc ngã tư đại lộ Mai Chí Thọ và Nguyễn Hoàng, phường An Phú, Quận 2.</p>",
          amenityTab: "<p>Không gian compound tuyệt mật bảo vệ 24/7 chuyên nghiệp, công viên bách thảo, khu thể thao tích hợp máy tập cao cấp ngoài trời.</p>",
          viewsCount: 3900,
          createdAt: new Date().toISOString()
        },
        {
          title: "Vinhomes Long Beach Cần Giờ",
          priceText: "Liên hệ Hotline",
          priceVal: 0,
          location: "Xã Long Hòa, Huyện Cần Giờ, TP. Hồ Chí Minh",
          imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800",
          imageUrls: [
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800"
          ],
          status: "opening",
          description: "<h1>ĐẠI LỘ BIỂN KHÁT VỌNG DU LỊCH CAO CẤP TOÀN CẦU</h1><p>Được kiến tạo là khu đô thị lấn biển lừng lẫy châu Á, kết hợp mảng rừng sinh thái ngập mặn Cần Giờ mang bầu khí hậu sinh thái mát rượi trong lành hiếm nơi nào sánh kịp.</p>",
          locationTab: "<p>Tọa lạc tại vùng bờ biển lấn biển thuộc Xã Long Hòa, Huyện Cần Giờ, cửa ngõ giao thương duy nhất có bãi biển sinh thái tự nhiên của Sài Gòn.</p>",
          amenityTab: "<p>Hệ thống công viên nghỉ dưỡng sinh thái, khu trung tâm hội nghị thượng đỉnh đa năng quốc tế, sân golf 36 lỗ tiêu chuẩn PGA đẳng cấp vượt trội.</p>",
          viewsCount: 9100,
          createdAt: new Date().toISOString()
        },
        {
          title: "The Rivus Thảo Điền Elie Saab",
          priceText: "Từ 110 tỷ/Dinh Thự",
          priceVal: 110000000000,
          location: "Khu Thảo Điền Quận 2 cao cấp ven sông",
          imageUrl: "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&q=80&w=800",
          imageUrls: [
            "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&q=80&w=800"
          ],
          status: "opening",
          description: "<h1>DINH THỰ THỜI TRANG ĐẦU TIÊN TẠI ĐÔNG NAM Á CO-BRANDED ELIE SAAB</h1><p>Bản giao hưởng độc tôn của giới thượng lưu quý tộc. Mỗi dinh thự được phủ tay nghệ thuật từ đỉnh cao Haute Couture thương hiệu Elie Saab lừng danh thế giới.</p>",
          locationTab: "<p>Mảnh đất vàng dọc ven bờ sông Đồng Nai - Sài Gòn, sở hữu bến cảng neo đậu du thuyền đẳng cấp triệu đô trực tiếp trước thềm biệt thự.</p>",
          amenityTab: "<p>Clubhouse thời thượng do Elie Saab độc quyền thiết kế phòng tiệc rượu vang cổ điển, hồ bơi chân mây bốn mùa tràn viền, vệ sĩ túc trực gác cổng 24/7 nghiêm ngặt.</p>",
          viewsCount: 4120,
          createdAt: new Date().toISOString()
        }
      ];

      for (const item of mockProjects) {
        await addDoc(projCol, item);
      }
    }

    // 4. Seed News/Blogs if empty (Need at least 15 to perform AJAX loading and multiple columns properly)
    const newsCol = collection(db, 'news');
    const newsSnap = await getDocs(newsCol);
    if (newsSnap.empty) {
      const mockNews: Omit<News, 'id'>[] = [
        {
          title: "Xu hướng giá bất động sản cao cấp Đông Sài Gòn năm 2026",
          description: "Phân tích biến động giá bán biệt thự, căn hộ tại TP Thủ Đức và khu vực Nam Rạch Chiếc dưới tác động của đường Vành đai 3.",
          content: "<h1>TÌNH HÌNH THỜI CUỘC KINH TẾ BẤT ĐỘNG SẢN</h1><p>Ngành địa ốc Đông Sài Gòn tiếp tục ghi nhận sự chuyển mình bất phá vượt trội nhờ lực đẩy hạ tầng từ sân bay Long Thành chuẩn bị vận hành thử nghiệm và tuyến metro số 1 thông suốt. Các phân khúc biệt thự có vị trí hoàn chỉnh, pháp lý sẳn sổ đỏ vẫn giữ được dòng tiền neo cao.</p><h2>SỨC HÚT TỪ COMPOUND THƯỢNG LƯU</h2><p>Giới siêu giàu chú trọng an sinh lành mạnh và sự riêng tư sau những trải nghiệm dịch tễ quốc tế. Các tiện ích xanh cùng không gian bến du thuyền độc quyền tiếp tục duy trì mức tăng trưởng 12-15% hằng năm.</p>",
          category: "Tin thị trường",
          imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800",
          viewsCount: 1600,
          author: "Admin",
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
        },
        {
          title: "Các điều khoản pháp lý sổ hồng cần biết khi mua bán biệt thự song lập",
          description: "Cẩm nang hướng dẫn kiểm tra sổ hồng, chi phí thế chấp, thế chấp ngân hàng và quy trình sang tên tránh rủi ro pháp lý.",
          content: "<h1>QUY TRÌNH KIỂM TRA PHÁP LÝ SỔ HỒNG BẤT ĐỘNG SẢN</h1><p>Nhằm đảm bảo an toàn tuyệt đối khi xuống tiền cho tài sản giá trị lớn từ vài chục đến hàng trăm tỷ đồng, quý khách hàng cần tuân thủ cấu trúc thủ tục kiểm tra ba bước: Độc quyền tính pháp lý, Bản đồ trích lục địa chính và Lịch sử hạn chế thế chấp.</p><h2>KINH NGHIỆM THỰC CHIẾN CHUYÊN QUA</h2><p>Đặc biệt lưu tâm đến việc hoàn công xây dựng đầy đủ diện tích thực tế. Khá nhiều biệt thự xây sai phong cách hoặc vượt mật độ xây dựng quy định không thể ra sổ, gây gián đoạn quyền lợi lâu dài.</p>",
          category: "Kinh nghiệm sở hữu",
          imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800",
          viewsCount: 2950,
          author: "Trần Anh Quân",
          createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
        },
        {
          title: "Phong thủy phòng khách cho gia chủ mệnh Kim chiêu tài rước lộc",
          description: "Cách chọn hướng nhà, tông màu sơn tường và bố trí gương đá thạch anh nhằm gia tăng sinh khí dồi dào tài nguyên.",
          content: "<h1>BÍ QUYẾT PHONG THỦY CHO NGÔI NHÀ THỊNH VƯỢNG</h1><p>Gia chủ mệnh Kim thuộc Tây Tứ Mệnh, do đó các hướng lành chiêu tài tốt gồm Tây, Tây Bắc, Tây Nam và Đông Bắc. Bố trí phòng khách nên đặt ở cung tốt nhất của căn hộ.</p><h2>MÀU SẮC ĐỒNG ĐIỆU CỦA KIM</h2><p>Ưu tiên sử dụng gam màu chủ đạo như vàng nâu đất cát (Thổ sinh Kim) hoặc xám ghi đá cẩm thạch cực kỳ hiện đại thanh lịch kết hợp cùng mảng xanh dịu nhẹ của bonsai giúp cân hòa linh khí.</p>",
          category: "Phong thủy nhà ở",
          imageUrl: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800",
          viewsCount: 3400,
          author: "Thầy Phong Thủy Minh Nhật",
          createdAt: new Date(Date.now() - 3600000 * 72).toISOString()
        },
        // More articles to test columns and columns AJAX load (require at least 15)
        {
          title: "Lãi suất vay mua nhà các ngân hàng thương mại cập nhật mới nhất",
          description: "Bảng tổng hợp gói ưu đãi cố định 2-5 năm từ Vietcombank, Techcombank, BIDV hỗ trợ gói tài chính sở hữu nhà.",
          content: "<p>Trong giai đoạn hiện tại, lãi suất thả nổi dao động từ 8-9.5%, trong khi các hình thức cố định hỗ trợ mua nhà từ 5.5-6.5% đang kích thích người mua nhà trả góp cực kỳ mạnh mẽ...</p>",
          category: "Tin thị trường",
          imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800",
          viewsCount: 1450,
          author: "Phùng Mỹ Linh",
          createdAt: new Date(Date.now() - 3600000 * 96).toISOString()
        },
        {
          title: "Kinh nghiệm thương lượng giá trực tiếp hiệu quả với chủ nhà",
          description: "Các đòn tâm lý đàm phán hợp đồng chuyển nhượng nhà đất giúp tiết kiệm đến hàng trăm triệu đồng đáng kể nhất.",
          content: "<p>Tập trung lắng nghe động cơ bán nhà, thăm dò các lỗi xây dựng nhỏ, chuẩn bị sẵn sàng khoản tiền cọc nóng để nhận được giá chiết khấu mạnh tuyệt vời nhất từ người bán gấp...</p>",
          category: "Kinh nghiệm sở hữu",
          imageUrl: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80&w=800",
          viewsCount: 880,
          author: "Đặng Thị Hoa",
          createdAt: new Date(Date.now() - 3600000 * 120).toISOString()
        },
        {
          title: "Phân tích chuyên sâu quy hoạch đô thị vệ tinh Tây Nam Sài Gòn",
          description: "Dự báo tăng trưởng phân khu Nhà Bè, Cần Giờ đón quy hoạch đặc khu kinh tế biển tương lai gần.",
          content: "<p>Tiềm năng vượt trội nâng cấp huyện lên quận của Nhà Bè đã định giá khu Nam tăng giá đều đặn. Sự gia công bến cảng biển Cần Giờ chính thức thu hút các quỹ FDI ngoại lớn...</p>",
          category: "Phân tích đầu tư",
          imageUrl: "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&q=80&w=800",
          viewsCount: 2200,
          author: "Tiến Sĩ Bất Động Sản Lê Huy",
          createdAt: new Date(Date.now() - 3600000 * 150).toISOString()
        },
        {
          title: "Mẹo trang trí sân vườn cây cảnh tối ưu cho nhà phố diện tích hẹp",
          description: "Kiến trúc xanh xu hướng nhà ống 4-5m chiều rộng đón gió bơi sáng thiên nhiên hoàn hảo.",
          content: "<p>Bố trí mảng xanh dạng đứng (Vertical Garden) kết hợp hồ bán cạn rêu mini giúp mang lại sức sống bền bỉ thanh mát cho không gian không cần diện tích sàn quá lớn...</p>",
          category: "Phong thủy nhà ở",
          imageUrl: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=800",
          viewsCount: 1150,
          author: "KTS Nguyễn Văn Long",
          createdAt: new Date(Date.now() - 3600000 * 180).toISOString()
        },
        {
          title: "Chỉ số hấp thụ căn hộ Officetel và dòng tiền cho thuê năm nay",
          description: "Lợi suất cho thuê từ 6-7% tại các quận lõi trung tâm mang dòng lời bền vững hàng tháng cho nhà đầu tư.",
          content: "<p>Sự thành lập nhanh chóng của các doanh nghiệp StarUp công nghệ số tiếp tục đẩy mạnh nhu cầu thuê phòng đa chức năng Officetel có dồi dào tiện ích sảnh và gym chung...</p>",
          category: "Phân tích đầu tư",
          imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800",
          viewsCount: 1320,
          author: "Nguyễn Hải Đăng",
          createdAt: new Date(Date.now() - 3600000 * 210).toISOString()
        },
        {
          title: "Giải mã cơn sốt đất nền vùng ven Đồng Nai Bình Dương có đáng tiền?",
          description: "Những lưu ý cốt lõi tránh đất dự án ma chưa quy hoạch 1/500 đảm bảo sẳn sàng ngân hàng hỗ trợ.",
          content: "<p>Trước khi quyết định mua đất vùng ven, hãy mang bản sao trích lục lên văn phòng đăng ký đất đai kiểm tra ranh quy hoạch giao thông của địa phương tránh mua trúng đất giải tỏa giá rẻ...</p>",
          category: "Kinh nghiệm sở hữu",
          imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800",
          viewsCount: 1750,
          author: "Trần Thế Hoàng",
          createdAt: new Date(Date.now() - 3600000 * 240).toISOString()
        },
        {
          title: "Thiết kế căn hộ phong cách Japandi kết hợp tối giản Nhật & Bắc Âu",
          description: "Ứu tiên màu gỗ nhạt sáng sủa kết hợp nội thất tinh tế trang nhã tiết chế hoàn mỹ.",
          content: "<p>Sự giao thoa tuyệt vời giữa triết lý Wabi-sabi Nhật Bản tôn vinh cái mộc mạc và Hygge Thụy Điển đề cao cái ấm áp tự nhiên làm nên một không gian sống thăng hoa cảm xúc sâu sắc...</p>",
          category: "Phong thủy nhà ở",
          imageUrl: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=800",
          viewsCount: 1510,
          author: "Nhà thiết kế Minh Thy",
          createdAt: new Date(Date.now() - 3600000 * 270).toISOString()
        },
        {
          title: "Thị trường nghỉ dưỡng biệt thự biển Phú Quốc Phan Thiết ấm lại",
          description: "Kỳ vọng dòng tiền nhàn rỗi quay lại phân khúc nghỉ dưỡng biển đón đầu lượng du khách du ngoạn quốc tế khổng lồ.",
          content: "<p>Lợi thế từ thiên nhiên biển xanh ngắt kéo dài, hạ tầng giao thông cao tốc Dầu Giây Phan Thiết vận hành thông thoáng đã đem lượng khách du lịch nội địa cao vút dịp lễ tết...</p>",
          category: "Tin thị trường",
          imageUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800",
          viewsCount: 650,
          author: "Mai Phương Thảo",
          createdAt: new Date(Date.now() - 3600000 * 300).toISOString()
        },
        {
          title: "Có nên xuống tiền cọc mua căn hộ hình thành trong tương lai?",
          description: "Bí quyết thẩm định năng lực bảo lãnh tài chính của chủ đầu tư xây dựng dự án tránh trễ hẹn đóng trạm.",
          content: "<p>Dưới góc độ luật kinh doanh bất động sản mới, việc chủ đầu tư phải ký cam kết bảo lãnh tiến độ với các ngân hàng lớn là sự che chở tuyệt đối an tâm quý giá cho khách hàng trước rủi ro dừng công sự...</p>",
          category: "Kinh nghiệm sở hữu",
          imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800",
          viewsCount: 1420,
          author: "LS Nguyễn Văn Minh",
          createdAt: new Date().toISOString()
        }
      ];

      for (const item of mockNews) {
        await addDoc(newsCol, item);
      }
    }

    if (onShowNotification) {
      onShowNotification("Đã khởi tạo đồng bộ kho dữ liệu cơ sở: 16 Bất động sản cao cấp, 5 Dự án siêu Sang, và 12 Bài phân tích thị trường!", "success");
    }
  } catch (err) {
    console.error("Lỗi khi đồng bộ dữ liệu mẫu:", err);
  }
}
