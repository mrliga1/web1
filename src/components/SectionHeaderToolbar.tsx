import React from 'react';
import { 
  Eye, EyeOff, Trash2, Sparkles, ChevronUp, ChevronDown 
} from 'lucide-react';

interface SectionHeaderToolbarProps {
  section: any;
  sections: any[];
  onUpdateSections: (sections: any[]) => void;
  onShowNotification: (message: string, type: 'success' | 'error') => void;
  index: number;
  setSelectedSectionId: (id: string | null) => void;
}

export default function SectionHeaderToolbar({
  section,
  sections,
  onUpdateSections,
  onShowNotification,
  index,
  setSelectedSectionId
}: SectionHeaderToolbarProps) {
  
  const handleMove = (direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    onUpdateSections(updated);
    onShowNotification("Đã dịch chuyển vị trí khối thành công!", "success");
  };

  const handleToggleVisibility = () => {
    const updated = [...sections];
    updated[index] = {
      ...updated[index],
      visible: !updated[index].visible
    };
    onUpdateSections(updated);
    onShowNotification(
      updated[index].visible ? "Đã đặt hiển thị khối này" : "Đã tạm ẩn khối này",
      "success"
    );
  };

  const handleDelete = () => {
    const updated = sections.filter((_, i) => i !== index);
    onUpdateSections(updated);
    setSelectedSectionId(null);
    onShowNotification(`Đã gỡ bỏ khối "${section.name || section.id}" thành công!`, "success");
  };

  const handleConvertToFreeCanvas = () => {
    const newId = `custom_free_canvas_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Auto-extract content to convert to free-form visual elements
      const elements: any[] = [];
      let topOffset = 10;

      if (section.subtitle) {
        elements.push({
          id: `subtitle_${Date.now()}`,
          type: 'text',
          left: 15,
          top: topOffset,
          width: 70,
          content: section.subtitle,
          style: {
            fontFamily: 'font-sans',
            fontSize: 'xs',
            color: '#10b981',
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '4px'
          }
        });
        topOffset += 8;
      }

      if (section.title) {
        elements.push({
          id: `title_${Date.now()}`,
          type: 'text',
          left: 10,
          top: topOffset,
          width: 80,
          content: section.title,
          style: {
            fontFamily: 'font-display',
            fontSize: '2xl',
            fontWeight: 'extrabold',
            color: '#fbbf24',
            textAlign: 'center',
            padding: '8px'
          }
        });
        topOffset += 12;
      }

      if (section.description) {
        elements.push({
          id: `description_${Date.now()}`,
          type: 'text',
          left: 15,
          top: topOffset,
          width: 70,
          content: section.description,
          style: {
            fontFamily: 'font-sans',
            fontSize: 'xs',
            color: '#d4d4d8',
            textAlign: 'center',
            padding: '6px'
          }
        });
        topOffset += 16;
      }

      if (section.imageUrl) {
        elements.push({
          id: `image_${Date.now()}`,
          type: 'image',
          left: 30,
          top: topOffset,
          width: 40,
          content: section.imageUrl,
          style: {
            borderRadius: '16px',
            borderStyle: 'solid',
            borderWidth: '2px',
            borderColor: '#10b981'
          }
        });
        topOffset += 45;
      }

      // Add a default interactive RSVP Button
      elements.push({
        id: `btn_${Date.now()}`,
        type: 'button',
        left: 35,
        top: Math.min(topOffset, 85),
        width: 30,
        content: section.extraData?.buttonText || 'ĐĂNG KÝ NHẬN TƯ VẤN NGAY',
        linkUrl: '#lien-he',
        style: {
          fontFamily: 'font-display',
          fontSize: 'xs',
          fontWeight: 'bold',
          color: '#0f172a',
          backgroundColor: '#10b981',
          borderRadius: '9999px',
          textAlign: 'center',
          padding: '12px',
          boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.4)'
        }
      });

      const convertedBlock = {
        id: newId,
        name: `Khối tự do: ${section.name || section.id}`,
        visible: true,
        paddingTop: section.paddingTop || 60,
        paddingBottom: section.paddingBottom || 60,
        title: section.title || '',
        subtitle: section.subtitle || '',
        description: section.description || '',
        extraData: {
          canvasHeight: Math.max(650, topOffset + 110),
          elements
        }
      };

      const updated = sections.map((s, i) => i === index ? convertedBlock : s);
      onUpdateSections(updated);
      setSelectedSectionId(newId);
      onShowNotification("Đã chuyển khối thành dạng Kéo Thả Tự Do tuyệt hảo!", "success");
  };

  const isFreeCanvas = section.id.startsWith('custom_free_canvas_');

  return (
    <div 
      className="absolute -top-4 left-3 z-[60] bg-bg-surface border border-primary/40 hover:border-primary rounded-lg px-2.5 py-1.5 flex items-center gap-2.5 shadow-2xl transition-all" 
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center gap-1.5 border-r border-border-color pr-2">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping shrink-0" />
        <span className="font-mono text-[9px] text-primary uppercase font-bold tracking-wider">
          {section.name || section.id}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          disabled={index === 0}
          onClick={() => handleMove('up')}
          className="p-1 text-white/70 hover:text-text-primary hover:bg-bg-base rounded disabled:opacity-20 cursor-pointer transition-colors border-none bg-transparent"
          title="Di chuyển lên"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          disabled={index === sections.length - 1}
          onClick={() => handleMove('down')}
          className="p-1 text-white/70 hover:text-text-primary hover:bg-bg-base rounded disabled:opacity-20 cursor-pointer transition-colors border-none bg-transparent"
          title="Di chuyển xuống"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleToggleVisibility}
          className={`p-1 rounded cursor-pointer transition-all border-none bg-transparent ${
            section.visible ? 'text-primary hover:bg-[#064E3B]/10' : 'text-slate-505 hover:text-text-primary hover:bg-bg-base'
          }`}
          title={section.visible ? "Ẩn khối" : "Hiện khối"}
        >
          {section.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>

        {!isFreeCanvas && (
          <button
            onClick={handleConvertToFreeCanvas}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#064E3B]/10 hover:bg-primary text-primary hover:text-black text-[9px] font-bold tracking-wide transition-all cursor-pointer border border-solid border-primary/20"
            title="Biến đổi khối này thành Kéo thả tự do để tùy biến chữ, ảnh, nút bấm không giới hạn"
          >
            <Sparkles className="w-3 h-3 shrink-0" />
            <span>Kéo Thả Tự Do</span>
          </button>
        )}

        <button
          onClick={handleDelete}
          className="p-1 text-error hover:text-rose-400 hover:bg-error/10 rounded cursor-pointer transition-colors border-none bg-transparent"
          title="Xóa khối hoàn toàn"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
