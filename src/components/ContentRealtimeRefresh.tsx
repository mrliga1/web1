'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { RealtimeChannel, RealtimeClient } from '@supabase/realtime-js';

const CONTENT_TABLES = ['products', 'projects', 'news', 'settings', 'layouts'] as const;

export default function ContentRealtimeRefresh() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return;

    let disposed = false;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (disposed) return;
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        if (disposed) return;
        router.refresh();
        window.dispatchEvent(new CustomEvent('greenia:content-updated'));
      }, 350);
    };

    let channel: RealtimeChannel | undefined;
    let client: RealtimeClient | undefined;
    // Đồng bộ nền sau khi trình duyệt hoàn tất dựng trang đầu tiên.
    const connect = async () => {
      try {
        const { RealtimeClient } = await import('@supabase/realtime-js');
        if (disposed) return;
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !apiKey) throw new Error('Thiếu cấu hình đồng bộ công khai');
        // Các bảng này đã công khai cho anon; không cần tải Auth hoặc phiên nhân viên.
        client = new RealtimeClient(url.replace(/\/$/, '') + '/realtime/v1', {
          params: { apikey: apiKey },
          accessToken: async () => apiKey.startsWith('eyJ') ? apiKey : null,
        });
        channel = client.channel('public-content:' + Math.random().toString(36).slice(2, 10));
        for (const table of CONTENT_TABLES) {
          channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, scheduleRefresh);
        }
        channel.subscribe((status, error) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') console.warn('Không thể đồng bộ nội dung:', error || status);
        });
      } catch (error) { if (!disposed) console.warn('Không thể khởi tạo đồng bộ nội dung:', error); }
    };
    const idle = window.requestIdleCallback?.(() => void connect(), { timeout: 1500 });
    const timer = idle === undefined ? setTimeout(() => void connect(), 500) : undefined;

    return () => {
      disposed = true;
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timer !== undefined) clearTimeout(timer);
      if (refreshTimer) clearTimeout(refreshTimer);
      if (client) {
        const activeClient = client;
        const cleanup = channel ? activeClient.removeChannel(channel) : Promise.resolve();
        void cleanup.finally(() => activeClient.disconnect()).catch(error => console.warn('Không thể đóng đồng bộ nội dung:', error));
      }
    };
  }, [pathname, router]);

  return null;
}
