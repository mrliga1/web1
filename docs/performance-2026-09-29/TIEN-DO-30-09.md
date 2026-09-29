# Tiến độ 30/09/2026

- Google Consent Mode cơ bản: GTM chỉ nạp sau khi đồng ý cookie và IP được phép. Trước đồng ý không gọi API kiểm tra IP; từ chối xóa sự kiện chờ; thu hồi đồng ý hoặc chặn IP sẽ tải lại trang để dừng GTM.
- Đổi lại, Google không nhận tín hiệu ẩn danh trước đồng ý nên khả năng mô hình hóa chuyển đổi thấp hơn chế độ nâng cao.
- Build production đạt biên dịch, lint, TypeScript và 35/35 trang. Trang chủ 12,8 KB mã riêng, First Load JS 164 KB theo báo cáo dựng; chưa phải điểm Lighthouse.
- Kiểm thử logic tracking 11/11 đạt. Kiểm thử Edge nền trên bản dựng thật đạt 5 tình huống đồng ý và 5 tình huống chính sách IP/chuyển trang; nhà cung cấp bên ngoài được giả lập.
- Lượt thử bổ sung với container Google thật không khởi động Edge trong 60 giây do tài nguyên máy hạn chế. Kết quả đạt của lượt trước lưu tại google-consent-runtime.json, chưa chứng minh thay đổi mới bằng container thật.
- Supabase production vẫn trả 404/PGRST205 cho consultation_activity và 404/PGRST202 cho query_consultations. Cần áp dụng AP-DUNG-CRM.sql và xác minh RPC trước khi đẩy main.
- Chưa phát hành mã mới hoặc đo được Performance mobile/desktop 100 trên tên miền chính greeniahomes.vn.
