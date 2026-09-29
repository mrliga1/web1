# Hồ sơ nâng cấp Greenia Homes — bắt đầu 28/09, kiểm tra cuối 29/09/2026

## Trạng thái

Thay đổi hiện nằm ở mã nguồn cục bộ. Chưa áp migration Supabase, chưa triển khai Vercel, chưa sửa dữ liệu nội dung production. Ngày 29/09 đã xác minh lỗi khóa chỉ nằm ở cấu hình máy kiểm thử: khóa cũ cục bộ bị thiếu, trong khi production `/api/tracking-policy` trả HTTP 200. Sau khi người dùng cập nhật, khóa máy chủ cục bộ đã được xác minh thành công. Đã sao lưu riêng 10 hồ sơ CRM và đối chiếu checksum; đây là snapshot bảng consultations, chưa phải backup/restore toàn cơ sở dữ liệu. **Áp migration CRM và kiểm tra tương thích trước khi triển khai mã mới.**

Audit gốc: [AUDIT-2026-09-28.md](AUDIT-2026-09-28.md). Kết quả kiểm thử cuối được ghi ở phần nghiệm thu.

## Thay đổi và lý do

| Nhóm | Đã thực hiện | Lý do |
| --- | --- | --- |
| Thông báo | Context dùng chung trên trang chủ, quản trị, liên hệ, danh mục, danh sách và chi tiết; toast có vai trò truy cập. | Callback rỗng trước đây khiến lỗi/lưu thành công không hiện. |
| Email | Phiên nhân viên bắt buộc; chỉ admin/editor gửi; đối chiếu người được giao và nhân viên tồn tại; escape HTML; kiểm tra SMTP và timeout. | Sửa sai người nhận, báo thành công giả và API công khai. |
| Form | Bỏ dịch vụ lấy IP bên ngoài ở năm biểu mẫu; máy chủ vẫn xác định IP/chặn theo chính sách hiện có. | Giảm phụ thuộc mạng trước khi gửi. |
| Dữ liệu CRM | RPC cập nhật trường/thêm ghi chú nguyên tử; tác giả/thời gian máy chủ; trigger bảo vệ cả cập nhật bảng trực tiếp. | Tránh ghi đè, sửa lịch sử cũ và thông tin đồng ý của khách. |
| Giao diện CRM | Mô-đun riêng; phân trang 25 khách; lọc/tìm kiếm máy chủ; năm giai đoạn; giao đơn/hàng loạt trong trang; lịch liên hệ; nhóm đến hạn; nhật ký thay đổi; xuất theo bộ lọc. | Giảm tải toàn bảng và làm rõ công việc chăm sóc. |
| Thông báo CRM | Phân biệt dữ liệu đã lưu với thông báo chưa gửi; gửi lại phân công; đếm số khách thành công. | Tránh báo sai và thao tác lặp. |
| CSV | Escape, ngăn công thức, bảo toàn điện thoại; phát hiện thiếu bản ghi khi dữ liệu đổi lúc xuất. | Giữ dữ liệu khi mở bằng bảng tính. |
| SEO | Metadata chặn streaming trước khi kiểm tra URL; bỏ bốn loading boundary gây HTTP 200 cho trang 404; noindex bộ lọc không phù hợp; canonical/schema đồng bộ; lịch sử slug/redirect vĩnh viễn; cảnh báo thử nghiệm và loại khỏi sitemap/noindex. | Giảm trang mỏng, soft 404 và mất liên kết khi đổi tiêu đề. |
| Dữ liệu web | Phân biệt lỗi nguồn với dữ liệu rỗng; trang lỗi/404 tiếng Việt. | Tránh cache đầu ra rỗng như dữ liệu hợp lệ. |
| Trang chủ | Hero/H1/CTA mới, liên kết thật, phối cảnh có chú thích; form xác nhận số liên hệ; bỏ cam kết chưa xác minh. | Làm rõ dịch vụ, nhu cầu và bước tiếp theo. |
| Animation | CSS nhẹ, reduced motion; giữ Framer Motion hiện có; chính sách hiển thị ngay khi không có JavaScript. | Tránh thư viện trùng, trì hoãn LCP và nội dung bị ẩn. |
| Hiệu suất bổ sung | Ngừng tải trước thẻ hàng và trang chính sách ở lần mở đầu; tải theo hover/focus/touch; dựng khối ngoài màn hình theo nhu cầu, giữ nội dung trong HTML và khi in. | Loại tải Framer Motion khoảng 40 KB khỏi lần mở trang chủ, giảm việc dựng trang. |
| Dữ liệu trình duyệt | Đọc an toàn danh sách yêu thích/xem gần đây; loại dữ liệu sai kiểu; báo lỗi khi không lưu được. | JSON hỏng trước đây có thể làm lỗi toàn trang hoặc ngăn lưu yêu thích. |
| Quảng cáo/cookie | Tải quảng cáo theo đồng ý marketing và kiểm tra IP; tải lại khi thu hồi quyền để dừng mã đã chạy; ô đồng ý 24px; liên kết chính sách dùng điều hướng Next. | Sửa quảng cáo tải trước đồng ý, cải thiện hiệu suất và vùng bấm. |
| Bảo mật | Sanitizer theo parser cho HTML/preview, giới hạn URI/iframe/CSS; Next 15.5.26, Nodemailer 9.1.1 và bản vá tương thích. | Giảm nguy cơ thực thi mã và khắc phục cảnh báo có bản vá. |

