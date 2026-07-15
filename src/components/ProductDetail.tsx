import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import SchemaMarkup from "./SchemaMarkup";
import { generateSlug, optimizeImageUrl, generateSrcSet } from "../lib/utils";
import { parseLocation, formatLocationName } from "../lib/locationMapping";
import { doc, getDoc, collection, getDocs, addDoc, db, updateDoc } from "../firebase";
import { handleFirestoreError, OperationType } from "../firebase-errors";
import { Product, Project, RouteState } from "../types";
import { useScrollDirection } from "../hooks/useScrollDirection";
import {
  MapPin,
  Phone,
  Building2,
  ChevronLeft,
  ArrowRight,
  ChevronRight,
  X,
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
  Armchair,
  Facebook,
  Link as LinkIcon,
  FolderOpen,
  ChevronDown,
} from "lucide-react";

import { Helmet } from "react-helmet-async";
import { parseSlugTitleFromPath, resolveItemTitle } from "../lib/documentHead";
import AdBanner from "./AdBanner";
import ProductCard from "./ProductCard";
import StarRatingInteractive from "./StarRatingInteractive";

interface ProductDetailProps {
  productId: string;
  slug?: string;
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
      const cleanHtml = mapHtml.includes("iframe")
        ? mapHtml.replace(/loading=["']lazy["']/g, "")
        : `<iframe title="Bản đồ ${address}" src="${mapHtml}" width="100%" height="100%" style="border:0;" allowfullscreen referrerPolicy="no-referrer-when-downgrade"></iframe>`;
        
      return (
        <div
          className="w-full h-[300px] rounded-lg overflow-hidden border border-border-color shadow-inner bg-bg-surface [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0"
          dangerouslySetInnerHTML={{ __html: cleanHtml }}
        />
      );
    }

    const query = encodeURIComponent(address || "Hồ Chí Minh, Việt Nam");
    return (
      <div className="w-full h-[300px] rounded-lg overflow-hidden border border-border-color shadow-inner bg-bg-surface">
        <iframe title={`Bản đồ Google Maps cho ${address}`}
          width="100%"
          height="100%"
          style={{ border: 0 }}
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
  slug,
  onNavigate,
  onShowNotification,
  logoUrl,
}: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(() => {
    if (
      typeof window !== "undefined" &&
      (window.__SERVER_DATA__?.product?.id === productId || 
       (slug && generateSlug(window.__SERVER_DATA__?.product?.title) === slug))
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
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedLocations, setExpandedLocations] = useState<Record<string, boolean>>({});

  const toggleCategory = (catName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCategories(prev => ({ ...prev, [catName]: !prev[catName] }));
  };

  const toggleLocation = (locName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedLocations(prev => ({ ...prev, [locName]: !prev[locName] }));
  };

  // Left column variables
  const [selectedImage, setSelectedImage] = useState(() => {
    if (
      typeof window !== "undefined" &&
      (window.__SERVER_DATA__?.product?.id === productId || 
       (slug && generateSlug(window.__SERVER_DATA__?.product?.title) === slug))
    ) {
      return window.__SERVER_DATA__.product.imageUrl || "";
    }
    return "";
  });
  const [activeTab, setActiveTab] = useState<"desc" | "map">("desc");
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);
  const scrollDirection = useScrollDirection();

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

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const currentImages = product?.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls 
    : [product?.imageUrl || sampleThumbs[0], ...sampleThumbs.slice(1)];

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsAutoplayPaused(true);
    setSelectedImage((prev) => {
      const idx = currentImages.indexOf(prev);
      if (idx === -1) return currentImages[0];
      return currentImages[(idx - 1 + currentImages.length) % currentImages.length];
    });
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsAutoplayPaused(true);
    setSelectedImage((prev) => {
      const idx = currentImages.indexOf(prev);
      if (idx === -1) return currentImages[0];
      return currentImages[(idx + 1) % currentImages.length];
    });
  };

  useEffect(() => {
    async function loadProductData() {
      if (!productId && !slug) return;
      try {
        if (!product) setLoading(true);

        let activeProd: Product | null = product;
        let finalProductId = productId;

        if (finalProductId) {
          const docRef = doc(db, "products", finalProductId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            activeProd = { id: docSnap.id, ...docSnap.data() } as Product;
          }
        } else if (slug) {
          const prodCol = collection(db, "products");
          const prodSnap = await getDocs(prodCol);
          for (const doc of prodSnap.docs) {
            const data = doc.data();
            if (generateSlug(data.title) === slug && (!data.approvalStatus || data.approvalStatus === "approved")) {
              activeProd = { id: doc.id, ...data } as Product;
              finalProductId = doc.id;
              break;
            }
          }
          if (!activeProd) {
            try {
              const docRef = doc(db, "products", slug);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                activeProd = { id: docSnap.id, ...docSnap.data() } as Product;
                finalProductId = docSnap.id;
              }
            } catch (e) {
              // Ignore invalid ID errors
            }
          }
        }

        if (activeProd) {
          setProduct(activeProd);
          if (!selectedImage)
            setSelectedImage(activeProd.imageUrl || sampleThumbs[0]);

          // Tăng lượt xem thực tế
          const newViews = (activeProd.viewsCount || 0) + 1;
          activeProd.viewsCount = newViews;
          if (finalProductId) {
            updateDoc(doc(db, "products", finalProductId), { viewsCount: newViews }).catch(console.error);
          }
        } else {
          setLoading(false);
          // Removed the error notification "Sản phẩm không có..." as requested by user
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

        // 3.5 Fetch Categories Config
        const genSnap = await getDoc(doc(db, 'settings', 'general'));
        if (genSnap.exists() && genSnap.data().productCategoriesExt) {
          setProductCategoriesExt(genSnap.data().productCategoriesExt);
        }

        // 4. Save viewed ID to localStorage History
        const viewedIds: string[] = JSON.parse(
          localStorage.getItem("recentlyViewed") || "[]",
        );
        const updatedList = viewedIds.filter((id) => id !== finalProductId);
        if (finalProductId) {
          updatedList.unshift(finalProductId);
        }
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
  }, [productId, slug]);

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
        propertyId: product?.id || productId || slug || "unknown",
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

  const pageTitle = product
    ? resolveItemTitle(product, "Greenia Homes")
    : "Đang tải... | Greenia Homes";

  if (loading) {
    return (
      <>
        <div
          className="min-h-[100vh] flex flex-col justify-center items-center text-center space-y-4 max-w-sm mx-auto"
          id="product-detail-loader"
        >
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-secondary text-xs font-light font-mono">
            Đang tải chi tiết...
          </p>
        </div>
      </>
    );
  }

  if (!product) return null;

  // Real-time calculation of categories with counts
  const categoryCounts: Record<string, number> = {};
  const locationHierarchy: Record<string, { count: number, districts: Record<string, number> }> = {};

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
      const parsedLoc = parseLocation(p.district || '');
      const provName = parsedLoc.province || p.district?.trim() || 'Khác';
      const childName = parsedLoc.ward;
      
      if (!locationHierarchy[provName]) {
        locationHierarchy[provName] = { count: 0, districts: {} };
      }
      locationHierarchy[provName].count += 1;
      
      if (childName) {
        locationHierarchy[provName].districts[childName] = (locationHierarchy[provName].districts[childName] || 0) + 1;
      }
    }
  });

