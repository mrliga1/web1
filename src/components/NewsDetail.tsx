import React, { useState, useEffect } from 'react';
import { optimizeImageUrl, generateSlug, generateSrcSet } from '../lib/utils';
import { doc, getDoc, collection, getDocs, addDoc, db, updateDoc } from '../firebase';
import { News, Product, Project, RouteState } from '../types';
import { ChevronLeft, Calendar, User, Eye, CheckCircle2, Bookmark, ArrowRight, ShieldCheck, Tag, Building, Maximize, BedDouble, MapPin, Layers, Bath, Building2, Phone } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { parseSlugTitleFromPath, resolveItemTitle } from '../lib/documentHead';
import AdBanner from './AdBanner';
import ProductCard from './ProductCard';
import StarRatingInteractive from './StarRatingInteractive';
import { useScrollDirection } from '../hooks/useScrollDirection';

interface NewsDetailProps {
  newsId: string;
  slug?: string;
  onNavigate: (route: RouteState) => void;
  onShowNotification: (message: string, type: 'success' | 'error') => void;
}

import { notifyAdminEmail } from '../lib/email';
import { fetchClientIp } from '../lib/ip';

export default function NewsDetail({ newsId, slug, onNavigate, onShowNotification }: NewsDetailProps) {
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
  const scrollDirection = useScrollDirection();

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
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [agreePrivacy, setAgreePrivacy] = useState(true);

  useEffect(() => {
    async function loadArticleData() {
      try {
        if (!article) setLoading(true);

        let fetchedArticle: News | null = article;
        let finalNewsId = newsId;

        if (finalNewsId) {
          const docRef = doc(db, 'news', finalNewsId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            fetchedArticle = { id: docSnap.id, ...docSnap.data() } as News;
          }
        } else if (slug) {
          const newsCol = collection(db, 'news');
          const newsSnap = await getDocs(newsCol);
          for (const doc of newsSnap.docs) {
            const data = doc.data();
            if (generateSlug(data.title) === slug) {
              fetchedArticle = { id: doc.id, ...data } as News;
              finalNewsId = doc.id;
              break;
            }
          }
        }

        if (fetchedArticle) {
          if (!sessionStorage.getItem(`viewed_news_${fetchedArticle.id}`)) {
            const newCount = (fetchedArticle.viewsCount || 0) + 1;
            fetchedArticle.viewsCount = newCount;
            updateDoc(doc(db, 'news', fetchedArticle.id), { viewsCount: newCount }).catch(console.error);
            sessionStorage.setItem(`viewed_news_${fetchedArticle.id}`, 'true');
          }
          setArticle({...fetchedArticle});
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
  }, [newsId, slug]);

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
        propertyId: article?.id || newsId || slug || 'unknown',
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

  const pageTitle = article
    ? resolveItemTitle(article, 'Greenia Homes')
    : "Đang tải... | Greenia Homes";


  if (loading) {
    return (
      <>
        <div className="py-32 text-center space-y-4 max-w-sm mx-auto" id="news-detail-loading">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-text-secondary text-xs font-light">Đang mở bài phân tích tư liệu...</p>
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
        <title>{pageTitle}</title>
        <meta name="description" content={article.seoDesc || (article.description || "").replace(/<[^>]*>?/gm, '').substring(0, 160)} />
        {article.seoKeywords && <meta name="keywords" content={article.seoKeywords} />}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        <meta property="og:title" content={article.seoTitle || article.title} />
        <meta property="og:description" content={article.seoDesc || (article.description || "").replace(/<[^>]*>?/gm, '').substring(0, 160)} />
        <meta property="og:image" content={articleImage?.startsWith('http') ? articleImage : `https://greeniahomes.vn${articleImage?.startsWith('/') ? articleImage : `/${articleImage}`}`} />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content={article.seoTitle || article.title} />
        <meta property="twitter:description" content={article.seoDesc || (article.description || "").replace(/<[^>]*>?/gm, '').substring(0, 160)} />
        <meta property="twitter:image" content={articleImage?.startsWith('http') ? articleImage : `https://greeniahomes.vn${articleImage?.startsWith('/') ? articleImage : `/${articleImage}`}`} />

        {/* Geo Meta Tags for Local SEO - Ho Chi Minh City */}
        <meta name="geo.region" content="VN-SG" />
        <meta name="geo.placename" content="Hồ Chí Minh, Việt Nam" />
        <meta name="geo.position" content="10.823099;106.629664" />
        <meta name="ICBM" content="10.823099, 106.629664" />
        <script type="application/ld+json">
          {JSON.stringify(schemaOrgJSONLD)}
        </script>
      </Helmet>
      
      <div className="mb-[35px]">
        {/* Breadcrumb row */}
        <div className="flex items-center text-xs text-text-secondary border-b border-border-color pb-[5px]" id="news-detail-breadcrumb">
          <div className="flex items-center gap-2 text-text-secondary font-mono">
            <button onClick={() => onNavigate({ screen: 'tin-tuc' })} className="hover:text-primary truncate max-w-[100px] cursor-pointer">Tin tức</button>
            <span>/</span>
            <span className="hover:text-primary truncate max-w-[150px] cursor-pointer" onClick={() => onNavigate({ screen: 'category-news', categoryName: article.category })}>{article.category}</span>
            <span>/</span>
            <span className="text-primary font-bold truncate max-w-[200px]" title={article.title}>{article.title}</span>
          </div>
        </div>

        {/* Header Info Banner: Title, published date, author */}
        <div className="text-left max-w-4xl" id="news-detail-briefing">

          <h1 className="mt-[15px] mb-[10px] text-2xl sm:text-3.5xl font-display font-medium text-text-primary tracking-tight leading-snug">
            {article.title}
          </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary font-mono">
          <span className="flex items-center gap-1">
            <User className="w-4 h-4 text-primary" />
            <span>{article.author || "Thuận Nguyễn"}</span>
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-primary" />
            <span>{new Date(article.createdAt).toLocaleDateString('vi-VN')}</span>
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4 text-primary" />
            <span>{(article.viewsCount || 0)} lượt xem</span>
          </span>
        </div>
      </div>
      </div>

      {/* Split layout in 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* CỘT 1 (Left - Content Column): Covers 8 grid widths */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Main big cover photo */}
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border-color bg-bg-surface">
            <img loading="eager" decoding="async" src={article.imageUrl ? optimizeImageUrl(article.imageUrl, 800) : undefined} srcSet={article.imageUrl ? generateSrcSet(article.imageUrl) : undefined} sizes="(max-width: 1024px) 100vw, 800px" alt={article.title} className="w-full h-full object-cover" referrerPolicy="no-referrer"
              // @ts-ignore
              fetchpriority="high" />
          </div>

          {/* HTML rendered prose */}
          <article className="prose prose-invert max-w-none text-text-secondary text-sm leading-relaxed space-y-5" id="article-prose-body">
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
          <div className="bg-bg-surface/40 border border-border-color p-6 rounded-lg space-y-4 overflow-hidden" id="article-related-links">
            <div className="border-b border-border-color pb-2 flex items-center justify-between">
              <h4 className="text-text-primary text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-primary" />
                <span>Tin Cùng Danh Mục</span>
              </h4>
              <button onClick={() => onNavigate({ screen: 'category-news', categoryName: article.category })} className="text-[10px] uppercase font-bold text-primary hover:text-amber-300 flex items-center gap-1 transition-colors">
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
                    className="w-[280px] shrink-0 bg-bg-surface/30 border border-border-color hover:border-amber-555 rounded-lg p-3.5 space-y-3 cursor-pointer transition-all"
                  >
                    <img loading="lazy" decoding="async" src={optimizeImageUrl(n.imageUrl, 400) || undefined} alt={n.title} className="w-full h-40 sm:h-32 lg:h-24 object-cover rounded-lg" referrerPolicy="no-referrer" />
                    <div className="text-left space-y-1 whitespace-normal">
                      <h4 className="text-sm lg:text-xs font-semibold text-text-primary line-clamp-2">{n.title}</h4>
                      <span className="text-[10px] lg:text-[9px] text-white/70 font-mono block mt-1">
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
                    className="w-[280px] shrink-0 bg-bg-surface/30 border border-border-color hover:border-amber-555 rounded-lg p-3.5 space-y-3 cursor-pointer transition-all"
                  >
                    <img loading="lazy" decoding="async" src={optimizeImageUrl(n.imageUrl, 400) || undefined} alt={n.title} className="w-full h-40 sm:h-32 lg:h-24 object-cover rounded-lg" referrerPolicy="no-referrer" />
                    <div className="text-left space-y-1 whitespace-normal">
                      <h4 className="text-sm lg:text-xs font-semibold text-text-primary line-clamp-2">{n.title}</h4>
                      <span className="text-[10px] lg:text-[9px] text-white/70 font-mono block mt-1">
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
          <div className="bg-bg-surface border border-border-color p-[10px] rounded-lg space-y-4 shadow-xl">
            <h4 className="text-text-primary text-[14px] font-bold tracking-wider pb-[5px] mb-[10px] border-b border-border-color">
              Tin Nổi Bật
            </h4>

            <div className="space-y-3">
              {sidebarNewestNews.map((n) => (
                <div
                  key={n.id}
                  onClick={() => onNavigate({ screen: 'news-detail', newsId: n.id, slug: generateSlug(n.title) })}
                  className="flex gap-2.5 text-left group cursor-pointer border-b border-black pb-2 last:border-0 items-start"
                >
                  <img loading="lazy" decoding="async" src={optimizeImageUrl(n.imageUrl, 400) || undefined} alt={n.title} className="w-[45px] h-[45px] object-cover rounded shrink-0" referrerPolicy="no-referrer" />
                  <div className="flex-1 space-y-0.5 mt-[-1px]">
                    <h5 className="text-[11px] font-semibold text-text-secondary group-hover:text-primary leading-[14px] line-clamp-2">
                      {n.title}
                    </h5>
                    <span className="text-[9px] text-white/70 font-mono block">
                      {new Date(n.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Product Categories (with counts) */}
          <div className="bg-bg-surface border border-border-color p-[10px] mb-[20px] rounded-lg space-y-4">
            <h4 className="text-text-primary text-[14px] font-bold tracking-wider pb-[5px] border-b border-border-color">
              Danh Mục Sản Phẩm
            </h4>

            <div className="space-y-2">
              {Object.keys(categoryCounts).length === 0 ? (
                <div className="text-white/70 text-xs py-2 text-left">Đang đối chiếu dữ liệu danh mục...</div>
              ) : (
                Object.entries(categoryCounts).map(([catName, cnt]) => (
                  <div
                    key={catName}
                    onClick={() => onNavigate({ screen: 'category-product', categoryName: catName })}
                    className="flex justify-between items-center text-xs text-text-secondary hover:text-primary cursor-pointer py-0 transition-colors border-b border-black/40 last:border-0"
                  >
                    <span className="truncate flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-primary" />
                      {catName}
                    </span>
                    <span className="bg-bg-surface px-2 py-0.5 rounded-full text-[9px] font-mono text-text-secondary font-bold">
                      ({cnt})
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Featured Products (with price, location) */}
          <div className="bg-bg-surface/40 border border-border-color p-[10px] mb-[20px] rounded-lg space-y-4">
            <div className="border-b border-border-color pb-[5px] mb-[10px] flex items-center justify-between">
              <h4 className="text-text-primary text-[14px] font-semibold tracking-wider flex items-center gap-1.5">
                <Building className="w-4 h-4 text-primary" />
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
                  <div className="w-[100px] h-[85px] shrink-0 rounded overflow-hidden border border-border-color relative">
                    <span className={`absolute top-0 left-0 px-[5px] py-[3px] text-[10px] font-semibold text-white z-10 rounded-br-[5px] ${p.type === 'rent' ? 'bg-primary' : 'bg-rose-700'}`}>
                      {p.type === 'rent' ? 'Cho thuê' : 'Bán'}
                    </span>
                    <img loading="lazy" decoding="async" src={optimizeImageUrl(p.imageUrl || (p.imageUrls && p.imageUrls[0]), 400) || undefined} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 block" referrerPolicy="no-referrer" />
                  </div>

                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <h4 className="text-[13px] font-semibold text-text-primary leading-[1.4] m-0 mb-1.5 line-clamp-2 group-hover:text-primary text-left">
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
                      <span className="text-primary font-bold text-[12px]">{p.priceText}</span>
                    </div>
                    <div className="text-[11px] text-[#999] flex items-center gap-1 min-w-0">
                      <MapPin className="w-3 h-3 text-primary shrink-0" />
                      <span className="truncate">{p.district || p.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Yêu cầu tư vấn Form widget */}
          <div className={`bg-bg-surface border border-border-color px-[16px] py-[8px] rounded-xl space-y-2 shadow-xl sticky ${scrollDirection === 'down' ? 'top-[15px]' : 'top-[55px]'} transition-colors duration-300 text-left`}>
            <div className="text-center space-y-1 pb-[2px]">
              <h3 className="text-text-primary font-display font-bold text-base tracking-wide mt-[2px]">
                Tư vấn mua nhà chuyên sâu
              </h3>
              <p className="text-[11px] text-text-secondary pb-[2px]">
                Chuyên viên Greenia Homes hỗ trợ 24/7
              </p>
              <hr className="border-border-color/50 w-[70%] mx-auto mt-1" />
            </div>

            <div className="space-y-1 mb-[2px]">
              <div className="flex items-start gap-2 pt-[2px] mb-[2px]">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-text-secondary leading-tight">
                  <span className="font-semibold text-text-primary">Phân tích</span> quỹ căn, chính sách, tiện ích giúp Khách hàng lựa chọn căn <span className="font-semibold text-primary">tốt nhất.</span>
                </p>
              </div>
              <div className="flex items-start gap-2 mb-[2px]">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-text-secondary leading-tight">
                  <span className="font-semibold text-text-primary">Giải đáp mọi thắc mắc</span> của khách hàng nhanh chóng.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-text-secondary leading-tight">
                  <span className="font-semibold text-text-primary">Tuyệt đối bảo mật</span> thông tin cá nhân.
                </p>
              </div>
            </div>

            {formSubmitted ? (
              <div className="bg-accent/10 text-emerald-400 border border-primary/20 rounded-xl p-5 text-center space-y-3 animate-in zoom-in-95">
                <div className="w-12 h-12 rounded-full border-2 border-primary/30 flex items-center justify-center mx-auto bg-accent/10 text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="font-medium text-[15px] text-text-primary">Đăng ký thành công!</h5>
                  <p className="text-[11px] text-emerald-200/70 mt-1.5 leading-relaxed">
                    Chuyên viên của chúng tôi sẽ gọi lại cho bạn theo số {clientPhone} trong ít phút nữa.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSidebarConsultSubmit} className="space-y-2 pt-[5px] mt-1">
                <div className="space-y-1 text-left">
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Họ tên *"
                    className="w-full bg-bg-surface border border-border-color text-text-primary text-[13px] py-2 px-3.5 rounded-[10px] outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1 text-left">
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="Số điện thoại *"
                    className="w-full bg-bg-surface border border-border-color text-text-primary text-[13px] py-2 px-3.5 rounded-[10px] outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1 text-left">
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="Email (Tùy chọn)"
                    className="w-full bg-bg-surface border border-border-color text-text-primary text-[13px] py-2 px-3.5 rounded-[10px] outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <textarea
                    value={clientDemand}
                    onChange={(e) => setClientDemand(e.target.value)}
                    placeholder="Nhu cầu của bạn (Tùy chọn)"
                    rows={3}
                    className="w-full bg-bg-surface border border-border-color text-text-primary text-[13px] py-2 px-3.5 rounded-[10px] outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
                  />
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 rounded border-border-inverse bg-bg-surface text-primary focus:ring-transparent h-3.5 w-3.5 cursor-pointer"
                    />
                    <span className="text-[10px] text-text-secondary leading-snug group-hover:text-text-secondary">
                      Tôi đã đọc và đồng ý với <button type="button" onClick={() => onNavigate({ screen: "terms-of-use" })} className="underline text-primary hover:text-primary">Điều khoản & Điều kiện</button> của Greenia Market.
                    </span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={agreePrivacy}
                      onChange={(e) => setAgreePrivacy(e.target.checked)}
                      className="mt-0.5 rounded border-border-inverse bg-bg-surface text-primary focus:ring-transparent h-3.5 w-3.5 cursor-pointer"
                    />
                    <span className="text-[10px] text-text-secondary leading-snug group-hover:text-text-secondary">
                      Tôi đã đọc và đồng ý với <button type="button" onClick={() => onNavigate({ screen: "privacy-policy" })} className="underline text-primary hover:text-primary">Chính sách bảo mật dữ liệu cá nhân</button> của Greenia Market.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !agreeTerms || !agreePrivacy}
                  className="w-full py-2.5 rounded-[10px] font-bold bg-primary text-white hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[13px] mt-2 shadow-lg shadow-emerald-500/30 text-center"
                >
                  {isSubmitting ? 'Đang gửi thông tin...' : 'Nhận tư vấn ngay'}
                </button>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href="tel:0932966700"
                    className="flex flex-col items-center justify-center gap-0.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 rounded-lg py-1 transition-colors cursor-pointer text-center"
                  >
                    <Phone className="w-3 h-3" />
                    <span className="text-[10px] font-medium">
                      Gọi trực tiếp
                    </span>
                  </a>
                  <a 
                    href="https://zalo.me/0932966700"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-600 hover:bg-blue-500/20 rounded-lg py-1 transition-colors cursor-pointer text-center"
                  >
                    <img loading="lazy" decoding="async" src="/zalo-icon.svg" alt="Zalo" className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-medium">
                      Chat qua Zalo
                    </span>
                  </a>
                </div>
              </form>
            )}
          </div>



        </div>

      </div>

      {/* Under columns: Same category articles in 5 columns with see more */}
      <section className="space-y-6 pt-8 border-t border-border-color" id="same-category-slide-section">
        <div className="text-left">
          <h2 className="text-[15px] font-display font-medium text-text-primary border-l-4 border-primary pl-3">Có thể Bạn Quan Tâm</h2>
          <p className="text-white/70 text-xs font-light mt-1 pl-3">Tuyển chọn các bài tin tức kiến giải tương tự, giúp quý khách thấu đáo các chuẩn đầu tư.</p>
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
                className="w-full bg-bg-surface/30 border border-border-color hover:border-amber-555 rounded-lg p-3.5 space-y-3 cursor-pointer transition-all"
              >
                <img loading="lazy" decoding="async" src={optimizeImageUrl(n.imageUrl, 400) || undefined} alt={n.title} className="w-full h-40 sm:h-32 lg:h-24 object-cover rounded-lg" referrerPolicy="no-referrer" />
                <div className="text-left space-y-1">
                  <h4 className="text-sm lg:text-xs font-semibold text-text-primary line-clamp-2">{n.title}</h4>
                  <span className="text-[10px] lg:text-[9px] text-white/70 font-mono block mt-1">
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
            className="inline-flex items-center gap-2 bg-bg-surface border border-border-color hover:border-primary/50 text-xs font-semibold text-primary px-6 py-2.5 rounded-full cursor-pointer transition-all"
          >
            <span>{seeMoreClicks === 0 ? 'Xem thêm bài viết' : 'Về trang chủ chuyên mục tin'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Latest Sales */}
      {latestSales.length > 0 && (
        <section className="space-y-6 pt-8 border-t border-border-color text-left">
          <h2 className="text-[15px] font-display font-medium text-text-primary border-l-4 border-primary pl-3">Tin Bán mới nhất</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {latestSales.map((item) => (
              <div key={item.id} className="w-full">
                <ProductCard item={item} onNavigate={onNavigate} />
              </div>
            ))}
          </div>
          
          <div className="flex w-full justify-center border-t border-border-color/50 pt-8 mt-4">
            <button onClick={() => onNavigate({ screen: 'latest-sales' })} className="bg-transparent border border-primary text-primary hover:bg-[#064E3B]/10 text-[10px] font-semibold px-[10px] pb-[5px] pt-[9px] rounded-lg cursor-pointer transition-colors">
              Xem tất cả BĐS Bán
            </button>
          </div>
        </section>
      )}

      {/* Latest Rents */}
      {latestRents.length > 0 && (
        <section className="space-y-6 pt-8 border-t border-border-color text-left">
          <h2 className="text-[15px] font-display font-medium text-text-primary border-l-4 border-primary pl-3">Tin Cho thuê mới nhất</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {latestRents.map((item) => (
              <div key={item.id} className="w-full">
                <ProductCard item={item} onNavigate={onNavigate} />
              </div>
            ))}
          </div>
          
          <div className="flex w-full justify-center border-t border-border-color/50 pt-8 mt-4">
            <button onClick={() => onNavigate({ screen: 'latest-rents' })} className="bg-transparent border border-primary text-primary hover:bg-[#064E3B]/10 text-[10px] font-sans font-semibold px-[10px] py-[5px] rounded-lg cursor-pointer transition-colors">
              Xem tất cả BĐS Cho thuê
            </button>
          </div>
        </section>
      )}

      {/* Featured Projects */}
      {featuredProjectsList.length > 0 && (
        <section className="space-y-6 pt-8 border-t border-border-color text-left pb-0">
          <div className="flex items-end justify-between pb-2">
            <h2 className="text-[15px] font-display font-medium text-text-primary border-l-4 border-primary pl-3">Dự án nổi bật</h2>
            <button
              type="button"
              onClick={() => onNavigate({ screen: 'du-an' })}
              className="flex items-center gap-1.5 text-[9px] uppercase font-mono tracking-widest text-primary font-bold hover:underline bg-transparent border-none cursor-pointer"
            >
              <span>Xem thêm →</span>
            </button>
          </div>

          <div className="relative overflow-hidden py-4 w-full">
            <style>{`
              @keyframes sliderScrollNewsDetail {
                0% { transform: translateX(0); }
                100% { transform: translateX(calc(-16.666666%)); }
              }
              .animate-news-detail-slider {
                animation: sliderScrollNewsDetail 15s linear infinite;
              }
              .animate-news-detail-sliding-container:hover .animate-news-detail-slider {
                animation-play-state: paused;
              }
            `}</style>
            <div className="animate-news-detail-sliding-container flex w-max">
              <div className="flex w-max animate-news-detail-slider">
                {[...Array(6)].flatMap(() => featuredProjectsList.slice(0, 5)).map((p, idx) => {
                  let statusText = 'Đang mở bán';
                  if (p.status === 'handed_over') statusText = 'Đã bàn giao';
                  if (p.status === 'coming_soon') statusText = 'Sắp ra mắt';

                  return (
                    <div
                      key={`${p.id}-${idx}`}
                      onClick={() => onNavigate({ screen: 'project-detail', projectId: p.id, slug: generateSlug(p.title) })}
                      className="w-[260px] sm:w-[280px] md:w-[240px] lg:w-[223px] shrink-0 mr-4 lg:mr-5 bg-bg-surface border border-primary/20 rounded-xl overflow-hidden flex flex-col h-full transition-all duration-300 hover:scale-[1.01] hover:border-emerald-500/30 hover:shadow-md cursor-pointer no-underline group shadow-sm justify-between"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <img loading="lazy" decoding="async"
                          src={optimizeImageUrl(p.imageUrl || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800", 400) || undefined}
                          alt={p.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 block"
                          onError={(e) => { e.currentTarget.onerror = null; (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400?text=Greenia+Homes'; }}
                        />
                        <div className="absolute top-2 left-2 px-2.5 py-1 bg-[#0f9b0f] text-white text-[11px] font-bold rounded shadow-sm z-10">
                          {statusText}
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between text-left">
                        <div>
                          <h4 className="text-[13px] sm:text-[15px] font-bold text-text-primary mb-2 line-clamp-2 transition-colors group-hover:text-primary w-full text-left">
                            {p.title}
                          </h4>
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
