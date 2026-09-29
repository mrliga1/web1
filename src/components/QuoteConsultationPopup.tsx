'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../firebase-errors';
import { useAppContext } from '../contexts/AppContext';
import { trackLead } from '../lib/tracking';
import FormConsentFields from './FormConsentFields';
import { readConsultationContext, type ConsultationContext } from '../lib/consultationContext';
import {
  ConsultationErrors,
  validateConsultation,
  validateConsultationField,
} from '../lib/consultationValidation';

export default function QuoteConsultationPopup({ initialContext }: { initialContext: ConsultationContext | null }) {
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
  const popupContextRef = useRef<ConsultationContext | null>(initialContext);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (showQuotePopup && !popupContextRef.current) popupContextRef.current = readConsultationContext();
    if (!showQuotePopup) popupContextRef.current = null;
  }, [showQuotePopup]);

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

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
    const submittedContext = readConsultationContext();
    const openedContext = popupContextRef.current || submittedContext;
    try {
      const { db, addDoc, collection } = await import('../firebase');
      const createdConsultation = await addDoc(collection(db, 'consultations'), {
        name: quoteName,
        phone: quotePhone,
        email: quoteEmail,
        demand: quoteDemand.trim(),
        ...submittedContext,
        popupOpenedUrl: openedContext.sourceUrl,
        popupOpenedTitle: openedContext.pageTitle,
        status: 'new',
        createdAt: new Date().toISOString(),
        source: 'quote_popup',
        termsAccepted: agreeTerms,
        privacyAccepted: agreePrivacy,
        marketingConsent: agreePrivacy,
      });
      if (createdConsultation.trackingEligible) {
        trackLead('quote_popup', 'quote_popup', submittedContext.propertyId);
      }
      setFormSubmitted(true);
      setQuoteName('');
      setQuotePhone('');
      setQuoteEmail('');
      setQuoteDemand('');
      setAgreeTerms(false);
      setAgreePrivacy(false);
      window.dispatchEvent(new Event('greenia_quote_popup_submitted'));
      closeTimerRef.current = setTimeout(() => {
        setFormSubmitted(false);
        setShowQuotePopup(false);
        closeTimerRef.current = null;
      }, 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'consultations');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showQuotePopup) return null;

  return (
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
  );
}
