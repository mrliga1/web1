import React, { useEffect, useState } from 'react';
import { BellOff, BellRing, LoaderCircle } from 'lucide-react';
import {
  getPushSubscriptionStatus,
  subscribeToPush,
  unsubscribeFromPush,
} from '../lib/pushNotifications';

type WebPushControlProps = {
  onShowNotification: (message: string, type: 'success' | 'error') => void;
};

export default function WebPushControl({ onShowNotification }: WebPushControlProps) {
  const [configured, setConfigured] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getPushSubscriptionStatus()
      .then(status => {
        if (!active) return;
        setConfigured(status.configured);
        setSubscribed(status.subscribed);
      })
      .catch(() => {
        if (active) setConfigured(false);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const togglePush = async () => {
    try {
      setLoading(true);
      if (subscribed) {
        await unsubscribeFromPush();
        setSubscribed(false);
        onShowNotification('Đã tắt thông báo Web Push trên thiết bị này.', 'success');
      } else {
        await subscribeToPush();
        setSubscribed(true);
        onShowNotification('Đã bật thông báo Web Push trên thiết bị này.', 'success');
      }
    } catch (error) {
      onShowNotification(error instanceof Error ? error.message : 'Không thể thay đổi Web Push', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={togglePush}
      disabled={loading || !configured}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-700/25 bg-white px-3 text-[11px] font-bold text-emerald-900 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-55"
      title={configured ? (subscribed ? 'Tắt Web Push' : 'Bật Web Push') : 'Web Push chưa được cấu hình trên máy chủ'}
      aria-pressed={subscribed}
    >
      {loading ? (
        <LoaderCircle className="h-4 w-4 animate-spin" />
      ) : subscribed ? (
        <BellRing className="h-4 w-4" />
      ) : (
        <BellOff className="h-4 w-4" />
      )}
      <span className="hidden xl:inline">{subscribed ? 'Web Push đang bật' : 'Bật Web Push'}</span>
    </button>
  );
}
