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

function configureWebPush() {
  const publicKey = getWebPushPublicKey();
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY?.trim() || '';
  const subject = process.env.WEB_PUSH_SUBJECT?.trim() || 'mailto:sales.greeniahomes@gmail.com';
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
  let query = supabase.from('push_subscriptions').select('id, endpoint, p256dh, auth');
  if (filters.email) query = query.eq('user_email', filters.email.toLowerCase());
  if (filters.roles?.length) query = query.in('user_role', filters.roles);

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
        await webPush.sendNotification(pushSubscription, JSON.stringify(payload), { TTL: 300 });
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
    await supabase.from('push_subscriptions').delete().in('id', staleIds);
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
