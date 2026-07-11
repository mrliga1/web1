import React, { useState, useEffect } from 'react';
import { db, getDoc, doc, setDoc } from '../firebase';
import { Plus, Trash2, Save, Loader2, AlertCircle } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../firebase-errors';

interface FilterRange {
  id: string;
  label: string;
  min: number;
  max: number | null;
}

export default function FiltersConfigTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [priceSale, setPriceSale] = useState<FilterRange[]>([]);
  const [priceRent, setPriceRent] = useState<FilterRange[]>([]);
  const [areaRanges, setAreaRanges] = useState<FilterRange[]>([]);
  
  // Also load districts if any
  const [existingDistricts, setExistingDistricts] = useState<string[]>([]);

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    try {
      setLoading(true);
      setError(null);
      const snap = await getDoc(doc(db, 'settings', 'filters'));
      if (snap.exists()) {
        const d = snap.data();
        setPriceSale(d.priceSale || []);
        setPriceRent(d.priceRent || []);
        setAreaRanges(d.areaRanges || []);
        setExistingDistricts(d.districts || []);
      }
    } catch (err: any) {
      console.error(err);
      setError('Lỗi khi tải dữ liệu bộ lọc. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);
      
      const payload = {
        priceSale,
        priceRent,
        areaRanges,
        districts: existingDistricts
      };
      
      await setDoc(doc(db, 'settings', 'filters'), payload);
      setSuccessMsg('Đã lưu cấu hình bộ lọc thành công!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError('Lỗi khi lưu dữ liệu. Vui lòng thử lại.');
      handleFirestoreError(err, OperationType.UPDATE, 'settings/filters');
    } finally {
      setSaving(false);
    }
  };

  const RangeEditor = ({ 
    title, 
    items, 
    onChange 
  }: { 
    title: string; 
    items: FilterRange[]; 
    onChange: (items: FilterRange[]) => void 
  }) => {
    const addRow = () => {
      onChange([...items, { id: `range_${Date.now()}`, label: '', min: 0, max: null }]);
    };
    const removeRow = (idx: number) => {
      const newItems = [...items];
      newItems.splice(idx, 1);
      onChange(newItems);
    };
    const updateRow = (idx: number, field: keyof FilterRange, value: any) => {
      const newItems = [...items];
      newItems[idx] = { ...newItems[idx], [field]: value };
      onChange(newItems);
    };

    return (
      <div className="bg-white p-6 rounded-xl border border-border-color shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-text-primary text-sm">{title}</h3>
          <button 
            type="button" 
            onClick={addRow}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary hover:text-text-inverse rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm mốc
          </button>
        </div>
        
        {items.length === 0 ? (
          <div className="text-sm text-text-secondary italic text-center py-4 bg-bg-surface rounded-lg">
            Chưa có mốc nào. (Sẽ sử dụng mốc mặc định của hệ thống)
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={item.id} className="grid grid-cols-12 gap-3 items-start bg-bg-surface/50 p-3 rounded-lg border border-border-color/50">
                <div className="col-span-12 sm:col-span-3">
                  <label className="block text-[10px] text-text-secondary mb-1 font-medium uppercase tracking-wider">Mã (ID)</label>
                  <input
                    type="text"
                    value={item.id}
                    onChange={(e) => updateRow(idx, 'id', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-border-color rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="VD: under15m"
                  />
                </div>
                <div className="col-span-12 sm:col-span-3">
                  <label className="block text-[10px] text-text-secondary mb-1 font-medium uppercase tracking-wider">Tên hiển thị</label>
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => updateRow(idx, 'label', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-border-color rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="VD: Dưới 15 tỷ"
                  />
                </div>
                <div className="col-span-6 sm:col-span-2">
                  <label className="block text-[10px] text-text-secondary mb-1 font-medium uppercase tracking-wider">Tối thiểu</label>
                  <input
                    type="number"
                    value={item.min}
                    onChange={(e) => updateRow(idx, 'min', e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-border-color rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <label className="block text-[10px] text-text-secondary mb-1 font-medium uppercase tracking-wider">Tối đa (Bỏ trống = Vô cực)</label>
                  <input
                    type="number"
                    value={item.max === null ? '' : item.max}
                    onChange={(e) => updateRow(idx, 'max', e.target.value === '' ? null : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-border-color rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="Vô cực"
                  />
                </div>
                <div className="col-span-12 sm:col-span-1 flex justify-end sm:mt-[22px]">
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    title="Xóa mốc này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 pt-4">
      <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-border-color shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Cấu Hình Bộ Lọc Thả Xuống</h2>
          <p className="text-sm text-text-secondary mt-1 max-w-2xl">
            Cài đặt các mốc hiển thị trên menu thả xuống ở trang danh sách Sản Phẩm. 
            <br/>Chú ý: Hệ thống xử lý lọc bằng con số, nên phần Giá trị Tối thiểu/Tối đa phải nhập đúng con số (VD: 15 tỷ thì nhập 15000000000).
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-text-inverse rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-70 shrink-0"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-600 rounded-lg flex items-center gap-3 text-sm border border-rose-200">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-lg flex items-center gap-3 text-sm border border-emerald-200">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}

      <RangeEditor title="Bộ lọc Giá Bán (Dành cho sản phẩm Bán)" items={priceSale} onChange={setPriceSale} />
      <RangeEditor title="Bộ lọc Giá Thuê (Dành cho sản phẩm Cho Thuê)" items={priceRent} onChange={setPriceRent} />
      <RangeEditor title="Bộ lọc Diện Tích" items={areaRanges} onChange={setAreaRanges} />
      
    </div>
  );
}