## Giới hạn còn phải xử lý

- Lịch liên hệ hiện là dữ liệu và nhóm đến hạn; chưa có dịch vụ gửi nhắc việc theo giờ/SLA.
- Activity ghi từ lúc migration có hiệu lực. Ghi chú vẫn ở JSON với thao tác thêm nguyên tử, chưa chuyển sang bảng chăm sóc riêng.
- Phân trang áp cho CRM. Các mô-đun quản trị nội dung khác vẫn có truy vấn toàn bảng; AdminPanel chưa được tách hoàn toàn.
- Slug vẫn theo tiêu đề, lưu URL cũ từ lần chỉnh sửa sau nâng cấp. Chưa có slug bất biến, ràng buộc chống trùng và phục hồi mọi URL đã đổi trước đây. Redirect của Next là HTTP **308**.
- Ba cảnh báo nội dung production chưa được biên tập trong cơ sở dữ liệu. Bộ nhận diện thử nghiệm không thay thế xác minh giá, pháp lý, tác giả và nội dung hữu ích.
- Quill còn một cảnh báo phụ thuộc mức thấp chưa có bản thay tương thích được xác nhận. Sanitizer không đồng nghĩa đã xóa cảnh báo thư viện.
- Chưa xác nhận SMTP/Push thật, UAT bằng tài khoản CRM thật, backup/restore production, Search Console và Core Web Vitals.

## Phát hành và quay lại

### Kế hoạch nội dung semantic, intent và AI Search

| Ý định | Trang đích | Cần biên tập từ dữ kiện thật |
| --- | --- | --- |
| Tìm mua | `/san-pham`, `/latest-sales` | Khu vực, loại tài sản, giá/đơn vị, diện tích, tình trạng hàng và ngày cập nhật. |
| Tìm thuê | `/latest-rents` | Giá/kỳ thanh toán, nội thất, điều kiện thuê và ngày nhận nhà. |
| Tìm hiểu dự án | `/du-an`, chi tiết dự án | Đơn vị phát triển, vị trí, quy mô, tiến độ, nguồn pháp lý, ngày xác minh; chú thích phối cảnh. |
| Đánh giá sản phẩm | Chi tiết sản phẩm | Giá, diện tích, vị trí, pháp lý/hiện trạng có nguồn, ưu/nhược điểm, ảnh có quyền sử dụng. |
| Nghiên cứu giao dịch | `/tin-tuc`, bài viết | Câu trả lời trực tiếp, tác giả chịu trách nhiệm, ngày cập nhật, tài liệu gốc và điều kiện áp dụng. |
| Tìm đơn vị tư vấn | `/`, `/lien-he` | Vai trò Greenia Homes, khu vực phục vụ, quy trình và kênh liên hệ đã xác nhận. |
| Tìm theo địa bàn | URL vị trí đã cấu hình | Danh sách hàng thực và thông tin địa bàn riêng có nguồn; không mở index vị trí rỗng. |

