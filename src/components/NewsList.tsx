import React, { useState, useEffect } from 'react';
import NextImage from 'next/image';
import { optimizeImageUrl, generateSlug, formatVietnamDate } from '../lib/utils';

function handleKeyboardActivation(event: React.KeyboardEvent, action: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    action();
  }
}
import { News, Product, Project, RouteState } from '../types';
import { Calendar, Eye, Compass, Search, User, ChevronRight, BadgeDollarSign, MapPin, Sparkles, Heart, Bookmark, Layers, Bath, Building2 } from 'lucide-react';
import AdBanner from './AdBanner';
import ProductCard from './ProductCard';
import { EditableText, EditableImage } from './EditableComponent';
import CustomSectionRenderer from './CustomSectionRenderer';
import SectionHeaderToolbar from './SectionHeaderToolbar';
import { useScrollDirection } from '../hooks/useScrollDirection';

interface NewsListProps {
  onNavigate: (route: RouteState) => void;
  onShowNotification: (message: string, type: 'success' | 'error') => void;
  isEditMode: boolean;
  sections: any[];
  onUpdateSections: (sections: any[]) => void;
  selectedSectionId: string | null;
  setSelectedSectionId: (id: string | null) => void;
  categoryName?: string;
  initialNews?: News[];
  initialProducts?: Product[];
  initialProjects?: Project[];
  initialGeneralSettings?: Record<string, any>;
}

