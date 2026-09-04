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
  let documentSnapshot: LegacyDocSnapshot | null = null;
  let initialSnapshotReady = false;
  let stopped = false;
  let loadingSnapshot = false;
  let reloadRequested = false;
  const pendingPayloads: RealtimePayload[] = [];

  const applyPayload = (payload: RealtimePayload, emit = true) => {
    if (stopped) return;
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
      if (emit) callback(collectionSnapshot);
      return;
    }

    const changedRow = payload.eventType === 'DELETE' ? payload.old : payload.new;
    if (String(changedRow?.id || '') !== ref.id) return;
    if (payload.eventType === 'DELETE') {
      documentSnapshot = {
        id: ref.id,
        data: () => undefined,
        exists: () => false,
      };
    } else {
      documentSnapshot = createDocSnapshot(ref.path, payload.new);
    }
    if (emit) callback(documentSnapshot);
  };

  const loadInitialSnapshot = async () => {
    if (stopped) return;
    if (loadingSnapshot) {
      reloadRequested = true;
      return;
    }
    loadingSnapshot = true;
    initialSnapshotReady = false;
    try {
      if ('isCollection' in ref) {
        collectionSnapshot = await getDocs(ref);
      } else {
        documentSnapshot = await getDoc(ref);
      }
      if (stopped) return;
      for (const payload of pendingPayloads.splice(0)) applyPayload(payload, false);
      initialSnapshotReady = true;
      callback('isCollection' in ref ? collectionSnapshot : documentSnapshot);
    } catch (error) {
      if (!stopped) {
        console.error('Không thể tải dữ liệu ban đầu cho Realtime:', error);
        onError?.(error);
      }
    } finally {
      loadingSnapshot = false;
      if (reloadRequested && !stopped) {
        reloadRequested = false;
        void loadInitialSnapshot();
      }
    }
  };

  // Đọc lại sau khi kết nối để bù các thay đổi trong lúc ngoại tuyến hoặc khởi tạo.
  const channelId = Math.random().toString(36).substring(2, 10);
  const channel = supabase.channel(`public:${ref.path}:${channelId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: ref.path }, (rawPayload) => {
      if (stopped) return;
      const payload = rawPayload as RealtimePayload;
      const changedRow = payload.eventType === 'DELETE' ? payload.old : payload.new;
      if ('isDoc' in ref && String(changedRow?.id || '') !== ref.id) return;
      if (!initialSnapshotReady) pendingPayloads.push(payload);
      else applyPayload(payload);
    })
    .subscribe((status, error) => {
      if (stopped) return;
      if (status === 'SUBSCRIBED') void loadInitialSnapshot();
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        const realtimeError = error || new Error(`Supabase Realtime: ${status}`);
        console.error('Lỗi kết nối dữ liệu thời gian thực:', realtimeError);
        onError?.(realtimeError);
      }
    });

  const refreshVisibleSnapshot = () => {
    if (typeof document === 'undefined' || document.visibilityState !== 'hidden') {
      void loadInitialSnapshot();
    }
  };
  if (typeof window !== 'undefined') window.addEventListener('focus', refreshVisibleSnapshot);
  // RLS không luôn phát thay đổi cho người vừa mất quyền xem khách; đối soát khi CRM đang mở.
  const crmRefreshTimer = ref.path === 'consultations' && typeof window !== 'undefined'
    ? window.setInterval(refreshVisibleSnapshot, 30000)
    : null;
  void loadInitialSnapshot();

  return () => {
    stopped = true;
    pendingPayloads.length = 0;
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', refreshVisibleSnapshot);
      if (crmRefreshTimer !== null) window.clearInterval(crmRefreshTimer);
    }
    void supabase.removeChannel(channel);
  };
};
