import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Trash2, Sliders, Type, Image, Link, Table, Square, 
  Move, Settings, Maximize2, Palette, Sparkles, ChevronDown, Check, GripVertical, Upload,
  Copy, ArrowUp, ArrowDown, RotateCcw, Video, Map, List, HelpCircle, CheckCircle, Flame,
  Home, Phone, Mail, Award, Heart, MapPin, Calendar, DollarSign, Users, Clock, ShieldCheck, Play, Star
} from 'lucide-react';
import { VisualSection } from '../types';

interface CountdownTickerProps {
  targetDate: string;
  color?: string;
  backgroundColor?: string;
}

function CountdownTicker({ targetDate, color, backgroundColor }: CountdownTickerProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    function calculate() {
      const difference = +new Date(targetDate) - +new Date();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      });
    }

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const blockStyle = {
    color: color || '#fbbf24',
    backgroundColor: backgroundColor || '#020617',
    borderColor: '#334155',
    borderWidth: '1px',
    borderStyle: 'solid' as const
  };

  return (
    <div className="flex items-center justify-center gap-2 font-mono text-center select-none py-1 w-full">
      <div className="flex flex-col items-center">
        <div style={blockStyle} className="px-2 py-1 rounded-lg text-xs sm:text-sm font-extrabold shadow-md min-w-[32px]">
          {String(timeLeft.days).padStart(2, '0')}
        </div>
        <span className="text-[7px] text-slate-400 uppercase mt-0.5 tracking-wider">Ngày</span>
      </div>
      <span className="text-slate-500 font-extrabold text-xs translate-y-[-4px]">:</span>
      <div className="flex flex-col items-center">
        <div style={blockStyle} className="px-2 py-1 rounded-lg text-xs sm:text-sm font-extrabold shadow-md min-w-[32px]">
          {String(timeLeft.hours).padStart(2, '0')}
        </div>
        <span className="text-[7px] text-slate-400 uppercase mt-0.5 tracking-wider">Giờ</span>
      </div>
      <span className="text-slate-500 font-extrabold text-xs translate-y-[-4px]">:</span>
      <div className="flex flex-col items-center">
        <div style={blockStyle} className="px-2 py-1 rounded-lg text-xs sm:text-sm font-extrabold shadow-md min-w-[32px]">
          {String(timeLeft.minutes).padStart(2, '0')}
        </div>
        <span className="text-[7px] text-slate-400 uppercase mt-0.5 tracking-wider">Phút</span>
      </div>
      <span className="text-slate-500 font-extrabold text-xs translate-y-[-4px]">:</span>
      <div className="flex flex-col items-center">
        <div style={blockStyle} className="px-2 py-1 rounded-lg text-xs sm:text-sm font-extrabold shadow-md min-w-[32px]">
          {String(timeLeft.seconds).padStart(2, '0')}
        </div>
        <span className="text-[7px] text-slate-400 uppercase mt-0.5 tracking-wider">Giây</span>
      </div>
    </div>
  );
}

interface AccordionWidgetProps {
  items: { title: string; content: string }[];
  color?: string;
  backgroundColor?: string;
}