export default function NewsList({ 
  onNavigate, 
  onShowNotification,
  isEditMode,
  sections,
  onUpdateSections,
  selectedSectionId,
  setSelectedSectionId,
  categoryName,
  initialNews = [],
  initialProducts = [],
  initialProjects = [],
  initialGeneralSettings = {}
}: NewsListProps) {
  const [allNews, setAllNews] = useState<News[]>(() =>
    [...initialNews].sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
  );
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [loading, setLoading] = useState(initialNews.length === 0);
  const scrollDirection = useScrollDirection();

  // Filters & Tabs
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Tất cả');


  useEffect(() => {
    if (searchQuery) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [searchQuery]);

  // React state for Column 1 & Column 2 dynamic hover pairing
  const [hoveredArticle, setHoveredArticle] = useState<News | null>(() => initialNews[0] || null);

  // AJAX loading counts
  const [interestNewsLimit, setInterestNewsLimit] = useState(12);

  // Product offset cycle for synchronization
  const [productSyncOffset, setProductSyncOffset] = useState(0);

  const [newsCategoriesExt, setNewsCategoriesExt] = useState<any[]>(() => initialGeneralSettings.newsCategoriesExt || []);

  useEffect(() => {
    if (initialNews.length > 0) {
      setLoading(false);
      return;
    }

    async function loadNewsData() {
      try {
        setLoading(true);
        const { collection, getDocs, getDoc, doc, db } = await import('../firebase');

        const docSnap = await getDoc(doc(db, 'settings', 'general'));
        if (docSnap.exists() && docSnap.data().newsCategoriesExt) {
          setNewsCategoriesExt(docSnap.data().newsCategoriesExt);
        }

        const newsSnap = await getDocs(collection(db, 'news'));
        const nList: News[] = [];
        newsSnap.forEach((doc: any) => {
          const data = doc.data();
          if ((!data.approvalStatus || data.approvalStatus === 'approved') && data.title?.trim()) {
            nList.push({ id: doc.id, ...data } as News);
          }
        });
        
        nList.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        setAllNews(nList);
        
        if (nList.length > 0) {
          setHoveredArticle(nList[0]);
        }

        const prodSnap = await getDocs(collection(db, 'products'));
        const pList: Product[] = [];
        prodSnap.forEach((doc: any) => {
          const data = doc.data();
          if (!data.approvalStatus || data.approvalStatus === 'approved') {
            pList.push({ id: doc.id, ...data } as Product);
          }
        });
        setProducts(pList);

        const projSnap = await getDocs(collection(db, 'projects'));
        const projList: Project[] = [];
        projSnap.forEach((doc: any) => {
          projList.push({ id: doc.id, ...doc.data() } as Project);
        });
        setProjects(projList);

      } catch (err) {
        console.error("Lỗi khi tải trang tin tức:", err);
      } finally {
        setLoading(false);
      }
    }

    loadNewsData();
  }, [initialNews.length]);

  // Context logic for category-news mode
  const currentCategoryExt = newsCategoriesExt.find(c => c.name === categoryName || c.id === categoryName);
  const currentCategoryId = currentCategoryExt ? currentCategoryExt.id : null;
  const childCategories = newsCategoriesExt.filter(c => c.parentId && c.parentId === currentCategoryId).map(c => c.name);

  const parentCategoryExt = currentCategoryExt?.parentId 
    ? newsCategoriesExt.find(c => c.id === currentCategoryExt.parentId) 
    : null;

  const contextNews = allNews.filter(n => {
    if (!categoryName) return true;
    if (n.category === categoryName) return true;
    if (childCategories.includes(n.category)) return true;
    return false;
  });

  const rootCategories = newsCategoriesExt.filter(c => !c.parentId).map(c => c.name);

  // Fallback to all distinct categories if no setup in Ext
  const defaultCategories = Array.from(new Set(allNews.map(n => n.category))).filter(Boolean);

  const availableTabs = categoryName 
    ? ['Tất cả', ...childCategories]
    : ['Tất cả', ...(rootCategories.length > 0 ? rootCategories : defaultCategories)];

  const filteredNews = contextNews.filter(n => {
    const matchesTab = activeTab === 'Tất cả' || n.category === activeTab;
    const matchesKeyword = (n.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (n.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesKeyword;
  });

  const middleGridNews = filteredNews.slice(0, 8);
  const middleGridIds = new Set(middleGridNews.map(n => n.id));
  
  const displayArticle = hoveredArticle && middleGridNews.some(n => n.id === hoveredArticle.id) 
    ? hoveredArticle 
    : middleGridNews[0];

  const trendingNews = [...contextNews]
    .filter(n => !middleGridIds.has(n.id))
    .sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0))
    .slice(0, 5);

  const trendingIds = new Set(trendingNews.map(n => n.id));

  const interestNewsFull = filteredNews.filter(n => !middleGridIds.has(n.id) && !trendingIds.has(n.id));
  const interestNews = interestNewsFull.slice(0, interestNewsLimit);

  const displayedSyncProducts = [...products]
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    .slice(0, 5);
  
  const latestSales = [...products]
    .filter(p => !p.type || p.type !== 'rent')
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    .slice(0, 5);

  const latestRents = [...products]
    .filter(p => p.type === 'rent')
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    .slice(0, 5);

  const featuredProjects = [...projects]
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    .slice(0, 5);

  const handleInterestSeeMore = () => {
    setInterestNewsLimit(prev => prev + 6);
    setProductSyncOffset(prev => prev + 2);
    onShowNotification("Đang tải thêm 6 bài tin gốc & cập nhật nạp đồng bộ sản phẩm mới nhất bên phải!", "success");
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

  return (    <>
    <div className="relative min-h-screen">
      <div className="space-y-4 pb-0 font-sans" id="news-catalog-root-wrapper">
        {categoryName && (
          <nav aria-label="breadcrumb" className={`sticky ${scrollDirection === 'down' ? 'top-0' : 'top-10'} z-[90] mx-auto flex min-h-10 w-full max-w-7xl items-center gap-2 border-b border-border-color bg-bg-surface/95 px-4 py-2 font-sans text-[13px] text-text-secondary shadow-sm backdrop-blur-md transition-[top] duration-300 sm:px-6 lg:px-8`}>
            <button onClick={() => onNavigate({ screen: 'tin-tuc' })} className="hover:text-primary transition-colors font-medium">Tin tức</button>
            <span className="text-text-secondary">/</span>
            {parentCategoryExt ? (
              <>
                <button onClick={() => onNavigate({ screen: 'category-news', categoryName: parentCategoryExt.name })} className="hover:text-primary transition-colors font-medium">{parentCategoryExt.name}</button>
                <span className="text-text-secondary">/</span>
                <span className="text-primary font-medium">{categoryName}</span>
              </>
            ) : (
              <span className="text-primary font-medium">{categoryName}</span>
            )}
          </nav>
        )}
        {sections.map((section, idx) => {
          if (!section) return null;
          if (!section.visible && !isEditMode) return null;
          if (['news_categories'].includes(section.id)) return null;

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
          } else if (section.id === 'news_header') {
            cardContent = (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[10px]">
                <div role="tablist" aria-label="Danh mục tin tức" className="border-b border-border-color mb-[15px] flex items-end overflow-x-auto hide-scrollbar gap-6 pb-1 relative">
                  {availableTabs.map((tab) => {
                    const isParent = newsCategoriesExt.some(c => c.parentId === newsCategoriesExt.find(pc => pc.name === tab)?.id);
                    return (
                      <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab}
                        onClick={(e) => {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          const parent = e.currentTarget.parentElement;
                          if (parent) parent.scrollTo({ left: e.currentTarget.offsetLeft - parent.offsetLeft - parent.clientWidth / 2 + e.currentTarget.clientWidth / 2, behavior: 'smooth' });
                          if (tab !== 'Tất cả' && isParent && !categoryName) {
                            onNavigate({ screen: 'category-news', categoryName: tab });
                          } else {
                            setActiveTab(tab);
                          }
                        }}
                        className={`text-base font-semibold transition-all cursor-pointer whitespace-nowrap bg-transparent border-none p-0 pb-1 mb-[-1px] font-sans ${
                          activeTab === tab 
                            ? 'text-primary border-b-2 border-primary border-solid' 
                            : 'text-text-secondary hover:text-primary border-b-2 border-transparent border-solid'
                        }`}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>

                <div className="border-b border-dashed border-border-color mb-0 pb-0">
                  <div className="space-y-2">
                    {categoryName ? (
                      <div>
                        <h1 className="text-2xl sm:text-[26px] font-bold text-primary leading-tight m-0 tracking-tight pt-[10px] pb-[8px] [&>span]:pt-0">
                          {currentCategoryExt?.seoTitle || categoryName}
                        </h1>
                        <div className="flex justify-between items-start flex-col md:flex-row gap-4 mt-2">
                          <p className="text-text-secondary text-[13px] font-normal max-w-xl m-0">
                            {currentCategoryExt?.seoDesc || `Khám phá các bài viết nổi bật thuộc chuyên mục ${categoryName}.`}
                          </p>
                          <div className="relative w-full md:w-[150px] shrink-0 h-[26px]">
                            <input
                              type="text"
                              aria-label="Tìm kiếm tin tức"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Tìm kiếm tiêu đề..."
                              className="w-full bg-bg-surface border border-border-color text-text-secondary placeholder-zinc-400 rounded py-[4px] pl-[26px] pr-2 text-[11px] h-[26px] focus:border-primary outline-none transition-colors"
                            />
                            <Search className="absolute left-[8px] top-[8px] w-[10px] h-[10px] text-text-secondary" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <EditableText 
                          sectionId={section.id} 
                          field="title" 
                          value={sec.title} 
                          isEditMode={isEditMode} 
                          sections={sections} 
                          onUpdateSections={onUpdateSections}
                          className="text-2xl sm:text-[26px] font-bold text-primary leading-tight m-0 pt-[10px] pb-[8px] [&>span]:pt-0"
                          tag="h1"
                        />
                        <div className="flex justify-between items-start flex-col md:flex-row gap-4">
                          <EditableText 
                            sectionId={section.id} 
                            field="description" 
                            value={sec.description} 
                            isEditMode={isEditMode} 
                            sections={sections} 
                            onUpdateSections={onUpdateSections}
                            isArea={true}
                            className="text-text-secondary text-[13px] font-normal max-w-xl m-0"
                            tag="p"
                          />
                          <div className="relative w-full md:w-[150px] shrink-0 h-[26px]">
                            <input
                              type="text"
                              aria-label="Tìm kiếm tin tức"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Tìm kiếm tiêu đề..."
                              className="w-full bg-bg-surface border border-border-color text-text-secondary placeholder-zinc-400 rounded py-[4px] pl-[26px] pr-2 text-[11px] h-[26px] focus:border-primary outline-none transition-colors"
                            />
                            <Search className="absolute left-[8px] top-[8px] w-[10px] h-[10px] text-text-secondary" />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          } else if (section.id === 'news_highlights' || section.id === 'news_tri_column') {
            cardContent = (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
                {loading ? (
                  <div className="py-12 text-center min-h-[500px] flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : filteredNews.length === 0 ? (
                  <div className="text-center py-10 text-text-secondary text-sm">Không tìm thấy bài viết nào.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-10 lg:grid-cols-12 gap-6 items-start text-left">
                    <h2 className="sr-only">Danh sách bài viết</h2>
                    {/* Cover highlight */}
                    <div className="md:col-span-5 lg:col-span-5 bg-bg-surface border border-border-color rounded overflow-hidden flex flex-col group cursor-pointer hover:border-primary transition-colors">
                      <div className="h-[260px] overflow-hidden relative">
                        <NextImage priority decoding="async"
                          src={displayArticle?.imageUrl || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600"}
                          sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 520px"
                          alt={displayArticle?.title}
                          width={600}
                          height={400}
                          quality={60}
                          referrerPolicy="no-referrer"
                          onClick={() => displayArticle && onNavigate({ screen: 'news-detail', newsId: displayArticle.id, slug: generateSlug(displayArticle.title) })}
                          className="motion-media w-full h-full object-cover group-hover:scale-105"
                        />
                      </div>

                      <div className="p-5 flex flex-col border-t border-border-color bg-bg-surface">
                        <h3 
                          className="font-extrabold text-lg text-text-primary mb-2.5 leading-snug line-clamp-2 hover:text-primary"
                          onClick={() => displayArticle && onNavigate({ screen: 'news-detail', newsId: displayArticle.id, slug: generateSlug(displayArticle.title) })}
                        >
                          {displayArticle?.title}
                        </h3>
                        <p className="text-[#888] text-[13px] mb-2.5 line-clamp-3 leading-[1.5]">
                          {displayArticle?.description}
                        </p>
                        <div className="text-[11px] text-primary font-semibold mt-2.5 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          {displayArticle ? formatVietnamDate(displayArticle.createdAt) : ''}
                        </div>
                      </div>
                    </div>

                    {/* Middle grid (Hover List) */}
                    <div className="md:col-span-5 lg:col-span-4 flex flex-col">
                      <div className="space-y-0 relative border-l border-border-color md:border-none pl-4 md:pl-0">
                        {filteredNews.slice(0, 8).map((article) => (
                          <div
                            key={article.id}
                            role="link"
                            tabIndex={0}
                            onMouseEnter={() => setHoveredArticle(article)}
                            onClick={() => onNavigate({ screen: 'news-detail', newsId: article.id, slug: generateSlug(article.title) })}
                            onKeyDown={(event) => handleKeyboardActivation(event, () => onNavigate({ screen: 'news-detail', newsId: article.id, slug: generateSlug(article.title) }))}
                            className={`p-3 border-b border-dashed border-border-color cursor-pointer text-[#a1a1aa] font-medium text-[13px] transition-all leading-[1.4] ${
                              displayArticle?.id === article.id ? 'bg-primary/5 text-primary border-l-[3px] border-l-yellow-500 pl-4 border-b-yellow-500/20' : 'border-l-[3px] border-l-transparent'
                            }`}
                          >
                            <span className="line-clamp-2">{article.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Trending Rail */}
                    <div className="md:col-span-10 lg:col-span-3 flex flex-col mt-6 lg:mt-0">
                      <h3 className="text-[15px] font-bold text-primary m-0 mb-4 pb-0 border-b-2 border-primary w-max">
                        Tin nổi bật
                      </h3>

                      <div className="space-y-0">
                        {trendingNews.slice(0, 5).map((article) => (
                          <div
                            key={article.id}
                            role="link"
                            tabIndex={0}
                            onClick={() => onNavigate({ screen: 'news-detail', newsId: article.id, slug: generateSlug(article.title) })}
                            onKeyDown={(event) => handleKeyboardActivation(event, () => onNavigate({ screen: 'news-detail', newsId: article.id, slug: generateSlug(article.title) }))}
                            className="cursor-pointer group flex items-center gap-2.5 mb-4"
                          >
                            <div className="w-[70px] h-[50px] shrink-0 rounded overflow-hidden border border-border-inverse">
                              <img loading="lazy" decoding="async" src={optimizeImageUrl(article.thumbnail, 800) || undefined} alt={`Ảnh thu nhỏ bài viết: ${article.title}`} width="70" height="50" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <h4 className="text-[12px] text-text-primary hover:text-primary transition-colors font-semibold line-clamp-2 m-0 mb-1 leading-snug">
                                {article.title}
                              </h4>
                              <div className="flex items-center text-[10px] text-[#888] gap-1">
                                <Calendar className="w-2.5 h-2.5" />
                                <span>{formatVietnamDate(article.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          } else if (section.id === 'news_subsections' || section.id === 'news_interests') {
            cardContent = (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row gap-[30px] items-start mb-10 text-left">
                  {/* Left division */}
                  <div className="w-full md:w-[70%] flex flex-col md:pr-[15px]">
                    <div className="flex justify-between items-end border-b border-border-color pb-2 mb-5">
                      <h3 className="text-[15px] font-bold text-text-primary border-l-4 border-primary pl-4 m-0 leading-none">Có thể bạn quan tâm</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[20px] items-start content-start">
                      {interestNews.map((article) => (
                        <div
                          key={article.id}
                          role="link"
                          tabIndex={0}
                          onClick={() => onNavigate({ screen: 'news-detail', newsId: article.id, slug: generateSlug(article.title) })}
                          onKeyDown={(event) => handleKeyboardActivation(event, () => onNavigate({ screen: 'news-detail', newsId: article.id, slug: generateSlug(article.title) }))}
                          className="flex gap-3 pb-[15px] border-b border-dashed border-border-color transition-colors cursor-pointer group hover:border-b-yellow-500 items-center"
                        >
                          <div className="w-[90px] h-[65px] rounded overflow-hidden shrink-0 border border-border-color relative">
                            <img loading="lazy" decoding="async" src={optimizeImageUrl(article.thumbnail, 400) || undefined} alt={article.title} width="90" height="65" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 block" referrerPolicy="no-referrer" />
                          </div>

                          <div className="flex-1 flex flex-col justify-center">
                            <h4 className="text-[13px] font-semibold text-text-primary group-hover:text-primary line-clamp-2 leading-[1.4] m-0 mb-1.5 transition-colors">
                              {article.title}
                            </h4>
                            <div className="text-[11px] text-primary flex items-center gap-1 mt-auto">
                              <Calendar className="w-3 h-3" />
                              {formatVietnamDate(article.createdAt)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {interestNewsFull.length > interestNewsLimit && (
                      <div className="text-center w-full mt-6">
                        <button
                          type="button"
                          onClick={handleInterestSeeMore}
                          className="inline-block text-[11px] text-primary font-bold uppercase py-2.5 px-[30px] border border-primary rounded-lg transition-all no-underline cursor-pointer bg-transparent hover:bg-primary/15"
                        >
                          Xem thêm bài viết
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right division products synchronization */}
                  <div className="w-full md:w-[30%] flex flex-col md:pl-[15px] space-y-10">
                    {[
                      { title: 'Sản Phẩm Mới', items: displayedSyncProducts, type: 'product' }
                    ].map((sec, idx) => {
                      if (sec.items.length === 0) return null;
                      return (
                        <div key={idx} className="flex flex-col">
                          <div className={`flex justify-between items-end border-b border-border-color pb-2 mb-5 ${idx === 0 ? 'mt-8 md:mt-0' : ''}`}>
                            <h3 className="text-[15px] font-bold text-text-primary border-l-4 border-primary pl-4 m-0 leading-none text-shadow-sm">{sec.title}</h3>
                          </div>
                          
                          <div className="flex flex-col gap-[15px]">
                            {sec.items.map((p: any) => (
                              <div
                                key={p.id}
                                role="link"
                                tabIndex={0}
                                onClick={() => onNavigate({ screen: sec.type === 'project' ? 'project-detail' : 'product-detail', [sec.type === 'project' ? 'projectId' : 'productId']: p.id, slug: generateSlug(p.title) } as any)}
                                onKeyDown={(event) => handleKeyboardActivation(event, () => onNavigate({ screen: sec.type === 'project' ? 'project-detail' : 'product-detail', [sec.type === 'project' ? 'projectId' : 'productId']: p.id, slug: generateSlug(p.title) } as any))}
                                className="flex gap-3 pb-[15px] border-b border-white/5 transition-colors cursor-pointer group"
                              >
                                <div className="w-[100px] h-[85px] shrink-0 rounded overflow-hidden border border-border-color relative">
                                  {sec.type === 'product' && (
                                    <span className={`absolute top-0 left-0 px-[5px] py-[3px] text-[10px] font-semibold text-white z-10 rounded-br-[5px] ${p.type === 'rent' ? 'bg-primary' : 'bg-rose-700'}`}>
                                      {p.type === 'rent' ? 'Cho thuê' : 'Bán'}
                                    </span>
                                  )}
                                  <img loading="lazy" decoding="async" src={optimizeImageUrl(p.imageUrl || p.imageUrls?.[0], 400) || undefined} alt={p.title} width="100" height="85" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 block" referrerPolicy="no-referrer" />
                                </div>

                                <div className="flex-1 flex flex-col justify-center min-w-0">
                                  <h4 className="text-[13px] font-semibold text-text-primary leading-[1.4] m-0 mb-1.5 line-clamp-2 group-hover:text-primary">
                                    {p.title}
                                  </h4>
                                  <div className="text-[11px] text-[#999] mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                                    {sec.type === 'product' && (
                                      <>
                                        <span className="flex items-center gap-1">
                                          <Layers className="w-3 h-3 shrink-0" /> {p.area}m²
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Bookmark className="w-3 h-3 shrink-0" /> {p.bedrooms} PN
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Bath className="w-3 h-3 shrink-0" /> {p.toilets} WC
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  <div className="flex justify-between items-center w-full mb-1">
                                    <span className="text-primary font-bold text-[12px]">{p.priceText}</span>
                                  </div>
                                  <div className="text-[11px] text-[#999] flex items-center gap-1 min-w-[70px]">
                                    <MapPin className="w-3 h-3 text-primary shrink-0" />
                                    <span className="truncate">{p.district || p.location}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    
                    <div className="text-center w-full mt-6">
                       <button
                          onClick={() => onNavigate({ screen: 'san-pham' })}
                          className="inline-block text-[10px] text-primary font-bold uppercase py-[5px] px-[15px] border border-primary rounded-lg transition-all no-underline cursor-pointer bg-transparent hover:bg-primary/15"
                        >
                          Xem tất cả sản phẩm
                        </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          } else if (section.id === 'news_bottom_sales') {
            cardContent = (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Latest Sales */}
                {latestSales.length > 0 && (
                  <section className="space-y-6 text-left">
                    <h3 className="text-[15px] font-display font-medium text-text-primary border-l-4 border-primary pl-3">Tin Bán mới nhất</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                      {latestSales.map((item) => (
                        <div key={item.id} className="w-full">
                          <ProductCard item={item} onNavigate={onNavigate} />
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            );
          } else if (section.id === 'news_bottom_rents') {
            cardContent = (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Latest Rents */}
                {latestRents.length > 0 && (
                  <section className="space-y-6 text-left">
                    <h3 className="text-[15px] font-display font-medium text-text-primary border-l-4 border-primary pl-3">Tin Cho thuê mới nhất</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                      {latestRents.map((item) => (
                        <div key={item.id} className="w-full">
                          <ProductCard item={item} onNavigate={onNavigate} />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Featured Projects */}
                {featuredProjects.length > 0 && (
                  <section className="space-y-6 pt-16 text-left">
                    <div className="flex items-end justify-between pb-2">
                      <h3 className="text-[15px] font-display font-medium text-text-primary border-l-4 border-primary pl-3">Dự án nổi bật</h3>
                      <button
                        type="button"
                        onClick={() => onNavigate({ screen: 'du-an' })}
                        className="flex items-center gap-1.5 text-[9px] uppercase font-mono tracking-widest text-primary font-bold hover:underline bg-transparent border-none cursor-pointer p-0"
                      >
                        <span>Xem thêm →</span>
                      </button>
                    </div>
                    <div className="relative overflow-hidden py-4 w-full">
                      <div className="animate-news-list-sliding-container flex w-max">
                        <div className="flex w-max animate-news-list-slider">
                          {[...Array(2)].flatMap(() => featuredProjects.slice(0, 5)).map((p, idx) => {
                            let statusText = 'Đang mở bán';
                            if (p.status === 'handed-over') statusText = 'Đã bàn giao';
                            if (p.status === 'coming_soon') statusText = 'Sắp ra mắt';

                            return (
                              <div
                                key={`${p.id}-${idx}`}
                                aria-hidden={idx >= featuredProjects.slice(0, 5).length}
                                onClick={() => onNavigate({ screen: 'project-detail', projectId: p.id, slug: generateSlug(p.title) })}
                                className="motion-card w-[260px] sm:w-[280px] md:w-[240px] lg:w-[223px] shrink-0 mr-4 lg:mr-5 bg-bg-surface border border-primary/20 rounded-xl overflow-hidden flex flex-col h-full hover:border-primary/30 cursor-pointer no-underline group shadow-sm justify-between"
                              >
                                <div className="relative aspect-[16/10] overflow-hidden">
                                  <img loading="lazy" decoding="async"
                                    src={optimizeImageUrl(p.imageUrl || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800", 400) || undefined}
                                    alt={p.title}
                                    width="800"
                                    height="500"
                                    referrerPolicy="no-referrer"
                                    className="motion-media w-full h-full object-cover group-hover:scale-105 block"
                                    onError={(e) => { e.currentTarget.onerror = null; (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400?text=Greenia+Homes'; }}
                                  />
                                  <div className="absolute top-0 left-0 px-2.5 py-1 bg-success text-white text-[11px] font-bold rounded-none rounded-br-lg shadow-sm z-10">
                                    {statusText}
                                  </div>
                                </div>
      
                                <div className="p-4 flex-1 flex flex-col justify-between text-left">
                                  <div>
                                    <h3 className="text-[13px] sm:text-[15px] font-bold text-text-primary mb-2 line-clamp-2 transition-colors group-hover:text-primary w-full text-left">
                                      {p.title}
                                    </h3>
                                    <div className="flex items-center justify-between text-xs mb-3 w-full">
                                      <span className="text-text-secondary">Giá từ:</span>
                                      <span className="text-primary font-bold text-[13px]">{p.priceText || "Đang cập nhật"}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-[11px] text-text-secondary mb-2 w-full">
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
                                  <div className="flex items-start gap-1.5 text-[11px] text-text-secondary mt-auto pt-2 border-t border-border-color/50 w-full">
                                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-[1px]" />
                                    <span className="text-left line-clamp-2">
                                      {p.location || p.title}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                        })}
                      </div>
                    </div>
                  </div>
                  </section>
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
                paddingTop: section.id === 'news_tri_column' ? '10px' : (section.id === 'news_header' ? '0px' : `${section.paddingTop || 0}px`),
                paddingBottom: section.id === 'news_tri_column' ? '10px' : (section.id === 'news_header' ? '0px' : `${section.paddingBottom || 0}px`),
                marginBottom: section.id === 'news_tri_column' ? '16px' : (section.id === 'news_header' ? '5px' : undefined)
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
                <AdBanner slot="news-catalog-interstitial" containerClassName="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-6" />
              )}
            </div>
          );
        })}
      </div>
    </div>
      </>
);
}