Liên kết theo hành trình: bài hướng dẫn → dự án → sản phẩm phù hợp → liên hệ; chỉ liên kết khi có quan hệ thực. Không tự thêm đánh giá khách, số giao dịch, quan hệ chủ đầu tư hoặc chứng nhận chưa có bằng chứng. Schema phải khớp nội dung hiển thị. Google không yêu cầu tệp/schema riêng để xuất hiện trong AI Search: [hướng dẫn chính thức](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).

### Các bước triển khai

1. Đăng nhập Supabase CLI qua luồng an toàn; xác minh đúng dự án. Không gửi khóa/mật khẩu trong chat.
2. Xác minh backup/khôi phục và số khách trước migration bằng kênh quản trị an toàn.
3. Chạy `npx supabase db push --dry-run`; đối chiếu migration dự kiến. Có migration cũ chưa áp thì đối chiếu lịch sử trước.
4. Áp migration `202609280001_atomic_crm_updates.sql`; kiểm tra ba RPC, trigger và activity; thử quyền admin/editor/member với khách thử được phép.
5. Chạy `npm run verify:production` chỉ đọc, đối soát số khách; triển khai Vercel với biến môi trường đúng.
6. Kiểm tra từng form, giao khách, ghi chú, lịch, CSV, URL cũ, 404, sitemap/canonical/schema; chỉ gửi email thử tới người nhận được cho phép.
7. Đo Lighthouse mobile/desktop nhiều lượt trên production; kiểm tra Search Console và dữ liệu thực ngày 7/28.

Quay lại: ưu tiên bản ứng dụng đã biết tốt; không xóa bảng activity/ghi chú. Trigger lịch sử có thể không tương thích cách ghi cũ, nên thử bản quay lại trên staging. Nếu cần gỡ trigger/RPC, dùng migration riêng sau khi lưu nhật ký. Không khôi phục backup mà bỏ qua lead phát sinh sau thời điểm backup.

## Nghiệm thu

Kết quả đã xác minh: 43/43 bài thử CRM/consent/tracking/SEO đạt; build 35/35 trang, TypeScript và lint đạt; migration chạy trong PostgreSQL cục bộ. Kiểm thử bổ sung xác nhận cập nhật trực tiếp không sửa đồng ý, xóa/sửa lịch sử hoặc đổi phân công bằng vai trò member. Crawl 20 trang công khai không còn liên kết lỗi; 17 URL sitemap đạt kiểm tra metadata/canonical/schema, không lỗi/cảnh báo. Ba nội dung thử nghiệm bị loại khỏi sitemap và noindex.

Lighthouse 13.5.0 lần đầu trên trang chủ cục bộ: SEO 100, Agentic Browsing 3/3, Accessibility 97, Best Practices 73, Performance 57. Đây là baseline trước sửa quảng cáo/ảnh/vùng bấm; không dùng làm điểm cuối. “3/3” của Agentic Browsing là nhóm kiểm tra riêng, không đồng nghĩa Core Web Vitals thực tế đã đạt.

### Nghiệm thu bản mã cuối

