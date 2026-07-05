/**
 * Module realtime - Stub tương thích.
 * Supabase Realtime sẽ được tích hợp sau nếu cần.
 * Hiện tại export các hàm stub để code cũ không bị lỗi build.
 */

import { supabase } from './supabase';

export const dbRealtime = {};

export const docRealtime = (dbInstance: any, path: string, id?: string) => {
  if (id) return { path, id };
  const parts = path.split('/');
  return { path: parts.slice(0, -1).join('/'), id: parts[parts.length - 1] };
};

export const collectionRealtime = (dbInstance: any, path: string) => {
  return { path };
};

/* Stub onSnapshot - Trong tương lai sẽ dùng Supabase Realtime subscriptions */
export const onSnapshot = (ref: any, callback: (snapshot: any) => void) => {
  // Trả về hàm unsubscribe rỗng
  return () => {};
};
