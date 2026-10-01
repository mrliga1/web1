import React, { useState } from 'react';
import {
  ArrowRight, Phone, CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { Product, RouteState, VisualSection } from '../types';
import { EditableText } from './EditableComponent';
import ProductCard from './ProductCard';
import { trackLead } from '../lib/tracking';
import FormConsentFields from './FormConsentFields';
import {
  ConsultationErrors,
  validateConsultation,
  validateConsultationField,
} from '../lib/consultationValidation';

const HOME_CONSULTATION_FIELD_CLASS =
  'w-full appearance-none bg-bg-base border border-border-color rounded-[10px] !outline-none focus:border-primary focus:ring-0 focus:shadow-none transition-all text-[12px] px-3.5 text-text-primary placeholder-text-secondary';

interface SectionRendererProps {
  sec: VisualSection;
  isEditMode: boolean;
  onNavigate: (route: RouteState) => void;
  sections: VisualSection[];
  onUpdateSections: (sections: VisualSection[]) => void;
}

// Khối banner chính.
interface HeroProps extends SectionRendererProps {
  heroBanner: React.ReactNode;
  onShowNotification: (message: string, type: 'success' | 'error') => void;
}

const HeroConsultationForm: React.FC<{
  onShowNotification: (message: string, type: 'success' | 'error') => void;
}> = ({ onShowNotification }) => {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientDemand, setClientDemand] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submittedPhone, setSubmittedPhone] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ConsultationErrors>({});

  const refreshFieldError = (field: 'name' | 'phone' | 'email', value: string) => {
    const error = validateConsultationField(field, value, { emailRequired: true });
    setFieldErrors((current) => ({ ...current, [field]: error }));
  };

  const handleConsultationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateConsultation(
      { name: clientName, phone: clientPhone, email: clientEmail },
      { emailRequired: true },
    );
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      onShowNotification(Object.values(errors)[0] || 'Thông tin liên hệ chưa hợp lệ.', 'error');
      return;
    }
    if (!agreeTerms || !agreePrivacy) {
      onShowNotification('Vui lòng đồng ý đủ hai nội dung trước khi gửi.', 'error');
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const { db, collection, addDoc } = await import('../firebase');
      let friendlyUrl = "";
      if (window.location.hostname.includes('aistudio')) {
        friendlyUrl = `https://greeniahomes.vn${window.location.pathname}`;
      } else if (window.location.hostname.includes('run.app')) {
        friendlyUrl = `https://greeniahomes.vn${window.location.pathname}`;
      } else {
        friendlyUrl = window.location.href;
      }

      const createdConsultation = await addDoc(collection(db, 'consultations'), {
        name: clientName.trim(),
        phone: clientPhone.trim(),
        email: clientEmail.trim(),
        demand: clientDemand.trim(),
        createdAt: new Date().toISOString(),
        status: 'pending',
        propertyId: 'homepage-consultation',
        propertyTitle: 'Tư vấn chuyên sâu trang chủ',
        sourceUrl: friendlyUrl,
        termsAccepted: agreeTerms,
        privacyAccepted: agreePrivacy,
        marketingConsent: agreePrivacy,
      });
      if (createdConsultation.trackingEligible) {
        trackLead('homepage_consultation', 'homepage');
      }

      setFormSubmitted(true);
      setSubmittedPhone(clientPhone.trim());
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setClientDemand('');
      setAgreeTerms(false);
      setAgreePrivacy(false);
      onShowNotification('Đã gửi thông tin yêu cầu tư vấn thành công!', 'success');
    } catch (err) {
      console.error('Không thể gửi yêu cầu tư vấn trang chủ:', err);
      onShowNotification('Không thể gửi yêu cầu tư vấn. Vui lòng thử lại hoặc gọi hotline.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-bg-surface border border-border-color rounded-lg shadow-xl relative text-left pt-[20px]" style={{ width: '100%', paddingLeft: '15px', paddingRight: '15px', paddingBottom: '20px' }}>
      <div className="absolute top-0 right-0 -mr-2 -mt-2 bg-accent text-text-primary text-[10px] px-3.5 py-1 rounded-full font-bold shadow-md uppercase tracking-wide">
        Tư vấn nhanh
      </div>

      <h2 className="font-display text-xl font-bold text-primary mb-1">Yêu Cầu Tư Vấn Chuyên Sâu</h2>
      <p className="text-text-secondary text-xs mb-[15px] font-light">Để lại nhu cầu của bạn. Greenia Homes sẽ liên hệ, giới thiệu lựa chọn phù hợp và giải đáp thông tin giao dịch.</p>

      {formSubmitted ? (
        <div className="bg-bg-base text-primary border border-border-color rounded-xl p-5 text-center space-y-3 animate-in zoom-in-95">
          <div className="w-12 h-12 rounded-full border-2 border-primary/20 flex items-center justify-center mx-auto bg-bg-surface text-primary">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-medium text-[15px] text-primary">Đăng ký thành công!</h3>
            <p className="text-[11px] text-text-secondary mt-1.5 leading-relaxed">Chúng tôi đã nhận được yêu cầu và sẽ liên hệ qua số {submittedPhone}.</p>
          </div>
          <button
            type="button"
            onClick={() => setFormSubmitted(false)}
            className="text-primary text-xs font-semibold hover:underline border-none bg-transparent cursor-pointer pt-2 block mx-auto"
          >
            Gửi yêu cầu tư vấn khác
          </button>
        </div>
      ) : (
        <form onSubmit={handleConsultationSubmit} className="p-[5px]" noValidate>
          <div className="text-left mb-[5px]">
            <input
              type="text"
              value={clientName}
              onChange={(e) => {
                setClientName(e.target.value);
                if (fieldErrors.name) refreshFieldError('name', e.target.value);
              }}
              onBlur={(e) => refreshFieldError('name', e.target.value)}
              placeholder="Họ tên *"
              aria-label="Họ tên"
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? 'home-consultation-name-error' : undefined}
              className={`${HOME_CONSULTATION_FIELD_CLASS} h-[35.5px] pt-0`}
              required
            />
            {fieldErrors.name && <p id="home-consultation-name-error" className="mt-1 text-[10px] font-semibold text-error">{fieldErrors.name}</p>}
          </div>
          <div className="text-left mb-[5px]">
            <input
              type="tel"
              value={clientPhone}
              onChange={(e) => {
                setClientPhone(e.target.value);
                if (fieldErrors.phone) refreshFieldError('phone', e.target.value);
              }}
              onBlur={(e) => refreshFieldError('phone', e.target.value)}
              placeholder="Số điện thoại *"
              aria-label="Số điện thoại"
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={fieldErrors.phone ? 'home-consultation-phone-error' : undefined}
              inputMode="tel"
              className={`${HOME_CONSULTATION_FIELD_CLASS} h-[35.5px]`}
              required
            />
            {fieldErrors.phone && <p id="home-consultation-phone-error" className="mt-1 text-[10px] font-semibold text-error">{fieldErrors.phone}</p>}
          </div>
          <div className="text-left mb-[5px]">
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => {
                setClientEmail(e.target.value);
                if (fieldErrors.email) refreshFieldError('email', e.target.value);
              }}
              onBlur={(e) => refreshFieldError('email', e.target.value)}
              placeholder="Email *"
              aria-label="Địa chỉ Email"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'home-consultation-email-error' : undefined}
              inputMode="email"
              className={`${HOME_CONSULTATION_FIELD_CLASS} h-[35.5px]`}
              required
            />
            {fieldErrors.email && <p id="home-consultation-email-error" className="mt-1 text-[10px] font-semibold text-error">{fieldErrors.email}</p>}
          </div>
          <div className="text-left mb-[10px]">
            <textarea
              value={clientDemand}
              onChange={(e) => setClientDemand(e.target.value)}
              placeholder="Nhu cầu tư vấn (VD: Tôi cần mua để ở...)"
              aria-label="Nhu cầu tư vấn"
              rows={2}
              className={`${HOME_CONSULTATION_FIELD_CLASS} h-[55px] py-[5px] resize-none`}
            />
          </div>

          <FormConsentFields
            idPrefix="home-consultation"
            agreeTerms={agreeTerms}
            agreePrivacy={agreePrivacy}
            onTermsChange={setAgreeTerms}
            onPrivacyChange={setAgreePrivacy}
            className="pt-2 mt-[14px]"
          />

          <button
            type="submit"
            disabled={isSubmitting || !agreeTerms || !agreePrivacy}
            className="motion-button w-full my-0 mt-[14px] bg-primary hover:bg-primary-light shadow-[var(--shadow-elevation)] disabled:opacity-50 text-text-inverse font-semibold py-[5px] px-4 rounded-lg text-[13px] md:text-sm cursor-pointer text-center border-none"
          >
            {isSubmitting ? "Đang gửi thông tin..." : "Nhận tư vấn ngay"}
          </button>

          <div className="grid grid-cols-2 gap-2 pt-2 mt-[14px]">
            <a
              href="tel:0932966700"
              className="flex flex-col items-center justify-center gap-1 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 rounded-lg py-2 transition-colors cursor-pointer text-center"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium">Gọi trực tiếp</span>
            </a>
            <a
              href="https://zalo.me/0932966700"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-1 bg-blue-500/10 border border-blue-500/20 text-blue-600 hover:bg-blue-500/20 rounded-lg py-2 transition-colors cursor-pointer text-center"
            >
              <img
                decoding="async"
                src="/zalo-icon.svg"
                alt="Zalo"
                width="16"
                height="16"
                className="w-4 h-4"
              />
              <span className="text-[10px] font-medium">Chat qua Zalo</span>
            </a>
          </div>
        </form>
      )}
    </div>
  );
};

