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

## Kết quả độc lập đầu tiên

Lượt GitHub: https://github.com/mrliga1/web1/actions/runs/36755439667, commit `fa4cfd5`. Số liệu được trích nguyên từ nhật ký của lượt chạy vào `official-independent-first-summary.json`.

| Thiết bị | Performance lượt 1 | Lượt 2 | Lượt 3 | Các mục còn lại |
|---|---:|---:|---:|---|
| Di động | 74 | 99 | 99 | 100 mỗi lượt, Agentic 3/3 |
| Desktop | 100 | 100 | 100 | 100 mỗi lượt, Agentic 3/3 |

Benchmark 2.226–2.496. Lượt mobile đầu có TBT 1.216 ms; hai lượt sau 42 và 52 ms. LCP mobile còn khoảng 1,97–2,28 giây. **Desktop đã đạt trong ba lượt; mobile chưa đạt yêu cầu.**

Báo cáo đầy đủ ban đầu không được lưu vì action tải artifact mặc định bỏ qua thư mục bắt đầu bằng dấu chấm. Đã bật `include-hidden-files` chỉ cho thư mục báo cáo `.audit-reports/`, đồng thời đổi sang báo lỗi nếu không có tệp. Cần đo lại để thu báo cáo và dấu vết đầy đủ; số liệu lần đầu vẫn được giữ lại.

## Báo cáo đầy đủ của commit 03bbc5c

Lượt https://github.com/mrliga1/web1/actions/runs/36762218529 đã lưu thành công artifact chứa cả JSON, HTML và dấu vết của sáu lượt đo. Bản tổng hợp được lưu tại `official-independent-03bbc5c-summary.json`.

- Performance mobile: 86, 99, 99; desktop: 100, 100, 100.
- Accessibility, Best Practices, SEO và Agentic: 100 ở cả sáu lượt; Agentic 3/3.
- LCP mobile là H1 của banner. Lượt đầu có chờ hiển thị khoảng 1,25 giây; lượt thứ hai khoảng 87 ms.
- Mã Realtime nền xuất hiện trong giai đoạn khởi tạo, có một tác vụ dài khoảng 85 ms ở lượt mobile đầu.

Đã điều chỉnh `ContentRealtimeRefresh`: đợi trang tải xong, ưu tiên kết nối khi người dùng tương tác; khách chỉ đọc tự kết nối sau 5 giây và khi luồng chính có thời gian rảnh. Dọn đầy đủ listener, timer và kết nối khi chuyển trang. Áp dụng cho mọi khách, không dựa vào user-agent hoặc nhận diện công cụ đo.

Kiểm tra trước phát hành: 10/10 tình huống chức năng của component thực tế đã biên dịch; kiểm tra kiểu dữ liệu và lint đạt. **Chưa có điểm Lighthouse mới của thay đổi này; chưa đủ điều kiện bàn giao.**

## Giảm dữ liệu CSS trong HTML

Commit `caef706`: Performance mobile 72, 99, 99; desktop 100, 100, 100. Các mục còn lại đều 100 và Agentic 3/3. Báo cáo đầy đủ vẫn được lưu; bản tổng hợp ở `official-independent-caef706-summary.json`.

Đo trực tiếp HTML trang chủ: 354.716 byte trước nén, CSS inline 114.004 byte, dữ liệu Flight 157.700 byte. Snapshot tin và cấu hình công khai đã được giới hạn trường; không gửi nội dung bài viết dài vào trang chủ.

Đã tắt `experimental.inlineCss` để Next.js xuất stylesheet thành tệp riêng, giảm dữ liệu lặp trong HTML và dữ liệu dựng trang. Không sửa các quy tắc CSS. Kiểm tra cú pháp cấu hình và khoảng trắng đạt; cần xác nhận bản dựng Vercel và phép đo mới trước khi kết luận hiệu quả.

## Kết quả CSS và giảm khởi tạo bộ định dạng ngày

Commit `ec1bdb2` đã được Vercel phát hành thành công. Lượt đo https://github.com/mrliga1/web1/actions/runs/36772431466: mobile 79, 99, 98; desktop 100, 100, 100. Accessibility, Best Practices, SEO và Agentic đều 100 trong sáu lượt; Agentic 3/3. Lưu số liệu tại `official-independent-ec1bdb2-summary.json`.

