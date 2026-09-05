import { useEffect } from 'react';
import { setManualIpTrackingPolicy } from '../lib/tracking';

export function useManualIpTrackingPolicy(pathname: string) {
  useEffect(() => {
    let disposed = false;
    let controller: AbortController | null = null;
    let interval: ReturnType<typeof setInterval> | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    setManualIpTrackingPolicy('pending');

    const refresh = async () => {
      if (disposed || document.hidden || controller) return;
      controller = new AbortController();
      timeout = setTimeout(() => controller?.abort(), 8000);
      try {
        const response = await fetch('/api/tracking-policy', { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Chưa xác minh được IP');
        const data = await response.json() as { blocked?: unknown };
        if (typeof data.blocked !== 'boolean') throw new Error('Phản hồi kiểm tra IP không hợp lệ');
        if (!disposed) setManualIpTrackingPolicy(data.blocked ? 'blocked' : 'allowed');
      } catch {
        // Tạm giữ tracking khi chưa xác minh được, không gán nhãn spam cho khách.
        if (!disposed) setManualIpTrackingPolicy('pending');
      } finally {
        clearTimeout(timeout);
        controller = null;
      }
    };

    const onVisibility = () => {
      clearInterval(interval);
      if (!document.hidden) {
        void refresh();
        interval = setInterval(() => void refresh(), 30000);
      }
    };
    onVisibility();
    window.addEventListener('focus', onVisibility);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      disposed = true;
      controller?.abort();
      clearTimeout(timeout);
      clearInterval(interval);
      window.removeEventListener('focus', onVisibility);
      document.removeEventListener('visibilitychange', onVisibility);
      setManualIpTrackingPolicy('pending');
    };
  }, [pathname]);
}