export const HeroSectionBody: React.FC<HeroProps> = ({
  heroBanner,
  onShowNotification
}) => {
  return (
    <section className="overflow-hidden border-b border-emerald-950/10 bg-[#f4f7f3]" id="home-hero-banner">
      {heroBanner}

      <div className="home-consultation-deferred mx-auto grid max-w-7xl items-start gap-7 px-5 pb-14 sm:px-8 lg:grid-cols-[1fr_420px] lg:gap-12" id="home-hero-consultation">
        <div className="rounded-[28px] bg-primary px-6 py-7 text-white sm:px-9 sm:py-9">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">Bắt đầu từ nhu cầu của bạn</p>
          <h2 className="mt-3 max-w-xl font-display text-2xl font-bold leading-tight sm:text-3xl">Chia sẻ điều bạn đang tìm kiếm</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/85">Cho chúng tôi biết loại hình, khu vực và ngân sách mong muốn. Bạn cũng có thể gọi trực tiếp để trao đổi.</p>
          <a href="tel:0932966700" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-white underline underline-offset-4">
            <Phone className="h-4 w-4" aria-hidden="true" /> 0932 966 700
          </a>
        </div>
        <div className="relative rounded-[28px] border border-primary/10 bg-white p-3 shadow-[0_18px_48px_rgba(3,53,42,0.1)]" id="hero-banner-consultation-form">
          <HeroConsultationForm onShowNotification={onShowNotification} />
        </div>
      </div>
    </section>
  );
};

