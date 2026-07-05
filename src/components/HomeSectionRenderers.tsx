import React from 'react';
import { optimizeImageUrl, generateSrcSet, generateSlug } from '../lib/utils';
import { 
  Sparkles, ArrowRight, User, Phone, CheckCircle2, 
  MapPin, ChevronRight, Compass, Shield, Award, Calendar,
  Building2, Layers
} from 'lucide-react';
import { Product, Project, News, RouteState, VisualSection } from '../types';
import { EditableText, EditableImage } from './EditableComponent';
import ProductCard from './ProductCard';
import { motion } from 'framer-motion';

interface SectionRendererProps {
  sec: VisualSection;
  isEditMode: boolean;
  onNavigate: (route: RouteState) => void;
  sections: any[];
  onUpdateSections: (sections: any[]) => void;
}

// 1. HERO BANNER
interface HeroProps extends SectionRendererProps {
  formSubmitted: boolean;
  setFormSubmitted: (v: boolean) => void;
  clientName: string;
  setClientName: (v: string) => void;
  clientPhone: string;
  setClientPhone: (v: string) => void;
  clientEmail: string;
  setClientEmail: (v: string) => void;
  clientDemand: string;
  setClientDemand: (v: string) => void;
  agreeTerms: boolean;
  setAgreeTerms: (v: boolean) => void;
  agreePrivacy: boolean;
  setAgreePrivacy: (v: boolean) => void;
  isSubmitting: boolean;
  handleConsultationSubmit: (e: React.FormEvent) => void;
  onShowNotification: (message: string, type: 'success' | 'error') => void;
}

