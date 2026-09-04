import { authFetch } from './authFetch';

type SubscriptionStatus = {
  configured: boolean;
  subscribed: boolean;
  publicKey?: string;
};

function urlBase64ToUint8Array(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(character => character.charCodeAt(0)));
}

async function getRegistration() {
  if (!('serviceWorker' in navigator)) throw new Error('Trình duyệt không hỗ trợ Service Worker');
  return new Promise<ServiceWorkerRegistration>((resolve, reject) => {
    const timeoutId = window.setTimeout(
      () => reject(new Error('Service Worker chưa sẵn sàng')),
      8000,
    );
    navigator.serviceWorker.ready.then((registration) => {
      window.clearTimeout(timeoutId);
      resolve(registration);
    }).catch((error) => {
      window.clearTimeout(timeoutId);
      reject(error);
    });
  });
}

export async function getPushSubscriptionStatus(): Promise<SubscriptionStatus> {
  if (typeof window === 'undefined') {
    return { configured: false, subscribed: false };
  }

  const configurationResponse = await authFetch('/api/push/subscription', { cache: 'no-store' });
  const configuration = await configurationResponse.json() as SubscriptionStatus & { error?: string };
  if (!configurationResponse.ok) {
    throw new Error(configuration.error || 'Không thể kiểm tra cấu hình Web Push');
  }
  if (!configuration.configured || !('Notification' in window) || !('PushManager' in window)) {
    return { ...configuration, subscribed: false };
  }

  const registration = await getRegistration();
  const currentSubscription = await registration.pushManager.getSubscription();
  if (!currentSubscription) return { ...configuration, subscribed: false };

  const endpointQuery = currentSubscription
    ? `?endpoint=${encodeURIComponent(currentSubscription.endpoint)}`
    : '';
  const response = await authFetch(`/api/push/subscription${endpointQuery}`, { cache: 'no-store' });
  const result = await response.json() as SubscriptionStatus & { error?: string };
  if (!response.ok) throw new Error(result.error || 'Không thể kiểm tra Web Push');
  return { ...result, subscribed: Boolean(currentSubscription && result.subscribed) };
}

export async function subscribeToPush() {
  if (!('Notification' in window) || !('PushManager' in window)) {
    throw new Error('Trình duyệt này chưa hỗ trợ Web Push');
  }
  const status = await getPushSubscriptionStatus();
  if (!status.configured || !status.publicKey) throw new Error('Máy chủ chưa cấu hình khóa Web Push');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Bạn chưa cho phép trình duyệt gửi thông báo');

  const registration = await getRegistration();
  const existing = await registration.pushManager.getSubscription();
  const subscription = existing || await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(status.publicKey),
  });

  const response = await authFetch('/api/push/subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription.toJSON()),
  });
  const result = await response.json() as { error?: string };
  if (!response.ok) throw new Error(result.error || 'Không thể bật Web Push');
  return true;
}

export async function unsubscribeFromPush() {
  const registration = await getRegistration();
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) await subscription.unsubscribe();
  const response = await authFetch('/api/push/subscription', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: subscription?.endpoint || '' }),
  });
  if (!response.ok) throw new Error('Không thể tắt Web Push');
}

export function notifyNewConsultation(consultationId: string) {
  void fetch('/api/push/notify-lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ consultationId }),
    keepalive: true,
  }).catch(error => console.error('Không thể gửi thông báo khách hàng mới:', error));
}
