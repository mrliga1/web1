import React, { useCallback, useEffect, useState } from 'react';
import { Phone, Mail, X, CheckCircle2 } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../firebase-errors';
import { useAppContext } from '../contexts/AppContext';
import { trackLead } from '../lib/tracking';
import FormConsentFields from './FormConsentFields';
import {
  ConsultationErrors,
  validateConsultation,
  validateConsultationField,
} from '../lib/consultationValidation';

export default function FloatingActionButtons() {
  const { isQuotePopupOpen: showQuotePopup, setIsQuotePopupOpen: setShowQuotePopup } = useAppContext();
  const [quoteName, setQuoteName] = useState('');
  const [quotePhone, setQuotePhone] = useState('');
  const [quoteEmail, setQuoteEmail] = useState('');
  const [quoteDemand, setQuoteDemand] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ConsultationErrors>({});

  const refreshFieldError = (field: 'name' | 'phone' | 'email', value: string) => {
    const error = validateConsultationField(field, value);
    setFieldErrors((current) => ({ ...current, [field]: error }));
  };

  const closeQuotePopup = useCallback(() => {
    if (!formSubmitted) {
      window.dispatchEvent(new Event('greenia_quote_popup_closed'));
    }
    setShowQuotePopup(false);
  }, [formSubmitted, setShowQuotePopup]);

  useEffect(() => {
    if (!showQuotePopup) return;
    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeQuotePopup();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [showQuotePopup, closeQuotePopup]);

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateConsultation({
      name: quoteName,
      phone: quotePhone,
      email: quoteEmail,
    });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    if (!agreeTerms || !agreePrivacy) return;
    
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const { db, addDoc, collection } = await import('../firebase');
      const createdConsultation = await addDoc(collection(db, 'consultations'), {
        name: quoteName,
        phone: quotePhone,
        email: quoteEmail,
        demand: quoteDemand || 'Tư vấn mua nhà chuyên sâu',
        status: 'new',
        createdAt: new Date().toISOString(),
        source: 'quote_popup',
        termsAccepted: agreeTerms,
        privacyAccepted: agreePrivacy,
        marketingConsent: agreePrivacy,
      });
      if (createdConsultation.trackingEligible) {
        trackLead('quote_popup', 'quote_popup');
      }
      setFormSubmitted(true);
      setQuoteName('');
      setQuotePhone('');
      setQuoteEmail('');
      setQuoteDemand('');
      setAgreeTerms(false);
      setAgreePrivacy(false);
      window.dispatchEvent(new Event('greenia_quote_popup_submitted'));
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

      {/* Quote Popup */}
      {showQuotePopup && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center" onMouseDown={closeQuotePopup}>
          <div role="dialog" aria-modal="true" aria-labelledby="quote-popup-title" className="relative my-auto w-full max-w-[374px] min-h-[460px] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[10px] border border-border-color bg-bg-surface shadow-2xl animate-in zoom-in-95 duration-200" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between pt-3 px-3 pb-[1px] md:pt-4 md:px-4 md:pb-[1px] border-b border-border-color">
              <h3 id="quote-popup-title" className="text-base md:text-lg font-bold text-text-primary font-display">
                Tư vấn mua nhà chuyên sâu
              </h3>
              <button
                onClick={closeQuotePopup}
                aria-label="Đóng popup"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#b8d8cf] bg-white text-primary transition-colors hover:bg-[#e8f5f1]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 md:p-4 pb-4 md:pb-5">
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-2 text-[13px] text-text-secondary">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    <span className="font-semibold text-text-primary">
                      Phân tích
                    </span>{" "}
                    quỹ căn, chính sách, tiện ích giúp Khách hàng lựa chọn căn tốt nhất.
                  </span>
                </li>
                <li className="flex items-center gap-2 text-[13px] text-text-secondary">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    <span className="font-semibold text-text-primary">
                      Giải đáp mọi thắc mắc
                    </span>{" "}
                    của khách hàng.
                  </span>
                </li>
                <li className="flex items-center gap-2 text-[13px] text-text-secondary">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    <span className="font-semibold text-text-primary">
                      Tuyệt đối bảo mật
                    </span>{" "}
                    thông tin cá nhân.
                  </span>
                </li>
              </ul>

              <h4 className="font-semibold text-text-primary text-sm mb-3">
                Thông tin liên hệ
              </h4>

              {formSubmitted ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-primary text-sm text-center font-medium">
                    Cảm ơn bạn! Chúng tôi đã nhận được thông tin.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleQuoteSubmit} className="space-y-3" noValidate>
                  <div>
                    <input
                      type="text"
                      required
                      value={quoteName}
                      onChange={(e) => {
                        setQuoteName(e.target.value);
                        if (fieldErrors.name) refreshFieldError('name', e.target.value);
                      }}
                      onBlur={(e) => refreshFieldError('name', e.target.value)}
                      aria-label="Họ tên"
                      aria-invalid={Boolean(fieldErrors.name)}
                      aria-describedby={fieldErrors.name ? 'quote-popup-name-error' : undefined}
                      className="w-full appearance-none bg-bg-base border border-border-color rounded-[10px] !outline-none focus:border-primary focus:ring-0 focus:shadow-none transition-all text-xs px-3 py-2 text-text-primary placeholder-text-secondary"
                      placeholder="Họ tên *"
                    />
                    {fieldErrors.name && <p id="quote-popup-name-error" className="mt-1 text-[10px] font-semibold text-error">{fieldErrors.name}</p>}
                  </div>
                  <div>
                    <input
                      type="tel"
                      required
                      value={quotePhone}
                      onChange={(e) => {
                        setQuotePhone(e.target.value);
                        if (fieldErrors.phone) refreshFieldError('phone', e.target.value);
                      }}
                      onBlur={(e) => refreshFieldError('phone', e.target.value)}
                      aria-label="Số điện thoại"
                      aria-invalid={Boolean(fieldErrors.phone)}
                      aria-describedby={fieldErrors.phone ? 'quote-popup-phone-error' : undefined}
                      inputMode="tel"
                      className="w-full appearance-none bg-bg-base border border-border-color rounded-[10px] !outline-none focus:border-primary focus:ring-0 focus:shadow-none transition-all text-xs px-3 py-2 text-text-primary placeholder-text-secondary"
                      placeholder="Số điện thoại *"
                    />
                    {fieldErrors.phone && <p id="quote-popup-phone-error" className="mt-1 text-[10px] font-semibold text-error">{fieldErrors.phone}</p>}
                  </div>
                  <div>
                    <input
                      type="email"
                      value={quoteEmail}
                      onChange={(e) => {
                        setQuoteEmail(e.target.value);
                        if (fieldErrors.email) refreshFieldError('email', e.target.value);
                      }}
                      onBlur={(e) => refreshFieldError('email', e.target.value)}
                      aria-label="Email"
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? 'quote-popup-email-error' : undefined}
                      inputMode="email"
                      className="w-full appearance-none bg-bg-base border border-border-color rounded-[10px] !outline-none focus:border-primary focus:ring-0 focus:shadow-none transition-all text-xs px-3 py-2 text-text-primary placeholder-text-secondary"
                      placeholder="Email (Tùy chọn)"
                    />
                    {fieldErrors.email && <p id="quote-popup-email-error" className="mt-1 text-[10px] font-semibold text-error">{fieldErrors.email}</p>}
                  </div>
                  <div>
                    <textarea
                      rows={3}
                      value={quoteDemand}
                      onChange={(e) => setQuoteDemand(e.target.value)}
                      aria-label="Nhu cầu của bạn"
                      className="w-full appearance-none bg-bg-base border border-border-color rounded-[10px] !outline-none focus:border-primary focus:ring-0 focus:shadow-none transition-all text-xs px-3 py-2 text-text-primary placeholder-text-secondary resize-none"
                      placeholder="Nhu cầu của bạn (Tùy chọn)"
                    />
                  </div>

                  <FormConsentFields
                    idPrefix="quote-popup"
                    agreeTerms={agreeTerms}
                    agreePrivacy={agreePrivacy}
                    onTermsChange={setAgreeTerms}
                    onPrivacyChange={setAgreePrivacy}
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting || !agreeTerms || !agreePrivacy}
                    className="w-full py-2.5 border-none cursor-pointer rounded-[10px] font-bold bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs mt-2 shadow-lg shadow-primary/30"
                  >
                    {isSubmitting ? "Đang gửi..." : "Nhận tư vấn ngay"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
