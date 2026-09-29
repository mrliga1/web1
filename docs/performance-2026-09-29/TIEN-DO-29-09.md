# Tiến độ ngày 29/09/2026

## Các phép đo trước khi chuyển sang production

- Nhánh `codex/performance-release`, commit `c5ccfbe` đã đẩy lên GitHub theo quyền tạo bản thử. Vercel đã dựng bản này thành công.
- Website production chưa được phát hành lại. Migration CRM mới chưa áp dụng vào production.
- Người dùng đã cho phép chia sẻ bản thử và tạm mở riêng tên miền nhánh để Google đo. Ngoại lệ chưa được xác nhận đã lưu; truy cập không có phiên vẫn trả chuyển hướng đăng nhập tại thời điểm kiểm tra.
- Báo cáo Google đầu tiên bị chuyển đến trang đăng nhập Vercel; đã loại khỏi bằng chứng hiệu suất Greenia.

## Phép đo đúng website qua liên kết chia sẻ

Lighthouse 13.5.0/Chrome, một lượt mỗi chế độ, hạ tầng website là Vercel nhưng máy chạy đo vẫn là máy cục bộ.

| Chỉ số | Di động | Desktop |
| --- | --- | --- |
| Performance | 51 | 70 |
| Accessibility | 100 | 100 |
| Best Practices | 96 | 73 |
| SEO | 69 | 69 |
| Agentic Browsing | 3/3 | 2/3 |
| LCP | 3,6s | 0,8s |
| TBT | 9.050ms | 1.240ms |
| CLS | 0 | 0 |

Bản thử có header `X-Robots-Tag: noindex`; lớp bảo vệ Vercel còn chuyển hướng manifest/tài nguyên sang SSO, gây lỗi console và làm ảnh hưởng các nhóm điểm. Chưa dùng kết quả này để nghiệm thu SEO production. Performance chưa đạt 100; chưa có ba lượt đo cuối hoặc số liệu người dùng thực. [Báo cáo tổng hợp](preview-baseline/lighthouse-summary.json).

## Điều chỉnh đang kiểm tra

- Sửa Home ưu tiên snapshot mới từ máy chủ sau router.refresh cho sản phẩm, dự án, tin tức. Ba kiểm tra React qua trình duyệt đạt, gồm giữ nội dung khi API lỗi. [Kết quả](home-refresh-results.json).
- Tách nội dung banner tĩnh sang Server Component; biểu mẫu tư vấn giữ tương tác. Bản dựng chứa banner và sửa tracking đã đạt; kiểm tra giao diện trực tiếp sau phát hành đang chờ.
- Công cụ Lighthouse chỉ cho phép đúng tên miền dự án và xác minh địa chỉ kết quả trước khi lưu. Không lưu mã chia sẻ vào báo cáo tổng hợp.
- Kiểm thử CRM được căn chỉnh theo schema đã đọc từ production: users.id UUID, uid duy nhất, phân quyền dựa trên hồ sơ users. 10/10 bài thử nâng cấp đạt trên PostgreSQL cục bộ; đã thêm vai trò editor và tài khoản không có hồ sơ. Đây chưa phải kiểm thử giao dịch trên production.

## Kế hoạch phát hành cập nhật theo yêu cầu mới

Người dùng đã yêu cầu commit lên GitHub và kiểm tra bằng tên miền chính thức, ngừng dùng bản xem trước. Quyền này thay thế điều kiện cũ chỉ commit/phát hành sau Performance 100. Mục tiêu Performance 100 vẫn đang theo dõi; chưa đạt và chưa được xác nhận nghiệm thu.

1. Commit các thay đổi đã qua kiểm tra lên nhánh hiện tại trên GitHub.
2. Áp dụng giao dịch CRM vào Supabase trước khi đưa mã mới lên main; kiểm tra kết quả ba RPC, giữ nguyên dữ liệu hiện có.
3. Đẩy main để Vercel phát hành, xác minh nội dung mới thực tế trên https://greeniahomes.vn.
4. Kiểm tra trang công khai, SEO, quyền truy cập CRM và đo Performance mobile/desktop trên tên miền chính thức.