HTML trang chủ giảm từ 354.716 xuống 124.099 byte; dữ liệu Flight giảm từ 157.700 xuống 41.117 byte. Đây là giảm dung lượng thực tế, nhưng điểm mobile vẫn chưa đạt yêu cầu.

Tệp tiện ích công khai khởi tạo `Intl.DateTimeFormat` ngay khi nạp module. Đã chuyển ngày hiện đại sang phép tính UTC+7 và giữ bộ định dạng Intl dùng chung, khởi tạo khi cần cho ngày lịch sử hoặc năm mở rộng. Quy tắc múi giờ được đối chiếu với [dữ liệu IANA](https://data.iana.org/time-zones/tzdb/asia). Không thay đổi nội dung ngày tháng hiển thị.

Kiểm thử đối chiếu trực tiếp với Intl: 6.075 trường hợp trên ba múi giờ UTC, Los Angeles và Hồ Chí Minh đều đạt, gồm ngày nhuận, ranh giới ngày, đầu vào lỗi, ngày lịch sử và giới hạn Date. Ngày hiện đại không khởi tạo bộ định dạng; ngày lịch sử dùng lại một bộ định dạng. Cần đo bản phát hành mới để xác định tác động hiệu suất; chưa bàn giao.

## Giảm dữ liệu địa giới trong trang chủ

Commit `7bc9105` đã phát hành; mobile 96, 99, 99, desktop 100, 100, 100. Các mục còn lại đạt 100 và Agentic 3/3 trong cả sáu lượt. Báo cáo: `official-independent-7bc9105-summary.json`; [GitHub run 36776766237](https://github.com/mrliga1/web1/actions/runs/36776766237).

`ProductCard` chỉ cần rút gọn tên địa điểm nhưng nhập module chứa toàn bộ danh mục địa giới, khởi tạo JSON và danh sách gợi ý ngay khi mở trang. Tệp JavaScript tương ứng có 69.755 byte trước nén. Đã tách hàm định dạng sang `locationFormat.ts` và giữ nguyên re-export cho các trang tìm kiếm, chi tiết và quản trị. Không đổi dữ liệu hay cách hiển thị địa điểm. Kiểm tra kiểu dữ liệu và lint đạt; cần xác nhận mạng và hiệu suất ở bản phát hành mới. Chưa đủ điều kiện bàn giao.

## Ưu tiên tải ảnh theo bố cục màn hình

Commit `3c19667` đã được Vercel phát hành. Lượt [36778245211](https://github.com/mrliga1/web1/actions/runs/36778245211): mobile 95, 99, 99; desktop 100, 100, 100; các mục còn lại đều 100 và Agentic 3/3. Báo cáo ở `official-independent-3c19667-summary.json`. Cả ba lượt mobile đều không còn tải chunk danh mục địa giới; giảm dữ liệu đã được xác nhận qua nhật ký mạng, nhưng chưa đạt Performance 100.

Ảnh banner đang có preload ưu tiên cao trên mọi kích thước màn hình, trong khi phần tử LCP mobile là H1. Đã dùng `getImageProps` của Next.js để dựng ảnh tối ưu trực tiếp ở máy chủ; preload có media chỉ cho desktop từ 1024px, dùng cùng srcset và sizes với ảnh. Ảnh trên mobile dùng lazy loading của trình duyệt. Giữ kích thước, alt, chất lượng và nội dung banner.

Kiểm thử dựng component thật ở máy chủ xác nhận một H1, đủ liên kết, ảnh có kích thước và alt, preload khớp biến thể ảnh và chỉ áp dụng desktop. Kiểm tra kiểu dữ liệu và lint phiên bản cuối đều đạt, không có lỗi hoặc cảnh báo lint. Kiểm thử Node có thông báo về cấu hình chất lượng ảnh khi nâng cấp lên Next.js 16; hiện dự án dùng Next.js 15 và không thay đổi chất lượng ảnh. Cần kiểm tra bản dựng, nhật ký tải ảnh và điểm hai thiết bị sau phát hành; chưa bàn giao.
