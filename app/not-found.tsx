import Link from 'next/link';

export default function NotFoundPage() {
  return <section className="mx-auto max-w-xl px-6 py-20 text-center">
    <p className="text-sm font-semibold text-primary">404</p>
    <h1 className="mt-3 font-display text-3xl font-bold text-primary">Không tìm thấy trang</h1>
    <p className="mt-4 text-text-secondary">Nội dung này không tồn tại hoặc đã được chuyển sang địa chỉ khác.</p>
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      <Link href="/san-pham" className="rounded-lg bg-primary px-5 py-3 font-semibold text-white">Xem bất động sản</Link>
      <Link href="/" className="rounded-lg border border-primary/25 px-5 py-3 font-semibold text-primary">Về trang chủ</Link>
    </div>
  </section>;
}