Phiên quản trị Supabase CLI trả HTTP 401 Unauthorized. Khóa máy chủ phục vụ website vẫn hoạt động; đã tạo snapshot riêng mới của 10 hồ sơ và đối chiếu checksum. Snapshot chưa bao gồm schema hoặc toàn bộ cơ sở dữ liệu. Tệp [AP-DUNG-CRM.sql](AP-DUNG-CRM.sql) đã qua kiểm tra trong PostgreSQL cục bộ với schema đối chiếu production: cả ba RPC tồn tại, toàn bộ 28 hồ sơ giả giữ nguyên. Có giới hạn khóa 5 giây, câu lệnh 30 giây và đối soát trong giao dịch; đây chưa phải xác nhận đã chạy trên Supabase.

Kỹ năng điều khiển máy tính đang có dùng chung chuột Windows. Theo yêu cầu không sử dụng chuột của người dùng, các thao tác Git và kiểm tra website chạy nền; bước cập nhật SQL được gửi cho người dùng thực hiện trong phiên Supabase đang đăng nhập.

## Lỗi Consent Mode phát hiện trong phép đo Vercel

- Lượt desktop thực tế tạo cookie Google Ads trước khi khách đồng ý. Mã tracking đưa lệnh Google vào dataLayer bằng mảng thường, thay vì đối tượng arguments theo [hướng dẫn chính thức](https://developers.google.com/tag-platform/security/guides/consent).
- Đã đổi lệnh default/update/set sang arguments, cho phép cá nhân hóa chỉ theo lựa chọn hiệu lực và bật ads_data_redaction khi bị từ chối. Không bỏ kiểm tra IP và không đổi chế độ tải Google sang phát sinh theo tác nhân đo.
- Phép thử mới thất bại trên mã cũ và đạt sau sửa; 10/10 kiểm tra tracking đạt.
- Kiểm tra bộ xử lý của container Google thật tại máy, chặn toàn bộ mạng ngoài: default denied, update granted và revoke denied được Google nhận đúng cho analytics_storage, ad_storage, ad_user_data, ad_personalization. [Kết quả](google-consent-runtime.json). Chưa xác nhận bằng network trên bản Vercel mới.
- Bản banner dựng trên máy chủ đã qua build 35/35 trang, lint và TypeScript; mã riêng homepage giảm 13,7 KB xuống 12,8 KB, First Load JS 164 KB. Bản chứa cả sửa tracking đã qua build production: biên dịch, lint, TypeScript và 35/35 trang đạt.

## GitHub và kiểm tra trực tiếp production

- Commit e0a38a7f4725dbf9d622bb324b89d98203ae75af đã đẩy thành công lên origin/codex/performance-release. Chưa đẩy main hoặc phát hành bản mới do migration CRM đang chờ xác nhận.
- Kiểm tra trực tiếp https://greeniahomes.vn xác nhận đang chạy bản cũ: chưa có nội dung banner mới; đã lưu danh sách tài nguyên để đối chiếu sau phát hành. Trang chủ, robots.txt, sitemap.xml, llms.txt, manifest.json và tracking-policy đều HTTP 200, không chuyển đến Vercel đăng nhập. [Kết quả HTTP](production-before-release.json).
- Kiểm tra 20 URL trong sitemap bằng scripts/audit-search-output.mjs: 0 lỗi trong các tiêu chí HTTP, title, description, canonical, robots, JSON-LD/schema; 3 cảnh báo dữ liệu thử ở sản phẩm, bài viết và dự án. Không coi phép kiểm tra này là toàn bộ đánh giá semantic/intent hoặc xác nhận điểm SEO 100. [Chi tiết SEO](production-before-seo.txt).
- Kiểm tra quyền production bằng scripts/verify-production-security.mjs đạt (exit 0): anon không đọc dữ liệu nhạy cảm, bảng legacy/RPC đặc quyền bị chặn, dữ liệu công khai vẫn đọc được. Đây chưa phải UAT vai trò nhân viên và migration CRM mới.
- Các lượt kiểm tra trên chỉ đọc dữ liệu; không tạo hồ sơ khách hay gửi email/thông báo. Chưa chạy phép đo Performance mới để tránh gán kết quả bản cũ cho bản nâng cấp.

## Tiếp tục theo yêu cầu tối ưu 100 trước bàn giao

Người dùng yêu cầu cập nhật và phát hành bản chính thức, tối ưu đến 100 điểm rồi mới bàn giao. Chưa xem bất kỳ kết quả dưới 100 nào là nghiệm thu.

- Kiểm tra Supabase trực tiếp vẫn chưa có consultation_activity (HTTP 404/PGRST205) và query_consultations (HTTP 404/PGRST202). Supabase CLI vẫn Unauthorized 401. Đã gửi lại bước chạy SQL cho người dùng; không đưa mã yêu cầu RPC lên main khi RPC chưa tồn tại.
- Đã đo Lighthouse 13.5.0 trên tên miền chính thức, một lượt mỗi chế độ bằng máy cục bộ. Bản đang chạy là main cũ: Performance mobile 35, desktop 50; LCP 10,9s/1,4s, TBT 21.590ms/730ms, CLS 0/0,307. Không dùng các điểm này làm nghiệm thu mã mới chưa phát hành. [Tổng hợp](production-baseline/lighthouse-summary.json).
- Google PageSpeed API không có hạn mức còn lại: mobile và desktop đều HTTP 429 RESOURCE_EXHAUSTED. Không thay kết quả lỗi API bằng điểm ước đoán. [Trạng thái](production-baseline/google-pagespeed-status.json).
- Phân tích trace: bố cục và JavaScript là tác vụ chính; bản cũ tải Google Ads/AdSense trước đồng ý và bị cảnh báo cookie bên thứ ba. Các sửa banner/SSR/consent đã commit nhằm xử lý nhóm này; vẫn cần đo trên production sau khi phát hành.
- Đang tách popup tư vấn sang mô-đun chỉ tải khi cần mở, giữ mã nút liên hệ trong HTML và giữ nội dung đang nhập qua lần đóng/mở. Có trạng thái đang tải, thông báo nếu tải mã thất bại và cho phép thử lại. Đã bổ sung kiểm tra trình duyệt cho việc giữ dữ liệu, lỗi tải chunk và thử lại. Bản dựng chứa tách popup đã qua lint, TypeScript và 35/35 trang; chỉ số First Load JS của báo cáo dựng vẫn làm tròn ở 164 KB, chưa coi đây là bằng chứng tăng điểm Performance. 9 lượt kiểm tra giao diện đạt, gồm dữ liệu popup không mất sau đóng/mở, lỗi tải chunk không làm mất nút liên hệ, mở lại sau lỗi, nguồn tư vấn đúng và điều hướng. [Kết quả](popup-regressions.json).
- Đã hỏi lựa chọn Consent Mode cơ bản (chỉ tải sau đồng ý) hoặc tiếp tục tín hiệu ẩn danh trước đồng ý. Theo [Google](https://developers.google.com/tag-platform/security/concepts/consent-mode), hai chế độ có hành vi và khả năng mô hình hóa khác nhau; chưa thay chế độ trong khi chờ lựa chọn.

- Phát hiện menu luôn đánh dấu Trang chủ vì root truyền currentRoute cố định. Đã chuyển sang nhận diện URL thật cho sản phẩm, dự án, tin tức, danh mục con và thêm aria-current. Kiểm tra trình duyệt ở trang danh mục đã đạt; bản dựng 35/35 trang, lint và TypeScript đạt.

- Bản dựng mới: 17 URL trong sitemap đạt 0 lỗi và 0 cảnh báo theo bộ kiểm tra; ba URL có nội dung thử vẫn HTTP 200 nhưng metadata noindex. [Chi tiết](candidate-search-results.txt), [metadata ba URL](candidate-noindex.json). Dự án Vinhomes Cần Giờ hiện có chuỗi ký tự lặp dài 594 ký tự trong nội dung nguồn, nên đang noindex cho đến khi được biên tập bằng thông tin thật. Không tự tạo dữ kiện kinh doanh hoặc pháp lý.
- Sau sửa menu, 9/9 tình huống giao diện đạt trên bản dựng mới, gồm lựa chọn mục điều hướng đúng và thử lại popup khi tải mã thất bại. [Kết quả](popup-regressions.json).