  const locationEntries = Object.entries(locationHierarchy).sort((a, b) => b[1].count - a[1].count);

  const parentCats = productCategoriesExt.filter(c => !c.parentId);
  const configuredCatNames = productCategoriesExt.map(c => c.name);
  const unconfiguredCats = Object.keys(categoryCounts).filter(catName => !configuredCatNames.includes(catName) && categoryCounts[catName] > 0);

  const categoryHierarchy = parentCats.map(p => {
    const children = productCategoriesExt.filter(c => c.parentId === p.name);
    const childrenWithCounts = children.map(c => ({
      name: c.name,
      count: categoryCounts[c.name] || 0
    })).filter(c => c.count > 0);

    const parentOwnCount = categoryCounts[p.name] || 0;
    const totalCount = parentOwnCount + childrenWithCounts.reduce((sum, c) => sum + c.count, 0);

    return {
      name: p.name,
      ownCount: parentOwnCount,
      totalCount,
      children: childrenWithCounts
    };
  }).filter(p => p.totalCount > 0);

  unconfiguredCats.forEach(catName => {
    categoryHierarchy.push({
      name: catName,
      ownCount: categoryCounts[catName] || 0,
      totalCount: categoryCounts[catName] || 0,
      children: []
    });
  });

  // Filter out configured categories that have 0 products IF user wants, but currently we show 0 count too if it's configured. Let's just render all.

  // Related products under the same category (Columns 1)
  const relatedCategoryProducts = products.filter(
    (p) =>
      p.category &&
      product.category &&
      p.id !== product.id &&
      p.category.trim().toLowerCase() === product.category.trim().toLowerCase()
  ).slice(0, 4);

  const relatedIds = new Set(relatedCategoryProducts.map((p) => p.id));

  // Categorized Sliders at the footer
  const footerLatestSales = products
    .filter((p) => p.type !== "rent" && p.id !== product.id && !relatedIds.has(p.id))
    .slice(0, 8);
  const footerLatestRents = products
    .filter((p) => p.type === "rent" && p.id !== product.id && !relatedIds.has(p.id))
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

  const socialDescription = [
    product.district ? `📍 ${product.street ? product.street + ', ' : ''}${formatLocationName(product.district)}` : null,
    product.priceText ? `💰 ${product.priceText}` : null,
    product.area ? `📐 ${product.area} m²` : null,
    product.bedrooms ? `🛏️ ${product.bedrooms} PN` : null,
    product.toilets ? `🛁 ${product.toilets} WC` : null
  ].filter(Boolean).join(" | ") + (product.description ? ` - ${(product.description || "").replace(/<[^>]*>?/gm, "").substring(0, 100)}...` : "");

