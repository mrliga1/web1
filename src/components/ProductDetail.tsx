import React, { useState, useEffect } from "react";
import { generateSlug } from "../lib/utils";
import { doc, getDoc, collection, getDocs, addDoc, db } from "../firebase";
import { handleFirestoreError, OperationType } from "../firebase-errors";
import { Product, Project, RouteState } from "../types";
import {
  MapPin,
  Phone,
  Building2,
  ChevronLeft,
  ArrowRight,
  Share2,
  Heart,
  CheckCircle2,
  Shield,
  Compass,
  Tag,
  Layers,
  Bookmark,
  Sparkles,
  MessageCircle,
  Bath,
  Facebook,
  Link as LinkIcon,
} from "lucide-react";
import { optimizeImageUrl } from '../lib/utils';
import { Helmet } from "react-helmet-async";
import { parseSlugTitleFromPath, resolveItemTitle } from "../lib/documentHead";
import AdBanner from "./AdBanner";
import ProductCard from "./ProductCard";
import StarRatingInteractive from "./StarRatingInteractive";

interface ProductDetailProps {
  productId: string;
  onNavigate: (route: RouteState) => void;
  onShowNotification: (message: string, type: "success" | "error") => void;
  logoUrl?: string;
}

const MapViewer = React.memo(
  ({ mapHtml, address }: { mapHtml?: string; address?: string }) => {
    if (
      mapHtml &&
      (mapHtml.startsWith("<iframe") || mapHtml.includes("google.com/maps"))
    ) {
      return (
        <div
          className="w-full h-[300px] rounded-lg overflow-hidden border border-slate-800 shadow-inner bg-slate-950 [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0"
          dangerouslySetInnerHTML={{
            __html: mapHtml.includes("iframe")
              ? mapHtml
              : `<iframe src="${mapHtml}" width="100%" height="100%" style="border:0;" allowfullscreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>`,
          }}
        />
      );
    }

    const query = encodeURIComponent(address || "Hồ Chí Minh, Việt Nam");
    return (
      <div className="w-full h-[300px] rounded-lg overflow-hidden border border-slate-800 shadow-inner bg-slate-950">
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://maps.google.com/maps?q=${query}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
        ></iframe>
      </div>
    );
  },
);

import { notifyAdminEmail } from "../lib/email";
import { fetchClientIp } from "../lib/ip";

declare global {
  interface Window {
    __SERVER_DATA__?: any;
  }
}

