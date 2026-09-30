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

    // Trang có snapshot máy chủ; kết nối nền sau tải trang để ưu tiên lần hiển thị đầu.
    let pageLoaded = document.readyState === 'complete';
    let interactionRequested = false;
    let connectionScheduled = false;
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
    const interactionEvents = ['pointerdown', 'keydown', 'scroll'] as const;
    const removeInteractionListeners = () => {
      for (const event of interactionEvents) window.removeEventListener(event, scheduleConnection);
    };
    function scheduleConnection() {
      if (disposed || connectionScheduled) return;
      interactionRequested = true;
      if (!pageLoaded) return;
      connectionScheduled = true;
      removeInteractionListeners();
      if (fallbackTimer !== undefined) clearTimeout(fallbackTimer);
      idle = window.requestIdleCallback?.(() => void connect(), { timeout: 5000 });
      if (idle === undefined) timer = setTimeout(() => void connect(), 0);
    }
    const onPageLoad = () => {
      if (disposed) return;
      pageLoaded = true;
      if (interactionRequested) scheduleConnection();
      // Khách chỉ đọc vẫn được đồng bộ sau 5 giây, không cần thao tác bắt buộc.
      else fallbackTimer = setTimeout(scheduleConnection, 5000);
    };
    for (const event of interactionEvents) window.addEventListener(event, scheduleConnection, { once: true, passive: true });
    if (pageLoaded) onPageLoad();
    else window.addEventListener('load', onPageLoad, { once: true });

    return () => {
      disposed = true;
      window.removeEventListener('load', onPageLoad);
      removeInteractionListeners();
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timer !== undefined) clearTimeout(timer);
      if (fallbackTimer !== undefined) clearTimeout(fallbackTimer);
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
