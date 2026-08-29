/**
 * Module realtime tương thích API cũ.
 * Luồng dữ liệu thật vẫn đi qua Supabase, không kết nối Firebase.
 */

import { supabase } from './supabase';
import {
  getDocs,
  getDoc,
  type LegacyCollectionRef,
  type LegacyDocRef,
  type LegacyDocSnapshot,
  type LegacyQuerySnapshot,
} from './firebase';

export const dbRealtime = {};

interface RealtimeCollectionRef extends LegacyCollectionRef {
  isCollection: true;
}

interface RealtimeDocRef extends LegacyDocRef {
  isDoc: true;
}

type RealtimeRef = RealtimeCollectionRef | RealtimeDocRef;
type RealtimeRow = Record<string, unknown> & { id?: string; data?: unknown };

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: RealtimeRow;
  old: RealtimeRow;
}

const createDocSnapshot = (path: string, row: RealtimeRow): LegacyDocSnapshot => ({
  id: String(row.id || ''),
  data: () => path === 'users' ? row : row.data,
  exists: () => Boolean(row.id),
});

const createQuerySnapshot = (docs: LegacyDocSnapshot[]): LegacyQuerySnapshot => ({
  docs,
  empty: docs.length === 0,
  size: docs.length,
  forEach: (iterator) => docs.forEach(iterator),
});

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
  let collectionSnapshot: LegacyQuerySnapshot | null = null;

  if ('isCollection' in ref) {
    getDocs(ref).then(snapshot => {
      collectionSnapshot = snapshot;
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
    .on('postgres_changes', { event: '*', schema: 'public', table: ref.path }, (rawPayload) => {
      const payload = rawPayload as RealtimePayload;

      if ('isCollection' in ref) {
        const docs = [...(collectionSnapshot?.docs || [])];
        const changedRow = payload.eventType === 'DELETE' ? payload.old : payload.new;
        const changedId = String(changedRow?.id || '');
        const existingIndex = docs.findIndex((item) => item.id === changedId);

        if (payload.eventType === 'DELETE') {
          if (existingIndex >= 0) docs.splice(existingIndex, 1);
        } else if (changedId) {
          const nextSnapshot = createDocSnapshot(ref.path, changedRow);
          if (existingIndex >= 0) docs[existingIndex] = nextSnapshot;
          else docs.push(nextSnapshot);
        }

        collectionSnapshot = createQuerySnapshot(docs);
        callback(collectionSnapshot);
      } else {
        if (payload.eventType === 'DELETE') {
          callback({
            id: ref.id,
            data: () => undefined,
            exists: () => false,
          } satisfies LegacyDocSnapshot);
        } else {
          callback(createDocSnapshot(ref.path, payload.new));
        }
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