export const HeroSectionBody: React.FC<HeroProps> = ({
  sec,
  isEditMode,
  onNavigate,
  sections,
  onUpdateSections,
  formSubmitted,
  setFormSubmitted,
  clientName,
  setClientName,
  clientPhone,
  setClientPhone,
  clientEmail,
  setClientEmail,
  clientDemand,
  setClientDemand,
  agreeTerms,
  setAgreeTerms,
  agreePrivacy,
  setAgreePrivacy,
  isSubmitting,
  handleConsultationSubmit,
  onShowNotification
}) => {
  return (
    <motion.section 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
      className="relative min-h-[640px] flex items-center justify-center p-6 md:p-12 lg:p-20 overflow-hidden bg-bg-inverse rounded-lg" 
      id="home-hero-banner"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,var(--color-primary-light),transparent_45%)] opacity-20" />
      <div className="absolute inset-0" style={{ background: 'var(--overlay-hero)' }} />
      <img
        loading="eager"
        decoding="async"
        src={optimizeImageUrl(sec.imageUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1600', 800) || undefined}
        srcSet={generateSrcSet(sec.imageUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c')}
        sizes="100vw"
        alt="Hero Background"
        width="1600"
        height="900"
        // @ts-ignore
        fetchpriority="high"
        className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
        referrerPolicy="no-referrer"
      />
      {isEditMode && (
        <div className="absolute top-16 right-4 z-40 bg-bg-inverse border border-border-inverse p-2.5 rounded-lg shadow-2xl flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <span className="text-[10px] text-white/70 font-bold font-mono">Ảnh nền Hero:</span>
          <EditableImage
            sectionId="hero"
            field="imageUrl"
            imageUrl={sec.imageUrl || ''}
            isEditMode={isEditMode}
            sections={sections}
            onUpdateSections={onUpdateSections}
            onShowNotification={onShowNotification}
            className="w-16 h-10 rounded overflow-hidden"
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10 pt-[20px] pb-10">
        
        {/* Left Column: Text & CTAs */}
        <div className="lg:col-span-7 space-y-6 text-left w-full" id="banner-intro-txt">
          <h1 className="font-display font-medium tracking-tight text-white leading-tight flex flex-col gap-1">
            <EditableText 
              sectionId="hero" 
              field="title" 
              value={sec.title === "Greenia Homes Phân phối, Chuyển nhượng BĐS Chuyên nghiệp" || sec.title === "Phân Phối Bất Động Sản\n[gradient]Xanh, Sang & Đẳng Cấp[/gradient]" ? "Greenia Homes" : (sec.title || "Greenia Homes")} 
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              className="text-[45px] lg:text-[60px] block font-display text-text-inverse font-bold drop-shadow-md" 
              tag="span" 
            />
            <EditableText 
              sectionId="hero" 
              field="subtitle" 
              value={!sec.subtitle || sec.subtitle === "Greenia Homes Phân phối, Chuyển nhượng BĐS Chuyên nghiệp" || sec.subtitle === "Đồng hành cùng nhà đầu tư bất động sản" ? "Đồng hành - Tận Tâm - Vững Bước Tương Lai" : sec.subtitle} 
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              className="text-[15px] font-medium text-accent block underline underline-offset-4 drop-shadow-sm" 
              tag="span" 
            />
          </h1>

          <div className="text-white/70 text-sm sm:text-md max-w-xl font-light leading-relaxed whitespace-pre-wrap">
            <EditableText
              sectionId="hero" 
              field="description" 
              value={!sec.description || sec.description.startsWith("Greenia Homes là điểm tựa") || sec.description.startsWith("Tận tâm đồng hành") ? "Greenia Homes là điểm tựa, sự đảm bảo và đồng hành xuyên suốt quá trình để sở hữu căn nhà mơ ước của khách hàng mua để ở, đối với quý khách hàng đầu tư Greenia Homes tự tin mang đến khách hàng những sản phẩm đầu tư an toàn, sinh lời ổn định và an tâm về pháp lý BĐS.\n\nGreenia Homes chuyên cung cấp và phân phối các sản phẩm từ những CĐT uy tín như: Vinhomes, Masteri Homes, Sun Group... Các dòng sản phẩm chủ lực: Căn hộ Cao cấp, Nhà phố, Biệt thự, Dinh thự..." : sec.description} 
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              isArea 
              className="text-white/70 text-sm sm:text-md max-w-xl font-light leading-relaxed whitespace-pre-wrap" 
              tag="p" 
            />
          </div>

          <div className="flex flex-row items-center gap-2 sm:gap-4 pt-[10px] w-full">
            <button
              onClick={() => onNavigate({ screen: 'san-pham' })}
              className="flex items-center justify-center gap-1 sm:gap-2 bg-accent hover:bg-accent-hover outline-none text-text-primary font-bold px-3 sm:px-[15px] py-2 sm:py-[5px] rounded-full text-[11px] sm:text-[12px] shadow-lg cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all border-none whitespace-nowrap"
            >
              <span>{sec.extraData?.buttonText || 'Xem Ngay Sản Phẩm'}</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            </button>
            
            <a 
              href="tel:0932966700"
              className="group flex items-center justify-center gap-1 sm:gap-2 font-mono text-[11px] sm:text-xs text-slate-200 bg-white/10 backdrop-blur border border-border-inverse rounded-full px-3 sm:px-5 py-2 sm:py-3 hover:border-emerald-500 hover:text-emerald-400 transition-all cursor-pointer hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-0.5 whitespace-nowrap"
            >
              <Phone className="w-3.5 h-3.5 text-primary animate-pulse" />
              <EditableText 
                sectionId="hero" 
                field="extraData" 
                subField="hotlineText" 
                value={(sec.extraData?.hotlineText || 'Hotline 24/7: 0932 966 700').replace('Hotline 24/7: ', '').replace('Hotline 24/7:', '').trim()} 
                isEditMode={isEditMode}
                sections={sections}
                onUpdateSections={onUpdateSections}
                className="text-xs text-slate-200 group-hover:text-emerald-400 transition-colors" 
                tag="span" 
              />
            </a>
          </div>
          
          <div className="mt-[30px] pt-[15px] w-full max-w-[320px] border-t border-border-inverse/50 hidden sm:block">
            <p className="text-white/70 text-[10px] uppercase font-bold tracking-[0.2em] mb-4">ĐỐI TÁC PHÂN PHỐI CHIẾN LƯỢC CAO CẤP CỦA</p>
            <div className="flex flex-wrap items-center gap-8 opacity-70">
              <div className="flex items-center gap-2 group cursor-pointer transition-all hover:opacity-100">
                <Building2 className="w-6 h-6 text-white/70 group-hover:text-emerald-400 transition-colors" />
                <span className="font-display text-[15px] font-bold text-slate-200 tracking-widest uppercase">Vinhomes</span>
              </div>
              <div className="w-px h-6 bg-slate-700"></div>
              <div className="flex items-center gap-2 group cursor-pointer transition-all hover:opacity-100">
                <Layers className="w-[16px] h-[16px] text-white/70 group-hover:text-emerald-400 transition-colors" />
                <span className="font-display text-[14px] font-bold text-slate-200 tracking-widest uppercase">Masterise</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="lg:col-span-5 w-full flex justify-center lg:justify-end mt-12 lg:mt-0">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-border-inverse shadow-[var(--shadow-elevation)]"
            id="hero-banner-consultation-form"
          >
            <div className="bg-bg-surface backdrop-blur-md border border-border-color rounded-lg shadow-xl relative text-left pt-[20px]" style={{ width: '100%', paddingLeft: '15px', paddingRight: '15px', paddingBottom: '20px' }}>
            <div className="absolute top-0 right-0 -mr-2 -mt-2 bg-accent text-text-primary text-[10px] px-3.5 py-1 rounded-full font-bold shadow-md uppercase tracking-wide">
              Tư vấn nhanh
            </div>

            <h3 className="font-display text-xl font-bold text-primary mb-1">Yêu Cầu Tư Vấn Chuyên Sâu</h3>
            <p className="text-text-secondary text-xs mb-[15px] font-light">Chủ đầu tư sẽ trực tiếp liên hệ và gửi trọn bộ thông tin pháp lý của các biệt thự cao cấp trong vòng 5 phút.</p>

            {formSubmitted ? (
              <div className="bg-bg-base text-primary border border-border-color rounded-xl p-5 text-center space-y-3 animate-in zoom-in-95">
                <div className="w-12 h-12 rounded-full border-2 border-primary/20 flex items-center justify-center mx-auto bg-bg-surface text-primary">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="font-medium text-[15px] text-primary">Đăng ký thành công!</h5>
                  <p className="text-[11px] text-text-secondary mt-1.5 leading-relaxed">Bộ phận chăm sóc giới tinh hoa sẽ gọi đến cho quý khách trong vài phút tới qua Hotline hoặc số điện thoại {clientPhone}.</p>
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
              <form onSubmit={handleConsultationSubmit} className="p-[5px]">
                <div className="text-left mb-[5px]">
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Họ tên *"
                    className="w-full bg-bg-base border border-border-color text-text-primary text-[12px] h-[35.5px] px-3.5 pt-0 rounded-lg outline-none focus:border-primary/70 placeholder-text-secondary transition-colors"
                    required
                  />
                </div>
                <div className="text-left mb-[5px]">
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="Số điện thoại *"
                    className="w-full bg-bg-base border border-border-color text-text-primary text-[12px] px-3.5 h-[35.5px] rounded-lg outline-none focus:border-primary/70 placeholder-text-secondary transition-colors"
                    required
                  />
                </div>
                <div className="text-left mb-[5px]">
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="Email *"
                    className="w-full bg-bg-base border border-border-color text-text-primary text-[12px] px-3.5 h-[35.5px] rounded-lg outline-none focus:border-primary/70 placeholder-text-secondary transition-colors"
                    required
                  />
                </div>
                <div className="text-left mb-[10px]">
                  <textarea
                    value={clientDemand}
                    onChange={(e) => setClientDemand(e.target.value)}
                    placeholder="Nhu cầu tư vấn (VD: Tôi cần mua để ở...)"
                    rows={2}
                    className="w-full bg-bg-base border border-border-color text-text-primary text-[12px] px-3.5 py-[5px] h-[55px] rounded-lg outline-none focus:border-primary/70 placeholder-text-secondary transition-colors resize-none"
                  />
                </div>

                <div className="space-y-2.5 pt-2 mt-[14px]">
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 rounded border-border-color bg-bg-surface text-primary focus:ring-transparent h-3.5 w-3.5 cursor-pointer"
                    />
                    <span className="text-[10px] text-text-secondary leading-snug group-hover:text-text-primary">
                      Tôi đã đọc và đồng ý với{" "}
                      <button
                        type="button"
                        onClick={() => onNavigate({ screen: "terms-of-use" })}
                        className="underline text-primary hover:text-primary-light"
                      >
                        Điều khoản & Điều kiện
                      </button>{" "}
                      của Greenia Homes.
                    </span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={agreePrivacy}
                      onChange={(e) => setAgreePrivacy(e.target.checked)}
                      className="mt-0.5 rounded border-border-color bg-bg-surface text-primary focus:ring-transparent h-3.5 w-3.5 cursor-pointer"
                    />
                    <span className="text-[10px] text-text-secondary leading-snug group-hover:text-text-primary">
                      Tôi đã đọc và đồng ý với{" "}
                      <button
                        type="button"
                        onClick={() => onNavigate({ screen: "privacy-policy" })}
                        className="underline text-primary hover:text-primary-light"
                      >
                        Chính sách bảo mật dữ liệu cá nhân
                      </button>{" "}
                      của Greenia Homes.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !agreeTerms || !agreePrivacy}
                  className="w-full my-0 mt-[14px] bg-primary hover:bg-primary-light shadow-[var(--shadow-elevation)] disabled:opacity-50 text-text-inverse font-semibold py-[5px] px-4 rounded-lg text-[13px] md:text-sm transition-all cursor-pointer text-center border-none"
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
                      loading="lazy"
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
        </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

// 2. CORPORATE INTRO
export const CorporateIntroBody: React.FC<SectionRendererProps> = ({
  sec,
  isEditMode,
  sections,
  onUpdateSections
}) => {
  return (
    <section className="bg-bg-surface border-y border-border-color pt-[10px] pb-[20px] font-sans" id="home-corporate-intro">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[20px]">
        <div className="text-center space-y-3 max-w-xl mx-auto mb-16">
          <EditableText 
            sectionId="corporate_intro" 
            field="title" 
            value={sec.title} 
            isEditMode={isEditMode}
            sections={sections}
            onUpdateSections={onUpdateSections}
            className="text-3xl font-display font-medium text-primary tracking-tight text-center" 
            tag="h2" 
          />
          <EditableText 
            sectionId="corporate_intro" 
            field="description" 
            value={sec.description} 
            isEditMode={isEditMode}
            sections={sections}
            onUpdateSections={onUpdateSections}
            isArea 
            className="text-text-secondary text-xs text-center" 
            tag="p" 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {/* Vision */}
          <div className="bg-bg-surface border border-border-color p-[12px] rounded-xl hover:border-emerald-500/30 hover:bg-bg-surface shadow-xl transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Compass className="w-24 h-24" />
            </div>
            <div className="w-[35px] h-[35px] mb-[10px] bg-emerald-50 border border-emerald-100 text-primary flex items-center justify-center rounded-lg group-hover:scale-110 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <EditableText 
              sectionId="corporate_intro" 
              field="extraData" 
              subField="visionTitle" 
              value={sec.extraData?.visionTitle || 'Tầm Nhìn Sứ Mệnh'} 
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              className="font-display font-bold text-lg text-primary mb-[5px]" 
              tag="h3" 
            />
            <EditableText 
              sectionId="corporate_intro" 
              field="extraData" 
              subField="visionDesc" 
              value={sec.extraData?.visionDesc || ''} 
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              isArea 
              className="text-text-secondary text-xs font-light leading-relaxed" 
              tag="p" 
            />
          </div>

          {/* Strategy */}
          <div className="bg-bg-surface border border-border-color p-[12px] rounded-xl hover:border-emerald-500/30 hover:bg-bg-surface shadow-xl transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Shield className="w-24 h-24" />
            </div>
            <div className="w-[35px] h-[35px] mb-[10px] bg-emerald-50 border border-emerald-100 text-primary flex items-center justify-center rounded-lg group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <EditableText 
              sectionId="corporate_intro" 
              field="extraData" 
              subField="strategyTitle" 
              value={sec.extraData?.strategyTitle || 'Chiến Lược Phát Triển'} 
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              className="font-display font-bold text-lg text-primary mb-[5px]" 
              tag="h3" 
            />
            <EditableText 
              sectionId="corporate_intro" 
              field="extraData" 
              subField="strategyDesc" 
              value={sec.extraData?.strategyDesc || ''} 
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              isArea 
              className="text-text-secondary text-xs font-light leading-relaxed" 
              tag="p" 
            />
          </div>

          {/* Working Process */}
          <div className="bg-bg-surface border border-border-color pt-[12px] pl-[11px] pr-[12px] pb-[10px] rounded-xl hover:border-emerald-500/30 hover:bg-bg-surface shadow-xl transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Award className="w-24 h-24" />
            </div>
            <div className="w-[35px] h-[35px] mb-[10px] bg-emerald-50 border border-emerald-100 text-primary flex items-center justify-center rounded-lg group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <EditableText 
              sectionId="corporate_intro" 
              field="extraData" 
              subField="processTitle" 
              value={sec.extraData?.processTitle || 'Quy Trình Nghiệp Vụ'} 
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              className="font-display font-bold text-lg text-primary mb-[5px]" 
              tag="h3" 
            />
            <EditableText 
              sectionId="corporate_intro" 
              field="extraData" 
              subField="processDesc" 
              value={sec.extraData?.processDesc || ''} 
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              isArea 
              className="text-text-secondary text-xs font-light leading-relaxed" 
              tag="p" 
            />
          </div>
        </div>
      </div>
    </section>
  );
};

// 3. REASONS CHOOSE
export const ReasonsBody: React.FC<SectionRendererProps> = ({
  sec,
  isEditMode,
  sections,
  onUpdateSections
}) => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-none font-sans pb-[10px] sm:pb-0" id="home-reasons-choose">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 items-center">
        <div className="md:col-span-1 lg:col-span-6 space-y-6 text-left">
          <EditableText 
            sectionId="reasons" 
            field="title" 
            value={sec.title} 
            isEditMode={isEditMode}
            sections={sections}
            onUpdateSections={onUpdateSections}
            className="text-[25px] font-display font-medium text-primary tracking-tight leading-tight" 
            tag="h2" 
          />
          <EditableText 
            sectionId="reasons" 
            field="description" 
            value={sec.description} 
            isEditMode={isEditMode}
            sections={sections}
            onUpdateSections={onUpdateSections}
            isArea 
            className="text-text-secondary text-sm leading-relaxed font-light" 
            tag="p" 
          />
          
          <div className="space-y-6 pt-[0px] w-full sm:max-w-[360px] md:max-w-none">
            <div className="flex items-start gap-4 p-[10px] mb-[5px] rounded-xl hover:bg-bg-surface transition-colors border border-transparent hover:border-border-color">
              <div className="bg-emerald-50 w-10 h-10 rounded-full flex items-center justify-center text-primary font-bold font-mono text-sm shrink-0 border border-emerald-100 shadow-inner">01</div>
              <div>
                <EditableText 
                  sectionId="reasons" 
                  field="extraData" 
                  subField="item1Title" 
                  value={sec.extraData?.item1Title || 'Bảo mật thông tin tối thượng'} 
                  isEditMode={isEditMode}
                  sections={sections}
                  onUpdateSections={onUpdateSections}
                  className="text-primary text-base font-medium tracking-wide" 
                  tag="h4" 
                />
                <EditableText 
                  sectionId="reasons" 
                  field="extraData" 
                  subField="item1Desc" 
                  value={sec.extraData?.item1Desc || ''} 
                  isEditMode={isEditMode}
                  sections={sections}
                  onUpdateSections={onUpdateSections}
                  isArea 
                  className="text-text-secondary text-xs font-light mt-1.5 leading-relaxed" 
                  tag="p" 
                />
              </div>
            </div>

            <div className="flex items-start gap-4 p-[10px] mb-[10px] rounded-xl hover:bg-bg-surface transition-colors border border-transparent hover:border-border-color">
              <div className="bg-emerald-50 w-10 h-10 rounded-full flex items-center justify-center text-primary font-bold font-mono text-sm shrink-0 border border-emerald-100 shadow-inner">02</div>
              <div>
                <EditableText 
                  sectionId="reasons" 
                  field="extraData" 
                  subField="item2Title" 
                  value={sec.extraData?.item2Title || 'Tập trung rạch ròi mảng xanh'} 
                  isEditMode={isEditMode}
                  sections={sections}
                  onUpdateSections={onUpdateSections}
                  className="text-primary text-base font-medium tracking-wide" 
                  tag="h4" 
                />
                <EditableText 
                  sectionId="reasons" 
                  field="extraData" 
                  subField="item2Desc" 
                  value={sec.extraData?.item2Desc || ''} 
                  isEditMode={isEditMode}
                  sections={sections}
                  onUpdateSections={onUpdateSections}
                  isArea 
                  className="text-text-secondary text-xs font-light mt-1.5 leading-relaxed" 
                  tag="p" 
                />
              </div>
            </div>

            <div className="flex items-start gap-4 p-[10px] rounded-xl hover:bg-bg-surface transition-colors border border-transparent hover:border-border-color">
              <div className="bg-emerald-50 w-10 h-10 rounded-full flex items-center justify-center text-primary font-bold font-mono text-sm shrink-0 border border-emerald-100 shadow-inner">03</div>
              <div>
                <EditableText 
                  sectionId="reasons" 
                  field="extraData" 
                  subField="item3Title" 
                  value={sec.extraData?.item3Title || 'Thủ tục pháp lý mượt mà'} 
                  isEditMode={isEditMode}
                  sections={sections}
                  onUpdateSections={onUpdateSections}
                  className="text-primary text-base font-medium tracking-wide" 
                  tag="h4" 
                />
                <EditableText 
                  sectionId="reasons" 
                  field="extraData" 
                  subField="item3Desc" 
                  value={sec.extraData?.item3Desc || ''} 
                  isEditMode={isEditMode}
                  sections={sections}
                  onUpdateSections={onUpdateSections}
                  isArea 
                  className="text-text-secondary text-xs font-light mt-1.5 leading-relaxed" 
                  tag="p" 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-1 lg:col-span-6 grid grid-cols-2 gap-4 w-full lg:max-w-[475px] lg:mx-auto" id="numbers-choose">
          <div className="bg-bg-surface p-[10px] sm:p-[12px] w-full h-auto sm:min-h-[195px] lg:min-h-[160px] rounded-2xl border border-border-color shadow-xl space-y-3 text-left hover:border-emerald-500/30 transition-colors col-span-1">
            <EditableText 
              sectionId="reasons" 
              field="extraData" 
              subField="stat1Val" 
              value={sec.extraData?.stat1Val || '1,500+'} 
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              className="text-[20px] sm:text-[30px] font-bold font-display text-primary inline-block mb-1" 
              tag="h3" 
            />
            <EditableText 
              sectionId="reasons" 
              field="extraData" 
              subField="stat1Label" 
              value={sec.extraData?.stat1Label || 'Khách Hàng Hài Lòng'} 
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              className="mb-[5px] sm:mb-0 text-primary tracking-widest uppercase text-[9px] sm:text-[10px] font-bold" 
              tag="p" 
            />
            <EditableText 
              sectionId="reasons" 
              field="extraData" 
              subField="stat1Desc" 
              value={sec.extraData?.stat1Desc || ''} 
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              isArea 
              className="text-text-secondary text-[10px] sm:text-xs font-light leading-relaxed pt-[5px] sm:pt-2" 
              tag="p" 
            />
          </div>

          <div className="bg-bg-surface p-[10px] sm:p-[12px] w-full h-auto sm:min-h-[195px] lg:min-h-[160px] rounded-2xl border border-border-color shadow-xl space-y-3 text-left hover:border-emerald-500/30 transition-colors col-span-1">
            <EditableText 
              sectionId="reasons" 
              field="extraData" 
              subField="stat2Val" 
              value={sec.extraData?.stat2Val || '98.8%'} 
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              className="text-[20px] sm:text-[30px] font-bold font-display text-primary inline-block mb-1" 
              tag="h3" 
            />
            <EditableText 
              sectionId="reasons" 
              field="extraData" 
              subField="stat2Label" 
              value={sec.extraData?.stat2Label || 'Bàn giao chuẩn chỉ pháp lý'} 
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              className="mb-[5px] sm:mb-0 text-primary tracking-widest uppercase text-[9px] sm:text-[10px] font-bold" 
              tag="p" 
            />
            <EditableText 
              sectionId="reasons" 
              field="extraData" 
              subField="stat2Desc" 
              value={sec.extraData?.stat2Desc || ''} 
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              isArea 
              className="text-text-secondary text-[10px] sm:text-xs font-light leading-relaxed pt-[5px] sm:pt-2" 
              tag="p" 
            />
          </div>

          <div className="bg-bg-surface p-[10px] sm:p-[12px] w-full lg:h-[146px] rounded-2xl border border-border-color shadow-xl space-y-3 text-left col-span-2 hover:border-emerald-500/30 transition-colors">
            <EditableText 
              sectionId="reasons" 
              field="extraData" 
              subField="stat3Val" 
              value={sec.extraData?.stat3Val || '0% lo ngại'} 
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              className="text-[25px] sm:text-[30px] font-bold font-display text-primary inline-block mb-1" 
              tag="h3" 
            />
            <EditableText 
              sectionId="reasons" 
              field="extraData" 
              subField="stat3Label" 
              value={sec.extraData?.stat3Label || 'Giải pháp độc quyền phong thủy'} 
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              className="mb-[5px] sm:mb-0 text-primary tracking-widest uppercase text-[10px] font-bold" 
              tag="p" 
            />
            <EditableText 
              sectionId="reasons" 
              field="extraData" 
              subField="stat3Desc" 
              value={sec.extraData?.stat3Desc || ''} 
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              isArea 
              className="text-text-secondary text-[10px] sm:text-xs font-light leading-relaxed pt-[5px] sm:pt-2 max-w-lg" 
              tag="p" 
            />
          </div>
        </div>
      </div>
    </section>
  );
};

// 4. FEATURED LISTINGS
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
                className="inline-flex items-center gap-2 bg-bg-surface hover:bg-bg-surface text-text-secondary hover:text-primary border border-border-color shadow-sm px-6 py-3 rounded-full transition-all text-xs font-semibold cursor-pointer border-solid"
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

// 5. PROJECTS
interface ProjectsProps extends SectionRendererProps {
  projects: Project[];
}

export const ProjectsBody: React.FC<ProjectsProps> = ({
  sec,
  isEditMode,
  sections,
  onUpdateSections,
  onNavigate,
  projects
}) => {
  return (
    <section className="bg-bg-surface border-y border-border-color py-1 font-sans" id="home-swiper-projects">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pt-[25px]">
        <div className="flex flex-row items-center justify-between gap-4 text-left">
          <div>
            <EditableText 
              sectionId="projects" 
              field="title" 
              value={sec.title === 'Khu Đại Đô Thị Nổi Bật' ? 'Dự Án Nổi Bật' : sec.title} 
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              className="text-2xl sm:text-3xl font-display font-medium text-primary tracking-tight" 
              tag="h2" 
            />
            <EditableText 
              sectionId="projects" 
              field="description" 
              value={sec.description} 
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              isArea 
              className="text-text-secondary text-xs font-light" 
              tag="p" 
            />
          </div>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => onNavigate({ screen: 'du-an' })}
            className="text-primary hover:text-primary font-sans text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            Xem thêm <ChevronRight className="w-4 h-4 ml-0.5" />
          </button>
        </div>
        </div>

        {projects.length === 0 ? (
          <div className="text-white/70 text-xs py-6 text-center">Chưa có dự án nào được cập nhật.</div>
        ) : (
          <div className="relative overflow-hidden py-4 w-full">
            <style>{`
              @keyframes sliderScrollProjects {
                0% { transform: translateX(0); }
                100% { transform: translateX(calc(-16.666666%)); }
              }
              .animate-slider-projects {
                animation: sliderScrollProjects 15s linear infinite;
              }
              .animate-sliding-container:hover .animate-slider-projects {
                animation-play-state: paused;
              }
            `}</style>
            <div className="animate-sliding-container flex w-max">
              <div className="flex w-max animate-slider-projects">
                {[...Array(6)].flatMap(() => projects.slice(0, 5)).map((proj, idx) => (
                  <div
                    key={`${proj.id}-${idx}`}
                    onClick={() => onNavigate({ screen: 'project-detail', projectId: proj.id, slug: generateSlug(proj.title) })}
                    className="w-[260px] sm:w-[280px] md:w-[240px] lg:w-[223px] shrink-0 mr-4 lg:mr-5 bg-bg-surface hover:bg-bg-surface border border-border-color hover:border-emerald-500/30 shadow-md rounded-lg overflow-hidden group hover:scale-[1.01] transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img loading="lazy" decoding="async"
                        src={optimizeImageUrl(proj.imageUrl || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800", 400) || undefined}
                        alt={proj.title}
                        width="800"
                        height="500"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2 left-2 px-2.5 py-1 bg-[#0f9b0f] text-white text-[11px] font-bold rounded shadow-sm z-10">
                        {proj.status === 'handed_over' ? 'Đã bàn giao' : proj.status === 'coming_soon' ? 'Sắp ra mắt' : 'Đang mở bán'}
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-[13px] sm:text-[15px] font-bold text-text-primary mb-2 line-clamp-2 transition-colors group-hover:text-primary">
                          {proj.title}
                        </h4>
                        <div className="flex items-center justify-between text-xs mb-3">
                          <span className="text-text-secondary">Giá từ:</span>
                          <span className="text-primary font-bold text-[13px]">{proj.priceText || "Đang cập nhật"}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-[11px] text-text-secondary mb-2">
                          <div className="flex items-center gap-1.5 flex-1">
                            <Layers className="w-3 h-3 text-text-secondary shrink-0" />
                            <span className="truncate" title={proj.scale || 'Đang cập nhật'}>{proj.scale || 'Đang cập nhật'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-1">
                            <Building2 className="w-3 h-3 text-text-secondary shrink-0" />
                            <span className="truncate" title={proj.units ? String(proj.units) : 'Đang cập nhật'}>{proj.units ? `${proj.units} căn` : 'Đang cập nhật'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-1.5 text-[11px] text-text-secondary mt-auto pt-2 border-t border-border-color/50">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-[1px]" />
                        <span className="line-clamp-2">
                          {proj.location || proj.title}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

// 6. NEWS
interface NewsProps extends SectionRendererProps {
  news: News[];
}

export const NewsBody: React.FC<NewsProps> = ({
  sec,
  isEditMode,
  sections,
  onUpdateSections,
  onNavigate,
  news
}) => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 font-sans" id="home-swiper-news">
      <div className="flex flex-row items-center justify-between gap-4 text-left">
        <div>
          <EditableText 
            sectionId="news" 
            field="title" 
            value={sec.title === 'Kinh Nghiệm & Phân Tích Địa Ốc' ? 'Tin tức & Sự kiện' : sec.title} 
            isEditMode={isEditMode}
            sections={sections}
            onUpdateSections={onUpdateSections}
            className="text-2xl sm:text-3xl font-display font-medium text-primary tracking-tight" 
            tag="h2" 
          />
          <EditableText 
            sectionId="news" 
            field="description" 
            value={sec.description === 'Tin nhanh vi mô và phong thủy phong phú cung cấp từ đội ngũ biên soạn Greenia.' ? 'Cập nhận tin tức, sự kiện mới nhất trong thị trường BĐS tại Tp HCM và khu vực lân cận' : sec.description} 
            isEditMode={isEditMode}
            sections={sections}
            onUpdateSections={onUpdateSections}
            isArea 
            className="text-text-secondary text-xs font-light" 
            tag="p" 
          />
        </div>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => onNavigate({ screen: 'tin-tuc' })}
            className="text-primary hover:text-primary font-sans text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            Xem thêm <ChevronRight className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>

      {news.length === 0 ? (
        <div className="text-white/70 text-xs py-6 text-center">Chưa có tin tức nào được cập nhật.</div>
      ) : (
        <div className="relative overflow-hidden py-4 w-full">
          <style>{`
            @keyframes sliderScrollNews {
              0% { transform: translateX(0); }
              100% { transform: translateX(calc(-16.666666%)); }
            }
            .animate-slider-news {
              animation: sliderScrollNews 25s linear infinite;
            }
            .animate-sliding-container:hover .animate-slider-news {
              animation-play-state: paused;
            }
          `}</style>
          <div className="animate-sliding-container flex w-max">
            <div className="flex w-max animate-slider-news">
              {[...Array(6)].flatMap(() => news.slice(0, 5)).map((article, idx) => (
                <div
                  key={`${article.id}-${idx}`}
                  onClick={() => onNavigate({ screen: 'news-detail', newsId: article.id, slug: generateSlug(article.title) })}
                  className="w-[260px] sm:w-[280px] md:w-[240px] lg:w-[223px] shrink-0 mr-4 lg:mr-5 bg-bg-surface hover:bg-bg-surface border border-border-color hover:border-emerald-500/30 shadow-md rounded-lg overflow-hidden group hover:scale-[1.01] transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img loading="lazy" decoding="async"
                      src={optimizeImageUrl(article.imageUrl || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800", 400) || undefined}
                      alt={article.title}
                      width="800"
                      height="500"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[8px] text-slate-505 font-mono">
                        <Calendar className="w-2.5 h-2.5" />
                        <span>{new Date(article.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <h3 className="font-display font-medium text-xs text-primary group-hover:text-primary transition-colors line-clamp-2 leading-relaxed h-8">
                        {article.title}
                      </h3>
                      <p className="text-text-secondary text-[10px] font-light line-clamp-2 leading-relaxed h-11">
                        {article.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border-color flex items-center justify-between text-[9px] text-white/70">
                      <span></span>
                      <span className="text-primary font-bold shrink-0">Xem thêm →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
