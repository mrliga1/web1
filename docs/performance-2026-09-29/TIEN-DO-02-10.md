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


## Kết quả 9dc4f2c và dựng khối thông tin tại máy chủ

Commit 9dc4f2cb93a987d2edf70a706719f72f2d233d1d đã được Vercel phát hành. [Lượt 36909267938](https://github.com/mrliga1/web1/actions/runs/36909267938) đo tên miền chính thức:

| Thiết bị | Lượt 1 | Lượt 2 | Lượt 3 |
|---|---:|---:|---:|
| Performance mobile | 79 | 100 | 100 |
| Performance desktop | 100 | 100 | 100 |

Accessibility, Best Practices, SEO và Agentic đều 100 trong cả sáu lượt, Agentic 3/3 và không có cảnh báo. Kiểm tra UI desktop/mobile đạt mười mục mỗi thiết bị, có kiểm tra menu mobile; không gửi biểu mẫu CRM. CLS mobile 0; desktop lượt 3 là 0,0004117, không coi là chính xác 0. Bằng chứng: official-independent-9dc4f2c-summary.json, official-ui-9dc4f2c-results.json. **Chưa đủ điều kiện bàn giao.**

Mobile lượt đầu có TBT mô phỏng 892 ms, hai lượt sau 45 / 37 ms. FCP thực được quan sát của lượt đầu 793 ms, thay vì thời gian mô phỏng 1.445 ms. Dấu vết có Layout 74,503 ms nhưng CPU 4,383 ms; tác vụ GC 56,360 ms nhưng CPU 0,680 ms. Sự khác biệt thời gian thực/CPU cho thấy phép đo có nhiễu; không khẳng định toàn bộ nghẽn này do mã website hoặc loại lượt đầu khỏi điều kiện đạt. Phân tích có kiểm tra cả sự kiện X và cặp B/E; không tìm được ProfileChunk để gán CPU tự dùng cho từng hàm.

Đã tách CorporateIntroBody, ReasonsBody, ProjectsBody, NewsBody sang HomeStaticSectionBodies.tsx. Trang máy chủ dựng các khối này và truyền nội dung cho HomePageClient. Home dùng bản chụp khi dữ liệu máy chủ còn khớp; chỉnh sửa hoặc dữ liệu thay đổi sẽ dùng module tải theo nhu cầu. Nếu máy chủ yêu cầu làm mới API, Home tiếp tục dùng dữ liệu tải lại để không giữ bản chụp cũ. Bản chụp mới sau router.refresh chứa dữ liệu dự án/tin mới.

Hai nút xem thêm dự án/tin tức chuyển sang Link có href /du-an và /tin-tuc, prefetch=false, giữ lớp trình bày. Trình sửa chữ/ảnh khai báo use client để tách đúng ranh giới khi được tham chiếu từ khối dựng máy chủ. Biểu mẫu, sản phẩm, yêu thích, quảng cáo và khối tùy chỉnh tiếp tục dùng các component hiện tại.

Cách truyền nội dung máy chủ vào component có tương tác dựa trên [tài liệu Next.js 15](https://nextjs.org/docs/15/app/getting-started/server-and-client-components#interleaving-server-and-client-components). Không bật Suspense cho từng section hoặc đổi tham số Lighthouse.

Kiểm thử khối trang chủ dựng máy chủ **8/8 đạt**: so sánh HTML với bản 9dc4f2c, nội dung đã sửa, danh sách 0/1/4/7 mục, thứ tự, khối ẩn/tùy chỉnh, bật/tắt chỉnh sửa, bản chụp mới và API làm mới thành công/lỗi. Chỉ chấp nhận hai thay đổi nút sang liên kết có chủ đích. Kiểm thử tách biên tập **7/7 đạt**. Typecheck toàn dự án đạt; lint bảy tệp đạt, không cảnh báo. Xác nhận mã: official-home-server-sections-verification.json.

Cần xác nhận bản dựng Vercel, dung lượng script thực, UI và cả sáu lượt Lighthouse của bản tiếp theo. Không dùng hai lượt mobile 100 để thay cho đủ điều kiện nghiệm thu.


## Kết quả 43b5300 và vấn đề còn cần xử lý

Commit 43b5300854de209ce4f6c7ca6403a30a287ee096 đã được GitHub main tiếp nhận và Vercel phát hành thành công. [Lượt 36926449109](https://github.com/mrliga1/web1/actions/runs/36926449109) đo trực tiếp tên miền chính thức:

| Thiết bị | Performance lượt 1 | Lượt 2 | Lượt 3 | Best Practices |
|---|---:|---:|---:|---|
| Mobile | 88 | 100 | 100 | 100 cả ba lượt |
| Desktop | 100 | 100 | 100 | 100 / 96 / 100 |

Accessibility và SEO đều 100, Agentic 100 và 3/3 trong sáu lượt; không có cảnh báo thu thập, CLS 0. UI cả hai thiết bị đạt mười mục mỗi thiết bị và menu mobile. Không gửi biểu mẫu CRM. Bằng chứng: official-independent-43b5300-summary.json và official-ui-43b5300-results.json.

JavaScript mobile thực tải 502.208 byte giải nén, so với 517.433 byte ở e5d090d. Desktop tải 594.682 byte; phần thêm 92.474 byte thuộc chunk và trang tin tức/dự án/liên hệ được tải trước. Cần điều chỉnh việc tải trước ở Navbar; ClientLayout đã có cơ chế tải khi người dùng trỏ, tập trung hoặc chạm liên kết.

Mobile lượt đầu: FCP mô phỏng 1.370 ms, LCP 2.190 ms, TBT 354 ms, Speed Index 4.130 ms. FCP thực quan sát 2.400 ms dù DOMContentLoaded 446 ms và load 628 ms. Hai lượt sau TBT 13,5 / 14,5 ms, LCP khoảng 1.526–1.529 ms. BenchmarkIndex lần lượt 3.234 / 4.094,5 / 4.091, khác máy đo trước; không suy diễn toàn bộ cải thiện là do refactor.

Desktop lượt 2 có lỗi errors-in-console: Minified React error #418, HTML không khớp khi gắn tương tác. Đây là lỗi thật cần chẩn đoán; không bỏ audit hoặc che cảnh báo. [Tài liệu React](https://react.dev/errors/418) giải thích loại lỗi này. Không có HTTP >=400 trong báo cáo. Hai lượt desktop còn lại và phiên UI không ghi lỗi này; chưa đủ để kết luận đã sửa.

Đã phân tích giao thức Flight từ HTML công khai thực tế, gồm bản ghi chữ dài theo độ dài byte: needsClientRefresh=false, cả bốn dấu nội dung máy chủ khớp với dữ liệu được gửi tới trình duyệt. Xác nhận tại official-home-flight-43b5300-verification.json. Kiểm tra này chỉ loại bớt giả thuyết chọn sai bản chụp; không chứng minh toàn bộ hydration đúng.

**Chưa đạt điều kiện bàn giao.** Công việc tiếp theo: xử lý tải trước không cần thiết ở Navbar, thu bằng chứng cụ thể cho lỗi HTML/React và tiếp tục tối ưu lượt mobile đầu. Giữ đủ sáu lượt và mọi nhóm điểm 100 trong điều kiện nghiệm thu.


## Điều chỉnh tải trước menu và ghi nhận vị trí lỗi HTML

Đã đặt prefetch=false cho ba vị trí Link trong Navbar: logo, menu desktop và menu mobile. Giữ href, nhãn, trạng thái mục đang xem, đóng menu và class; ClientLayout tiếp tục tải trước khi có tín hiệu trỏ/chạm/tập trung. Cần báo cáo mạng bản mới để xác nhận giảm 92.474 byte mã trang khác đã quan sát ở desktop.

Đã thêm bước chẩn đoán sau Lighthouse và kiểm tra UI trong workflow hiện tại. Sáu phiên nguyên gốc (ba desktop 1350×940, ba mobile 412×823) kiểm tra lỗi ban đầu và việc tải trước các trang khác. Mười hai phiên desktop riêng dùng phần quan sát đặt ngay trước chỗ React tạo lỗi 418 để ghi fiber, props và DOM của các phần tử liên quan. Không gửi form, đăng nhập hoặc thao tác CRM.

Runtime dùng trong phiên quan sát chỉ được thay tại phản hồi của trình duyệt riêng; không sửa file đang phục vụ website. Lượt quan sát có nhãn instrumented và chỉ dùng chẩn đoán; sáu báo cáo Lighthouse dùng runtime nguyên gốc và điều kiện đạt giữ nguyên. Không loại lỗi React khỏi báo cáo.

Công cụ quan sát kiểm tra đúng một điểm rD(e) tạo lỗi 418; từ chối runtime không khớp hoặc đã gắn quan sát. Đã kiểm tra với runtime thực tế SHA-256 5421e13a91a9389517b66179f3b4b5eaa0d95245438066d4d7b19ac30aeb809b và xác nhận cú pháp hợp lệ sau chèn. Các phép kiểm thử xác nhận giữ lỗi HTML/chữ, fiber và cách ném lỗi ngay cả khi quan sát tự lỗi hoặc không có window: **4/4 đạt**. Kiểm thử phép đo chính thức **5/5 đạt**. Lint bốn tệp đạt, không lỗi/cảnh báo. Workflow YAML hợp lệ, bước chẩn đoán nằm sau UI và trước upload artifact.

Bằng chứng trước phát hành: official-nav-hydration-diagnostics-verification.json. Cần bản dựng Vercel và báo cáo mới trước khi kết luận đã khắc phục lỗi HTML hoặc đạt điểm.
