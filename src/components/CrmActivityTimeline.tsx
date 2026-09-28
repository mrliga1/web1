import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';

interface Activity {
  id: number;
  author: string;
  created_at: string;
  changed_fields: Record<string, { before: unknown; after: unknown }>;
}
const labels: Record<string, string> = {
  status: 'Giai đoạn', assignee: 'Người phụ trách', priority: 'Ưu tiên',
  notes: 'Ghi chú', expectedValue: 'Giá trị dự kiến', nextFollowUpAt: 'Lịch liên hệ',
};
const values: Record<string, string> = {
  new: 'Khách mới', pending: 'Khách mới', contacted: 'Đã liên hệ', processed: 'Đã liên hệ',
  negotiating: 'Tiềm năng', won: 'Chốt thành công', lost: 'Thất bại', high: 'Cao', medium: 'Trung bình', low: 'Thấp',
};
const displayValue = (value: unknown) => value == null || value === '' ? 'Chưa có' : values[String(value)] || String(value);

export default function CrmActivityTimeline({ leadId, revision }: { leadId: string; revision: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    void Promise.resolve(supabase.from('consultation_activity').select('id,author,created_at,changed_fields')
      .eq('lead_id', leadId).order('id', { ascending: false }).limit(50))
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) {
          console.error('Không thể tải nhật ký khách hàng:', queryError);
          setError('Chưa tải được nhật ký thay đổi. Vui lòng thử lại sau.');
        } else setActivities((data || []) as Activity[]);
        setLoading(false);
      }).catch((queryError: unknown) => {
        if (!active) return;
        console.error('Không thể kết nối nhật ký khách hàng:', queryError);
        setError('Chưa tải được nhật ký thay đổi. Vui lòng thử lại sau.');
        setLoading(false);
      });
    return () => { active = false; };
  }, [leadId, revision]);
  return <section className="rounded-xl border border-slate-200 bg-white p-4" aria-label="Nhật ký thay đổi CRM">
    <h4 className="text-sm font-bold text-slate-900">Nhật ký thay đổi</h4>
    <p className="mt-1 text-xs text-slate-500">50 thay đổi gần nhất, được ghi bởi máy chủ từ khi nâng cấp CRM.</p>
    {loading ? <p role="status" className="mt-3 text-xs">Đang tải nhật ký…</p>
      : error ? <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>
      : activities.length === 0 ? <p className="mt-3 text-xs text-slate-500">Chưa có thay đổi được ghi nhận.</p>
      : <ol className="mt-4 max-h-72 space-y-3 overflow-auto">
        {activities.map((activity) => <li key={activity.id} className="border-l-2 border-primary/30 pl-3 text-xs">
          <p className="font-semibold">{activity.author} · {new Date(activity.created_at).toLocaleString('vi-VN')}</p>
          {Object.entries(activity.changed_fields).map(([field, change]) => <p key={field} className="mt-1 break-words text-slate-600">
            {labels[field] || field}: {displayValue(change.before)} → {displayValue(change.after)}
          </p>)}
        </li>)}
      </ol>}
  </section>;
}