- Build production: 35/35 trang, lint và TypeScript đạt.
- Giao diện công khai: 10 nhóm đạt; form lỗi giữ dữ liệu, form thành công xác nhận số liên hệ, phục hồi bộ nhớ hỏng, desktop/mobile, 5 nhóm URL không tồn tại trả 404, metadata bộ lọc, API email không xác thực, HTML không JavaScript, tải/thu hồi quảng cáo theo đồng ý.
- CRM: 3/3 vai trò admin/editor/member đạt kiểm thử giao diện. Backend/Auth/SMTP/Push được giả lập trong phép thử giao diện; quyền dữ liệu được thử riêng bằng PostgreSQL cục bộ. Đây chưa phải UAT production.
- Hồi quy: 8 kiểm tra đạt, gồm xóa bộ lọc, focus form, sidebar 390/768px, ngữ cảnh popup và điều hướng sản phẩm/dự án/tin tức. Phản hồi điều hướng ở khung hình tiếp theo đạt 11–22ms trong lần đo này; đây không phải INP thực tế.
- Crawl cuối: 20 trang, không liên kết lỗi; kiểm tra 17 URL sitemap, 0 lỗi và 0 cảnh báo theo bộ kiểm tra hiện có.
- Phụ thuộc: 0 critical/high/moderate; còn 1 low ở Quill. Lệnh audit có mã thoát 1 do cảnh báo còn lại.
- Lighthouse cuối: 3 lượt mỗi chế độ với Lighthouse 13.5.0/Edge 154 trên localhost, cấu hình mobile mặc định và desktop chính thức. Không thay thế dữ liệu người dùng thực.

| Nhóm điểm | Di động, 3 lượt | Desktop, 3 lượt |
| --- | --- | --- |
| Performance | 60 / 65 / 73; trung vị 65 | 75 / 75 / 82; trung vị 75 |
| Accessibility | 100 / 100 / 100 | 100 / 100 / 100 |
| Best Practices | 96 / 96 / 96 | 96 / 96 / 96 |
| SEO | 100 / 100 / 100 | 100 / 100 / 100 |
| Agentic Browsing | 3/3 cả ba lượt | 3/3 cả ba lượt |

LCP di động 1,8–2,7s; desktop 0,8–0,9s. CLS bằng 0 cả sáu lượt. TBT di động 1.410–4.070ms, desktop 360–550ms, vẫn cần tối ưu. Tất cả lượt có cảnh báo trang chưa hoàn tất ổn định trong thời hạn đo, nên điểm chỉ là bằng chứng phòng thí nghiệm có giới hạn. Mức hiệu suất **chưa đạt 100**. Best Practices còn lỗi mạng `/api/tracking-policy` HTTP 503 do khóa máy chủ bị từ chối. Không bỏ kiểm tra IP hay giả phản hồi để tăng điểm.

### Công việc còn lại và điều kiện kết thúc

1. **Kết nối/phát hành:** khóa máy chủ cục bộ đã hoạt động và đã có snapshot riêng của bảng consultations; còn cần đối chiếu schema/khả năng khôi phục, dry-run/áp migration trước ứng dụng, đối soát lead và UAT thật theo ba vai trò. Supabase CLI chưa được xác minh lại; không suy diễn lỗi CLI thành lỗi khóa production.
2. **Hiệu suất:** profile trên môi trường production/staging có kết nối hợp lệ; giảm state/truy vấn toàn cục ở trang công khai, chuyển thêm dữ liệu/cấu hình sang server và giảm JavaScript cần khi mở đầu. Xác minh tác vụ dài và cảnh báo tải chưa ổn định trước khi kết luận nguyên nhân; chạy lại tối thiểu 3 lượt theo mẫu trang. Điểm trang chủ không xác nhận điểm mọi trang.
3. **Nội dung/semantic:** chủ nội dung xác nhận thông tin/nguồn của ba bản thử và các cam kết, số liệu, giá/pháp lý; biên tập theo bản đồ intent ở trên. Chưa sửa dữ liệu production hoặc tự tạo dữ kiện thay thế.
4. **CRM tiếp theo:** chốt SLA, quy tắc chống trùng, nhắc việc tự động và báo cáo chuyển đổi trước khi mở rộng workflow; chuyển ghi chú sang bảng riêng khi đã có migration dữ liệu được đối soát. Các hạng mục này chưa được triển khai trong bản hiện tại.
5. **SEO thực tế:** quyền Search Console/CrUX, kiểm tra index/Rich Results và theo dõi ngày 7/28 sau phát hành. Không thể xác nhận thứ hạng hoặc mức hiển thị AI Search bằng Lighthouse.

