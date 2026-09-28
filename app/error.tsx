'use client';

import { useEffect } from 'react';

export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('Không thể tải trang:', error); }, [error]);
  return <section className="mx-auto max-w-xl px-6 py-20 text-center">
    <h1 className="font-display text-3xl font-bold text-primary">Chưa tải được thông tin</h1>
    <p className="mt-4 text-text-secondary">Kết nối dữ liệu đang gặp gián đoạn. Bạn có thể thử lại hoặc liên hệ Greenia Homes để được hỗ trợ.</p>
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      <button type="button" onClick={reset} className="rounded-lg bg-primary px-5 py-3 font-semibold text-white">Thử tải lại</button>
      <a href="tel:0932966700" className="rounded-lg border border-primary/25 px-5 py-3 font-semibold text-primary">Gọi 0932 966 700</a>
    </div>
  </section>;
}
