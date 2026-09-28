import React, { useEffect, useState } from 'react';
import { updateDoc, doc, db } from '../firebase';

function toLocalInput(value?: string | null) {
  if (!value || !Number.isFinite(Date.parse(value))) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function CrmFollowUpPanel({ leadId, value, onSaved, onShowNotification }: {
  leadId: string;
  value?: string | null;
  onSaved: (value: string | null) => void;
  onShowNotification: (message: string, type: 'success' | 'error') => void;
}) {
  const [input, setInput] = useState(toLocalInput(value));
  const [saving, setSaving] = useState(false);
  useEffect(() => setInput(toLocalInput(value)), [leadId, value]);
  const save = async (nextValue: string | null) => {
    if (saving) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'consultations', leadId), { nextFollowUpAt: nextValue });
      onSaved(nextValue);
      onShowNotification(nextValue ? 'Đã lưu lịch liên hệ tiếp theo' : 'Đã hoàn tất lịch liên hệ', 'success');
    } catch (error) {
      console.error('Không thể lưu lịch liên hệ:', error);
      onShowNotification('Không thể lưu lịch liên hệ. Vui lòng thử lại.', 'error');
    } finally { setSaving(false); }
  };
  const overdue = value && Date.parse(value) < Date.now();
  return <section className="rounded-xl border border-slate-200 bg-white p-4">
    <h4 className="text-sm font-bold text-slate-900">Lần liên hệ tiếp theo</h4>
    {value && <p className={`mt-2 text-xs ${overdue ? 'text-red-700' : 'text-slate-600'}`}>
      {overdue ? 'Đã đến hạn: ' : 'Đã hẹn: '}{new Date(value).toLocaleString('vi-VN')}
    </p>}
    <form className="mt-3 flex flex-wrap items-end gap-3" onSubmit={(event) => {
      event.preventDefault();
      if (!input || !Number.isFinite(Date.parse(input))) {
        onShowNotification('Vui lòng chọn ngày giờ hợp lệ.', 'error');
        return;
      }
      void save(new Date(input).toISOString());
    }}>
      <label className="text-xs font-semibold">Ngày giờ theo thiết bị
        <input type="datetime-local" value={input} onChange={(event) => setInput(event.target.value)} required
          className="mt-1 block rounded-lg border border-slate-300 p-2 text-sm" />
      </label>
      <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Đang lưu…' : 'Lưu lịch'}</button>
      {value && <button type="button" disabled={saving} onClick={() => void save(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-50">Đã liên hệ</button>}
    </form>
  </section>;
}
