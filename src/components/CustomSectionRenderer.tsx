import React from 'react';
import { Sparkles, Phone, Mail, CheckCircle, ShieldCheck, Star } from 'lucide-react';
import { VisualSection } from '../types';
import dynamic from 'next/dynamic';
const VisualDragCanvas = dynamic(() => import('./VisualDragCanvas'));

interface CustomSectionRendererProps {
  section: VisualSection;
  isEditMode: boolean;
  EditableText: any;
  EditableImage: any;
  onNavigate: (route: any) => void;
  sections: any[];
  onUpdateSections: (sections: any[]) => void;
  onShowNotification?: (message: string, type: 'success' | 'error') => void;
}

export default function CustomSectionRenderer({
  section,
  isEditMode,
  EditableText,
  EditableImage,
  onNavigate,
  sections,
  onUpdateSections,
  onShowNotification
}: CustomSectionRendererProps) {
  // If this is a free-form visual drag canvas
  if (section.id.startsWith('custom_free_canvas_')) {
    return (
      <VisualDragCanvas
        section={section}
        isEditMode={isEditMode}
        sections={sections}
        onUpdateSections={onUpdateSections}
        onShowNotification={onShowNotification || (() => {})}
      />
    );
  }

  // Determine template based on section ID prefix
  if (section.id.startsWith('custom_banner_promo')) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id={section.id}>
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-black border border-border-color p-8 sm:p-12 md:p-16 flex flex-col md:flex-row gap-8 md:gap-12 items-center text-left">
          
          <div className="flex-1 space-y-5">
            <EditableText 
              sectionId={section.id} 
              field="subtitle" 
              value={section.subtitle} 
              isEditMode={isEditMode} 
              sections={sections} 
              onUpdateSections={onUpdateSections}
              className="text-[10px] font-bold uppercase tracking-widest text-primary font-mono"
            />
            
            <EditableText 
              sectionId={section.id} 
              field="title" 
              value={section.title} 
              isEditMode={isEditMode} 
              sections={sections} 
              onUpdateSections={onUpdateSections}
              tag="h2"
              className="text-2xl sm:text-3.5xl font-display font-medium text-text-primary tracking-tight leading-snug"
            />
            
            <EditableText 
              sectionId={section.id} 
              field="description" 
              value={section.description} 
              isEditMode={isEditMode} 
              sections={sections} 
              onUpdateSections={onUpdateSections}
              isArea={true}
              className="text-text-secondary text-xs font-light leading-relaxed max-w-xl"
            />

            <div className="pt-2">
              <button 
                onClick={() => {
                  const url = section.extraData?.linkUrl || '#lien-he';
                  window.location.hash = url.replace('#', '');
                }}
                className="bg-primary hover:bg-amber-600 active:scale-95 text-black font-extrabold text-xs uppercase tracking-wider px-6 py-3.5 rounded-lg cursor-pointer shadow-lg transition-transform duration-150"
              >
                <EditableText 
                  sectionId={section.id} 
                  field="extraData"
                  subField="buttonText"
                  value={section.extraData?.buttonText || 'Tìm hiểu đặc quyền'} 
                  isEditMode={isEditMode} 
                  sections={sections} 
                  onUpdateSections={onUpdateSections}
                  tag="span"
                />
              </button>
            </div>
          </div>

          <div className="w-full md:w-2/5 aspect-[4/3] rounded-lg overflow-hidden bg-bg-surface border border-border-color">
            <EditableImage 
              sectionId={section.id} 
              field="imageUrl" 
              imageUrl={section.imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800'} 
              isEditMode={isEditMode} 
              sections={sections} 
              onUpdateSections={onUpdateSections}
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    );
  }

  if (section.id.startsWith('custom_cta_call')) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8" id={section.id}>
        <div className="bg-bg-surface border border-border-color p-8 sm:p-10 rounded-lg space-y-6 text-center">
          <div className="max-w-xl mx-auto space-y-2">
            <EditableText 
              sectionId={section.id} 
              field="subtitle" 
              value={section.subtitle} 
              isEditMode={isEditMode} 
              sections={sections} 
              onUpdateSections={onUpdateSections}
              className="text-[10px] font-bold uppercase tracking-widest text-primary font-mono"
            />
            
            <EditableText 
              sectionId={section.id} 
              field="title" 
              value={section.title} 
              isEditMode={isEditMode} 
              sections={sections} 
              onUpdateSections={onUpdateSections}
              tag="h2"
              className="text-xl sm:text-2.5xl font-display font-medium text-text-primary tracking-tight"
            />

            <EditableText 
              sectionId={section.id} 
              field="description" 
              value={section.description} 
              isEditMode={isEditMode} 
              sections={sections} 
              onUpdateSections={onUpdateSections}
              isArea={true}
              className="text-text-secondary text-xs font-light leading-relaxed max-w-md mx-auto"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto text-left pt-2">
            <a 
              href={`tel:${(section.extraData?.hotline || '').replace(/[^0-9+]/g, '')}`}
              className="flex items-center gap-3 p-4 rounded-lg bg-bg-surface border border-border-color hover:border-primary/30 transition-all cursor-pointer group"
            >
              <div className="bg-[#064E3B]/10 text-primary p-3 rounded-lg group-hover:bg-primary group-hover:text-black transition-colors">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] text-white/70 uppercase tracking-widest font-mono block">Liên Hệ</span>
                <EditableText 
                  sectionId={section.id} 
                  field="extraData"
                  subField="hotline"
                  value={section.extraData?.hotline || 'Hotline: 0932 966 700'} 
                  isEditMode={isEditMode} 
                  sections={sections} 
                  onUpdateSections={onUpdateSections}
                  tag="span"
                  className="text-xs font-bold text-text-primary font-mono"
                />
              </div>
            </a>

            <a 
              href={`mailto:${section.extraData?.email || 'contact@greeniahomes.vn'}`}
              className="flex items-center gap-3 p-4 rounded-lg bg-bg-surface border border-border-color hover:border-primary/30 transition-all cursor-pointer group"
            >
              <div className="bg-blue-500/10 text-info p-3 rounded-lg group-hover:bg-blue-500 group-hover:text-text-primary transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] text-white/70 uppercase tracking-widest font-mono block">Hòm Thư</span>
                <EditableText 
                  sectionId={section.id} 
                  field="extraData"
                  subField="email"
                  value={section.extraData?.email || 'sales.greeniahomes@gmail.com'}
                  isEditMode={isEditMode} 
                  sections={sections} 
                  onUpdateSections={onUpdateSections}
                  tag="span"
                  className="text-xs font-bold text-white/70 font-mono"
                />
              </div>
            </a>
          </div>

          <EditableText 
            sectionId={section.id} 
            field="extraData"
            subField="ctaText"
            value={section.extraData?.ctaText || 'Hỗ trợ định giá nhanh chóng & tra cứu phong thủy cung mệnh miễn phí!'} 
            isEditMode={isEditMode} 
            sections={sections} 
            onUpdateSections={onUpdateSections}
            tag="p"
            className="text-[10px] text-white/70 pt-2 font-mono"
          />
        </div>
      </div>
    );
  }

  if (section.id.startsWith('custom_text_block')) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4" id={section.id}>
        <EditableText 
          sectionId={section.id} 
          field="subtitle" 
          value={section.subtitle} 
          isEditMode={isEditMode} 
          sections={sections} 
          onUpdateSections={onUpdateSections}
          className="text-[9px] font-bold uppercase tracking-widest text-primary font-mono"
        />
        
        <EditableText 
          sectionId={section.id} 
          field="title" 
          value={section.title} 
          isEditMode={isEditMode} 
          sections={sections} 
          onUpdateSections={onUpdateSections}
          tag="h2"
          className="text-xl sm:text-2xl font-display font-medium text-text-primary tracking-tight"
        />

        <div className="bg-bg-surface/40 p-6 sm:p-8 rounded-lg border border-border-color">
          <EditableText 
            sectionId={section.id} 
            field="description" 
            value={section.description} 
            isEditMode={isEditMode} 
            sections={sections} 
            onUpdateSections={onUpdateSections}
            isArea={true}
            className="text-text-secondary text-xs font-light leading-relaxed text-center"
          />
        </div>
      </div>
    );
  }

  if (section.id.startsWith('custom_testimonials')) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8" id={section.id}>
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <EditableText 
            sectionId={section.id} 
            field="subtitle" 
            value={section.subtitle} 
            isEditMode={isEditMode} 
            sections={sections} 
            onUpdateSections={onUpdateSections}
            className="text-[10px] font-bold uppercase tracking-widest text-primary font-mono"
          />
          
          <EditableText 
            sectionId={section.id} 
            field="title" 
            value={section.title} 
            isEditMode={isEditMode} 
            sections={sections} 
            onUpdateSections={onUpdateSections}
            tag="h2"
            className="text-xl sm:text-2.5xl font-display font-medium text-text-primary tracking-tight"
          />

          <EditableText 
            sectionId={section.id} 
            field="description" 
            value={section.description} 
            isEditMode={isEditMode} 
            sections={sections} 
            onUpdateSections={onUpdateSections}
            isArea={true}
            className="text-text-secondary text-xs font-light max-w-md mx-auto"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-left">
          
          <div className="bg-bg-surface border border-border-color rounded-lg p-6.5 relative space-y-4 shadow-xl">
            <div className="flex gap-1 text-primary">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-500" />)}
            </div>
            
            <EditableText 
              sectionId={section.id} 
              field="extraData"
              subField="feedback1"
              value={section.extraData?.feedback1 || 'Greenia Homes giúp tôi tích lũy và chuyển dịch dồi dào tài lộc.'} 
              isEditMode={isEditMode} 
              sections={sections} 
              onUpdateSections={onUpdateSections}
              isArea={true}
              className="text-slate-205 text-xs font-light italic leading-relaxed"
            />

            <div className="border-t border-border-color/80 pt-3 flex items-center justify-between text-xs">
              <EditableText 
                sectionId={section.id} 
                field="extraData"
                subField="client1"
                value={section.extraData?.client1 || 'Ông Tấn (VIP Chateau)'} 
                isEditMode={isEditMode} 
                sections={sections} 
                onUpdateSections={onUpdateSections}
                tag="h4"
                className="font-bold text-text-primary font-display"
              />
              <span className="text-[10px] font-mono font-bold text-accent flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                Vérified
              </span>
            </div>
          </div>

          <div className="bg-bg-surface border border-border-color rounded-lg p-6.5 relative space-y-4 shadow-xl">
            <div className="flex gap-1 text-primary">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-500" />)}
            </div>
            
            <EditableText 
              sectionId={section.id} 
              field="extraData"
              subField="feedback2"
              value={section.extraData?.feedback2 || 'Sự ân cần và định chuẩn tài cát vượng bồi của các đại sư tại đây là bộc trực, chân quý.'} 
              isEditMode={isEditMode} 
              sections={sections} 
              onUpdateSections={onUpdateSections}
              isArea={true}
              className="text-slate-205 text-xs font-light italic leading-relaxed"
            />

            <div className="border-t border-border-color/80 pt-3 flex items-center justify-between text-xs">
              <EditableText 
                sectionId={section.id} 
                field="extraData"
                subField="client2"
                value={section.extraData?.client2 || 'Bà Vy (Hội viên Signature)'} 
                isEditMode={isEditMode} 
                sections={sections} 
                onUpdateSections={onUpdateSections}
                tag="h4"
                className="font-bold text-text-primary font-display"
              />
              <span className="text-[10px] font-mono font-bold text-accent flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                Vérified
              </span>
            </div>
          </div>

        </div>
      </div>
    );
  }

  if (section.id.startsWith('custom_partners')) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6" id={section.id}>
        <div className="space-y-1">
          <EditableText 
            sectionId={section.id} 
            field="subtitle" 
            value={section.subtitle} 
            isEditMode={isEditMode} 
            sections={sections} 
            onUpdateSections={onUpdateSections}
            className="text-[9px] font-bold uppercase tracking-widest text-primary font-mono"
          />
          <EditableText 
            sectionId={section.id} 
            field="title" 
            value={section.title} 
            isEditMode={isEditMode} 
            sections={sections} 
            onUpdateSections={onUpdateSections}
            tag="h2"
            className="text-sm font-semibold text-text-secondary font-display uppercase tracking-wider"
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 pt-4 opacity-40 hover:opacity-100 transition-opacity">
          <span className="text-text-primary text-xs font-bold font-mono uppercase tracking-widest bg-bg-surface border border-border-color px-4 py-2.5 rounded-lg">VINGROUP</span>
          <span className="text-primary text-xs font-bold font-mono uppercase tracking-widest bg-bg-surface border border-border-color px-4 py-2.5 rounded-lg">PHÚ MỸ HƯNG GP</span>
          <span className="text-info text-xs font-bold font-mono uppercase tracking-widest bg-bg-surface border border-border-color px-4 py-2.5 rounded-lg">TECHCOMBANK</span>
          <span className="text-text-secondary text-xs font-bold font-mono uppercase tracking-widest bg-bg-surface border border-border-color px-4 py-2.5 rounded-lg">ELIE SAAB</span>
          <span className="text-teal-400 text-xs font-bold font-mono uppercase tracking-widest bg-bg-surface border border-border-color px-4 py-2.5 rounded-lg">MASTERISE HOMES</span>
        </div>
      </div>
    );
  }

  return null;
}
