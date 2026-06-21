import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Phone, Save, Shield, ShieldCheck } from 'lucide-react';

export default function UserProfileTab({ onShowNotification }: { onShowNotification: (m: string, t: 'success' | 'error') => void }) {
  const { userProfile, reloadProfile } = useAuth();
  
  const [username, setUsername] = useState(userProfile?.username || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [saving, setSaving] = useState(false);

  if (!userProfile) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', userProfile.uid), {
        username,
        phone
      });
      await reloadProfile();
      onShowNotification('Cập nhật hồ sơ thành công!', 'success');
    } catch {
      onShowNotification('Lỗi khi cập nhật hồ sơ', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Super Admin (Chủ Sở Hữu)';
      case 'editor': return 'Biên Tập Viên';
      case 'member': return 'Môi Giới / Đối Tác';
      case 'user': return 'Người Dùng Cơ Bản';
      default: return 'Chưa Xác Định';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-4xl">
      <div className="flex items-center justify-between bg-slate-900 p-6 rounded-lg border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Shield className="w-48 h-48" />
        </div>
        
        <div className="relative z-10 space-y-2">
          <h1 className="text-3xl font-display font-bold text-white tracking-tight flex items-center gap-3">
            Hồ Sơ Cá Nhân
          </h1>
          <p className="text-slate-400 font-light flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Cấp bậc hiện tại: <strong className="text-emerald-400">{getRoleName(userProfile.role)}</strong>
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Tài khoản Email (Cố định)</label>
                <input
                  type="email"
                  value={userProfile.email}
                  readOnly
                  className="w-full bg-slate-950/50 border border-slate-850 rounded-lg py-3 px-4 text-slate-500 text-sm outline-none cursor-not-allowed font-mono"
                />
                <p className="text-[10px] text-slate-500">Email dùng để đăng nhập và không thể thay đổi.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">UID Định Danh (Firebase)</label>
                <input
                  type="text"
                  value={userProfile.uid}
                  readOnly
                  className="w-full bg-slate-950/50 border border-slate-850 rounded-lg py-3 px-4 text-slate-600 text-xs outline-none cursor-not-allowed font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Tên hiển thị</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-3 pl-10 pr-4 text-white text-sm outline-none transition-colors"
                    placeholder="VD: Nguyen Van A"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Số điện thoại liên lạc</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-3 pl-10 pr-4 text-white text-sm outline-none transition-colors"
                    placeholder="VD: 0912..."
                  />
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-slate-850 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-6 rounded-lg transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>Đang lưu...</>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Lưu các thay đổi
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
