# Tiến độ 30/09/2026

- Google Consent Mode cơ bản: GTM chỉ nạp sau khi đồng ý cookie và IP được phép. Trước đồng ý không gọi API kiểm tra IP; từ chối xóa sự kiện chờ; thu hồi đồng ý hoặc chặn IP sẽ tải lại trang để dừng GTM.
- Đổi lại, Google không nhận tín hiệu ẩn danh trước đồng ý nên khả năng mô hình hóa chuyển đổi thấp hơn chế độ nâng cao.
- Build production đạt biên dịch, lint, TypeScript và 35/35 trang. Trang chủ 12,8 KB mã riêng, First Load JS 164 KB theo báo cáo dựng; chưa phải điểm Lighthouse.
- Kiểm thử logic tracking 11/11 đạt. Kiểm thử Edge nền trên bản dựng thật đạt 5 tình huống đồng ý và 5 tình huống chính sách IP/chuyển trang; nhà cung cấp bên ngoài được giả lập.
- Lượt thử bổ sung với container Google thật không khởi động Edge trong 60 giây do tài nguyên máy hạn chế. Kết quả đạt của lượt trước lưu tại google-consent-runtime.json, chưa chứng minh thay đổi mới bằng container thật.
- Supabase production vẫn trả 404/PGRST205 cho consultation_activity và 404/PGRST202 cho query_consultations. Cần áp dụng AP-DUNG-CRM.sql và xác minh RPC trước khi đẩy main.
- Chưa phát hành mã mới hoặc đo được Performance mobile/desktop 100 trên tên miền chính greeniahomes.vn.

## Kiểm tra sau khi khởi động lại Codex

- Supabase CLI vẫn trả Unauthorized. Chưa chạy AP-DUNG-CRM.sql và chưa phát hành main. Kết nối Supabase hỗ trợ SQL trực tiếp đã được tìm thấy nhưng chưa được cài hoặc xác thực.
- Công cụ đo đã được sửa để lỗi đóng trình duyệt không che lỗi Lighthouse ban đầu. Ba tình huống kiểm thử xử lý lỗi đạt; kiểm tra cú pháp và git diff --check đạt.
- Một lượt Lighthouse 13.5.0 desktop trên https://greeniahomes.vn/ lúc 23:24 ngày 30/09/2026: Performance 11, Accessibility 97, Best Practices 77, SEO 100, Agentic Browsing 79. LCP 5,8 giây, TBT 4570 ms, CLS 0,307. Máy còn 853 MB RAM trống trước lượt đo; cần đo lặp khi tài nguyên ổn định để đánh giá hiệu suất.
- Báo cáo JSON và HTML đã lưu trong .local-backups/lighthouse-official-recovery-20260930. Lỗi quá hạn đóng trình duyệt xảy ra sau khi báo cáo đã được ghi; tiến trình đo kết thúc với mã lỗi 1, trình duyệt nền đã dừng.
- Lỗi xác nhận trên bản chính thức: ô đồng ý 14 px, dịch chuyển footer, cookie test_cookie và IDE từ Google Ads. Mã mới đã dùng ô đồng ý 24 px và GTM chỉ tải sau đồng ý; các thay đổi đó chưa được xác minh trên bản chính thức vì main chưa phát hành.
## Áp dụng CRM production qua kết nối Supabase

- Kết nối Supabase đã được xác thực với dự án rorvzyxjoenlrpxoptnu. Migration atomic_crm_updates đã áp dụng thành công, phiên bản remote 20260930164042; tên tệp local được đồng bộ theo phiên bản thực tế.
- Sao lưu trước nâng cấp: 10 hồ sơ, checksum kiểm chứng đạt. Sau migration: đủ ba RPC query_consultations, patch_consultation, append_consultation_care_history; consultation_activity bật RLS; checksum toàn bộ 10 hồ sơ giữ nguyên.
- Kiểm chứng trên PostgreSQL production bằng hai hồ sơ thử trong giao dịch hoàn tác: quản trị truy vấn/cập nhật/ghi chú/nhật ký đạt; nhân viên chỉ xem và cập nhật hồ sơ được phân công, không tự đổi phân công, không xóa lịch sử và không đọc nhật ký ngoài quyền; anon và người ngoài nhóm CRM bị chặn. Sau kiểm thử: 0 hồ sơ thử còn lại, 10 hồ sơ thật giữ nguyên checksum.
- Security Advisor không báo lỗi schema CRM mới. Hai bảng push có RLS không có policy theo thiết kế chỉ máy chủ truy cập; các chỉ mục mới chưa được sử dụng là thông tin thống kê sau tạo.
- Cảnh báo Leaked Password Protection cần gói Pro trở lên, trong khi dự án đang dùng Free. Giới hạn được đối chiếu tài liệu chính thức: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection. Chưa thay đổi gói dịch vụ.