// Khối sản phẩm nổi bật.
interface ListingsProps extends SectionRendererProps {
  currentDisplayedProducts: Product[];
  products: Product[];
  loading: boolean;
  productClickCount: number;
  handleProductSeeMore: () => void;
}

export const FeaturedListingsBody: React.FC<ListingsProps> = ({
  sec,
  isEditMode,
  sections,
  onUpdateSections,
  onNavigate,
  currentDisplayedProducts,
  products,
  loading,
  productClickCount,
  handleProductSeeMore
}) => {
  const displayedProductsCount = productClickCount === 0 ? 10 : 15;
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pt-[10px] pb-[10px] font-sans" id="home-grid-products">
      <div className="flex flex-row items-center justify-between gap-4 text-left border-b border-border-color pb-[5px] mb-[16px]">
        <div>
          <EditableText
            sectionId="featured_listings"
            field="title"
            value={sec.title === 'Cơ Hội Sở Hữu & Đầu Tư Cao Cấp' ? 'Sản Phẩm Mới Nhất' : sec.title}
            isEditMode={isEditMode}
            sections={sections}
            onUpdateSections={onUpdateSections}
            className="text-2xl sm:text-3xl font-display font-medium text-primary tracking-tight"
            tag="h2"
          />
          <EditableText
            sectionId="featured_listings"
            field="description"
            value={sec.description === 'Danh sách biệt thự độc lập, chung cư thượng hạng đang mở giao dịch ngay.' ? '' : sec.description}
            isEditMode={isEditMode}
            sections={sections}
            onUpdateSections={onUpdateSections}
            isArea
            className="text-text-secondary text-xs font-light mt-1"
            tag="p"
          />
        </div>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => onNavigate({ screen: 'latest-sales' })}
            className="text-primary hover:text-primary font-sans text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            Xem thêm <ChevronRight className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center animate-pulse">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : currentDisplayedProducts.length === 0 ? (
        <div className="text-center py-10 text-white/70 text-xs">Hiện tại chưa có sản phẩm nào được phê duyệt.</div>
      ) : (
        <div className="space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 text-left">
            {currentDisplayedProducts.map((item) => (
              <ProductCard key={item.id} item={item} onNavigate={onNavigate} />
            ))}
          </div>

          {products.length > displayedProductsCount && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleProductSeeMore}
                className="motion-button inline-flex items-center gap-2 bg-bg-surface hover:bg-bg-surface text-text-secondary hover:text-primary border border-border-color shadow-sm px-6 py-3 rounded-full text-xs font-semibold cursor-pointer border-solid"
              >
                <span>{productClickCount === 0 ? "Xem thêm biệt thự cao cấp (Click Lần 1)" : "Xem Toàn Bộ Kho Căn Hộ (Click Lần 2)"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