Kết thúc toàn bộ yêu cầu cần nghiệm thu các mục trên. Bản này bàn giao mã và bằng chứng kiểm thử cục bộ; chưa xác nhận hoàn thành production hoặc đạt mọi điểm 100.

Bằng chứng: [giao diện công khai](implementation-2026-09-28/ui-results.json), [CRM](implementation-2026-09-28/crm-ui-results.json), [crawl](implementation-2026-09-28/internal-links.json), [SEO sitemap](implementation-2026-09-28/search-output-final.txt), [Lighthouse](implementation-2026-09-28/lighthouse-summary.json).

Danh sách tệp thay đổi/thêm/xóa: [changed-files.txt](implementation-2026-09-28/changed-files.txt). Tại thời điểm kiểm tra ngày 28/09, các tệp mã chưa được commit/push; thư mục báo cáo chứa JSON/HTML và ảnh kiểm thử, không chứa biến môi trường.

Ảnh: [trang chủ desktop](implementation-2026-09-28/home-desktop.png), [di động](implementation-2026-09-28/home-mobile.png), [danh sách CRM](implementation-2026-09-28/crm-list-local-test.png), [hồ sơ khách thử](implementation-2026-09-28/crm-detail-local-test.png).

### Chạy lại kiểm tra

Sau khi cài dependencies, dùng bản production cục bộ tại cổng 3001 cho các script trình duyệt. Các script trình duyệt chỉ chấp nhận localhost để tránh ghi ngoài phép thử. Chỉ phép thử giao diện giả lập API; Lighthouse và crawl dùng phản hồi thật.

```text
node --test scripts/test-crm-consent.mjs scripts/test-tracking-policy.mjs scripts/test-crm-upgrade.mjs
npm run build
node node_modules/next/dist/bin/next start --port 3001 --hostname 127.0.0.1
node scripts/test-audit-ui.mjs
node scripts/test-crm-ui.mjs
node scripts/test-ui-regressions.mjs
node scripts/audit-internal-links.mjs
npm run audit:search
node scripts/audit-lighthouse.mjs
```

Đặt `SEARCH_AUDIT_BASE_URL=http://127.0.0.1:3001` cho kiểm tra SEO. Đặt `CHROME_PATH` nếu đường dẫn Edge/Chrome khác máy kiểm thử; script hồi quy mặc định Chrome. Lighthouse cần package `lighthouse` cài riêng hoặc `LIGHTHOUSE_PACKAGE_ROOT` trỏ tới thư mục node_modules chứa package, và `AUDIT_RUNS=3`. Playwright được lấy từ runtime Codex qua `CODEX_NODE_MODULES`; máy khác cần chỉ định node_modules chứa Playwright. Không có khóa hoặc mật khẩu trong báo cáo.

Hồ sơ này **không xác nhận toàn bộ yêu cầu đã hoàn tất** khi phát hành/UAT/nội dung/điểm số thực tế còn chưa nghiệm thu.

## Cập nhật kiểm thử 29/09/2026

- 46/46 bài thử CRM, consent và tracking đạt khi chạy lần lượt; không còn lỗi hết bộ nhớ của lượt chạy đồng thời.
- Đã tách SDK xác thực khỏi lần mở trang công khai, truyền cấu hình công khai từ server, chuyển footer sang server và giữ nút lên đầu trang tương tác riêng; trang liên hệ nhận bố cục từ server.
- Kết nối khóa cục bộ được xác minh HTTP 206, production tracking-policy HTTP 200. Snapshot riêng có 10 hồ sơ, checksum đã đối chiếu, không đưa dữ liệu khách/khóa vào Git.
- Lượt build mới vượt qua biên dịch, lint và TypeScript nhưng thất bại ở tạo trang do kết nối Supabase hết thời gian chờ. Đang chạy lại; chưa xem lượt thất bại là bản dựng đạt.
- Chưa nghiệm thu thay đổi footer/trang liên hệ bằng trình duyệt và chưa có kết quả Lighthouse của bản mới này. Các điểm ở phần trên là bằng chứng lịch sử.