  const schemaOrgJSONLD: any = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: product.title,
    image: productImages,
    description: (product.description || "")
      .replace(/<[^>]*>?/gm, "")
      .substring(0, 160),
    datePosted: product.createdAt,
    address: {
      "@type": "PostalAddress",
      streetAddress: product.street || undefined,
      addressLocality: product.district || undefined,
      addressRegion: "Hồ Chí Minh",
      addressCountry: "VN"
    },
    numberOfRooms: product.bedrooms || undefined,
    numberOfBedrooms: product.bedrooms || undefined,
    numberOfBathroomsTotal: product.toilets || undefined,
    floorSize: product.area ? {
      "@type": "QuantitativeValue",
      value: product.area,
      unitCode: "MTK"
    } : undefined,
    offers: {
      "@type": "Offer",
      url: typeof window !== "undefined" ? window.location.href : "",
      priceCurrency: "VND",
      price: (product.price || "").replace(/\D.*$/, "") || "1000000000",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Greenia Homes",
      },
    },
  };

  if (computedTotalCount > 0) {
    schemaOrgJSONLD.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: currentAvg.toFixed(1),
      reviewCount: computedTotalCount,
    };
  }

  // Nếu có tọa độ, thêm vào schema
  // @ts-ignore (latitude/longitude có thể không có trong mọi model cũ)
  if (product.latitude && product.longitude) {
    schemaOrgJSONLD.geo = {
      "@type": "GeoCoordinates",
      // @ts-ignore
      latitude: product.latitude,
      // @ts-ignore
      longitude: product.longitude
    };
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Trang chủ",
        item: "https://greeniahomes.vn"
      },
      {
        "@type": "ListItem",
        position: 2,
        name: product.type === "rent" ? "Cho Thuê" : "Mua Bán",
        item: `https://greeniahomes.vn/danh-sach?type=${product.type}`
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.title,
        item: typeof window !== "undefined" ? window.location.href : ""
      }
    ]
  };

  return (
    <article
      className="max-w-7xl mx-auto px-[20px] pt-[15px] !pb-0 space-y-6 animate-in fade-in"
      id={`product-detail-viewport-${product.id}`}
    >
      <Helmet>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content={(product.description || "")
            .replace(/<[^>]*>?/gm, "")
            .substring(0, 160)}
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content={typeof window !== "undefined" ? window.location.href : ""}
        />
        <meta property="og:title" content={product.title} />
        <meta
          property="og:description"
          content={socialDescription}
        />
        <meta property="og:image" content={productImages[0]?.startsWith('http') ? productImages[0] : `https://greeniahomes.vn${productImages[0]?.startsWith('/') ? productImages[0] : `/${productImages[0]}`}`} />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={product.title} />
        <meta name="twitter:description" content={socialDescription} />
        <meta name="twitter:image" content={productImages[0]?.startsWith('http') ? productImages[0] : `https://greeniahomes.vn${productImages[0]?.startsWith('/') ? productImages[0] : `/${productImages[0]}`}`} />

        {/* Geo Meta Tags for Local SEO */}
        <meta name="geo.region" content="VN-SG" />
        <meta name="geo.placename" content={product.district ? `${product.district}, Hồ Chí Minh` : "Hồ Chí Minh, Việt Nam"} />
        {/* @ts-ignore */}
        <meta name="geo.position" content={product.latitude && product.longitude ? `${product.latitude};${product.longitude}` : "10.733852;106.715344"} />
        {/* @ts-ignore */}
        <meta name="ICBM" content={product.latitude && product.longitude ? `${product.latitude}, ${product.longitude}` : "10.733852, 106.715344"} />
        
        <script type="application/ld+json">{JSON.stringify(schemaOrgJSONLD)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      {/* 9.2.1. Breadcrumb Navigation */}
      <nav className={`flex flex-col sticky z-[90] bg-bg-surface -mx-[20px] px-[20px] py-[10px] transition-all duration-300 ${scrollDirection === 'down' ? 'top-0' : 'top-10'}`}>
        <div
          className="flex items-center justify-between text-xs text-text-secondary border-b border-border-color pb-[5px]"
          id="detail-breadcrumb"
        >
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => onNavigate({ screen: "home" })}
            className="hover:text-primary cursor-pointer"
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
            className="hover:text-primary cursor-pointer"
          >
            {product.type === "rent" ? "Cho thuê" : "Chuyển nhượng"}
          </button>
          <span>/</span>
          <button
            onClick={() => onNavigate({ screen: "category-product", categoryName: product.category })}
            className="text-primary max-w-[120px] sm:max-w-none truncate hover:underline cursor-pointer"
          >
            {product.category}
          </button>
          <span>/</span>
          <span className="text-text-primary font-semibold max-w-[150px] sm:max-w-none truncate">
            {product.title}
          </span>
        </div>

        <button
          onClick={() => onNavigate({ screen: "san-pham" })}
          className="inline-flex items-center gap-1 hover:text-primary font-semibold cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Trở lại danh sách</span>
        </button>
      </div>
      </nav>

        {/* 9.2.2. Three Column Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start !mt-4">
        {/* =========================================================
            COLUMN 1 (Left): Covers 6 grid column widths (lg:col-span-6)
            ========================================================= */}
        <section className="lg:col-span-6 space-y-8" id="detail-pane-left">
          {/* Cover Multi-image Slider */}
          <figure className="space-y-4 !mb-[10px]">
            <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-border-color bg-bg-surface shadow-xl group">
              <img
                loading="eager"
                decoding="async"
                // @ts-ignore
                fetchpriority="high"
                src={selectedImage ? optimizeImageUrl(selectedImage, 1200) : undefined}
                srcSet={selectedImage ? generateSrcSet(selectedImage) : undefined}
                sizes="(max-width: 1024px) 100vw, 800px"
                alt={product.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-all duration-300 cursor-pointer"
                onClick={() => setIsLightboxOpen(true)}
              />

              {currentImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute top-1/2 left-2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all z-20"
                  >
                    <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute top-1/2 right-2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all z-20"
                  >
                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                </>
              )}

              <div className="absolute top-0 left-0 z-10">
                <span
                  className={`text-[10px] font-semibold px-[10px] py-[5px] rounded-br-[5px] uppercase tracking-wider inline-block ${
                    product.type === "rent"
                      ? "bg-primary text-white"
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
                  className={`w-16 h-12 lg:w-20 lg:h-16 shrink-0 rounded-lg overflow-hidden border transition-all cursor-pointer bg-bg-surface ${
                    selectedImage === imgUrl
                      ? "border-primary ring-1 ring-yellow-500/30"
                      : "border-border-color hover:border-border-inverse"
                  }`}
                >
                  <img
                    loading="lazy"
                    decoding="async"
                    src={imgUrl ? optimizeImageUrl(imgUrl, 200) : undefined}
                    alt={`${product.title} - ảnh thu nhỏ ${thumbIdx + 1}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          </figure>

          {/* Main info & Product details combined */}
          <section className="bg-bg-surface pt-[10px] pb-4 px-[10px] sm:px-[15px] !mb-[5px] rounded-lg border border-border-color text-left">
            <div className="space-y-3 pb-1 border-b border-border-color/60">
              <h2 className="text-[18px] sm:text-[20px] font-playfair font-bold text-text-primary flex items-center gap-2">
                {product.title}
              </h2>

              <div className="flex items-center justify-between pb-0">
                <p className="text-xs text-text-secondary flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{product.street ? `${product.street}, ` : ''}{product.district ? formatLocationName(product.district) : "Thảo Điền, Quận 2"}</span>
                </p>
                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="flex items-center justify-center p-2 rounded-full text-text-secondary hover:text-text-primary bg-bg-base/50 hover:bg-slate-700 transition-colors active:scale-95"
                    title="Chia sẻ sản phẩm"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  {showShareMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-bg-base border border-border-inverse rounded-lg shadow-xl py-2 z-50 animate-in fade-in zoom-in duration-200">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          alert("Đã copy link!");
                          setShowShareMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-text-secondary hover:bg-slate-700 hover:text-text-primary flex items-center gap-2 border-none bg-transparent cursor-pointer"
                      >
                        <LinkIcon className="w-4 h-4" /> Sao chép link
                      </button>
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full px-4 py-2 text-left text-sm text-text-secondary hover:bg-slate-700 hover:text-text-primary flex items-center gap-2 no-underline"
                        onClick={() => setShowShareMenu(false)}
                      >
                        <Facebook className="w-4 h-4 text-info" /> Facebook
                      </a>
                      <a
                        href={`https://zalo.me/share?url=${encodeURIComponent(window.location.href)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full px-4 py-2 text-left text-sm text-text-secondary hover:bg-slate-700 hover:text-text-primary flex items-center gap-2 no-underline"
                        onClick={() => setShowShareMenu(false)}
                      >
                        <MessageCircle className="w-4 h-4 text-info" /> Zalo
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 !mt-[10px] pb-0 border-b border-border-color/60">
              <div className="space-y-0.5 h-12">
                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">
                  {product.type === "rent" ? "Giá thuê" : "Giá bán"}
                </span>
                <p className="font-display font-extrabold text-base text-primary truncate">
                  {product.priceText}
                </p>
              </div>

              {product.area ? (
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">
                    Diện tích
                  </span>
                  <p className="font-display font-semibold text-[13px] md:text-sm text-text-primary">
                    {product.area} m²
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">
                    Diện tích
                  </span>
                  <p className="font-display font-semibold text-[13px] md:text-sm text-text-primary">
                    -
                  </p>
                </div>
              )}

              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">
                  Liên hệ
                </span>
                <p className="font-display font-semibold text-[13px] md:text-sm text-text-primary">
                  <a
                    href="tel:0932966700"
                    className="hover:text-primary transition-colors"
                  >
                    0932 966 700
                  </a>
                </p>
              </div>
            </div>

            <section className="mt-4 space-y-4">
              <h2 className="font-display font-bold text-[13px] md:text-[13px] md:text-[13px] md:text-[13px] md:text-[13px] md:text-[13px] md:text-[13px] md:text-[13px] md:text-sm text-text-secondary !pb-0 !mb-[5px] border-b border-border-color">
                Đặc điểm sản phẩm
              </h2>

              <div className="grid grid-cols-2 gap-y-3 gap-x-3 sm:gap-x-4 text-[13px] !pt-[5px]">
                {product.priceText && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sm:justify-start sm:gap-6 border-b border-border-color/30 pb-1 sm:pb-[2px]">
                    <div className="flex items-center gap-1.5 text-text-secondary w-full sm:w-24 shrink-0 mb-1 sm:mb-0">
                      <Tag className="w-3 h-3 text-primary" />
                      <span className="text-[11px] sm:text-[13px]">
                        {product.type === "rent" ? "Giá thuê" : "Giá bán"}
                      </span>
                    </div>
                    <span className="text-text-primary font-semibold text-left text-xs sm:text-[13px] line-clamp-1">
                      {product.priceText}
                    </span>
                  </div>
                )}
                {product.area && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sm:justify-start sm:gap-6 border-b border-border-color/30 pb-1 sm:pb-[2px]">
                    <div className="flex items-center gap-1.5 text-text-secondary w-full sm:w-24 shrink-0 mb-1 sm:mb-0">
                      <Layers className="w-4 h-4 text-primary" />
                      <span className="text-[11px] sm:text-[13px]">
                        Diện tích
                      </span>
                    </div>
                    <span className="text-text-primary font-semibold text-left text-xs sm:text-[13px] line-clamp-1">
                      {product.area} m²
                    </span>
                  </div>
                )}
                {product.bedrooms && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sm:justify-start sm:gap-6 border-b border-border-color/30 pb-1 sm:pb-[2px]">
                    <div className="flex items-center gap-1.5 text-text-secondary w-full sm:w-24 shrink-0 mb-1 sm:mb-0">
                      <Bookmark className="w-4 h-4 text-primary" />
                      <span className="text-[11px] sm:text-[13px]">
                        Phòng ngủ
                      </span>
                    </div>
                    <span className="text-text-primary font-semibold text-left text-xs sm:text-[13px] line-clamp-1">
                      {product.bedrooms} PN
                    </span>
                  </div>
                )}
                {product.toilets && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sm:justify-start sm:gap-6 border-b border-border-color/30 pb-1 sm:pb-[2px]">
                    <div className="flex items-center gap-1.5 text-text-secondary w-full sm:w-24 shrink-0 mb-1 sm:mb-0">
                      <Bath className="w-4 h-4 text-primary" />
                      <span className="text-[11px] sm:text-[13px]">
                        Phòng vệ sinh
                      </span>
                    </div>
                    <span className="text-text-primary font-semibold text-left text-xs sm:text-[13px] line-clamp-1">
                      {product.toilets} WC
                    </span>
                  </div>
                )}
                {product.floors && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sm:justify-start sm:gap-6 border-b border-border-color/30 pb-1 sm:pb-[2px]">
                    <div className="flex items-center gap-1.5 text-text-secondary w-full sm:w-24 shrink-0 mb-1 sm:mb-0">
                      <Building2 className="w-4 h-4 text-primary" />
                      <span className="text-[11px] sm:text-[13px]">Số tầng</span>
                    </div>
                    <span className="text-text-primary font-semibold text-left text-xs sm:text-[13px] line-clamp-1">
                      {product.floors}
                    </span>
                  </div>
                )}
                {product.direction && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sm:justify-start sm:gap-6 border-b border-border-color/30 pb-1 sm:pb-[2px]">
                    <div className="flex items-center gap-1.5 text-text-secondary w-full sm:w-24 shrink-0 mb-1 sm:mb-0">
                      <Compass className="w-4 h-4 text-primary" />
                      <span className="text-[11px] sm:text-[13px]">
                        Hướng nhà
                      </span>
                    </div>
                    <span className="text-text-primary font-semibold text-left text-xs sm:text-[13px] line-clamp-1">
                      {product.direction}
                    </span>
                  </div>
                )}
                {(product as any).frontage && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sm:justify-start sm:gap-6 border-b border-border-color/30 pb-1 sm:pb-[2px]">
                    <div className="flex items-center gap-1.5 text-text-secondary w-full sm:w-24 shrink-0 mb-1 sm:mb-0">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-[11px] sm:text-[13px]">Mặt tiền</span>
                    </div>
                    <span className="text-text-primary font-semibold text-left text-xs sm:text-[13px] line-clamp-1">
                      {(product as any).frontage}m
                    </span>
                  </div>
                )}
                {product.legalStatus && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sm:justify-start sm:gap-6 border-b border-border-color/30 pb-1 sm:pb-[2px]">
                    <div className="flex items-center gap-1.5 text-text-secondary w-full sm:w-24 shrink-0 mb-1 sm:mb-0">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span className="text-[11px] sm:text-[13px]">Pháp lý</span>
                    </div>
                    <span className="text-text-primary font-semibold text-left text-xs sm:text-[13px] line-clamp-1">
                      {product.legalStatus}
                    </span>
                  </div>
                )}
                {(product as any).interior && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sm:justify-start sm:gap-6 border-b border-border-color/30 pb-1 sm:pb-[2px]">
                    <div className="flex items-center gap-1.5 text-text-secondary w-full sm:w-24 shrink-0 mb-1 sm:mb-0">
                      <Armchair className="w-4 h-4 text-primary" />
                      <span className="text-[11px] sm:text-[13px]">Nội thất</span>
                    </div>
                    <span className="text-text-primary font-semibold text-left text-xs sm:text-[13px] line-clamp-1" title={(product as any).interior}>
                      {(product as any).interior}
                    </span>
                  </div>
                )}
              </div>
            </section>
          </section>

          {/* 2 Tabs: details/description, map representation */}
          <section className="space-y-4 text-left">
            <div role="tablist" aria-label="Chi tiết sản phẩm" className="flex border-b border-border-color pb-px gap-1 !mb-[10px] !pb-0 h-[35px] !pt-[5px]">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "desc"}
                aria-controls="panel-desc"
                id="tab-desc"
                onClick={() => setActiveTab("desc")}
                className={`text-sm font-semibold tracking-wider relative cursor-pointer !py-0 !px-[5px] text-center h-[30px] ${
                  activeTab === "desc"
                    ? "text-primary font-bold"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Thông tin chi tiết
                {activeTab === "desc" && (
                  <div className="absolute bottom-0 inset-x-0 mx-auto bg-primary w-full text-center !h-[1px]" />
                )}
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "map"}
                aria-controls="panel-map"
                id="tab-map"
                onClick={() => setActiveTab("map")}
                className={`text-sm font-semibold tracking-wider relative cursor-pointer text-center !px-[5px] !py-0 h-[30px] ${
                  activeTab === "map"
                    ? "text-primary font-bold"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Vị trí
                {activeTab === "map" && (
                  <div className="absolute bottom-0 inset-x-0 mx-auto bg-primary w-full text-center !h-[1px]" />
                )}
              </button>
            </div>

            <div
              className={`bg-bg-surface border border-border-color rounded-lg min-h-[160px] ${activeTab === "map" ? "p-[1px]" : "!pt-[15px] !pb-[10px] !px-[5px]"}`}
            >
              <div 
                role="tabpanel" 
                id="panel-desc"
                aria-labelledby="tab-desc"
                style={{ display: activeTab === "desc" ? "block" : "none" }}
              >
                {product.description ? (
                  <div
                    className="prose prose-invert max-w-none text-text-secondary text-[13px] md:text-[15px] overflow-x-auto leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : (
                  <p className="text-text-secondary text-xs italic">
                    Không có tài liệu thuyết minh đi kèm.
                  </p>
                )}

                {relatedCategoryProducts.length > 0 && (
                  <div className="flex items-center !pb-0 !mt-[10px] !pt-[15px] !pl-[10px]">
                    <span className="text-text-primary text-[13px] mr-1.5 font-medium">
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
                      <span className="text-[13px] text-primary group-hover:text-primary group-hover:underline">
                        {product.category} ({relatedCategoryProducts.length})
                      </span>
                    </button>
                  </div>
                )}
              </div>

              <div
                role="tabpanel"
                id="panel-map"
                aria-labelledby="tab-map"
                className="w-full"
                style={{ display: activeTab === "map" ? "block" : "none" }}
              >
                <MapViewer
                  mapHtml={product.mapHtml}
                  address={`${product.title}, ${product.street ? product.street + ', ' : ''}${product.district ? formatLocationName(product.district) : ''}`}
                />
              </div>

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
          </section>
        </section>

        {/* =========================================================
            COLUMN 2 (Middle/Right): Sticky Consultation Box + Sidebar
            ========================================================= */}
        <section
          className={`lg:col-span-3 space-y-6 lg:sticky self-start transition-all duration-300 ${scrollDirection === 'down' ? 'lg:top-[10px]' : 'lg:top-[50px]'}`}
          id="detail-pane-right"
        >
          <div className="bg-bg-surface border border-primary/40 p-4 sm:p-6 rounded-lg space-y-3 relative text-left h-auto min-h-[300px]">
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
                  className="h-16 w-16 rounded-full object-cover border-2 border-primary/50"
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.currentTarget.onerror = null;
                    const target = e.target as HTMLImageElement;
                    target.src =
                      "/cv-image.svg";
                  }}
                />
                <h3 className="text-primary font-display font-bold text-[15px] tracking-wide m-0 p-0">
                  Tư vấn mua nhà chuyên sâu
                </h3>
              </div>
            </div>

            {/* Premium bullet points with green checkmarks from the mockup */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-text-secondary leading-relaxed">
                  Phân tích quỹ căn, chính sách, tiện ích giúp Khách hàng lựa
                  chọn căn tốt nhất.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-text-secondary leading-relaxed">
                  Giải đáp mọi thắc mắc của khách hàng.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-text-secondary leading-relaxed">
                  Tuyệt đối bảo mật thông tin cá nhân.
                </p>
              </div>
            </div>

            {/* Assistance secondary utilities underneath */}
            <div className="pt-4 flex flex-col gap-2">
              <a
                href="tel:0932966700"
                className="flex-1 bg-gradient-to-br from-[#0f9b0f] to-[#00b894] hover:brightness-110 shadow-[0_4px_15px_rgba(15,155,15,0.4)] py-2 px-2 rounded-full text-white font-bold transition-all flex items-center justify-center gap-1.5 border border-border-inverse uppercase tracking-wide"
              >
                <Phone className="w-3.5 h-3.5 drop-shadow-md fill-white" />
                <span className="text-[10px]">0932 966 700</span>
              </a>
              <a
                href="https://zalo.me/0932966700"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-gradient-to-br from-[#0068ff] to-[#00a8ff] hover:brightness-110 shadow-[0_4px_15px_rgba(0,104,255,0.4)] py-2 px-2 rounded-full text-white font-bold transition-all flex items-center justify-center gap-1.5 border border-border-inverse uppercase tracking-wide"
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
        </section>

        {/* =========================================================
            COLUMN 3 (Right): Covers 3 grid column widths (lg:col-span-3 - STICKY)
            ========================================================= */}
        <section
          className={`lg:col-span-3 space-y-6 lg:sticky self-start transition-all duration-300 ${scrollDirection === 'down' ? 'lg:top-[10px]' : 'lg:top-[50px]'}`}
          id="detail-pane-far-right"
        >
          {/* Categories with real-time uploading counts */}
          <div className="bg-bg-surface border border-border-color py-2.5 px-[15px] rounded-lg space-y-4 shadow-xl text-left">
            <h4 className="text-text-primary text-sm font-bold tracking-wider pt-0 pb-[2px] mb-[5px] border-b border-border-color">
              Danh Mục Sản Phẩm
            </h4>

            <div className="space-y-2">
              {categoryHierarchy.length === 0 ? (
                <div className="text-text-secondary text-xs py-2 text-left">Đang đối chiếu dữ liệu danh mục...</div>
              ) : (
                categoryHierarchy.map(parent => {
                  const isExpanded = expandedCategories[parent.name];
                  return (
                  <div key={parent.name} className="border-b border-black/10 last:border-0 pb-2 mb-2 last:pb-0 last:mb-0">
                    <div
                      onClick={() => onNavigate({ screen: "category-product", categoryName: parent.name })}
                      className="flex justify-between items-center text-xs font-bold text-text-secondary hover:text-primary cursor-pointer pt-1 pb-1 transition-colors"
                    >
                      <span className="truncate flex items-center gap-1.5 flex-1">
                        <FolderOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{parent.name}</span>
                        <span className="bg-bg-surface px-2 py-0.5 rounded-full text-[9px] font-mono text-text-secondary shrink-0">
                          ({parent.totalCount})
                        </span>
                      </span>
                      {parent.children.length > 0 && (
                        <div 
                          className="px-2 py-1 ml-1 hover:bg-black/5 rounded cursor-pointer"
                          onClick={(e) => toggleCategory(parent.name, e)}
                        >
                          <ChevronDown className={`w-3.5 h-3.5 text-text-secondary transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      )}
                    </div>
                    {parent.children.length > 0 && isExpanded && (
                      <div className="pl-3 space-y-1 mt-1 border-l border-border-color ml-1.5">
                        {parent.children.map(child => (
                          <div
                            key={child.name}
                            onClick={() => onNavigate({ screen: "category-product", categoryName: child.name })}
                            className="flex justify-between items-center text-xs text-text-secondary hover:text-primary cursor-pointer py-1 transition-colors relative before:content-[''] before:absolute before:-left-[13px] before:top-1/2 before:w-2.5 before:border-t before:border-border-color"
                          >
                            <span className="truncate flex items-center gap-1">
                              <Tag className="w-3 h-3 text-primary/70 shrink-0" />
                              <span className="truncate">{child.name}</span>
                            </span>
                            <span className="bg-bg-surface px-1.5 py-0.5 rounded-full text-[9px] font-mono text-text-secondary shrink-0">
                              ({child.count})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )})
              )}
            </div>
          </div>

          {/* Quick Price Range Filters widget */}
          <div className="bg-bg-surface border border-border-color py-2.5 px-[15px] rounded-lg space-y-3 shadow-xl text-left">
            <h4 className="text-text-primary text-sm font-bold tracking-wider pb-0 mb-[5px] border-b border-border-color">
              Khoảng giá
            </h4>

            <div className="space-y-1.5 text-xs">
              <button
                onClick={() =>
                  onNavigate({ screen: "san-pham", priceRange: "under3" })
                }
                className="block w-full text-left text-text-secondary hover:text-primary py-1 cursor-pointer bg-transparent border-none"
              >
                • Dưới 3 Tỷ
              </button>
              <button
                onClick={() =>
                  onNavigate({ screen: "san-pham", priceRange: "3to5" })
                }
                className="block w-full text-left text-text-secondary hover:text-primary py-1 cursor-pointer bg-transparent border-none"
              >
                • Từ 3 Tỷ đến 5 Tỷ
              </button>
              <button
                onClick={() =>
                  onNavigate({ screen: "san-pham", priceRange: "5to10" })
                }
                className="block w-full text-left text-text-secondary hover:text-primary py-1 cursor-pointer bg-transparent border-none"
              >
                • Từ 5 Tỷ đến 10 Tỷ
              </button>
              <button
                onClick={() =>
                  onNavigate({ screen: "san-pham", priceRange: "10to20" })
                }
                className="block w-full text-left text-text-secondary hover:text-primary py-1 cursor-pointer bg-transparent border-none"
              >
                • Từ 10 Tỷ đến 20 Tỷ
              </button>
              <button
                onClick={() =>
                  onNavigate({ screen: "san-pham", priceRange: "20to50" })
                }
                className="block w-full text-left text-text-secondary hover:text-primary py-1 cursor-pointer bg-transparent border-none"
              >
                • Từ 20 Tỷ đến 50 Tỷ
              </button>
              <button
                onClick={() =>
                  onNavigate({ screen: "san-pham", priceRange: "over50" })
                }
                className="block w-full text-left text-text-secondary hover:text-primary py-1 cursor-pointer bg-transparent border-none"
              >
                • Trên 50 Tỷ
              </button>
            </div>
          </div>

          {/* Sizing options counts widget */}
          <div className="bg-bg-surface border border-border-color py-2.5 px-[15px] rounded-lg space-y-3 shadow-xl text-left mb-5">
            <h4 className="text-text-primary text-sm font-bold tracking-wider pb-0 mb-[5px] border-b border-border-color">
              Diện tích
            </h4>

            <div className="space-y-1.5 text-xs">
              <button
                onClick={() =>
                  onNavigate({ screen: "san-pham", areaRange: "under100" })
                }
                className="block w-full text-left text-text-secondary hover:text-primary py-1 cursor-pointer bg-transparent border-none"
              >
                • Dưới 100 m²
              </button>
              <button
                onClick={() =>
                  onNavigate({ screen: "san-pham", areaRange: "100to300" })
                }
                className="block w-full text-left text-text-secondary hover:text-primary py-1 cursor-pointer bg-transparent border-none"
              >
                • Từ 100 m² đến 300 m²
              </button>
              <button
                onClick={() =>
                  onNavigate({ screen: "san-pham", areaRange: "300to500" })
                }
                className="block w-full text-left text-text-secondary hover:text-primary py-1 cursor-pointer bg-transparent border-none"
              >
                • Từ 300 m² đến 500 m²
              </button>
              <button
                onClick={() =>
                  onNavigate({ screen: "san-pham", areaRange: "over500" })
                }
                className="block w-full text-left text-text-secondary hover:text-primary py-1 cursor-pointer bg-transparent border-none"
              >
                • Trên 500 m²
              </button>
            </div>
          </div>

          {/* Area options widget */}
          <div className="bg-bg-surface border border-border-color py-2.5 px-[15px] rounded-lg space-y-3 shadow-xl text-left">
            <h4 className="text-text-primary text-sm font-bold tracking-wider pb-0 mb-[5px] border-b border-border-color">
              Khu vực
            </h4>

            <div className="space-y-2">
              {locationEntries.length > 0 ? (
                locationEntries.map(([provName, info]) => {
                  const hasDistricts = Object.keys(info.districts).length > 0;
                  const isExpanded = expandedLocations[provName];
                  return (
                  <div key={provName} className="border-b border-black/10 last:border-0 pb-2 mb-2 last:pb-0 last:mb-0">
                    <div
                      onClick={() => onNavigate({ screen: "san-pham", location: provName })}
                      className="flex justify-between items-center text-xs font-bold text-text-secondary hover:text-primary cursor-pointer pt-1 pb-1 transition-colors"
                    >
                      <span className="truncate flex items-center gap-1.5 flex-1">
                        <FolderOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{provName}</span>
                        <span className="text-[9px] font-mono text-text-secondary bg-bg-surface px-1.5 py-0.5 rounded-full shrink-0">
                          ({info.count})
                        </span>
                      </span>
                      {hasDistricts && (
                        <div 
                          className="px-2 py-1 ml-1 hover:bg-black/5 rounded cursor-pointer"
                          onClick={(e) => toggleLocation(provName, e)}
                        >
                          <ChevronDown className={`w-3.5 h-3.5 text-text-secondary transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      )}
                    </div>
                    {hasDistricts && isExpanded && (
                      <div className="pl-3 space-y-1 mt-1 border-l border-border-color ml-1.5">
                        {Object.entries(info.districts).sort((a, b) => b[1] - a[1]).map(([distName, cnt]) => (
                          <div
                            key={distName}
                            onClick={() => onNavigate({ screen: "san-pham", location: distName })}
                            className="flex justify-between items-center text-xs text-text-secondary hover:text-primary cursor-pointer py-1 transition-colors relative before:content-[''] before:absolute before:-left-[13px] before:top-1/2 before:w-2.5 before:border-t before:border-border-color"
                          >
                            <span className="truncate flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-primary/70 shrink-0" />
                              <span className="truncate">{distName}</span>
                            </span>
                            <span className="text-[9px] font-mono text-text-secondary bg-bg-surface px-1.5 py-0.5 rounded-full shrink-0">
                              ({cnt})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )})
              ) : (
                <div className="text-text-secondary text-xs italic py-2">
                  Chưa có dữ liệu khu vực
                </div>
              )}
            </div>
          </div>
        </section>
      </section>

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
          <h2 className="text-[15px] font-display font-medium text-text-primary border-l-4 border-primary pl-3">
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
              <div className="flex w-full justify-center border-t border-border-color/50 pt-8 mt-4">
                <button
                  onClick={() => setRecentGridLimit((prev) => prev + 5)}
                  className="bg-transparent border border-primary text-primary hover:bg-[#064E3B]/10 text-xs font-semibold px-6 py-3 rounded-md cursor-pointer transition-colors"
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
        <h2 className="text-[15px] font-display font-medium text-text-primary border-l-4 border-primary pl-3">
          Tin Bán mới nhất
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {footerLatestSales.slice(0, 5).map((item) => (
            <div key={item.id} className="w-full">
              <ProductCard
                item={item}
                onNavigate={onNavigate}
              />
            </div>
          ))}
        </div>
        <div className="flex w-full justify-center border-t border-border-color/50 pt-8 mt-4">
          <button
            onClick={() => onNavigate({ screen: "latest-sales" })}
            className="bg-transparent border border-primary text-primary hover:bg-[#064E3B]/10 text-xs font-semibold px-6 py-3 rounded-md cursor-pointer transition-colors text-[10px] !py-[5px] !px-[15px]"
          >
            Xem tất cả BĐS Bán
          </button>
        </div>
      </section>

      {/* 3. Newest Rents Slider (horizontal) */}
      <section className="space-y-6 text-left" id="detail-bottom-rents">
        <h2 className="text-[15px] font-display font-medium text-text-primary border-l-4 border-primary pl-3">
          Tin Cho thuê mới nhất
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {footerLatestRents.slice(0, 5).map((item) => (
            <div key={item.id} className="w-full">
              <ProductCard
                item={item}
                onNavigate={onNavigate}
              />
            </div>
          ))}
        </div>
        <div className="flex w-full justify-center border-t border-border-color/50 pt-8 mt-4">
          <button
            onClick={() => onNavigate({ screen: "latest-rents" })}
            className="bg-transparent border border-primary text-primary hover:bg-[#064E3B]/10 text-xs font-semibold px-6 py-3 rounded-md cursor-pointer transition-colors text-[10px] !pt-[5px] !pb-[6px] !px-[15px]"
          >
            Xem tất cả BĐS Cho thuê
          </button>
        </div>
      </section>

      {/* 4. Featured Projects Slider (horizontal) */}
      <section className="space-y-6 text-left pb-0" id="detail-bottom-projects">
        <div className="flex items-end justify-between pb-2 border-b border-border-inverse mb-4">
          <h2 className="text-[15px] font-display font-medium text-text-primary border-l-4 border-primary pl-3 m-0">
            Dự án nổi bật
          </h2>
          <button
            type="button"
            onClick={() => onNavigate({ screen: "du-an" })}
            className="flex items-center gap-1.5 text-[9px] uppercase font-mono tracking-widest text-primary font-bold hover:underline bg-transparent border-none cursor-pointer p-0"
          >
            <span>Xem thêm →</span>
          </button>
        </div>

        <div className="relative overflow-hidden py-4 w-full">
          <style>{`
            @keyframes sliderScrollProductDetail {
              0% { transform: translateX(0); }
              100% { transform: translateX(calc(-16.666666%)); }
            }
            .animate-product-detail-slider {
              animation: sliderScrollProductDetail 15s linear infinite;
            }
            .animate-product-detail-sliding-container:hover .animate-product-detail-slider {
              animation-play-state: paused;
            }
          `}</style>
          <div className="animate-product-detail-sliding-container flex w-max">
            <div className="flex w-max animate-product-detail-slider">
              {[...Array(6)].flatMap(() => projects.slice(0, 5)).map((p, idx) => {
                let statusText = "Đang mở bán";
                if (p.status === "handed-over") statusText = "Đã bàn giao";
                if (p.status === "coming_soon") statusText = "Sắp ra mắt";

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
                      <div className="absolute top-0 left-0 px-2.5 py-1 bg-[#0f9b0f] text-white text-[11px] font-bold rounded-none rounded-br-lg shadow-sm z-10">
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

      {/* Lightbox Overlay */}
      {isLightboxOpen && typeof document !== "undefined" && createPortal(
        <section className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center animate-in fade-in" style={{ zIndex: 99999 }}>
          <button 
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 z-[210] p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-sm transition-all"
          >
            <X className="w-6 h-6 md:w-8 md:h-8" />
          </button>
          
          <figure className="relative w-full max-w-6xl max-h-[90vh] flex items-center justify-center px-4">
            <img 
              src={selectedImage}
              alt={product.title}
              className="max-w-full max-h-[90vh] object-contain select-none"
            />
            
            {currentImages.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-sm transition-all"
                >
                  <ChevronLeft className="w-8 h-8 md:w-12 md:h-12" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-sm transition-all"
                >
                  <ChevronRight className="w-8 h-8 md:w-12 md:h-12" />
                </button>
              </>
            )}
          </figure>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-sm">
            {currentImages.indexOf(selectedImage) + 1} / {currentImages.length}
          </div>
        </section>,
        document.body
      )}

    </article>
  );
}
