import React, { useState, useEffect } from 'react';
import { setDoc, db, doc } from '../firebase';
import { dbRealtime, docRealtime, onSnapshot } from '../firebase-realtime';
import { Plus, Trash2, Save } from 'lucide-react';

export default function AdminFiltersTab({ onShowNotification }: { onShowNotification: (msg: string, type: 'success' | 'error') => void }) {
  const [districts, setDistricts] = useState<string[]>([]);
  const [newDistrict, setNewDistrict] = useState('');
  
  const [priceSale, setPriceSale] = useState<{ id: string; min: number; max: number | null; label: string }[]>([]);
  const [priceRent, setPriceRent] = useState<{ id: string; min: number; max: number | null; label: string }[]>([]);
  const [areaRanges, setAreaRanges] = useState<{ id: string; min: number; max: number | null; label: string }[]>([]);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(docRealtime(dbRealtime, 'settings', 'filters'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDistricts(data.districts || []);
        if (data.priceSale) setPriceSale(data.priceSale);
        if (data.priceRent) setPriceRent(data.priceRent);
        if (data.areaRanges) setAreaRanges(data.areaRanges);
      }
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      await setDoc(doc(db, 'settings', 'filters'), {
        districts,
        priceSale,
        priceRent,
        areaRanges
      }, { merge: true });
      onShowNotification("Lưu cấu hình bộ lọc thành công!", "success");
    } catch (e: any) {
      onShowNotification("Có lỗi xảy ra: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      <div className="flex justify-between items-center bg-bg-inverse border border-slate-850 p-[5px] text-[16px] rounded-lg shadow-xl">
        <h2 className="text-slate-900 font-display font-bold text-[14px]">Cấu hình Bộ Lọc Tìm Kiếm</h2>
        <button 
          onClick={handleSave} 
          disabled={loading}
          className="bg-accent text-black font-bold pl-[16px] pr-4 py-[5px] text-[11px] rounded-lg cursor-pointer flex items-center gap-2 hover:bg-yellow-400"
        >
          <Save size={14} />
          {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* District list */}
        <div className="bg-bg-inverse border border-slate-850 pt-5 px-[10px] pb-[10px] rounded-lg shadow-xl">
          <h3 className="text-slate-900 font-bold text-sm mb-[10px] border-b border-border-inverse pb-0">Khu vực (Quận/Huyện)</h3>
          <div className="flex gap-2 mb-4">
            <input 
              className="flex-1 bg-bg-inverse border border-border-inverse rounded px-3 py-1.5 text-xs text-slate-900 outline-none" 
              placeholder="VD: Quận 1"
              value={newDistrict}
              onChange={e => setNewDistrict(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newDistrict.trim()) {
                  setDistricts([...districts, newDistrict.trim()]);
                  setNewDistrict('');
                }
              }}
            />
            <button 
              onClick={() => {
                if (newDistrict.trim()) {
                  setDistricts([...districts, newDistrict.trim()]);
                  setNewDistrict('');
                }
              }}
              className="bg-accent/10 text-accent border border-yellow-500/20 px-3 py-1.5 rounded hover:bg-accent/20"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {districts.map((d, i) => (
              <div key={i} className="flex justify-between items-center bg-bg-inverse border border-border-inverse px-3 py-2 rounded text-xs">
                <span className="text-slate-800">{d}</span>
                <button onClick={() => setDistricts(districts.filter((_, idx) => idx !== i))} className="text-rose-400 hover:text-rose-300">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {districts.length === 0 && <p className="text-slate-500 text-xs text-center py-4">Chưa có khu vực nào. Hệ thống sẽ tự động lấy từ danh sách BĐS.</p>}
          </div>
        </div>

        {/* Area */}
        <div className="bg-bg-inverse border border-slate-850 pt-5 px-[10px] pb-[10px] rounded-lg shadow-xl">
          <div className="flex justify-between items-center mb-[10px] border-b border-border-inverse pb-0">
            <h3 className="text-slate-900 font-bold text-sm">Diện tích (m²)</h3>
            <button 
              onClick={() => setAreaRanges([...areaRanges, { id: generateId(), min: 0, max: 100, label: 'Dưới 100 m²' }])}
              className="text-accent text-[10px] hover:underline flex items-center gap-1"
            >
              <Plus size={12} /> Thêm
            </button>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {areaRanges.map((a, i) => (
              <div key={a.id} className="bg-bg-inverse flex flex-col gap-2 p-3 rounded border border-border-inverse">
                <input 
                  className="bg-bg-inverse border border-border-inverse rounded px-2 py-1 text-xs text-slate-900 w-full"
                  value={a.label} onChange={e => {
                    const newArr = [...areaRanges];
                    newArr[i].label = e.target.value;
                    setAreaRanges(newArr);
                  }}
                  placeholder="Nhãn hiển thị (VD: Dưới 100 m²)"
                />
                <div className="flex gap-2 items-center">
                   <div className="flex-1 flex items-center gap-2">
                     <input type="number" className="bg-bg-inverse border border-border-inverse rounded px-2 py-1 text-xs text-slate-900 w-full" placeholder="Min" value={a.min} onChange={e => {
                       const newArr = [...areaRanges]; newArr[i].min = Number(e.target.value); setAreaRanges(newArr);
                     }} />
                     <span className="text-slate-500 text-xs">-</span>
                     <input type="number" className="bg-bg-inverse border border-border-inverse rounded px-2 py-1 text-xs text-slate-900 w-full" placeholder="Max (Để trống nếu ko giới hạn)" value={a.max || ''} onChange={e => {
                       const newArr = [...areaRanges]; newArr[i].max = e.target.value ? Number(e.target.value) : null; setAreaRanges(newArr);
                     }} />
                   </div>
                   <button onClick={() => setAreaRanges(areaRanges.filter((_, idx) => idx !== i))} className="text-rose-400 hover:text-rose-300 ml-2">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {areaRanges.length === 0 && <p className="text-slate-500 text-xs text-center py-4">Chưa có khoảng diện tích. Sẽ dùng mặc định.</p>}
          </div>
        </div>

        {/* Price Sale */}
        <div className="bg-bg-inverse border border-slate-850 pt-[10px] px-[10px] pb-[19px] rounded-lg shadow-xl">
          <div className="flex justify-between items-center mb-4 border-b border-border-inverse pb-[7px]">
            <h3 className="text-slate-900 font-bold text-sm">Khoảng Giá Bán (VNĐ)</h3>
            <button 
              onClick={() => setPriceSale([...priceSale, { id: generateId(), min: 0, max: 3000000000, label: 'Dưới 3 Tỷ' }])}
              className="text-accent text-[10px] hover:underline flex items-center gap-1"
            >
              <Plus size={12} /> Thêm
            </button>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {priceSale.map((p, i) => (
              <div key={p.id} className="bg-bg-inverse flex flex-col gap-2 p-3 rounded border border-border-inverse">
                <input 
                  className="bg-bg-inverse border border-border-inverse rounded px-2 py-1 text-xs text-slate-900 w-full"
                  value={p.label} onChange={e => {
                    const newArr = [...priceSale]; newArr[i].label = e.target.value; setPriceSale(newArr);
                  }}
                  placeholder="Nhãn (VD: Dưới 3 Tỷ)"
                />
                <div className="flex gap-2 items-center">
                   <div className="flex-1 flex items-center gap-2">
                     <input type="number" className="bg-bg-inverse border border-border-inverse rounded px-2 py-1 text-[10px] text-slate-900 w-full" placeholder="Min" value={p.min} onChange={e => {
                       const newArr = [...priceSale]; newArr[i].min = Number(e.target.value); setPriceSale(newArr);
                     }} />
                     <span className="text-slate-500">-</span>
                     <input type="number" className="bg-bg-inverse border border-border-inverse rounded px-2 py-1 text-[10px] text-slate-900 w-full" placeholder="Max" value={p.max || ''} onChange={e => {
                       const newArr = [...priceSale]; newArr[i].max = e.target.value ? Number(e.target.value) : null; setPriceSale(newArr);
                     }} />
                   </div>
                   <button onClick={() => setPriceSale(priceSale.filter((_, idx) => idx !== i))} className="text-rose-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
             {priceSale.length === 0 && <p className="text-slate-500 text-xs text-center py-4">Chưa có khoảng giá bán. Sẽ dùng mặc định.</p>}
          </div>
        </div>

        {/* Price Rent */}
        <div className="bg-bg-inverse border border-slate-850 pt-[10px] px-[10px] pb-[10px] rounded-lg shadow-xl">
          <div className="flex justify-between items-center mb-[10px] border-b border-border-inverse pb-0">
            <h3 className="text-slate-900 font-bold text-sm">Khoảng Giá Cho Thuê (VNĐ)</h3>
            <button 
              onClick={() => setPriceRent([...priceRent, { id: generateId(), min: 0, max: 15000000, label: 'Dưới 15 Triệu/tháng' }])}
              className="text-accent text-[10px] hover:underline flex items-center gap-1"
            >
              <Plus size={12} /> Thêm
            </button>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {priceRent.map((p, i) => (
              <div key={p.id} className="bg-bg-inverse flex flex-col gap-2 p-3 rounded border border-border-inverse">
                <input 
                  className="bg-bg-inverse border border-border-inverse rounded px-2 py-1 text-xs text-slate-900 w-full"
                  value={p.label} onChange={e => {
                    const newArr = [...priceRent]; newArr[i].label = e.target.value; setPriceRent(newArr);
                  }}
                  placeholder="Nhãn (VD: Dưới 15 triệu/tháng)"
                />
                <div className="flex gap-2 items-center">
                   <div className="flex-1 flex items-center gap-2">
                     <input type="number" className="bg-bg-inverse border border-border-inverse rounded px-2 py-1 text-[10px] text-slate-900 w-full" placeholder="Min" value={p.min} onChange={e => {
                       const newArr = [...priceRent]; newArr[i].min = Number(e.target.value); setPriceRent(newArr);
                     }} />
                     <span className="text-slate-500">-</span>
                     <input type="number" className="bg-bg-inverse border border-border-inverse rounded px-2 py-1 text-[10px] text-slate-900 w-full" placeholder="Max" value={p.max || ''} onChange={e => {
                       const newArr = [...priceRent]; newArr[i].max = e.target.value ? Number(e.target.value) : null; setPriceRent(newArr);
                     }} />
                   </div>
                   <button onClick={() => setPriceRent(priceRent.filter((_, idx) => idx !== i))} className="text-rose-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {priceRent.length === 0 && <p className="text-slate-500 text-xs text-center py-4">Chưa có khoảng thuể. Sẽ dùng mặc định.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}
