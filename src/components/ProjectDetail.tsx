import React, { useState, useEffect, useRef, useMemo } from "react";
import { generateSlug } from "../lib/utils";
import { doc, getDoc, getDocs, collection, addDoc, db } from "../firebase";
import { Project, RouteState } from "../types";
import {
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

  const [isGalleryAutoplayPaused, setIsGalleryAutoplayPaused] = useState(false);
  const [isFloorPlanAutoplayPaused, setIsFloorPlanAutoplayPaused] =
    useState(false);
  const [isAmenityAutoplayPaused, setIsAmenityAutoplayPaused] = useState(false);

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
        }

        if (fetchedProject) {
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
            if (doc.id !== projectId && data.approvalStatus !== "rejected") {
              projList.push({ id: doc.id, ...data } as Project);
            }
          });
          setRelatedProjects(projList.slice(0, 3));
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
          className="w-full aspect-[16/9] rounded-xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950 [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0"
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
        <div className="w-full aspect-[16/9] rounded-xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950 [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0">
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
      <div className="bg-slate-900 aspect-[21/9] rounded-xl border border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-2">
        <MapPin className="w-8 h-8 text-amber-500/50 mb-2" />
        <h4 className="text-white text-sm font-semibold">
          Chưa có bản đồ vị trí 1/500
        </h4>
        <p className="text-xs text-slate-500 max-w-md">
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
              className="prose prose-invert max-w-none text-slate-300 text-[13px] md:text-[15px] overflow-hidden"
              dangerouslySetInnerHTML={{ __html: sec.content }}
            />
          </div>
        </div>
      </div>
    ));
  };

  const fallbackTitle = `${parseSlugTitleFromPath(typeof window !== "undefined" ? window.location.pathname : "", "/project/") || "Đang tải..."} | Dự Án Greenia Homes`;
  const pageTitle = project
    ? resolveItemTitle(project, "Dự Án Greenia Homes")
    : fallbackTitle;

  if (loading) {
    return (
      <>
        <Helmet>
          <title>{pageTitle}</title>
        </Helmet>
        <div
          className="py-32 text-center space-y-4 max-w-sm mx-auto"
          id="project-detail-loading"
        >
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-xs font-light">
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
        <title>{resolveItemTitle(project, "Dự Án Greenia Homes")}</title>
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
        <meta property="og:image" content={galleryImages[0]} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify(schemaOrgJSONLD)}
        </script>
      </Helmet>

      {/* Top Banner (Photo Gallery/Slider) */}
      <div
        className="relative w-full h-[50vh] sm:h-[60vh] md:h-[75vh] lg:h-[85vh] bg-slate-950 border-t border-slate-800 overflow-hidden group"
        onMouseEnter={() => setIsGalleryAutoplayPaused(true)}
      >
        {/* Background blur for active image */}
        <div
          className="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 transition-all duration-700"
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
                "-translate-x-[75vw] sm:-translate-x-[65vw] lg:-translate-x-[55vw] opacity-40 scale-90 z-20";
            else if (isNext)
              translation =
                "translate-x-[75vw] sm:translate-x-[65vw] lg:translate-x-[55vw] opacity-40 scale-90 z-20";

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
                  className={`w-full max-h-[85vh] object-contain rounded-md sm:rounded-lg shadow-2xl transition-all duration-700 ${isCenter ? "ring-1 ring-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]" : "cursor-pointer hover:opacity-100"}`}
                />
              </div>
            );
          })}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none z-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-transparent pointer-events-none z-20" />

        {/* Navigation Breadcrumb inside banner */}
        <div className="absolute top-4 sm:top-6 lg:top-8 left-0 right-0 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 z-40 pointer-events-none">
          <div className="flex items-center gap-2 text-[13px] md:text-sm text-slate-300 font-medium drop-shadow-md pointer-events-auto">
            <button
              onClick={() => onNavigate({ screen: "du-an" })}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-900/50 hover:bg-amber-500 hover:text-slate-950 text-white transition-colors cursor-pointer mr-2 backdrop-blur-sm"
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
            <span className="text-white font-semibold">{project.title}</span>
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
                  <div className="absolute inset-0 bg-black/30 group-hover/thumb:bg-black/10 transition-colors" />
                )}
              </button>
            ))}
          </div>

          <button className="hidden sm:flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-sm border border-slate-700/50 text-white px-3 sm:px-4 py-2 rounded-lg text-[11px] sm:text-xs font-semibold tracking-wider transition-colors pointer-events-auto mr-4 sm:mr-6 lg:mr-8 mb-2">
            <ImageIcon className="w-4 h-4" />
            <span>Tất cả ảnh</span>
          </button>
        </div>

        {/* Slider Controls (Mobile/Desktop) */}
        <button
          className="absolute z-40 left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-all pointer-events-auto"
          onClick={() =>
            setCurrentImageIndex((prev) =>
              prev === 0 ? galleryImages.length - 1 : prev - 1,
            )
          }
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          className="absolute z-40 right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-all pointer-events-auto"
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
        className={`sticky ${scrollDirection === "down" ? "top-0" : "top-10"} z-40 bg-slate-950/95 backdrop-blur-md border-b border-t-0 border-slate-800 shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-all duration-300 w-full sm:mx-0 px-4 sm:px-0 h-[38px] pb-0`}
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
                      ? "text-amber-500 font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 inset-x-0 h-px bg-amber-500" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="hidden md:flex items-center gap-4 text-slate-400 pr-2">
            <Heart className="w-5 h-5 hover:text-rose-500 cursor-pointer transition-colors" />
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="flex items-center justify-center bg-transparent border-none p-1"
                title="Chia sẻ dự án"
              >
                <Share2 className="w-5 h-5 hover:text-amber-500 cursor-pointer transition-colors" />
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
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto pl-[10px] pr-[10px] xl:px-8 pt-[10px] pb-[40px] lg:pt-[10px] lg:pb-[40px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 text-left">
          {/* Left Column (Content) */}
          <div className="lg:col-span-8 space-y-12">
            {renderCustomSections("before_overview")}

            <div
              id="overview"
              ref={(el) => (sectionRefs.current[0] = el)}
              className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pt-8 mt-[-32px]"
            >
              <h1 className="flex items-center gap-3 text-[25px] md:text-[26px] w-full max-w-[785px] font-bold font-serif my-[20px] drop-shadow-sm">
                <FileText className="w-[20px] h-[20px] md:w-8 md:h-8 text-amber-500 shrink-0" />
                <span className="text-[20px] md:text-[26px] text-amber-400 md:text-transparent md:bg-clip-text md:bg-gradient-to-r md:from-amber-200 md:via-amber-400 md:to-amber-600">
                  Tổng quan dự án {project.title}
                </span>
              </h1>

              {/* Thông tin chi tiết */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl pr-[9px] md:pr-8 space-y-6 pt-[0px] pb-[10px] pl-[10px] md:pl-[32px] mb-[10px]">
                <h3 className="text-[15px] font-bold text-white mb-[5px] h-[37px] pb-[16px] pt-[9px] border-b border-slate-800">
                  Thông tin chi tiết
                </h3>
                <div className="grid grid-cols-2 gap-x-4 sm:gap-x-12 gap-y-4 relative">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-800 hidden sm:block"></div>

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
                          className={`flex ${hasList ? "flex-col items-start gap-1.5" : "flex-col md:flex-row md:items-start md:justify-between gap-1 md:gap-4"} border-b border-slate-800/50 pb-[6px] md:pb-[2px]`}
                        >
                          <span className="text-slate-400 text-[13px] md:text-sm whitespace-nowrap">
                            {item.label}
                          </span>
                          <div
                            className={`text-white font-medium text-[13px] md:text-sm ${hasList ? "text-left w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1" : "text-left md:text-right min-w-0 break-words"}`}
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
                                        className="text-amber-500 hover:text-amber-400 underline"
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
                                    <span className="absolute left-1 top-[7px] w-1.5 h-1.5 rounded-full bg-amber-500"></span>
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
                    className={`prose prose-invert prose-p:mb-[10px] prose-img:my-[20px] prose-a:text-amber-500 hover:prose-a:text-amber-400 prose-a:font-medium prose-a:underline max-w-none text-slate-300 text-[13px] md:text-[15px] overflow-hidden transition-all duration-500 ease-in-out ${isDescriptionExpanded ? "max-h-none" : "max-h-[300px]"}`}
                    dangerouslySetInnerHTML={{
                      __html:
                        project.description ||
                        "<p>Chưa có thông tin tổng quan cập nhật bằng mã HTML.</p>",
                    }}
                  />

                  {project.description && !isDescriptionExpanded && (
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
                  )}
                </div>

                {project.description && (
                  <button
                    onClick={() =>
                      setIsDescriptionExpanded(!isDescriptionExpanded)
                    }
                    className="flex items-center gap-2 text-amber-500 hover:text-amber-400 font-medium text-[13px] md:text-sm transition-colors mt-2"
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
                  <div className="text-slate-400 text-[13px] md:text-sm italic border-l-2 border-amber-500 pl-4 py-2 bg-slate-900/50">
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
                ref={(el) => (sectionRefs.current[7] = el)}
                className="space-y-8 pt-[20px] mt-[-32px]"
              >
                <h2 className="flex items-center gap-3 text-[20px] md:text-[26px] font-bold font-serif mb-0 drop-shadow-sm">
                  <Building2 className="w-[20px] h-[20px] md:w-8 md:h-8 text-amber-500 shrink-0" />
                  <span className="text-[20px] md:text-[26px] text-amber-400 md:text-transparent md:bg-clip-text md:bg-gradient-to-r md:from-amber-200 md:via-amber-400 md:to-amber-600">
                    Khu của {project.title}
                  </span>
                </h2>
                <div className="space-y-6">
                  {project.subdivisionTab && (
                    <div className="relative">
                      <div
                        className={`prose prose-invert prose-a:text-amber-500 hover:prose-a:text-amber-400 prose-a:font-medium prose-a:underline max-w-none text-slate-300 text-[13px] md:text-[15px] overflow-hidden transition-all duration-500 ease-in-out ${isSubdivisionExpanded ? "max-h-none" : "max-h-[300px]"}`}
                        dangerouslySetInnerHTML={{
                          __html: project.subdivisionTab,
                        }}
                      />
                      {!isSubdivisionExpanded && (
                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
                      )}
                    </div>
                  )}
                  {project.subdivisionTab && (
                    <button
                      onClick={() =>
                        setIsSubdivisionExpanded(!isSubdivisionExpanded)
                      }
                      className="flex items-center gap-2 text-amber-500 hover:text-amber-400 font-medium text-[13px] md:text-sm transition-colors mt-2"
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
                            className="min-w-[280px] w-[300px] shrink-0 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden snap-start flex flex-col items-start relative group"
                          >
                            <div className="relative w-full aspect-[16/9] overflow-hidden bg-slate-950">
                              {card.status && (
                                <div className="absolute top-3 left-3 z-10 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-sm tracking-wide pl-[10px] -ml-[12px] -mt-[13px]">
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
                                  <div className="text-[13px] md:text-sm text-slate-400 shrink-0 mt-0.5">
                                    Phân khu
                                  </div>
                                  <div className="text-[13px] md:text-sm text-slate-200 font-medium text-right">
                                    {card.projectStr || project.title}
                                  </div>
                                </div>
                                <div className="flex items-start justify-between gap-2 pt-[10px] mb-0">
                                  <div className="text-[13px] md:text-sm text-slate-400 shrink-0 mt-0.5">
                                    Phong cách
                                  </div>
                                  <div className="text-[13px] md:text-sm text-slate-200 font-medium text-right">
                                    {card.styleStr || "Hiện đại"}
                                  </div>
                                </div>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="text-[13px] md:text-sm text-slate-400 shrink-0 mt-0.5">
                                    Giá bán
                                  </div>
                                  <div className="text-[13px] md:text-sm text-amber-500 font-bold text-right">
                                    {card.priceStr || "Đang cập nhật"}
                                  </div>
                                </div>
                              </div>
                              {card.types && card.types.length > 0 && (
                                <div className="pt-3 mb-1 border-t border-slate-800">
                                  <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
                                    Loại hình
                                  </div>
                                  <div className="grid grid-cols-2 gap-y-2 gap-x-2 text-[13px] text-slate-300">
                                    {card.types.map((type, tIdx) => (
                                      <div
                                        key={tIdx}
                                        className="flex items-center gap-1.5 truncate"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                        <span className="truncate">{type}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="px-4 py-[10px] w-full border-t border-slate-800 mt-auto">
                              <button
                                onClick={() => {
                                  if (card.linkedProjectId) {
                                    onNavigate({
                                      screen: "project-detail",
                                      projectId: card.linkedProjectId,
                                      slug: generateSlug(card.title || "du-an"),
                                    });
                                  } else {
                                    window.scrollTo({
                                      top: 0,
                                      behavior: "smooth",
                                    });
                                  }
                                }}
                                className="w-full py-[5px] rounded-lg border border-slate-700 hover:border-amber-500 hover:bg-slate-800 text-white text-[13px] md:text-sm font-semibold transition-colors"
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
              ref={(el) => (sectionRefs.current[1] = el)}
              className="space-y-8 pt-8 mt-[-32px]"
            >
              <h2 className="flex items-center gap-3 text-[20px] md:text-[26px] font-bold font-serif drop-shadow-sm">
                <MapPin className="w-[20px] h-[20px] md:w-8 md:h-8 text-amber-500 shrink-0" />
                <span className="text-[20px] md:text-[26px] text-amber-400 md:text-transparent md:bg-clip-text md:bg-gradient-to-r md:from-amber-200 md:via-amber-400 md:to-amber-600">
                  Vị trí {project.title}
                </span>
              </h2>
              <div className="space-y-6">
                {/* Mô tả ngắn (Khu vực soạn thảo) */}
                {project.locationShortDesc && (
                  <div
                    className="prose prose-invert max-w-none text-slate-300 text-[13px] md:text-[15px]"
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
                    className={`prose prose-invert max-w-none text-slate-300 text-[13px] md:text-[15px] overflow-hidden transition-all duration-500 ${isLocationExpanded ? "" : "max-h-[250px]"}`}
                    dangerouslySetInnerHTML={{
                      __html:
                        project.locationTab ||
                        "<p>Chưa có bài viết giới thiệu vị trí cụ thể.</p>",
                    }}
                  />
                  {!isLocationExpanded && project.locationTab && (
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
                  )}
                </div>

                {project.locationTab && (
                  <button
                    onClick={() => setIsLocationExpanded(!isLocationExpanded)}
                    className="flex items-center gap-2 text-amber-500 hover:text-amber-400 font-medium text-[13px] md:text-sm transition-colors mt-2"
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
              ref={(el) => (sectionRefs.current[2] = el)}
              className="space-y-8 pt-8 mt-[-32px]"
            >
              <h2 className="flex items-center gap-3 text-[20px] md:text-[26px] font-bold font-serif drop-shadow-sm">
                <Sparkles className="w-[20px] h-[20px] md:w-8 md:h-8 text-amber-500 shrink-0" />
                <span className="text-[20px] md:text-[26px] text-amber-400 md:text-transparent md:bg-clip-text md:bg-gradient-to-r md:from-amber-200 md:via-amber-400 md:to-amber-600">
                  Tiện ích {project.title}
                </span>
              </h2>
              <div className="space-y-6">
                <div className="relative">
                  <div
                    className={`prose prose-invert max-w-none text-slate-300 text-[13px] md:text-[15px] overflow-hidden transition-all duration-500 ${isAmenityExpanded ? "" : "max-h-[250px]"}`}
                    dangerouslySetInnerHTML={{
                      __html:
                        project.amenityTab ||
                        `<p>${project.title} sở hữu hệ sinh thái tiện ích đẳng cấp, đáp ứng trọn vẹn mọi nhu cầu sống, học tập, làm việc và giải trí.</p>`,
                    }}
                  />
                  {!isAmenityExpanded && project.amenityTab && (
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
                  )}
                </div>

                {project.amenityTab && (
                  <button
                    onClick={() => setIsAmenityExpanded(!isAmenityExpanded)}
                    className="flex items-center gap-2 text-amber-500 hover:text-amber-400 font-medium text-[13px] md:text-sm transition-colors mt-2"
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
                      className="relative w-full aspect-video md:aspect-[21/9] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden group"
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
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-all pointer-events-auto z-10"
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
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-all pointer-events-auto z-10"
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
                                ? "border-amber-500 shadow-sm"
                                : "border-slate-800 hover:border-slate-600 opacity-60 hover:opacity-100"
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
              ref={(el) => (sectionRefs.current[3] = el)}
              className="space-y-8 pt-8 mt-[-32px]"
            >
              <h2 className="flex items-center gap-3 text-[20px] md:text-[26px] font-bold font-serif drop-shadow-sm">
                <LayoutGrid className="w-[20px] h-[20px] md:w-8 md:h-8 text-amber-500 shrink-0" />
                <span className="text-[20px] md:text-[26px] text-amber-400 md:text-transparent md:bg-clip-text md:bg-gradient-to-r md:from-amber-200 md:via-amber-400 md:to-amber-600">
                  Mặt bằng {project.title}
                </span>
              </h2>

              {project.floorPlanImages &&
                project.floorPlanImages.length > 0 && (
                  <div
                    className="relative w-full aspect-video md:aspect-[21/9] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden group"
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
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-all pointer-events-auto z-10"
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
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-all pointer-events-auto z-10"
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
                              className={`w-2 h-2 rounded-full transition-all ${idx === currentFloorPlanImageIndex ? "bg-amber-500 w-6" : "bg-white/50 hover:bg-white/80"}`}
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
                      className={`prose prose-invert max-w-none text-slate-300 text-[13px] md:text-[15px] overflow-hidden transition-all duration-500 ${isFloorPlanExpanded ? "" : "max-h-[250px]"}`}
                      dangerouslySetInnerHTML={{ __html: project.floorPlanTab }}
                    />
                    {!isFloorPlanExpanded && project.floorPlanTab && (
                      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
                    )}
                  </div>

                  <button
                    onClick={() => setIsFloorPlanExpanded(!isFloorPlanExpanded)}
                    className="flex items-center gap-2 text-amber-500 hover:text-amber-400 font-medium text-[13px] md:text-sm transition-colors mt-2"
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
                  <div className="flex border-b border-slate-800 overflow-x-auto hide-scrollbar h-[30.5px]">
                    {project.floorPlanTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setCurrentFloorPlanTabId(tab.id);
                          setCurrentFloorPlanImageIndex(0);
                        }}
                        className={`px-4 sm:px-5 py-2 text-[13px] font-bold whitespace-nowrap transition-all flex border-b border-b-emerald-500/0 items-center justify-center gap-2 ${
                          currentFloorPlanTabId === tab.id
                            ? "border-b-emerald-500 text-emerald-400 bg-emerald-500/5"
                            : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
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
                            className="prose prose-invert max-w-none text-slate-300 text-[13px] md:text-[15px]"
                            dangerouslySetInnerHTML={{ __html: tab.content }}
                          />
                        )}
                        {tab.images && tab.images.length > 0 && (
                          <div className="pt-4 space-y-4">
                            <div className="relative w-full aspect-video md:aspect-[21/9] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden group">
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
                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-all pointer-events-auto z-10"
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
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-all pointer-events-auto z-10"
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
                                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full border border-white/10">
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
                                        ? "border-amber-500 shadow-sm"
                                        : "border-slate-800 hover:border-slate-600 opacity-60 hover:opacity-100"
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
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-4 shadow-sm">
                    <LayoutGrid className="w-10 h-10 text-amber-500 mx-auto opacity-80" />
                    <p className="text-xl font-bold text-amber-400">
                      Đang cập nhật mặt bằng
                    </p>
                    <p className="text-[13px] md:text-sm text-slate-400 max-w-lg mx-auto">
                      Vui lòng đăng ký nhận tư vấn chuyên sâu để nhận thông tin
                      sơ đồ mặt bằng và thiết kế chi tiết.
                    </p>
                  </div>
                )}
            </div>

            {renderCustomSections("after_floorplan")}

            <div
              id="price"
              ref={(el) => (sectionRefs.current[4] = el)}
              className="space-y-8 pt-8 mt-[-32px]"
            >
              <div className="flex justify-between items-end mb-4">
                <h2 className="flex items-center gap-3 text-[20px] md:text-[26px] font-bold font-serif drop-shadow-sm">
                  <Banknote className="w-[20px] h-[20px] md:w-8 md:h-8 text-amber-500 shrink-0" />
                  <span className="text-[20px] md:text-[26px] text-amber-400 md:text-transparent md:bg-clip-text md:bg-gradient-to-r md:from-amber-200 md:via-amber-400 md:to-amber-600">
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
                    className="text-amber-500 hover:text-amber-400 text-[13px] md:text-sm font-medium whitespace-nowrap"
                  >
                    Xem thêm
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate({ screen: "san-pham" })}
                    className="text-amber-500 hover:text-amber-400 text-[13px] md:text-sm font-medium whitespace-nowrap"
                  >
                    Xem thêm
                  </button>
                )}
              </div>
              {project.priceTab ? (
                <div className="space-y-6">
                  <div className="relative">
                    <div
                      className={`prose prose-invert max-w-none text-slate-300 text-[13px] md:text-[15px] overflow-hidden transition-all duration-500 ${isPriceExpanded ? "" : "max-h-[250px]"}`}
                      dangerouslySetInnerHTML={{ __html: project.priceTab }}
                    />
                    {!isPriceExpanded && project.priceTab && (
                      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
                    )}
                  </div>

                  {project.priceTab && (
                    <button
                      onClick={() => setIsPriceExpanded(!isPriceExpanded)}
                      className="flex items-center gap-2 text-amber-500 hover:text-amber-400 font-medium text-[13px] md:text-sm transition-colors mt-2"
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
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-4 shadow-sm">
                  <Banknote className="w-10 h-10 text-amber-500 mx-auto opacity-80" />
                  <p className="text-xl font-bold text-amber-400">
                    Đang cập nhật chính sách giá
                  </p>
                  <p className="text-[13px] md:text-sm text-slate-400 max-w-lg mx-auto">
                    Vui lòng đăng ký nhận tư vấn chuyên sâu để nhận thông tin
                    bảng giá chi tiết.
                  </p>
                </div>
              )}

              {/* Related Products */}
              {relatedProducts.length > 0 && (
                <div className="pt-8">
                  <h3 className="text-xl font-bold font-serif text-white mb-6">
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

            {relatedProjects.length > 0 && (
              <div className="space-y-8 pt-12 mt-[-32px] border-t border-slate-800/50">
                <div className="flex justify-between items-end mb-4">
                  <h2 className="flex items-center gap-3 text-[20px] md:text-[26px] font-bold font-serif drop-shadow-sm">
                    <Building2 className="w-[20px] h-[20px] md:w-8 md:h-8 text-amber-500 shrink-0" />
                    <span className="text-[20px] md:text-[26px] text-amber-400 md:text-transparent md:bg-clip-text md:bg-gradient-to-r md:from-amber-200 md:via-amber-400 md:to-amber-600">
                      Dự án liên quan
                    </span>
                  </h2>
                  <button
                    onClick={() => onNavigate({ screen: "du-an" })}
                    className="text-amber-500 hover:text-amber-400 text-[13px] md:text-sm font-medium whitespace-nowrap"
                  >
                    Xem thêm
                  </button>
                </div>
                <div className="flex overflow-x-auto gap-4 sm:gap-6 snap-x snap-mandatory pb-4 hide-scrollbar">
                  {relatedProjects.map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() =>
                        onNavigate({
                          screen: "project-detail",
                          projectId: proj.id,
                          slug: generateSlug(proj.title),
                        })
                      }
                      className="min-w-[280px] w-[280px] sm:min-w-[320px] sm:w-[320px] shrink-0 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden cursor-pointer group hover:border-amber-500/50 transition-colors snap-start flex flex-col"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                          loading="lazy"
                          decoding="async"
                          src={optimizeImageUrl(proj.images?.[0], 400) || undefined}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          alt={proj.title}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            (e.target as HTMLImageElement).src =
                              "/no-image.svg";
                          }}
                        />
                        <div className="absolute top-2 left-2 px-2 py-1 bg-amber-500 text-slate-950 text-[10px] font-bold uppercase rounded">
                          Đang mở bán
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <h4 className="text-lg font-bold text-white mb-2 line-clamp-1">
                          {proj.title}
                        </h4>
                        <div className="flex items-center gap-1 text-slate-400 text-xs mb-3">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="truncate">
                            {proj.locationTab
                              ?.replace(/<[^>]*>?/gm, "")
                              .substring(0, 30) || proj.title}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-slate-800 text-[11px] text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3 h-3 text-amber-500" />{" "}
                            {proj.developer || "Đang cập nhật"}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Leaf className="w-3 h-3 text-emerald-500" />{" "}
                            {proj.scale || "Đang cập nhật"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {renderCustomSections("after_price")}

            <div
              id="qa"
              ref={(el) => (sectionRefs.current[8] = el)}
              className="space-y-8 pt-12 mt-[-32px] border-t border-slate-800/50"
            >
              <h2 className="flex items-center gap-3 text-[20px] md:text-[26px] font-bold font-serif drop-shadow-sm">
                <HelpCircle className="w-[20px] h-[20px] md:w-8 md:h-8 text-amber-500 shrink-0" />
                <span className="text-[20px] md:text-[26px] text-amber-400 md:text-transparent md:bg-clip-text md:bg-gradient-to-r md:from-amber-200 md:via-amber-400 md:to-amber-600">
                  Hỏi đáp {project.title}
                </span>
              </h2>

              <div className="space-y-6">
                {project.qaList && project.qaList.length > 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    {project.qaList.map((qa, index) => {
                      const isActive = activeQaIndex === index;
                      const isLast = index === project.qaList.length - 1;
                      return (
                        <div
                          key={index}
                          className={`transition-all duration-300 ${!isLast ? "border-b border-slate-800/80" : ""}`}
                        >
                          <button
                            onClick={() =>
                              setActiveQaIndex(isActive ? null : index)
                            }
                            className="w-full flex items-center justify-between px-4 pt-4 pb-[5px] text-left hover:bg-slate-800/50 transition-colors"
                          >
                            <span className="font-bold text-slate-200 text-[13px] md:text-base pr-4">
                              {qa.question}
                            </span>
                            {isActive ? (
                              <ChevronUp className="w-5 h-5 text-amber-500 shrink-0" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                            )}
                          </button>

                          <div
                            className={`transition-all duration-500 ease-in-out ${isActive ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}
                          >
                            <div className="px-4 pt-3 pb-[5px] text-slate-300 text-[13px] md:text-[15px] leading-relaxed border-t border-slate-800/50">
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
                      className={`prose prose-invert max-w-none text-slate-300 text-[13px] md:text-[15px] overflow-hidden transition-all duration-500 ${isQaExpanded ? "" : "max-h-[250px]"}`}
                      dangerouslySetInnerHTML={{ __html: project.qaTab }}
                    />
                    {!isQaExpanded && (
                      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">
                    Chưa có thông tin hỏi đáp cho dự án này.
                  </p>
                )}

                {(!project.qaList || project.qaList.length === 0) &&
                  project.qaTab && (
                    <button
                      onClick={() => setIsQaExpanded(!isQaExpanded)}
                      className="flex items-center gap-2 text-amber-500 hover:text-amber-400 font-medium text-[13px] md:text-sm transition-colors mt-2"
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
              ref={(el) => (sectionRefs.current[5] = el)}
              className="space-y-8 pt-12 mt-[-32px] border-t border-slate-800/50"
            >
              <div className="flex justify-between items-end mb-4">
                <h2 className="flex items-center gap-3 text-[20px] md:text-[26px] font-bold font-serif drop-shadow-sm">
                  <Newspaper className="w-[20px] h-[20px] md:w-8 md:h-8 text-amber-500 shrink-0" />
                  <span className="text-[20px] md:text-[26px] text-amber-400 md:text-transparent md:bg-clip-text md:bg-gradient-to-r md:from-amber-200 md:via-amber-400 md:to-amber-600">
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
                    className="text-amber-500 hover:text-amber-400 text-[13px] md:text-sm font-medium whitespace-nowrap"
                  >
                    Xem thêm
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate({ screen: "tin-tuc" })}
                    className="text-amber-500 hover:text-amber-400 text-[13px] md:text-sm font-medium whitespace-nowrap"
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
                      className="w-[85vw] sm:w-[calc(50%-12px)] lg:w-[calc(33.3333%-16px)] shrink-0 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden cursor-pointer group hover:border-amber-500/50 transition-all hover:shadow-lg hover:shadow-amber-500/10 snap-start flex flex-col"
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
                        <h4 className="text-base font-bold text-white line-clamp-2 group-hover:text-amber-400 transition-colors mb-2">
                          {news.title}
                        </h4>
                        <span className="text-xs text-slate-400 font-medium">
                          {news.createdAt
                            ? new Date(news.createdAt).toLocaleDateString(
                                "vi-VN",
                              )
                            : ""}
                        </span>
                        <div className="w-full h-px bg-slate-800/60 mt-0 mb-3"></div>
                        <p className="text-[13px] font-light md:text-[13px] font-light md:text-[13px] font-light md:text-[13px] font-light md:text-[13px] font-light md:text-[13px] font-light md:text-[13px] font-light md:text-[13px] font-light md:text-sm text-slate-300 line-clamp-3 mb-4 flex-1">
                          {news.description}
                        </p>
                        <div className="flex items-center text-amber-500 text-[13px] md:text-sm font-bold group-hover:text-amber-400 transition-colors mt-auto">
                          Xem thêm{" "}
                          <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 text-[13px] md:text-sm">
                    Đang cập nhật thêm tin tức và tiến độ liên quan đến dự án.
                  </div>
                )}
              </div>
            </div>

            {renderCustomSections("after_news")}

            {/* Hidden div to trigger contact section in IntersectionObserver, actual view is sidebar */}
            <div
              id="contact"
              ref={(el) => (sectionRefs.current[6] = el)}
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
              <div className="bg-slate-900 border border-slate-800 px-[20px] py-[10px] rounded-xl space-y-5 shadow-xl relative text-left">
                <div className="text-center space-y-1 pb-[5px] border-b border-slate-800/50 mb-[5px]">
                  <h3 className="text-white font-display font-bold text-lg tracking-wide mt-[5px]">
                    Tư vấn mua nhà chuyên sâu
                  </h3>
                  <p className="text-xs text-slate-400 pb-[5px]">
                    Chuyên viên Greenia Homes hỗ trợ 24/7
                  </p>
                </div>

                <div className="space-y-3 mb-[10px]">
                  <div className="flex items-start gap-2.5 pt-[5px] mb-[5px]">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      <span className="font-semibold text-white">
                        Phân tích
                      </span>{" "}
                      quỹ căn, chính sách, tiện ích giúp Khách hàng lựa chọn căn{" "}
                      <span className="font-semibold text-amber-400">
                        tốt nhất.
                      </span>
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5 mb-[5px]">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      <span className="font-semibold text-white">
                        Giải đáp mọi thắc mắc
                      </span>{" "}
                      của khách hàng nhanh chóng.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      <span className="font-semibold text-white">
                        Tuyệt đối bảo mật
                      </span>{" "}
                      thông tin cá nhân.
                    </p>
                  </div>
                </div>

                {formSubmitted ? (
                  <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl p-5 text-center space-y-3 animate-in zoom-in-95">
                    <div className="w-12 h-12 rounded-full border-2 border-emerald-500/30 flex items-center justify-center mx-auto bg-emerald-500/10 text-emerald-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h5 className="font-medium text-[15px] text-white">
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
                    className="space-y-3.5 pt-[10px]"
                  >
                    <div className="space-y-1 text-left">
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Họ tên *"
                        className="w-full bg-slate-950/60 border border-slate-700/50 text-slate-200 text-[13px] py-[5px] px-3.5 rounded-lg outline-none focus:border-amber-500/70 transition-colors"
                        required
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <input
                        type="tel"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="Số điện thoại *"
                        className="w-full bg-slate-950/60 border border-slate-700/50 text-slate-200 text-[13px] md:text-[13px] md:text-[13px] md:text-[13px] md:text-[13px] md:text-[13px] md:text-[13px] md:text-[13px] md:text-sm py-[5px] px-3.5 h-[32px] rounded-lg outline-none focus:border-amber-500/70 transition-colors"
                        required
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <input
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="Email *"
                        className="w-full bg-slate-950/60 border border-slate-700/50 text-slate-200 text-[13px] md:text-sm py-[5px] px-3.5 h-[32px] rounded-lg outline-none focus:border-amber-500/70 transition-colors"
                        required
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <textarea
                        value={clientDemand}
                        onChange={(e) => setClientDemand(e.target.value)}
                        placeholder="Nhu cầu tư vấn (VD: Tôi cần mua để ở...)"
                        rows={2}
                        className="w-full bg-slate-950/60 border border-slate-700/50 text-slate-200 text-[13px] md:text-[13px] md:text-[13px] md:text-[13px] md:text-[13px] md:text-[13px] md:text-[13px] md:text-[13px] md:text-sm py-[5px] px-3.5 rounded-lg outline-none focus:border-amber-500/70 transition-colors resize-none"
                      />
                    </div>

                    <div className="space-y-2.5 pt-2">
                      <label className="flex items-start gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="mt-0.5 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-transparent h-3.5 w-3.5 cursor-pointer"
                        />
                        <span className="text-[10px] text-slate-400 leading-snug group-hover:text-slate-300">
                          Tôi đã đọc và đồng ý với{" "}
                          <button
                            type="button"
                            onClick={() =>
                              onNavigate({ screen: "terms-of-use" })
                            }
                            className="underline text-amber-500 hover:text-amber-400"
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
                          className="mt-0.5 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-transparent h-3.5 w-3.5 cursor-pointer"
                        />
                        <span className="text-[10px] text-slate-400 leading-snug group-hover:text-slate-300">
                          Tôi đã đọc và đồng ý với{" "}
                          <button
                            type="button"
                            onClick={() =>
                              onNavigate({ screen: "privacy-policy" })
                            }
                            className="underline text-amber-500 hover:text-amber-400"
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
                      className="w-full my-0 bg-[#2D3F75] hover:bg-[#384c8a] disabled:opacity-50 text-white font-semibold py-[5px] px-4 rounded-lg text-[13px] md:text-[13px] md:text-[13px] md:text-[13px] md:text-[13px] md:text-[13px] md:text-[13px] md:text-[13px] md:text-sm transition-all cursor-pointer text-center"
                    >
                      {isSubmitting
                        ? "Đang gửi thông tin..."
                        : "Nhận tư vấn ngay"}
                    </button>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <a
                        href="tel:0932966700"
                        className="flex flex-col items-center justify-center gap-1 bg-slate-950/40 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg py-2 transition-colors cursor-pointer text-center"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium">
                          Gọi trực tiếp
                        </span>
                      </a>
                      <a 
                        href="https://zalo.me/0932966700"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center gap-1 bg-slate-950/40 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg py-2 transition-colors cursor-pointer text-center"
                      >
                        <img
                          loading="lazy"
                          decoding="async"
                          src="/zalo-icon.svg"
                          alt="Zalo"
                          className="w-4 h-4"
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
      </div>
    </div>
  );
}
