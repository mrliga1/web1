import React from 'react';
import { 
  Sparkles, ArrowRight, User, Phone, CheckCircle2, 
  MapPin, ChevronRight, Compass, Shield, Award, Calendar,
  Building2, Layers
} from 'lucide-react';
import { Product, Project, News, RouteState, VisualSection } from '../types';
import { EditableText, EditableImage } from './EditableComponent';
import ProductCard from './ProductCard';

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
  isSubmitting,
  handleConsultationSubmit,
  onShowNotification
}) => {
  return (
    <section 
      className="relative min-h-[640px] flex items-center justify-center p-6 md:p-12 lg:p-20 overflow-hidden bg-slate-950 rounded-lg" 
      id="home-hero-banner"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,#065f46,transparent_45%)] opacity-35" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/90 to-slate-950" />
      <div 
        className="absolute inset-0 opacity-15 grayscale contrast-125 mix-blend-overlay"
        style={{ backgroundImage: `url('${sec.imageUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1600'}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      {isEditMode && (
        <div className="absolute top-16 right-4 z-40 bg-slate-900 border border-slate-800 p-2.5 rounded-lg shadow-2xl flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <span className="text-[10px] text-slate-350 font-bold font-mono">Ảnh nền Hero:</span>
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

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 py-12">
        <div className="lg:col-span-7 space-y-6 text-left" id="banner-intro-txt">
          <EditableText 
            sectionId="hero" 
            field="title" 
            value={sec.title} 
            isEditMode={isEditMode}
            sections={sections}
            onUpdateSections={onUpdateSections}
            className="text-4xl sm:text-5.5xl lg:text-3xl font-display font-medium tracking-tight text-white leading-tight" 
            tag="h1" 
          />

          <EditableText 
            sectionId="hero" 
            field="description" 
            value={sec.description} 
            isEditMode={isEditMode}
            sections={sections}
            onUpdateSections={onUpdateSections}
            isArea 
            className="text-slate-300 text-sm sm:text-md max-w-xl font-light leading-relaxed" 
            tag="p" 
          />

          <div className="flex flex-wrap gap-4 pt-4">
            <button
              onClick={() => onNavigate({ screen: 'san-pham' })}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-semibold px-6 py-3.5 rounded-full text-sm shadow-xl shadow-emerald-500/10 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all border-none"
            >
              <span>{sec.extraData?.buttonText || 'Xem Ngay Sản Phẩm'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-2 font-mono text-xs text-slate-400 bg-slate-900/60 backdrop-blur border border-slate-800 rounded-full px-5 py-3">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <EditableText 
                sectionId="hero" 
                field="extraData" 
                subField="hotlineText" 
                value={sec.extraData?.hotlineText || 'Hotline 24/7: 0932 966 700'} 
                isEditMode={isEditMode}
                sections={sections}
                onUpdateSections={onUpdateSections}
                className="text-xs text-slate-300" 
                tag="span" 
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-5" id="hero-banner-consultation-form">
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 p-8 rounded-lg shadow-2xl relative text-left">
            <div className="absolute top-0 right-0 -mr-2 -mt-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-[10px] px-3.5 py-1 rounded-full font-bold shadow-md uppercase tracking-wide">
              Tư vấn nhanh
            </div>

            <h3 className="font-display text-xl font-bold text-white mb-1">Yêu Cầu Tư Vấn Chuyên Sâu</h3>
            <p className="text-slate-400 text-xs mb-6 font-light">Chủ đầu tư sẽ trực tiếp liên hệ và gửi trọn bộ thông tin pháp lý của các biệt thự cao cấp trong vòng 5 phút.</p>

            {formSubmitted ? (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-amber-500 text-slate-950 flex items-center justify-center rounded-full mx-auto shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">Gửi Yêu Cầu Tư Vấn Thành Công!</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">Bộ phận chăm sóc giới tinh hoa sẽ gọi đến cho quý khách trong vài phút tới qua Hotline.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormSubmitted(false)}
                  className="text-amber-400 text-xs font-semibold hover:underline border-none bg-transparent cursor-pointer"
                >
                  Gửi yêu cầu tư vấn khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleConsultationSubmit} className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1.5 uppercase">Tên Quý Khách</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Thanh Thuận"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white rounded-lg py-3 pl-11 pr-4 text-xs font-light transition-all outline-none"
                      required
                    />
                    <User className="absolute left-4 top-3.5 text-slate-500 w-4 h-4" />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1.5 uppercase">Số Điện Thoại</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="Số của quý khách e.g. 0932..."
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white rounded-lg py-3 pl-11 pr-4 text-xs font-light transition-all outline-none"
                      required
                    />
                    <Phone className="absolute left-4 top-3.5 text-slate-500 w-4 h-4" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-amber-500 text-slate-950 font-bold py-3.5 px-4 rounded-lg hover:bg-amber-400 transition-all font-display text-xs tracking-wider uppercase cursor-pointer border-none"
                >
                  {isSubmitting ? 'ĐANG GỬI THÔNG TIN...' : 'ĐĂNG KÝ NHẬN TƯ VẤN NGAY'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
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
    <section className="bg-slate-900/30 border-y border-slate-900 py-1 font-sans" id="home-corporate-intro">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 max-w-xl mx-auto mb-16">
          <EditableText 
            sectionId="corporate_intro" 
            field="title" 
            value={sec.title} 
            isEditMode={isEditMode}
            sections={sections}
            onUpdateSections={onUpdateSections}
            className="text-3xl font-display font-medium text-white tracking-tight text-center" 
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
            className="text-slate-400 text-xs text-center" 
            tag="p" 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {/* Vision */}
          <div className="bg-slate-900/60 border border-slate-850 p-8 rounded-lg hover:border-amber-500/20 transition-all group">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-400 flex items-center justify-center rounded-lg mb-6 group-hover:scale-110 transition-transform">
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
              className="font-display font-bold text-lg text-white mb-3" 
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
              className="text-slate-300 text-xs font-light leading-relaxed" 
              tag="p" 
            />
          </div>

          {/* Strategy */}
          <div className="bg-slate-900/60 border border-slate-850 p-8 rounded-lg hover:border-amber-500/20 transition-all group">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-400 flex items-center justify-center rounded-lg mb-6 group-hover:scale-110 transition-transform">
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
              className="font-display font-bold text-lg text-white mb-3" 
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
              className="text-slate-300 text-xs font-light leading-relaxed" 
              tag="p" 
            />
          </div>

          {/* Working Process */}
          <div className="bg-slate-900/60 border border-slate-850 p-8 rounded-lg hover:border-amber-500/20 transition-all group">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-400 flex items-center justify-center rounded-lg mb-6 group-hover:scale-110 transition-transform">
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
              className="font-display font-bold text-lg text-white mb-3" 
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
              className="text-slate-300 text-xs font-light leading-relaxed" 
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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-none font-sans" id="home-reasons-choose">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-5 space-y-6 text-left">
          <EditableText 
            sectionId="reasons" 
            field="title" 
            value={sec.title} 
            isEditMode={isEditMode}
            sections={sections}
            onUpdateSections={onUpdateSections}
            className="text-3xl sm:text-4xl font-display font-medium text-white tracking-tight leading-tight" 
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
            className="text-slate-400 text-xs leading-relaxed font-light" 
            tag="p" 
          />
          
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3">
              <div className="bg-amber-500/15 p-1 px-2.5 rounded-lg text-amber-400 font-bold text-xs mt-0.5">01</div>
              <div>
                <EditableText 
                  sectionId="reasons" 
                  field="extraData" 
                  subField="item1Title" 
                  value={sec.extraData?.item1Title || 'Bảo mật thông tin tối thượng'} 
                  isEditMode={isEditMode}
                  sections={sections}
                  onUpdateSections={onUpdateSections}
                  className="text-white text-sm font-semibold" 
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
                  className="text-slate-400 text-xs font-light mt-0.5" 
                  tag="p" 
                />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-amber-500/15 p-1 px-2.5 rounded-lg text-amber-400 font-bold text-xs mt-0.5">02</div>
              <div>
                <EditableText 
                  sectionId="reasons" 
                  field="extraData" 
                  subField="item2Title" 
                  value={sec.extraData?.item2Title || 'Tập trung rạch ròi mảng xanh'} 
                  isEditMode={isEditMode}
                  sections={sections}
                  onUpdateSections={onUpdateSections}
                  className="text-white text-sm font-semibold" 
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
                  className="text-slate-400 text-xs font-light mt-0.5" 
                  tag="p" 
                />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-amber-500/15 p-1 px-2.5 rounded-lg text-amber-400 font-bold text-xs mt-0.5">03</div>
              <div>
                <EditableText 
                  sectionId="reasons" 
                  field="extraData" 
                  subField="item3Title" 
                  value={sec.extraData?.item3Title || 'Thủ tục pháp lý mượt mà'} 
                  isEditMode={isEditMode}
                  sections={sections}
                  onUpdateSections={onUpdateSections}
                  className="text-white text-sm font-semibold" 
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
                  className="text-slate-400 text-xs font-light mt-0.5" 
                  tag="p" 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 grid grid-cols-2 gap-6" id="numbers-choose">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-8 rounded-lg border border-slate-900 space-y-2 text-left">
            <EditableText 
              sectionId="reasons" 
              field="extraData" 
              subField="stat1Val" 
              value={sec.extraData?.stat1Val || '12,500+'} 
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              className="text-4xl font-bold font-display text-amber-400 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 inline-block" 
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
              className="text-white text-sm font-medium" 
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
              className="text-slate-400 text-xs font-light leading-relaxed" 
              tag="p" 
            />
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-8 rounded-lg border border-slate-900 space-y-2 text-left">
            <EditableText 
              sectionId="reasons" 
              field="extraData" 
              subField="stat2Val" 
              value={sec.extraData?.stat2Val || '98.8%'} 
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              className="text-4xl font-bold font-display text-amber-400 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 inline-block" 
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
              className="text-white text-sm font-medium" 
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
              className="text-slate-400 text-xs font-light leading-relaxed" 
              tag="p" 
            />
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-8 rounded-lg border border-slate-900 space-y-2 text-left col-span-2">
            <EditableText 
              sectionId="reasons" 
              field="extraData" 
              subField="stat3Val" 
              value={sec.extraData?.stat3Val || '0% lo ngại'} 
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              className="text-4xl font-bold font-display text-amber-400 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 inline-block" 
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
              className="text-white text-sm font-medium" 
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
              className="text-slate-400 text-xs font-light leading-relaxed" 
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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 font-sans" id="home-grid-products">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 text-left">
        <div>
          <EditableText 
            sectionId="featured_listings" 
            field="title" 
            value={sec.title} 
            isEditMode={isEditMode}
            sections={sections}
            onUpdateSections={onUpdateSections}
            className="text-2xl sm:text-3xl font-display font-medium text-white tracking-tight" 
            tag="h2" 
          />
          <EditableText 
            sectionId="featured_listings" 
            field="description" 
            value={sec.description} 
            isEditMode={isEditMode}
            sections={sections}
            onUpdateSections={onUpdateSections}
            isArea 
            className="text-slate-400 text-xs font-light mt-1" 
            tag="p" 
          />
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-400 shrink-0">
          <span>Hiển thị: </span>
          <span className="text-amber-400 font-semibold">{currentDisplayedProducts.length} / {products.length} sản phẩm</span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center animate-pulse">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : currentDisplayedProducts.length === 0 ? (
        <div className="text-center py-10 text-slate-500 text-xs">Hiện tại chưa có sản phẩm nào được phê duyệt.</div>
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
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-850 text-slate-100 hover:text-amber-400 border border-slate-800 px-6 py-3 rounded-full transition-all text-xs font-semibold cursor-pointer border-solid"
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
    <section className="bg-slate-900/10 border-y border-slate-900 py-1 font-sans" id="home-swiper-projects">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 text-left">
          <div>
            <EditableText 
              sectionId="projects" 
              field="title" 
              value={sec.title} 
              isEditMode={isEditMode}
              sections={sections}
              onUpdateSections={onUpdateSections}
              className="text-2xl sm:text-3xl font-display font-medium text-white tracking-tight" 
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
              className="text-slate-400 text-xs font-light" 
              tag="p" 
            />
          </div>

          <button
            type="button"
            onClick={() => onNavigate({ screen: 'du-an' })}
            className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 hover:border-amber-500/20 text-xs font-semibold text-amber-400 px-4 py-2.5 rounded-full transition-all border-none cursor-pointer"
          >
            <span>Xem Thêm Dự Án (Trang Dự Án)</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-slate-500 text-xs py-6 text-center">Chưa có dự án nào được cập nhật.</div>
        ) : (
          <div className="relative overflow-hidden py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            <style>{`
              @keyframes sliderScroll {
                0% { transform: translateX(0); }
                100% { transform: translateX(calc(-16.666666%)); }
              }
              .animate-slider {
                animation: sliderScroll 25s linear infinite;
              }
              .animate-sliding-container:hover .animate-slider {
                animation-play-state: paused;
              }
            `}</style>
            <div className="animate-sliding-container flex w-max">
              <div className="flex w-max animate-slider">
                {[...Array(6)].flatMap(() => projects.slice(0, 4)).map((proj, idx) => (
                  <div
                    key={`${proj.id}-${idx}`}
                    onClick={() => onNavigate({ screen: 'project-detail', projectId: proj.id })}
                    className="w-[280px] lg:w-[320px] shrink-0 mr-5 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-amber-500/20 rounded-lg overflow-hidden group hover:scale-[1.01] transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={(proj.imageUrl || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800") || undefined}
                        alt={proj.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2.5 left-2.5">
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm ${
                          proj.status === 'opening' 
                            ? 'bg-amber-500 text-slate-950' 
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {proj.status === 'opening' ? 'Đang Mở Bán' : 'Đã Bàn Giao'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-display font-medium text-sm text-white group-hover:text-amber-400 transition-colors line-clamp-1 leading-relaxed mb-2">
                          {proj.title}
                        </h3>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] text-slate-400">Giá từ:</span>
                          <span className="text-[11px] text-amber-500 font-bold">{proj.priceText || "Giá liên hệ"}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-2">
                          <div className="flex items-center gap-1 flex-1">
                            <Layers className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate" title={proj.scale || 'Đang cập nhật'}>{proj.scale || 'Đang cập nhật'}</span>
                          </div>
                          <div className="flex items-center gap-1 flex-1">
                            <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate" title={proj.units ? String(proj.units) : 'Đang cập nhật'}>{proj.units ? `${proj.units} căn` : 'Đang cập nhật'}</span>
                          </div>
                        </div>

                      </div>

                      <div className="flex items-start gap-1 text-[9px] text-slate-400 mt-auto pt-1">
                        <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="line-clamp-2">{proj.location}</span>
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
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 text-left">
        <div>
          <EditableText 
            sectionId="news" 
            field="title" 
            value={sec.title} 
            isEditMode={isEditMode}
            sections={sections}
            onUpdateSections={onUpdateSections}
            className="text-2xl sm:text-3xl font-display font-medium text-white tracking-tight" 
            tag="h2" 
          />
          <EditableText 
            sectionId="news" 
            field="description" 
            value={sec.description} 
            isEditMode={isEditMode}
            sections={sections}
            onUpdateSections={onUpdateSections}
            isArea 
            className="text-slate-400 text-xs font-light" 
            tag="p" 
          />
        </div>

        <button
          type="button"
          onClick={() => onNavigate({ screen: 'tin-tuc' })}
          className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 hover:border-amber-500/20 text-xs font-semibold text-amber-400 px-4 py-2.5 rounded-full transition-all border-none cursor-pointer"
        >
          <span>Xem Thêm Tin Tức (Trang Tin Tức)</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {news.length === 0 ? (
        <div className="text-slate-500 text-xs py-6 text-center">Chưa có tin tức nào được cập nhật.</div>
      ) : (
        <div className="relative overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-850 scrollbar-track-transparent">
          <div className="flex gap-5 min-w-[1000px] lg:min-w-0 lg:grid lg:grid-cols-5 text-left">
            {news.slice(0, 5).map((article) => (
              <div
                key={article.id}
                onClick={() => onNavigate({ screen: 'news-detail', newsId: article.id })}
                className="w-[280px] lg:w-auto shrink-0 bg-slate-900/40 hover:bg-slate-900 border border-slate-850 hover:border-amber-500/20 rounded-lg overflow-hidden group hover:scale-[1.01] transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={(article.imageUrl || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800") || undefined}
                    alt={article.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="text-[8px] font-bold bg-slate-950/80 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      {article.category}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[8px] text-slate-505 font-mono">
                      <Calendar className="w-2.5 h-2.5" />
                      <span>{new Date(article.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <h3 className="font-display font-medium text-xs text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-relaxed h-8">
                      {article.title}
                    </h3>
                    <p className="text-slate-400 text-[10px] font-light line-clamp-2 leading-relaxed h-11">
                      {article.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-[9px] text-slate-500">
                    <span>BTV Greenia</span>
                    <span className="text-amber-400 font-bold shrink-0">Đọc →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
