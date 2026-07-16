import React, { useState } from 'react';
import { collection, addDoc, db } from '../firebase';
import { handleFirestoreError, OperationType } from '../firebase-errors';
import { RouteState } from '../types';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, AlertCircle, UploadCloud, X } from 'lucide-react';
import { EditableText, EditableImage } from './EditableComponent';
import CustomSectionRenderer from './CustomSectionRenderer';
import SectionHeaderToolbar from './SectionHeaderToolbar';

interface ContactPageProps {
  onNavigate: (route: RouteState) => void;
  onShowNotification: (message: string, type: 'success' | 'error') => void;
  isEditMode: boolean;
  sections: any[];
  onUpdateSections: (sections: any[]) => void;
  selectedSectionId: string | null;
  setSelectedSectionId: (id: string | null) => void;
}

import { notifyAdminEmail } from '../lib/email';
import { fetchClientIp } from '../lib/ip';

export default function ContactPage({
  onNavigate,
  onShowNotification,
  isEditMode,
  sections,
  onUpdateSections,
  selectedSectionId,
  setSelectedSectionId
}: ContactPageProps) {
  // Consultation Form State
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactImages, setContactImages] = useState<string[]>([]);
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsUploadingImages(true);
    const newUrls: string[] = [];
    try {
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const reader = new FileReader();
        const base64Str = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64: base64Str, name: file.name, type: file.type })
        });
        const data = await response.json();
        if (data.url) newUrls.push(data.url);
      }
      setContactImages(prev => [...prev, ...newUrls]);
    } catch (err) {
      console.error(err);
      onShowNotification('Lỗi khi tải ảnh lên.', 'error');
    } finally {
      setIsUploadingImages(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setContactImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) {
      onShowNotification('Vui lòng cung cấp đầy đủ tên và số điện thoại liên lạc.', 'error');
      return;
    }

    setContactSubmitting(true);
    try {
      const clientIp = await fetchClientIp();
      let friendlyUrl = "";
      if (window.location.hostname.includes('aistudio')) {
        friendlyUrl = `https://greeniahomes.vn${window.location.pathname}`;
      } else if (window.location.hostname.includes('run.app')) {
        friendlyUrl = `https://greeniahomes.vn${window.location.pathname}`;
      } else {
        friendlyUrl = window.location.href;
      }

      await addDoc(collection(db, 'consultations'), {
        name: contactName.trim(),
        phone: contactPhone.trim(),
        email: contactEmail.trim(),
        images: contactImages,
        createdAt: new Date().toISOString(),
        status: 'pending',
        propertyTitle: `Giao diện liên hệ: ${contactMessage.trim() || 'Cần tư vấn trực tiếp'}`,
        sourceUrl: friendlyUrl,
        ipAddress: clientIp
      });

      notifyAdminEmail({
        name: contactName.trim(),
        phone: contactPhone.trim(),
        email: contactEmail.trim(),
        message: contactMessage.trim() + (contactImages.length > 0 ? ` [Đính kèm ${contactImages.length} ảnh]` : ''),
        propertyTitle: `Giao diện liên hệ: ${contactMessage.trim() || 'Cần tư vấn trực tiếp'}`,
        sourceUrl: friendlyUrl
      });

      setContactSuccess(true);
      setContactName('');
      setContactPhone('');
      setContactEmail('');
      setContactMessage('');
      setContactImages([]);
      onShowNotification('Gửi thông tin liên lạc thành công! Chuyên viên sẽ điện đàm ngay.', 'success');
    } catch (err) {
      console.error(err);
      onShowNotification('Sự cố đường truyền. Vui lòng thử lại sau.', 'error');
    } finally {
      setContactSubmitting(false);
    }
  };

  const getSection = (id: string) => {
    return sections.find(s => s.id === id) || {
      id,
      name: id,
      visible: true,
      paddingTop: 40,
      paddingBottom: 40,
      title: '',
      subtitle: '',
      description: ''
    };
  };

  return (
    <section className="relative min-h-screen">
      <div className="space-y-4 pb-0 font-sans" id="contact-catalog-root-wrapper">
        {sections.map((section, idx) => {
          if (!section.visible && !isEditMode) return null;

          let cardContent = null;
          const sec = getSection(section.id);

          if (section.id.startsWith('custom_')) {
            cardContent = (
              <CustomSectionRenderer 
                section={sec}
                isEditMode={isEditMode}
                EditableText={EditableText}
                EditableImage={EditableImage}
                onNavigate={onNavigate}
                sections={sections}
                onUpdateSections={onUpdateSections}
                onShowNotification={onShowNotification}
              />
            );
          } else if (section.id === 'contact_header') {
            cardContent = (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto space-y-3">
                  <EditableText 
                    sectionId={section.id} 
                    field="subtitle" 
                    value={sec.subtitle} 
                    isEditMode={isEditMode} 
                    sections={sections} 
                    onUpdateSections={onUpdateSections}
                    className="text-[10px] font-extrabold uppercase font-mono tracking-widest text-primary block"
                    tag="span"
                  />
                  <EditableText 
                    sectionId={section.id} 
                    field="title" 
                    value={sec.title} 
                    isEditMode={isEditMode} 
                    sections={sections} 
                    onUpdateSections={onUpdateSections}
                    className="text-3xl sm:text-4.5xl font-display font-medium text-text-primary tracking-tight leading-none"
                    tag="h1"
                  />
                  <EditableText 
                    sectionId={section.id} 
                    field="description" 
                    value={sec.description} 
                    isEditMode={isEditMode} 
                    sections={sections} 
                    onUpdateSections={onUpdateSections}
                    isArea={true}
                    className="text-text-secondary text-xs font-light block max-w-xl mx-auto"
                    tag="p"
                  />
                </div>
              </div>
            );
          } else if (section.id === 'contact_body') {
            cardContent = (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
                  {/* Left layout details */}
                  <div className="lg:col-span-5 bg-bg-surface border border-border-color rounded-lg p-8 space-y-6 flex flex-col justify-between text-left">
                    <div>
                      <h2 className="font-display font-bold text-lg text-text-primary mb-2 uppercase">Trụ Sở Hành Chính</h2>
                      <p className="text-xs text-text-secondary font-light leading-relaxed mb-6">
                        Thuộc khuôn viên biệt thự xa hoa Thảo Điền và hội sở Phú Mỹ Hưng, chuyên viên phong thủy túc trực hỗ trợ bạn tìm kiếm lâu đài hạnh vận cát tường.
                      </p>

                      <div className="space-y-4 text-xs font-light">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-text-primary">Địa chỉ chính:</p>
                            <p className="text-text-secondary mt-0.5">Tòa nhà Greenia, Khu biệt thự Phú Mỹ Hưng, Quận 7, TP.HCM</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-text-primary">Tổng đài hỗ trợ:</p>
                            <p className="text-text-secondary font-mono mt-0.5">0932 966 700 (Zalo/Viber 24/7)</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-text-primary">Thư tương tác thư ký:</p>
                            <p className="text-primary mt-0.5">sales.greeniahomes@gmail.com</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-bg-surface p-4 rounded-lg border border-border-color flex flex-col items-start gap-4">
                      <p className="text-[12px] font-bold uppercase tracking-wider text-text-secondary">Kết nối với chúng tôi</p>
                      <div className="flex gap-6 items-center">
                        <a href="https://zalo.me/0932966700" target="_blank" rel="noopener noreferrer" aria-label="Zalo" className="hover:scale-110 transition-transform" title="Zalo">
                          <img loading="lazy" decoding="async" src="/zalo-icon.svg" alt="Zalo" className="w-6 h-6 object-contain" />
                        </a>
                        <a href="https://www.facebook.com/greeniahomes" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:scale-110 transition-transform" title="Facebook">
                          <img loading="lazy" decoding="async" src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" alt="Facebook" className="w-6 h-6 object-contain" />
                        </a>
                        <a href="https://www.youtube.com/@greeniahomes.vn" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="hover:scale-110 transition-transform" title="YouTube">
                          <img loading="lazy" decoding="async" src="https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg" alt="YouTube" className="w-7 h-7 object-contain" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Right layout consult questionnaire form */}
                  <div className="lg:col-span-7 bg-bg-surface border border-border-color rounded-lg p-8 space-y-6 text-left">
                    <h2 className="font-display font-bold text-lg text-text-primary uppercase border-b border-border-color pb-2">
                      Gởi yêu cầu ký gửi, tham quan
                    </h2>

                    {contactSuccess ? (
                      <div className="bg-[#064E3B]/10 border border-primary/20 rounded-lg p-8 text-center space-y-4">
                        <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
                        <h4 className="text-base font-bold text-slate-105">Cảm ơn quý khách đã tin cậy!</h4>
                        <p className="text-xs text-text-secondary leading-relaxed max-w-sm mx-auto">
                          Hệ thống đã mã hóa thông tin và chuyển tới ban trị sự. Chuyên gia tương ứng sẽ điện đàm thẩm định và tư vấn ngay lập tức.
                        </p>
                        <button 
                          onClick={() => setContactSuccess(false)}
                          className="bg-bg-surface hover:bg-slate-850 text-xs px-4 py-2 rounded-lg text-white/70 font-semibold cursor-pointer"
                        >
                          Gởi thêm yêu cầu khác
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleContactSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label htmlFor="contact-name" className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">Danh tánh quý khách *</label>
                            <input
                              id="contact-name"
                              type="text"
                              value={contactName}
                              onChange={(e) => setContactName(e.target.value)}
                              placeholder="Ông / Bà..."
                              className="w-full bg-bg-surface border border-border-color rounded-lg px-4 py-3 text-xs text-text-primary outline-none focus:border-primary"
                              required
                              disabled={contactSubmitting}
                            />
                          </div>

                          <div className="space-y-1">
                            <label htmlFor="contact-phone" className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">Số điện thoại *</label>
                            <input
                              id="contact-phone"
                              type="tel"
                              value={contactPhone}
                              onChange={(e) => setContactPhone(e.target.value)}
                              placeholder="Nhập số di động..."
                              className="w-full bg-bg-surface border border-border-color rounded-lg px-4 py-3 text-xs text-text-primary outline-none focus:border-primary"
                              required
                              disabled={contactSubmitting}
                            />
                          </div>
                          
                          <div className="space-y-1 sm:col-span-2">
                            <label htmlFor="contact-email" className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">Email</label>
                            <input
                              id="contact-email"
                              type="email"
                              value={contactEmail}
                              onChange={(e) => setContactEmail(e.target.value)}
                              placeholder="Nhập địa chỉ email..."
                              className="w-full bg-bg-surface border border-border-color rounded-lg px-4 py-3 text-xs text-text-primary outline-none focus:border-primary"
                              disabled={contactSubmitting}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label htmlFor="contact-message" className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">Thông tin ký gửi hoặc hướng nhà đất cần hỗ trợ</label>
                          <textarea
                            id="contact-message"
                            value={contactMessage}
                            onChange={(e) => setContactMessage(e.target.value)}
                            placeholder="Chi tiết sản phẩm biệt thự, diện tích, giá ước tính, hoặc yêu cầu riêng..."
                            rows={4}
                            className="w-full bg-bg-surface border border-border-color rounded-lg px-4 py-3 text-xs text-text-primary outline-none focus:border-primary"
                            disabled={contactSubmitting}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">Hình ảnh đính kèm (nếu có)</label>
                          <div className="flex flex-col gap-2">
                            <input 
                              type="file" 
                              multiple 
                              accept="image/*" 
                              className="hidden" 
                              id="contact-image-upload"
                              onChange={handleImageUpload}
                              disabled={isUploadingImages || contactSubmitting}
                            />
                            <label 
                              htmlFor="contact-image-upload"
                              className={`cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 border border-border-color rounded-lg text-xs font-medium text-text-secondary bg-bg-surface transition-colors w-max ${isUploadingImages ? 'opacity-50' : 'hover:bg-slate-50 hover:text-primary hover:border-primary'}`}
                            >
                              <UploadCloud className="w-4 h-4" />
                              <span>{isUploadingImages ? 'Đang tải...' : 'Tải lên hình ảnh'}</span>
                            </label>
                            
                            {contactImages.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-1">
                                {contactImages.map((url, idx) => (
                                  <div key={idx} className="relative w-14 h-14 rounded overflow-hidden border border-border-color shrink-0">
                                    <img loading="lazy" decoding="async" src={(url) || undefined} alt={`upload-${idx}`} className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveImage(idx)}
                                      className="absolute top-0 right-0 bg-black/50 text-white p-0.5 hover:bg-red-500 rounded-bl-sm"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={contactSubmitting}
                          className="w-full bg-primary hover:bg-amber-600 active:scale-95 text-black font-bold py-3.5 rounded-lg text-xs uppercase tracking-wider cursor-pointer font-display shadow-lg flex items-center justify-center gap-1.5"
                        >
                          {contactSubmitting ? 'ĐANG PHÁT ĐI BẢO MẬT...' : (
                            <>
                              <span>Gửi đi yêu cầu ký gửi</span>
                              <Send className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div 
              key={section.id} 
              id={`section-wrapper-${section.id}`}
              style={{
                paddingTop: `${section.paddingTop || 0}px`,
                paddingBottom: `${section.paddingBottom || 0}px`,
              }}
              className={`relative transition-all duration-300 ${
                isEditMode 
                  ? `border-2 ${
                      selectedSectionId === section.id 
                        ? 'border-primary bg-primary/[0.01]' 
                        : 'border-dashed border-border-color hover:border-primary/30'
                    }` 
                  : ''
              } ${!section.visible ? 'opacity-40 bg-bg-inverse/20' : ''}`}
              onClick={() => {
                if (isEditMode) {
                  setSelectedSectionId(section.id);
                }
              }}
            >
              {isEditMode && (
                <SectionHeaderToolbar
                  section={section}
                  sections={sections}
                  onUpdateSections={onUpdateSections}
                  onShowNotification={onShowNotification}
                  index={idx}
                  setSelectedSectionId={setSelectedSectionId}
                />
              )}

              {cardContent}
            </div>
          );
        })}
      </div>
    </section>
  );
}
