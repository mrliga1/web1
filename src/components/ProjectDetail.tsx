import React, { useState, useEffect, useRef, useMemo } from "react";
import { generateSlug } from "../lib/utils";
import { doc, getDoc, getDocs, collection, addDoc, db } from "../firebase";
import { Project, RouteState } from "../types";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  MapPin,
  Building2,
  Phone,
  Calendar,
  Compass,
  ShieldCheck,
  Heart,
  Share2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  FileText,
  LayoutGrid,
  Newspaper,
  Leaf,
  Layers,
  Banknote,
  HelpCircle,
  Facebook,
  Link as LinkIcon,
  MessageCircle,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { optimizeImageUrl, generateSrcSet } from '../lib/utils';
import { parseSlugTitleFromPath, resolveItemTitle } from "../lib/documentHead";
import AdBanner from "./AdBanner";
import ProductCard from "./ProductCard";
import StarRatingInteractive from "./StarRatingInteractive";
import { useScrollDirection } from "../hooks/useScrollDirection";

interface ProjectDetailProps {
  projectId: string;
  slug?: string;
  onNavigate: (route: RouteState) => void;
  onShowNotification: (message: string, type: "success" | "error") => void;
  logoUrl?: string;
}

import { notifyAdminEmail } from "../lib/email";
import { fetchClientIp } from "../lib/ip";

