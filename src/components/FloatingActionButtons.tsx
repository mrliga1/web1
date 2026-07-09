import React, { useState } from 'react';
import { Phone, MessageSquare, Mail, X } from 'lucide-react';
import { db, addDoc, collection } from '../firebase';
import { handleFirestoreError, OperationType } from '../firebase-errors';

export default function FloatingActionButtons() {
  const [showQuotePopup, setShowQuotePopup] = useState(false);
  const [quoteName, setQuoteName] = useState('');
  const [quotePhone, setQuotePhone] = useState('');
  const [quoteDemand, setQuoteDemand] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteName || !quotePhone) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'consultations'), {
        name: quoteName,
        phone: quotePhone,
        demand: quoteDemand || 'Tư vấn tổng quan',
        status: 'new',
        createdAt: new Date().toISOString(),
        source: 'quote_popup',
      });
      setFormSubmitted(true);
      setQuoteName('');
      setQuotePhone('');
      setQuoteDemand('');
      setTimeout(() => {
        setFormSubmitted(false);
        setShowQuotePopup(false);
      }, 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'consultations');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Action Buttons */}
      <div className="fixed z-[120] pointer-events-none
        bottom-0 left-0 right-0 w-full bg-bg-surface border-t border-border-color p-1 flex flex-row items-center justify-around gap-1
        md:bottom-6 md:left-6 md:right-auto md:w-auto md:bg-transparent md:border-none md:p-0 md:flex-col md:items-start md:gap-3">
        
        {/* Gọi ngay */}
        <a
          href="tel:0932966700"
          aria-label="Gọi ngay hotline 0932 966 700"
          className="flex flex-col md:flex-row flex-1 md:flex-none items-center justify-center md:justify-start gap-1 md:gap-0 md:hover:gap-[12px] bg-transparent md:bg-bg-surface border-none md:border md:border-primary/20 md:hover:border-primary md:hover:bg-primary text-text-primary p-0 md:hover:pr-[24px] rounded-none md:rounded-full shadow-none md:shadow-lg md:hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] md:hover:-translate-y-1 transition-all duration-300 pointer-events-auto group"
        >
          <div className="bg-primary md:group-hover:bg-bg-surface text-[14px] text-white md:group-hover:text-primary w-[40px] h-[40px] flex items-center justify-center rounded-full animate-bounce shrink-0 transition-colors duration-300 shadow-md shadow-primary/50">
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
          <div className="bg-white w-[40px] h-[40px] rounded-full shrink-0 flex items-center justify-center transition-colors duration-300 shadow-md shadow-blue-500/50 animate-pulse">
            <img 
              loading="lazy" 
              decoding="async" 
              src="/zalo-icon.svg" 
              alt="Zalo" 
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
          <div className="bg-accent md:group-hover:bg-bg-surface text-white md:group-hover:text-accent p-0 w-[40px] h-[40px] rounded-full shrink-0 flex items-center justify-center transition-colors duration-300 shadow-md shadow-accent/50 animate-bounce">
            <Mail className="w-[15px] h-[15px] md:w-5 md:h-5" />
          </div>
          <span className="text-[10px] md:text-[14px] font-medium md:font-bold capitalize md:normal-case tracking-wide text-text-primary md:text-text-primary md:group-hover:text-text-inverse transition-all duration-300 whitespace-nowrap overflow-hidden md:max-w-0 md:opacity-0 md:group-hover:max-w-[200px] md:group-hover:opacity-100">
            Đăng ký
          </span>
        </button>
      </div>

      {/* Quote Popup */}
      {showQuotePopup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowQuotePopup(false)}
          ></div>
          <div className="bg-bg-surface w-full max-w-md rounded-2xl shadow-2xl relative z-10 animate-in zoom-in-95 overflow-hidden">
            <div className="bg-primary p-4 md:p-6 text-white text-center relative">
              <button 
                onClick={() => setShowQuotePopup(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors border-none bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-display font-bold text-xl mb-1">Yêu cầu báo giá & Tư vấn</h3>
              <p className="text-white/80 text-sm">Chuyên viên Greenia sẽ liên hệ ngay với quý khách</p>
            </div>
            
            <div className="p-4 md:p-6">
              {formSubmitted ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-primary">Đã gửi yêu cầu thành công!</h4>
                  <p className="text-text-secondary text-sm">Cảm ơn quý khách đã quan tâm. Chúng tôi sẽ liên hệ trong thời gian sớm nhất.</p>
                </div>
              ) : (
                <form onSubmit={handleQuoteSubmit} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Họ và tên *"
                      value={quoteName}
                      onChange={(e) => setQuoteName(e.target.value)}
                      required
                      className="w-full bg-bg-base border border-border-color rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder="Số điện thoại *"
                      value={quotePhone}
                      onChange={(e) => setQuotePhone(e.target.value)}
                      required
                      className="w-full bg-bg-base border border-border-color rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <textarea
                      placeholder="Nhu cầu tư vấn (Ví dụ: Tôi muốn nhận bảng giá Vinhomes Grand Park...)"
                      value={quoteDemand}
                      onChange={(e) => setQuoteDemand(e.target.value)}
                      rows={3}
                      className="w-full bg-bg-base border border-border-color rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-primary-hover text-text-inverse font-bold py-3.5 rounded-xl transition-all disabled:opacity-70 border-none cursor-pointer shadow-lg shadow-primary/20"
                  >
                    {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu ngay'}
                  </button>
                  <p className="text-center text-[11px] text-text-secondary mt-4">
                    Thông tin của quý khách được bảo mật tuyệt đối theo chính sách của Greenia Homes.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
