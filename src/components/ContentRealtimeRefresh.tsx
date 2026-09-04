'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../supabase';

const CONTENT_TABLES = ['products', 'projects', 'news', 'settings', 'layouts'] as const;

export default function ContentRealtimeRefresh() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return;

    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        router.refresh();
        window.dispatchEvent(new CustomEvent('greenia:content-updated'));
      }, 350);
    };

    let channel = supabase.channel(`public-content:${Math.random().toString(36).slice(2, 10)}`);
    for (const table of CONTENT_TABLES) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        scheduleRefresh,
      );
    }
    channel.subscribe((status, error) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('Không thể đồng bộ nội dung thời gian thực:', error || status);
      }
    });

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      void supabase.removeChannel(channel);
    };
  }, [pathname, router]);

  return null;
}
