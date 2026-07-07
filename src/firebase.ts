import { supabase } from './supabase';

export const db = {};

export const collection = (dbInstance: any, path: string) => {
  return { path };
}

export const doc = (dbInstance: any, path: string, id?: string) => {
  if (id) return { path, id };
  const parts = path.split('/');
  return { path: parts.slice(0, -1).join('/'), id: parts[parts.length - 1] };
}

export const getDocs = async (collectionRef: { path: string }) => {
  const { data, error } = await supabase.from(collectionRef.path).select('*');
  if (error) throw error;
  const docs = (data || []).map((row: any) => ({
    id: row.id,
    data: () => collectionRef.path === 'users' ? row : row.data,
    exists: () => true
  }));
  return {
    docs,
    empty: docs.length === 0,
    size: docs.length,
    forEach: (callback: any) => docs.forEach(callback)
  };
}

export const getDoc = async (docRef: { path: string, id: string }) => {
  const { data, error } = await supabase.from(docRef.path).select('*').eq('id', docRef.id).single();
  if (error && error.code === 'PGRST116') {
    return {
      id: docRef.id,
      exists: () => false,
      data: () => undefined
    };
  }
  if (error) throw error;
  return {
    id: data.id,
    exists: () => true,
    data: () => docRef.path === 'users' ? data : data.data
  };
}

export const addDoc = async (collectionRef: { path: string }, data: any) => {
  const payload = collectionRef.path === 'users' ? data : { data };
  const { data: result, error } = await supabase.from(collectionRef.path).insert(payload).select().single();
  if (error) throw error;
  return { id: result.id };
}

export const setDoc = async (docRef: { path: string, id: string }, data: any, options?: { merge?: boolean }) => {
  if (options?.merge) {
    const existing = await getDoc(docRef);
    if (existing.exists()) {
      data = { ...existing.data(), ...data };
    }
  }
  const payload = docRef.path === 'users' ? { id: docRef.id, ...data } : { id: docRef.id, data };
  const { error } = await supabase.from(docRef.path).upsert(payload);
  if (error) throw error;
}

export const updateDoc = async (docRef: { path: string, id: string }, data: any) => {
  const existing = await getDoc(docRef);
  if (!existing.exists()) throw new Error("Document not found");
  const merged = { ...existing.data(), ...data };
  const payload = docRef.path === 'users' ? merged : { data: merged };
  const { error } = await supabase.from(docRef.path).update(payload).eq('id', docRef.id);
  if (error) throw error;
}

export const deleteDoc = async (docRef: { path: string, id: string }) => {
  const { error } = await supabase.from(docRef.path).delete().eq('id', docRef.id);
  if (error) throw error;
}

export const increment = (value: number) => value;

export const dbLite = db;

/* Stub auth object - tương thích API cũ */
export const auth = {
  currentUser: null as any,
  onAuthStateChanged: (_callback: any) => () => {},
};

/* Stub app object */
export const app = {};

/* Stub onAuthStateChanged */
export const onAuthStateChanged = (_auth: any, callback: (user: any) => void) => {
  // Trả về hàm unsubscribe
  return () => {};
};

/* Stub getFirestore */
export const getFirestoreRealtime = (_app: any, _dbId?: string) => ({});
export const getFirestore = getFirestoreRealtime;

/* === Firebase Auth Compatibility Layer (sử dụng Supabase Auth) === */

/* Đăng ký bằng email/password */
export const createUserWithEmailAndPassword = async (_auth: any, email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    const err: any = new Error(error.message);
    if (error.message.includes('already registered')) err.code = 'auth/email-already-in-use';
    throw err;
  }
  return {
    user: {
      uid: data.user?.id,
      email: data.user?.email,
      displayName: data.user?.user_metadata?.full_name || null,
      providerData: [],
    }
  };
};

/* Đăng nhập bằng email/password */
export const signInWithEmailAndPassword = async (_auth: any, email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const err: any = new Error(error.message);
    if (error.message.includes('Invalid login')) err.code = 'auth/wrong-password';
    throw err;
  }
  return {
    user: {
      uid: data.user?.id,
      email: data.user?.email,
      displayName: data.user?.user_metadata?.full_name || null,
      providerData: [],
    }
  };
};

/* Gửi email reset mật khẩu */
export const sendPasswordResetEmail = async (_auth: any, email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw new Error(error.message);
};

/* Đăng nhập bằng Google (Supabase OAuth) */
export const signInWithPopup = async (_auth: any, _provider: any) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });
  if (error) throw new Error(error.message);
  return { user: null }; // User sẽ được lấy từ session sau redirect
};

/* GoogleAuthProvider stub */
export class GoogleAuthProvider {
  static PROVIDER_ID = 'google.com';
}

/* Kiểm tra email đã đăng ký chưa - stub */
export const fetchSignInMethodsForEmail = async (_auth: any, _email: string) => {
  return []; // Supabase không hỗ trợ API này trực tiếp
};
