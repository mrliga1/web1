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

## Chia khởi tạo tương tác theo khối trang chủ

Commit `d5a7dbc` đã phát hành thành công. Lượt [36780124017](https://github.com/mrliga1/web1/actions/runs/36780124017): mobile 96, 99, 99; desktop 100, 100, 100; các mục còn lại 100 và Agentic 3/3. Báo cáo ở `official-independent-d5a7dbc-summary.json`.

Nhật ký mạng xác nhận ảnh banner mobile đã chuyển sang ưu tiên thấp. Hai lượt sau có LCP khoảng 1,82 giây nhưng TBT còn 81–88 ms, với một tác vụ dựng giao diện dài khoảng 131–138 ms. Đã bổ sung Suspense theo từng khối trang chủ để React có thể khởi tạo tương tác theo khối và ưu tiên thao tác người dùng. Chế độ chỉnh sửa giữ cấu trúc hiện tại. Cơ chế dựa trên [Selective Hydration của React](https://react.dev/reference/react/Suspense); cần đo thực tế để xác nhận tác động.

Lint và kiểm tra kiểu dữ liệu đều đạt. Kiểm tra chức năng trực tiếp trên bản `d5a7dbc`, bằng hai phiên trình duyệt chạy nền riêng: H1, tải ảnh, nhập biểu mẫu và chọn hai checkbox, thêm/xóa yêu thích, CTA dẫn tới trang sản phẩm, không tràn ngang, không lỗi JavaScript; menu di động mở/đóng đúng. Không gửi biểu mẫu CRM. Cần chạy lại cùng kiểm tra trên bản mới sau phát hành; chưa đủ điều kiện bàn giao.

### Gỡ thay đổi chưa chứng minh được hiệu quả

Lượt [36781671821](https://github.com/mrliga1/web1/actions/runs/36781671821), commit `3cbb0e3`: mobile 63, 99, 99; desktop 100, 100, 100. Lượt mobile đầu có TBT khoảng 3.193 ms, LCP 3,08 giây và CLS 0,018; hai lượt sau không đạt 100. Benchmark 2.391–2.444, không có cảnh báo thu thập. Giữ nguyên bằng chứng trong `official-independent-3cbb0e3-summary.json`.

Chưa có bằng chứng Suspense theo khối giúp đạt mục tiêu, trong khi lượt đầu ghi nhận thời gian chặn tăng mạnh. Đã khôi phục riêng `Home.tsx` về đúng nội dung của commit `d5a7dbc`, giữ các cải tiến ngày tháng, tách địa giới và ưu tiên ảnh theo màn hình. Không ghi đè lịch sử Git.

Kiểm tra UI sau phát hành `3cbb0e3` chưa thực hiện được: trình duyệt chạy nền bị quá thời gian khởi động, trước khi truy cập trang. Máy lúc kiểm tra còn khoảng 725 MB RAM trống; đây là hạn chế của lượt kiểm thử cục bộ, không phải bằng chứng lỗi chức năng website. Không dùng kết quả UI cũ để công nhận bản mới đạt. Cần xác nhận phát hành bản khôi phục và đo tiếp; chưa bàn giao.

## Bản khôi phục và kiểm tra tương tác trên GitHub

Commit `f47c382` đã được Vercel phát hành thành công. Lượt [36784683568](https://github.com/mrliga1/web1/actions/runs/36784683568): mobile 96, 99, **100**; desktop 100, 100, 100. Accessibility, Best Practices, SEO và Agentic đều 100, Agentic 3/3 trong cả sáu lượt. Đây là lượt mobile 100 đầu tiên của chuỗi kiểm thử này; vẫn chưa đạt điều kiện tất cả lượt đều 100. Báo cáo đầy đủ được lưu; bản tổng hợp ở `official-independent-f47c382-summary.json`.

Đã bổ sung kiểm tra tương tác sau Lighthouse trên cùng máy GitHub, bằng Playwright 1.62.1 đã xác minh với registry npm. Chạy tuần tự desktop/mobile trên tên miền chính thức, kiểm tra H1, ảnh, nhập biểu mẫu/checkbox, thêm/xóa yêu thích, CTA, menu di động, thanh điều hướng sau cuộn, tràn ngang và lỗi JavaScript. Lưu ảnh và kết quả cùng artifact. Không gửi biểu mẫu CRM; loại GITHUB_TOKEN khỏi môi trường tiến trình trình duyệt.

Kiểm tra cú pháp đạt; cấu hình YAML xác nhận đúng thứ tự, phiên bản cố định và bước lưu artifact. Thử điều kiện xác nhận phát hành: sai kho mã bị từ chối trước khi mở trình duyệt. Chưa có kết quả chạy UI thực tế trên GitHub cho kịch bản mới; cần đọc kết quả sau khi đẩy. Quy tắc chấm điểm Lighthouse giữ nguyên; chưa bàn giao.

## Kết quả kiểm tra tương tác và thông báo cookie

Commit `5f01d6d` đã phát hành thành công. Lượt [36787112194](https://github.com/mrliga1/web1/actions/runs/36787112194): mobile **74, 100, 100**, desktop **100, 100, 100**. Accessibility, Best Practices, SEO và Agentic đều 100, Agentic 3/3. Lưu báo cáo ở `official-independent-5f01d6d-summary.json`. Trung vị mobile đạt 100, nhưng điều kiện hiện tại yêu cầu cả ba lượt đạt; chưa chốt bàn giao.

Kiểm tra tương tác thực tế trên GitHub đạt cả desktop và mobile: H1, ảnh, biểu mẫu, checkbox, yêu thích, CTA, menu di động, thanh điều hướng sau cuộn, không tràn ngang và không có lỗi JavaScript. Đã xem ảnh chụp của hai kích thước. Kết quả riêng lưu ở `official-ui-5f01d6d-results.json`.

Lượt mobile đầu có TBT 936 ms, LCP 2,34 giây, Speed Index 4,21 giây. Mã giao diện giống bản `f47c382`; kiểm tra tương tác chạy sau Lighthouse. Dấu vết ghi một lần dựng bố cục mất 60 ms thời gian thực, khoảng 5,94 ms CPU của luồng; chưa đủ bằng chứng quy toàn bộ dao động điểm cho mã giao diện.

Thông báo cookie đang xuất hiện sau bộ hẹn giờ 1.200 ms và hiệu ứng 500 ms, đồng thời chỉ nhớ lựa chọn đồng ý. Đã chuyển thông báo khách mới vào HTML dựng sẵn, đọc cả lựa chọn đồng ý/từ chối trước lần vẽ đầu tiên, bỏ lần xuất hiện trễ và ghi nhớ lựa chọn trong phiên nếu lưu trữ bị chặn. Không đổi chính sách tải tracking sau đồng ý. Cần kiểm thử, xác nhận bản dựng và đo lại tên miền chính thức để kết luận tác động.

Kiểm thử `test-cookie-consent-render.mjs` đạt 11/11: HTML máy chủ, cấu hình tắt/trang quản trị, cả hai lựa chọn trước lần vẽ và sau khởi tạo, dữ liệu không hợp lệ, đồng ý/từ chối khi lưu trữ hoạt động hoặc bị chặn. Kiểm tra kiểu dữ liệu toàn dự án và lint các tệp TypeScript đã sửa đều đạt, không lỗi/cảnh báo. Kịch bản UI trên GitHub bổ sung tải lại trang sau từ chối để xác nhận lựa chọn được ghi nhớ ở bản chính thức. Chưa có kết quả hiệu suất của thay đổi cookie; chưa bàn giao.

## Tách CSS quản trị và điều chỉnh thời điểm hiện cookie

Commit `c38a171` đã phát hành thành công. Lượt [36791254886](https://github.com/mrliga1/web1/actions/runs/36791254886) đo trực tiếp tên miền chính thức: mobile **98, 98, 98**, desktop **100, 100, 100**; Accessibility, Best Practices, SEO và Agentic đều 100, Agentic 3/3. Kịch bản UI cả hai thiết bị đạt, gồm ghi nhớ từ chối sau tải lại. Lưu số liệu tại `official-independent-c38a171-summary.json` và `official-ui-c38a171-results.json`.

FCP mobile 1,22–1,26 giây, LCP 2,12–2,27 giây, TBT 91–115,5 ms; Speed Index 1,22–1,26 giây. Thay đổi cookie chưa đạt mục tiêu 100. Đã chuyển thông báo khách mới sang hiện ngay sau khởi tạo giao diện, không dựng thông báo trong HTML ban đầu và không khôi phục bộ hẹn giờ 1.200 ms. Giữ ghi nhớ đồng ý/từ chối và xử lý lưu trữ bị chặn. Kiểm thử cookie mới: **12/12 đạt**.

Đã tách CSS bằng cấu hình riêng cho mỗi đầu vào theo [tài liệu Tailwind v3](https://v3.tailwindcss.com/docs/functions-and-directives#config). Phân tích toàn bộ import từ 42 tệp trang công khai tới 110 tệp phụ thuộc xác nhận chỉ `AdminPanel.tsx` và hai tệp tuyến admin bị loại khỏi CSS công khai. CSS quản trị vẫn dùng cấu hình đầy đủ, được nhập ở `app/admin/layout.tsx`. Các quy tắc CSS tùy chỉnh dùng chung được giữ nguyên.

CSS công khai trước nén giảm **113.934 → 100.967 byte**; gzip **20.878 → 19.043 byte** khi biên dịch cùng công cụ. Đây là phép so sánh cục bộ; chưa dùng để công nhận dung lượng mạng hay điểm sau phát hành. `test-css-split.mjs` đối chiếu **1.949 nhóm quy tắc**, xác nhận không mất hoặc đổi khai báo CSS cũ khi hợp hai đầu vào mới, và không loại tệp nào trong 110 phụ thuộc công khai. Lưu bằng chứng tại `official-css-split-verification.json`.

Kiểm tra kiểu dữ liệu toàn dự án, lint các tệp TypeScript sửa đổi và kiểm tra khoảng trắng đều đạt. Cần xác nhận bản dựng Vercel, CSS tải thực tế, điểm Lighthouse và UI trên tên miền chính thức. Chưa đủ điều kiện bàn giao.

## Kết quả bản 528bd16 và chuẩn bị phép đo ổn định

Commit `528bd16` đã phát hành thành công. Lượt [36891484338](https://github.com/mrliga1/web1/actions/runs/36891484338): mobile **68, 99, 100**, desktop **100, 100, 100**. Một lượt xác minh riêng cùng commit [36893790561](https://github.com/mrliga1/web1/actions/runs/36893790561): mobile **64, 99, 99**, desktop **100, 100, 100**. Các mục còn lại đều 100, Agentic 3/3; UI hai thiết bị đạt. Giữ cả hai bộ kết quả tại `official-independent-528bd16-summary.json` và `official-independent-528bd16-repeat-summary.json`. Chưa đạt điều kiện bàn giao.

CSS thực tế trên trang chủ có một tệp 101.103 byte giải nén; tuyến admin tải thêm CSS quản trị. Đối chiếu 54 lớp chỉ dùng cho admin: không xuất hiện trong CSS công khai, có đầy đủ trong CSS admin. Bằng chứng: `official-live-css-528bd16-verification.json`. Đây là xác nhận tải CSS; chưa kiểm tra màn hình quản trị sau đăng nhập trong phép kiểm này.

Dấu vết lượt mobile đầu của lần xác minh có tác vụ Layout 117,55 ms nhưng CPU 3,36 ms; ParseHTML 21,31 ms nhưng CPU 0,94 ms. Có cả tác vụ nội bộ Chrome tại chrome://omnibox-popup.top-chrome. Hai lượt sau vẫn còn TBT 65–76 ms. Chưa thể quy toàn bộ dao động cho mã website; không bỏ bất kỳ lượt nào khỏi điều kiện đạt.

Đã sửa phép đo để khởi tạo Chrome với hồ sơ riêng ở about:blank, chờ 10 giây rồi mới đo tên miền chính thức. Giữ sáu lượt, phiên bản Lighthouse 13.5.0, mô phỏng mạng/CPU mặc định, đủ năm nhóm điểm, không tải website để làm nóng trước lượt đầu. Thêm kiểm tra mỗi báo cáo phải có disableStorageReset=false; Chrome được dọn khi thành công hoặc lỗi. Cơ chế gắn vào cổng Chrome đã mở được hỗ trợ trong [mã CLI Lighthouse](https://github.com/GoogleChrome/lighthouse/blob/v13.5.0/cli/run.js); hồ sơ mới và trang trống theo [chrome-launcher](https://github.com/GoogleChrome/chrome-launcher/blob/main/README.md).

Đã chuyển bộ mẫu bố cục mặc định sang import động khi bật chỉnh sửa. Khách công khai tiếp tục dùng bố cục do máy chủ gửi; bỏ nhánh đọc/ghi layout ở client vốn không thể chạy với các tuyến hiện tại. Giữ lưu sửa đổi, định dạng bảng, làm sạch bố cục trang chủ và chặn kết quả tải sau khi rời trang. Kiểm thử hành vi bố cục **7/7 đạt**, gồm HTML thực của bảy thành phần trang, mẫu cho năm trang, chuyển tuyến, lưu và lỗi quyền. Kiểm thử phép đo **5/5 đạt**.

API PageSpeed không dùng khóa hiện trả HTTP 429 vì hết hạn mức truy vấn; chưa có kết quả Google bổ sung. Chưa xác nhận hiệu quả của thay đổi khởi tạo mới bằng phép đo sau phát hành.

Kiểm tra kiểu dữ liệu toàn dự án đạt; lint bốn tệp sửa/thêm đạt, không lỗi hoặc cảnh báo; kiểm tra khoảng trắng đạt. Cần Vercel dựng thành công và phép đo cùng kiểm thử UI trên bản phát hành mới trước khi kết luận.
