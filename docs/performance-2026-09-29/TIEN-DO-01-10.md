# Tiến độ ngày 01/10/2026

## Bản chính thức và CRM

- Đã đẩy commit `1035f0d4c5bbf39fe36b296fc87fd38d8ebbc615` lên `main` của GitHub.
- Vercel xác nhận triển khai thành công đúng commit; tên miền https://greeniahomes.vn trả HTTP 200, có banner mới và một H1.
- Migration CRM `20260930164042_atomic_crm_updates` đã áp dụng thành công. Các kiểm tra thực tế về phân quyền, cập nhật nguyên tử, lịch sử chăm sóc và nhật ký hoạt động đã đạt.
- Sau giao dịch kiểm thử được rollback: vẫn đủ 10 hồ sơ, dữ liệu gốc không đổi, không còn hồ sơ kiểm thử.
- SEO trên tên miền chính thức: 17 URL, 0 lỗi, 0 cảnh báo.

## Lighthouse trên bản chính thức

Phiên bản 13.5.0, một lượt cho mỗi thiết bị, không có cảnh báo thu thập. Thời điểm báo cáo: 00:20 và 00:21 ngày 01/10 theo giờ Việt Nam.

| Mục | Di động | Desktop |
|---|---:|---:|
| Performance | 38 | 72 |
| Accessibility | 100 | 100 |
| Best Practices | 100 | 100 |
| SEO | 100 | 100 |
| Agentic Browsing | 100 | 100 |
| CLS | 0 | 0 |
| LCP | 5,7 giây | 1,0 giây |
| TBT | 4.720 ms | 630 ms |
| Chỉ số benchmark máy đo | 429 | 698 |

**Chưa đạt yêu cầu bàn giao Performance 100 trên cả hai thiết bị.** Kết quả các bài kiểm tra mã nguồn không thay thế điểm Performance.

Ảnh banner đã được ưu tiên tải và có dung lượng truyền khoảng 21 KB. Báo cáo mobile ghi nhận thời gian chờ hiển thị ảnh khoảng 4,1 giây và nhiều tác vụ dài ở luồng chính. Cần đối chiếu phép đo độc lập trước khi kết luận nguyên nhân do ứng dụng hay máy đo.

## Đo độc lập trên GitHub

- Quy trình `.github/workflows/production-lighthouse.yml` dùng runner Ubuntu tiêu chuẩn.
- Chỉ đo https://greeniahomes.vn sau khi Vercel xác nhận đúng commit trên main đã triển khai.
- Lighthouse 13.5.0: giữ cấu hình mobile mặc định và preset desktop; không chỉnh mức giới hạn CPU/mạng, không bỏ bài kiểm tra.
- Ba lượt cho mỗi thiết bị; lưu JSON, HTML và dấu vết hiệu suất trong artifact 7 ngày.
- Điều kiện đạt: đủ sáu lượt, mỗi mục đều hiển thị 100, Agentic 3/3 và không có cảnh báo thu thập.
- Việc bổ sung quy trình này chưa chứng minh website đạt 100; phải đọc kết quả chạy thực tế.

## Công việc tiếp theo

1. Đối chiếu kết quả trên máy GitHub với báo cáo đã lưu.
2. Sửa phần gây chậm được chứng minh bởi báo cáo và dấu vết thực tế.
3. Kiểm tra chức năng liên quan, phát hành và đo lại đúng tên miền chính thức.
4. Chỉ bàn giao khi các điều kiện được đáp ứng bằng bằng chứng kiểm thử.
