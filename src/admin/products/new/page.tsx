import React, { useState } from 'react';
import { db, collection, addDoc } from '../../../firebase';

// ==========================================
// TYPE DEFINITIONS / INTERFACES
// ==========================================
export interface NewProduct {
  title: string;
  priceText: string;
  priceVal: number;
  type: 'sale' | 'rent';
  district: string;
  phone: string;
  imageUrl: string;
  description: string;
  category: string;
  createdAt: string;
}

export default function NewProductPage() {
  // Form State
  const [title, setTitle] = useState('');
  const [priceText, setPriceText] = useState('');
  const [priceVal, setPriceVal] = useState('');
  const [type, setType] = useState<'sale' | 'rent'>('sale');
  const [district, setDistrict] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('Biệt thự sinh thái');
  const [description, setDescription] = useState('');
  
  // Image & Upload state
  const [imageUrl, setImageUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Success & Error feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Constants
  const CATEGORIES = [
    'Biệt thự sinh thái',
    'Căn hộ cao cấp',
    'Nhà phố liền kề',
    'Đất nền quy hoạch',
    'Shophouse kinh doanh'
  ];

  // ==========================================
  // IMAGE FILE SELECTION & UPLOAD HANDLER
  // ==========================================
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setStatusMessage('');
      return;
    }

    try {
      setIsUploading(true);
      setStatusMessage('Đang chuyển đổi ảnh sang Base64...');
      setFeedback(null);

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.onerror = (error) => reject(error);
      });
      reader.readAsDataURL(file);
      const base64 = await base64Promise;

      setStatusMessage('Đang tải và đồng bộ ảnh lên hệ thống...');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: file.name,
          base64: base64
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Lỗi từ phía máy chủ khi tải ảnh.');
      }

      const responseData = await response.json();
      if (responseData.success && responseData.url) {
        setImageUrl(responseData.url);
        setFeedback({
          type: 'success',
          text: responseData.githubSynced
            ? 'Đồng bộ ảnh đại diện thành công lên kho GitHub hệ thống!'
            : 'Đã lưu ảnh đại diện cục bộ thành công! (Chế độ lưu trữ dự phòng do lỗi kết nối GitHub)'
        });
      } else {
        throw new Error('Đường dẫn ảnh rỗng từ phía máy chủ.');
      }
    } catch (err: any) {
      console.error('Lỗi xử lý file:', err);
      setFeedback({
        type: 'error',
        text: `Lỗi xử lý tệp: ${err.message || err}`
      });
    } finally {
      setIsUploading(false);
      setStatusMessage('');
    }
  };

  // ==========================================
  // FORM SUBMISSION HANDLER
  // ==========================================
  const handleSubmitProductForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // Form Validation Checks
    if (!title.trim()) {
      setFeedback({ type: 'error', text: 'Vui lòng cung cấp tiêu đề sản phẩm bất động sản.' });
      return;
    }
    if (!phone.trim()) {
      setFeedback({ type: 'error', text: 'Vui lòng cung cấp điện thoại liên hệ chuyên gia.' });
      return;
    }
    if (!imageUrl) {
      setFeedback({ type: 'error', text: 'Vui lòng chọn và đợi ảnh đại diện được tải lên kho lưu trữ xong.' });
      return;
    }

    setIsSubmitLoading(true);
    setStatusMessage('Đang xử lý...');

    try {
      // 1. Construct the payload matching the schema
      const priceNumerical = Number(priceVal) || 0;
      const productPayload: NewProduct = {
        title: title.trim(),
        priceText: priceText.trim() || 'Giá liên hệ',
        priceVal: priceNumerical,
        type: type,
        district: district.trim() || 'TP. Hồ Chí Minh',
        phone: phone.trim(),
        imageUrl: imageUrl, // Inserted the actual storage HTTP download URL here
        description: description.trim() || '<p>Vui lòng cập nhật hình ảnh thuyết minh cho sản phẩm.</p>',
        category: category,
        createdAt: new Date().toISOString()
      };

      // 2. Push path payload onto Firestore Database
      await addDoc(collection(db, 'products'), productPayload);

      // Clean the local form state
      setTitle('');
      setPriceText('');
      setPriceVal('');
      setDistrict('');
      setPhone('');
      setDescription('');
      setImageUrl('');
      setFeedback({
        type: 'success',
        text: 'Kiến tạo và biên tập bất động sản mới lên Firestore Database thành công!'
      });

    } catch (err: any) {
      console.error('Lỗi lưu Firestore Database:', err);
      setFeedback({
        type: 'error',
        text: `Không thể xuất bản dữ liệu: ${err.message}`
      });
    } finally {
      setIsSubmitLoading(false);
      setStatusMessage('');
    }
  };

  // Check if save or selection is locked
  const isFormDisabled = isUploading || isSubmitLoading;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-6 md:p-12 flex justify-center items-start">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-6 md:p-8 space-y-6">
        
        {/* Header styling */}
        <div className="border-b border-slate-800 pb-4">
          <h1 id="page-title" className="text-xl md:text-2xl font-bold text-amber-400 tracking-tight flex items-center gap-2">
            ✨ Thêm Sản Phẩm Bất Động Sản Mới
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Nhánh quy hoạch dữ liệu hệ thống /products kết hợp bộ lọc Realtime Database & Firebase Storage
          </p>
        </div>

        {/* Global user notification center */}
        {feedback && (
          <div className={`p-4 rounded-lg text-xs leading-relaxed border transition-all ${
            feedback.type === 'success' 
              ? 'bg-amber-950/40 border-amber-500/20 text-amber-400' 
              : 'bg-rose-950/40 border-rose-500/20 text-rose-300'
          }`}>
            <p className="font-semibold mb-0.5">
              {feedback.type === 'success' ? '✓ Thành công' : '✕ Đã xảy ra lỗi'}
            </p>
            <p>{feedback.text}</p>
          </div>
        )}

        {/* Processing/Loading feedback details */}
        {statusMessage && (
          <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg flex items-center gap-3 text-xs text-amber-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>{statusMessage}</span>
            {uploadProgress !== null && (
              <div className="w-32 bg-slate-800 h-1.5 rounded-full overflow-hidden ml-auto">
                <div className="bg-amber-400 h-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            )}
          </div>
        )}

        {/* Form Body layout */}
        <form onSubmit={handleSubmitProductForm} className="space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Title */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Tiêu đề sản phẩm <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Biệt thự nghỉ dưỡng sinh thái ven sông Quận 7"
                disabled={isFormDisabled}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2.5 px-3.5 text-xs outline-none transition-colors"
                required
              />
            </div>

            {/* Price Text */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Thuyết minh giá (Hiển thị)
              </label>
              <input
                type="text"
                value={priceText}
                onChange={(e) => setPriceText(e.target.value)}
                placeholder="Ví dụ: 12.5 Tỷ hoặc 15 Triệu/tháng"
                disabled={isFormDisabled}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2.5 px-3.5 text-xs outline-none transition-colors"
              />
            </div>

            {/* Price Val */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Mức giá lưu lọc (Số VND)
              </label>
              <input
                type="number"
                value={priceVal}
                onChange={(e) => setPriceVal(e.target.value)}
                placeholder="Ví dụ: 12500000000"
                disabled={isFormDisabled}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2.5 px-3.5 text-xs outline-none transition-colors"
              />
            </div>

            {/* Category selection */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Danh mục bất động sản
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isFormDisabled}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2.5 px-3 text-xs outline-none cursor-pointer transition-colors"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Type transaction */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Hình thức giao dịch
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'sale' | 'rent')}
                disabled={isFormDisabled}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2.5 px-3 text-xs outline-none cursor-pointer transition-colors"
              >
                <option value="sale">Mua bán chuyển nhượng</option>
                <option value="rent">Cho thuê</option>
              </select>
            </div>

            {/* Address / Location District */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Khu vực (Quận / Huyện)
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Ví dụ: Quận 7, TP. HCM"
                disabled={isFormDisabled}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2.5 px-3.5 text-xs outline-none transition-colors"
              />
            </div>

            {/* Hotline Phone */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Điện thoại chuyên gia đăng tin <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ví dụ: 0932 966 700"
                disabled={isFormDisabled}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2.5 px-3.5 text-xs outline-none transition-colors"
                required
              />
            </div>

            {/* CRITICAL MODULE: Storage photo uploader */}
            <div className="space-y-2 md:col-span-2 border-t border-slate-800 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
                  Hình ảnh đại diện sản phẩm (Tải lên Firebase Storage) <span className="text-rose-400">*</span>
                </label>
                {imageUrl && (
                  <span className="text-[9px] text-amber-400 font-mono font-bold">
                    ✓ Đã định vị URL
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-stretch">
                <div className="md:col-span-3 relative flex items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    disabled={isFormDisabled}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                  />
                  <div className="w-full bg-slate-950 border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-lg p-4 flex flex-col items-center justify-center text-center transition-colors">
                    <span className="text-slate-400 font-semibold text-xs text-amber-400">
                      {isUploading ? 'ĐANG TẢI ẢNH...' : 'Bấm hoặc kéo thả ảnh vào đây để tự động Upload'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">
                      Hệ thống tự động cắt đuôi mở rộng và lưu vào thư mục /products
                    </span>
                  </div>
                </div>

                {/* Real-time graphic preview */}
                <div className="h-24 md:h-auto bg-slate-950 border border-slate-850 rounded-lg flex items-center justify-center overflow-hidden">
                  {imageUrl ? (
                    <img
                      src={(imageUrl) || undefined}
                      alt="Xem trước ảnh"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                      Chưa có hình
                    </span>
                  )}
                </div>
              </div>

              {imageUrl && (
                <div className="text-[10px] text-slate-500 bg-slate-950 border border-slate-850 p-2 rounded-md font-mono select-all overflow-x-auto">
                  <span className="text-amber-400 font-bold block mb-1">Đường dẫn ảnh thật trên StorageBucket:</span>
                  {imageUrl}
                </div>
              )}
            </div>

            {/* Description (Rich Text HTML Area) */}
            <div className="space-y-1.5 md:col-span-2 border-t border-slate-800 pt-4">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Thuyết minh / Mô tả chi tiết (Mã HTML)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập thuyết minh văn bản hoặc viết mã HTML..."
                disabled={isFormDisabled}
                className="w-full h-32 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg py-2.5 px-3.5 text-xs outline-none font-mono transition-colors"
              />
            </div>

          </div>

          {/* Action Row buttons */}
          <div className="flex justify-end gap-3.5 pt-4 border-t border-slate-800">
            <button
              type="button"
              disabled={isFormDisabled}
              onClick={() => {
                setTitle('');
                setPriceText('');
                setPriceVal('');
                setDistrict('');
                setPhone('');
                setDescription('');
                setImageUrl('');
                setFeedback(null);
              }}
              className="bg-slate-950 hover:bg-slate-850 text-slate-400 border border-slate-850 text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Đặt lại mẫu
            </button>
            <button
              type="submit"
              disabled={isFormDisabled || !imageUrl}
              className={`bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold text-xs py-2.5 px-6 rounded-lg transition-all flex items-center gap-1.5 ${
                (isFormDisabled || !imageUrl) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {isSubmitLoading ? 'ĐANG XỬ LÝ...' : 'XUẤT BẢN DỮ LIỆU LÊN HỆ THỐNG'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