function AccordionWidget({ items, color, backgroundColor }: AccordionWidgetProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!items || items.length === 0) {
    return <div className="text-[10px] text-slate-500 p-2">Danh sách trống</div>;
  }

  return (
    <div className="space-y-1 w-full text-left">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div 
            key={idx} 
            style={{ backgroundColor: backgroundColor || '#1e293b' }}
            className="rounded-lg border border-slate-800/80 overflow-hidden transition-all duration-200 shadow-sm"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="w-full px-3 py-2 flex items-center justify-between text-left font-semibold text-[10px] hover:brightness-110 active:brightness-95 select-none transition-all cursor-pointer border-none"
              style={{ color: color || '#f8fafc', backgroundColor: 'transparent' }}
            >
              <span className="line-clamp-1">{item.title}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-amber-400' : 'text-slate-400'}`} />
            </button>
            {isOpen && (
              <div className="px-3 pb-2 pt-0.5 text-[9px] text-slate-300 leading-relaxed font-light border-t border-slate-800/40">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface VisualDragCanvasProps {
  section: VisualSection;
  isEditMode: boolean;
  onUpdateSections: (sections: any[]) => void;
  sections: any[];
  onShowNotification: (message: string, type: 'success' | 'error') => void;
}

interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'button' | 'table' | 'box' | 'icon' | 'form' | 'video' | 'map' | 'line' | 'countdown' | 'html' | 'accordion' | 'list';
  left: number; // percentage
  top: number;  // percentage
  width: number; // percentage
  content: string; // text content, or icon string, or video url
  style: {
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    borderRadius?: string;
    padding?: string;
    borderStyle?: string;
    borderWidth?: string;
    borderColor?: string;
    textAlign?: string;
    zIndex?: string;
    boxShadow?: string;
    opacity?: string;
  };
  linkUrl?: string;
  tableData?: {
    headers: string[];
    rows: string[][];
  };
  extraConfig?: {
    countdownTarget?: string;
    rawHtml?: string;
    listItems?: string[];
    accordionItems?: { title: string; content: string }[];
    lineColor?: string;
    lineStyle?: 'solid' | 'dashed' | 'dotted';
    lineHeight?: string;
  };
}

export default function VisualDragCanvas({
  section,
  isEditMode,
  sections,
  onUpdateSections,
  onShowNotification
}: VisualDragCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Custom height & Background options
  const canvasHeight = section.extraData?.canvasHeight || 600;
  const bgType = section.extraData?.bgType || 'color';
  const bgColor = section.extraData?.bgColor || '#020617';
  const bgGradient = section.extraData?.bgGradient || 'linear-gradient(to bottom, #020617, #0f172a)';
  const bgImageUrl = section.extraData?.bgImageUrl || '';

  // Real Local state for elements to prevent Firestore async rate limit flickering & rollback during mouse drag move
  const [localElements, setLocalElements] = useState<CanvasElement[]>(() => {
    return section.extraData?.elements || [
      {
        id: 'title_1',
        type: 'text',
        left: 10,
        top: 8,
        width: 80,
        content: 'QUỸ CĂN CHATEAU & ĐẤT NỀN THẢO ĐIỀN ĐỘC QUYỆN',
        style: { fontFamily: 'font-display', fontSize: '2xl', fontWeight: 'extrabold', color: '#fbbf24', textAlign: 'center' }
      },
      {
        id: 'subtitle_1',
        type: 'text',
        left: 15,
        top: 20,
        width: 70,
        content: 'Nhận bảng thẩm định phong thủy và long sinh vượng khí từ Ban Trị sự Greenia Homes',
        style: { fontFamily: 'font-sans', fontSize: 'xs', color: '#94a3b8', textAlign: 'center' }
      },
      {
        id: 'btn_1',
        type: 'button',
        left: 35,
        top: 80,
        width: 30,
        content: 'LIÊN HỆ KHẢO SÁT PHONG THỦY NGAY',
        linkUrl: '#lien-he',
        style: { fontFamily: 'font-display', fontSize: 'xs', fontWeight: 'bold', color: '#020617', backgroundColor: '#10b981', borderRadius: '9999px', padding: '12px', textAlign: 'center' }
      }
    ];
  });

  const elements = localElements;

  const elementsRef = useRef<CanvasElement[]>(elements);
  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  // Sync elements when the prop changes (due to page swap or initial data loading)
  useEffect(() => {
    if (section.extraData?.elements) {
      setLocalElements(section.extraData.elements);
    }
  }, [section.id, section.extraData?.elements]);

  const [selectedElemId, setSelectedElemId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Undo/Redo historical snapshots stack
  const [history, setHistory] = useState<CanvasElement[][]>([]);
  const [historyPointer, setHistoryPointer] = useState<number>(-1);

  // Visitors subscription lead form fields state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formZone, setFormZone] = useState('Biệt thự Chateau');
  const [showFormSuccess, setShowFormSuccess] = useState(false);
  const [formSuccessDetail, setFormSuccessDetail] = useState<any>(null);

  // Admin Leads management state
  const [showLeadsList, setShowLeadsList] = useState(false);
  const [loadedLeads, setLoadedLeads] = useState<any[]>([]);

  const dragInfo = useRef<{
    elemId: string;
    originalX: number;
    originalY: number;
    startX: number;
    startY: number;
  } | null>(null);

  useEffect(() => {
    if (history.length === 0 && elements.length > 0) {
      setHistory([elements]);
      setHistoryPointer(0);
    }
  }, [section.id]);

  const saveElements = (updatedElements: CanvasElement[], isHistoryAction = false) => {
    setLocalElements(updatedElements);
    const updated = sections.map(s => {
      if (s.id === section.id) {
        return { ...s, extraData: { ...s.extraData, elements: updatedElements } };
      }
      return s;
    });
    onUpdateSections(updated);

    if (!isHistoryAction) {
      const nextHist = history.slice(0, historyPointer + 1);
      nextHist.push(updatedElements);
      setHistory(nextHist);
      setHistoryPointer(nextHist.length - 1);
    }
  };

  const handleUndo = () => {
    if (historyPointer > 0) {
      const prevPt = historyPointer - 1;
      setHistoryPointer(prevPt);
      saveElements(history[prevPt], true);
      onShowNotification('Đã lùi thao tác trước (Undo)', 'success');
    }
  };

  const handleRedo = () => {
    if (historyPointer < history.length - 1) {
      const nextPt = historyPointer + 1;
      setHistoryPointer(nextPt);
      saveElements(history[nextPt], true);
      onShowNotification('Phục hồi thao tác vừa hủy (Redo)', 'success');
    }
  };

  // Keyboard micro-positioning listener using Arrow Keys
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isEditMode || !selectedElemId) return;
      
      const activeTagName = document.activeElement?.tagName.toLowerCase();
      if (activeTagName === 'input' || activeTagName === 'textarea' || activeTagName === 'select') {
        return;
      }

      const active = elementsRef.current.find(el => el.id === selectedElemId);
      if (!active) return;

      let deltaLeft = 0;
      let deltaTop = 0;
      const step = e.shiftKey ? 5 : 1; // Shifts move by 5%, normal arrows by 1%

      switch (e.key) {
        case 'ArrowUp':
          deltaTop = -step;
          e.preventDefault();
          break;
        case 'ArrowDown':
          deltaTop = step;
          e.preventDefault();
          break;
        case 'ArrowLeft':
          deltaLeft = -step;
          e.preventDefault();
          break;
        case 'ArrowRight':
          deltaLeft = step;
          e.preventDefault();
          break;
        default:
          return;
      }

      const newLeft = Math.max(0, Math.min(100 - active.width, active.left + deltaLeft));
      const newTop = Math.max(0, Math.min(95, active.top + deltaTop));

      const updated = elementsRef.current.map(el => {
        if (el.id === selectedElemId) {
          return { ...el, left: newLeft, top: newTop };
        }
        return el;
      });
      
      saveElements(updated);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditMode, selectedElemId]);

  // Protect page (disable copy / right click based on vietnamese LadiPage.vn standards)
  useEffect(() => {
    if (isEditMode || !section.extraData?.preventCopy) return;

    const preventDefault = (e: Event) => e.preventDefault();
    const preventKeys = (e: KeyboardEvent) => {
      // Prevent Ctrl+C, Ctrl+U, Ctrl+S, F12 inside preview mode to protect content
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'u' || e.key === 's' || e.key === 'a')) ||
        e.key === 'F12'
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('selectstart', preventDefault);
    document.addEventListener('keydown', preventKeys);

    return () => {
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('selectstart', preventDefault);
      document.removeEventListener('keydown', preventKeys);
    };
  }, [isEditMode, section.extraData?.preventCopy]);

  const handleCanvasOptionChange = (key: string, value: any) => {
    const updated = sections.map(s => {
      if (s.id === section.id) {
        return {
          ...s,
          extraData: {
            ...s.extraData,
            [key]: value
          }
        };
      }
      return s;
    });
    onUpdateSections(updated);
  };

  // Add a new element to the canvas
  const handleAddNewElement = (type: CanvasElement['type']) => {
    const defaultStyles: Record<string, any> = {
      text: { fontFamily: 'font-sans', fontSize: 'sm', fontWeight: 'normal', color: '#f8fafc', padding: '4px' },
      image: { borderRadius: '12px' },
      button: { fontFamily: 'font-display', fontSize: 'xs', fontWeight: 'bold', color: '#020617', backgroundColor: '#10b981', borderRadius: '12px', padding: '10px', textAlign: 'center' },
      table: { fontSize: 'xs', color: '#e2e8f0', backgroundColor: '#1e293b', borderRadius: '12px', padding: '8px', borderStyle: 'solid', borderWidth: '1px', borderColor: '#475569' },
      box: { backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: '16px', borderStyle: 'solid', borderWidth: '1px', borderColor: '#475569', padding: '12px' },
      icon: { color: '#fbbf24', backgroundColor: 'transparent' },
      form: { backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRadius: '24px', borderColor: '#334155', borderStyle: 'solid', borderWidth: '1px', padding: '16px' },
      video: { borderRadius: '16px' },
      map: { borderRadius: '16px' },
      line: { color: '#475569' },
      countdown: { fontFamily: 'font-mono', fontSize: 'lg', color: '#fbbf24', backgroundColor: '#0f172a', borderRadius: '12px', padding: '12px' },
      html: { borderRadius: '12px' },
      accordion: { borderRadius: '12px', padding: '8px' },
      list: { fontFamily: 'font-sans', fontSize: 'xs', color: '#e2e8f0' }
    };

    const newId = `${type}_${Date.now()}`;
    const newElement: CanvasElement = {
      id: newId,
      type,
      left: 15,
      top: 40,
      width: type === 'table' || type === 'form' || type === 'accordion' ? 45 : type === 'text' || type === 'countdown' ? 40 : 20,
      content: type === 'text' ? 'Nhấp đúp để biên tập nội dung...' :
               type === 'image' ? 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=400' :
               type === 'button' ? 'NÚT ĐĂNG KÝ NGAY' :
               type === 'icon' ? 'star' :
               type === 'video' ? 'https://www.youtube.com/embed/dQw4w9WgXcQ' : '',
      style: defaultStyles[type] || {},
      linkUrl: type === 'button' ? '#lien-he' : undefined,
      tableData: type === 'table' ? {
        headers: ['Tiêu đề 1', 'Tiêu đề 2', 'Báo giá'],
        rows: [
          ['Sản phẩm A', '320 m²', '12 Tỷ'],
          ['Sản phẩm B', '405 m²', '15 Tỷ']
        ]
      } : undefined,
      extraConfig: type === 'countdown' ? {
        countdownTarget: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16), // 3 days from now
      } : type === 'html' ? {
        rawHtml: `<div style="padding:20px; text-align:center; background:#1e293b; color:#10b981; border-radius:12px; font-weight:bold;">
  <h3>🎁 ĐẶC QUYỀN VIP</h3>
  <p>Nhập mã <span style="color:#fbbf24">GOLDMEDAL</span> giảm ngay 1.2 Tỷ khi ký hợp đồng tuần này!</p>
</div>`
      } : type === 'accordion' ? {
        accordionItems: [
          { title: 'Pháp lý căn Chateau ra sao?', content: 'Sổ hồng lâu dài, đã hoàn công đầy đủ, sẵn sàng sang tên trong ngày.' },
          { title: 'Mật độ xây dựng bao nhiêu %?', content: 'Mật độ xây dựng chỉ 19%, còn lại là công viên sinh thái ven sông và dải cây xanh mát lạnh.' },
          { title: 'Có hỗ trợ phong thủy không?', content: 'Có chuyên gia phong thủy bồi cát đón vượng khí tư vấn đo đạc hướng cổng và minh đường trực tiếp cho gia chủ.' }
        ]
      } : type === 'list' ? {
        listItems: [
          'Biệt thự Chateau ven sông đẳng cấp bậc nhất',
          'Tầm nhìn trọn vẹn dải công viên xanh Phú Mỹ Hưng',
          'Bảo vệ 3 lớp tuần tra 24/7 tuyệt đối bảo mật',
          'Có bể bơi tràn bờ và bến du thuyền riêng biệt'
        ]
      } : type === 'line' ? {
        lineColor: '#475569',
        lineStyle: 'solid',
        lineHeight: '2px'
      } : undefined
    };

    const updated = [...elements, newElement];
    saveElements(updated);
    setSelectedElemId(newId);
    onShowNotification(`Đã tạo phần tử "${type.toUpperCase()}"`, 'success');
  };

  // Duplicate active element
  const handleDuplicateElement = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const active = elements.find(el => el.id === selectedElemId);
    if (!active) return;

    const newId = `${active.type}_${Date.now()}`;
    const duplicate: CanvasElement = {
      ...active,
      id: newId,
      left: Math.min(85, active.left + 5),
      top: Math.min(85, active.top + 5),
    };

    const updated = [...elements, duplicate];
    saveElements(updated);
    setSelectedElemId(newId);
    onShowNotification(`Đã nhân bản phần tử "${active.type.toUpperCase()}"`, 'success');
  };

  // Delete element logic
  const handleDeleteElement = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = elements.filter(el => el.id !== id);
    saveElements(updated);
    setSelectedElemId(null);
    onShowNotification('Đã gỡ bỏ thành phần thành công! (Bạn có thể nhấn Lùi thao tác / Undo nếu xóa nhầm)', 'success');
  };

  // Drag handles management
  const startDrag = (elemId: string, clientX: number, clientY: number) => {
    if (!isEditMode) return;
    setSelectedElemId(elemId);
    const target = elements.find(el => el.id === elemId);
    if (!target) return;

    dragInfo.current = {
      elemId,
      originalX: target.left,
      originalY: target.top,
      startX: clientX,
      startY: clientY
    };
    setIsDragging(true);
  };

  const onDrag = (clientX: number, clientY: number) => {
    if (!isDragging || !dragInfo.current || !canvasRef.current) return;
    const info = dragInfo.current;
    const rect = canvasRef.current.getBoundingClientRect();
    
    const deltaX = clientX - info.startX;
    const deltaY = clientY - info.startY;

    setLocalElements(prev => {
      const target = prev.find(el => el.id === info.elemId);
      if (!target) return prev;

      let newLeft = Math.round(info.originalX + (deltaX / rect.width) * 100);
      let newTop = Math.round(info.originalY + (deltaY / rect.height) * 100);

      newLeft = Math.max(0, Math.min(100 - target.width, newLeft));
      newTop = Math.max(0, Math.min(95, newTop));

      return prev.map(el => {
        if (el.id === info.elemId) {
          return { ...el, left: newLeft, top: newTop };
        }
        return el;
      });
    });
  };

  const endDrag = () => {
    if (isDragging) {
      setIsDragging(false);
      dragInfo.current = null;
      // Persist coordinate modification back to Firestore once release drag click
      saveElements(elementsRef.current);
    }
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent) => onDrag(e.clientX, e.clientY);
    const handleUp = () => endDrag();
    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging]);

  const selectedElem = elements.find(el => el.id === selectedElemId);

  const updateStyle = (key: string, val: string) => {
    if (!selectedElemId) return;
    const updated = elements.map(el => {
      if (el.id === selectedElemId) {
        return { ...el, style: { ...el.style, [key]: val } };
      }
      return el;
    });
    saveElements(updated);
  };

  const updateContent = (val: string) => {
    if (!selectedElemId) return;
    const updated = elements.map(el => {
      if (el.id === selectedElemId) {
        return { ...el, content: val };
      }
      return el;
    });
    saveElements(updated);
  };

  const updateLinkUrl = (val: string) => {
    if (!selectedElemId) return;
    const updated = elements.map(el => {
      if (el.id === selectedElemId) {
        return { ...el, linkUrl: val };
      }
      return el;
    });
    saveElements(updated);
  };

  const updateWidth = (val: number) => {
    if (!selectedElemId) return;
    const updated = elements.map(el => {
      if (el.id === selectedElemId) {
        return { ...el, width: Math.min(100, Math.max(5, val)) };
      }
      return el;
    });
    saveElements(updated);
  };

  const updateExtraConfig = (key: string, val: any) => {
    if (!selectedElemId) return;
    const updated = elements.map(el => {
      if (el.id === selectedElemId) {
        return {
          ...el,
          extraConfig: {
            ...(el.extraConfig || {}),
            [key]: val
          }
        };
      }
      return el;
    });
    saveElements(updated);
  };

  // Accordion manipulation sub-helpers
  const addAccordionItem = () => {
    if (!selectedElem) return;
    const existing = selectedElem.extraConfig?.accordionItems || [];
    const updated = [...existing, { title: 'Tiêu đề câu hỏi mới', content: 'Nội dung giải đáp...' }];
    updateExtraConfig('accordionItems', updated);
  };

  const editAccordionItem = (index: number, key: 'title' | 'content', val: string) => {
    if (!selectedElem) return;
    const existing = [...(selectedElem.extraConfig?.accordionItems || [])];
    if (existing[index]) {
      existing[index] = { ...existing[index], [key]: val };
      updateExtraConfig('accordionItems', existing);
    }
  };

  const deleteAccordionItem = (index: number) => {
    if (!selectedElem) return;
    const existing = (selectedElem.extraConfig?.accordionItems || []).filter((_, idx) => idx !== index);
    updateExtraConfig('accordionItems', existing);
  };

  // List manipulation sub-helpers
  const addListItem = () => {
    if (!selectedElem) return;
    const existing = selectedElem.extraConfig?.listItems || [];
    const updated = [...existing, 'Dòng thông tin liệt kê mới'];
    updateExtraConfig('listItems', updated);
  };

  const editListItem = (index: number, val: string) => {
    if (!selectedElem) return;
    const existing = [...(selectedElem.extraConfig?.listItems || [])];
    existing[index] = val;
    updateExtraConfig('listItems', existing);
  };

  const deleteListItem = (index: number) => {
    if (!selectedElem) return;
    const existing = (selectedElem.extraConfig?.listItems || []).filter((_, idx) => idx !== index);
    updateExtraConfig('listItems', existing);
  };

  // Base64 file uploader
  const handleLocalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedElemId) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      updateContent(base64);
      onShowNotification('Đã tải hình ảnh thành công.', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Table manipulation helpers
  const updateTableCell = (rIdx: number, cIdx: number, val: string) => {
    if (!selectedElem || !selectedElem.tableData) return;
    const newRows = [...selectedElem.tableData.rows];
    newRows[rIdx] = [...newRows[rIdx]];
    newRows[rIdx][cIdx] = val;
    const updated = elements.map(el => {
      if (el.id === selectedElemId) {
        return { ...el, tableData: { ...el.tableData!, rows: newRows } };
      }
      return el;
    });
    saveElements(updated);
  };

  const loadPresetBocuc = (presetIdx: number) => {
    const presetsList = [
      {
        name: 'Luxury Hero Banner',
        elements: [
          { id: 'h_1', type: 'text', left: 10, top: 12, width: 80, content: 'GREENIA ROYAL MANSIONS\nNƠI HỘI TỤ ĐẾ VƯƠNG KHÍ', style: { fontFamily: 'font-display', fontSize: '3xl', fontWeight: 'extrabold', color: '#fbbf24', textAlign: 'center' } },
          { id: 'h_2', type: 'text', left: 15, top: 38, width: 70, content: 'Bảo chứng phú quý bởi dòng chảy đồi phù sa tự nhiên mát lạnh.', style: { fontFamily: 'font-sans', fontSize: 'sm', color: '#cbd5e1', textAlign: 'center' } },
          { id: 'h_3', type: 'button', left: 38, top: 62, width: 24, content: 'ĐẶT LỊCH THĂM QUAN', linkUrl: '#lien-he', style: { fontFamily: 'font-display', fontSize: 'xs', fontWeight: 'bold', color: '#020617', backgroundColor: '#fbbf24', borderRadius: '9999px', padding: '12px', textAlign: 'center' } }
        ]
      },
      {
        name: 'Lead Form & Sơ đồ Bản đồ',
        elements: [
          { id: 'f_t', type: 'text', left: 5, top: 8, width: 90, content: 'ĐĂNG KÝ THẢM KHẢO PHONG THỦY CHI TIẾT', style: { fontFamily: 'font-display', fontSize: 'lg', fontWeight: 'bold', color: '#10b981', textAlign: 'center' } },
          { id: 'f_m', type: 'map', left: 5, top: 22, width: 42, content: '', style: { borderRadius: '20px' } },
          { id: 'f_f', type: 'form', left: 53, top: 22, width: 42, content: 'ĐĂNG KÝ KHẢO SÁT CHATEAU VIP', style: {} }
        ]
      }
    ];

    const target = presetsList[presetIdx];
    if (target) {
      saveElements(target.elements as any);
      setSelectedElemId(null);
      onShowNotification(`Đã tải bộ bố cục "${target.name}" thành công!`, 'success');
    }
  };

  const viewSubmissions = () => {
    const list = JSON.parse(localStorage.getItem('ladipage_submitted_leads') || '[]');
    setLoadedLeads(list);
    setShowLeadsList(true);
  };

  const renderIcon = (name: string, color: string) => {
    const props = { className: 'w-6 h-6 shrink-0', style: { color } };
    switch (name) {
      case 'home': return <Home {...props} />;
      case 'phone': return <Phone {...props} />;
      case 'mail': return <Mail {...props} />;
      case 'star': return <Star {...props} />;
      case 'award': return <Award {...props} />;
      case 'heart': return <Heart {...props} />;
      case 'map-pin': return <MapPin {...props} />;
      case 'calendar': return <Calendar {...props} />;
      case 'dollar': return <DollarSign {...props} />;
      case 'users': return <Users {...props} />;
      case 'clock': return <Clock {...props} />;
      case 'shield': return <ShieldCheck {...props} />;
      default: return <Sparkles {...props} />;
    }
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 text-left" id={`drag-canvas-container-${section.id}`} onClick={() => setSelectedElemId(null)}>
      
      {/* Editor Controls Overlay */}
      {isEditMode && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-4 space-y-3 shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-mono font-extrabold bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-full uppercase mr-2 shrink-0">
                LadiPage Visual Builder
              </span>
              
              <button onClick={() => handleAddNewElement('text')} className="bg-slate-950 text-slate-350 hover:text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shrink-0 border border-slate-850 cursor-pointer">
                <Type className="w-3.5 h-3.5 text-amber-400" /> Chữ
              </button>
              <button onClick={() => handleAddNewElement('image')} className="bg-slate-950 text-slate-350 hover:text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shrink-0 border border-slate-850 cursor-pointer">
                <Image className="w-3.5 h-3.5 text-blue-400" /> Ảnh
              </button>
              <button onClick={() => handleAddNewElement('button')} className="bg-slate-950 text-slate-350 hover:text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shrink-0 border border-slate-850 cursor-pointer">
                <Link className="w-3.5 h-3.5 text-yellow-400" /> Nút
              </button>
              <button onClick={() => handleAddNewElement('icon')} className="bg-slate-950 text-slate-350 hover:text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shrink-0 border border-slate-850 cursor-pointer">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" /> Icon
              </button>
              <button onClick={() => handleAddNewElement('form')} className="bg-slate-950 text-slate-350 hover:text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shrink-0 border border-slate-850 cursor-pointer">
                <Phone className="w-3.5 h-3.5 text-amber-500" /> Đăng ký
              </button>
              <button onClick={() => handleAddNewElement('table')} className="bg-slate-950 text-slate-350 hover:text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shrink-0 border border-slate-850 cursor-pointer">
                <Table className="w-3.5 h-3.5 text-purple-400" /> Bảng
              </button>
              <button onClick={() => handleAddNewElement('box')} className="bg-slate-950 text-slate-350 hover:text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shrink-0 border border-slate-850 cursor-pointer">
                <Square className="w-3.5 h-3.5 text-gray-400" /> Khung
              </button>
              <button onClick={() => handleAddNewElement('video')} className="bg-slate-950 text-slate-350 hover:text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shrink-0 border border-slate-850 cursor-pointer">
                <Video className="w-3.5 h-3.5 text-red-400" /> Video
              </button>
              <button onClick={() => handleAddNewElement('map')} className="bg-slate-950 text-slate-350 hover:text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shrink-0 border border-slate-850 cursor-pointer">
                <Map className="w-3.5 h-3.5 text-cyan-400" /> Bản đồ
              </button>
              <button onClick={() => handleAddNewElement('line')} className="bg-slate-950 text-slate-350 hover:text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shrink-0 border border-slate-850 cursor-pointer">
                <Sliders className="w-3.5 h-3.5 text-slate-400" /> Kẻ ngang
              </button>
              <button onClick={() => handleAddNewElement('countdown')} className="bg-slate-950 text-slate-350 hover:text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shrink-0 border border-slate-850 cursor-pointer">
                <Clock className="w-3.5 h-3.5 text-pink-400" /> Đếm ngược
              </button>
              <button onClick={() => handleAddNewElement('html')} className="bg-slate-950 text-slate-350 hover:text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shrink-0 border border-slate-850 cursor-pointer">
                <Maximize2 className="w-3.5 h-3.5 text-amber-400" /> Mã HTML
              </button>
              <button onClick={() => handleAddNewElement('accordion')} className="bg-slate-950 text-slate-350 hover:text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shrink-0 border border-slate-850 cursor-pointer">
                <List className="w-3.5 h-3.5 text-indigo-400" /> Hỏi-Đáp
              </button>
              <button onClick={() => handleAddNewElement('list')} className="bg-slate-950 text-slate-350 hover:text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shrink-0 border border-slate-850 cursor-pointer">
                <CheckCircle className="w-3.5 h-3.5 text-amber-500" /> Danh sách
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={handleUndo} disabled={historyPointer <= 0} className="p-2 rounded bg-slate-950 text-slate-300 disabled:opacity-25 hover:text-white cursor-pointer" title="Undo">
                <RotateCcw className="w-4 h-4" />
              </button>
              <button onClick={handleRedo} disabled={historyPointer >= history.length - 1} className="p-2 rounded bg-slate-950 text-slate-300 disabled:opacity-25 hover:text-white cursor-pointer" title="Redo">
                <RotateCcw className="w-4 h-4 scale-x-[-1]" />
              </button>
              <button onClick={viewSubmissions} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer">
                VIP Leads list
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1 border-t border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span>Bố cục mẫu:</span>
              <select onChange={e => { if(e.target.value) loadPresetBocuc(parseInt(e.target.value)) }} className="bg-slate-950 text-slate-200 p-1.5 rounded-lg w-full outline-none">
                <option value="">-- Chọn bố cục mẫu --</option>
                <option value="0">Luxury Hero Banner</option>
                <option value="1">Form & Sơ đồ Bản đồ</option>
                <option value="2">Báo Giá & Bảng số</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span>Nền LadiPage:</span>
              <select value={bgType} onChange={e => handleCanvasOptionChange('bgType', e.target.value)} className="bg-slate-950 text-slate-200 p-1.5 rounded-lg w-full outline-none">
                <option value="color">Màu sắc</option>
                <option value="gradient">Gradient</option>
                <option value="image">Hình ảnh</option>
              </select>
              {bgType === 'color' && (
                <input type="color" value={bgColor} onChange={e => handleCanvasOptionChange('bgColor', e.target.value)} className="w-6 h-6 border-none cursor-pointer shrink-0" />
              )}
            </div>

            <div className="flex items-center gap-2">
              <span>Chống Copy:</span>
              <select 
                value={section.extraData?.preventCopy ? "enabled" : "disabled"} 
                onChange={e => handleCanvasOptionChange('preventCopy', e.target.value === 'enabled')} 
                className="bg-slate-950 text-slate-200 p-1.5 rounded-lg w-full outline-none text-xs"
              >
                <option value="disabled">Mở sao chép</option>
                <option value="enabled">Chống chuột phải & Copy</option>
              </select>
            </div>

            <div className="flex items-center gap-2 md:justify-end">
              <span>Chiều cao:</span>
              <input type="range" min="400" max="1100" step="50" value={canvasHeight} onChange={e => handleCanvasOptionChange('canvasHeight', parseInt(e.target.value))} className="w-24 accent-emerald-500" />
              <span className="font-mono shrink-0">{canvasHeight}px</span>
            </div>
          </div>
        </div>
      )}

      {/* Main editor and canvas board grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        
        {/* Canvas Area */}
        <div 
          className={`xl:col-span-${selectedElem ? '8' : '12'} transition-all relative rounded-lg overflow-hidden shadow-2xl border border-slate-850`}
          style={{
            height: `${canvasHeight}px`,
            backgroundColor: bgType === 'color' ? bgColor : undefined,
            backgroundImage: bgType === 'image' && bgImageUrl 
              ? `url(${bgImageUrl})` 
              : bgType === 'gradient' 
                ? bgGradient 
                : isEditMode 
                  ? 'radial-gradient(#1e293b 1px, transparent 1px)' 
                  : 'none',
            backgroundSize: bgType === 'image' ? 'cover' : '20px 20px',
            backgroundPosition: 'center',
            borderColor: selectedElemId ? '#10b981' : undefined
          }}
          ref={canvasRef}
          onClick={() => setSelectedElemId(null)}
        >
          {elements.map((el) => {
            const isSelected = selectedElemId === el.id;
            let innerContent = null;

            if (el.type === 'text') {
              innerContent = (
                <div 
                  style={{
                    fontFamily: el.style.fontFamily === 'font-serif' ? 'Playfair Display, serif' : 
                                el.style.fontFamily === 'font-mono' ? 'JetBrains Mono, monospace' : 'Inter, sans-serif',
                    fontSize: el.style.fontSize === 'xs' ? '12px' : 
                              el.style.fontSize === 'sm' ? '14px' :
                              el.style.fontSize === 'base' ? '16px' :
                              el.style.fontSize === 'lg' ? '18px' :
                              el.style.fontSize === 'xl' ? '20px' :
                              el.style.fontSize === '2xl' ? '25px' : '32px',
                    fontWeight: el.style.fontWeight === 'bold' ? '700' : el.style.fontWeight === 'extrabold' ? '900' : '400',
                    color: el.style.color || '#ffffff',
                    backgroundColor: el.style.backgroundColor || 'transparent',
                    borderRadius: el.style.borderRadius || '0px',
                    padding: el.style.padding || '0px',
                    textAlign: (el.style.textAlign || 'left') as any
                  }}
                  className="w-full break-words whitespace-pre-wrap leading-tight"
                >
                  {el.content}
                </div>
              );
            } else if (el.type === 'image') {
              innerContent = (
                <div style={{ borderRadius: el.style.borderRadius || '12px', overflow: 'hidden' }} className="w-full aspect-[4/3] bg-slate-900">
                  {el.content ? (
                    <img src={(el.content) || undefined} alt="Visual" className="w-full h-full object-cover select-none" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">Hình ảnh rỗng</div>
                  )}
                </div>
              );
            } else if (el.type === 'button') {
              innerContent = (
                <button
                  type="button"
                  onClick={() => { if(!isEditMode && el.linkUrl) window.location.hash = el.linkUrl.replace('#',''); }}
                  style={{
                    color: el.style.color || '#000000',
                    backgroundColor: el.style.backgroundColor || '#10b981',
                    borderRadius: el.style.borderRadius || '12px',
                    padding: el.style.padding || '10px 14px',
                  }}
                  className="w-full font-bold uppercase tracking-wider text-xs cursor-pointer active:scale-95 transition-transform"
                >
                  {el.content}
                </button>
              );
            } else if (el.type === 'icon') {
              innerContent = (
                <div className="flex justify-center items-center">
                  {renderIcon(el.content, el.style.color || '#fbbf24')}
                </div>
              );
            } else if (el.type === 'form') {
              innerContent = (
                <div 
                  style={{
                    backgroundColor: el.style.backgroundColor || 'rgba(15, 23, 42, 0.95)',
                    borderRadius: el.style.borderRadius || '24px',
                    borderColor: el.style.borderColor || '#334155',
                    borderStyle: el.style.borderStyle || 'solid',
                    borderWidth: el.style.borderWidth || '1px',
                    padding: el.style.padding || '16px'
                  }}
                  className="w-full space-y-3 shrink-1"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="text-center">
                    <h5 className="text-[12px] font-bold uppercase text-amber-400">{el.content || 'ĐĂNG KÝ QUY TRÌNH PHONG THỦY'}</h5>
                    <p className="text-[9px] text-slate-400">Tìm hiểu trong 5 phút</p>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 block mb-0.5">Họ & tên gia chủ</span>
                      <input type="text" placeholder="Đại phú gia" disabled={isEditMode} value={formName} onChange={e => setFormName(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1 px-2.5 text-[10px] text-white outline-none" />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block mb-0.5">Hotline di động (*)</span>
                      <input type="text" placeholder="091 • • • • •" disabled={isEditMode} value={formPhone} onChange={e => setFormPhone(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1 px-2.5 text-[10px] text-white outline-none" />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block mb-0.5">Khu vực ưu ái</span>
                      <select disabled={isEditMode} value={formZone} onChange={e => setFormZone(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1 px-2 text-[10px] text-white outline-none">
                        <option value="Biệt thự Chateau">Chateau Phú Mỹ Hưng</option>
                        <option value="Đất nền Thảo Điền">Đất nền Thảo Điền</option>
                        <option value="Sky Villa VIP">Sky Golden Villa</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isEditMode}
                    onClick={() => {
                      if (!formPhone) {
                        alert('Quý khách vui lòng điền Số điện thoại!');
                        return;
                      }
                      const leadObj = {
                        id: Date.now(),
                        name: formName || 'Gia chủ ẩn danh',
                        phone: formPhone,
                        zone: formZone,
                        time: new Date().toLocaleString('vi-VN'),
                        sectionName: section.name || 'LadiPage'
                      };
                      const saved = JSON.parse(localStorage.getItem('ladipage_submitted_leads') || '[]');
                      localStorage.setItem('ladipage_submitted_leads', JSON.stringify([leadObj, ...saved]));
                      setFormSuccessDetail(leadObj);
                      setShowFormSuccess(true);
                      setFormName('');
                      setFormPhone('');
                      onShowNotification('Nhận đăng ký thành công!', 'success');
                    }}
                    className="w-full font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 py-2 rounded-lg text-[10px] tracking-wider cursor-pointer"
                  >
                    GỞI GIA THẦN THẨM ĐỊNH
                  </button>
                </div>
              );
            } else if (el.type === 'table' && el.tableData) {
              innerContent = (
                <div style={{ backgroundColor: el.style.backgroundColor || '#0f172a', borderRadius: el.style.borderRadius || '16px', padding: el.style.padding || '12px' }} className="w-full border border-slate-800 overflow-hidden">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="border-b border-slate-800">
                        {el.tableData.headers.map((h, idx) => (
                          <th key={idx} className="pb-1 px-1.5 text-amber-400 uppercase tracking-widest text-[8px] font-extrabold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {el.tableData.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-slate-900/50">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="py-2 px-1.5 text-slate-300 font-light truncate">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            } else if (el.type === 'video') {
              innerContent = (
                <div style={{ borderRadius: el.style.borderRadius || '12px', overflow: 'hidden' }} className="w-full aspect-video bg-black">
                  <iframe src={(el.content) || undefined} title="Play Video" className="w-full h-full border-none" allowFullScreen />
                </div>
              );
            } else if (el.type === 'map') {
              innerContent = (
                <div style={{ borderRadius: el.style.borderRadius || '16px' }} className="w-full aspect-video bg-slate-900 p-3.5 flex flex-col justify-between border border-slate-800">
                  <div className="flex justify-between items-start text-[9px]">
                    <div>
                      <span className="font-bold text-slate-200 block uppercase">SƠ ĐỒ PHÂN LÔ ĐỊA LONG</span>
                      <span className="text-slate-500 font-mono text-[8px]">Greenia Homes Residence</span>
                    </div>
                    <span className="bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.5 rounded text-[8px] select-none uppercase">Đặc Quyền VIP</span>
                  </div>
                  <div className="flex-1 my-2 bg-slate-950/60 rounded border border-slate-850 relative overflow-hidden flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping absolute" />
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full absolute" />
                    <span className="text-[8px] text-red-400 bg-red-950/40 p-1 rounded backdrop-blur-xs absolute translate-y-4">Vị trí Chateau Long Mạch</span>
                  </div>
                </div>
              );
            } else if (el.type === 'line') {
              const lineColor = el.extraConfig?.lineColor || el.style.color || '#475569';
              const lineStyle = el.extraConfig?.lineStyle || 'solid';
              const lineHeight = el.extraConfig?.lineHeight || '2px';
              innerContent = (
                <div 
                  style={{
                    borderColor: lineColor,
                    borderTopStyle: lineStyle as any,
                    borderTopWidth: lineHeight,
                    width: '100%',
                    height: '1px',
                    padding: '8px 0'
                  }}
                />
              );
            } else if (el.type === 'countdown') {
              innerContent = (
                <div 
                  style={{
                    backgroundColor: el.style.backgroundColor || '#0f172a',
                    borderRadius: el.style.borderRadius || '12px',
                    padding: el.style.padding || '10px'
                  }}
                  className="w-full shadow-lg border border-slate-800"
                >
                  <CountdownTicker 
                    targetDate={el.extraConfig?.countdownTarget || new Date(Date.now() + 86400000).toISOString()} 
                    color={el.style.color || '#fbbf24'}
                    backgroundColor={el.style.backgroundColor || '#020617'}
                  />
                </div>
              );
            } else if (el.type === 'html') {
              innerContent = (
                <div 
                  style={{
                    backgroundColor: el.style.backgroundColor || 'transparent',
                    borderRadius: el.style.borderRadius || '12px',
                    padding: el.style.padding || '0px'
                  }}
                  className="w-full overflow-hidden text-xs text-slate-300"
                  dangerouslySetInnerHTML={{ __html: el.extraConfig?.rawHtml || '<p className="p-3 text-center text-slate-500">Mã HTML trống</p>' }}
                />
              );
            } else if (el.type === 'accordion') {
              innerContent = (
                <div 
                  style={{
                    backgroundColor: el.style.backgroundColor || 'transparent',
                    borderRadius: el.style.borderRadius || '12px',
                    padding: el.style.padding || '0px'
                  }}
                  className="w-full"
                >
                  <AccordionWidget 
                    items={el.extraConfig?.accordionItems || []} 
                    color={el.style.color || '#f8fafc'}
                    backgroundColor={el.style.backgroundColor || '#1e293b'}
                  />
                </div>
              );
            } else if (el.type === 'list') {
              innerContent = (
                <div 
                  style={{
                    fontFamily: el.style.fontFamily === 'font-serif' ? 'Playfair Display, serif' : 
                                el.style.fontFamily === 'font-mono' ? 'JetBrains Mono, monospace' : 'Inter, sans-serif',
                    fontSize: el.style.fontSize === 'xs' ? '12px' : 
                              el.style.fontSize === 'sm' ? '14px' : '16px',
                    color: el.style.color || '#e2e8f0',
                    backgroundColor: el.style.backgroundColor || 'transparent',
                    borderRadius: el.style.borderRadius || '0px',
                    padding: el.style.padding || '0px',
                    textAlign: (el.style.textAlign || 'left') as any
                  }}
                  className="w-full space-y-2 select-none"
                >
                  {(el.extraConfig?.listItems || []).map((itm, iIdx) => (
                    <div key={iIdx} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span className="leading-tight font-light">{itm}</span>
                    </div>
                  ))}
                </div>
              );
            } else {
              innerContent = (
                <div style={{ backgroundColor: el.style.backgroundColor || 'rgba(30,31,59,0.4)', borderRadius: el.style.borderRadius || '16px', padding: el.style.padding || '12px' }} className="w-full flex items-center justify-center font-mono text-[9px] text-slate-400 min-h-12 border border-dashed border-slate-800">
                  {el.content || 'Khung kết cấu trống'}
                </div>
              );
            }

            return (
              <div
                key={el.id}
                style={{
                  position: 'absolute',
                  left: `${el.left}%`,
                  top: `${el.top}%`,
                  width: `${el.width}%`,
                  zIndex: isSelected ? 50 : (el.style?.zIndex ? parseInt(el.style.zIndex) : (el.type === 'box' ? 10 : 25)),
                  cursor: isEditMode ? 'move' : 'default'
                }}
                className={`transition-shadow ${
                  isEditMode ? 'hover:ring-2 hover:ring-amber-500/50' : ''
                } ${isSelected ? 'ring-2 ring-amber-500 p-0.5 shadow-2xl bg-amber-500/[0.02] rounded-lg' : ''}`}
                onMouseDown={e => {
                  if (isEditMode) {
                    e.stopPropagation();
                    setSelectedElemId(el.id);
                    startDrag(el.id, e.clientX, e.clientY);
                  }
                }}
                onClick={e => {
                  e.stopPropagation();
                  if (isEditMode) setSelectedElemId(el.id);
                }}
              >
                {/* Element Edit Toolbar Overlay (INSIDE THE Outlines for perfect clipped bypass!) */}
                {isEditMode && isSelected && (
                  <div className="absolute -top-7 left-0 right-0 h-7 bg-slate-900 border border-slate-800 text-[9px] px-2 flex items-center justify-between z-50 rounded-lg shadow-xl" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1 cursor-move flex-1 h-full pr-2">
                      <GripVertical className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-slate-350 uppercase font-mono font-bold text-[8px]">{el.type}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={handleDuplicateElement} title="Nhân bản" className="text-amber-400 hover:text-amber-300 p-1 cursor-pointer">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={e => handleDeleteElement(el.id, e)} title="Xóa" className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {innerContent}
              </div>
            );
          })}
        </div>

        {/* Dynamic Sidebar Inspector Panel */}
        {isEditMode && selectedElem && (
          <div className="xl:col-span-4 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-5 text-xs text-slate-300 shadow-2xl max-h-[600px] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white uppercase tracking-wider font-display shrink-0 text-[11px] flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-amber-400" /> Căn chỉnh phần tử
              </span>
              <span className="bg-slate-950 text-amber-400 font-mono text-[9px] px-2 py-0.5 rounded font-bold uppercase shrink-0">{selectedElem.type}</span>
            </div>

            {/* Quick action buttons for selected element (DUPLICATE & DELETE inside sidebar for 100% security against canvas clipping!) */}
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={handleDuplicateElement}
                className="bg-slate-950 hover:bg-slate-850 text-amber-400 p-2.5 rounded-lg border border-solid border-slate-800 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 font-bold uppercase text-[9px]"
              >
                <Copy className="w-3.5 h-3.5" /> Nhân bản (Clone)
              </button>
              <button 
                onClick={e => handleDeleteElement(selectedElem.id, e)}
                className="bg-rose-950/20 hover:bg-rose-950/40 text-rose-500 p-2.5 rounded-lg border border-solid border-rose-950/40 hover:text-rose-400 transition-colors cursor-pointer flex items-center justify-center gap-1.5 font-bold uppercase text-[9px]"
              >
                <Trash2 className="w-3.5 h-3.5" /> Xóa Thành Phần
              </button>
            </div>

            {/* Z-Index custom Layer positioning */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <ArrowUp className="w-3 h-3 text-amber-400" /> Thứ tự phẳng (Layer Depth)
              </label>
              <div className="flex gap-2">
                <button 
                  onClick={() => { const z = selectedElem.style.zIndex ? parseInt(selectedElem.style.zIndex) : 25; updateStyle('zIndex', (z + 5).toString()); onShowNotification('Đã nâng độ sâu lớp hiển thị', 'success'); }}
                  className="bg-slate-950 hover:bg-slate-850 text-slate-300 p-2 rounded-lg flex-1 cursor-pointer flex items-center justify-center gap-1"
                >
                  <ArrowUp className="w-3 h-3 text-amber-400" /> Tiến lên trước
                </button>
                <button 
                  onClick={() => { const z = selectedElem.style.zIndex ? parseInt(selectedElem.style.zIndex) : 25; updateStyle('zIndex', Math.max(0, z - 5).toString()); onShowNotification('Đã hạ lớp hiển thị xuống', 'success'); }}
                  className="bg-slate-950 hover:bg-slate-850 text-slate-300 p-2 rounded-lg flex-1 cursor-pointer flex items-center justify-center gap-1"
                >
                  <ArrowDown className="w-3 h-3 text-red-400" /> Rút ra sau
                </button>
              </div>
            </div>

            {/* Sizing Width slider */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Chiều rộng tỉ lệ (%): {selectedElem.width}%</span>
              <input type="range" min="10" max="100" value={selectedElem.width} onChange={e => updateWidth(parseInt(e.target.value))} className="w-full h-1 bg-slate-950 rounded accent-emerald-500" />
            </div>

            {/* Content updater fields based on node type */}
            {selectedElem.type === 'text' && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 block font-bold">NỘI DUNG CHỮ</span>
                <textarea rows={3} value={selectedElem.content} onChange={e => updateContent(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-slate-200 outline-none p-2 rounded-lg text-xs focus:border-amber-500 resize-none" />
              </div>
            )}

            {selectedElem.type === 'button' && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 block font-bold">NHÃN NÚT</span>
                <input type="text" value={selectedElem.content} onChange={e => updateContent(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-slate-200 outline-none p-2 rounded-lg" />
                <span className="text-[10px] text-slate-400 block font-bold">LIÊN KẾT ĐIỀU HƯỚNG</span>
                <input type="text" value={selectedElem.linkUrl || ''} onChange={e => updateLinkUrl(e.target.value)} placeholder="#lien-he" className="w-full bg-slate-950 border border-slate-800 text-slate-200 outline-none p-2 rounded-lg font-mono" />
              </div>
            )}

            {selectedElem.type === 'image' && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 block font-bold">LIÊN KẾT ẢNH (URL)</span>
                <div className="flex gap-1.5">
                  <input type="text" value={selectedElem.content} onChange={e => updateContent(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-slate-200 outline-none p-2 rounded-lg" />
                  <label className="bg-amber-500 hover:bg-amber-600 text-slate-950 p-2 rounded-lg cursor-pointer flex items-center shrink-0">
                    <Upload className="w-4 h-4" />
                    <input type="file" accept="image/*" onChange={handleLocalImageUpload} className="hidden" />
                  </label>
                </div>
              </div>
            )}

            {selectedElem.type === 'icon' && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 block font-bold">CHỌN BIỂU TƯỢNG</span>
                <select value={selectedElem.content} onChange={e => updateContent(e.target.value)} className="w-full bg-slate-950 border border-slate-850 p-2 rounded-lg text-slate-200 outline-none">
                  {['home', 'phone', 'mail', 'star', 'award', 'heart', 'map-pin', 'calendar', 'dollar', 'users', 'clock', 'shield'].map(nm => (
                    <option key={nm} value={nm}>{nm.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            )}

            {selectedElem.type === 'form' && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 block font-bold">TIÊU ĐỀ KHỐI ĐĂNG KÝ VIP</span>
                <input type="text" value={selectedElem.content} onChange={e => updateContent(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-slate-200 outline-none p-2 rounded-lg" />
              </div>
            )}

            {selectedElem.type === 'video' && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 block font-bold">LIÊN KẾT EMBED YOUTUBE/STREAM VIDEO</span>
                <input type="text" value={selectedElem.content} onChange={e => updateContent(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-slate-200 outline-none p-2 rounded-lg font-mono text-xs" />
              </div>
            )}

            {selectedElem.type === 'line' && (
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">MÀU SẮC ĐƯỜNG KẺ</span>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={selectedElem.extraConfig?.lineColor || selectedElem.style.borderColor || '#475569'} onChange={e => { updateExtraConfig('lineColor', e.target.value); updateStyle('borderColor', e.target.value); }} className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer" />
                    <span className="font-mono text-slate-300 text-xs">{selectedElem.extraConfig?.lineColor || '#475569'}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">HOA VĂN ĐƯỜNG NÉT</span>
                  <select value={selectedElem.extraConfig?.lineStyle || 'solid'} onChange={e => updateExtraConfig('lineStyle', e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-slate-200 outline-none p-2 rounded-lg">
                    <option value="solid">Nét thẳng liền mạch (Solid)</option>
                    <option value="dashed">Nét đứt quãng rộng (Dashed)</option>
                    <option value="dotted">Nhóm các dấu chấm tròn (Dotted)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">ĐỘ DÀY ĐƯỜNG KẺ</span>
                  <select value={selectedElem.extraConfig?.lineHeight || '2px'} onChange={e => updateExtraConfig('lineHeight', e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-slate-200 outline-none p-2 rounded-lg">
                    <option value="1px">Siêu thanh mảnh (1px)</option>
                    <option value="2px">Vừa phải vừa chuẩn (2px)</option>
                    <option value="4px">Đầu nét tô đậm (4px)</option>
                    <option value="8px">Khối phân chia siêu dày (8px)</option>
                  </select>
                </div>
              </div>
            )}

            {selectedElem.type === 'countdown' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">THỜI GIAN ĐÍCH HẾT HẠN</span>
                  <input type="datetime-local" value={selectedElem.extraConfig?.countdownTarget || ''} onChange={e => updateExtraConfig('countdownTarget', e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-slate-200 outline-none p-2 rounded-lg font-mono" />
                </div>
                <div className="p-2.5 bg-yellow-500/10 rounded-lg border border-yellow-500/15 text-[10px] text-yellow-500 leading-normal">
                  Chế độ đếm ngược thời gian thực (Giờ/Phút/Giây) giúp kích hoạt tính khẩn cấp hành động của người truy cập để tăng 300% tỉ lệ đặt cọc!
                </div>
              </div>
            )}

            {selectedElem.type === 'html' && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 block font-bold">MÃ NHÚNG HTML / IFRAME KHÁC</span>
                <textarea rows={6} value={selectedElem.extraConfig?.rawHtml || ''} onChange={e => updateExtraConfig('rawHtml', e.target.value)} placeholder="<div>Thêm mã tùy chọn ở đây</div>" className="w-full bg-slate-950 border border-slate-850 text-amber-400 outline-none p-2.5 rounded-lg font-mono text-[10px] resize-y" />
              </div>
            )}

            {selectedElem.type === 'accordion' && (
              <div className="space-y-3.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">CÂU HỎI THƯỜNG GẶP (FAQ)</span>
                  <button onClick={addAccordionItem} className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-colors block shrink-0">
                    + Thêm hàng FAQ
                  </button>
                </div>
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {(selectedElem.extraConfig?.accordionItems || []).map((itm, index) => (
                    <div key={index} className="p-2 bg-slate-950 rounded-lg border border-slate-850 space-y-1.5 relative">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] text-slate-500 font-mono">CÂU #{index + 1}</span>
                        <button onClick={() => deleteAccordionItem(index)} className="text-rose-400 hover:text-rose-300 text-[8px] font-bold shrink-0 cursor-pointer">Xóa</button>
                      </div>
                      <input type="text" value={itm.title} onChange={e => editAccordionItem(index, 'title', e.target.value)} placeholder="Tiêu đề câu hỏi..." className="w-full bg-slate-900 border border-slate-800 text-white outline-none p-1 rounded-lg text-[10px]" />
                      <textarea rows={2} value={itm.content} onChange={e => editAccordionItem(index, 'content', e.target.value)} placeholder="Nội dung diễn giải chi tiết..." className="w-full bg-slate-900 border border-slate-800 text-slate-300 outline-none p-1 rounded-lg text-[9px] resize-none" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedElem.type === 'list' && (
              <div className="space-y-3.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Ý CHÍNH TRONG DANH SÁCH</span>
                  <button onClick={addListItem} className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-colors block shrink-0">
                    + Thêm Dòng mới
                  </button>
                </div>
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {(selectedElem.extraConfig?.listItems || []).map((itm, index) => (
                    <div key={index} className="flex gap-1.5 items-center bg-slate-950 rounded-lg p-1.5 border border-slate-850">
                      <input type="text" value={itm} onChange={e => editListItem(index, e.target.value)} className="w-full bg-transparent outline-none text-slate-200 text-[10px]" />
                      <button onClick={() => deleteListItem(index)} className="text-rose-400 hover:text-rose-300 text-[9px] font-bold pr-1 shrink-0 cursor-pointer">Xóa</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extra formatting controls */}
            <div className="space-y-3.5 pt-3.5 border-t border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block flex items-center gap-1"><Palette className="w-3.5 h-3.5 text-amber-400" /> KIỂU DÁNG CHỮ THỂ & MÀU SẮC</span>
              
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {selectedElem.type === 'text' && (
                  <>
                    <div className="space-y-1">
                      <span>Kiểu chữ</span>
                      <select value={selectedElem.style.fontFamily || 'font-sans'} onChange={e => updateStyle('fontFamily', e.target.value)} className="w-full bg-slate-950 border border-slate-850 p-1 rounded">
                        <option value="font-sans">Sans Mượt</option>
                        <option value="font-serif">Serif Trọng</option>
                        <option value="font-mono">Mono Bảng</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <span>Độ đậm</span>
                      <select value={selectedElem.style.fontWeight || 'normal'} onChange={e => updateStyle('fontWeight', e.target.value)} className="w-full bg-slate-950 border border-slate-850 p-1 rounded">
                        <option value="normal">Mỏng thường</option>
                        <option value="bold">Xây đậm</option>
                        <option value="extrabold">Cực đậm</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <span>Cỡ chữ</span>
                      <select value={selectedElem.style.fontSize || 'base'} onChange={e => updateStyle('fontSize', e.target.value)} className="w-full bg-slate-950 border border-slate-850 p-1 rounded">
                        <option value="xs">Nhỏ xíu</option>
                        <option value="sm">Vừa vặn</option>
                        <option value="base">Bình thường</option>
                        <option value="lg">Lớn vừa</option>
                        <option value="xl">Bắt mắt</option>
                        <option value="2xl">Đại tự</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <span>Căn hàng</span>
                      <select value={selectedElem.style.textAlign || 'left'} onChange={e => updateStyle('textAlign', e.target.value)} className="w-full bg-slate-950 border border-slate-850 p-1 rounded">
                        <option value="left">Trái</option>
                        <option value="center">Giữa</option>
                        <option value="right">Phải</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <span>Sắc màu (Màu)</span>
                  <div className="flex gap-1">
                    <input type="color" value={selectedElem.style.color || '#ffffff'} onChange={e => updateStyle('color', e.target.value)} className="w-5 h-5 border-none cursor-pointer shrink-0 bg-transparent" />
                    <input type="text" value={selectedElem.style.color || '#ffffff'} onChange={e => updateStyle('color', e.target.value)} className="bg-slate-950 p-0.5 rounded text-[10px] w-full outline-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <span>Màu nền</span>
                  <div className="flex gap-1">
                    <input type="color" value={selectedElem.style.backgroundColor && selectedElem.style.backgroundColor !== 'transparent' ? selectedElem.style.backgroundColor : '#10b981'} onChange={e => updateStyle('backgroundColor', e.target.value)} className="w-5 h-5 border-none cursor-pointer shrink-0 bg-transparent" />
                    <button onClick={() => updateStyle('backgroundColor', 'transparent')} className="p-0.5 bg-slate-950 text-[8px] rounded shrink-0">Trong</button>
                  </div>
                </div>

                <div className="space-y-1">
                  <span>Bo góc</span>
                  <select value={selectedElem.style.borderRadius || '0px'} onChange={e => updateStyle('borderRadius', e.target.value)} className="w-full bg-slate-950 border border-slate-850 p-1 rounded">
                    <option value="0px">Sắc cạnh</option>
                    <option value="8px">Bo 8px</option>
                    <option value="16px">Bo 16px</option>
                    <option value="24px">Bo 24px</option>
                    <option value="9999px">Tròn hột</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span>Dệm lề px</span>
                  <select value={selectedElem.style.padding || '0px'} onChange={e => updateStyle('padding', e.target.value)} className="w-full bg-slate-950 border border-slate-850 p-1 rounded">
                    <option value="0px">Sát nôi (0px)</option>
                    <option value="4px">Mỏng (4px)</option>
                    <option value="10px">Vừa (10px)</option>
                    <option value="16px">Rộng (16px)</option>
                  </select>
                </div>
              </div>
            </div>

            <button onClick={() => setSelectedElemId(null)} className="w-full bg-amber-500 hover:bg-amber-650 text-slate-950 font-bold py-2 rounded-lg text-center uppercase cursor-pointer">
              Áp dụng & Đóng
            </button>
          </div>
        )}
      </div>

      {/* Guest registration dialog alert popup */}
      {showFormSuccess && formSuccessDetail && (
        <div className="fixed inset-0 bg-black/85 z-[150] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowFormSuccess(false)}>
          <div className="bg-slate-900 border border-amber-500/30 p-8 rounded-lg max-w-sm w-full text-center space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-amber-500/5">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white uppercase tracking-wider font-display">Giao dịch Gửi Thành Công!</h4>
              <p className="text-xs text-slate-400 font-light mt-1 text-center">Ban Trị sự đặc trách sẽ liên hệ gia chủ sớm nhất.</p>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-850 text-left text-[11px] space-y-1.5 font-sans">
              <p className="text-slate-400">Gia chủ: <b className="text-slate-200">{formSuccessDetail.name}</b></p>
              <p className="text-slate-400">Hotline: <b className="text-slate-200">{formSuccessDetail.phone}</b></p>
              <p className="text-slate-400">Mong muốn: <b className="text-slate-200">{formSuccessDetail.zone}</b></p>
              <p className="text-slate-500 font-mono text-[9px]">Gửi: {formSuccessDetail.time}</p>
            </div>
            <button onClick={() => setShowFormSuccess(false)} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-lg text-xs cursor-pointer">
              Đồng ý & Đóng
            </button>
          </div>
        </div>
      )}

      {/* Admin Leads Management Submissions Overlay Drawer */}
      {showLeadsList && (
        <div className="fixed inset-0 bg-black/85 z-[150] flex items-center justify-center p-4 backdrop-blur-sm shadow-2xl" onClick={() => setShowLeadsList(false)}>
          <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-lg max-w-2xl w-full text-left space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="font-bold text-white uppercase text-xs tracking-wider font-display flex items-center gap-1.5">
                <Users className="w-5 h-5 text-amber-400" /> Danh sách khách hàng đăng ký (VIP Leads)
              </span>
              <button onClick={() => setShowLeadsList(false)} className="text-slate-500 hover:text-white text-lg select-none cursor-pointer">✕</button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2.5 pr-2">
              {loadedLeads.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs font-light">Chưa có lượt đăng ký VIP nào từ hệ thống Form.</div>
              ) : (
                loadedLeads.map((lead: any) => (
                  <div key={lead.id} className="bg-slate-950 border border-slate-850 p-3 rounded-lg flex items-center justify-between gap-4 text-[11px]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{lead.name}</span>
                        <span className="bg-amber-500/10 text-amber-400 text-[8px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">{lead.zone}</span>
                      </div>
                      <p className="text-slate-400 font-mono font-bold text-[10px]">Hotline: {lead.phone}</p>
                      <p className="text-[9px] text-slate-500 font-light">Khối: {lead.sectionName} | Đăng ký lúc: {lead.time}</p>
                    </div>
                    <button
                      onClick={() => {
                        const updated = loadedLeads.filter((l: any) => l.id !== lead.id);
                        localStorage.setItem('ladipage_submitted_leads', JSON.stringify(updated));
                        setLoadedLeads(updated);
                        onShowNotification('Đã xóa tệp khách hàng tuyển dụng!', 'success');
                      }}
                      className="text-rose-400 hover:text-rose-300 p-1.5 rounded cursor-pointer border-none"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  localStorage.removeItem('ladipage_submitted_leads');
                  setLoadedLeads([]);
                  onShowNotification('Đã xóa sạch hòm thư đăng ký (Leads).', 'success');
                }}
                className="bg-rose-950/20 text-rose-450 border-none hover:bg-rose-950/40 px-3.5 py-2 rounded-lg text-xs cursor-pointer"
              >
                Xóa tất cả
              </button>
              <button onClick={() => setShowLeadsList(false)} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs cursor-pointer">
                Hoàn thành
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