export default function ProjectDetail({
  projectId,
  slug,
  onNavigate,
  onShowNotification,
  logoUrl,
}: ProjectDetailProps) {
  const [project, setProject] = useState<Project | null>(() => {
    if (
      typeof window !== "undefined" &&
      (window.__SERVER_DATA__?.project?.id === projectId ||
       (slug && generateSlug(window.__SERVER_DATA__?.project?.title) === slug))
    ) {
      return window.__SERVER_DATA__.project;
    }
    return null;
  });
  const [relatedProjects, setRelatedProjects] = useState<Project[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [relatedNews, setRelatedNews] = useState<any[]>([]);
  const [targetNewsCategory, setTargetNewsCategory] = useState<string>("");
  const [targetProductCategory, setTargetProductCategory] =
    useState<string>("");
  const [loading, setLoading] = useState(!project);
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "location"
    | "amenity"
    | "floor-plan"
    | "price"
    | "news"
    | "contact"
  >("overview");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isSubdivisionExpanded, setIsSubdivisionExpanded] = useState(false);
  const [isLocationExpanded, setIsLocationExpanded] = useState(false);
  const [isAmenityExpanded, setIsAmenityExpanded] = useState(false);
  const [isFloorPlanExpanded, setIsFloorPlanExpanded] = useState(false);
  const [isPriceExpanded, setIsPriceExpanded] = useState(false);
  const [isQaExpanded, setIsQaExpanded] = useState(false);
  const [activeQaIndex, setActiveQaIndex] = useState<number | null>(0);
  const [currentFloorPlanImageIndex, setCurrentFloorPlanImageIndex] =
    useState(0);
  const [currentAmenityImageIndex, setCurrentAmenityImageIndex] = useState(0);
  const [currentFloorPlanTabId, setCurrentFloorPlanTabId] = useState<
    string | null
  >(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const scrollDirection = useScrollDirection();

  const hasSubdivisionContent = useMemo(() => {
    if (!project) return false;
    const hasCards =
      project.subdivisionsCards &&
      project.subdivisionsCards.some(
        (c) => c.name?.trim() || c.imageUrl?.trim(),
      );

    // Evaluate rich text content: checking for images or actual text after stripping tags
    const html = project.subdivisionTab || "";
    const plainText = html.replace(/<[^>]*>?/gm, "").trim();
    const hasImages =
      html.includes('<img loading="lazy" decoding="async"') ||
      html.includes("<iframe");
    const hasTab = !!(plainText || hasImages);

    return !!(hasCards || hasTab);
  }, [project]);

  const TABS = useMemo(() => {
    const defaultTabs = [
      { id: "overview", label: "Tổng quan", icon: FileText },
    ];
    if (hasSubdivisionContent) {
      defaultTabs.push({
        id: "subdivision",
        label: "Phân khu",
        icon: Building2,
      });
    }
    defaultTabs.push(
      { id: "location", label: "Vị trí", icon: MapPin },
      { id: "amenity", label: "Tiện ích", icon: Leaf },
      { id: "floor-plan", label: "Mặt bằng", icon: LayoutGrid },
      { id: "price", label: "Giá bán", icon: Banknote },
      { id: "qa", label: "Hỏi đáp", icon: HelpCircle },
      { id: "news", label: "Tin tức", icon: Newspaper },
      { id: "contact", label: "Liên hệ", icon: Phone },
    );
    return defaultTabs;
  }, [hasSubdivisionContent]);

  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveTab(entry.target.id as any);
          }
        });
      },
      {
        rootMargin: "-120px 0px -40% 0px", // Adjusted to catch sections better when scrolling
        threshold: 0,
      },
    );

    // Give it a small delay to ensure DOM layout is complete before observing
    const timer = setTimeout(() => {
      const validRefs: HTMLDivElement[] = [];
      sectionRefs.current.forEach((ref) => {
        if (ref) {
          observer.observe(ref);
          validRefs.push(ref);
        }
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [loading, project]);

  const handleTabClick = (id: string) => {
    setActiveTab(id as any);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 110;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  // Contact Form State
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientDemand, setClientDemand] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [agreePrivacy, setAgreePrivacy] = useState(true);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  // Auto-scroll track and thumbnails
  useEffect(() => {
    if (thumbnailContainerRef.current) {
      const container = thumbnailContainerRef.current;
      const thumbnail = container.children[currentImageIndex] as HTMLElement;
      if (thumbnail) {
        const scrollLeft =
          thumbnail.offsetLeft -
          container.clientWidth / 2 +
          thumbnail.clientWidth / 2;
        container.scrollTo({ left: scrollLeft, behavior: "smooth" });
      }
    }
  }, [currentImageIndex]);

  // Auto-scroll active tab into view
  useEffect(() => {
    const activeBtn = document.getElementById(`tab-btn-${activeTab}`);
    const container = document.getElementById("tab-navigation-container");
    if (activeBtn && container) {
      const scrollLeft =
        activeBtn.offsetLeft -
        container.clientWidth / 2 +
        activeBtn.clientWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [activeTab]);

  const [isGalleryAutoplayPaused, setIsGalleryAutoplayPaused] = useState(true);
  const [isFloorPlanAutoplayPaused, setIsFloorPlanAutoplayPaused] =
    useState(true);
  const [isAmenityAutoplayPaused, setIsAmenityAutoplayPaused] = useState(true);

  // Gallery Autoplay
  useEffect(() => {
    const galleryCount = [
      project?.imageUrl,
      ...(project?.imageUrls || []),
    ].filter(Boolean).length;
    if (galleryCount <= 1 || isGalleryAutoplayPaused) return;

    const intervalId = setInterval(() => {
      setCurrentImageIndex((prev) =>
        prev === galleryCount - 1 ? 0 : prev + 1,
      );
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(intervalId);
  }, [project, isGalleryAutoplayPaused]);

  // Floor Plan Autoplay
  useEffect(() => {
    if (
      !project?.floorPlanImages ||
      project.floorPlanImages.length <= 1 ||
      isFloorPlanAutoplayPaused
    )
      return;

    const intervalId = setInterval(() => {
      setCurrentFloorPlanImageIndex((prev) =>
        prev === project.floorPlanImages!.length - 1 ? 0 : prev + 1,
      );
    }, 3500); // Change image every 3.5 seconds

    return () => clearInterval(intervalId);
  }, [project, isFloorPlanAutoplayPaused]);

  // Amenity Autoplay
  useEffect(() => {
    if (
      !project?.amenityImages ||
      project.amenityImages.length <= 1 ||
      isAmenityAutoplayPaused
    )
      return;

    const intervalId = setInterval(() => {
      setCurrentAmenityImageIndex((prev) =>
        prev === project.amenityImages!.length - 1 ? 0 : prev + 1,
      );
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(intervalId);
  }, [project, isAmenityAutoplayPaused]);

  useEffect(() => {
    async function loadProject() {
      try {
        if (!project) setLoading(true);
        let fetchedProject: Project | null = project;
        let finalProjectId = projectId;

        if (finalProjectId) {
          const docRef = doc(db, "projects", finalProjectId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            fetchedProject = { id: docSnap.id, ...docSnap.data() } as Project;
          }
        } else if (slug) {
          const projCol = collection(db, "projects");
          const projSnap = await getDocs(projCol);
          for (const doc of projSnap.docs) {
            const data = doc.data();
            if (generateSlug(data.title) === slug) {
              fetchedProject = { id: doc.id, ...data } as Project;
              finalProjectId = doc.id;
              break;
            }
          }
          if (!fetchedProject) {
            try {
              const docRef = doc(db, "projects", slug);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                fetchedProject = { id: docSnap.id, ...docSnap.data() } as Project;
                finalProjectId = docSnap.id;
              }
            } catch (e) {
              // Ignore invalid ID errors
            }
          }
        }

        if (fetchedProject) {
          window.scrollTo(0, 0);
          setProject(fetchedProject);
          if (
            fetchedProject.floorPlanTabs &&
            fetchedProject.floorPlanTabs.length > 0 &&
            !currentFloorPlanTabId
          ) {
            setCurrentFloorPlanTabId(fetchedProject.floorPlanTabs[0].id);
          }

          // Fetch related news (filter by newsCategoryUrl if provided)
          const newsSnap = await getDocs(collection(db, "news"));
          const newsList: any[] = [];

          let targetCategory = "";
          if (fetchedProject.newsCategoryUrl) {
            targetCategory = fetchedProject.newsCategoryUrl.trim();
            // Tries to parse categoryName if it looks like a URL
            try {
              const urlMatch = targetCategory.match(/categoryName=([^&]+)/);
              if (urlMatch && urlMatch[1]) {
                targetCategory = decodeURIComponent(urlMatch[1]).trim();
              }
            } catch (e) {
              console.error(
                "Failed to parse categoryName from project newsCategoryUrl",
                e,
              );
            }
          }
          setTargetNewsCategory(targetCategory);

          newsSnap.forEach((doc) => {
            const data = doc.data();
            if (
              data.approvalStatus !== "rejected" &&
              data.title?.trim() &&
              data.description?.trim()
            ) {
              if (targetCategory && targetCategory.length > 0) {
                // Filter by category exactly
                if (
                  data.category &&
                  data.category.toLowerCase() === targetCategory.toLowerCase()
                ) {
                  newsList.push({ id: doc.id, ...data });
                }
              } else {
                // Default: add everything
                newsList.push({ id: doc.id, ...data });
              }
            }
          });
          setRelatedNews(newsList.slice(0, 6));

          // Fetch related products (filter by productCategoryUrl if provided)
          const productsSnap = await getDocs(collection(db, "products"));
          const productsList: any[] = [];

          let targetProdCategory = "";
          if (fetchedProject.productCategoryUrl) {
            targetProdCategory = fetchedProject.productCategoryUrl.trim();
            // Tries to parse categoryName if it looks like a URL
            try {
              const prodUrlMatch =
                targetProdCategory.match(/categoryName=([^&]+)/);
              if (prodUrlMatch && prodUrlMatch[1]) {
                targetProdCategory = decodeURIComponent(prodUrlMatch[1]).trim();
              }
            } catch (e) {
              console.error(
                "Failed to parse categoryName from project productCategoryUrl",
                e,
              );
            }
          }
          setTargetProductCategory(targetProdCategory);

          productsSnap.forEach((prodDoc) => {
            const data = prodDoc.data();
            if (data.approvalStatus !== "rejected" && data.name?.trim()) {
              if (targetProdCategory && targetProdCategory.length > 0) {
                // Filter by category exactly
                if (
                  data.category &&
                  data.category.toLowerCase() ===
                    targetProdCategory.toLowerCase()
                ) {
                  productsList.push({ id: prodDoc.id, ...data });
                }
              } else {
                productsList.push({ id: prodDoc.id, ...data });
              }
            }
          });
          setRelatedProducts(productsList.slice(0, 5));

          // Fetch related projects
          const projSnap = await getDocs(collection(db, "projects"));
          const projList: Project[] = [];
          projSnap.forEach((doc) => {
            const data = doc.data();
            if (data.approvalStatus !== "rejected") {
              projList.push({ id: doc.id, ...data } as Project);
            }
          });
          setRelatedProjects(projList.slice(0, 5));
        } else {
          onShowNotification(
            "Dự án quy hoạch không tồn tại hoặc đã bị xóa.",
            "error",
          );
          onNavigate({ screen: "du-an" });
        }
      } catch (err) {
        console.error("Lỗi khi tải chi tiết dự án:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [projectId, slug]);

  const handleConsultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      onShowNotification(
        "Vui lòng điền họ tên và số điện thoại liên lạc.",
        "error",
      );
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
        propertyId: project?.id || projectId || slug || "unknown",
        propertyTitle: `Đăng ký xem dự án: ${project?.title}`,
        sourceUrl: friendlyUrl,
        ipAddress: clientIp,
      });

      notifyAdminEmail({
        name: clientName.trim(),
        phone: clientPhone.trim(),
        email: clientEmail.trim(),
        message: clientDemand.trim(),
        propertyTitle: `Đăng ký xem dự án: ${project?.title}`,
        sourceUrl: friendlyUrl,
      });

      setFormSubmitted(true);
      setClientName("");
      setClientPhone("");
      setClientEmail("");
      setClientDemand("");
      onShowNotification(
        "Đăng ký nhận lịch trình tham quan dự án thành công!",
        "success",
      );
    } catch (err) {
      console.error(err);
      onShowNotification(
        "Gặp sự cố khi gửi yêu cầu. Vui lòng liên hệ Hotline.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const mapContent = useMemo(() => {
    if (!project) return null;
    if (
      project.mapHtml &&
      (project.mapHtml.startsWith("<iframe") ||
        project.mapHtml.includes("google.com/maps"))
    ) {
      return (
        <div
          className="w-full aspect-[16/9] rounded-xl overflow-hidden border border-border-color shadow-inner bg-bg-surface [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0"
          dangerouslySetInnerHTML={{
            __html: project.mapHtml.includes("iframe")
              ? project.mapHtml
              : `<iframe src="${project.mapHtml}"></iframe>`,
          }}
        />
      );
    }
    if (project.location) {
      return (
        <div className="w-full aspect-[16/9] rounded-xl overflow-hidden border border-border-color shadow-inner bg-bg-surface [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0">
          <iframe
            src={`https://maps.google.com/maps?q=${encodeURIComponent(project.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
            frameBorder="0"
            scrolling="no"
            marginHeight={0}
            marginWidth={0}
          ></iframe>
        </div>
      );
    }
    return (
      <div className="bg-bg-surface aspect-[21/9] rounded-xl border border-border-color flex flex-col items-center justify-center p-6 text-center space-y-2">
        <MapPin className="w-8 h-8 text-primary/50 mb-2" />
        <h4 className="text-text-primary text-sm font-semibold">
          Chưa có bản đồ vị trí 1/500
        </h4>
        <p className="text-xs text-white/70 max-w-md">
          Vị trí chi tiết trên bản đồ vệ tinh đang được xác minh, quý khách vui
          lòng liên hệ Hotline bên dưới để nhận tài liệu file sơ đồ dự án.
        </p>
      </div>
    );
  }, [project?.mapHtml, project?.location]);

  const renderCustomSections = (position: string) => {
    if (!project?.customSections) return null;
    const sections = project.customSections.filter(
      (s) => s.position === position,
    );
    if (sections.length === 0) return null;

    return sections.map((sec, idx) => (
      <div
        key={`cs-${position}-${sec.id || idx}`}
        className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pt-8 mt-[-32px]"
      >
        <div className="space-y-6">
          <div className="relative">
            <div
              className="prose prose-invert max-w-none text-text-secondary text-[13px] md:text-[15px] overflow-x-auto overflow-y-hidden"
              dangerouslySetInnerHTML={{ __html: sec.content }}
            />
          </div>
        </div>
      </div>
    ));
  };

  const pageTitle = project
    ? resolveItemTitle(project, "Greenia Homes")
    : "Đang tải... | Greenia Homes";


  if (loading) {
    return (
      <>
        <div
          className="min-h-[100vh] flex flex-col justify-center items-center text-center space-y-4 max-w-sm mx-auto"
          id="project-detail-loading"
        >
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-secondary text-xs font-light">
            Đang mở tệp thông tin quy hoạch dự án...
          </p>
        </div>
      </>
    );
  }

  if (!project) return null;

  const galleryImages =
    project.imageUrls && project.imageUrls.length > 0
      ? project.imageUrls
      : [
          project.imageUrl ||
            "/no-image.svg",
          "/no-image.svg",
          "/no-image.svg",
          "/no-image.svg",
          "/no-image.svg",
        ];

  const rawBaseRating = project.baseRating || 5;
  const rawBaseCount = project.baseReviewCount || 0;
  const computedTotalStars =
    rawBaseRating * rawBaseCount + (project.userTotalRating || 0);
  const computedTotalCount = rawBaseCount + (project.userReviewCount || 0);
  const currentAvg =
    computedTotalCount === 0
      ? rawBaseRating
      : computedTotalStars / computedTotalCount;

  const schemaOrgJSONLD = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: project.title,
    image: galleryImages,
    description: (project.description || "")
      .replace(/<[^>]*>?/gm, "")
      .substring(0, 160),
    brand: {
      "@type": "Brand",
      name: project.developer || "Greenia",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: currentAvg.toFixed(1),
      reviewCount: computedTotalCount === 0 ? 1 : computedTotalCount,
    },
    offers: {
      "@type": "AggregateOffer",
      url: window.location.href,
      priceCurrency: "VND",
      lowPrice: "1000000000",
      highPrice: "10000000000",
      offerCount: "1",
    },
  };

  return (
    <div className="pb-10" id="project-detail-view-root">
      <Helmet>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content={
            project.seoDesc ||
            (project.description || "")
              .replace(/<[^>]*>?/gm, "")
              .substring(0, 160)
          }
        />
        {project.seoKeywords && (
          <meta name="keywords" content={project.seoKeywords} />
        )}
        <meta property="og:type" content="article" />
        <meta
          property="og:url"
          content={typeof window !== "undefined" ? window.location.href : ""}
        />
        <meta property="og:title" content={project.seoTitle || project.title} />
        <meta
          property="og:description"
          content={
            project.seoDesc ||
            (project.description || "")
              .replace(/<[^>]*>?/gm, "")
              .substring(0, 160)
          }
        />
        <meta property="og:image" content={galleryImages[0]?.startsWith('http') ? galleryImages[0] : `https://greeniahomes.vn${galleryImages[0]?.startsWith('/') ? galleryImages[0] : `/${galleryImages[0]}`}`} />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content={project.seoTitle || project.title} />
        <meta property="twitter:description" content={project.seoDesc || (project.description || "").replace(/<[^>]*>?/gm, "").substring(0, 160)} />
        <meta property="twitter:image" content={galleryImages[0]?.startsWith('http') ? galleryImages[0] : `https://greeniahomes.vn${galleryImages[0]?.startsWith('/') ? galleryImages[0] : `/${galleryImages[0]}`}`} />

        {/* Geo Meta Tags for Local SEO - Ho Chi Minh City */}
        <meta name="geo.region" content="VN-SG" />
        <meta name="geo.placename" content="Hồ Chí Minh, Việt Nam" />
        <meta name="geo.position" content="10.823099;106.629664" />
        <meta name="ICBM" content="10.823099, 106.629664" />
        <script type="application/ld+json">
          {JSON.stringify(schemaOrgJSONLD)}
        </script>
      </Helmet>

      {/* Top Banner (Photo Gallery/Slider) */}
      <div
        className="relative w-full h-[50vh] sm:h-[60vh] md:h-[75vh] lg:h-[85vh] bg-slate-900 border-t border-border-color overflow-hidden group"
        onMouseEnter={() => setIsGalleryAutoplayPaused(true)}
      >
        {/* Background blur for active image */}
        <div
          className="absolute inset-0 bg-cover bg-center blur-2xl opacity-70 transition-all duration-700"
          style={{
            backgroundImage: `url(${galleryImages[currentImageIndex]})`,
          }}
        />

        {/* Absolute Centered Carousel */}
        <div className="relative w-full h-full flex items-center justify-center z-10">
          {galleryImages.map((img, idx) => {
            const offset =
              (idx - currentImageIndex + galleryImages.length) %
              galleryImages.length;
            const isCenter = offset === 0;
            const isPrev = offset === galleryImages.length - 1;
            const isNext = offset === 1;

            // Only show center, prev, next visually to keep it clean and avoid rendering many huge DOM nodes
            const isVisible = isCenter || isPrev || isNext;
            if (!isVisible && galleryImages.length > 3) return null;

            let translation = "translate-x-[200%] opacity-0 scale-75";
            if (isCenter)
              translation = "translate-x-0 opacity-100 scale-100 z-30";
            else if (isPrev)
              translation =
                "-translate-x-[75vw] sm:-translate-x-[65vw] lg:-translate-x-[55vw] opacity-60 hover:opacity-80 scale-90 z-20";
            else if (isNext)
              translation =
                "translate-x-[75vw] sm:translate-x-[65vw] lg:translate-x-[55vw] opacity-60 hover:opacity-80 scale-90 z-20";

            return (
              <div
                key={idx}
                className={`absolute w-[80vw] sm:w-[70vw] lg:w-[60vw] h-full flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${translation}`}
                onClick={() => {
                  if (!isCenter) {
                    setCurrentImageIndex(idx);
                    setIsGalleryAutoplayPaused(true);
                  }
                }}
              >
                <img
                  loading={idx === 0 ? "eager" : "lazy"}
                  decoding="async"
                  // @ts-ignore
                  fetchpriority={idx === 0 ? "high" : "auto"}
                  src={img ? optimizeImageUrl(img, 1200) : undefined}
                  srcSet={img ? generateSrcSet(img) : undefined}
                  sizes="(max-width: 1024px) 100vw, 1200px"
                  alt={`${project.title} - Image ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className={`w-full max-h-[85vh] object-contain rounded-md sm:rounded-lg shadow-2xl transition-all duration-700 ${isCenter ? "ring-1 ring-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)]" : "cursor-pointer"}`}
                />
              </div>
            );
          })}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none z-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none z-20" />

        {/* Navigation Breadcrumb inside banner */}
        <div className="absolute top-4 sm:top-6 lg:top-8 left-0 right-0 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 z-40 pointer-events-none">
          <div className="flex items-center gap-2 text-[13px] md:text-sm text-white/80 font-medium drop-shadow-md pointer-events-auto">
            <button
              onClick={() => onNavigate({ screen: "du-an" })}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-primary hover:text-white text-white transition-colors cursor-pointer mr-2 backdrop-blur-sm"
              title="Quay lại"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span
              className="cursor-pointer hover:text-white transition-colors"
              onClick={() => onNavigate({ screen: "du-an" })}
            >
              Dự án
            </span>
            <span className="opacity-50">/</span>
            <span className="text-white font-semibold drop-shadow-md">{project.title}</span>
          </div>
        </div>

        {/* Gallery Thumbnails Overlay */}
        <div className="absolute bottom-4 left-0 right-0 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 z-40 flex items-end justify-between pointer-events-none">
          <div
            ref={thumbnailContainerRef}
            className="flex items-center gap-2 overflow-x-auto no-scrollbar pointer-events-auto max-w-[60%] lg:max-w-xl pb-2 hide-scrollbar scroll-smooth"
          >
            {galleryImages.map((img, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  setCurrentImageIndex(idx);
                  setIsGalleryAutoplayPaused(true);
                  const parent = e.currentTarget.parentElement;
                  if (parent) parent.scrollTo({ left: e.currentTarget.offsetLeft - parent.offsetLeft - parent.clientWidth / 2 + e.currentTarget.clientWidth / 2, behavior: 'smooth' });
                }}
                className={`relative w-16 sm:w-20 lg:w-24 aspect-[4/3] rounded-md overflow-hidden shrink-0 border-2 transition-all group/thumb ${
                  idx === currentImageIndex
                    ? "border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                    : "border-transparent hover:border-white/50 opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  loading="lazy"
                  decoding="async"
                  src={img ? optimizeImageUrl(img, 200) : undefined}
                  alt={`Hình thu nhỏ tổng quan ${project.title} - ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {idx !== currentImageIndex && (
                  <div className="absolute inset-0 bg-[#0B1F16]/30 group-hover/thumb:bg-bg-inverse/10 transition-colors" />
                )}
              </button>
            ))}
          </div>

          <button 
            onClick={() => {
              setLightboxIndex(currentImageIndex);
              setIsLightboxOpen(true);
            }}
            className="hidden sm:flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-3 sm:px-4 py-2 rounded-lg text-[11px] sm:text-xs font-medium tracking-wider transition-colors pointer-events-auto mr-4 sm:mr-6 lg:mr-8 mb-2">
            <ImageIcon className="w-4 h-4" />
            <span>Tất cả ảnh</span>
          </button>
        </div>

        {/* Slider Controls (Mobile/Desktop) */}
        <button
          className="absolute z-40 left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 opacity-0 group-hover:opacity-100 transition-all pointer-events-auto"
          onClick={() =>
            setCurrentImageIndex((prev) =>
              prev === 0 ? galleryImages.length - 1 : prev - 1,
            )
          }
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          className="absolute z-40 right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 opacity-0 group-hover:opacity-100 transition-all pointer-events-auto"
          onClick={() =>
            setCurrentImageIndex((prev) =>
              prev === galleryImages.length - 1 ? 0 : prev + 1,
            )
          }
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Sticky Tab Navigation */}
      <div
        className={`sticky ${scrollDirection === "down" ? "top-0" : "top-10"} z-40 bg-white/70 backdrop-blur-md border-b border-t-0 border-border-color shadow-sm transition-colors duration-300 w-full sm:mx-0 px-4 sm:px-0 h-[38px] pb-0`}
      >
        <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 flex items-center justify-between h-[30px] py-0">
          <div
            id="tab-navigation-container"
            className="flex items-center gap-2 sm:gap-6 overflow-x-auto hide-scrollbar h-[30px]"
          >
            {TABS.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  id={`tab-btn-${tab.id}`}
                  onClick={() => handleTabClick(tab.id)}
                  className={`py-0 h-[30px] text-sm font-medium tracking-wider transition-all relative cursor-pointer flex items-center gap-1.5 whitespace-nowrap px-1 ${
                    activeTab === tab.id
                      ? "text-primary font-bold"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 inset-x-0 h-px bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="hidden md:flex items-center gap-4 text-text-secondary pr-2">
            <Heart className="w-5 h-5 hover:text-error cursor-pointer transition-colors" />
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="flex items-center justify-center bg-transparent border-none p-1"
                title="Chia sẻ dự án"
              >
                <Share2 className="w-5 h-5 hover:text-primary cursor-pointer transition-colors" />
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
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto pl-[10px] pr-[10px] xl:px-8 pt-[10px] pb-[40px] lg:pt-[10px] lg:pb-[40px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 text-left">
          {/* Left Column (Content) */}
          <div className="lg:col-span-8 space-y-12">
            {renderCustomSections("before_overview")}

            <div
              id="overview"
              ref={(el) => { sectionRefs.current[0] = el; }}
              className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pt-8 mt-[-32px]"
            >
              <h1 className="flex items-center gap-3 text-[25px] md:text-[26px] w-full max-w-[785px] font-bold  my-[20px] drop-shadow-sm">
                <FileText className="w-[20px] h-[20px] md:w-8 md:h-8 text-primary shrink-0" />
                <span className="text-[20px] md:text-[26px] text-primary">
                  Tổng quan dự án {project.title}
                </span>
              </h1>

              {/* Thông tin chi tiết */}
              <div className="bg-bg-surface border border-border-color rounded-xl pr-[9px] md:pr-8 space-y-6 pt-[0px] pb-[10px] pl-[10px] md:pl-[32px] mb-[10px]">
                <h3 className="text-[15px] font-bold text-text-primary mb-[5px] h-[37px] pb-[16px] pt-[9px] border-b border-border-color">
                  Thông tin chi tiết
                </h3>
                <div className="grid grid-cols-2 gap-x-4 sm:gap-x-12 gap-y-4 relative">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-bg-base hidden sm:block"></div>

                  {[
                    { label: "Tên dự án", value: project.title },
                    { label: "Vị trí", value: project.location },
                    { label: "Chủ đầu tư", value: project.developer },
                    { label: "Quy mô", value: project.scale },
                    { label: "Loại hình sản phẩm", value: project.productType },
                    { label: "Quy mô dân số", value: project.population },
                    {
                      label: "Mật độ xây dựng",
                      value: project.buildingDensity,
                    },
                    {
                      label: "Thời gian bàn giao",
                      value: project.handoverTime,
                    },
                    { label: "Phân khu", value: project.subdivisions },
                    {
                      label: "Tiến độ",
                      value:
                        project.status === "opening"
                          ? "Đang mở bán"
                          : "Đã bàn giao",
                    },
                    {
                      label: "Ngân hàng hỗ trợ",
                      value: project.supportedBanks,
                    },
                  ]
                    .filter(
                      (item) => item.value && String(item.value).trim() !== "",
                    )
                    .map((item, idx) => {
                      const lines = String(item.value).split("\n");
                      const hasList = lines.some((line) =>
                        line.trim().startsWith("+"),
                      );

                      return (
                        <div
                          key={idx}
                          className={`flex ${hasList ? "flex-col items-start gap-1.5" : "flex-col md:flex-row md:items-start md:justify-between gap-1 md:gap-4"} border-b border-border-color/50 pb-[6px] md:pb-[2px]`}
                        >
                          <span className="text-text-secondary text-[13px] md:text-sm whitespace-nowrap">
                            {item.label}
                          </span>
                          <div
                            className={`text-text-primary font-medium text-[13px] md:text-sm ${hasList ? "text-left w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1" : "text-left md:text-right min-w-0 break-words"}`}
                          >
                            {lines.map((line, i, arr) => {
                              const isListItem = line.trim().startsWith("+");
                              const content = isListItem
                                ? line.trim().substring(1).trim()
                                : line;

                              const renderedContent = content
                                .split(" ")
                                .map((word, j) => {
                                  const urlRegex = /^(https?:\/\/[^\s]+)$/;
                                  if (urlRegex.test(word)) {
                                    return (
                                      <a
                                        key={j}
                                        href={word}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:text-primary underline"
                                      >
                                        {word}{" "}
                                      </a>
                                    );
                                  }
                                  return (
                                    <React.Fragment key={j}>
                                      {word}{" "}
                                    </React.Fragment>
                                  );
                                });

                              if (isListItem) {
                                return (
                                  <div
                                    key={i}
                                    className="flex items-start relative pl-4 mt-1"
                                  >
                                    <span className="absolute left-1 top-[7px] w-1.5 h-1.5 rounded-full bg-primary"></span>
                                    <span>{renderedContent}</span>
                                  </div>
                                );
                              } else {
                                if (
                                  hasList &&
                                  !isListItem &&
                                  i === 0 &&
                                  line.trim() === ""
                                ) {
                                  return null; // Skip empty first line if it's just meant to push list down
                                }
                                return (
                                  <React.Fragment key={i}>
                                    <div
                                      className={
                                        hasList
                                          ? "col-span-1 sm:col-span-2 mb-1"
                                          : ""
                                      }
                                    >
                                      {renderedContent}
                                    </div>
                                  </React.Fragment>
                                );
                              }
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <div
                    className={`prose prose-invert prose-p:mb-[10px] prose-img:my-[20px] prose-a:text-primary hover:prose-a:text-primary prose-a:font-medium prose-a:underline max-w-none text-text-secondary text-[13px] md:text-[15px] overflow-hidden transition-all duration-500 ease-in-out ${isDescriptionExpanded ? "max-h-none" : "max-h-[300px]"}`}
                    dangerouslySetInnerHTML={{
                      __html:
                        project.description ||
                        "<p>Chưa có thông tin tổng quan cập nhật bằng mã HTML.</p>",
                    }}
                  />

                  {project.description && !isDescriptionExpanded && (
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent pointer-events-none" />
                  )}
                </div>

                {project.description && (
                  <button
                    onClick={() =>
                      setIsDescriptionExpanded(!isDescriptionExpanded)
                    }
                    className="flex items-center gap-2 text-primary hover:text-primary font-medium text-[13px] md:text-sm transition-colors mt-2"
                  >
                    {isDescriptionExpanded ? (
                      <>
                        Thu gọn <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Xem thêm <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}

                {!project.description && (
                  <div className="text-text-secondary text-[13px] md:text-sm italic border-l-2 border-primary pl-4 py-2 bg-bg-surface/50">
                    Nội dung tổng quan đang được cập nhật. Vui lòng quay lại
                    sau.
                  </div>
                )}
              </div>

              <div className="mt-8">
                <StarRatingInteractive
                  collectionName="projects"
                  documentId={project.id}
                  baseRating={project.baseRating || 5.0}
                  baseReviewCount={project.baseReviewCount || 0}
                  userTotalRating={project.userTotalRating || 0}
                  userReviewCount={project.userReviewCount || 0}
                />
              </div>
            </div>

            {renderCustomSections("after_overview")}

            {hasSubdivisionContent && (
              <div
                id="subdivision"
                ref={(el) => { sectionRefs.current[7] = el; }}
                className="space-y-8 pt-[20px] mt-[-32px]"
              >
                <h2 className="flex items-center gap-3 text-[20px] md:text-[26px] font-bold  mb-0 drop-shadow-sm">
                  <Building2 className="w-[20px] h-[20px] md:w-8 md:h-8 text-primary shrink-0" />
                  <span className="text-[20px] md:text-[26px] text-primary">
                    Khu của {project.title}
                  </span>
                </h2>
                <div className="space-y-6">
                  {project.subdivisionTab && (
                    <div className="relative">
                      <div
                        className={`prose prose-invert prose-a:text-primary hover:prose-a:text-primary prose-a:font-medium prose-a:underline max-w-none text-text-secondary text-[13px] md:text-[15px] overflow-hidden transition-all duration-500 ease-in-out ${isSubdivisionExpanded ? "max-h-none" : "max-h-[300px]"}`}
                        dangerouslySetInnerHTML={{
                          __html: project.subdivisionTab,
                        }}
                      />
                      {!isSubdivisionExpanded && (
                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent pointer-events-none" />
                      )}
                    </div>
                  )}
                  {project.subdivisionTab && (
                    <button
                      onClick={() =>
                        setIsSubdivisionExpanded(!isSubdivisionExpanded)
                      }
                      className="flex items-center gap-2 text-primary hover:text-primary font-medium text-[13px] md:text-sm transition-colors mt-2"
                    >
                      {isSubdivisionExpanded ? (
                        <>
                          Thu gọn <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Xem thêm <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                  {project.subdivisionsCards &&
                    project.subdivisionsCards.length > 0 && (
                      <div className="flex overflow-x-auto gap-4 hide-scrollbar snap-x snap-mandatory pt-2 pb-6">
                        {project.subdivisionsCards.map((card, idx) => (
                          <div
                            key={idx}
                            className="min-w-[280px] w-[300px] shrink-0 bg-bg-surface border border-border-color rounded-xl overflow-hidden snap-start flex flex-col items-start relative group"
                          >
                            <div className="relative w-full aspect-[16/9] overflow-hidden bg-bg-surface">
                              {card.status && (
                                <div className="absolute top-0 left-0 z-10 bg-[#0f9b0f] text-white text-[11px] font-bold px-2.5 py-1 rounded-none rounded-br-lg shadow-sm tracking-wide">
                                  {card.status}
                                </div>
                              )}
                              <img
                                loading="lazy"
                                decoding="async"
                                src={card.imageUrl || undefined}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                alt={card.name}
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="px-5 py-[10px] w-full flex-grow flex flex-col justify-start">
                              <div className="space-y-3 mb-4">
                                <div className="flex items-start justify-between gap-2 mb-[5px]">
                                  <div className="text-[13px] md:text-sm text-text-secondary shrink-0 mt-0.5">
                                    Phân khu
                                  </div>
                                  <div className="text-[13px] md:text-sm text-text-primary font-medium text-right">
                                    {card.projectStr || project.title}
                                  </div>
                                </div>
                                <div className="flex items-start justify-between gap-2 pt-[10px] mb-0">
                                  <div className="text-[13px] md:text-sm text-text-secondary shrink-0 mt-0.5">
                                    Phong cách
                                  </div>
                                  <div className="text-[13px] md:text-sm text-text-primary font-medium text-right">
                                    {card.styleStr || "Hiện đại"}
                                  </div>
                                </div>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="text-[13px] md:text-sm text-text-secondary shrink-0 mt-0.5">
                                    Giá bán
                                  </div>
                                  <div className="text-[13px] md:text-sm text-primary font-bold text-right">
                                    {card.priceStr || "Đang cập nhật"}
                                  </div>
                                </div>
                              </div>
                              {card.types && card.types.length > 0 && (
                                <div className="pt-3 mb-1 border-t border-border-color">
                                  <div className="text-[11px] uppercase tracking-wider font-semibold text-white/70 mb-2">
                                    Loại hình
                                  </div>
                                  <div className="grid grid-cols-2 gap-y-2 gap-x-2 text-[13px] text-text-secondary">
                                    {card.types.map((type, tIdx) => (
                                      <div
                                        key={tIdx}
                                        className="flex items-center gap-1.5 truncate"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                                        <span className="truncate">{type}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="px-4 py-[10px] w-full border-t border-border-color mt-auto">
                              <button
                                onClick={() => {
                                  if (card.linkedProjectId) {
                                    onNavigate({
                                      screen: "project-detail",
                                      projectId: card.linkedProjectId,
                                      slug: generateSlug(card.name || "du-an"),
                                    });
                                  } else {
                                    window.scrollTo({
                                      top: 0,
                                      behavior: "smooth",
                                    });
                                  }
                                }}
                                className="w-full py-[5px] rounded-lg border border-border-inverse hover:border-primary hover:bg-bg-base text-text-primary text-[13px] md:text-sm font-semibold transition-colors"
                              >
                                Xem chi tiết
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            )}

            {renderCustomSections("after_subdivision")}

            <div
              id="location"
              ref={(el) => { sectionRefs.current[1] = el; }}
              className="space-y-8 pt-8 mt-[-32px]"
            >
              <h2 className="flex items-center gap-3 text-[20px] md:text-[26px] font-bold  drop-shadow-sm">
                <MapPin className="w-[20px] h-[20px] md:w-8 md:h-8 text-primary shrink-0" />
                <span className="text-[20px] md:text-[26px] text-primary">
                  Vị trí {project.title}
                </span>
              </h2>
              <div className="space-y-6">
                {/* Mô tả ngắn (Khu vực soạn thảo) */}
                {project.locationShortDesc && (
                  <div
                    className="prose prose-invert max-w-none text-text-secondary text-[13px] md:text-[15px]"
                    dangerouslySetInnerHTML={{
                      __html: project.locationShortDesc,
                    }}
                  />
                )}

                {/* Bản đồ vị trí */}
                {mapContent}

                {/* Nội dung chi tiết với xem thêm / thu gọn */}
                <div className="relative">
                  <div
                    className={`prose prose-invert max-w-none text-text-secondary text-[13px] md:text-[15px] overflow-hidden transition-all duration-500 ${isLocationExpanded ? "" : "max-h-[250px]"}`}
                    dangerouslySetInnerHTML={{
                      __html:
                        project.locationTab ||
                        "<p>Chưa có bài viết giới thiệu vị trí cụ thể.</p>",
                    }}
                  />
                  {!isLocationExpanded && project.locationTab && (
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent pointer-events-none" />
                  )}
                </div>

                {project.locationTab && (
                  <button
                    onClick={() => setIsLocationExpanded(!isLocationExpanded)}
                    className="flex items-center gap-2 text-primary hover:text-primary font-medium text-[13px] md:text-sm transition-colors mt-2"
                  >
                    {isLocationExpanded ? (
                      <>
                        Thu gọn <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Xem thêm <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {renderCustomSections("after_location")}

            <div
              id="amenity"
              ref={(el) => { sectionRefs.current[2] = el; }}
              className="space-y-8 pt-8 mt-[-32px]"
            >
              <h2 className="flex items-center gap-3 text-[20px] md:text-[26px] font-bold  drop-shadow-sm">
                <Sparkles className="w-[20px] h-[20px] md:w-8 md:h-8 text-primary shrink-0" />
                <span className="text-[20px] md:text-[26px] text-primary">
                  Tiện ích {project.title}
                </span>
              </h2>
              <div className="space-y-6">
                <div className="relative">
                  <div
                    className={`prose prose-invert max-w-none text-text-secondary text-[13px] md:text-[15px] overflow-hidden transition-all duration-500 ${isAmenityExpanded ? "" : "max-h-[250px]"}`}
                    dangerouslySetInnerHTML={{
                      __html:
                        project.amenityTab ||
                        `<p>${project.title} sở hữu hệ sinh thái tiện ích đẳng cấp, đáp ứng trọn vẹn mọi nhu cầu sống, học tập, làm việc và giải trí.</p>`,
                    }}
                  />
                  {!isAmenityExpanded && project.amenityTab && (
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent pointer-events-none" />
                  )}
                </div>

                {project.amenityTab && (
                  <button
                    onClick={() => setIsAmenityExpanded(!isAmenityExpanded)}
                    className="flex items-center gap-2 text-primary hover:text-primary font-medium text-[13px] md:text-sm transition-colors mt-2"
                  >
                    {isAmenityExpanded ? (
                      <>
                        Thu gọn <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Xem thêm <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}

                {project.amenityImages && project.amenityImages.length > 0 && (
                  <div className="pt-4 space-y-4">
                    <div
                      className="relative w-full aspect-video md:aspect-[21/9] bg-bg-surface border border-border-color rounded-xl overflow-hidden group"
                      onMouseEnter={() => setIsAmenityAutoplayPaused(true)}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <img
                          loading="lazy"
                          decoding="async"
                          src={
                            project.amenityImages[currentAmenityImageIndex] ||
                            undefined
                          }
                          alt={`Tiện ích ${project.title} - ảnh ${currentAmenityImageIndex + 1}`}
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {project.amenityImages.length > 1 && (
                        <>
                          <button
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-bg-inverse/50 hover:bg-bg-inverse/70 text-text-primary rounded-full flex items-center justify-center backdrop-blur-sm border border-border-inverse opacity-0 group-hover:opacity-100 transition-all pointer-events-auto z-10"
                            onClick={() =>
                              setCurrentAmenityImageIndex((prev) =>
                                prev === 0
                                  ? project.amenityImages!.length - 1
                                  : prev - 1,
                              )
                            }
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-bg-inverse/50 hover:bg-bg-inverse/70 text-text-primary rounded-full flex items-center justify-center backdrop-blur-sm border border-border-inverse opacity-0 group-hover:opacity-100 transition-all pointer-events-auto z-10"
                            onClick={() =>
                              setCurrentAmenityImageIndex((prev) =>
                                prev === project.amenityImages!.length - 1
                                  ? 0
                                  : prev + 1,
                              )
                            }
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                    {project.amenityImages.length > 1 && (
                      <div
                        className="flex gap-2 overflow-x-auto hide-scrollbar snap-x pb-2 relative"
                        onMouseEnter={() => setIsAmenityAutoplayPaused(true)}
                      >
                        {project.amenityImages.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setCurrentAmenityImageIndex(idx);
                              setIsAmenityAutoplayPaused(true);
                            }}
                            className={`relative w-20 sm:w-24 aspect-video rounded-md overflow-hidden shrink-0 border-2 transition-all snap-start ${
                              idx === currentAmenityImageIndex
                                ? "border-primary shadow-sm"
                                : "border-border-color hover:border-slate-600 opacity-60 hover:opacity-100"
                            }`}
                          >
                            <img
                              loading="lazy"
                              decoding="async"
                              src={img || undefined}
                              alt={`Hình thu nhỏ tiện ích ${project.title} - ${idx + 1}`}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {renderCustomSections("after_amenity")}

            <div
              id="floor-plan"
              ref={(el) => { sectionRefs.current[3] = el; }}
              className="space-y-8 pt-8 mt-[-32px]"
            >
              <h2 className="flex items-center gap-3 text-[20px] md:text-[26px] font-bold  drop-shadow-sm">
                <LayoutGrid className="w-[20px] h-[20px] md:w-8 md:h-8 text-primary shrink-0" />
                <span className="text-[20px] md:text-[26px] text-primary">
                  Mặt bằng {project.title}
                </span>
              </h2>

              {project.floorPlanImages &&
                project.floorPlanImages.length > 0 && (
                  <div
                    className="relative w-full aspect-video md:aspect-[21/9] bg-bg-surface border border-border-color rounded-xl overflow-hidden group"
                    onMouseEnter={() => setIsFloorPlanAutoplayPaused(true)}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <img
                        loading="lazy"
                        decoding="async"
                        src={
                          project.floorPlanImages[currentFloorPlanImageIndex] ||
                          undefined
                        }
                        alt={`Mặt bằng ${project.title} - ảnh ${currentFloorPlanImageIndex + 1}`}
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {project.floorPlanImages.length > 1 && (
                      <>
                        <button
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-bg-inverse/50 hover:bg-bg-inverse/70 text-text-primary rounded-full flex items-center justify-center backdrop-blur-sm border border-border-inverse opacity-0 group-hover:opacity-100 transition-all pointer-events-auto z-10"
                          onClick={() => {
                            setCurrentFloorPlanImageIndex((prev) =>
                              prev === 0
                                ? project.floorPlanImages!.length - 1
                                : prev - 1,
                            );
                            setIsFloorPlanAutoplayPaused(true);
                          }}
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-bg-inverse/50 hover:bg-bg-inverse/70 text-text-primary rounded-full flex items-center justify-center backdrop-blur-sm border border-border-inverse opacity-0 group-hover:opacity-100 transition-all pointer-events-auto z-10"
                          onClick={() => {
                            setCurrentFloorPlanImageIndex((prev) =>
                              prev === project.floorPlanImages!.length - 1
                                ? 0
                                : prev + 1,
                            );
                            setIsFloorPlanAutoplayPaused(true);
                          }}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>

                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                          {project.floorPlanImages.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setCurrentFloorPlanImageIndex(idx);
                                setIsFloorPlanAutoplayPaused(true);
                              }}
                              className={`w-2 h-2 rounded-full transition-all ${idx === currentFloorPlanImageIndex ? "bg-primary w-6" : "bg-bg-surface/50 hover:bg-bg-surface/80"}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

              {project.floorPlanTab && (
                <div className="space-y-6">
                  <div className="relative">
                    <div
                      className={`prose prose-invert max-w-none text-text-secondary text-[13px] md:text-[15px] overflow-hidden transition-all duration-500 ${isFloorPlanExpanded ? "" : "max-h-[250px]"}`}
                      dangerouslySetInnerHTML={{ __html: project.floorPlanTab }}
                    />
                    {!isFloorPlanExpanded && project.floorPlanTab && (
                      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent pointer-events-none" />
                    )}
                  </div>

                  <button
                    onClick={() => setIsFloorPlanExpanded(!isFloorPlanExpanded)}
                    className="flex items-center gap-2 text-primary hover:text-primary font-medium text-[13px] md:text-sm transition-colors mt-2"
                  >
                    {isFloorPlanExpanded ? (
                      <>
                        Thu gọn <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Xem thêm <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {project.floorPlanTabs && project.floorPlanTabs.length > 0 && (
                <div className="pt-6">
                  <div className="flex border-b border-border-color overflow-x-auto hide-scrollbar h-[30.5px]">
                    {project.floorPlanTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setCurrentFloorPlanTabId(tab.id);
                          setCurrentFloorPlanImageIndex(0);
                        }}
                        className={`px-4 sm:px-5 py-2 text-[13px] font-bold whitespace-nowrap transition-all flex border-b border-b-emerald-500/0 items-center justify-center gap-2 ${
                          currentFloorPlanTabId === tab.id
                            ? "border-b-emerald-500 text-emerald-400 bg-accent/5"
                            : "text-text-secondary hover:text-text-secondary hover:bg-bg-base/50"
                        }`}
                      >
                        <span>{tab.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-6">
                    {project.floorPlanTabs.map((tab) => (
                      <div
                        key={tab.id}
                        style={{
                          display:
                            currentFloorPlanTabId === tab.id ? "block" : "none",
                        }}
                        className="space-y-6 animate-in fade-in duration-500"
                      >
                        {tab.content && (
                          <div
                            className="prose prose-invert max-w-none text-text-secondary text-[13px] md:text-[15px]"
                            dangerouslySetInnerHTML={{ __html: tab.content }}
                          />
                        )}
                        {tab.images && tab.images.length > 0 && (
                          <div className="pt-4 space-y-4">
                            <div className="relative w-full aspect-video md:aspect-[21/9] bg-bg-surface border border-border-color rounded-xl overflow-hidden group">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <img
                                  loading="lazy"
                                  decoding="async"
                                  src={
                                    tab.images[currentFloorPlanImageIndex] ||
                                    tab.images[0] ||
                                    undefined
                                  }
                                  alt={`${tab.name} - ảnh ${currentFloorPlanImageIndex + 1}`}
                                  className="w-full h-full object-contain"
                                  referrerPolicy="no-referrer"
                                />
                              </div>

                              {tab.images.length > 1 && (
                                <>
                                  <button
                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-bg-inverse/50 hover:bg-bg-inverse/70 text-text-primary rounded-full flex items-center justify-center backdrop-blur-sm border border-border-inverse opacity-0 group-hover:opacity-100 transition-all pointer-events-auto z-10"
                                    onClick={() => {
                                      setCurrentFloorPlanImageIndex((prev) =>
                                        prev === 0
                                          ? tab.images!.length - 1
                                          : prev - 1,
                                      );
                                      setIsFloorPlanAutoplayPaused(true);
                                    }}
                                  >
                                    <ChevronLeft className="w-5 h-5" />
                                  </button>
                                  <button
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-bg-inverse/50 hover:bg-bg-inverse/70 text-text-primary rounded-full flex items-center justify-center backdrop-blur-sm border border-border-inverse opacity-0 group-hover:opacity-100 transition-all pointer-events-auto z-10"
                                    onClick={() => {
                                      setCurrentFloorPlanImageIndex((prev) =>
                                        prev === tab.images!.length - 1
                                          ? 0
                                          : prev + 1,
                                      );
                                      setIsFloorPlanAutoplayPaused(true);
                                    }}
                                  >
                                    <ChevronRight className="w-5 h-5" />
                                  </button>
                                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-bg-inverse/60 backdrop-blur-md text-text-primary text-[10px] font-bold px-2 py-1 rounded-full border border-border-inverse">
                                    {currentFloorPlanImageIndex + 1} /{" "}
                                    {tab.images.length}
                                  </div>
                                </>
                              )}
                            </div>

                            {tab.images.length > 1 && (
                              <div className="flex gap-2 overflow-x-auto hide-scrollbar snap-x pb-2 relative">
                                {tab.images.map((img, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      setCurrentFloorPlanImageIndex(idx);
                                      setIsFloorPlanAutoplayPaused(true);
                                    }}
                                    className={`relative w-20 sm:w-24 aspect-video rounded-md overflow-hidden shrink-0 border-2 transition-all snap-start ${
                                      idx === currentFloorPlanImageIndex
                                        ? "border-primary shadow-sm"
                                        : "border-border-color hover:border-slate-600 opacity-60 hover:opacity-100"
                                    }`}
                                  >
                                    <img
                                      loading="lazy"
                                      decoding="async"
                                      src={img || undefined}
                                      alt={`Hình thu nhỏ mặt bằng ${tab.name} - ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!project.floorPlanTab &&
                (!project.floorPlanTabs ||
                  project.floorPlanTabs.length === 0) && (
                  <div className="bg-bg-surface border border-border-color rounded-xl p-8 text-center space-y-4 shadow-sm">
                    <LayoutGrid className="w-10 h-10 text-primary mx-auto opacity-80" />
                    <p className="text-xl font-bold text-primary">
                      Đang cập nhật mặt bằng
                    </p>
                    <p className="text-[13px] md:text-sm text-text-secondary max-w-lg mx-auto">
                      Vui lòng đăng ký nhận tư vấn chuyên sâu để nhận thông tin
                      sơ đồ mặt bằng và thiết kế chi tiết.
                    </p>
                  </div>
                )}
            </div>

            {renderCustomSections("after_floorplan")}

            <div
              id="price"
              ref={(el) => { sectionRefs.current[4] = el; }}
              className="space-y-8 pt-8 mt-[-32px]"
            >
              <div className="flex justify-between items-end mb-4">
                <h2 className="flex items-center gap-3 text-[20px] md:text-[26px] font-bold  drop-shadow-sm">
                  <Banknote className="w-[20px] h-[20px] md:w-8 md:h-8 text-primary shrink-0" />
                  <span className="text-[20px] md:text-[26px] text-primary">
                    Giá bán {project.title}
                  </span>
                </h2>
                {targetProductCategory ? (
                  <button
                    onClick={() =>
                      onNavigate({
                        screen: "category-product",
                        categoryName: targetProductCategory,
                      })
                    }
                    className="text-primary hover:text-primary text-[13px] md:text-sm font-medium whitespace-nowrap"
                  >
                    Xem thêm
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate({ screen: "san-pham" })}
                    className="text-primary hover:text-primary text-[13px] md:text-sm font-medium whitespace-nowrap"
                  >
                    Xem thêm
                  </button>
                )}
              </div>
              {project.priceTab ? (
                <div className="space-y-6">
                  <div className="relative">
                    <div
                      className={`prose prose-invert max-w-none text-text-secondary text-[13px] md:text-[15px] overflow-hidden transition-all duration-500 ${isPriceExpanded ? "" : "max-h-[250px]"}`}
                      dangerouslySetInnerHTML={{ __html: project.priceTab }}
                    />
                    {!isPriceExpanded && project.priceTab && (
                      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent pointer-events-none" />
                    )}
                  </div>

                  {project.priceTab && (
                    <button
                      onClick={() => setIsPriceExpanded(!isPriceExpanded)}
                      className="flex items-center gap-2 text-primary hover:text-primary font-medium text-[13px] md:text-sm transition-colors mt-2"
                    >
                      {isPriceExpanded ? (
                        <>
                          Thu gọn <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Xem thêm <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-bg-surface border border-border-color rounded-xl p-8 text-center space-y-4 shadow-sm">
                  <Banknote className="w-10 h-10 text-primary mx-auto opacity-80" />
                  <p className="text-xl font-bold text-primary">
                    Đang cập nhật chính sách giá
                  </p>
                  <p className="text-[13px] md:text-sm text-text-secondary max-w-lg mx-auto">
                    Vui lòng đăng ký nhận tư vấn chuyên sâu để nhận thông tin
                    bảng giá chi tiết.
                  </p>
                </div>
              )}

              {/* Related Products */}
              {relatedProducts.length > 0 && (
                <div className="pt-8">
                  <h3 className="text-xl font-bold  text-text-primary mb-6">
                    Sản phẩm thuộc dự án
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {relatedProducts.map((prod) => (
                      <ProductCard
                        key={prod.id}
                        item={prod}
                        onNavigate={onNavigate}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>



            {renderCustomSections("after_price")}

            <div
              id="qa"
              ref={(el) => { sectionRefs.current[8] = el; }}
              className="space-y-8 pt-12 mt-[-32px] border-t border-border-color/50"
            >
              <h2 className="flex items-center gap-3 text-[20px] md:text-[26px] font-bold  drop-shadow-sm">
                <HelpCircle className="w-[20px] h-[20px] md:w-8 md:h-8 text-primary shrink-0" />
                <span className="text-[20px] md:text-[26px] text-primary">
                  Hỏi đáp {project.title}
                </span>
              </h2>

              <div className="space-y-6">
                {project.qaList && project.qaList.length > 0 ? (
                  <div className="bg-bg-surface border border-border-color rounded-xl overflow-hidden">
                    {project.qaList.map((qa, index) => {
                      const isActive = activeQaIndex === index;
                      const isLast = index === project.qaList.length - 1;
                      return (
                        <div
                          key={index}
                          className={`transition-all duration-300 ${!isLast ? "border-b border-border-color/80" : ""}`}
                        >
                          <button
                            onClick={() =>
                              setActiveQaIndex(isActive ? null : index)
                            }
                            className="w-full flex items-center justify-between px-4 pt-4 pb-[5px] text-left hover:bg-bg-base/50 transition-colors"
                          >
                            <span className="font-bold text-text-primary text-[13px] md:text-base pr-4">
                              {qa.question}
                            </span>
                            {isActive ? (
                              <ChevronUp className="w-5 h-5 text-primary shrink-0" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-text-secondary shrink-0" />
                            )}
                          </button>

                          <div
                            className={`transition-all duration-500 ease-in-out ${isActive ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}
                          >
                            <div className="px-4 pt-3 pb-[5px] text-text-secondary text-[13px] md:text-[15px] leading-relaxed border-t border-border-color/50">
                              {qa.answer}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : project.qaTab ? (
                  <div className="relative">
                    <div
                      className={`prose prose-invert max-w-none text-text-secondary text-[13px] md:text-[15px] overflow-hidden transition-all duration-500 ${isQaExpanded ? "" : "max-h-[250px]"}`}
                      dangerouslySetInnerHTML={{ __html: project.qaTab }}
                    />
                    {!isQaExpanded && (
                      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent pointer-events-none" />
                    )}
                  </div>
                ) : (
                  <p className="text-text-secondary italic">
                    Chưa có thông tin hỏi đáp cho dự án này.
                  </p>
                )}

                {(!project.qaList || project.qaList.length === 0) &&
                  project.qaTab && (
                    <button
                      onClick={() => setIsQaExpanded(!isQaExpanded)}
                      className="flex items-center gap-2 text-primary hover:text-primary font-medium text-[13px] md:text-sm transition-colors mt-2"
                    >
                      {isQaExpanded ? (
                        <>
                          Thu gọn <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Xem thêm <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
              </div>
            </div>

            {renderCustomSections("after_qa")}

            <div
              id="news"
              ref={(el) => { sectionRefs.current[5] = el; }}
              className="space-y-8 pt-12 mt-[-32px] border-t border-border-color/50"
            >
              <div className="flex justify-between items-end mb-4">
                <h2 className="flex items-center gap-3 text-[20px] md:text-[26px] font-bold  drop-shadow-sm">
                  <Newspaper className="w-[20px] h-[20px] md:w-8 md:h-8 text-primary shrink-0" />
                  <span className="text-[20px] md:text-[26px] text-primary">
                    Tin tức dự án
                  </span>
                </h2>
                {targetNewsCategory ? (
                  <button
                    onClick={() =>
                      onNavigate({
                        screen: "category-news",
                        categoryName: targetNewsCategory,
                      })
                    }
                    className="text-primary hover:text-primary text-[13px] md:text-sm font-medium whitespace-nowrap"
                  >
                    Xem thêm
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate({ screen: "tin-tuc" })}
                    className="text-primary hover:text-primary text-[13px] md:text-sm font-medium whitespace-nowrap"
                  >
                    Xem thêm
                  </button>
                )}
              </div>
              <div className="flex overflow-x-auto gap-6 snap-x snap-mandatory pb-4 hide-scrollbar">
                {relatedNews.length > 0 ? (
                  relatedNews.map((news) => (
                    <div
                      key={news.id}
                      onClick={() =>
                        onNavigate({
                          screen: "news-detail",
                          newsId: news.id,
                          slug: generateSlug(news.title),
                        })
                      }
                      className="w-[85vw] sm:w-[calc(50%-12px)] lg:w-[calc(33.3333%-16px)] shrink-0 bg-bg-surface border border-border-color rounded-xl overflow-hidden cursor-pointer group hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-yellow-500/10 snap-start flex flex-col"
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img
                          loading="lazy"
                          decoding="async"
                          src={news.imageUrl || undefined}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          alt={news.title}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            (e.target as HTMLImageElement).src =
                              "/no-image.svg";
                          }}
                        />
                      </div>
                      <div className="px-5 py-2.5 flex-1 flex flex-col">
                        <h4 className="text-base font-bold text-text-primary line-clamp-2 group-hover:text-primary transition-colors mb-2">
                          {news.title}
                        </h4>
                        <span className="text-xs text-text-secondary font-medium">
                          {news.createdAt
                            ? new Date(news.createdAt).toLocaleDateString(
                                "vi-VN",
                              )
                            : ""}
                        </span>
                        <div className="w-full h-px bg-bg-base/60 mt-0 mb-3"></div>
                        <p className="text-[13px] font-light md:text-[13px] font-light md:text-[13px] font-light md:text-[13px] font-light md:text-[13px] font-light md:text-[13px] font-light md:text-[13px] font-light md:text-[13px] font-light md:text-sm text-text-secondary line-clamp-3 mb-4 flex-1">
                          {news.description}
                        </p>
                        <div className="flex items-center text-primary text-[13px] md:text-sm font-bold group-hover:text-primary transition-colors mt-auto">
                          Xem thêm{" "}
                          <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-text-secondary text-[13px] md:text-sm">
                    Đang cập nhật thêm tin tức và tiến độ liên quan đến dự án.
                  </div>
                )}
              </div>
            </div>

            {renderCustomSections("after_news")}

            {/* Hidden div to trigger contact section in IntersectionObserver, actual view is sidebar */}
            <div
              id="contact"
              ref={(el) => { sectionRefs.current[6] = el; }}
              className="absolute h-0 w-full"
            ></div>

            {/* AD banner */}
            <AdBanner slot="project-detail-bottom" containerClassName="mt-8" />
          </div>

          {/* Right Column (Form) */}
          <div
            className="lg:col-span-4 space-y-6 relative"
            id="project-detail-sidebar"
          >
            <div
              className={`sticky ${scrollDirection === "down" ? "top-[48px]" : "top-[96px] md:top-[100px]"}`}
            >
              {/* Specialized Form */}
              <div className="bg-bg-surface border border-border-color px-[16px] py-[8px] rounded-xl space-y-2 shadow-xl relative text-left">
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
                  <span className="font-semibold text-text-primary">
                    Phân tích
                  </span>{" "}
                  quỹ căn, chính sách, tiện ích giúp Khách hàng lựa chọn căn{" "}
                  <span className="font-semibold text-primary">
                    tốt nhất.
                  </span>
                </p>
              </div>
              <div className="flex items-start gap-2 mb-[2px]">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-text-secondary leading-tight">
                  <span className="font-semibold text-text-primary">
                    Giải đáp mọi thắc mắc
                  </span>{" "}
                  của khách hàng nhanh chóng.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-text-secondary leading-tight">
                      <span className="font-semibold text-text-primary">
                        Tuyệt đối bảo mật
                      </span>{" "}
                      thông tin cá nhân.
                    </p>
                  </div>
                </div>

                {formSubmitted ? (
                  <div className="bg-accent/10 text-emerald-400 border border-primary/20 rounded-xl p-5 text-center space-y-3 animate-in zoom-in-95">
                    <div className="w-12 h-12 rounded-full border-2 border-primary/30 flex items-center justify-center mx-auto bg-accent/10 text-emerald-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h5 className="font-medium text-[15px] text-text-primary">
                        Đăng ký thành công!
                      </h5>
                      <p className="text-[11px] text-emerald-200/70 mt-1.5 leading-relaxed">
                        Chuyên viên của chúng tôi sẽ gọi lại cho bạn theo số{" "}
                        {clientPhone} trong ít phút nữa.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={handleConsultSubmit}
                    className="space-y-2 pt-[5px] mt-1"
                  >
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
                          Tôi đã đọc và đồng ý với{" "}
                          <button
                            type="button"
                            onClick={() =>
                              onNavigate({ screen: "terms-of-use" })
                            }
                            className="underline text-primary hover:text-primary"
                          >
                            Điều khoản & Điều kiện
                          </button>{" "}
                          của Greenia Market.
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
                          Tôi đã đọc và đồng ý với{" "}
                          <button
                            type="button"
                            onClick={() =>
                              onNavigate({ screen: "privacy-policy" })
                            }
                            className="underline text-primary hover:text-primary"
                          >
                            Chính sách bảo mật dữ liệu cá nhân
                          </button>{" "}
                          của Greenia Market.
                        </span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !agreeTerms || !agreePrivacy}
                      className="w-full py-2.5 rounded-[10px] font-bold bg-primary text-white hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[13px] mt-2 shadow-lg shadow-emerald-500/30 text-center"
                    >
                      {isSubmitting
                        ? "Đang gửi thông tin..."
                        : "Nhận tư vấn ngay"}
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
                        <img
                          loading="lazy"
                          decoding="async"
                          src="/zalo-icon.svg"
                          alt="Zalo"
                          className="w-3.5 h-3.5"
                        />
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
        </div>
        
        {relatedProjects.length > 0 && (
          <div className="space-y-8 pt-12 mt-8 border-t border-border-color/50">
            <div className="flex justify-between items-end mb-4">
              <h2 className="flex items-center gap-3 text-[20px] md:text-[26px] font-bold  drop-shadow-sm">
                <Building2 className="w-[20px] h-[20px] md:w-8 md:h-8 text-primary shrink-0" />
                <span className="text-[20px] md:text-[26px] text-primary">
                  Dự án liên quan
                </span>
              </h2>
              <button
                onClick={() => onNavigate({ screen: "du-an" })}
                className="text-primary hover:text-primary text-[13px] md:text-sm font-medium whitespace-nowrap"
              >
                Xem thêm
              </button>
            </div>
            <div className="relative overflow-hidden py-4 w-full">
              <style>{`
                @keyframes sliderScrollProjectDetail {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(calc(-16.666666%)); }
                }
                .animate-project-detail-slider {
                  animation: sliderScrollProjectDetail 15s linear infinite;
                }
                .animate-project-detail-sliding-container:hover .animate-project-detail-slider {
                  animation-play-state: paused;
                }
              `}</style>
              <div className="animate-project-detail-sliding-container flex w-max">
                <div className="flex w-max animate-project-detail-slider">
                  {[...Array(6)].flatMap(() => relatedProjects).map((proj, idx) => (
                    <div
                      key={`${proj.id}-${idx}`}
                      onClick={() =>
                        onNavigate({
                          screen: "project-detail",
                          projectId: proj.id,
                          slug: generateSlug(proj.title),
                        })
                      }
                      className="w-[260px] sm:w-[280px] md:w-[240px] lg:w-[223px] shrink-0 mr-4 lg:mr-5 bg-bg-surface border border-border-color rounded-xl overflow-hidden cursor-pointer group hover:border-primary/50 transition-colors flex flex-col justify-between shadow-sm"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                          loading="lazy"
                          decoding="async"
                          src={optimizeImageUrl(proj.images?.[0] || proj.imageUrl, 400) || undefined}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          alt={proj.title}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            (e.target as HTMLImageElement).src =
                              "/no-image.svg";
                          }}
                        />
                        <div className="absolute top-0 left-0 px-2.5 py-1 bg-[#0f9b0f] text-white text-[11px] font-bold rounded-none rounded-br-lg shadow-sm z-10">
                          {proj.status === 'handed-over' ? 'Đã bàn giao' : proj.status === 'coming_soon' ? 'Sắp ra mắt' : 'Đang mở bán'}
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-[13px] sm:text-[15px] font-bold text-text-primary mb-2 line-clamp-2 transition-colors group-hover:text-primary">
                            {proj.title}
                          </h4>
                          <div className="flex items-center justify-between text-xs mb-3">
                            <span className="text-text-secondary">Giá từ:</span>
                            <span className="text-primary font-bold text-[13px]">{proj.priceText || "Đang cập nhật"}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-[11px] text-text-secondary mb-2">
                            <div className="flex items-center gap-1.5 flex-1">
                              <Layers className="w-3 h-3 text-text-secondary shrink-0" />
                              <span className="truncate" title={proj.scale || 'Đang cập nhật'}>{proj.scale || 'Đang cập nhật'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-1">
                              <Building2 className="w-3 h-3 text-text-secondary shrink-0" />
                              <span className="truncate" title={proj.units ? String(proj.units) : 'Đang cập nhật'}>{proj.units ? `${proj.units} căn` : 'Đang cập nhật'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-1.5 text-[11px] text-text-secondary mt-auto pt-2 border-t border-border-color/50">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-[1px]" />
                          <span className="line-clamp-2">
                            {proj.location || proj.title}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Gallery */}
      {isLightboxOpen && galleryImages.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col backdrop-blur-xl animate-in fade-in duration-300">
          <div className="flex justify-between items-center p-4 sm:p-6 z-[110]">
            <div className="text-white/80 font-medium text-sm">
              {lightboxIndex + 1} / {galleryImages.length}
            </div>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-2 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            <button
              className="absolute left-4 z-[110] w-12 h-12 flex items-center justify-center text-white/50 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-all cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
              }}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <div className="w-full h-full p-4 sm:p-8 flex items-center justify-center cursor-pointer" onClick={() => setIsLightboxOpen(false)}>
              <img
                src={galleryImages[lightboxIndex] ? optimizeImageUrl(galleryImages[lightboxIndex], 1920) : undefined}
                alt={`Hình ảnh ${lightboxIndex + 1}`}
                className="max-w-full max-h-full object-contain cursor-default"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <button
              className="absolute right-4 z-[110] w-12 h-12 flex items-center justify-center text-white/50 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-all cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
              }}
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>
          <div className="h-24 sm:h-32 bg-black/50 p-4 overflow-x-auto flex items-center justify-center gap-2 hide-scrollbar">
            {galleryImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setLightboxIndex(idx)}
                className={`relative h-16 sm:h-20 aspect-video rounded-md overflow-hidden shrink-0 transition-all cursor-pointer ${
                  idx === lightboxIndex ? "ring-2 ring-white scale-105" : "opacity-50 hover:opacity-100"
                }`}
              >
                <img
                  src={img ? optimizeImageUrl(img, 200) : undefined}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  alt={`Thumbnail ${idx + 1}`}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
