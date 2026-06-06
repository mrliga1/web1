import React, { useState, useEffect } from 'react';
import { SEO } from './SEO';
import { collection, getDocs, addDoc, db } from '../firebase';
import { handleFirestoreError, OperationType } from '../firebase-errors';
import { Product, Project, News, RouteState } from '../types';
import AdBanner from './AdBanner';
import { 
  HeroSectionBody, CorporateIntroBody, ReasonsBody, 
  FeaturedListingsBody, ProjectsBody, NewsBody 
} from './HomeSectionRenderers';
import CustomSectionRenderer from './CustomSectionRenderer';
import { EditableText, EditableImage } from './EditableComponent';
import SectionHeaderToolbar from './SectionHeaderToolbar';
import { Helmet } from 'react-helmet-async';

interface HomeProps {
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

export default function Home({ 
  onNavigate, 
  onShowNotification,
  isEditMode,
  sections,
  onUpdateSections,
  selectedSectionId,
  setSelectedSectionId
}: HomeProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  // See More Click Counter for Product Listings Grid
  const [productClickCount, setProductClickCount] = useState(0);

  // Consultation Form State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    async function loadHomepageData() {
      try {
        setLoading(true);

        const prodSnap = await getDocs(collection(db, 'products'));
        const prodList: Product[] = [];
        prodSnap.forEach((doc) => {
          const data = doc.data();
          if (!data.approvalStatus || data.approvalStatus === 'approved') {
            prodList.push({ id: doc.id, ...data } as Product);
          }
        });
        prodList.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        setProducts(prodList);

        const projCol = collection(db, 'projects');
        const projSnap = await getDocs(projCol);
        const projList: Project[] = [];
        projSnap.forEach((doc) => {
          const data = doc.data();
          if (!data.approvalStatus || data.approvalStatus === 'approved') {
            projList.push({ id: doc.id, ...data } as Project);
          }
        });
        setProjects(projList);

        const newsSnap = await getDocs(collection(db, 'news'));
        const newsList: News[] = [];
        newsSnap.forEach((doc) => {
          const data = doc.data();
          if ((!data.approvalStatus || data.approvalStatus === 'approved') && data.title?.trim()) {
            newsList.push({ id: doc.id, ...data } as News);
          }
        });
        newsList.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        setNews(newsList);

      } catch (err) {
        console.error("Lỗi khi tải dữ liệu trang chủ:", err);
      } finally {
        setLoading(false);
      }
    }

