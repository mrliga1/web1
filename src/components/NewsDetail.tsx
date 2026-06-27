import React, { useState, useEffect } from 'react';
import { , optimizeImageUrl } from '../lib/utils';
import { doc, getDoc, collection, getDocs, addDoc, db } from '../firebase';
import { News, Product, Project, RouteState } from '../types';
import { ChevronLeft, Calendar, User, Eye, CheckCircle2, Bookmark, ArrowRight, ShieldCheck, Tag, Building, Maximize, BedDouble, MapPin, Layers, Bath, Building2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { parseSlugTitleFromPath, resolveItemTitle } from '../lib/documentHead';
import AdBanner from './AdBanner';
import ProductCard from './ProductCard';
import StarRatingInteractive from './StarRatingInteractive';

interface NewsDetailProps {
  newsId: string;
  onNavigate: (route: RouteState) => void;
  onShowNotification: (message: string, type: 'success' | 'error') => void;
}

import { notifyAdminEmail } from '../lib/email';
import { fetchClientIp } from '../lib/ip';

export default function NewsDetail({ newsId, onNavigate, onShowNotification }: NewsDetailProps) {
  const [article, setArticle] = useState<News | null>(() => {
    if (typeof window !== 'undefined' && window.__SERVER_DATA__?.news?.id === newsId) {
      return window.__SERVER_DATA__.news;
    }
    return null;
  });
  const [allNews, setAllNews] = useState<News[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(!article);

  // Categories count map
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  // Sidebar Booking request
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientDemand, setClientDemand] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [seeMoreClicks, setSeeMoreClicks] = useState(0);

  useEffect(() => {
    async function loadArticleData() {
      try {
        if (!article) setLoading(true);

        // Fetch primary article
        const docRef = doc(db, 'news', newsId);
        const docSnap = await getDoc(docRef);

        let fetchedArticle: News | null = article;
        if (docSnap.exists()) {
          fetchedArticle = { id: docSnap.id, ...docSnap.data() } as News;
          setArticle(fetchedArticle);
        } else {
          setLoading(false);
          onShowNotification("Bài viết không tồn tại xu hướng hoặc đã xóa.", "error");
          onNavigate({ screen: 'tin-tuc' });
          return;
        }

        // Fetch other news for cross-linking
        const newsCol = collection(db, 'news');
        const newsSnap = await getDocs(newsCol);
        const nList: News[] = [];
        newsSnap.forEach((d) => {
          const data = d.data();
          if(data.title?.trim()) {
            nList.push({ id: d.id, ...data } as News);
          }
        });
        setAllNews(nList);

        // Fetch products for sidebar and category counts
        const prodCol = collection(db, 'products');
        const prodSnap = await getDocs(prodCol);
        // Fetch Categories Ext
        const genSnap = await getDoc(doc(db, 'settings', 'general'));
        let configCategories: any[] = [];
        if (genSnap.exists() && genSnap.data().productCategoriesExt) {
          configCategories = genSnap.data().productCategoriesExt;
        }

        const pList: Product[] = [];
        const counts: Record<string, number> = {};
        
        if (configCategories.length > 0) {
          configCategories.forEach(c => {
            counts[c.name] = 0;
          });
        }

        prodSnap.forEach((d) => {
          const data = d.data();
          if (!data.approvalStatus || data.approvalStatus === 'approved') {
            const prod = { id: d.id, ...data } as Product;
            pList.push(prod);
            
            // Increment category count
            const cat = (prod.category || "Chưa phân loại").trim();
            const matchedConfigCat = configCategories.find(c => c.name.trim().toLowerCase() === cat.toLowerCase());
            const finalCatName = matchedConfigCat ? matchedConfigCat.name : cat;
            counts[finalCatName] = (counts[finalCatName] || 0) + 1;
          }
        });
        setProducts(pList);
        setCategoryCounts(counts);

        // Fetch projects
        const projCol = collection(db, 'projects');
        const projSnap = await getDocs(projCol);
        const projList: Project[] = [];
        projSnap.forEach((d) => {
          const data = d.data();
          if (!data.approvalStatus || data.approvalStatus === 'approved') {
            projList.push({ id: d.id, ...data } as Project);
          }
        });
        setProjects(projList);

      } catch (err) {
        console.error("Lỗi khi tải bài viết chi tiết:", err);
      } finally {
        setLoading(false);
      }
    }

    loadArticleData();
  }, [newsId]);

  const handleSidebarConsultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim() || !clientEmail.trim() || !clientDemand.trim()) {
      onShowNotification("Quý khách vui lòng cung cấp đủ thông tin.", "error");
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
        message: clientDemand.trim(),
        createdAt: new Date().toISOString(),
        status: 'pending',
        propertyId: newsId,
        propertyTitle: `Đăng ký tư vấn từ bài tin: ${article?.title}`,
        sourceUrl: friendlyUrl,
        ipAddress: clientIp
      });

      notifyAdminEmail({
        name: clientName.trim(),
        phone: clientPhone.trim(),
        email: clientEmail.trim(),
        message: clientDemand.trim(),
        propertyTitle: `Đăng ký tư vấn từ bài tin: ${article?.title}`,
        sourceUrl: friendlyUrl
      });

      setFormSubmitted(true);
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      onShowNotification("Đăng ký nhận thông tin thành công!", "success");
    } catch (err) {
      console.error(err);
      onShowNotification("Gặp sự cố kết nối dữ liệu. Vui lòng thử lại sau.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fallbackTitle = `${parseSlugTitleFromPath(typeof window !== 'undefined' ? window.location.pathname : '', '/news/') || 'Đang tải...'} | Greenia Homes`;
  const pageTitle = article
    ? resolveItemTitle(article, 'Greenia Homes')
    : fallbackTitle;

  if (loading) {
    return (
      <>
        <Helmet>
          <title>{pageTitle}</title>
        </Helmet>
        <div className="py-32 text-center space-y-4 max-w-sm mx-auto" id="news-detail-loading">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 text-xs font-light">Đang mở bài phân tích tư liệu...</p>
      </div>
      </>
    );
  }

  if (!article) return null;

  // Related articles (News share the same category, excluding active one)
  const relatedNews = allNews.filter(n => n.category === article.category && n.id !== article.id);
  // Default general articles if same category has zero entries
  const generalNewsList = relatedNews.length > 0 ? relatedNews : allNews.filter(n => n.id !== article.id);

  // Newest news titles for Sidebar Column 2
  const sidebarNewestNews = allNews.filter(n => n.id !== article.id).slice(0, 5);

  // Featured 5 products for Sidebar Column 2 (newest first)
  const sidebarFeaturedProps = [...products]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5);

  const latestSales = products
    .filter(p => p.type !== 'rent')
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    .slice(0, 5);

  const latestRents = products
    .filter(p => p.type === 'rent')
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    .slice(0, 5);

  const featuredProjectsList = [...projects]
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    .slice(0, 5);

  const articleImage = article.imageUrl || '/no-image.svg';

  const rawBaseRating = article.baseRating || 5;
  const rawBaseCount = article.baseReviewCount || 0;
  const computedTotalStars = rawBaseRating * rawBaseCount + (article.userTotalRating || 0);
  const computedTotalCount = rawBaseCount + (article.userReviewCount || 0);
  const currentAvg = computedTotalCount === 0 ? rawBaseRating : computedTotalStars / computedTotalCount;

  const schemaOrgJSONLD = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "image": [
      articleImage
    ],
    "datePublished": article.createdAt,
    "dateModified": article.createdAt,
    "author": [{
        "@type": "Person",
        "name": article.author || "Greenia Admin"
    }],
    "description": (article.description || "").replace(/<[^>]*>?/gm, '').substring(0, 160),
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": currentAvg.toFixed(1),
      "reviewCount": computedTotalCount === 0 ? 1 : computedTotalCount
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-0 space-y-12 animate-in fade-in" id="news-detail-root-container">
      <Helmet>
        <title>{resolveItemTitle(article, 'Greenia Homes')}</title>
        <meta name="description" content={article.seoDesc || (article.description || "").replace(/<[^>]*>?/gm, '').substring(0, 160)} />
        {article.seoKeywords && <meta name="keywords" content={article.seoKeywords} />}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        <meta property="og:title" content={article.seoTitle || article.title} />
        <meta property="og:description" content={article.seoDesc || (article.description || "").replace(/<[^>]*>?/gm, '').substring(0, 160)} />
        <meta property="og:image" content={articleImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify(schemaOrgJSONLD)}
        </script>
      </Helmet>
      
      <div className="mb-[35px]">
        {/* Breadcrumb row */}
        <div className="flex items-center text-xs text-slate-450 border-b border-slate-900 pb-[5px]" id="news-detail-breadcrumb">
          <div className="flex items-center gap-2 text-slate-500 font-mono">
            <button onClick={() => onNavigate({ screen: 'tin-tuc' })} className="hover:text-amber-400 truncate max-w-[100px] cursor-pointer">Tin tức</button>
            <span>/</span>
            <span className="hover:text-amber-400 truncate max-w-[150px] cursor-pointer" onClick={() => onNavigate({ screen: 'category-news', categoryName: article.category })}>{article.category}</span>
            <span>/</span>
            <span className="text-amber-400 font-bold truncate max-w-[200px]" title={article.title}>{article.title}</span>
          </div>
        </div>

        {/* Header Info Banner: Title, published date, author */}
        <div className="text-left max-w-4xl" id="news-detail-briefing">

          <h1 className="mt-[15px] mb-[10px] text-2xl sm:text-3.5xl font-display font-medium text-white tracking-tight leading-snug">
            {article.title}
          </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-mono">
          <span className="flex items-center gap-1">
            <User className="w-4 h-4 text-amber-500" />
            <span>{article.author || "Thuận Nguyễn"}</span>
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>{new Date(article.createdAt).toLocaleDateString('vi-VN')}</span>
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4 text-slate-500" />
            <span>{(article.viewsCount || 0) + (article.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 51) + 150} lượt xem</span>
          </span>
        </div>
      </div>
      </div>

      {/* Split layout in 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* CỘT 1 (Left - Content Column): Covers 8 grid widths */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Main big cover photo */}
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-slate-900 bg-slate-950">
            <img loading="eager" decoding="async" src={optimizeImageUrl() || undefined} alt={article.title} className="w-full h-full object-cover" referrerPolicy="no-referrer"
              // @ts-ignore
              fetchpriority="high" />
          </div>

          {/* HTML rendered prose */}
          <article className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-5" id="article-prose-body">
            <div dangerouslySetInnerHTML={{ __html: article.content || `<p>${article.description}</p>` }} />
          </article>

          <StarRatingInteractive
            collectionName="news"
            documentId={article.id}
            baseRating={article.baseRating || 5.0}
            baseReviewCount={article.baseReviewCount || 0}
            userTotalRating={article.userTotalRating || 0}
            userReviewCount={article.userReviewCount || 0}
          />

          {/* Related related articles widget ("Xem thêm" as title links directly inside Column 1) */}
          <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-lg space-y-4 overflow-hidden" id="article-related-links">
            <div className="border-b border-slate-900 pb-2 flex items-center justify-between">
              <h4 className="text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-amber-400" />
                <span>Tin Cùng Danh Mục</span>
              </h4>
              <button onClick={() => onNavigate({ screen: 'category-news', categoryName: article.category })} className="text-[10px] uppercase font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors">
                Xem thêm <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="relative overflow-hidden pb-4 w-full flex group">
              <div className="flex gap-4 box-border animate-marquee pr-4 flex-nowrap">
                {(() => {
                  const relatedList = generalNewsList.filter(n => n.id !== article.id && n.category === article.category).slice(0, 5);
                  
                  return relatedList.map((n, index) => (
                  <div
                    key={`${n.id}-${index}`}
                    onClick={() => onNavigate({ screen: 'news-detail', newsId: n.id, slug: generateSlug(n.title) })}
                    className="w-[280px] shrink-0 bg-slate-900/30 border border-slate-850 hover:border-amber-555 rounded-lg p-3.5 space-y-3 cursor-pointer transition-all"
                  >
                    <img loading="lazy" decoding="async" src={optimizeImageUrl() || undefined} alt={n.title} className="w-full h-40 sm:h-32 lg:h-24 object-cover rounded-lg" referrerPolicy="no-referrer" />
                    <div className="text-left space-y-1 whitespace-normal">
                      <h4 className="text-sm lg:text-xs font-semibold text-white line-clamp-2">{n.title}</h4>
                      <span className="text-[10px] lg:text-[9px] text-slate-500 font-mono block mt-1">
                        {new Date(n.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                  ));
                })()}
              </div>

              <div className="flex gap-4 box-border animate-marquee pr-4 flex-nowrap">
                {(() => {
                  const relatedList = generalNewsList.filter(n => n.id !== article.id && n.category === article.category).slice(0, 5);
                  
                  return relatedList.map((n, index) => (
                  <div
                    key={`${n.id}-dup-${index}`}
                    onClick={() => onNavigate({ screen: 'news-detail', newsId: n.id, slug: generateSlug(n.title) })}
                    className="w-[280px] shrink-0 bg-slate-900/30 border border-slate-850 hover:border-amber-555 rounded-lg p-3.5 space-y-3 cursor-pointer transition-all"
                  >
                    <img loading="lazy" decoding="async" src={optimizeImageUrl() || undefined} alt={n.title} className="w-full h-40 sm:h-32 lg:h-24 object-cover rounded-lg" referrerPolicy="no-referrer" />
                    <div className="text-left space-y-1 whitespace-normal">
                      <h4 className="text-sm lg:text-xs font-semibold text-white line-clamp-2">{n.title}</h4>
                      <span className="text-[10px] lg:text-[9px] text-slate-500 font-mono block mt-1">
                        {new Date(n.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                  ));
                })()}
              </div>
            </div>
          </div>

          <AdBanner slot="news-detail-mid" containerClassName="mt-8" />

        </div>

        {/* CỘT 2 (Right - Sidebar Column): Covers 4 grid widths */}
        <div className="lg:col-span-4 space-y-8 h-full" id="news-detail-sidebar">
          
          {/* Newest News titles */}
          <div className="bg-slate-900 border border-slate-850 p-[10px] rounded-lg space-y-4 shadow-xl">
            <h4 className="text-white text-[14px] font-bold tracking-wider pb-[5px] mb-[10px] border-b border-slate-800">
              Tin Nổi Bật
            </h4>

            <div className="space-y-3">
              {sidebarNewestNews.map((n) => (
                <div
                  key={n.id}
                  onClick={() => onNavigate({ screen: 'news-detail', newsId: n.id, slug: generateSlug(n.title) })}
                  className="flex gap-2.5 text-left group cursor-pointer border-b border-slate-950 pb-2 last:border-0 items-start"
                >
                  <img loading="lazy" decoding="async" src={optimizeImageUrl() || undefined} alt={n.title} className="w-[45px] h-[45px] object-cover rounded shrink-0" referrerPolicy="no-referrer" />
                  <div className="flex-1 space-y-0.5 mt-[-1px]">
                    <h5 className="text-[11px] font-semibold text-slate-300 group-hover:text-amber-400 leading-[14px] line-clamp-2">
                      {n.title}
                    </h5>
                    <span className="text-[9px] text-slate-500 font-mono block">
                      {new Date(n.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Product Categories (with counts) */}
          <div className="bg-slate-900 border border-slate-850 p-[10px] mb-[20px] rounded-lg space-y-4">
            <h4 className="text-white text-[14px] font-bold tracking-wider pb-[5px] border-b border-slate-800">
              Danh Mục Sản Phẩm
            </h4>

            <div className="space-y-2">
              {Object.keys(categoryCounts).length === 0 ? (
                <div className="text-slate-500 text-xs py-2 text-left">Đang đối chiếu dữ liệu danh mục...</div>
              ) : (
                Object.entries(categoryCounts).map(([catName, cnt]) => (
                  <div
                    key={catName}
                    onClick={() => onNavigate({ screen: 'san-pham' })}
                    className="flex justify-between items-center text-xs text-slate-300 hover:text-amber-400 cursor-pointer py-0 transition-colors border-b border-slate-950/40 last:border-0"
                  >
                    <span className="truncate flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-500" />
                      {catName}
                    </span>
                    <span className="bg-slate-950 px-2 py-0.5 rounded-full text-[9px] font-mono text-slate-400 font-bold">
                      ({cnt})
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Featured Products (with price, location) */}
          <div className="bg-slate-900/40 border border-slate-900 p-[10px] mb-[20px] rounded-lg space-y-4">
            <div className="border-b border-slate-900 pb-[5px] mb-[10px] flex items-center justify-between">
              <h4 className="text-white text-[14px] font-semibold tracking-wider flex items-center gap-1.5">
                <Building className="w-4 h-4 text-amber-400" />
                <span>Bất Động Sản Nổi Bật</span>
              </h4>
            </div>

            <div className="space-y-4">
              {sidebarFeaturedProps.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onNavigate({ screen: 'product-detail', productId: p.id, slug: generateSlug(p.title) })}
                  className="flex gap-3 pb-[5px] border-b border-white/5 transition-colors cursor-pointer group last:border-0"
                >
                  <div className="w-[100px] h-[85px] shrink-0 rounded overflow-hidden border border-[#232d45] relative">
                    <span className={`absolute top-0 left-0 px-[5px] py-[3px] text-[10px] font-semibold text-white z-10 rounded-br-[5px] ${p.type === 'rent' ? 'bg-emerald-700' : 'bg-rose-700'}`}>
                      {p.type === 'rent' ? 'Cho thuê' : 'Đang bán'}
                    </span>
                    <img loading="lazy" decoding="async" src={optimizeImageUrl() || undefined} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 block" referrerPolicy="no-referrer" />
                  </div>

                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <h4 className="text-[13px] font-semibold text-white leading-[1.4] m-0 mb-1.5 line-clamp-2 group-hover:text-amber-500 text-left">
                      {p.title}
                    </h4>
                    <div className="text-[11px] text-[#999] flex flex-wrap items-center gap-x-3 gap-y-1 mb-1.5">
                      {p.area && (
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 shrink-0" /> {p.area}m²
                        </span>
                      )}
                      {p.bedrooms && (
                        <span className="flex items-center gap-1">
                          <Bookmark className="w-3 h-3 shrink-0" /> {p.bedrooms} PN
                        </span>
                      )}
                      {p.toilets && (
                        <span className="flex items-center gap-1">
                          <Bath className="w-3 h-3 shrink-0" /> {p.toilets} WC
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center w-full mb-1.5">
                      <span className="text-amber-500 font-bold text-[12px]">{p.priceText}</span>
                    </div>
                    <div className="text-[11px] text-[#999] flex items-center gap-1 min-w-0">
                      <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="truncate">{p.district || p.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Yêu cầu tư vấn Form widget */}
          <div className="bg-slate-900 border border-slate-850 px-[15px] pt-[15px] pb-[15px] rounded-lg space-y-4 shadow-xl sticky top-[15px]">
            <h4 className="text-white text-[14px] font-bold tracking-wider pb-[5px] mb-[15px] border-b border-slate-800">
              Liên Hệ Chuyên Viên Tư Vấn
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Bạn quan tâm đến các dự án bất động sản được nhắc đến trong bài viết? Đăng ký đặt lịch hẹn tham quan thực tế cùng đại sư Greenia.
            </p>

            {formSubmitted ? (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-center space-y-2 animate-in zoom-in">
                <CheckCircle2 className="w-7 h-7 text-amber-500 mx-auto" />
                <h5 className="font-semibold text-white text-xs">Phê duyệt lịch hẹn!</h5>
                <p className="text-[10px] text-slate-300">Nhân sự chăm sóc khách hàng Greenia Homes sẽ gọi ngay đến quý khách hàng.</p>
              </div>
            ) : (
              <form onSubmit={handleSidebarConsultSubmit} className="space-y-4 h-[265px]">
                <div className="space-y-1">
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Họ &amp; tên"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs pt-[10px] pb-[10px] px-3 rounded-lg outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="SĐT"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs py-2.5 px-3 rounded-lg outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs py-2.5 px-3 rounded-lg outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <input
                    type="text"
                    value={clientDemand}
                    onChange={(e) => setClientDemand(e.target.value)}
                    placeholder="Nhu cầu"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-[11px] leading-[12px] py-2.5 px-3 rounded-lg outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-amber-500 text-slate-950 font-bold py-3 rounded-lg text-xs uppercase tracking-wider cursor-pointer"
                >
                  {isSubmitting ? 'ĐANG GỬI...' : 'ĐĂNG KÝ TƯ VẤN'}
                </button>
              </form>
            )}
          </div>



        </div>

      </div>

      {/* Under columns: Same category articles in 5 columns with see more */}
      <section className="space-y-6 pt-8 border-t border-slate-900" id="same-category-slide-section">
        <div className="text-left">
          <h2 className="text-[15px] font-display font-medium text-white border-l-4 border-amber-500 pl-3">Có thể Bạn Quan Tâm</h2>
          <p className="text-slate-500 text-xs font-light mt-1 pl-3">Tuyển chọn các bài tin tức kiến giải tương tự, giúp quý khách thấu đáo các chuẩn đầu tư.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {(() => {
            const relatedPosts = generalNewsList.filter(n => n.id !== article.id && n.category === article.category);
            const visibleRelatedCount = seeMoreClicks === 0 ? 5 : 10;
            const displayedPosts = relatedPosts.slice(0, visibleRelatedCount);
            
            return displayedPosts.map((n) => (
              <div
                key={n.id}
                onClick={() => onNavigate({ screen: 'news-detail', newsId: n.id, slug: generateSlug(n.title) })}
                className="w-full bg-slate-900/30 border border-slate-850 hover:border-amber-555 rounded-lg p-3.5 space-y-3 cursor-pointer transition-all"
              >
                <img loading="lazy" decoding="async" src={optimizeImageUrl() || undefined} alt={n.title} className="w-full h-40 sm:h-32 lg:h-24 object-cover rounded-lg" referrerPolicy="no-referrer" />
                <div className="text-left space-y-1">
                  <h4 className="text-sm lg:text-xs font-semibold text-white line-clamp-2">{n.title}</h4>
                  <span className="text-[10px] lg:text-[9px] text-slate-500 font-mono block mt-1">
                    {new Date(n.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
            ));
          })()}
        </div>

        <div className="flex justify-center pt-2">
          <button
            onClick={() => {
              const relatedPosts = generalNewsList.filter(n => n.id !== article.id && n.category === article.category);
              if (seeMoreClicks === 0 && relatedPosts.length > 5) {
                setSeeMoreClicks(1);
              } else {
                onNavigate({ screen: 'tin-tuc' });
              }
            }}
            className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-xs font-semibold text-amber-400 px-6 py-2.5 rounded-full cursor-pointer transition-all"
          >
            <span>{seeMoreClicks === 0 ? 'Xem thêm bài viết' : 'Về trang chủ chuyên mục tin'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Latest Sales */}
      {latestSales.length > 0 && (
        <section className="space-y-6 pt-8 border-t border-slate-900 text-left">
          <h2 className="text-[15px] font-display font-medium text-white border-l-4 border-amber-500 pl-3">Tin Bán mới nhất</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {latestSales.map((item) => (
              <div key={item.id} className="w-full">
                <ProductCard item={item} onNavigate={onNavigate} badgeText="Bán" badgeColor="bg-rose-700 text-white" />
              </div>
            ))}
          </div>
          
          <div className="flex w-full justify-center border-t border-slate-800/50 pt-8 mt-4">
            <button onClick={() => onNavigate({ screen: 'latest-sales' })} className="bg-transparent border border-amber-500 text-amber-500 hover:bg-amber-500/10 text-[10px] font-semibold px-[10px] pb-[5px] pt-[9px] rounded-lg cursor-pointer transition-colors">
              Xem tất cả BĐS Bán
            </button>
          </div>
        </section>
      )}

      {/* Latest Rents */}
      {latestRents.length > 0 && (
        <section className="space-y-6 pt-8 border-t border-slate-900 text-left">
          <h2 className="text-[15px] font-display font-medium text-white border-l-4 border-amber-500 pl-3">Tin Cho thuê mới nhất</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {latestRents.map((item) => (
              <div key={item.id} className="w-full">
                <ProductCard item={item} onNavigate={onNavigate} badgeText="Cho thuê" badgeColor="bg-emerald-700 text-white" />
              </div>
            ))}
          </div>
          
          <div className="flex w-full justify-center border-t border-slate-800/50 pt-8 mt-4">
            <button onClick={() => onNavigate({ screen: 'latest-rents' })} className="bg-transparent border border-amber-500 text-amber-500 hover:bg-amber-500/10 text-[10px] font-sans font-semibold px-[10px] py-[5px] rounded-lg cursor-pointer transition-colors">
              Xem tất cả BĐS Cho thuê
            </button>
          </div>
        </section>
      )}

      {/* Featured Projects */}
      {featuredProjectsList.length > 0 && (
        <section className="space-y-6 pt-8 border-t border-slate-900 text-left pb-0">
          <div className="flex items-end justify-between pb-2">
            <h2 className="text-[15px] font-display font-medium text-white border-l-4 border-amber-500 pl-3">Dự án nổi bật</h2>
            <button
              type="button"
              onClick={() => onNavigate({ screen: 'du-an' })}
              className="flex items-center gap-1.5 text-[9px] uppercase font-mono tracking-widest text-amber-400 font-bold hover:underline bg-transparent border-none cursor-pointer"
            >
              <span>Xem thêm →</span>
            </button>
          </div>

          <div className="relative overflow-x-auto pb-4 scrollbar-thin scroll-smooth snap-x snap-mandatory">
            <div className="flex gap-5 box-border w-max lg:w-full">
              {featuredProjectsList.slice(0, 4).map((p) => {
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
