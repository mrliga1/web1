import React, { useState, useEffect } from 'react';
import { SEO } from './SEO';
import { collection as collectionLite, getDocs } from '../firebase';
import { dbLite, addDoc, collection, db } from '../firebase';
import { handleFirestoreError, OperationType } from '../firebase-errors';
import { Product, Project, News, RouteState } from '../types';
import AdBanner from './AdBanner';
import { generateSlug, optimizeImageUrl } from '../lib/utils';
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
  const [isDeferred, setIsDeferred] = useState(false);

  useEffect(() => {
    // Delay rendering below-the-fold sections to improve Mobile FCP and LCP
    const timer = setTimeout(() => setIsDeferred(true), 150);
    return () => clearTimeout(timer);
  }, []);

  // Consultation Form State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientDemand, setClientDemand] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [agreePrivacy, setAgreePrivacy] = useState(true);

  useEffect(() => {
    async function loadHomepageData() {
      try {
        setLoading(true);

        const prodSnap = await getDocs(collectionLite(dbLite, 'products'));
        const prodList: Product[] = [];
        prodSnap.forEach((doc) => {
          const data = doc.data();
          if (!data.approvalStatus || data.approvalStatus === 'approved') {
            prodList.push({ id: doc.id, ...data } as Product);
          }
        });
        prodList.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        setProducts(prodList);

        const projCol = collectionLite(dbLite, 'projects');
        const projSnap = await getDocs(projCol);
        const projList: Project[] = [];
        projSnap.forEach((doc) => {
          const data = doc.data();
          if (!data.approvalStatus || data.approvalStatus === 'approved') {
            projList.push({ id: doc.id, ...data } as Project);
          }
        });
        setProjects(projList);

        const newsSnap = await getDocs(collectionLite(dbLite, 'news'));
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
      let friendlyUrl = "";
      if (window.location.hostname.includes('aistudio')) {
        friendlyUrl = `https://greeniahomes.vn${window.location.pathname}`;
      } else if (window.location.hostname.includes('run.app')) {
        friendlyUrl = `https://greeniahomes.vn${window.location.pathname}`;
      } else {
        friendlyUrl = window.location.href;
      }

      await addDoc(collection(db, 'consultations'), {
        name: clientName.trim(),
        phone: clientPhone.trim(),
        email: clientEmail.trim(),
        demand: clientDemand.trim(),
        createdAt: new Date().toISOString(),
        status: 'pending',
        propertyId: 'homepage-consultation',
        propertyTitle: 'Tư vấn chuyên sâu trang chủ',
        sourceUrl: friendlyUrl,
        ipAddress: clientIp
      });

      notifyAdminEmail({
        name: clientName.trim(),
        phone: clientPhone.trim(),
        email: clientEmail.trim(),
        message: clientDemand.trim(),
        propertyTitle: 'Tư vấn chuyên sâu trang chủ',
        sourceUrl: friendlyUrl
      });

      setFormSubmitted(true);
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setClientDemand('');
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
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://greeniahomes.vn/#website",
        "url": "https://greeniahomes.vn/",
        "name": "Greenia Homes",
        "description": "Thương hiệu bất động sản cá nhân định hướng doanh nghiệp, phân phối Vinhomes & Masterise Homes",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://greeniahomes.vn/san-pham?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "RealEstateAgent",
        "@id": "https://greeniahomes.vn/#organization",
        "name": "Greenia Homes",
        "url": "https://greeniahomes.vn",
        "logo": "https://greeniahomes.vn/logo.png",
        "image": "https://greeniahomes.vn/logo.png",
        "description": "Chuyên gia phân phối bất động sản cao cấp Vinhomes và Masterise Homes.",
        "telephone": "0932966700",
        "email": "sales@greeniahomes.vn",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Tòa nhà Greenia, Khu biệt thự Phú Mỹ Hưng",
          "addressLocality": "Quận 7",
          "addressRegion": "Hồ Chí Minh",
          "postalCode": "700000",
          "addressCountry": "VN"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 10.733852,
          "longitude": 106.715344
        },
        "priceRange": "$$$$"
      }
    ]
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden w-full">
      
      <div className="space-y-4 pb-0 font-sans" id="home-view-root">
        {sections.map((section, index) => {
          if (!section.visible && !isEditMode) return null;

          if (!isDeferred && section.id !== 'hero') {
            return (
              <div key={section.id} className="min-h-[400px]"></div>
            );
          }

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
                clientEmail={clientEmail}
                setClientEmail={setClientEmail}
                clientDemand={clientDemand}
                setClientDemand={setClientDemand}
                agreeTerms={agreeTerms}
                setAgreeTerms={setAgreeTerms}
                agreePrivacy={agreePrivacy}
                setAgreePrivacy={setAgreePrivacy}
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
                paddingTop: section.id === 'corporate_intro' ? '0px' : section.id === 'reasons' ? '25px' : section.id === 'featured_listings' ? '35px' : section.id === 'projects' ? '5px' : section.id === 'news' ? '35px' : `${section.paddingTop}px`,
                paddingBottom: (section.id === 'hero' || section.id === 'corporate_intro') ? '0px' : (section.id === 'reasons' || section.id === 'featured_listings') ? '15px' : section.id === 'projects' ? '5px' : section.id === 'news' ? '35px' : `${section.paddingBottom}px`,
                marginBottom: section.id === 'hero' || section.id === 'reasons' || section.id === 'projects' ? '0px' : undefined
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
  );
}
