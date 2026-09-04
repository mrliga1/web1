import 'server-only';

import webPush, { type PushSubscription } from 'web-push';
import { createServiceRoleClient } from './serverSupabase';

export type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
  icon?: string;
  badge?: string;
};

type StoredSubscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export function getWebPushPublicKey() {
  return process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY?.trim() || '';
}

export function isWebPushConfigured() {
  try {
    configureWebPush();
    return true;
  } catch {
    return false;
  }
}

function configureWebPush() {
  const publicKey = getWebPushPublicKey();
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY?.trim() || '';
  const subject = process.env.WEB_PUSH_SUBJECT?.trim() || 'mailto:thuankdbds@gmail.com';
  if (!publicKey || !privateKey) {
    throw new Error('Web Push chưa được cấu hình khóa VAPID');
  }
  webPush.setVapidDetails(subject, publicKey, privateKey);
}

export async function sendPushNotifications(
  payload: PushPayload,
  filters: { roles?: string[]; email?: string },
) {
  configureWebPush();
  const supabase = createServiceRoleClient();
  // Dùng quyền hiện tại, không dùng vai trò cũ lưu lúc đăng ký thiết bị.
  let usersQuery = supabase.from('users').select('uid, email, role').in('role', ['admin', 'editor', 'member']);
  if (filters.email) usersQuery = usersQuery.eq('email', filters.email.toLowerCase());
  if (filters.roles?.length) usersQuery = usersQuery.in('role', filters.roles);
  if (!filters.email && !filters.roles?.length) return { sent: 0, stale: 0 };
  const { data: recipients, error: recipientsError } = await usersQuery;
  if (recipientsError) throw recipientsError;
  const recipientUids = (recipients || []).map((recipient) => String(recipient.uid));
  if (!recipientUids.length) return { sent: 0, stale: 0 };
  let query = supabase.from('push_subscriptions').select('id, endpoint, p256dh, auth');
  query = query.in('user_uid', recipientUids);

  const { data, error } = await query;
  if (error) throw error;

  let sent = 0;
  const staleIds: string[] = [];
  await Promise.all(
    ((data || []) as StoredSubscription[]).map(async subscription => {
      const pushSubscription: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      };
      try {
        await webPush.sendNotification(pushSubscription, JSON.stringify(payload), { TTL: 300, timeout: 15000 });
        sent += 1;
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          staleIds.push(subscription.id);
          return;
        }
        console.error('Không thể gửi Web Push:', error);
      }
    }),
  );

  if (staleIds.length) {
    const { error: cleanupError } = await supabase.from('push_subscriptions').delete().in('id', staleIds);
    if (cleanupError) console.error('Không thể dọn đăng ký Web Push hết hạn:', cleanupError.message);
  }
  return { sent, stale: staleIds.length };
}

export async function reservePushEvent(eventKey: string) {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from('push_events').insert({ event_key: eventKey });
  if (!error) return true;
  if (error.code === '23505') return false;
  throw error;
}

export async function releasePushEvent(eventKey: string) {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from('push_events').delete().eq('event_key', eventKey);
  if (error) throw error;
}