    loadHomepageData();
  }, []);

  const handleConsultationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      onShowNotification('Vui lòng nhập họ tên và số điện thoại.', 'error');
      return;
    }

    const phoneRegex = /^[0-9+ ]{9,16}$/;
    if (!phoneRegex.test(clientPhone.trim())) {
      onShowNotification('Số điện thoại không đúng định dạng. Vui lòng nhập tối thiểu 9 số.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const clientIp = await fetchClientIp();
      await addDoc(collection(db, 'consultations'), {
        name: clientName.trim(),
        phone: clientPhone.trim(),
        createdAt: new Date().toISOString(),
        status: 'pending',
        propertyId: 'homepage-consultation',
        propertyTitle: 'Tư vấn chuyên sâu trang chủ',
        sourceUrl: window.location.href,
        ipAddress: clientIp
      });

      notifyAdminEmail({
        name: clientName.trim(),
        phone: clientPhone.trim(),
        propertyTitle: 'Tư vấn chuyên sâu trang chủ',
        sourceUrl: window.location.href
      });

      setFormSubmitted(true);
      setClientName('');
      setClientPhone('');
      onShowNotification('Đã gửi thông tin yêu cầu tư vấn thành công!', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'consultations');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductSeeMore = () => {
    if (productClickCount === 0) {
      setProductClickCount(1);
    } else {
      onNavigate({ screen: 'san-pham' });
    }
  };

  const displayedProductsCount = productClickCount === 0 ? 10 : 15;
  const currentDisplayedProducts = products.slice(0, displayedProductsCount);

  const getSection = (id: string) => {
    return sections.find(s => s.id === id) || {
      id,
      name: id,
      visible: true,
      paddingTop: 80,
      paddingBottom: 80,
      title: '',
      subtitle: '',
      description: ''
    };
  };

  const schemaOrgJSONLD = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Greenia Homes",
    "url": window.location.href,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${window.location.origin}/#san-pham?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (    <>
      <SEO title="Trang Chủ | Nền Tảng BĐS Uy Tín" />

    <div className="relative min-h-screen">
      <Helmet>
        <title>Trang Chủ | Greenia Homes - Bất động sản cao cấp</title>
        <meta name="description" content="Greenia Homes cung cấp dịch vụ tìm kiếm, tư vấn và cung cấp thông tin bất động sản bao gồm chuyển nhượng, cho thuê và dự án." />
        <meta property="og:title" content="Trang Chủ | Greenia Homes" />
        <meta property="og:description" content="Greenia Homes cung cấp dịch vụ tìm kiếm, tư vấn và cung cấp thông tin bất động sản." />
        <script type="application/ld+json">
          {JSON.stringify(schemaOrgJSONLD)}
        </script>
      </Helmet>
      <div className="space-y-4 pb-[10px] font-sans" id="home-view-root">
        {sections.map((section, index) => {
          if (!section.visible && !isEditMode) return null;

          let cardContent = null;
          
          if (section.id.startsWith('custom_')) {
            cardContent = (
              <CustomSectionRenderer 
                section={getSection(section.id)}
                isEditMode={isEditMode}
                EditableText={EditableText}
                EditableImage={EditableImage}
                onNavigate={onNavigate}
                sections={sections}
                onUpdateSections={onUpdateSections}
                onShowNotification={onShowNotification}
              />
            );
          } else if (section.id === 'hero') {
            cardContent = (
              <HeroSectionBody 
                sec={getSection('hero')}
                isEditMode={isEditMode}
                onNavigate={onNavigate}
                sections={sections}
                onUpdateSections={onUpdateSections}
                formSubmitted={formSubmitted}
                setFormSubmitted={setFormSubmitted}
                clientName={clientName}
                setClientName={setClientName}
                clientPhone={clientPhone}
                setClientPhone={setClientPhone}
                isSubmitting={isSubmitting}
                handleConsultationSubmit={handleConsultationSubmit}
                onShowNotification={onShowNotification}
              />
            );
          } else if (section.id === 'corporate_intro') {
            cardContent = (
              <CorporateIntroBody 
                sec={getSection('corporate_intro')}
                isEditMode={isEditMode}
                onNavigate={onNavigate}
                sections={sections}
                onUpdateSections={onUpdateSections}
              />
            );
          } else if (section.id === 'reasons') {
            cardContent = (
              <ReasonsBody 
                sec={getSection('reasons')}
                isEditMode={isEditMode}
                onNavigate={onNavigate}
                sections={sections}
                onUpdateSections={onUpdateSections}
              />
            );
          } else if (section.id === 'featured_listings') {
            cardContent = (
              <FeaturedListingsBody 
                sec={getSection('featured_listings')}
                isEditMode={isEditMode}
                onNavigate={onNavigate}
                sections={sections}
                onUpdateSections={onUpdateSections}
                currentDisplayedProducts={currentDisplayedProducts}
                products={products}
                loading={loading}
                productClickCount={productClickCount}
                handleProductSeeMore={handleProductSeeMore}
              />
            );
          } else if (section.id === 'projects') {
            cardContent = (
              <ProjectsBody 
                sec={getSection('projects')}
                isEditMode={isEditMode}
                onNavigate={onNavigate}
                sections={sections}
                onUpdateSections={onUpdateSections}
                projects={projects}
              />
            );
          } else if (section.id === 'news') {
            cardContent = (
              <NewsBody 
                sec={getSection('news')}
                isEditMode={isEditMode}
                onNavigate={onNavigate}
                sections={sections}
                onUpdateSections={onUpdateSections}
                news={news}
              />
            );
          }

          return (
            <div 
              key={section.id} 
              id={`section-wrapper-${section.id}`}
              style={{
                paddingTop: `${section.paddingTop}px`,
                paddingBottom: `${section.paddingBottom}px`,
              }}
              className={`relative transition-all duration-300 ${
                isEditMode 
                  ? `border-2 ${
                      selectedSectionId === section.id 
                        ? 'border-amber-500 bg-amber-500/[0.01]' 
                        : 'border-dashed border-slate-800 hover:border-amber-500/30'
                    }` 
                  : ''
              } ${!section.visible ? 'opacity-40 bg-slate-950/20' : ''}`}
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
                  index={index}
                  setSelectedSectionId={setSelectedSectionId}
                />
              )}

              {cardContent}

              {section.id === 'hero' && (
                <AdBanner slot="home-top" containerClassName="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-6" />
              )}
              {section.id === 'featured_listings' && (
                <AdBanner slot="home-middle" containerClassName="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-6" />
              )}
            </div>
          );
        })}
      </div>
    </div>
      </>
);
}
