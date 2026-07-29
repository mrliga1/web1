/**
 * Module realtime tương thích API cũ.
 * Luồng dữ liệu thật vẫn đi qua Supabase, không kết nối Firebase.
 */

import { supabase } from './supabase';
import { getDocs, getDoc, type LegacyCollectionRef, type LegacyDocRef } from './firebase';

export const dbRealtime = {};

interface RealtimeCollectionRef extends LegacyCollectionRef {
  isCollection: true;
}

interface RealtimeDocRef extends LegacyDocRef {
  isDoc: true;
}

type RealtimeRef = RealtimeCollectionRef | RealtimeDocRef;

export const docRealtime = (_dbInstance: unknown, path: string, id?: string): RealtimeDocRef => {
  void _dbInstance;
  if (id) return { path, id, isDoc: true };
  const parts = path.split('/');
  return { path: parts.slice(0, -1).join('/'), id: parts[parts.length - 1], isDoc: true };
};

export const collectionRealtime = (_dbInstance: unknown, path: string): RealtimeCollectionRef => {
  void _dbInstance;
  return { path, isCollection: true };
};

/* Lấy dữ liệu ban đầu và lắng nghe thay đổi qua Supabase Realtime. */
export const onSnapshot = (
  ref: RealtimeRef,
  callback: (snapshot: unknown) => void,
  onError?: (error: unknown) => void,
) => {
  if ('isCollection' in ref) {
    getDocs(ref).then(snapshot => {
      callback(snapshot);
    }).catch(err => {
      console.error("onSnapshot collection fetch error:", err);
      onError?.(err);
    });
  } else {
    getDoc(ref).then(snapshot => {
      callback(snapshot);
    }).catch(err => {
      console.error("onSnapshot doc fetch error:", err);
      onError?.(err);
    });
  }

  // Realtime cần bật bảng và policy phù hợp trong Supabase Dashboard.
  const channelId = Math.random().toString(36).substring(2, 10);
  const channel = supabase.channel(`public:${ref.path}:${channelId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: ref.path }, () => {
      if ('isCollection' in ref) {
        getDocs(ref).then(snapshot => callback(snapshot));
      } else {
        getDoc(ref).then(snapshot => callback(snapshot));
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
