import React, { useState, useEffect } from 'react';
import { optimizeImageUrl } from '../lib/utils';
import { SEO } from './SEO';
import { collection, getDocs, db } from '../firebase';
import { News, Product, Project, RouteState } from '../types';
import { Calendar, Eye, Compass, Search, User, ChevronRight, BadgeDollarSign, MapPin, Sparkles, Heart, Bookmark, Layers, Bath, Building2 } from 'lucide-react';
import AdBanner from './AdBanner';
import ProductCard from './ProductCard';
import { EditableText, EditableImage } from './EditableComponent';
import CustomSectionRenderer from './CustomSectionRenderer';
import SectionHeaderToolbar from './SectionHeaderToolbar';

interface NewsListProps {
  onNavigate: (route: RouteState) => void;
  onShowNotification: (message: string, type: 'success' | 'error') => void;
  isEditMode: boolean;
  sections: any[];
  onUpdateSections: (sections: any[]) => void;
  selectedSectionId: string | null;
  setSelectedSectionId: (id: string | null) => void;
  categoryName?: string;
}

export default function NewsList({ 
  onNavigate, 
  onShowNotification,
  isEditMode,
  sections,
  onUpdateSections,
  selectedSectionId,
  setSelectedSectionId,
  categoryName
}: NewsListProps) {
  const [allNews, setAllNews] = useState<News[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Tabs
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Tất cả');

  useEffect(() => {
    if (searchQuery) {
      document.title = `Tìm tin tức: "${searchQuery}" | Greenia Homes`;
    } else if (categoryName) {
      document.title = `Chuyên mục tin tức: ${categoryName} | Greenia Homes`;
    } else if (activeTab && activeTab !== 'Tất cả') {
      document.title = `Chuyên mục: ${activeTab} | Greenia Homes`;
    } else {
      document.title = "Cẩm Nang Phong Thủy & Tin Tức | Greenia Homes";
    }
  }, [searchQuery, categoryName, activeTab]);

  useEffect(() => {
    if (searchQuery) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [searchQuery]);

  // React state for Column 1 & Column 2 dynamic hover pairing
  const [hoveredArticle, setHoveredArticle] = useState<News | null>(null);

  // AJAX loading counts
  const [interestNewsLimit, setInterestNewsLimit] = useState(12);

  // Product offset cycle for synchronization
  const [productSyncOffset, setProductSyncOffset] = useState(0);

  const [newsCategoriesExt, setNewsCategoriesExt] = useState<any[]>([]);

  useEffect(() => {
    async function loadNewsData() {
      try {
        setLoading(true);

        const { getDoc, doc } = await import('firebase/firestore');
        const docSnap = await getDoc(doc(db, 'settings', 'general'));
        if (docSnap.exists() && docSnap.data().newsCategoriesExt) {
          setNewsCategoriesExt(docSnap.data().newsCategoriesExt);
        }

        const newsSnap = await getDocs(collection(db, 'news'));
        const nList: News[] = [];
        newsSnap.forEach((doc) => {
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
        prodSnap.forEach((doc) => {
          const data = doc.data();
          if (!data.approvalStatus || data.approvalStatus === 'approved') {
            pList.push({ id: doc.id, ...data } as Product);
          }
        });
        setProducts(pList);

        const projSnap = await getDocs(collection(db, 'projects'));
        const projList: Project[] = [];
        projSnap.forEach((doc) => {
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
  }, []);

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
      <SEO title="Tin Tức Bất Động Sản" />

    <div className="relative min-h-screen">
      <div className="space-y-4 pb-0 font-sans" id="news-catalog-root-wrapper">
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
                {categoryName && (
                  <div className="mb-4 flex items-center font-sans text-[13px] text-slate-400 gap-2">
                    <button onClick={() => onNavigate({ screen: 'tin-tuc' })} className="hover:text-amber-500 transition-colors font-medium">Tin tức</button>
                    <span className="text-slate-600">/</span>
                    {parentCategoryExt ? (
                      <>
                        <button onClick={() => onNavigate({ screen: 'category-news', categoryName: parentCategoryExt.name })} className="hover:text-amber-500 transition-colors font-medium">{parentCategoryExt.name}</button>
                        <span className="text-slate-600">/</span>
                        <span className="text-amber-500 font-medium">{categoryName}</span>
                      </>
                    ) : (
                      <span className="text-amber-500 font-medium">{categoryName}</span>
                    )}
                  </div>
                )}
                <div className="border-b border-slate-800 mb-[15px] flex items-end overflow-x-auto hide-scrollbar gap-6 pb-1 relative">
                  {availableTabs.map((tab) => {
                    const isParent = newsCategoriesExt.some(c => c.parentId === newsCategoriesExt.find(pc => pc.name === tab)?.id);
                    return (
                      <button
                        key={tab}
                        type="button"
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
                            ? 'text-amber-500 border-b-2 border-amber-500 border-solid' 
                            : 'text-slate-500 hover:text-amber-500 border-b-2 border-transparent border-solid'
                        }`}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>

                <div className="border-b border-dashed border-slate-800 mb-0 pb-0">
                  <div className="space-y-2">
                    {categoryName ? (
                      <div>
                        <h1 className="text-2xl sm:text-[26px] font-bold text-amber-500 leading-tight m-0 tracking-tight pt-[10px] pb-[8px] [&>span]:pt-0">
                          {currentCategoryExt?.seoTitle || categoryName}
                        </h1>
                        <div className="flex justify-between items-start flex-col md:flex-row gap-4 mt-2">
                          <p className="text-slate-500 text-[13px] font-normal max-w-xl m-0">
                            {currentCategoryExt?.seoDesc || `Khám phá các bài viết nổi bật thuộc chuyên mục ${categoryName}.`}
                          </p>
                          <div className="relative w-full md:w-[150px] shrink-0 h-[26px]">
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Tìm kiếm tiêu đề..."
                              className="w-full bg-slate-900 border border-slate-800 text-slate-300 placeholder-slate-500 rounded py-[4px] pl-[26px] pr-2 text-[11px] h-[26px] focus:border-amber-500 outline-none transition-colors"
                            />
                            <Search className="absolute left-[8px] top-[8px] w-[10px] h-[10px] text-slate-500" />
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
                          className="text-2xl sm:text-[26px] font-bold text-amber-500 leading-tight m-0 pt-[10px] pb-[8px] [&>span]:pt-0"
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
                            className="text-slate-500 text-[13px] font-normal max-w-xl m-0"
                            tag="p"
                          />
                          <div className="relative w-full md:w-[150px] shrink-0 h-[26px]">
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Tìm kiếm tiêu đề..."
                              className="w-full bg-slate-900 border border-slate-800 text-slate-300 placeholder-slate-500 rounded py-[4px] pl-[26px] pr-2 text-[11px] h-[26px] focus:border-amber-500 outline-none transition-colors"
                            />
                            <Search className="absolute left-[8px] top-[8px] w-[10px] h-[10px] text-slate-500" />
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
                    <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : filteredNews.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-sm">Không tìm thấy bài viết nào.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-10 lg:grid-cols-12 gap-6 items-start text-left">
                    {/* Cover highlight */}
                    <div className="md:col-span-5 lg:col-span-5 bg-[#0e121b] border border-[#232d45] rounded overflow-hidden flex flex-col group cursor-pointer hover:border-amber-500 transition-colors">
                      <div className="h-[260px] overflow-hidden relative">
                        <img loading="eager" decoding="async"
                          // @ts-ignore
                          fetchpriority="high"
                          src={(displayArticle?.imageUrl || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600") || undefined}
                          alt={displayArticle?.title}
                          referrerPolicy="no-referrer"
                          onClick={() => displayArticle && onNavigate({ screen: 'news-detail', newsId: displayArticle.id, slug: generateSlug(displayArticle.title) })}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      <div className="p-5 flex flex-col border-t border-[#232d45] bg-[#0e121b]">
                        <h3 
                          className="font-extrabold text-lg text-white mb-2.5 leading-snug line-clamp-2 hover:text-amber-500"
                          onClick={() => displayArticle && onNavigate({ screen: 'news-detail', newsId: displayArticle.id, slug: generateSlug(displayArticle.title) })}
                        >
                          {displayArticle?.title}
                        </h3>
                        <p className="text-[#888] text-[13px] mb-2.5 line-clamp-3 leading-[1.5]">
                          {displayArticle?.description}
                        </p>
                        <div className="text-[11px] text-amber-500 font-semibold mt-2.5 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          {displayArticle ? new Date(displayArticle.createdAt).toLocaleDateString('vi-VN') : ''}
                        </div>
                      </div>
                    </div>

                    {/* Middle grid (Hover List) */}
                    <div className="md:col-span-5 lg:col-span-4 flex flex-col">
                      <div className="space-y-0 relative border-l border-[#232d45] md:border-none pl-4 md:pl-0">
                        {filteredNews.slice(0, 8).map((article) => (
                          <div
                            key={article.id}
                            onMouseEnter={() => setHoveredArticle(article)}
                            onClick={() => onNavigate({ screen: 'news-detail', newsId: article.id, slug: generateSlug(article.title) })}
                            className={`p-3 border-b border-dashed border-[#232d45] cursor-pointer text-[#94a3b8] font-medium text-[13px] transition-all leading-[1.4] ${
                              displayArticle?.id === article.id ? 'bg-amber-500/5 text-amber-500 border-l-[3px] border-l-amber-500 pl-4 border-b-amber-500/20' : 'border-l-[3px] border-l-transparent'
                            }`}
                          >
                            <span className="line-clamp-2">{article.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Trending Rail */}
                    <div className="md:col-span-10 lg:col-span-3 flex flex-col mt-6 lg:mt-0">
                      <h3 className="text-[15px] font-bold text-amber-500 m-0 mb-4 pb-0 border-b-2 border-amber-500 w-max">
                        Tin nổi bật
                      </h3>

                      <div className="space-y-0">
                        {trendingNews.slice(0, 5).map((article) => (
                          <div
                            key={article.id}
                            onClick={() => onNavigate({ screen: 'news-detail', newsId: article.id, slug: generateSlug(article.title) })}
                            className="cursor-pointer group flex items-center gap-2.5 mb-4"
                          >
                            <div className="w-[70px] h-[50px] shrink-0 rounded overflow-hidden border border-white/10">
                              <img loading="lazy" decoding="async" src={optimizeImageUrl() || undefined} alt={`Ảnh thu nhỏ bài viết: ${article.title}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <h4 className="text-[12px] text-white hover:text-amber-500 transition-colors font-semibold line-clamp-2 m-0 mb-1 leading-snug">
                                {article.title}
                              </h4>
                              <div className="flex items-center text-[10px] text-[#888] gap-1">
                                <Calendar className="w-2.5 h-2.5" />
                                <span>{new Date(article.createdAt).toLocaleDateString('vi-VN')}</span>
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
                    <div className="flex justify-between items-end border-b border-[#232d45] pb-2 mb-5">
                      <h3 className="text-[15px] font-bold text-white border-l-4 border-amber-500 pl-4 m-0 leading-none">Có thể bạn quan tâm</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[20px] items-start content-start">
                      {interestNews.map((article) => (
                        <div
                          key={article.id}
                          onClick={() => onNavigate({ screen: 'news-detail', newsId: article.id, slug: generateSlug(article.title) })}
                          className="flex gap-3 pb-[15px] border-b border-dashed border-[#232d45] transition-colors cursor-pointer group hover:border-b-amber-500 items-center"
                        >
                          <div className="w-[90px] h-[65px] rounded overflow-hidden shrink-0 border border-[#232d45] relative">
                            <img loading="lazy" decoding="async" src={optimizeImageUrl() || undefined} alt={article.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 block" referrerPolicy="no-referrer" />
                          </div>

                          <div className="flex-1 flex flex-col justify-center">
                            <h4 className="text-[13px] font-semibold text-slate-200 group-hover:text-amber-500 line-clamp-2 leading-[1.4] m-0 mb-1.5 transition-colors">
                              {article.title}
                            </h4>
                            <div className="text-[11px] text-amber-500 flex items-center gap-1 mt-auto">
                              <Calendar className="w-3 h-3" />
                              {new Date(article.createdAt).toLocaleDateString('vi-VN')}
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
                          className="inline-block text-[11px] text-amber-500 font-bold uppercase py-2.5 px-[30px] border border-amber-500 rounded-lg transition-all no-underline cursor-pointer bg-transparent hover:bg-amber-500/15"
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
                          <div className={`flex justify-between items-end border-b border-[#232d45] pb-2 mb-5 ${idx === 0 ? 'mt-8 md:mt-0' : ''}`}>
                            <h3 className="text-[15px] font-bold text-white border-l-4 border-amber-500 pl-4 m-0 leading-none text-shadow-sm">{sec.title}</h3>
                          </div>
                          
                          <div className="flex flex-col gap-[15px]">
                            {sec.items.map((p: any) => (
                              <div
                                key={p.id}
                                onClick={() => onNavigate({ screen: sec.type === 'project' ? 'project-detail' : 'product-detail', [sec.type === 'project' ? 'projectId' : 'productId']: p.id } as any)}
                                className="flex gap-3 pb-[15px] border-b border-white/5 transition-colors cursor-pointer group"
                              >
                                <div className="w-[100px] h-[85px] shrink-0 rounded overflow-hidden border border-[#232d45] relative">
                                  {sec.type === 'product' && (
                                    <span className={`absolute top-0 left-0 px-[5px] py-[3px] text-[10px] font-semibold text-white z-10 rounded-br-[5px] ${p.type === 'rent' ? 'bg-emerald-700' : 'bg-rose-700'}`}>
                                      {p.type === 'rent' ? 'Cho thuê' : 'Đang bán'}
                                    </span>
                                  )}
                                  <img loading="lazy" decoding="async" src={optimizeImageUrl() || undefined} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 block" referrerPolicy="no-referrer" />
                                </div>

                                <div className="flex-1 flex flex-col justify-center min-w-0">
                                  <h4 className="text-[13px] font-semibold text-white leading-[1.4] m-0 mb-1.5 line-clamp-2 group-hover:text-amber-500">
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
                                    <span className="text-amber-500 font-bold text-[12px]">{p.priceText}</span>
                                  </div>
                                  <div className="text-[11px] text-[#999] flex items-center gap-1 min-w-[70px]">
                                    <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
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
                          className="inline-block text-[10px] text-amber-500 font-bold uppercase py-[5px] px-[15px] border border-amber-500 rounded-lg transition-all no-underline cursor-pointer bg-transparent hover:bg-amber-500/15"
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
                    <h3 className="text-[15px] font-display font-medium text-white border-l-4 border-amber-500 pl-3">Tin Bán mới nhất</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                      {latestSales.map((item) => (
                        <div key={item.id} className="w-full">
                          <ProductCard item={item} onNavigate={onNavigate} badgeText="Bán" badgeColor="bg-rose-700 text-white" />
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
                    <h3 className="text-[15px] font-display font-medium text-white border-l-4 border-amber-500 pl-3">Tin Cho thuê mới nhất</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                      {latestRents.map((item) => (
                        <div key={item.id} className="w-full">
                          <ProductCard item={item} onNavigate={onNavigate} badgeText="Cho thuê" badgeColor="bg-emerald-700 text-white" />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Featured Projects */}
                {featuredProjects.length > 0 && (
                  <section className="space-y-6 pt-16 text-left">
                    <div className="flex items-end justify-between pb-2">
                      <h3 className="text-[15px] font-display font-medium text-white border-l-4 border-amber-500 pl-3">Dự án nổi bật</h3>
                      <button
                        type="button"
                        onClick={() => onNavigate({ screen: 'du-an' })}
                        className="flex items-center gap-1.5 text-[9px] uppercase font-mono tracking-widest text-amber-400 font-bold hover:underline bg-transparent border-none cursor-pointer p-0"
                      >
                        <span>Xem thêm →</span>
                      </button>
                    </div>
                    <div className="relative overflow-x-auto pb-4 scrollbar-thin scroll-smooth snap-x snap-mandatory">
                      <div className="flex gap-5 box-border w-max lg:w-full">
                        {featuredProjects.slice(0, 4).map((p) => {
                          let statusText = 'Đang mở bán';
                          if (p.status === 'handed_over') statusText = 'Đã bàn giao';
                          if (p.status === 'coming_soon') statusText = 'Sắp ra mắt';

                          return (
                            <div
                              key={p.id}
                              onClick={() => onNavigate({ screen: 'project-detail', projectId: p.id, slug: generateSlug(p.title) })}
                              className="w-[85vw] sm:w-[calc(50vw-20px)] lg:w-[calc(25%-15px)] shrink-0 bg-slate-900 border border-amber-500/20 rounded-lg overflow-hidden flex flex-col h-full transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-500 hover:shadow-[0_10px_20px_rgba(0,0,0,0.5)] cursor-pointer no-underline snap-start"
                            >
                              <div className="h-[220px] relative overflow-hidden group">
                                <span className="absolute top-0 left-0 px-3 py-1.5 text-[11px] font-bold text-black bg-[#ff9f43] z-10 rounded-br-lg">
                                  {statusText}
                                </span>
                                <img loading="lazy" decoding="async"
                                  src={optimizeImageUrl() || undefined}
                                  alt={p.title}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 block"
                                  onError={(e) => { e.currentTarget.onerror = null; (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400?text=Greenia+Homes'; }}
                                />
                              </div>

                              <div className="p-4 flex-1 flex flex-col items-start bg-slate-900 text-left">
                                <h3 className="text-[13px] sm:text-[15px] font-bold text-white leading-[1.4] m-0 mb-[9px] line-clamp-2 transition-colors group-hover:text-amber-500 text-left w-full">
                                  {p.title}
                               </h3>
                               <div className="flex items-center justify-between text-xs mb-3 w-full">
                                 <span className="text-slate-400">Giá từ:</span>
                                 <span className="text-amber-500 font-extrabold text-[14px] sm:text-base">{p.priceText || "Đang cập nhật"}</span>
                               </div>
                               <div className="flex items-center gap-[10px] text-[11px] text-slate-300 mb-2 w-full">
                                 <div className="flex items-center gap-1.5 flex-1 w-1/2">
                                   <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500 shrink-0" />
                                   <span className="truncate" title={p.scale || 'Đang cập nhật'}>{p.scale || 'Đang cập nhật quy mô'}</span>
                                 </div>
                                 <div className="flex items-center gap-1.5 flex-1 w-1/2">
                                   <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500 shrink-0" />
                                   <span className="truncate" title={p.units ? String(p.units) : 'Đang cập nhật'}>{p.units ? `${p.units} căn` : 'Đang cập nhật số lượng'}</span>
                                 </div>
                               </div>
                               <div className="text-xs text-[#999] flex items-start gap-1.5 leading-[1.5] mt-auto pt-1 w-full">
                                 <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 shrink-0 mt-[2px]" />
                                 <span className="text-left line-clamp-2">{p.location || 'Đang cập nhật vị trí'}</span>
                               </div>
                              </div>
                            </div>
                          );
                        })}
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