export default function ProductDetail({
  productId,
  onNavigate,
  onShowNotification,
  logoUrl,
}: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(() => {
    if (
      typeof window !== "undefined" &&
      window.__SERVER_DATA__?.product?.id === productId
    ) {
      return window.__SERVER_DATA__.product;
    }
    return null;
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [productCategoriesExt, setProductCategoriesExt] = useState<any[]>([]);
  const [loading, setLoading] = useState(!product);

  // Left column variables
  const [selectedImage, setSelectedImage] = useState(() => {
    if (
      typeof window !== "undefined" &&
      window.__SERVER_DATA__?.product?.id === productId
    ) {
      return window.__SERVER_DATA__.product.imageUrl || "";
    }
    return "";
  });
  const [activeTab, setActiveTab] = useState<"desc" | "map">("desc");
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);

  // Auto-scroll main image slider
  useEffect(() => {
    if (!product || isAutoplayPaused) return;
    const sampleThumbs = [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1600607687931-cece5ce21408?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
    ];
    const imgs =
      product.imageUrls && product.imageUrls.length > 0
        ? product.imageUrls
        : [product.imageUrl || sampleThumbs[0], ...sampleThumbs.slice(1)];

    if (imgs.length <= 1) return;

    const timer = setInterval(() => {
      setSelectedImage((prev) => {
        const idx = imgs.indexOf(prev);
        if (idx === -1) return imgs[0];
        return imgs[(idx + 1) % imgs.length];
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [product, isAutoplayPaused]);

  // Booking Consultation form state
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientDemand, setClientDemand] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [agreePrivacy, setAgreePrivacy] = useState(true);

  // AJAX loading limit for recently viewed history below
  const [recentGridLimit, setRecentGridLimit] = useState(10);

  // Sample thumbs gallery images for rich visual slider experience
  const sampleThumbs = [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800",
  ];

  useEffect(() => {
    async function loadProductData() {
      if (!productId) return;
      try {
        if (!product) setLoading(true);

        // 1. Fetch single active product
        const docRef = doc(db, "products", productId);
        const docSnap = await getDoc(docRef);

        // Fetch categories config
        const genSnap = await getDoc(doc(db, "settings", "general"));
        if (genSnap.exists() && genSnap.data().productCategoriesExt) {
          setProductCategoriesExt(genSnap.data().productCategoriesExt);
        }

        let activeProd: Product | null = product;
        if (docSnap.exists()) {
          activeProd = { id: docSnap.id, ...docSnap.data() } as Product;
          setProduct(activeProd);
          if (!selectedImage)
            setSelectedImage(activeProd.imageUrl || sampleThumbs[0]);
        } else {
          setLoading(false);
          onShowNotification(
            "Sản phẩm không có hoặc đã bị gỡ xuống khỏi hệ thống.",
            "error",
          );
          onNavigate({ screen: "san-pham" });
          return;
        }

        // 2. Fetch all products for matching and category counters
        const prodCol = collection(db, "products");
        const prodSnap = await getDocs(prodCol);
        const allProds: Product[] = [];
        prodSnap.forEach((doc) => {
          const data = doc.data();
          if (!data.approvalStatus || data.approvalStatus === "approved") {
            allProds.push({ id: doc.id, ...data } as Product);
          }
        });
        setProducts(allProds);

        // 3. Fetch Projects
        const projCol = collection(db, "projects");
        const projSnap = await getDocs(projCol);
        const projList: Project[] = [];
        projSnap.forEach((doc) => {
          projList.push({ id: doc.id, ...doc.data() } as Project);
        });
        setProjects(projList);

        // 4. Save viewed ID to localStorage History
        const viewedIds: string[] = JSON.parse(
          localStorage.getItem("recentlyViewed") || "[]",
        );
        const updatedList = viewedIds.filter((id) => id !== productId);
        updatedList.unshift(productId);
        localStorage.setItem(
          "recentlyViewed",
          JSON.stringify(updatedList.slice(0, 30)),
        );

        // Retrieve full items for recently viewed
        const historyList = allProds.filter((p) => updatedList.includes(p.id));
        historyList.sort(
          (a, b) => updatedList.indexOf(a.id) - updatedList.indexOf(b.id),
        );
        setRecentlyViewed(historyList);
      } catch (err) {
        console.error("Lỗi khi tải chi tiết sản phẩm:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProductData();
  }, [productId]);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      onShowNotification("Vui lòng cung cấp cả họ tên và số liên hệ.", "error");
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

      await addDoc(collection(db, "consultations"), {
        name: clientName.trim(),
        phone: clientPhone.trim(),
        email: clientEmail.trim(),
        message: clientDemand.trim(),
        createdAt: new Date().toISOString(),
        status: "pending",
        propertyId: productId,
        propertyTitle: `Đăng ký xem căn hộ: ${product?.title}`,
        sourceUrl: friendlyUrl,
        ipAddress: clientIp,
      });

      notifyAdminEmail({
        name: clientName.trim(),
        phone: clientPhone.trim(),
        email: clientEmail.trim(),
        message: clientDemand.trim(),
        propertyTitle: `Đăng ký xem căn hộ: ${product?.title}`,
        sourceUrl: friendlyUrl,
      });

      setIsBooked(true);
      setClientName("");
      setClientPhone("");
      setClientEmail("");
      setClientDemand("");
      onShowNotification(
        `Đã gửi yêu cầu tư vấn thành công! Nhân viên sẽ gọi lại cho quý khách.`,
        "success",
      );
    } catch (err) {
      console.error(err);
      onShowNotification(
        "Đã xảy ra sự cố gửi yêu cầu. Vui lòng quay lại sau.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const fallbackTitle = `${parseSlugTitleFromPath(typeof window !== "undefined" ? window.location.pathname : "", "/product/") || "Đang tải..."} | Greenia Homes`;
  const pageTitle = product
    ? resolveItemTitle(product, "Greenia Homes")
    : fallbackTitle;

  if (loading) {
    return (
      <>
        <Helmet>
          <title>{pageTitle}</title>
        </Helmet>
        <div
          className="py-44 text-center space-y-4 max-w-sm mx-auto"
          id="product-detail-loader"
        >
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-xs font-light font-mono">
            Đang tải chi tiết...
          </p>
        </div>
      </>
    );
  }

  if (!product) return null;

  // Real-time calculation of categories with counts
  const categoryCounts: Record<string, number> = {};
  const districtCounts: Record<string, number> = {};

  // Pre-fill configured categories with 0 count
  if (productCategoriesExt && productCategoriesExt.length > 0) {
    productCategoriesExt.forEach((cat) => {
      categoryCounts[cat.name] = 0;
    });
  }

  products.forEach((p) => {
    const cat = (p.category || "Chưa phân loại").trim();
    // find if there is an existing category with exact case-insensitive match from config
    const matchedConfigCat = productCategoriesExt.find(
      (c) => c.name.trim().toLowerCase() === cat.toLowerCase(),
    );
    const finalCatName = matchedConfigCat ? matchedConfigCat.name : cat;

    categoryCounts[finalCatName] = (categoryCounts[finalCatName] || 0) + 1;

    if (p.district) {
      districtCounts[p.district] = (districtCounts[p.district] || 0) + 1;
    }
  });

  // Filter out configured categories that have 0 products IF user wants, but currently we show 0 count too if it's configured. Let's just render all.

  // Related products under the same category (Columns 1)
  const relatedCategoryProducts = products.filter(
    (p) =>
      p.category &&
      product.category &&
      p.id !== product.id &&
      p.category.trim().toLowerCase() === product.category.trim().toLowerCase(),
  );

  // Categorized Sliders at the footer
  const footerLatestSales = products
    .filter((p) => p.type !== "rent")
    .slice(0, 8);
  const footerLatestRents = products
    .filter((p) => p.type === "rent")
    .slice(0, 8);

  const productImages =
    product.imageUrls && product.imageUrls.length > 0
      ? product.imageUrls
      : [
          product.imageUrl ||
            "/no-image.svg",
        ];

  const rawBaseRating = product.baseRating || 5;
  const rawBaseCount = product.baseReviewCount || 0;
  const computedTotalStars =
    rawBaseRating * rawBaseCount + (product.userTotalRating || 0);
  const computedTotalCount = rawBaseCount + (product.userReviewCount || 0);
  const currentAvg =
    computedTotalCount === 0
      ? rawBaseRating
      : computedTotalStars / computedTotalCount;

  const schemaOrgJSONLD = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: productImages,
    description: (product.description || "")
      .replace(/<[^>]*>?/gm, "")
      .substring(0, 160),
    brand: {
      "@type": "Brand",
      name: "Greenia Homes",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: currentAvg.toFixed(1),
      reviewCount: computedTotalCount === 0 ? 1 : computedTotalCount,
    },
    offers: {
      "@type": "Offer",
      url: window.location.href,
      priceCurrency: "VND",
      price: (product.price || "").replace(/\D.*$/, "") || "1000000000",
      itemCondition: "https://schema.org/UsedCondition",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Greenia Homes",
      },
    },
  };

  return (
    <div
      className="max-w-7xl mx-auto px-[20px] pt-[15px] !pb-0 space-y-16 animate-in fade-in"
      id={`product-detail-viewport-${product.id}`}
    >
      <Helmet>
        <title>{resolveItemTitle(product, "Greenia Homes")}</title>
        <meta
          name="description"
          content={(product.description || "")
            .replace(/<[^>]*>?/gm, "")
            .substring(0, 160)}
        />
        <meta property="og:type" content="article" />
        <meta
          property="og:url"
          content={typeof window !== "undefined" ? window.location.href : ""}
        />
        <meta property="og:title" content={product.title} />
        <meta
          property="og:description"
          content={(product.description || "")
            .replace(/<[^>]*>?/gm, "")
            .substring(0, 160)}
        />
        <meta property="og:image" content={productImages[0]} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify(schemaOrgJSONLD)}
        </script>
      </Helmet>

      {/* 9.2.1. Breadcrumb Navigation */}
      <nav
        className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-900 pb-[5px] mb-[15px]"
        id="detail-breadcrumb"
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => onNavigate({ screen: "home" })}
            className="hover:text-amber-500 cursor-pointer"
          >
            Trang chủ
          </button>
          <span>/</span>
          <button
            onClick={() =>
              onNavigate({
                screen:
                  product.type === "rent" ? "latest-rents" : "latest-sales",
              })
            }
            className="hover:text-amber-500 cursor-pointer"
          >
            {product.type === "rent" ? "Cho thuê" : "Chuyển nhượng"}
          </button>
          <span>/</span>
          <span className="text-amber-500 max-w-[120px] sm:max-w-none truncate">
            {product.category}
          </span>
          <span>/</span>
          <span className="text-slate-200 font-semibold max-w-[150px] sm:max-w-none truncate">
            {product.title}
          </span>
        </div>

        <button
          onClick={() => onNavigate({ screen: "san-pham" })}
          className="inline-flex items-center gap-1 hover:text-amber-500 font-semibold cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Trở lại danh sách</span>
        </button>
      </nav>

      {/* 9.2.2. Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* =========================================================
            COLUMN 1 (Left): Covers 6 grid column widths (lg:col-span-6)
            ========================================================= */}
        <div className="lg:col-span-6 space-y-8" id="detail-pane-left">
          {/* Cover Multi-image Slider */}
          <div className="space-y-4 !mb-[10px]">
            <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-slate-900 bg-slate-950 shadow-xl">
              <img
                loading="eager"
                decoding="async"
                // @ts-ignore
                fetchpriority="high"
                src={selectedImage || undefined}
                alt={product.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-all duration-300"
              />

              <div className="absolute top-0 left-0 z-10">
                <span
                  className={`text-[10px] font-semibold px-[10px] py-[5px] rounded-br-[5px] uppercase tracking-wider inline-block ${
                    product.type === "rent"
                      ? "bg-emerald-700 text-white"
                      : "bg-rose-700 text-white"
                  }`}
                >
                  {product.type === "rent" ? "Cho thuê" : "Bán"}
                </span>
              </div>
            </div>

            {/* Thumbnail Navigation Row */}
            <div className="flex gap-2 overflow-x-auto pb-[5px] hide-scrollbar relative">
              {(product.imageUrls && product.imageUrls.length > 0
                ? product.imageUrls
                : [
                    product.imageUrl || sampleThumbs[0],
                    ...sampleThumbs.slice(1),
                  ]
              ).map((imgUrl, thumbIdx) => (
                <button
                  key={thumbIdx}
                  onClick={(e) => {
                    setSelectedImage(imgUrl);
                    setIsAutoplayPaused(true);
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const scrollLeft = e.currentTarget.offsetLeft - parent.offsetLeft - parent.clientWidth / 2 + e.currentTarget.clientWidth / 2;
                      parent.scrollTo({ left: scrollLeft, behavior: "smooth" });
                    }
                  }}
                  className={`w-16 h-12 lg:w-20 lg:h-16 shrink-0 rounded-lg overflow-hidden border transition-all cursor-pointer bg-slate-950 ${
                    selectedImage === imgUrl
                      ? "border-amber-500 ring-1 ring-amber-500/30"
                      : "border-slate-850 hover:border-slate-700"
                  }`}
                >
                  <img
                    loading="lazy"
                    decoding="async"
                    src={imgUrl || undefined}
                    alt={`${product.title} - ảnh thu nhỏ ${thumbIdx + 1}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Main info & Product details combined */}
          <div className="bg-slate-900 pt-[10px] pb-4 px-[10px] sm:px-[15px] !mb-[5px] rounded-lg border border-slate-900 text-left">
            <div className="space-y-3 pb-1 border-b border-slate-850/60">
              <h1 className="text-xl sm:text-2.5xl font-display font-medium text-white tracking-tight leading-normal">
                {product.title}
              </h1>

              <div className="flex items-center justify-between pb-0">
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                  <span>{product.district || "Thảo Điền, Quận 2"}</span>
                </p>
                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="flex items-center justify-center p-2 rounded-full text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 transition-colors active:scale-95"
                    title="Chia sẻ sản phẩm"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  {showShareMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-2 z-50 animate-in fade-in zoom-in duration-200">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          alert("Đã copy link!");
                          setShowShareMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2 border-none bg-transparent cursor-pointer"
                      >
                        <LinkIcon className="w-4 h-4" /> Sao chép link
                      </button>
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2 no-underline"
                        onClick={() => setShowShareMenu(false)}
                      >
                        <Facebook className="w-4 h-4 text-blue-500" /> Facebook
                      </a>
                      <a
                        href={`https://zalo.me/share?url=${encodeURIComponent(window.location.href)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2 no-underline"
                        onClick={() => setShowShareMenu(false)}
                      >
                        <MessageCircle className="w-4 h-4 text-blue-400" /> Zalo
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 !mt-[10px] pb-0 border-b border-slate-850/60">
              <div className="space-y-0.5 h-12">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  {product.type === "rent" ? "Giá thuê" : "Giá bán"}
                </span>
                <p className="font-display font-extrabold text-base text-amber-500 truncate">
                  {product.priceText}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  Diện tích
                </span>
                <p className="font-display font-semibold text-[13px] md:text-sm text-slate-200">
                  {product.area || 120} m²
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  Liên hệ
                </span>
                <p className="font-display font-semibold text-[13px] md:text-sm text-slate-200">
                  <a
                    href="tel:0932966700"
                    className="hover:text-amber-500 transition-colors"
                  >
                    0932 966 700
                  </a>
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <h2 className="font-display font-bold text-[13px] md:text-[13px] md:text-[13px] md:text-[13px] md:text-[13px] md:text-[13px] md:text-[13px] md:text-[13px] md:text-sm text-slate-300 !pb-0 !mb-[5px] border-b border-slate-850">
                Đặc điểm sản phẩm
              </h2>

              <div className="grid grid-cols-2 gap-y-3 gap-x-3 sm:gap-x-4 text-[13px] !pt-[5px]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sm:justify-start sm:gap-6 border-b border-slate-800/30 pb-1 sm:pb-[2px]">
                  <div className="flex items-center gap-1.5 text-slate-400 w-full sm:w-24 shrink-0 mb-1 sm:mb-0">
                    <Tag className="w-3 h-3 text-amber-500" />
                    <span className="text-[11px] sm:text-[13px]">
                      {product.type === "rent" ? "Giá thuê" : "Giá bán"}
                    </span>
                  </div>
                  <span className="text-slate-200 font-semibold text-left text-xs sm:text-[13px] line-clamp-1">
                    {product.priceText || "Đang cập nhật"}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sm:justify-start sm:gap-6 border-b border-slate-800/30 pb-1 sm:pb-[2px]">
                  <div className="flex items-center gap-1.5 text-slate-400 w-full sm:w-24 shrink-0 mb-1 sm:mb-0">
                    <Layers className="w-4 h-4 text-amber-500" />
                    <span className="text-[11px] sm:text-[13px]">
                      Diện tích
                    </span>
                  </div>
                  <span className="text-slate-200 font-semibold text-left text-xs sm:text-[13px] line-clamp-1">
                    {product.area ? `${product.area} m²` : "Đang cập nhật"}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sm:justify-start sm:gap-6 border-b border-slate-800/30 pb-1 sm:pb-[2px]">
                  <div className="flex items-center gap-1.5 text-slate-400 w-full sm:w-24 shrink-0 mb-1 sm:mb-0">
                    <Bookmark className="w-4 h-4 text-amber-500" />
                    <span className="text-[11px] sm:text-[13px]">
                      Phòng ngủ
                    </span>
                  </div>
                  <span className="text-slate-200 font-semibold text-left text-xs sm:text-[13px] line-clamp-1">
                    {product.bedrooms
                      ? `${product.bedrooms} PN`
                      : "Đang cập nhật"}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sm:justify-start sm:gap-6 border-b border-slate-800/30 pb-1 sm:pb-[2px]">
                  <div className="flex items-center gap-1.5 text-slate-400 w-full sm:w-24 shrink-0 mb-1 sm:mb-0">
                    <Bath className="w-4 h-4 text-amber-500" />
                    <span className="text-[11px] sm:text-[13px]">
                      Phòng vệ sinh
                    </span>
                  </div>
                  <span className="text-slate-200 font-semibold text-left text-xs sm:text-[13px] line-clamp-1">
                    {product.toilets
                      ? `${product.toilets} WC`
                      : "Đang cập nhật"}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sm:justify-start sm:gap-6 border-b border-slate-800/30 pb-1 sm:pb-[2px]">
                  <div className="flex items-center gap-1.5 text-slate-400 w-full sm:w-24 shrink-0 mb-1 sm:mb-0">
                    <Building2 className="w-4 h-4 text-amber-500" />
                    <span className="text-[11px] sm:text-[13px]">Số tầng</span>
                  </div>
                  <span className="text-slate-200 font-semibold text-left text-xs sm:text-[13px] line-clamp-1">
                    {product.floors || "Đang cập nhật"}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sm:justify-start sm:gap-6 border-b border-slate-800/30 pb-1 sm:pb-[2px]">
                  <div className="flex items-center gap-1.5 text-slate-400 w-full sm:w-24 shrink-0 mb-1 sm:mb-0">
                    <Compass className="w-4 h-4 text-amber-500" />
                    <span className="text-[11px] sm:text-[13px]">
                      Hướng nhà
                    </span>
                  </div>
                  <span className="text-slate-200 font-semibold text-left text-xs sm:text-[13px] line-clamp-1">
                    {product.direction || "Đang cập nhật"}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sm:justify-start sm:gap-6 border-b border-slate-800/30 pb-1 sm:pb-[2px]">
                  <div className="flex items-center gap-1.5 text-slate-400 w-full sm:w-24 shrink-0 mb-1 sm:mb-0">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    <span className="text-[11px] sm:text-[13px]">Mặt tiền</span>
                  </div>
                  <span className="text-slate-200 font-semibold text-left text-xs sm:text-[13px] line-clamp-1">
                    {(product as any).frontage
                      ? `${(product as any).frontage}m`
                      : "Đang cập nhật"}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sm:justify-start sm:gap-6 border-b border-slate-800/30 pb-1 sm:pb-[2px]">
                  <div className="flex items-center gap-1.5 text-slate-400 w-full sm:w-24 shrink-0 mb-1 sm:mb-0">
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                    <span className="text-[11px] sm:text-[13px]">Pháp lý</span>
                  </div>
                  <span className="text-slate-200 font-semibold text-left text-xs sm:text-[13px] line-clamp-1">
                    {product.legalStatus || "Đang cập nhật"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2 Tabs: details/description, map representation */}
          <div className="space-y-4 text-left">
            <div className="flex border-b border-slate-900 pb-px gap-1 !mb-[10px] !pb-0 h-[35px] !pt-[5px]">
              <button
                onClick={() => setActiveTab("desc")}
                className={`text-sm font-semibold tracking-wider relative cursor-pointer !py-0 !px-[5px] text-center h-[30px] ${
                  activeTab === "desc"
                    ? "text-amber-500 font-bold"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                Thông tin chi tiết
                {activeTab === "desc" && (
                  <div className="absolute bottom-0 inset-x-0 mx-auto bg-amber-500 w-full text-center !h-[1px]" />
                )}
              </button>

              <button
                onClick={() => setActiveTab("map")}
                className={`text-sm font-semibold tracking-wider relative cursor-pointer text-center !px-[5px] !py-0 h-[30px] ${
                  activeTab === "map"
                    ? "text-amber-500 font-bold"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                Vị trí
                {activeTab === "map" && (
                  <div className="absolute bottom-0 inset-x-0 mx-auto bg-amber-500 w-full text-center !h-[1px]" />
                )}
              </button>
            </div>

            <div
              className={`bg-slate-900 border border-slate-900 rounded-lg min-h-[160px] ${activeTab === "map" ? "p-[1px]" : "!pt-[15px] !pb-[10px] !px-[5px]"}`}
            >
              <div style={{ display: activeTab === "desc" ? "block" : "none" }}>
                {product.description ? (
                  <div
                    className="prose prose-invert max-w-none text-slate-300 text-[13px] md:text-[15px] leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : (
                  <p className="text-slate-500 text-xs italic">
                    Không có tài liệu thuyết minh đi kèm.
                  </p>
                )}

                {relatedCategoryProducts.length > 0 && (
                  <div className="flex items-center !pb-0 !mt-[10px] !pt-[15px] !pl-[10px]">
                    <span className="text-white text-[13px] mr-1.5 font-medium">
                      Xem thêm:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onNavigate({
                          screen: "category-product",
                          categoryName: product.category,
                        })
                      }
                      className="bg-transparent border-none p-0 cursor-pointer inline-flex items-center group"
                    >
                      <span className="text-[13px] text-amber-500 group-hover:text-amber-400 group-hover:underline">
                        {product.category} ({relatedCategoryProducts.length})
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {activeTab === "map" && (
                <div className="w-full">
                  <MapViewer
                    mapHtml={product.mapHtml}
                    address={`${product.title}, ${product.district}`}
                  />
                </div>
              )}

              <div className="px-[10px] !mt-0 !h-[35px]">
                <StarRatingInteractive
                  collectionName="products"
                  documentId={product.id}
                  baseRating={product.baseRating || 5.0}
                  baseReviewCount={product.baseReviewCount || 0}
                  userTotalRating={product.userTotalRating || 0}
                  userReviewCount={product.userReviewCount || 0}
                />
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            COLUMN 2 (Middle/Right): Sticky Consultation Box + Sidebar
            ========================================================= */}
        <div
          className="lg:col-span-3 space-y-6 lg:sticky lg:top-[10px] self-start"
          id="detail-pane-right"
        >
          {/* Beautiful Unified Consultation card based on the screenshot mockup */}
          <div className="bg-slate-900 border border-amber-500/40 p-6 rounded-lg space-y-3 relative text-left h-[432px]">
            {/* Inner Heading */}
            <div className="text-center">
              <div className="flex flex-col items-center justify-center mb-3 gap-2">
                <img
                  loading="lazy"
                  decoding="async"
                  src={
                    product.avatarUrl ||
                    "/cv-image.svg"
                  }
                  alt="Chuyên viên tư vấn"
                  className="h-16 w-16 rounded-full object-cover border-2 border-amber-500/50"
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.currentTarget.onerror = null;
                    const target = e.target as HTMLImageElement;
                    target.src =
                      "/cv-image.svg";
                  }}
                />
                <h3 className="text-amber-500 font-display font-bold text-[15px] tracking-wide m-0 p-0">
                  Tư vấn mua nhà chuyên sâu
                </h3>
              </div>
            </div>

            {/* Premium bullet points with green checkmarks from the mockup */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3 h-3 text-slate-950" />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Phân tích quỹ căn, chính sách, tiện ích giúp Khách hàng lựa
                  chọn căn tốt nhất.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3 h-3 text-slate-950" />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Giải đáp mọi thắc mắc của khách hàng.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3 h-3 text-slate-950" />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Tuyệt đối bảo mật thông tin cá nhân.
                </p>
              </div>
            </div>

            {/* Assistance secondary utilities underneath */}
            <div className="pt-4 flex flex-col gap-2">
              <a
                href="tel:0932966700"
                className="flex-1 bg-gradient-to-br from-[#0f9b0f] to-[#00b894] hover:brightness-110 shadow-[0_4px_15px_rgba(15,155,15,0.4)] py-2 px-2 rounded-full text-white font-bold transition-all flex items-center justify-center gap-1.5 border border-white/10 uppercase tracking-wide"
              >
                <Phone className="w-3.5 h-3.5 drop-shadow-md fill-white" />
                <span className="text-[10px]">0932 966 700</span>
              </a>
              <a
                href="https://zalo.me/0932966700"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-gradient-to-br from-[#0068ff] to-[#00a8ff] hover:brightness-110 shadow-[0_4px_15px_rgba(0,104,255,0.4)] py-2 px-2 rounded-full text-white font-bold transition-all flex items-center justify-center gap-1.5 border border-white/10 uppercase tracking-wide"
              >
                <img
                  loading="lazy"
                  decoding="async"
                  src="/zalo-icon.svg"
                  alt="Zalo"
                  className="w-5 h-5 drop-shadow-md"
                />
                <span className="text-[10px]">Chat qua Zalo</span>
              </a>
            </div>
          </div>
        </div>

        {/* =========================================================
            COLUMN 3 (Right): Covers 3 grid column widths (lg:col-span-3 - STICKY)
            ========================================================= */}
        <div
          className="lg:col-span-3 space-y-6 lg:sticky lg:top-[10px] self-start"
          id="detail-pane-far-right"
        >
          {/* Categories with real-time uploading counts */}
          <div className="bg-slate-900 border border-slate-850 py-2.5 px-[15px] rounded-lg space-y-4 shadow-xl text-left">
            <h4 className="text-white text-sm font-bold tracking-wider pt-0 pb-[2px] mb-[5px] border-b border-slate-850">
              Danh Mục Sản Phẩm
            </h4>

            <div className="space-y-2">
              {Object.entries(categoryCounts).map(([catName, cnt]) => (
                <div
                  key={catName}
                  onClick={() =>
                    onNavigate({
                      screen: "category-product",
                      categoryName: catName,
                    })
                  }
                  className="flex justify-between items-center text-xs text-slate-300 hover:text-amber-500 cursor-pointer pt-2 pb-0 transition-colors border-b border-slate-950/40 last:border-0"
                >
                  <span className="truncate flex items-center gap-1">
                    <Tag className="w-3 h-3 text-amber-500 shrink-0" />
                    {catName}
                  </span>
                  <span className="bg-slate-950 px-2 py-0.5 rounded-full text-[9px] font-mono text-slate-500">
                    ({cnt})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Price Range Filters widget */}
          <div className="bg-slate-900 border border-slate-850 py-2.5 px-[15px] rounded-lg space-y-3 shadow-xl text-left">
            <h4 className="text-white text-sm font-bold tracking-wider pb-0 mb-[5px] border-b border-slate-850">
              Khoảng giá
            </h4>

            <div className="space-y-1.5 text-xs">
              <button
                onClick={() =>
                  onNavigate({ screen: "san-pham", priceRange: "under3" })
                }
                className="block w-full text-left text-slate-400 hover:text-amber-500 py-1 cursor-pointer bg-transparent border-none"
              >
                • Dưới 3 Tỷ
              </button>
              <button
                onClick={() =>
                  onNavigate({ screen: "san-pham", priceRange: "3to5" })
                }
                className="block w-full text-left text-slate-400 hover:text-amber-500 py-1 cursor-pointer bg-transparent border-none"
              >
                • Từ 3 Tỷ đến 5 Tỷ
              </button>
              <button
                onClick={() =>
                  onNavigate({ screen: "san-pham", priceRange: "5to10" })
                }
                className="block w-full text-left text-slate-400 hover:text-amber-500 py-1 cursor-pointer bg-transparent border-none"
              >
                • Từ 5 Tỷ đến 10 Tỷ
              </button>
              <button
                onClick={() =>
                  onNavigate({ screen: "san-pham", priceRange: "10to20" })
                }
                className="block w-full text-left text-slate-400 hover:text-amber-500 py-1 cursor-pointer bg-transparent border-none"
              >
                • Từ 10 Tỷ đến 20 Tỷ
              </button>
              <button
                onClick={() =>
                  onNavigate({ screen: "san-pham", priceRange: "20to50" })
                }
                className="block w-full text-left text-slate-400 hover:text-amber-500 py-1 cursor-pointer bg-transparent border-none"
              >
                • Từ 20 Tỷ đến 50 Tỷ
              </button>
              <button
                onClick={() =>
                  onNavigate({ screen: "san-pham", priceRange: "over50" })
                }
                className="block w-full text-left text-slate-400 hover:text-amber-500 py-1 cursor-pointer bg-transparent border-none"
              >
                • Trên 50 Tỷ
              </button>
            </div>
          </div>

          {/* Sizing options counts widget */}
          <div className="bg-slate-900 border border-slate-850 py-2.5 px-[15px] rounded-lg space-y-3 shadow-xl text-left mb-5">
            <h4 className="text-white text-sm font-bold tracking-wider pb-0 mb-[5px] border-b border-slate-850">
              Diện tích
            </h4>

            <div className="space-y-1.5 text-xs">
              <button
                onClick={() =>
                  onNavigate({ screen: "san-pham", areaRange: "under100" })
                }
                className="block w-full text-left text-slate-400 hover:text-amber-500 py-1 cursor-pointer bg-transparent border-none"
              >
                • Dưới 100 m²
              </button>
              <button
                onClick={() =>
                  onNavigate({ screen: "san-pham", areaRange: "100to300" })
                }
                className="block w-full text-left text-slate-400 hover:text-amber-500 py-1 cursor-pointer bg-transparent border-none"
              >
                • Từ 100 m² đến 300 m²
              </button>
              <button
                onClick={() =>
                  onNavigate({ screen: "san-pham", areaRange: "300to500" })
                }
                className="block w-full text-left text-slate-400 hover:text-amber-500 py-1 cursor-pointer bg-transparent border-none"
              >
                • Từ 300 m² đến 500 m²
              </button>
              <button
                onClick={() =>
                  onNavigate({ screen: "san-pham", areaRange: "over500" })
                }
                className="block w-full text-left text-slate-400 hover:text-amber-500 py-1 cursor-pointer bg-transparent border-none"
              >
                • Trên 500 m²
              </button>
            </div>
          </div>

          {/* Area options widget */}
          <div className="bg-slate-900 border border-slate-850 py-2.5 px-[15px] rounded-lg space-y-3 shadow-xl text-left">
            <h4 className="text-white text-sm font-bold tracking-wider pb-0 mb-[5px] border-b border-slate-850">
              Khu vực
            </h4>

            <div className="space-y-2">
              {Object.entries(districtCounts).length > 0 ? (
                Object.entries(districtCounts).map(([distName, cnt]) => (
                  <div
                    key={distName}
                    onClick={() =>
                      onNavigate({ screen: "san-pham", location: distName })
                    }
                    className="flex justify-between items-center text-xs text-slate-300 hover:text-amber-500 cursor-pointer py-1 transition-colors border-b border-slate-950/40 last:border-0"
                  >
                    <span className="truncate pr-2">• {distName}</span>
                    <span className="text-[10px] text-slate-600 bg-slate-950 px-1.5 py-0.5 rounded">
                      {cnt}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-xs italic py-2">
                  Chưa có dữ liệu khu vực
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AdBanner
        slot="product-detail-deep"
        containerClassName="max-w-7xl mx-auto"
      />

      {/* =========================================================
          BELOW COLUMNS: Rich promotion sections
          ========================================================= */}

      {/* 1. Bất động sản dành cho bạn (Recently Viewed Grid: displays 5 columns with AJAX load more (+5)) */}
      {recentlyViewed.length > 0 && (
        <section className="space-y-6 text-left" id="detail-history-recent">
          <h2 className="text-[15px] font-display font-medium text-white border-l-4 border-amber-500 pl-3">
            Bất Động Sản Dành Cho Bạn
          </h2>

          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 md:grid-cols-3 gap-5">
              {recentlyViewed.slice(0, recentGridLimit).map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  onNavigate={onNavigate}
                  badgeText="Vừa xem"
                  badgeColor="bg-pink-700 text-white"
                />
              ))}
            </div>

            {recentlyViewed.length > recentGridLimit && (
              <div className="flex w-full justify-center border-t border-slate-800/50 pt-8 mt-4">
                <button
                  onClick={() => setRecentGridLimit((prev) => prev + 5)}
                  className="bg-transparent border border-amber-500 text-amber-500 hover:bg-amber-500/10 text-xs font-semibold px-6 py-3 rounded-md cursor-pointer transition-colors"
                >
                  Xem thêm bất động sản khác <span>&rsaquo;</span>
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 2. Newest Sales Slider (horizontal) */}
      <section className="space-y-6 text-left" id="detail-bottom-sales">
        <h2 className="text-[15px] font-display font-medium text-white border-l-4 border-amber-500 pl-3">
          Tin Bán mới nhất
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {footerLatestSales.slice(0, 5).map((item) => (
            <div key={item.id} className="w-full">
              <ProductCard
                item={item}
                onNavigate={onNavigate}
                badgeText="Bán"
                badgeColor="bg-rose-700 text-white"
              />
            </div>
          ))}
        </div>
        <div className="flex w-full justify-center border-t border-slate-800/50 pt-8 mt-4">
          <button
            onClick={() => onNavigate({ screen: "latest-sales" })}
            className="bg-transparent border border-amber-500 text-amber-500 hover:bg-amber-500/10 text-xs font-semibold px-6 py-3 rounded-md cursor-pointer transition-colors text-[10px] !py-[5px] !px-[15px]"
          >
            Xem tất cả BĐS Bán
          </button>
        </div>
      </section>

      {/* 3. Newest Rents Slider (horizontal) */}
      <section className="space-y-6 text-left" id="detail-bottom-rents">
        <h2 className="text-[15px] font-display font-medium text-white border-l-4 border-amber-500 pl-3">
          Tin Cho thuê mới nhất
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {footerLatestRents.slice(0, 5).map((item) => (
            <div key={item.id} className="w-full">
              <ProductCard
                item={item}
                onNavigate={onNavigate}
                badgeText="Cho thuê"
                badgeColor="bg-emerald-700 text-white"
              />
            </div>
          ))}
        </div>
        <div className="flex w-full justify-center border-t border-slate-800/50 pt-8 mt-4">
          <button
            onClick={() => onNavigate({ screen: "latest-rents" })}
            className="bg-transparent border border-amber-500 text-amber-500 hover:bg-amber-500/10 text-xs font-semibold px-6 py-3 rounded-md cursor-pointer transition-colors text-[10px] !pt-[5px] !pb-[6px] !px-[15px]"
          >
            Xem tất cả BĐS Cho thuê
          </button>
        </div>
      </section>

      {/* 4. Featured Projects Slider (horizontal) */}
      <section className="space-y-6 text-left pb-0" id="detail-bottom-projects">
        <div className="flex items-end justify-between pb-2 border-b border-white/10 mb-4">
          <h2 className="text-[15px] font-display font-medium text-white border-l-4 border-amber-500 pl-3 m-0">
            Dự án nổi bật
          </h2>
          <button
            type="button"
            onClick={() => onNavigate({ screen: "du-an" })}
            className="flex items-center gap-1.5 text-[9px] uppercase font-mono tracking-widest text-amber-400 font-bold hover:underline bg-transparent border-none cursor-pointer p-0"
          >
            <span>Xem thêm →</span>
          </button>
        </div>

        <div className="relative overflow-x-auto pb-4 scrollbar-thin scroll-smooth snap-x snap-mandatory">
          <div className="flex gap-5 box-border w-max lg:w-full">
            {projects.slice(0, 4).map((p) => {
              let statusText = "Đang mở bán";
              if (p.status === "handed_over") statusText = "Đã bàn giao";
              if (p.status === "coming_soon") statusText = "Sắp ra mắt";

              return (
                <div
                  key={p.id}
                  onClick={() =>
                    onNavigate({
                      screen: "project-detail",
                      projectId: p.id,
                      slug: generateSlug(p.title),
                    })
                  }
                  className="w-[85vw] sm:w-[calc(50vw-20px)] lg:w-[calc(25%-15px)] shrink-0 bg-slate-900 border border-amber-500/20 rounded-lg overflow-hidden flex flex-col h-full transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-500 hover:shadow-[0_10px_20px_rgba(0,0,0,0.5)] cursor-pointer no-underline snap-start"
                >
                  <div className="h-[220px] relative overflow-hidden group">
                    <span className="absolute top-0 left-0 px-3 py-1.5 text-[11px] font-bold text-black bg-[#ff9f43] z-10 rounded-br-lg">
                      {statusText}
                    </span>
                    <img
                      loading="lazy"
                      decoding="async"
                      src={optimizeImageUrl(p.images?.[0], 400) || undefined}
                      alt={p.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 block"
                      onError={(e) => { e.currentTarget.onerror = null;
                        (e.target as HTMLImageElement).src =
                          "https://via.placeholder.com/600x400?text=Greenia+Homes";
                      }}
                    />
                  </div>

                  <div className="p-4 flex-1 flex flex-col items-start bg-slate-900 text-left">
                    <h3 className="text-[13px] sm:text-[15px] font-bold text-white leading-[1.4] m-0 mb-[9px] line-clamp-2 transition-colors group-hover:text-amber-500 text-left w-full">
                      {p.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs mb-3 w-full">
                      <span className="text-slate-400">Giá từ:</span>
                      <span className="text-amber-500 font-extrabold text-[14px] sm:text-base">
                        {p.priceText || "Đang cập nhật"}
                      </span>
                    </div>
                    <div className="flex items-center gap-[10px] text-[11px] text-slate-300 mb-2 w-full">
                      <div className="flex items-center gap-1.5 flex-1 w-1/2">
                        <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500 shrink-0" />
                        <span
                          className="truncate"
                          title={p.scale || "Đang cập nhật"}
                        >
                          {p.scale || "Đang cập nhật quy mô"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-1 w-1/2">
                        <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500 shrink-0" />
                        <span
                          className="truncate"
                          title={p.units ? String(p.units) : "Đang cập nhật"}
                        >
                          {p.units
                            ? `${p.units} căn`
                            : "Đang cập nhật số lượng"}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-[#999] flex items-start gap-1.5 leading-[1.5] mt-auto pt-1 w-full">
                      <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 shrink-0 mt-[2px]" />
                      <span className="text-left line-clamp-2">
                        {p.location || "Đang cập nhật vị trí"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
