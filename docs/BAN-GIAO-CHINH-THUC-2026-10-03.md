# Bàn giao Greenia Homes — 03/10/2026

Website chính thức: [greeniahomes.vn](https://greeniahomes.vn/). Kho mã: [mrliga1/web1](https://github.com/mrliga1/web1).

## Tiêu chí nghiệm thu đã cập nhật

Ngày 02/10, người dùng chấp thuận nghiệm thu tình trạng hiện tại với điểm **trên 95**, không bắt buộc tất cả đạt 100. Bộ kiểm tra giữ ba lượt mobile và ba lượt desktop, năm nhóm điểm, Agentic 3/3, không cảnh báo thu thập, Lighthouse 13.5.0 và xóa bộ nhớ đệm mỗi lượt. Điểm 95 trở xuống vẫn không đạt.

Bản ứng dụng đã đo và phát hành: `6f7b3fc460e72b09b91b76e1688edabac92d3026`. [Bản Vercel](https://vercel.com/greenia-homes/web1/FiUaRxSE6uPN8Ur1HE9veiL4Z6SX), [lượt đo chính thức](https://github.com/mrliga1/web1/actions/runs/36938881144).

| Chỉ tiêu | Mobile, ba lượt | Desktop, ba lượt |
|---|---|---|
| Performance | 96 / 99 / 98 | 100 / 100 / 100 |
| Accessibility | 100 / 100 / 100 | 100 / 100 / 100 |
| Best Practices | 100 / 100 / 100 | 100 / 100 / 100 |
| SEO | 100 / 100 / 100 | 100 / 100 / 100 |
| Agentic Browsing | 100; 3/3 mỗi lượt | 100; 3/3 mỗi lượt |
| CLS | 0 mỗi lượt | 0 mỗi lượt |
| Cảnh báo thu thập | 0 | 0 |

Lượt GitHub lịch sử báo failure vì lúc chạy còn áp dụng điều kiện tất cả 100. Giữ nguyên kết quả đó; cả sáu báo cáo đáp ứng tiêu chí mới. Kiểm thử quy tắc mới đạt 6/6, gồm ranh giới 95/96, điểm sai, thiếu/trùng lượt, cảnh báo và thiếu mục Agentic.

## Thay đổi đã phát hành

| Phần | Nội dung bàn giao |
|---|---|
| Trang chủ | Hero, H1, lời giới thiệu, CTA và biểu mẫu đã thiết kế lại; nội dung tĩnh được dựng trên máy chủ. |
| Hiệu ứng | Giữ Framer Motion, bổ sung CSS nhẹ, hỗ trợ giảm chuyển động; công cụ chỉnh sửa chỉ tải khi bật chỉnh sửa. |
| Hiệu suất | Giảm tải SDK/xử lý ở khách công khai, tách CSS quản trị, tải liên kết theo tương tác, bỏ dữ liệu Flight lặp, tối ưu ảnh và thông báo cookie. |
| SEO | Metadata, canonical, JSON-LD, sitemap, robots, trang 404 và redirect slug; llms.txt, nội dung có thể đọc khi không có JavaScript và liên kết theo hành trình tìm mua/thuê/dự án/tư vấn. |
| CRM | Phân trang, tìm/lọc trên máy chủ, trạng thái và ưu tiên, phân công, lịch liên hệ, ghi chú và nhật ký, xuất CSV, cập nhật nguyên tử và quyền theo vai trò. |
| Bảo mật và dữ liệu | Làm sạch HTML, bảo vệ dữ liệu CRM/RPC bằng RLS, bảo toàn lịch sử và đồng ý; chỉ tải tracking sau đồng ý và kiểm tra chính sách IP. |

Migration CRM `20260930164042_atomic_crm_updates.sql` đã áp dụng vào dự án Supabase `rorvzyxjoenlrpxoptnu`. Kiểm thử quyền quản trị/nhân viên trên PostgreSQL production chạy trong giao dịch hoàn tác; không giữ hồ sơ thử.

Kiểm tra giao diện trên bản đo đạt mười mục mỗi thiết bị và menu mobile. Chẩn đoán 30 phiên không ghi lỗi JavaScript, lỗi tải runtime hoặc capture HTML lệch. Kiểm tra tham chiếu dữ liệu máy chủ thực tế đạt cả mobile và desktop. Build Vercel của bản ứng dụng thành công; kiểm tra kiểu dữ liệu và lint trước phát hành đạt.

Kiểm tra bổ sung trên tên miền chính thức: 17 URL trả HTTP 200, metadata/canonical/JSON-LD đạt 0 lỗi và 0 cảnh báo. Kiểm tra bảo mật production đạt: nội dung công khai đọc được; dữ liệu nhạy cảm, bảng legacy và RPC đặc quyền bị chặn đúng.

## Dữ liệu và dọn dẹp trước bàn giao

Đối soát Supabase: **10 hồ sơ CRM thật; 0 hồ sơ, nhật ký hoặc tài khoản thử mang dấu của đợt nâng cấp; 0 nhánh cơ sở dữ liệu thử**. Dữ liệu hiện tại khác snapshot ngày 30/09; không khôi phục snapshot cũ lên dữ liệu đang vận hành. Bản sao riêng và manifest checksum được giữ tại `.local-backups/`, không đưa dữ liệu khách hoặc khóa lên GitHub.

Đã dọn 10.217 tệp, giải phóng 2.29 GB: output/cache build, bộ cài CLI tạm, báo cáo đo chi tiết, ảnh thao tác Preview và helper tạm. Giữ 11 tệp sao lưu CRM/manifest/schema riêng, mã nguồn và báo cáo nghiệm thu. Cache, cookie và dữ liệu duyệt web cá nhân được giữ nguyên.

Đã xóa sáu bản Preview của nhánh `codex/performance-release`, xác minh từng bản trả 404 qua API và production vẫn giữ bản đã nghiệm thu. Đã xóa alias của tên miền thử, thu hồi quyền `shareable-link`; tên miền thử và liên kết chia sẻ cũ trả HTTP 404, không cấp cookie bỏ qua bảo vệ. Không còn Preview của nhánh này trên Vercel. Nhánh thử local/GitHub đã được xóa sau khi xác minh nhập đủ vào main và không có PR mở. Phiên Vercel CLI tạm đã được thu hồi, kiểm tra lại trả HTTP 403.

## Commit hồ sơ bàn giao

Commit cuối cập nhật tiêu chí kiểm thử, hồ sơ và phạm vi bỏ qua cache; mã ứng dụng giữ nguyên bản 6f7b3fc đã đo. Quy tắc nghiệm thu đã được kiểm thử tại máy. Không chạy lại Lighthouse tự động cho commit hồ sơ ([skip ci]); bảng điểm giữ kết quả thật của bản ứng dụng đã phát hành và đã được chấp thuận nghiệm thu. Vercel có thể triển khai lại cùng mã ứng dụng sau push.

## Vận hành

1. Mở website chính thức và đăng nhập `/admin` bằng tài khoản đã được cấp quyền.
2. Trong CRM, lọc/tìm khách; phân công bằng quyền quản lý; nhân viên làm việc với khách được giao.
3. Thêm ghi chú/lịch liên hệ và theo dõi nhật ký; xuất CSV theo bộ lọc khi cần.
4. Đổi nội dung qua quản trị; kiểm tra lại trang công khai, canonical và sitemap sau cập nhật.
5. Máy phát triển cần chạy lại build sau khi output/cache được dọn. Biến môi trường giữ riêng; dùng `.env.example` khi thiết lập máy khác.

Quay lại ứng dụng bằng bản Vercel production đã biết tốt. Giữ migration và dữ liệu CRM; không khôi phục snapshot cũ nếu có khách hoặc cập nhật mới phát sinh.

## Giới hạn đã ghi nhận

- Điểm Lighthouse là phép đo trang chủ, không xác nhận mọi URL, Core Web Vitals người dùng thực, thứ hạng Google hoặc mức xuất hiện trong AI Search. Chưa có quyền Search Console/CrUX và PageSpeed API đang bị giới hạn truy vấn.
- Lỗi React 418 từng xuất hiện gián đoạn ở bản trước. Các lượt của bản đang nghiệm thu không tái hiện; chưa xác định chắc chắn nguyên nhân để tuyên bố đã sửa tận gốc.
- SMTP/Push thật, quy trình khôi phục toàn cơ sở dữ liệu và UAT CRM với người vận hành cần xác nhận riêng. Lịch liên hệ chưa có dịch vụ nhắc việc theo SLA.
- Một số tiêu đề/nội dung có dấu thử nghiệm tồn tại từ trước đợt làm việc này. Không tự xóa sản phẩm/bài viết cũ chỉ dựa vào tiêu đề; chủ nội dung cần xác minh và biên tập dữ kiện thực.
- Leaked Password Protection cần gói Supabase trả phí; chưa nâng gói. Audit phụ thuộc trước đó còn một cảnh báo thấp ở Quill; các bằng chứng lịch sử được giữ trong hồ sơ audit.

## Bằng chứng

- [Sáu báo cáo điểm chính thức](performance-2026-09-29/official-independent-6f7b3fc-summary.json).
- [Giao diện hai thiết bị](performance-2026-09-29/official-ui-6f7b3fc-results.json).
- [Chẩn đoán HTML/JavaScript](performance-2026-09-29/official-hydration-6f7b3fc-results.json).
- [Tham chiếu dữ liệu máy chủ thực tế](performance-2026-09-29/official-home-reference-6f7b3fc-verification.json).
- [Đối soát và kiểm tra HTTP trước bàn giao](performance-2026-09-29/handover-preparation-2026-10-02.json).
- [SEO trên 17 URL chính thức](performance-2026-09-29/official-search-2026-10-02.txt).
- [Bảo mật production](performance-2026-09-29/official-security-2026-10-02.txt).
- [Xóa sáu Preview](performance-2026-09-29/vercel-preview-cleanup-2026-10-02.json).
- [Thu hồi alias và liên kết chia sẻ](performance-2026-09-29/vercel-cleanup-verification-2026-10-02.json).
- [Truy cập liên kết cũ sau khi xóa Preview](performance-2026-09-29/preview-access-cleanup-check.json).

- [Dọn tệp và cache cục bộ](performance-2026-09-29/handover-cleanup-2026-10-02.json).
- [Dọn nhánh thử trên GitHub](performance-2026-09-29/github-test-branch-cleanup-2026-10-02.json).
- [Thu hồi phiên Vercel CLI tạm](performance-2026-09-29/vercel-temporary-session-cleanup-2026-10-02.json).

Các báo cáo ngày 28/09–02/10 là lịch sử triển khai; tài liệu này ghi tiêu chí và kết quả nghiệm thu hiện tại.
