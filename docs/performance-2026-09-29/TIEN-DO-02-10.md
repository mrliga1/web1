# Tiến độ tối ưu bản chính thức — 02/10/2026

## Bản đã phát hành 7515ddc

Vercel đã phát hành commit `7515ddc23200759401201aa228e019a1a9a5420c`. [Lượt GitHub 36900023363](https://github.com/mrliga1/web1/actions/runs/36900023363) đo trực tiếp https://greeniahomes.vn/:

| Thiết bị | Lượt 1 | Lượt 2 | Lượt 3 |
|---|---:|---:|---:|
| Performance mobile | 73 | 99 | 100 |
| Performance desktop | 100 | 100 | 100 |

Accessibility, Best Practices, SEO và Agentic đều 100 trong cả sáu lượt; Agentic 3/3, không cảnh báo thu thập, CLS 0. UI desktop/mobile đạt cả mười kiểm tra; không gửi biểu mẫu CRM. Bằng chứng: `official-independent-7515ddc-summary.json`, `official-ui-7515ddc-results.json`.

JavaScript tải trang trong lượt mobile 2 giảm từ 536.820 xuống 523.213 byte giải nén so với bản 528bd16; dữ liệu truyền giảm từ 169.848 xuống 164.780 byte. Chuyển mẫu bố cục sang chế độ chỉnh sửa đã giảm dung lượng, nhưng chưa đạt đủ sáu lượt 100.

Lượt đầu vẫn có tác vụ Layout 55,23 ms, CPU 4,78 ms; UpdateLayoutTree 48,10 ms, CPU 4,23 ms; ParseHTML 41,52 ms, CPU 1,44 ms. Có tác vụ nội bộ Chrome tại chrome://omnibox-popup.top-chrome dù đã chờ 10 giây ở about:blank. TBT ba lượt mobile: 1.393,5 / 89 / 45,5 ms. Không loại lượt đầu khỏi điều kiện đạt.

## Điều chỉnh tiếp theo

- Tách công cụ sửa chữ/ảnh sang module được tải khi bật chỉnh sửa. Phần công khai dùng trực tiếp dữ liệu props, không khởi tạo state/effect của trình biên tập.
- Giữ các thay thế nội dung cũ, chữ chuyển màu, xuống dòng, thẻ, class, thuộc tính ảnh, cập nhật section và tải ảnh. Hàm chuẩn hóa dùng chung cho phần công khai và chỉnh sửa.
- Khởi tạo Chrome tại một tài liệu HTML trống bằng data URL, chứa title và body rỗng, không script/style/link/ảnh hoặc dữ liệu website. Chờ 10 giây rồi mới bắt đầu đo tên miền chính thức. Thử cách này để Chrome xử lý việc điều hướng và giao diện nội bộ trước phép đo; chưa chứng minh hiệu quả.
- Giữ Lighthouse 13.5.0, ba lượt mỗi thiết bị, cách mô phỏng mặc định, xóa bộ nhớ đệm mỗi lượt và yêu cầu tất cả nhóm điểm 100. Không tải website để làm nóng trước lượt đầu.

## Kiểm thử trước phát hành

`test-editable-split.mjs`: **7/7 đạt**. So sánh HTML với mã bản 7515ddc cho 36 biến thể chữ và ba trường hợp ảnh; kiểm tra làm mới props, chuyển sang chỉnh sửa, sửa chữ/nhiều dòng, lưu URL, tải ảnh và nhánh lỗi mạng.

`test-production-audit.mjs`: **5/5 đạt**, gồm tài liệu chuẩn bị không có tài nguyên bên ngoài, loại quyền GitHub khỏi Chrome, dọn đúng tiến trình khi lỗi, cấu hình/xóa cache và điều kiện đủ sáu lượt.

Kiểm tra kiểu dữ liệu toàn dự án đạt. Lint sáu tệp sửa/thêm đạt, không lỗi hoặc cảnh báo. CSS công khai biên dịch lại giống từng byte với bản trước: 100.967 byte; không thay đổi quy tắc giao diện. Kiểm tra khoảng trắng đạt.

**Chưa đạt điều kiện bàn giao.** Cần xác nhận bản dựng Vercel, mạng thực tế, điểm và UI của bản tiếp theo.

## Kết quả e5d090d và giảm hiệu ứng màn hình đầu

Bản `e5d090d` được Vercel phát hành thành công. Lượt [36903689717](https://github.com/mrliga1/web1/actions/runs/36903689717): mobile **96, 99, 99**, desktop **100, 100, 100**. Các mục còn lại 100, Agentic 3/3, CLS 0, không cảnh báo. UI cả hai thiết bị đạt. Chưa đủ điều kiện bàn giao. Bằng chứng: `official-independent-e5d090d-summary.json`, `official-ui-e5d090d-results.json`.

Kiểm tra các script liên kết từ HTML trang chủ xác nhận không còn ba chuỗi đặc trưng của trình sửa chữ/ảnh. Báo cáo Lighthouse trình duyệt hiện đại ghi 517.433 byte JavaScript giải nén, giảm từ 523.213 byte của 7515ddc. Tệp polyfill nomodule có trong HTML không thuộc tổng tải trình duyệt hiện đại. Lưu xác nhận tại `official-public-editor-assets-e5d090d.json`.

Lượt mobile đầu: TBT 100 ms, LCP mô phỏng 1,98 giây, Speed Index mô phỏng 4,11 giây. Video đo ghi trang trắng tới mẫu 2,25 giây, nội dung xuất hiện ở mẫu 2,625 giây. Lần vẽ thực được quan sát 2,473 giây; HTML tải xong 0,298 giây, CSS 0,520 giây. Hai lượt sau quan sát lần vẽ 0,152 / 0,129 giây. Không nhầm thời gian thực trong dấu vết với các chỉ số mô phỏng dùng chấm điểm.

Trang chủ đã có ISR revalidate=60; manifest bản dựng xác nhận và HTTP chính thức có cache STALE. Chưa có bằng chứng cần đổi cache máy chủ; giữ cơ chế hiện tại. Không quy chậm trễ cho Supabase khi HTML đã tải xong.

Đã chuyển nền thanh điều hướng sang màu đồng nhất, bỏ backdrop-blur ở header ban đầu. Banner mobile không còn chuyển động translate khi mở trang; desktop từ 1024px vẫn dùng hiệu ứng 540 ms. Không đổi nội dung, ảnh, liên kết hoặc logic menu. Đây là thay đổi cần đo thực tế; chưa khẳng định hiệu ứng là nguyên nhân của độ trễ.

Kiểm thử banner dựng máy chủ đạt: đủ nội dung, preload chỉ desktop và đúng ảnh. Biên dịch CSS đạt; phân tích CSS đầu ra xác nhận hiệu ứng banner chỉ ở media min-width 1024px; header không còn backdrop-filter. Bằng chứng cấu hình: `official-first-paint-effects-verification.json`. Thông báo công cụ về images.qualities áp dụng khi lên Next.js 16 và caniuse-lite cũ; dự án hiện dùng Next.js 15, chưa thay đổi chất lượng ảnh. Lint Navbar đạt, không lỗi/cảnh báo. Cần xác nhận phát hành và chạy đủ Lighthouse/UI trên bản mới.
