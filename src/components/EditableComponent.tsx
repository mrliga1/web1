import React, { useState, useEffect } from 'react';
import { Sparkles, Upload } from 'lucide-react';
import { authFetch } from '../lib/authFetch';

interface EditableTextProps {
  sectionId: string;
  field: string;
  subField?: string;
  value: string;
  isEditMode: boolean;
  sections: any[];
  onUpdateSections: (sections: any[]) => void;
  isArea?: boolean;
  className?: string;
  tag?: any;
}

export function EditableText({
  sectionId,
  field,
  subField,
  value,
  isEditMode,
  sections,
  onUpdateSections,
  isArea = false,
  className = '',
  tag: Tag = 'p'
}: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(() => {
    let initial = value || '';
    const oldText = "Giao dịch minh bạch qua 4 bước khép kín: Thẩm định giá chính thực, Thẩm định tính pháp lý sổ hồng, Trao đổi phân tích sâu cùng chuyên gia nhãn quan phong thủy, và Hoàn công bàn giao dồi dào tài lộc";
    const newText = "Giao dịch minh bạch qua 4 bước khép kín: Thẩm định giá chính thực, Thẩm định tính pháp lý sổ hồng, Trao đổi phân tích chuyên sâu tiềm năng sản phẩm, và Hoàn thành giao dịch, hỗ trợ hậu mãi và pháp lý...";
    initial = initial.replace(oldText, newText);
    initial = initial.replace(/12,500\+/gi, "1,500+");
    initial = initial.replace(/12,500/g, "1,500");
    initial = initial.replace(/0% rủi ro/gi, "0% Lo ngại");
    initial = initial.replace(/0% lo ngại/gi, "0% Lo ngại");
    initial = initial.replace(/Phong thủy độc bách cát tường/gi, "Phân tích chuyên sâu pháp lý, thị trường");
    initial = initial.replace(/Giải pháp độc quyền phong thủy/gi, "Phân tích chuyên sâu pháp lý, thị trường");
    initial = initial.replace(/Đội tuyển đại sư tư vấn địa thế hướng phong, bài bài bài trí rước sinh khí dồi dào tài lộc của gia chủ sâu sắc tinh tường./gi, "Đội ngũ chuyên gia phân tích kỹ lưỡng tiềm năng tăng giá, pháp lý và tính thanh khoản, đảm bảo lợi nhuận và an toàn tuyệt đối cho dòng vốn của nhà đầu tư.");
    return initial;
  });

  useEffect(() => {
    let processedValue = value || '';
    const oldText = "Giao dịch minh bạch qua 4 bước khép kín: Thẩm định giá chính thực, Thẩm định tính pháp lý sổ hồng, Trao đổi phân tích sâu cùng chuyên gia nhãn quan phong thủy, và Hoàn công bàn giao dồi dào tài lộc";
    const newText = "Giao dịch minh bạch qua 4 bước khép kín: Thẩm định giá chính thực, Thẩm định tính pháp lý sổ hồng, Trao đổi phân tích chuyên sâu tiềm năng sản phẩm, và Hoàn thành giao dịch, hỗ trợ hậu mãi và pháp lý...";
    processedValue = processedValue.replace(oldText, newText);
    processedValue = processedValue.replace(/12,500\+/gi, "1,500+");
    processedValue = processedValue.replace(/12,500/g, "1,500");
    processedValue = processedValue.replace(/0% rủi ro/gi, "0% Lo ngại");
    processedValue = processedValue.replace(/0% lo ngại/gi, "0% Lo ngại");
    processedValue = processedValue.replace(/Phong thủy độc bách cát tường/gi, "Phân tích chuyên sâu pháp lý, thị trường");
    processedValue = processedValue.replace(/Giải pháp độc quyền phong thủy/gi, "Phân tích chuyên sâu pháp lý, thị trường");
    processedValue = processedValue.replace(/Đội tuyển đại sư tư vấn địa thế hướng phong, bài bài bài trí rước sinh khí dồi dào tài lộc của gia chủ sâu sắc tinh tường./gi, "Đội ngũ chuyên gia phân tích kỹ lưỡng tiềm năng tăng giá, pháp lý và tính thanh khoản, đảm bảo lợi nhuận và an toàn tuyệt đối cho dòng vốn của nhà đầu tư.");
    setVal(processedValue);
  }, [value]);

  if (!isEditMode) {
    if (!val) return null;
    // Highlight custom gradient syntax: [gradient]Your Text[/gradient]
    const lines = val.split('\n').map((line, lidx) => {
      let content: React.ReactNode = line;
      
      if (line.includes('[gradient]') && line.includes('[/gradient]')) {
        const pre = line.split('[gradient]')[0];
        const inner = line.split('[gradient]')[1].split('[/gradient]')[0];
        const post = line.split('[/gradient]')[1] || '';
        content = (
          <span key={lidx}>
            {pre}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 font-bold">
              {inner}
            </span>
            {post}
          </span>
        );

      
      return <React.Fragment key={lidx}>{content}{lidx < val.split('\n').length - 1 ? <br /> : null}</React.Fragment>;
    });
    return <Tag className={className}>{lines}</Tag>;
  }

  if (editing) {
    if (isArea) {
      return (
        <textarea
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={() => {
            setEditing(false);
            const updated = sections.map(s => {
              if (s.id === sectionId) {
                if (subField) {
                  return { ...s, extraData: { ...s.extraData, [subField]: val } };
                }
                return { ...s, [field]: val };
              }
              return s;
            });
            onUpdateSections(updated);
          }}
          className={`w-full bg-bg-inverse/95 text-slate-100 border border-primary rounded p-2 text-xs outline-none focus:ring-1 focus:ring-yellow-500 font-light resize-none ${className}`}
          autoFocus
          rows={4}
        />
      );
    }
    return (
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => {
          setEditing(false);
          const updated = sections.map(s => {
            if (s.id === sectionId) {
              if (subField) {
                return { ...s, extraData: { ...s.extraData, [subField]: val } };
              }
              return { ...s, [field]: val };
            }
            return s;
          });
          onUpdateSections(updated);
        }}
        className={`w-full bg-bg-inverse/95 text-slate-100 border border-primary rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-yellow-500 ${className}`}
        autoFocus
      />
    );
  }

  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }} 
      className={`group/edit relative cursor-pointer border border-dashed border-primary/15 hover:border-primary/80 p-0.5 rounded transition-all ${className}`}
      title="Nhấp vào để biên tập trực tiếp nội dung"
    >
      <Tag className="inline-block w-full">
        {val ? val.split('\n').map((line, lidx) => (
          <React.Fragment key={lidx}>{line}{lidx < val.split('\n').length - 1 ? <br /> : null}</React.Fragment>
        )) : <span className="opacity-45 italic text-[11px]">(Click để ghi nhận cấu tự)</span>}
      </Tag>
      <div className="absolute top-1 right-1 opacity-0 group-hover/edit:opacity-100 bg-primary text-black p-1 rounded text-[8px] font-extrabold pointer-events-none flex items-center gap-1 shadow-md z-30 transition-opacity">
        <Sparkles className="w-2.5 h-2.5 shrink-0" />
        Sửa
      </div>
    </div>
  );
}


