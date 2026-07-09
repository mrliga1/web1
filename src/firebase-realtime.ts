/**
 * Module realtime - Stub tương thích.
 * Supabase Realtime sẽ được tích hợp sau nếu cần.
 * Hiện tại export các hàm stub để code cũ không bị lỗi build.
 */

import { supabase } from './supabase';
import { getDocs, getDoc } from './firebase';

export const dbRealtime = {};

export const docRealtime = (dbInstance: any, path: string, id?: string) => {
  if (id) return { path, id, isDoc: true };
  const parts = path.split('/');
  return { path: parts.slice(0, -1).join('/'), id: parts[parts.length - 1], isDoc: true };
};

export const collectionRealtime = (dbInstance: any, path: string) => {
  return { path, isCollection: true };
};

/* Cập nhật onSnapshot - Lấy dữ liệu lần đầu và lắng nghe realtime qua Supabase */
export const onSnapshot = (ref: any, callback: (snapshot: any) => void, onError?: (error: any) => void) => {
  // 1. Fetch initial data immediately
  if (ref.isCollection) {
    getDocs(ref).then(snapshot => {
      callback(snapshot);
    }).catch(err => console.error("onSnapshot collection fetch error:", err));
  } else {
    getDoc(ref).then(snapshot => {
      callback(snapshot);
    }).catch(err => console.error("onSnapshot doc fetch error:", err));
  }

  // 2. Subscribe to Supabase Realtime changes
  // Note: RLS policies and Realtime config in Supabase Dashboard must be enabled for this to trigger.
  const channelId = Math.random().toString(36).substring(2, 10);
  const channel = supabase.channel(`public:${ref.path}:${channelId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: ref.path }, payload => {
      // Re-fetch everything on change for simplicity
      if (ref.isCollection) {
        getDocs(ref).then(snapshot => callback(snapshot));
      } else {
        getDoc(ref).then(snapshot => callback(snapshot));
      }
    })
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
};
