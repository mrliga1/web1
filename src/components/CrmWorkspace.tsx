import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { appendConsultationCareHistory, db, doc, updateDoc } from '../firebase';
import { authFetch } from '../lib/authFetch';
import { getAssignedEmail } from '../lib/crmAccess';
import { createCrmCsv } from '../lib/crmCsv';
import type { Consultation } from '../types';
import CrmActivityTimeline from './CrmActivityTimeline';
import CrmFollowUpPanel from './CrmFollowUpPanel';

const stages = { new: 'Khách mới', contacted: 'Đã liên hệ', negotiating: 'Tiềm năng', won: 'Chốt thành công', lost: 'Thất bại' };
const normalizeStage = (status: Consultation['status']) => status === 'pending' ? 'new' : status === 'processed' ? 'contacted' : status;
interface Staff { email?: string; role?: string; employeeName?: string; displayName?: string; username?: string }
interface PageData { rows: { id: string; data: Omit<Consultation, 'id'> }[]; total: number; stats: Record<string, number> }
const emptyPage: PageData = { rows: [], total: 0, stats: {} };
const fieldClass = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900';
const buttonClass = 'rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-50';
const dateLabel = (value?: string) => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('vi-VN') : 'Chưa có';

export default function CrmWorkspace({ role, users, onShowNotification, onBlockIp, onNewCount }: {
  role: string; users: Staff[];
  onShowNotification: (message: string, type: 'success' | 'error') => void;
  onBlockIp: (ip: string) => void;
  onNewCount: (count: number) => void;
}) {
  const canAssign = role === 'admin' || role === 'editor';
  const staff = users.filter((user) => user.email && ['admin', 'editor', 'member'].includes(user.role || ''));
  const staffName = (email?: string) => {
    const user = staff.find((item) => item.email === email);
    return user?.employeeName || user?.displayName || user?.username || email || 'Chưa giao';
  };
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [assignee, setAssignee] = useState('');
  const [due, setDue] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PageData>(emptyPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [lead, setLead] = useState<Consultation | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkAssignee, setBulkAssignee] = useState('');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [careNote, setCareNote] = useState('');
  const [detailError, setDetailError] = useState('');

  const queryPage = useCallback(async (requestedPage: number, pageSize = 25): Promise<PageData> => {
    const { data: result, error: queryError } = await supabase.rpc('query_consultations', {
      p_search: search, p_status: status, p_assignee: assignee, p_due: due,
      p_page: requestedPage, p_page_size: pageSize,
    });
    if (queryError) throw queryError;
    if (!result || !Array.isArray(result.rows) || !Number.isFinite(result.total) || !result.stats) {
      throw new Error('Máy chủ trả dữ liệu CRM không hợp lệ');
    }
    return result as PageData;
  }, [search, status, assignee, due]);

  useEffect(() => {
    const timer = window.setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);
  useEffect(() => { setPage(1); setSelected([]); }, [search, status, assignee, due]);
  useEffect(() => { setSelected([]); }, [page]);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    void queryPage(page).then((result) => {
      if (!active) return;
      const lastPage = Math.max(1, Math.ceil(result.total / 25));
      if (page > lastPage) { setPage(lastPage); return; }
      setData(result); onNewCount(result.stats.new || 0);
    }).catch((queryError: unknown) => {
      if (!active) return;
      console.error('Không thể tải trang khách hàng:', queryError);
      setError('Không thể tải CRM. Vui lòng kiểm tra kết nối và migration cơ sở dữ liệu.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, queryPage, revision, onNewCount]);

  const loadLead = useCallback(async (id: string) => {
    const { data: row, error: queryError } = await supabase.from('consultations').select('id,data').eq('id', id).maybeSingle();
    if (queryError) throw queryError;
    if (!row) throw new Error('Khách hàng không tồn tại hoặc bạn không có quyền xem');
    return { ...row.data, id: row.id } as Consultation;
  }, []);
  const leadId = lead?.id;
  useEffect(() => {
    if (!leadId) return;
    let active = true;
    void loadLead(leadId).then((result) => { if (active) { setLead(result); setDetailError(''); } })
      .catch((queryError: unknown) => { if (active) { console.error(queryError); setDetailError('Không thể tải lại hồ sơ. Hồ sơ có thể đã được phân công cho nhân viên khác.'); } });
    return () => { active = false; };
  }, [leadId, revision, loadLead]);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('lead');
    if (id) void loadLead(id).then(setLead).catch(() => onShowNotification('Không tìm thấy khách hàng hoặc không có quyền xem.', 'error'));
  }, [loadLead, onShowNotification]);
  useEffect(() => {
    let timer: number | undefined;
    const channel = supabase.channel('crm-paged-workspace').on('postgres_changes', { event: '*', schema: 'public', table: 'consultations' }, () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setRevision((current) => current + 1), 300);
    }).subscribe((state) => { if (state === 'SUBSCRIBED') setRevision((current) => current + 1); });
    return () => { window.clearTimeout(timer); void supabase.removeChannel(channel); };
  }, []);

  const openLead = (next: Consultation | null) => {
    setLead(next); setCareNote(''); setDetailError('');
    const url = new URL(window.location.href);
    if (next) url.searchParams.set('lead', next.id); else url.searchParams.delete('lead');
    window.history.replaceState(null, '', url);
  };
  const refresh = () => setRevision((current) => current + 1);
  const notifyAssignment = async (id: string, value: string) => {
    const email = getAssignedEmail(value);
    if (!email) return true;
    let delivered = true;
    for (const endpoint of ['/api/send-email', '/api/push/notify-assignment']) {
      try {
        const response = await authFetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId: id, email }) });
        if (!response.ok) { delivered = false; console.warn('Thông báo phân công chưa gửi:', endpoint, response.status); }
      } catch (notifyError) { delivered = false; console.warn('Lỗi thông báo phân công:', notifyError); }
    }
    return delivered;
  };
  const patchLead = async (patch: Record<string, unknown>) => {
    if (!lead || saving) return;
    const id = lead.id;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'consultations', id), patch);
      setLead((current) => current?.id === id ? { ...current, ...patch } : current);
      refresh();
      const delivered = typeof patch.assignee !== 'string' || await notifyAssignment(id, patch.assignee);
      onShowNotification(delivered ? 'Đã lưu thay đổi khách hàng' : 'Đã lưu phân công; một số thông báo chưa gửi. Vui lòng thử gửi lại.', delivered ? 'success' : 'error');
      if (typeof patch.status === 'string' && ['member', 'editor'].includes(role)) {
        try {
          const response = await authFetch('/api/push/notify-care-history', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leadId: id, eventType: 'status', status: patch.status, historyTime: Date.now() }),
          });
          if (!response.ok) console.warn('Thông báo trạng thái chưa gửi:', response.status);
        } catch (notifyError) { console.warn('Không thể gửi thông báo trạng thái đã lưu:', notifyError); }
      }
    } catch (saveError) { console.error(saveError); onShowNotification('Không thể lưu thay đổi khách hàng.', 'error'); }
    finally { setSaving(false); }
  };
  const bulkAssign = async () => {
    if (!bulkAssignee || !selected.length || saving) return;
    const ids = [...selected]; const savedIds: string[] = []; let deliveryFailures = 0;
    setSaving(true);
    try {
      for (const id of ids) {
        try {
          await updateDoc(doc(db, 'consultations', id), { assignee: bulkAssignee });
          savedIds.push(id);
          if (!await notifyAssignment(id, bulkAssignee)) deliveryFailures++;
        } catch (saveError) { console.error('Không thể giao khách:', id, saveError); }
      }
      setSelected(ids.filter((id) => !savedIds.includes(id))); refresh();
      onShowNotification(`Đã giao ${savedIds.length}/${ids.length} khách.${deliveryFailures ? ` ${deliveryFailures} khách chưa gửi đủ thông báo.` : ''}`, savedIds.length === ids.length && !deliveryFailures ? 'success' : 'error');
    } finally { setSaving(false); }
  };
  const addCare = async (event: React.FormEvent) => {
    event.preventDefault(); if (!lead || !careNote.trim() || saving) return;
    const id = lead.id; setSaving(true);
    try {
      const history = await appendConsultationCareHistory(id, careNote.trim());
      setLead((current) => current?.id === id ? { ...current, careHistory: history } : current);
      setCareNote(''); refresh(); onShowNotification('Đã lưu lịch sử chăm sóc', 'success');
      try {
        const response = await authFetch('/api/push/notify-care-history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId: id, historyTime: history[history.length - 1].time }) });
        if (!response.ok) console.warn('Thông báo chăm sóc chưa gửi:', response.status);
      } catch (notifyError) { console.warn('Không thể gửi thông báo chăm sóc đã lưu:', notifyError); }
    } catch (saveError) { console.error(saveError); onShowNotification('Không thể hoàn tất cập nhật chăm sóc. Kiểm tra hồ sơ trước khi gửi lại.', 'error'); }
    finally { setSaving(false); }
  };
  const removeLead = async () => {
    if (!lead || role !== 'admin' || saving || !window.confirm(`Xóa khách ${lead.name}? Lịch sử chăm sóc cũng sẽ bị mất.`)) return;
    setSaving(true);
    try {
      const response = await authFetch(`/api/admin/content/consultations/${encodeURIComponent(lead.id)}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Máy chủ từ chối xóa');
      openLead(null); refresh(); onShowNotification('Đã xóa khách hàng', 'success');
    } catch (deleteError) { console.error(deleteError); onShowNotification('Không thể xóa khách hàng.', 'error'); }
    finally { setSaving(false); }
  };
  const exportCsv = async () => {
    if (exporting) return; setExporting(true);
    try {
      const rows: Consultation[] = []; let currentPage = 1; let total = 0;
      do {
        const result = await queryPage(currentPage++, 100); total = result.total;
        if (total > 50000) throw new Error('Hãy thu hẹp bộ lọc xuống dưới 50.000 khách trước khi xuất.');
        const ids = new Set(rows.map((item) => item.id));
        rows.push(...result.rows.filter((row) => !ids.has(row.id)).map((row) => ({ ...row.data, id: row.id })));
        if (!result.rows.length) break;
      } while ((currentPage - 1) * 100 < total);
      if (rows.length !== total) throw new Error('Dữ liệu đã thay đổi trong lúc xuất. Vui lòng tải lại và xuất một lần nữa.');
      const csv = createCrmCsv(['Họ tên', 'Điện thoại', 'Email', 'Nhu cầu', 'Sản phẩm', 'Giai đoạn', 'Người phụ trách', 'Ngày tạo', 'Lịch liên hệ', 'Nguồn', 'IP'], rows.map((item) => [item.name, item.phone, item.email, item.demand || item.message, item.propertyTitle, stages[normalizeStage(item.status)], item.assignee, dateLabel(item.createdAt), dateLabel(item.nextFollowUpAt || undefined), item.sourceUrl, item.ipAddress]));
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a'); link.href = url; link.download = `crm-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
      onShowNotification(`Đã xuất ${rows.length} khách theo bộ lọc.`, 'success');
    } catch (exportError) { console.error(exportError); onShowNotification(exportError instanceof Error ? exportError.message : 'Không thể xuất dữ liệu CRM.', 'error'); }
    finally { setExporting(false); }
  };

  if (lead) return <div id="crm-workspace" className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><button type="button" onClick={() => openLead(null)} className="text-sm font-semibold text-primary underline">← Danh sách khách hàng</button><h3 className="mt-2 text-xl font-bold">{lead.name}</h3></div>
      {role === 'admin' && <button type="button" disabled={saving} onClick={() => void removeLead()} className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700">Xóa khách</button>}
    </div>
    {detailError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{detailError}</p>}
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-500">Điện thoại</dt><dd><a className="font-semibold text-primary underline" href={`tel:${(lead.phone || '').replace(/[^0-9+]/g, '')}`}>{lead.phone || 'Chưa có'}</a></dd></div>
            <div><dt className="text-slate-500">Email</dt><dd className="break-all">{lead.email || 'Chưa có'}</dd></div>
            <div><dt className="text-slate-500">Sản phẩm quan tâm</dt><dd>{lead.propertyTitle || 'Chưa xác định'}</dd></div>
            <div><dt className="text-slate-500">Ngày tạo</dt><dd>{dateLabel(lead.createdAt)}</dd></div>
            <div className="sm:col-span-2"><dt className="text-slate-500">Nhu cầu</dt><dd className="whitespace-pre-wrap break-words">{lead.message || lead.demand || 'Chưa cung cấp'}</dd></div>
          </dl>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <label className="text-xs font-semibold">Giai đoạn<select aria-label="Giai đoạn khách hàng" value={normalizeStage(lead.status)} disabled={saving || !!detailError} onChange={(event) => void patchLead({ status: event.target.value })} className={`${fieldClass} mt-1 w-full`}>{Object.entries(stages).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
            <label className="text-xs font-semibold">Ưu tiên<select value={lead.priority || 'medium'} disabled={saving || !!detailError} onChange={(event) => void patchLead({ priority: event.target.value })} className={`${fieldClass} mt-1 w-full`}><option value="high">Cao</option><option value="medium">Trung bình</option><option value="low">Thấp</option></select></label>
            <label className="text-xs font-semibold">Người phụ trách<select value={lead.assignee || ''} disabled={!canAssign || saving || !!detailError} onChange={(event) => void patchLead({ assignee: event.target.value })} className={`${fieldClass} mt-1 w-full`}><option value="">Chưa giao</option>{staff.map((user) => <option key={user.email} value={user.email}>{staffName(user.email)}</option>)}{lead.assignee && !staff.some((item) => item.email === lead.assignee) && <option value={lead.assignee}>{lead.assignee}</option>}</select></label>
          </div>
          {canAssign && lead.assignee && <button type="button" disabled={saving} className="mt-3 text-xs font-semibold text-primary underline" onClick={async () => { setSaving(true); try { const ok = await notifyAssignment(lead.id, lead.assignee || ''); onShowNotification(ok ? 'Đã gửi lại thông báo phân công' : 'Một số thông báo chưa gửi.', ok ? 'success' : 'error'); } finally { setSaving(false); } }}>Gửi lại thông báo phân công</button>}
        </section>
        <CrmFollowUpPanel leadId={lead.id} value={lead.nextFollowUpAt} onShowNotification={onShowNotification} onSaved={(value) => { setLead((current) => current?.id === lead.id ? { ...current, nextFollowUpAt: value } : current); refresh(); }} />
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="text-sm font-bold">Lịch sử chăm sóc</h4>
          <form onSubmit={addCare} className="mt-3 space-y-3"><label className="block text-xs font-semibold">Ghi chú mới<textarea value={careNote} onChange={(event) => setCareNote(event.target.value)} required maxLength={3000} rows={3} className={`${fieldClass} mt-1 w-full`} /></label><button type="submit" disabled={saving || !!detailError} className={buttonClass}>{saving ? 'Đang lưu…' : 'Lưu ghi chú'}</button></form>
          <ol className="mt-5 max-h-96 space-y-3 overflow-auto">{(lead.careHistory || []).slice(-100).reverse().map((item, index) => <li key={`${item.time}-${index}`} className="border-l-2 border-primary/30 pl-3 text-xs"><p className="font-semibold">{item.author} · {new Date(item.time).toLocaleString('vi-VN')}</p><p className="mt-1 whitespace-pre-wrap break-words text-slate-600">{item.note}</p></li>)}</ol>
          {!lead.careHistory?.length && <p className="mt-3 text-xs text-slate-500">Chưa có ghi chú chăm sóc.</p>}
          {(lead.careHistory?.length || 0) > 100 && <p className="mt-3 text-xs text-slate-500">Đang hiển thị 100 ghi chú gần nhất.</p>}
        </section>
      </div>
      <div className="space-y-5">
        <CrmActivityTimeline leadId={lead.id} revision={String(revision)} />
        <section className="rounded-xl border border-slate-200 bg-white p-4 text-xs"><h4 className="text-sm font-bold">Nguồn và đồng ý</h4><p className="mt-3">IP: {lead.ipAddress || 'Không xác định'}</p><p className="mt-2">Điều khoản: {lead.termsAccepted ? 'Đã đồng ý' : 'Chưa ghi nhận'} · Quyền riêng tư: {lead.privacyAccepted ? 'Đã đồng ý' : 'Chưa ghi nhận'}</p>{lead.sourceUrl && /^https?:\/\//i.test(lead.sourceUrl) && <a className="mt-3 block break-all text-primary underline" href={lead.sourceUrl} target="_blank" rel="noopener noreferrer">{lead.pageTitle || lead.sourceUrl}</a>}{lead.popupOpenedUrl && /^https?:\/\//i.test(lead.popupOpenedUrl) && <a className="mt-3 block break-all text-primary underline" href={lead.popupOpenedUrl} target="_blank" rel="noopener noreferrer">Popup mở tại: {lead.popupOpenedTitle || lead.popupOpenedUrl}</a>}
          {Number(lead.spamScore) > 0 && <p className="mt-3 rounded-lg bg-amber-50 p-2 text-amber-900">Cần kiểm tra thủ công: {lead.spamReasons?.join('; ') || `${lead.spamScore} điểm`}. Cảnh báo không tự chặn khách.</p>}
          {role === 'admin' && lead.ipAddress && <button type="button" className="mt-3 text-primary underline" onClick={() => onBlockIp(lead.ipAddress || '')}>Kiểm tra chặn IP</button>}
          {!!lead.images?.length && <div className="mt-4 flex flex-wrap gap-2">{lead.images.map((url, index) => <a key={url} href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={`Ảnh khách gửi ${index + 1}`} loading="lazy" width={72} height={72} className="h-[72px] w-[72px] rounded-lg object-cover" /></a>)}</div>}
        </section>
      </div>
    </div>
  </div>;

  const leads = data.rows.map((row) => ({ ...row.data, id: row.id }));
  return <div id="crm-workspace" className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-bold">Hệ thống CRM</h3><p className="mt-1 text-sm text-slate-500">Quản lý khách hàng, tiến độ chăm sóc và lịch liên hệ.</p></div><button type="button" disabled={exporting || loading || !!error} onClick={() => void exportCsv()} className={buttonClass}>{exporting ? 'Đang xuất…' : 'Xuất kết quả lọc'}</button></div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">{[['all', 'Tất cả'], ...Object.entries(stages), ['due', 'Đến hạn liên hệ']].map(([key, label]) => <button type="button" key={key} onClick={() => { setStatus(key === 'due' ? 'all' : key); setDue(key === 'due'); }} className={`rounded-xl border p-3 text-left ${(key === 'due' ? due : !due && status === key) ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white'}`}><span className="block text-xs text-slate-500">{label}</span><strong className="mt-1 block text-xl">{data.stats[key === 'all' ? 'total' : key] || 0}</strong></button>)}</div>
    <div className="flex flex-wrap gap-3"><label className="min-w-[220px] flex-1 text-xs font-semibold">Tìm khách<input type="search" value={searchInput} maxLength={200} onChange={(event) => setSearchInput(event.target.value)} placeholder="Tên, điện thoại, email, nhu cầu…" className={`${fieldClass} mt-1 w-full`} /></label>{canAssign && <label className="text-xs font-semibold">Người phụ trách<select value={assignee} onChange={(event) => setAssignee(event.target.value)} className={`${fieldClass} mt-1 block`}><option value="">Tất cả nhân viên</option>{staff.map((user) => <option key={user.email} value={user.email}>{staffName(user.email)}</option>)}</select></label>}<button type="button" onClick={refresh} className={`${fieldClass} self-end`}>Tải lại</button></div>
    {canAssign && selected.length > 0 && <div className="flex flex-wrap items-center gap-3 rounded-xl bg-primary/5 p-3"><span className="text-sm">Đã chọn {selected.length} khách trong trang này</span><select aria-label="Giao khách cho nhân viên" value={bulkAssignee} onChange={(event) => setBulkAssignee(event.target.value)} className={fieldClass}><option value="">Chọn nhân viên</option>{staff.map((user) => <option key={user.email} value={user.email}>{staffName(user.email)}</option>)}</select><button type="button" disabled={saving || !bulkAssignee} onClick={() => void bulkAssign()} className={buttonClass}>{saving ? 'Đang giao…' : 'Giao khách đã chọn'}</button></div>}
    {error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white" aria-busy={loading}>
      <table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{canAssign && <th className="p-3"><input type="checkbox" aria-label="Chọn mọi khách trong trang này" disabled={loading || saving} checked={leads.length > 0 && leads.every((item) => selected.includes(item.id))} onChange={(event) => setSelected(event.target.checked ? leads.map((item) => item.id) : [])} /></th>}<th className="p-3">Khách hàng</th><th className="p-3">Nhu cầu / sản phẩm</th><th className="p-3">Giai đoạn</th><th className="p-3">Người phụ trách</th><th className="p-3">Lịch liên hệ</th><th className="p-3">Hồ sơ</th></tr></thead><tbody>{leads.map((item) => <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">{canAssign && <td className="p-3"><input type="checkbox" aria-label={`Chọn ${item.name}`} disabled={loading || saving} checked={selected.includes(item.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} /></td>}<td className="p-3"><strong className="block">{item.name}</strong><span className="text-xs text-slate-500">{item.phone}</span></td><td className="max-w-64 p-3"><p className="line-clamp-2 text-xs">{item.message || item.demand || item.propertyTitle || 'Chưa có'}</p></td><td className="p-3 text-xs">{stages[normalizeStage(item.status)] || 'Khách mới'}</td><td className="p-3 text-xs">{staffName(item.assignee)}</td><td className={`p-3 text-xs ${item.nextFollowUpAt && Date.parse(item.nextFollowUpAt) < Date.now() ? 'font-semibold text-red-700' : ''}`}>{dateLabel(item.nextFollowUpAt || undefined)}</td><td className="p-3"><button type="button" disabled={loading} onClick={() => openLead(item)} className="font-semibold text-primary underline">Mở hồ sơ</button></td></tr>)}{!leads.length && <tr><td colSpan={canAssign ? 7 : 6} className="p-8 text-center text-slate-500">{loading ? 'Đang tải khách hàng…' : 'Không có khách hàng khớp bộ lọc.'}</td></tr>}</tbody></table>
    </div>}
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><p>{loading ? 'Đang cập nhật…' : `${data.total} khách khớp bộ lọc · Trang ${page}/${Math.max(1, Math.ceil(data.total / 25))}`}</p><div className="flex gap-2"><button type="button" disabled={loading || page <= 1} onClick={() => setPage((current) => current - 1)} className={`${fieldClass} disabled:opacity-40`}>Trang trước</button><button type="button" disabled={loading || page * 25 >= data.total} onClick={() => setPage((current) => current + 1)} className={`${fieldClass} disabled:opacity-40`}>Trang sau</button></div></div>
  </div>;
}