### Bản chuẩn bị xem trước — 29/09/2026

- Build production mới đạt đủ 35/35 trang, lint và TypeScript. 5 kiểm tra đăng nhập/trang liên hệ/chân trang và 10 nhóm giao diện công khai đạt.
- Migration được chỉnh để chuẩn hóa tác giả từ phiên thật, tương thích tên nhân viên của bản cũ; 10/10 bài thử nâng cấp đạt khi chạy lại, gồm bảo toàn lịch sử và ngăn giả tác giả.
- API tracking-policy cục bộ trả HTTP 200 sau khi cập nhật khóa.
- Lighthouse 13.5.0/Chrome, một lượt chuẩn mỗi chế độ của bản mới: Performance mobile 55, desktop 73; Accessibility/Best Practices/SEO đều 100, Agentic Browsing 3/3, CLS 0, không cảnh báo tải. TBT tương ứng 9.460ms và 630ms. Đây là lượt chẩn đoán, chưa đạt mục tiêu 100.
- Người dùng đã cho phép commit/đẩy nhánh kiểm thử để tạo Vercel Preview trước khi đạt Performance 100; chưa cho phép xem bản kiểm thử này là nghiệm thu hiệu suất. Website chính chưa được phát hành lại.
- Tệp cấu hình mẫu được giữ trống khóa máy chủ trước khi đưa vào Git. Backup CRM, môi trường riêng và trace/báo cáo Lighthouse chi tiết được giữ cục bộ; Git lưu bản tổng hợp.

### Đo Vercel và sửa Consent Mode — tối 29/09/2026

Nhánh thử đã đẩy commit c5ccfbe và dựng Vercel thành công. Đã đo đúng trang qua liên kết chia sẻ: Performance mobile 51, desktop 70, một lượt mỗi chế độ trên máy chạy đo cục bộ; các nhóm khác chịu ảnh hưởng noindex và SSO của bản thử. Báo cáo Google chuyển sang trang đăng nhập đã bị loại.

Đã sửa trang chủ giữ snapshot cũ, tách banner tĩnh sang server và sửa định dạng lệnh Consent Mode. Kiểm tra Home 3 nhóm đạt, CRM 10/10 và tracking 10/10 đạt. Bộ xử lý Google thật nhận đúng denied/granted/revoke trong phép thử chặn mạng. Bản chứa sửa tracking đang được dựng và kiểm tra giao diện. Ngoại lệ tên miền thử chưa xác nhận lưu; chưa áp migration hay phát hành production.

Chi tiết và bằng chứng: [Tiến độ 29/09](performance-2026-09-29/TIEN-DO-29-09.md).

### Phát hành theo tên miền chính thức — cập nhật yêu cầu

Người dùng yêu cầu commit lên GitHub rồi kiểm tra trực tiếp https://greeniahomes.vn, ngừng dùng bản xem trước. Bản mới qua build 35/35 trang, lint và TypeScript. Tệp SQL phát hành CRM qua kiểm tra PostgreSQL với đối soát đầy đủ trước/sau; các bài thử nâng cấp đều đạt. Đã tạo backup riêng mới của 10 hồ sơ, checksum đạt; chưa có backup toàn schema. Phiên quản trị Supabase CLI hết hiệu lực (401); đã gửi tệp SQL cho người dùng chạy trong dashboard. Chưa đưa mã mới lên main khi ba RPC CRM chưa được xác nhận tồn tại. Performance 100 chưa đạt.
