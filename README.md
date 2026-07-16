# Greenia Homes

Website bất động sản Greenia Homes được xây dựng bằng Next.js App Router, quản lý nội dung qua Supabase, triển khai trên Vercel và lưu trữ hình ảnh tại Cloudflare R2.

## Công nghệ chính

- Next.js 15, React 18 và TypeScript
- Tailwind CSS, Framer Motion và Lucide React
- Supabase Auth, PostgreSQL và Realtime
- Cloudflare R2 cho thư viện hình ảnh
- Nodemailer/Gmail SMTP cho thông báo yêu cầu tư vấn
- Vercel cho build và production

## Yêu cầu môi trường

- Node.js 20 LTS trở lên
- npm 10 trở lên
- Một dự án Supabase đang hoạt động
- Một bucket Cloudflare R2 có public domain
- Tài khoản Gmail SMTP hoặc Google App Password nếu bật email

## Cài đặt cục bộ

```bash
npm ci
```

Sao chép `.env.example` thành `.env.local`, điền các biến môi trường rồi chạy:

```bash
npm run dev
```

Ứng dụng mặc định mở tại `http://localhost:3000`.

## Biến môi trường

| Biến | Phạm vi | Mục đích |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Trình duyệt | URL dự án Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Trình duyệt | Anon key, được bảo vệ bằng RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Máy chủ | Xóa tài khoản Auth; tuyệt đối không đưa ra trình duyệt |
| `R2_ACCOUNT_ID` | Máy chủ | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | Máy chủ | Access key ghi/xóa R2 |
| `R2_SECRET_ACCESS_KEY` | Máy chủ | Secret key ghi/xóa R2 |
| `R2_BUCKET_NAME` | Máy chủ | Tên bucket R2 |
| `R2_PUBLIC_URL` | Máy chủ | Public domain của bucket, không có dấu `/` cuối |
| `SMTP_USER` | Máy chủ | Tài khoản gửi Gmail SMTP |
| `SMTP_PASS` | Máy chủ | Google App Password |
| `SMTP_TO` | Máy chủ | Email nhận yêu cầu tư vấn |
| `BLOCKED_IPS` | Máy chủ | Danh sách IP dự phòng, phân tách bằng dấu phẩy |

Không đặt PAT GitHub, khóa R2, SMTP password hoặc Supabase service-role trong biến có tiền tố `NEXT_PUBLIC_`.

## Cơ sở dữ liệu và RLS

Lớp tương thích trong `src/firebase.ts` giữ API gọi dữ liệu cũ nhưng toàn bộ dữ liệu thực tế nằm ở Supabase. Firebase project cũ không còn được sử dụng.

Migration được quản lý bằng Supabase CLI và lưu theo thứ tự trong `supabase/migrations`. Trước khi áp dụng lên production, luôn xác minh đúng project và chạy dry-run:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push --dry-run
npx supabase db push
npm run verify:production
```

Không đưa access token, database password hoặc service-role key vào lệnh đã commit, tài liệu hay hội thoại. Migration bảo vệ dữ liệu khách hàng, giới hạn cấu hình công khai và chỉ cho tài khoản có `users.role = 'admin'` quản trị nội dung.

Vai trò admin phải được gán trực tiếp trong Supabase bởi người có quyền cơ sở dữ liệu. Ứng dụng không tự cấp admin theo email.

Danh sách IP bị chặn được lưu trong bản ghi `settings/blocked-ips`. Admin đọc/ghi bản ghi này qua JWT và RLS; API gửi email chỉ đọc bằng service-role ở phía máy chủ. `BLOCKED_IPS` là phương án dự phòng khi Supabase tạm thời không khả dụng.

## Lệnh dự án

```bash
npm run dev        # Chạy môi trường phát triển
npm run typecheck  # Kiểm tra TypeScript
npm run lint       # Kiểm tra ESLint
npm run build      # Build production
npm run start      # Chạy production build tại cổng 3000
npm run verify:production # Xác minh anon không đọc được dữ liệu nhạy cảm
```

`verify:production` phải đạt sau khi áp migration RLS. Lệnh chỉ đọc ID tối thiểu, không in nội dung khách hàng hoặc khóa môi trường.

## Cấu trúc chính

- `app/`: route, metadata, API máy chủ và cấu hình App Router
- `src/components/`: giao diện công khai và bảng quản trị
- `src/contexts/`: trạng thái xác thực, bố cục và cấu hình chung
- `src/lib/`: dữ liệu mặc định, SEO và tiện ích dùng chung
- `src/lib/serverContent.ts`, `src/lib/contentSchemas.ts`: dữ liệu và JSON-LD render phía máy chủ
- `supabase/config.toml`, `supabase/migrations/`: cấu hình CLI và migration bảo mật/RLS được quản lý bằng mã nguồn
- `public/llms.txt`, `app/robots.ts`, `app/sitemap.ts`: dữ liệu hỗ trợ công cụ tìm kiếm và AI Search

## Upload và xóa hình ảnh

Trang quản trị gửi JWT Supabase tới API máy chủ. API xác minh vai trò admin rồi mới ghi hoặc xóa tệp trong R2. Trình duyệt không giữ khóa R2 và không còn upload qua GitHub PAT.

Ảnh cũ trên GitHub/jsDelivr vẫn được phép hiển thị để tránh làm hỏng nội dung. Khi xóa bản ghi ảnh cũ, API chỉ bỏ tham chiếu dữ liệu và không gọi GitHub.

## SSR và AI Search

- Trang chi tiết sản phẩm, dự án, tin tức và metadata danh mục được render động phía máy chủ từ Supabase.
- JSON-LD chi tiết và breadcrumb được đưa trực tiếp vào HTML server; không phụ thuộc JavaScript hoặc `react-helmet-async`.
- `force-dynamic` được giữ cho nội dung cần cập nhật theo request. Khai báo `revalidate = 0` lặp đã được loại bỏ.
- Trang quản trị tiếp tục dùng `ssr: false` có chủ đích vì không cần lập chỉ mục và chứa editor phụ thuộc trình duyệt.
- Dự án không dùng pipeline `dist-ssr`; output production của Next.js nằm trong `.next/`.

## Triển khai Vercel

1. Khai báo toàn bộ biến trong mục Environment Variables của Vercel.
2. Chạy `npx supabase db push --dry-run`, kiểm tra danh sách rồi mới chạy `npx supabase db push`.
3. Chạy `npm run verify:production` và yêu cầu lệnh đạt sau khi áp dụng migration.
4. Chạy `npm run typecheck`, `npm run lint` và `npm run build`.
5. Deploy, sau đó kiểm tra trang chủ, chi tiết sản phẩm/dự án/tin tức, form tư vấn, đăng nhập admin và upload/xóa ảnh R2.

## Thông tin liên hệ chính thức

- Địa chỉ: Tòa nhà Greenia, Khu biệt thự Phú Mỹ Hưng, Quận 7, TP.HCM
- Email: sales.greeniahomes@gmail.com
- Hotline: 0932 966 700
