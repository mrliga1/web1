import React, { useState, useEffect } from 'react';
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

const LazySection = ({ children, sectionId, isEditMode }: { children: React.ReactNode, sectionId: string, isEditMode: boolean }) => {
  if (sectionId === 'hero' || isEditMode) {
    return <>{children}</>;
  }

  return <div>{children}</div>;
};

interface HomeProps {
  onNavigate: (route: RouteState) => void;
  onShowNotification: (message: string, type: 'success' | 'error') => void;
  isEditMode: boolean;
  sections: any[];
  onUpdateSections: (sections: any[]) => void;
  selectedSectionId: string | null;
  setSelectedSectionId: (id: string | null) => void;
  initialProducts?: Product[];
  initialProjects?: Project[];
  initialNews?: News[];
  refreshOnMount?: boolean;
}



export default function Home({ 
  onNavigate, 
  onShowNotification,
  isEditMode,
  sections,
  onUpdateSections,
  selectedSectionId,
  setSelectedSectionId,
  initialProducts,
  initialProjects,
  initialNews,
  refreshOnMount = false,
}: HomeProps) {
  const hasInitialData =
    initialProducts !== undefined &&
    initialProjects !== undefined &&
    initialNews !== undefined;
  const [products, setProducts] = useState<Product[]>(initialProducts ?? []);
  const [projects, setProjects] = useState<Project[]>(initialProjects ?? []);
  const [news, setNews] = useState<News[]>(initialNews ?? []);
  const [loading, setLoading] = useState(!hasInitialData);

  // See More Click Counter for Product Listings Grid
  const [productClickCount, setProductClickCount] = useState(0);



  useEffect(() => {
    if (hasInitialData && !refreshOnMount) return;

    async function loadHomepageData() {
      try {
        if (!hasInitialData) setLoading(true);

        const [prodSnap, projSnap, newsSnap] = await Promise.all([
          getDocs(collectionLite(dbLite, 'products')),
          getDocs(collectionLite(dbLite, 'projects')),
          getDocs(collectionLite(dbLite, 'news')),
        ]);

        const prodList: Product[] = [];
        prodSnap.forEach((doc: any) => {
          const data = doc.data();
          if (!data.approvalStatus || data.approvalStatus === 'approved') {
            prodList.push({ id: doc.id, ...data } as Product);
          }
        });
        prodList.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        setProducts(prodList);

        const projList: Project[] = [];
        projSnap.forEach((doc: any) => {
          const data = doc.data();
          if (!data.approvalStatus || data.approvalStatus === 'approved') {
            projList.push({ id: doc.id, ...data } as Project);
          }
        });
        setProjects(projList);

        const newsList: News[] = [];
        newsSnap.forEach((doc: any) => {
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
  }, [hasInitialData, refreshOnMount]);



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

  return (
    <div className="relative min-h-screen overflow-x-hidden w-full">
      
      <div className="space-y-4 pb-0 font-sans" id="home-view-root">
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
            <LazySection key={section.id} sectionId={section.id} isEditMode={isEditMode}>
              <div 
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
            </LazySection>
          );
        })}
      </div>
    </div>
  );
}