interface EditableImageProps {
  sectionId: string;
  field: string;
  imageUrl: string;
  isEditMode: boolean;
  sections: any[];
  onUpdateSections: (sections: any[]) => void;
  onShowNotification: (message: string, type: 'success' | 'error') => void;
  className?: string;
}

export function EditableImage({
  sectionId,
  field,
  imageUrl,
  isEditMode,
  sections,
  onUpdateSections,
  onShowNotification,
  className = ''
}: EditableImageProps) {
  const [showInput, setShowInput] = useState(false);
  const [url, setUrl] = useState(imageUrl || '');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setUrl(imageUrl || '');
  }, [imageUrl]);

  const handleUrlSubmit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInput(false);
    updateImage(url);
  };

  const updateImage = (newUrl: string) => {
    const updated = sections.map(s => {
      if (s.id === sectionId) {
        return { ...s, [field]: newUrl };
      }
      return s;
    });
    onUpdateSections(updated);
  };

  const handleBase64Upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.onerror = (error) => reject(error);
      });
      reader.readAsDataURL(file);
      const base64 = await base64Promise;

      try {
        const response = await authFetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: file.name,
            base64: base64
          })
        });
        const result = await response.json();
        if (result && result.url) {
          setUrl(result.url);
          updateImage(result.url);
          onShowNotification('Đã tải hình ảnh trực tiếp lên máy chủ!', 'success');
        } else {
          setUrl(base64);
          updateImage(base64);
          onShowNotification('Nhập ảnh gốc cục bộ (Base64) thành công!', 'success');
        }
      } catch {
        setUrl(base64);
        updateImage(base64);
        onShowNotification('Nhập ảnh thành công!', 'success');
      }
    } catch (err) {
      console.error(err);
      onShowNotification('Thiếu sót sự cố khi nạp ảnh.', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`relative group/img ${className}`}>
      {url ? (
        <img loading="lazy" decoding="async" src={(url) || undefined} alt="Bố cục" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <div className="w-full h-full bg-bg-surface border border-border-color flex items-center justify-center text-white/70 text-xs">
          (Trắng)
        </div>
      )}
      {isEditMode && (
        <div className="absolute inset-0 bg-bg-inverse/80 opacity-0 group-hover/img:opacity-100 flex flex-col items-center justify-center transition-all p-3 z-30 space-y-2">
          <p className="text-text-primary text-[10px] font-bold">Cập Nhật Ảnh Sắp Đặt</p>
          
          <div className="flex gap-1.5 justify-center">
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowInput(!showInput);
              }}
              className="bg-primary hover:bg-amber-600 active:scale-95 text-black font-bold px-2 py-1.5 rounded text-[9px] shadow cursor-pointer transition-all border-none"
            >
              Nhập URL
            </button>
            <label className="bg-blue-500 hover:bg-blue-600 active:scale-95 text-text-primary font-bold px-2 py-1.5 rounded text-[9px] shadow cursor-pointer block text-center transition-all">
              Tải Mới
              <input type="file" accept="image/*" onChange={handleBase64Upload} className="hidden" />
            </label>
          </div>

          {uploading && (
            <p className="text-[9px] text-primary animate-pulse">Đang nạp ảnh...</p>
          )}

          {showInput && (
            <div className="w-full max-w-xs bg-bg-surface border border-border-color p-1.5 rounded-lg flex items-center gap-1 shadow-xl mt-1" onClick={e => e.stopPropagation()}>
              <input 
                type="text" 
                value={url} 
                onChange={(e) => setUrl(e.target.value)} 
                placeholder="Link ảnh..." 
                className="bg-bg-surface text-text-primary text-[10px] p-1 rounded flex-1 outline-none border border-border-color focus:border-primary text-left"
              />
              <button 
                type="button"
                onClick={handleUrlSubmit}
                className="bg-primary text-black px-2 py-1.5 rounded text-[10px] font-mono font-bold"
              >
                OK
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
