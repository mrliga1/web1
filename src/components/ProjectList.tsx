import React, { useState, useEffect } from 'react';
import { generateSlug, optimizeImageUrl } from '../lib/utils';

function handleKeyboardActivation(event: React.KeyboardEvent, action: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    action();
  }
}
import { collection, getDocs, db } from '../firebase';
import { Product, Project, RouteState } from '../types';
import { MapPin, ArrowRight, Compass, ShieldCheck, Building2, Layers, Search, X } from 'lucide-react';
import AdBanner from './AdBanner';
import { EditableText, EditableImage } from './EditableComponent';
import CustomSectionRenderer from './CustomSectionRenderer';
import SectionHeaderToolbar from './SectionHeaderToolbar';
import { useScrollDirection } from '../hooks/useScrollDirection';
import ProductCard from './ProductCard';

interface ProjectListProps {
  onNavigate: (route: RouteState) => void;
  onShowNotification: (message: string, type: 'success' | 'error') => void;
  isEditMode: boolean;
  sections: any[];
  onUpdateSections: (sections: any[]) => void;
  selectedSectionId: string | null;
  setSelectedSectionId: (id: string | null) => void;
  initialProjects?: Project[];
  initialProducts?: Product[];
}

export default function ProjectList({ 
  onNavigate, 
  onShowNotification,
  isEditMode,
  sections,
  onUpdateSections,
  selectedSectionId,
  setSelectedSectionId,
  initialProjects = [],
  initialProducts = []
}: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>(() =>
    [...initialProjects].sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
  );
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>(() =>
    [...initialProducts].sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0)).slice(0, 10)
  );
  const scrollDirection = useScrollDirection();
  const [loading, setLoading] = useState(initialProjects.length === 0);

  // States for filtering
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // AJAX limits
  const [limitCount, setLimitCount] = useState(12);

  const initialFilters = React.useRef({
    keyword, currentStatus
  });

  const scrollToGrid = () => {
    const element = document.getElementById('projects-grid-section');
    if (element) {
      const offset = 140; // Offset for sticky headers
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    // Check if any filter actually changed from its initial mount value
    const hasFilterChanged = 
      keyword !== initialFilters.current.keyword ||
      currentStatus !== initialFilters.current.currentStatus;

    if (!hasFilterChanged) {
      return;
    }
    
    scrollToGrid();
  }, [keyword, currentStatus]);



  const filteredProjects = projects.filter(p => {
    let matchStatus = true;
    if (currentStatus !== '') {
      matchStatus = Boolean(p.status === currentStatus || (currentStatus === 'opening' && !p.status)); // Default
    }
    
    let matchKw = true;
    if (keyword !== '') {
      const kw = keyword.toLowerCase();
      matchKw = Boolean((p.title && p.title.toLowerCase().includes(kw)) ||
                (p.location && p.location.toLowerCase().includes(kw)));
    }
    return matchStatus && matchKw;
  });

  useEffect(() => {
    if (initialProjects.length > 0) {
      setLoading(false);
      return;
    }

    async function loadProjectData() {
      try {
        setLoading(true);

        const projCol = collection(db, 'projects');
        const projSnap = await getDocs(projCol);
        const pList: Project[] = [];
        projSnap.forEach((doc: any) => {
          pList.push({ id: doc.id, ...doc.data() } as Project);
        });
        
        pList.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        setProjects(pList);

        const prodCol = collection(db, 'products');
        const prodSnap = await getDocs(prodCol);
        const prodList: Product[] = [];
        prodSnap.forEach((doc: any) => {
          const data = doc.data();
          if (!data.approvalStatus || data.approvalStatus === 'approved') {
            prodList.push({ id: doc.id, ...data } as Product);
          }
        });
        prodList.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
        setFeaturedProducts(prodList.slice(0, 10));

      } catch (err) {
        console.error("Lỗi khi tải trang dự án:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProjectData();
  }, [initialProjects.length]);

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

  return (    <>
    <div className="relative min-h-screen">
      <div className="space-y-4 pb-0 font-sans" id="projects-view-root">
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
          } else if (section.id === 'projects_header') {
            cardContent = (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                  <EditableText 
                    sectionId={section.id} 
                    field="title" 
                    value={sec.title || 'Dự Án Nổi Bật'} 
                    isEditMode={isEditMode} 
                    sections={sections} 
                    onUpdateSections={onUpdateSections}
                    className="text-3xl font-display font-medium text-text-primary tracking-wide uppercase mb-3"
                    tag="h1"
                  />
                  <EditableText 
                    sectionId={section.id} 
                    field="description" 
                    value={sec.description || 'Khám phá bộ sưu tập các dự án bất động sản tiềm năng, pháp lý minh bạch và sinh lời cao.'} 
                    isEditMode={isEditMode} 
                    sections={sections} 
                    onUpdateSections={onUpdateSections}
                    isArea={true}
                    className="text-text-secondary text-[15px] font-light block max-w-2xl mx-auto"
                    tag="p"
                  />
                </div>
              </div>
            );
          } else if (section.id === 'projects_grid') {
            cardContent = (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left space-y-6" id="projects-grid-section">
                
                {/* Navbar/Filter Bar */}
                <div className={`block sticky ${scrollDirection === 'down' ? 'top-0' : 'top-10 md:top-10'} z-[100] bg-white/70 backdrop-blur-md pb-[2px] pt-[5px] border-b border-primary/10 shadow-sm mb-[24px] transition-colors duration-300 mx-[-1rem] sm:mx-0 px-4 sm:px-0`}>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative">
                    {!isSearchOpen && (
                      <div className="flex w-full md:w-auto items-center pr-1 md:pr-0">
                        <div className="flex items-center gap-2 overflow-x-auto flex-1 font-sans z-50 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-1 md:pb-0 relative">
                          <button 
                            onClick={(e) => { 
                              if (currentStatus === '') scrollToGrid();
                              setCurrentStatus(''); 
                              const parent = e.currentTarget.parentElement;
                              if (parent) parent.scrollTo({ left: e.currentTarget.offsetLeft - parent.offsetLeft - parent.clientWidth / 2 + e.currentTarget.clientWidth / 2, behavior: 'smooth' });
                            }}
                            className={`px-[8px] py-[4px] border shrink-0 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${currentStatus === '' ? 'bg-[#064E3B]/10 text-primary border-primary' : 'bg-transparent border-border-color text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:border-primary/20'}`}
                          >
                            Tất cả dự án
                          </button>
                          <button 
                            onClick={(e) => { 
                              if (currentStatus === 'opening') scrollToGrid();
                              setCurrentStatus('opening'); 
                              const parent = e.currentTarget.parentElement;
                              if (parent) parent.scrollTo({ left: e.currentTarget.offsetLeft - parent.offsetLeft - parent.clientWidth / 2 + e.currentTarget.clientWidth / 2, behavior: 'smooth' });
                            }}
                            className={`px-[8px] py-[4px] border shrink-0 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${currentStatus === 'opening' ? 'bg-[#064E3B]/10 text-primary border-primary' : 'bg-transparent border-border-color text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:border-primary/20'}`}
                          >
                            Đang mở bán
                          </button>
                          <button 
                            onClick={(e) => { 
                              if (currentStatus === 'coming_soon') scrollToGrid();
                              setCurrentStatus('coming_soon'); 
                              const parent = e.currentTarget.parentElement;
                              if (parent) parent.scrollTo({ left: e.currentTarget.offsetLeft - parent.offsetLeft - parent.clientWidth / 2 + e.currentTarget.clientWidth / 2, behavior: 'smooth' });
                            }}
                            className={`px-[8px] py-[4px] border shrink-0 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${currentStatus === 'coming_soon' ? 'bg-[#064E3B]/10 text-primary border-primary' : 'bg-transparent border-border-color text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:border-primary/20'}`}
                          >
                            Sắp ra mắt
                          </button>
                          <button 
                            onClick={(e) => { 
                              if (currentStatus === 'handed-over') scrollToGrid();
                              setCurrentStatus('handed_over'); 
                              const parent = e.currentTarget.parentElement;
                              if (parent) parent.scrollTo({ left: e.currentTarget.offsetLeft - parent.offsetLeft - parent.clientWidth / 2 + e.currentTarget.clientWidth / 2, behavior: 'smooth' });
                            }}
                            className={`px-[8px] py-[4px] border shrink-0 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${currentStatus === 'handed-over' ? 'bg-[#064E3B]/10 text-primary border-primary' : 'bg-transparent border-border-color text-text-secondary hover:bg-[#064E3B]/10 hover:text-primary hover:border-primary/20'}`}
                          >
                            Đã bàn giao
                          </button>
                        </div>
                        <button
                          onClick={() => setIsSearchOpen(true)}
                          aria-label="Mở tìm kiếm dự án"
                          className="md:hidden ml-2 px-[8px] py-[6px] border border-primary/30 text-primary shrink-0 text-[11px] font-medium rounded-lg transition-all cursor-pointer bg-bg-surface hover:bg-[#064E3B]/10 flex items-center justify-center h-full"
                        >
                          <Search className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    
                    <div className={`${isSearchOpen ? 'flex w-full absolute top-0 left-0 bg-transparent py-1 z-[60] h-full items-center pl-1 pr-1' : 'hidden md:block w-full md:w-auto mt-2 md:mt-0 pb-2 md:pb-0'}`}>
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          setKeyword(searchInput.trim());
                        }}
                        className={`relative ${isSearchOpen ? 'w-full pr-8' : 'w-full md:w-[150px] inline-block h-[26px]'}`}
                      >
                        <input 
                          type="text" 
                          aria-label="Tìm kiếm dự án"
                          value={searchInput}
                          onChange={e => setSearchInput(e.target.value)}
                          placeholder="Tìm tên dự án, vị trí..." 
                          className="w-full bg-bg-surface border border-primary/30 pl-3 pr-8 py-[4px] rounded-lg text-text-primary outline-none text-[11px] transition-colors focus:border-primary h-[26px]"
                          autoFocus={isSearchOpen}
                        />
                        <button type="submit" aria-label="Tìm kiếm dự án" className={`absolute ${isSearchOpen ? 'right-[34px]' : 'right-2'} md:right-2 top-1/2 -translate-y-1/2 text-primary p-1 hover:text-primary bg-transparent border-none cursor-pointer flex items-center justify-center`}>
                          <Search className="w-3.5 h-3.5" />
                        </button>
                        {isSearchOpen && (
                          <button 
                            type="button" 
                            aria-label="Đóng tìm kiếm dự án"
                            onClick={() => {
                              setIsSearchOpen(false);
                            }}
                            className="absolute right-0 top-1/2 -translate-y-1/2 text-text-secondary p-1 hover:text-text-primary bg-transparent border-none cursor-pointer md:hidden flex items-center justify-center"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </form>
                    </div>
                  </div>
                </div>

                {/* Status bar */}
                {keyword && (
                  <div className="py-4 mb-4 text-text-primary text-sm flex items-center border-b border-dashed border-primary/30">
                    <span>Tìm thấy <strong className="mx-1 text-primary">{filteredProjects.length}</strong> dự án cho: <strong>"{keyword}"</strong></span>
                    <button 
                      onClick={() => {
                        setKeyword('');
                        setSearchInput('');
                      }} 
                      className="ml-3 text-error text-xs underline cursor-pointer bg-transparent border-none"
                    >
                      Xóa tìm kiếm
                    </button>
                  </div>
                )}

                {loading ? (
                  <div className="py-20 text-center relative min-h-[300px]">
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 text-primary text-3xl">
                      <i className="fas fa-circle-notch fa-spin"></i>
                    </div>
                  </div>
                ) : filteredProjects.length === 0 ? (
                  <div className="text-center py-10 text-white/70 text-sm col-span-full">Không tìm thấy dự án phù hợp.</div>
                ) : (
                  <div className="space-y-10">
                    <h2 className="sr-only">Danh sách dự án</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {filteredProjects.slice(0, limitCount).map((p, projectIndex) => {
                        let statusText = 'Đang mở bán';
                        if (p.status === 'handed-over') statusText = 'Đã bàn giao';
                        if (p.status === 'coming_soon') statusText = 'Sắp ra mắt';
                        
                        return (
                          <div
                            key={p.id}
                            role="link"
                            tabIndex={0}
                            onClick={() => onNavigate({ screen: 'project-detail', projectId: p.id, slug: generateSlug(p.title) })}
                            onKeyDown={(event) => handleKeyboardActivation(event, () => onNavigate({ screen: 'project-detail', projectId: p.id, slug: generateSlug(p.title) }))}
                            className="motion-card bg-bg-surface border border-primary/20 rounded-xl overflow-hidden flex flex-col h-full hover:border-primary/30 cursor-pointer no-underline group shadow-sm justify-between"
                          >
                            <div className="relative aspect-[16/10] overflow-hidden">
                              <img loading={projectIndex === 0 ? "eager" : "lazy"} decoding="async"
                                fetchPriority={projectIndex === 0 ? "high" : "auto"}
                                src={optimizeImageUrl(p.imageUrl || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800", 400) || undefined}
                                alt={p.title}
                                width="800"
                                height="500"
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 block"
                                onError={(e) => { e.currentTarget.onerror = null; (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400?text=Greenia+Homes'; }}
                              />
                              <div className="absolute top-0 left-0 px-2.5 py-1 bg-success text-white text-[11px] font-bold rounded-none rounded-br-lg shadow-sm z-10">
                                {statusText}
                              </div>
                            </div>
  
                            <div className="p-4 flex-1 flex flex-col justify-between">
                              <div>
                                <h3 className="text-[13px] sm:text-[15px] font-bold text-text-primary mb-2 line-clamp-2 transition-colors group-hover:text-primary">
                                  {p.title}
                                </h3>
                                <div className="flex items-center justify-between text-xs mb-3">
                                  <span className="text-text-secondary">Giá từ:</span>
                                  <span className="text-primary font-bold text-[13px]">{p.priceText || "Đang cập nhật"}</span>
                                </div>
                                
                                <div className="flex items-center gap-2 text-[11px] text-text-secondary mb-2">
                                  <div className="flex items-center gap-1.5 flex-1">
                                    <Layers className="w-3 h-3 text-text-secondary shrink-0" />
                                    <span className="truncate" title={p.scale || 'Đang cập nhật'}>{p.scale || 'Đang cập nhật'}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-1">
                                    <Building2 className="w-3 h-3 text-text-secondary shrink-0" />
                                    <span className="truncate" title={p.units ? String(p.units) : 'Đang cập nhật'}>{p.units ? `${p.units} căn` : 'Đang cập nhật'}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-start gap-1.5 text-[11px] text-text-secondary mt-auto pt-2 border-t border-border-color/50">
                                <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-[1px]" />
                                <span className="line-clamp-2">
                                  {p.location || p.title}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {filteredProjects.length > limitCount && (
                      <div className="text-center mt-10 border-t border-dashed border-border-color pt-6">
                        <button
                          type="button"
                          onClick={() => {
                            setLimitCount(prev => prev + 12);
                            onShowNotification('Đã tải thêm dự án.', 'success');
                          }}
                          className="text-primary px-7 py-2.5 font-sans font-bold cursor-pointer transition-all hover:text-primary/80 text-[13px]"
                        >
                          Xem thêm <i className="fas fa-chevron-down ml-1"></i>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          } else if (section.id === 'featured_products' || section.id === 'projects_featured_products') {
            cardContent = (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left space-y-6">
                <div className="space-y-1">
                  <h2 className="text-lg font-display font-bold text-text-primary flex items-center gap-2">
                    <Compass className="w-5 h-5 text-primary shrink-0" />
                    <EditableText 
                      sectionId={section.id} 
                      field="title" 
                      value={sec.title} 
                      isEditMode={isEditMode} 
                      sections={sections} 
                      onUpdateSections={onUpdateSections}
                      className="text-text-primary text-lg font-bold"
                      tag="span"
                    />
                  </h2>
                  <EditableText 
                    sectionId={section.id} 
                    field="description" 
                    value={sec.description} 
                    isEditMode={isEditMode} 
                    sections={sections} 
                    onUpdateSections={onUpdateSections}
                    className="text-text-secondary text-xs font-light block max-w-xl"
                    tag="p"
                  />
                </div>

                {featuredProducts.length === 0 ? (
                  <div className="text-slate-505 text-xs text-center py-6">Đang tải giỏ hàng nổi bật...</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                    {featuredProducts.slice(0, 5).map((item) => (
                      <ProductCard 
                        key={item.id} 
                        item={item} 
                        onNavigate={onNavigate}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          }

          if (!cardContent && !isEditMode) return null; // ADD THIS to prevent empty wrappers spacing

          return (
            <div 
              key={section.id} 
              id={`section-wrapper-${section.id}`}
              style={{
                paddingTop: `${section.paddingTop || 0}px`,
                paddingBottom: section.id === 'projects_header' ? '0px' : section.id === 'projects_grid' ? '1px' : `${section.paddingBottom || 0}px`,
                marginBottom: section.id === 'projects_header' ? '16px' : undefined
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

              {idx === 1 && (
                <AdBanner slot="project-hub-middle" containerClassName="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-6" />
              )}
            </div>
          );
        })}
      </div>
    </div>
      </>
);
}
