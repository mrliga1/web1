'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Phone, Mail } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useNotification } from '../contexts/NotificationContext';
import { readConsultationContext, type ConsultationContext } from '../lib/consultationContext';

export default function FloatingActionButtons() {
  const { isQuotePopupOpen: showQuotePopup, setIsQuotePopupOpen: setShowQuotePopup } = useAppContext();
  const notify = useNotification();
  const [Popup, setPopup] = useState<React.ComponentType<{ initialContext: ConsultationContext | null }> | null>(null);
  const openedContext = useRef<ConsultationContext | null>(null);

  // Chỉ tải mã biểu mẫu khi cần mở; giữ component sau đó để không mất nội dung đang nhập.
  useEffect(() => {
    if (!showQuotePopup) { openedContext.current = null; return; }
    openedContext.current ||= readConsultationContext();
    if (Popup) return;
    let active = true;
    import('./QuoteConsultationPopup').then(module => {
      if (active) setPopup(() => module.default);
    }).catch(error => {
      if (!active) return;
      console.warn('Không thể tải biểu mẫu tư vấn:', error);
      notify('Không thể mở biểu mẫu tư vấn. Vui lòng thử lại.', 'error');
      setShowQuotePopup(false);
    });
    return () => { active = false; };
  }, [showQuotePopup, Popup, notify, setShowQuotePopup]);

  return (
    <>
      {/* Các nút liên hệ luôn có sẵn trong HTML đầu tiên. */}
      <div className="fixed z-[120] pointer-events-none
        bottom-0 left-0 right-0 w-full bg-bg-surface border-t border-border-color p-1 flex flex-row items-center justify-around gap-1
        md:bottom-6 md:left-6 md:right-auto md:w-auto md:bg-transparent md:border-none md:p-0 md:flex-col md:items-start md:gap-3">
        
        {/* Gọi ngay */}
        <a
          href="tel:0932966700"
          aria-label="Gọi ngay hotline 0932 966 700"
          className="flex flex-col md:flex-row flex-1 md:flex-none items-center justify-center md:justify-start gap-1 md:gap-0 md:hover:gap-[12px] bg-transparent md:bg-bg-surface border-none md:border md:border-primary/20 md:hover:border-primary md:hover:bg-primary text-text-primary p-0 md:hover:pr-[24px] rounded-none md:rounded-full shadow-none md:shadow-lg md:hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] md:hover:-translate-y-1 transition-all duration-300 pointer-events-auto group"
        >
          <div className="motion-float bg-primary md:group-hover:bg-bg-surface text-[14px] text-white md:group-hover:text-primary w-[40px] h-[40px] flex items-center justify-center rounded-full shrink-0 transition-colors duration-300 shadow-md shadow-primary/50">
            <Phone className="w-[15px] h-[15px] md:w-5 md:h-5" />
          </div>
          <span className="text-[10px] md:text-[14px] font-medium md:font-bold capitalize md:normal-case tracking-wide text-text-primary md:text-text-primary md:group-hover:text-text-inverse transition-all duration-300 whitespace-nowrap overflow-hidden md:max-w-0 md:opacity-0 md:group-hover:max-w-[200px] md:group-hover:opacity-100">
            <span className="md:hidden">Gọi ngay</span>
            <span className="hidden md:inline">0932 966 700</span>
          </span>
        </a>

        {/* Chat Zalo */}
        <a
          href="https://zalo.me/0932966700"
          target="_blank"
          rel="noreferrer"
          aria-label="Nhắn tin qua Zalo"
          onClick={(e) => {
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
              e.preventDefault();
              window.location.href = "https://zalo.me/0932966700";
            }
          }}
          className="flex flex-col md:flex-row flex-1 md:flex-none items-center justify-center md:justify-start gap-1 md:gap-0 md:hover:gap-[12px] bg-transparent md:bg-bg-surface border-none md:border md:border-blue-500/20 md:hover:border-blue-500 md:hover:bg-blue-500 text-text-primary p-0 md:hover:pr-[24px] rounded-none md:rounded-full shadow-none md:shadow-lg md:hover:shadow-[0_0_15px_rgba(37,99,235,0.3)] md:hover:-translate-y-1 transition-all duration-300 pointer-events-auto group"
        >
          <div className="motion-float motion-delay-1 bg-white w-[40px] h-[40px] rounded-full shrink-0 flex items-center justify-center transition-colors duration-300 shadow-md shadow-blue-500/50">
            <img 
              loading="lazy" 
              decoding="async" 
              src="/zalo-icon.svg" 
              alt=""
              width="35"
              height="35"
              className="w-[35px] h-[35px] object-contain drop-shadow-sm md:group-hover:drop-shadow-none" 
            />
          </div>
          <span className="text-[10px] md:text-[14px] font-medium md:font-bold capitalize md:normal-case tracking-wide text-text-primary md:text-text-primary md:group-hover:text-text-inverse transition-all duration-300 whitespace-nowrap overflow-hidden md:max-w-0 md:opacity-0 md:group-hover:max-w-[200px] md:group-hover:opacity-100">
            Zalo
          </span>
        </a>

        {/* Đăng ký tư vấn */}
        <button
          onClick={() => setShowQuotePopup(true)}
          aria-label="Đăng ký tư vấn"
          className="flex flex-col md:flex-row flex-1 md:flex-none items-center justify-center md:justify-start gap-1 md:gap-0 md:hover:gap-[12px] bg-transparent md:bg-bg-surface border-none md:border md:border-accent/20 md:hover:border-accent md:hover:bg-accent text-text-primary p-0 md:hover:pr-[24px] rounded-none md:rounded-full shadow-none md:shadow-lg md:hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] md:hover:-translate-y-1 transition-all duration-300 pointer-events-auto group"
        >
          <div className="motion-float motion-delay-2 bg-accent md:group-hover:bg-bg-surface text-white md:group-hover:text-accent p-0 w-[40px] h-[40px] rounded-full shrink-0 flex items-center justify-center transition-colors duration-300 shadow-md shadow-accent/50">
            <Mail className="w-[15px] h-[15px] md:w-5 md:h-5" />
          </div>
          <span className="text-[10px] md:text-[14px] font-medium md:font-bold capitalize md:normal-case tracking-wide text-text-primary md:text-text-primary md:group-hover:text-text-inverse transition-all duration-300 whitespace-nowrap overflow-hidden md:max-w-0 md:opacity-0 md:group-hover:max-w-[200px] md:group-hover:opacity-100">
            Đăng ký
          </span>
        </button>
      </div>


      {Popup && <Popup initialContext={openedContext.current} />}
      {showQuotePopup && !Popup && (
        <div role="status" aria-live="polite" className="fixed bottom-20 right-4 z-[200] rounded-xl bg-white px-4 py-3 text-sm text-primary shadow-lg">
          Đang mở biểu mẫu tư vấn…
        </div>
      )}
    </>
  );
}
