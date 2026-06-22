import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  db,
  doc,
  onSnapshot,
  getDoc,
  setDoc,
} from "./firebase";
import { AnimatePresence, motion } from "motion/react";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  ArrowUp,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Compass,
  ShieldCheck,
  Heart,
  User,
  Send,
  Star,
  Clock,
  Sparkles,
  Layers,
  Settings2,
  ArrowDown,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Wand2,
  Save,
  Layout,
  ChevronLeft,
  ChevronRight,
  Ban,
  MessageSquare,
  X,
} from "lucide-react";
import { handleFirestoreError, OperationType } from "./firebase-errors";
import { RouteState, Product } from "./types";
import { getPageDefaultSections, GENERIC_CUSTOM_SECTIONS } from "./lib/layouts";
import { notifyAdminEmail } from "./lib/email";
import { generateSlug } from "./lib/utils";
import {
  parseSlugTitleFromPath,
  resolveItemTitle,
  setDocumentFavicon,
  setDocumentTitle,
} from "./lib/documentHead";
import { Helmet } from "react-helmet-async";

// Children Components
import Navbar from "./components/Navbar";
import Home from "./components/Home";

// Lazy loaded for performance (Code Splitting like Next.js)
const ProductList = React.lazy(() => import("./components/ProductList"));
const ProjectList = React.lazy(() => import("./components/ProjectList"));
const NewsList = React.lazy(() => import("./components/NewsList"));
const NewsDetail = React.lazy(() => import("./components/NewsDetail"));
const ProjectDetail = React.lazy(() => import("./components/ProjectDetail"));
const ProductDetail = React.lazy(() => import("./components/ProductDetail"));
const AdminPanel = React.lazy(() => import("./components/AdminPanel"));
const ContactPage = React.lazy(() => import("./components/ContactPage"));
const LatestPropertiesPage = React.lazy(
  () => import("./components/LatestPropertiesPage"),
);
const TermsOfUse = React.lazy(() => import("./components/TermsOfUse"));
const PrivacyPolicy = React.lazy(() => import("./components/PrivacyPolicy"));
const CookieConsent = React.lazy(() => import("./components/CookieConsent"));
const FavoritesPage = React.lazy(() => import("./components/FavoritesPage"));

// Converts UI sections (which can have nested arrays like tableData.rows) into Firestore-compatible format
function serializeSectionsForFirestore(sects: any[]): any[] {
  if (!Array.isArray(sects)) return [];
  return sects.map((sect) => {
    if (!sect) return sect;
    const newSect = { ...sect };
    if (newSect.extraData) {
      const newExtraData = { ...newSect.extraData };
      if (Array.isArray(newExtraData.elements)) {
        newExtraData.elements = newExtraData.elements.map((el: any) => {
          if (el && el.type === "table" && el.tableData) {
            const newTableData = { ...el.tableData };
            if (Array.isArray(newTableData.rows)) {
              newTableData.rows = newTableData.rows.map((row: any) => {
                if (Array.isArray(row)) {
                  return { cols: row };
                }
                return row;
              });
            }
            return { ...el, tableData: newTableData };
          }
          return el;
        });
      }
      newSect.extraData = newExtraData;
    }
    return newSect;
  });
}

// RESTORES Firestore-stored sections back to the nested arrays expected by UI components
function deserializeSectionsFromFirestore(sects: any[]): any[] {
  if (!Array.isArray(sects)) return [];
  return sects.map((sect) => {
    if (!sect) return sect;
    const newSect = { ...sect };
    if (newSect.extraData) {
      const newExtraData = { ...newSect.extraData };
      if (Array.isArray(newExtraData.elements)) {
        newExtraData.elements = newExtraData.elements.map((el: any) => {
          if (el && el.type === "table" && el.tableData) {
            const newTableData = { ...el.tableData };
            if (Array.isArray(newTableData.rows)) {
              newTableData.rows = newTableData.rows.map((row: any) => {
                if (row && typeof row === "object" && Array.isArray(row.cols)) {
                  return row.cols;
                }
                return row;
              });
            }
            return { ...el, tableData: newTableData };
          }
          return el;
        });
      }
      newSect.extraData = newExtraData;
    }
    return newSect;
  });
}

function sanitizeHomeSections(sects: any[]): any[] {
  if (!Array.isArray(sects)) return [];
  // 1. Remove custom_testimonials or any testimonial sections, reviews, feedback, or opinions
  let filtered = sects.filter((s) => {
    if (!s) return false;
    const lowerId = (s.id || "").toLowerCase();
    const lowerName = (s.name || "").toLowerCase();
    const lowerTitle = (s.title || "").toLowerCase();

    if (
      lowerId.includes("testimonial") ||
      lowerId.includes("opinion") ||
      lowerId.includes("feedback") ||
      lowerId.includes("review")
    ) {
      return false;
    }
    if (
      lowerName.includes("ý kiến") ||
      lowerName.includes("nhận xét") ||
      lowerName.includes("cảm nhận") ||
      lowerName.includes("testimonial")
    ) {
      return false;
    }
    if (lowerTitle.includes("ý kiến") && lowerTitle.includes("khách hàng")) {
      return false;
    }
    if (lowerTitle.includes("lời khẳng định từ quý hội viên")) {
      return false;
    }

    // Check if it's a free-form canvas that contains testimonial or pricing info
    if (
      s.id &&
      s.id.startsWith("custom_free_canvas") &&
      s.extraData &&
      Array.isArray(s.extraData.elements)
    ) {
      const hasTestimonialOrPricing = s.extraData.elements.some((el: any) => {
        if (!el) return false;
        const lowerElContent = (el.content || "").toLowerCase();
        if (
          lowerElContent.includes("ý kiến") ||
          lowerElContent.includes("báo giá") ||
          lowerElContent.includes("trị giá") ||
          lowerElContent.includes("testimonial")
        ) {
          return true;
        }
        if (
          el.type === "table" &&
          el.tableData &&
          Array.isArray(el.tableData.headers)
        ) {
          const lowerHeaders = el.tableData.headers.join(" ").toLowerCase();
          if (
            lowerHeaders.includes("mức giá") ||
            lowerHeaders.includes("báo giá")
          ) {
            return true;
          }
        }
        return false;
      });
      if (hasTestimonialOrPricing) {
        return false; // Remove the entire section!
      }
    }
    return true;
  });

  filtered = filtered.map((s) => {
    let newS = { ...s };
    const targetStr1 = "Phân Phối Bất Động Sản";
    const targetStr2 = "Xanh, Sang & Đẳng Cấp";
    const replacement = "Greenia Homes Phân phối, Chuyển nhượng BĐS Chuyên nghiệp";
    
    if (typeof newS.title === "string") {
      newS.title = newS.title.replace(new RegExp(`${targetStr1}[\\s\\n]*${targetStr2}|${targetStr1}[\\s\\n]*\\[gradient\\]${targetStr2}\\[/gradient\\]`, 'gi'), replacement);
      // also match HTML tags around gradient
      newS.title = newS.title.replace(/Phân Phối Bất Động Sản/gi, "Greenia Homes Phân phối, Chuyển nhượng BĐS Chuyên nghiệp");
      newS.title = newS.title.replace(/Xanh, Sang & Đẳng Cấp/gi, "");
    }
    if (typeof newS.subtitle === "string") {
      newS.subtitle = newS.subtitle.replace(/Phân Phối Bất Động Sản[\s\n]*Xanh, Sang & Đẳng Cấp/gi, replacement);
      newS.subtitle = newS.subtitle.replace(/Phân Phối Bất Động Sản/gi, "Greenia Homes Phân phối, Chuyển nhượng BĐS Chuyên nghiệp");
      newS.subtitle = newS.subtitle.replace(/Xanh, Sang & Đẳng Cấp/gi, "");
    }
    if (typeof newS.description === "string") {
      newS.description = newS.description.replace(/Phân Phối Bất Động Sản[\s\n]*Xanh, Sang & Đẳng Cấp/gi, replacement);
      newS.description = newS.description.replace(/Phân Phối Bất Động Sản/gi, "Greenia Homes Phân phối, Chuyển nhượng BĐS Chuyên nghiệp");
      newS.description = newS.description.replace(/Xanh, Sang & Đẳng Cấp/gi, "");
    }
    return newS;
  });

  // 2. Ensure news section exists and is visible
  const hasNews = filtered.some((s) => s && s.id === "news");
  if (!hasNews) {
    const newsDefaultObj = {
      id: "news",
      name: "Kinh Nghiệm & Phân Tích Địa Ốc",
      visible: true,
      paddingTop: 80,
      paddingBottom: 80,
      title: "Kinh Nghiệm & Phân Tích Địa Ốc",
      subtitle: "Góc nhìn chuyên gia",
      description:
        "Tin nhanh vi mô và phong thủy phong phú cung cấp từ đội ngũ biên soạn Greenia.",
    };
    filtered.push(newsDefaultObj);
  } else {
    // Make sure news is visible
    filtered = filtered.map((s) => {
      if (s && s.id === "news") {
        return { ...s, visible: true };
      }
      return s;
    });
  }

  return filtered;
}

export default function App() {
  const [route, setRoute] = useState<RouteState>({ screen: "home" });
  const [seeding, setSeeding] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const theme = "dark";

  // Global SEO tags managed by Firestore general configurations
  const [globalMetaTitle, setGlobalMetaTitle] = useState(
    "Greenia Homes - Cố Vấn Đầu Tư Bất Động Sản Chuyên Sâu",
  );
  const [globalMetaDesc, setGlobalMetaDesc] = useState(
    "Chào mừng đến với Greenia Homes - Đồng hành cùng nhà đầu tư bất động sản với pháp lý minh bạch và dữ liệu thực chiến.",
  );
  const [globalMetaKeywords, setGlobalMetaKeywords] = useState(
    "greenia homes, biet thu chateau, phu my hung, vinhomes, can ho hang sang, phong thuy bat dong san",
  );

  // LadiPage Builder Global States for All Pages!
  const isEditMode = false;
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null,
  );
  const [layoutLoading, setLayoutLoading] = useState(false);
  const [showQuotePopup, setShowQuotePopup] = useState(false);
  const [quoteName, setQuoteName] = useState("");
  const [quotePhone, setQuotePhone] = useState("");
  const [quoteEmail, setQuoteEmail] = useState("");
  const [quoteMessage, setQuoteMessage] = useState("");
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState(false);

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteName.trim() || !quotePhone.trim()) {
      triggerNotification(
        "Vui lòng cung cấp đầy đủ tên và số điện thoại.",
        "error",
      );
      return;
    }
    setQuoteSubmitting(true);
    try {
      // Create a clean URL that avoids AI studio iframe URL issues
      let friendlyUrl = `https://greeniahomes.vn/${route.screen}`;
      if (route.productId) friendlyUrl += `/${route.productId}`;
      if (route.projectId) friendlyUrl += `/${route.projectId}`;
      if (route.newsId) friendlyUrl += `/${route.newsId}`;

      await addDoc(collection(db, "consultations"), {
        name: quoteName.trim(),
        phone: quotePhone.trim(),
        email: quoteEmail.trim(),
        message: quoteMessage.trim(),
        createdAt: new Date().toISOString(),
        status: "pending",
        propertyTitle: "Báo Giá Yêu Cầu từ nút Floating",
        sourceUrl: friendlyUrl,
        ipAddress: "127.0.0.1",
      });

      // Email Notification (Simulated/Mocker)
      console.log(
        `[Email System] Sending notification to: thuankdbds@gmail.com`,
      );
      console.log(
        `[Email System] Subject: Khách Hàng Báo Giá Mới - ${quoteName.trim()}`,
      );

      // Async Email Fetch
      await notifyAdminEmail({
        name: quoteName.trim(),
        phone: quotePhone.trim(),
        email: quoteEmail.trim(),
        propertyTitle: "Báo Giá Yêu Cầu từ nút Floating",
        message: quoteMessage.trim(),
        sourceUrl: friendlyUrl,
      });

      setQuoteSuccess(true);
      triggerNotification("Đăng ký thành công! Chúng tôi sẽ liên hệ trong ít phút tới.", "success");
      setQuoteName("");
      setQuotePhone("");
      setQuoteEmail("");
      setQuoteMessage("");
      setTimeout(() => {
        closeQuotePopup();
      }, 2000);
    } catch (err) {
      triggerNotification("Lỗi khi gửi yêu cầu.", "error");
    } finally {
      setQuoteSubmitting(false);
    }
  };

  const closeQuotePopup = () => {
    setShowQuotePopup(false);
    setQuoteSuccess(false);
  };

  // Firestore layout state listener for the current active page!
  useEffect(() => {
    // Determine the layout document to fetch
    let layoutDocName = route.screen;
    if (route.screen === "category-news") layoutDocName = "tin-tuc";
    if (
      ["category-product", "latest-sales", "latest-rents"].includes(
        route.screen,
      )
    )
      layoutDocName = "san-pham";

    const editableScreens = [
      "home",
      "san-pham",
      "du-an",
      "tin-tuc",
      "lien-he",
      "category-news",
      "category-product",
      "latest-sales",
      "latest-rents",
    ];
    if (!editableScreens.includes(route.screen)) {
      setSections([]);
      setSelectedSectionId(null);
      return;
    }

    setLayoutLoading(true);
    const docRef = doc(db, "layouts", layoutDocName);
    const unsub = onSnapshot(
      docRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.sections && Array.isArray(data.sections)) {
            let loaded = deserializeSectionsFromFirestore(data.sections);

            let needsPatch = false;
            loaded = loaded.map((sec) => {
              if (!sec) return sec;
              if (
                sec.id === "featured_products" ||
                sec.id === "projects_featured_products"
              ) {
                let updated = { ...sec };
                if (updated.title === "Sản Phẩm Đang Thu Hút Nhất Sàn") {
                  updated.title = "Sản Phẩm Nổi Bật";
                  needsPatch = true;
                }
                if (
                  updated.description ===
                  "Quỹ căn thượng hạng thu hút lượt truy cập đông đảo nhất trong tuần từ giới tinh hoa Phú Mỹ Hưng."
                ) {
                  updated.description =
                    "Bộ sưu tập các bất động sản cao cấp được săn đón nhiều nhất, hội tụ giá trị đầu tư và chuẩn mực sống đẳng cấp.";
                  needsPatch = true;
                }
                return updated;
              }
              return sec;
            });
            if (layoutDocName === "tin-tuc") {
              if (!loaded.some((s) => s?.id === "news_bottom_sales")) {
                loaded.push({
                  id: "news_bottom_sales",
                  name: "BĐS Bán Mới Hot (Slide Gót Chân)",
                  visible: true,
                  paddingTop: 20,
                  paddingBottom: 20,
                  title: "Sản Phẩm Bán Mới Đề Xuất Sâu",
                  subtitle: "VẬN CHUYỂN TÀI LỘC",
                  description:
                    "Quỹ đất nền biệt thự vương giã sát đắp bờ sông xanh Phú Mỹ Hưng đang mở bán đợt đặc biệt.",
                });
                needsPatch = true;
              }
              if (!loaded.some((s) => s?.id === "news_bottom_rents")) {
                loaded.push({
                  id: "news_bottom_rents",
                  name: "BĐS Thuê Cao Cấp (Slide Gót Chân)",
                  visible: true,
                  paddingTop: 20,
                  paddingBottom: 40,
                  title: "Sản Phẩm Cho thuê Xu Hướng",
                  subtitle: "GIA TĂNG TRẢI NGHIỆM",
                  description:
                    "Căn hộ Sky Villa đẳng cấp có đầy đủ nội thất túc trực chờ đón cư dân thượng lưu xách vali vào ở ngay.",
                });
                needsPatch = true;
              }
            }

            if (needsPatch) {
              try {
                await setDoc(
                  docRef,
                  { sections: serializeSectionsForFirestore(loaded) },
                  { merge: true },
                );
              } catch (err) {
                console.error("Lỗi patch layout:", err);
              }
            }

            if (route.screen === "home") {
              const sanitized = sanitizeHomeSections(loaded);
              if (sanitized.length !== loaded.length) {
                try {
                  await setDoc(docRef, {
                    sections: serializeSectionsForFirestore(sanitized),
                  });
                } catch (writeErr) {
                  console.error(
                    "Lỗi đồng bộ tự động sanitize vào Firestore:",
                    writeErr,
                  );
                }
              }
              loaded = sanitized;
            }
            setSections(loaded);
          } else {
            let defaults = getPageDefaultSections(route.screen);
            if (route.screen === "home") {
              defaults = sanitizeHomeSections(defaults);
            }
            await setDoc(docRef, {
              sections: serializeSectionsForFirestore(defaults),
            });
            setSections(defaults);
          }
        } else {
          let defaults = getPageDefaultSections(route.screen);
          if (route.screen === "home") {
            defaults = sanitizeHomeSections(defaults);
          }
          try {
            await setDoc(docRef, {
              sections: serializeSectionsForFirestore(defaults),
            });
            setSections(defaults);
          } catch (e) {
            console.error("Lỗi đồng bộ cấu trúc mặc định:", e);
            setSections(defaults);
          }
        }
        setLayoutLoading(false);
      },
      (error) => {
        console.error(
          `Sự cố lắng nghe layout cho trang ${route.screen}:`,
          error,
        );
        let defaults = getPageDefaultSections(route.screen);
        if (route.screen === "home") {
          defaults = sanitizeHomeSections(defaults);
        }
        setSections(defaults);
        setLayoutLoading(false);
      },
    );

    return () => unsub();
  }, [route.screen]);

  // Firestore update layouts callback helper
  const handleUpdateSections = async (newSections: any[]) => {
    let layoutDocName = route.screen;
    if (route.screen === "category-news") layoutDocName = "tin-tuc";
    if (
      ["category-product", "latest-sales", "latest-rents"].includes(
        route.screen,
      )
    )
      layoutDocName = "san-pham";

    const editableScreens = [
      "home",
      "san-pham",
      "du-an",
      "tin-tuc",
      "lien-he",
      "category-news",
      "category-product",
      "latest-sales",
      "latest-rents",
    ];
    if (!editableScreens.includes(route.screen)) return;

    let updated = newSections;
    if (route.screen === "home") {
      updated = sanitizeHomeSections(newSections);
    }
    setSections(updated); // instant reactive state feedback

    try {
      const docRef = doc(db, "layouts", layoutDocName);
      await setDoc(docRef, {
        sections: serializeSectionsForFirestore(updated),
      });
    } catch (e) {
      console.error("Lỗi cập nhật cấu trúc trang:", e);
      triggerNotification(
        "Không thể tự động lưu sửa đổi vào Firestore. Vui lòng kiểm tra quyền.",
        "error",
      );
    }
  };

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "general"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.logoUrl) {
            setLogoUrl(data.logoUrl);
          } else {
            setLogoUrl("");
          }

          // Live update reactive global SEO states
          if (data.metaTitle) setGlobalMetaTitle(data.metaTitle);
          if (data.metaDescription) setGlobalMetaDesc(data.metaDescription);
          if (data.metaKeywords) setGlobalMetaKeywords(data.metaKeywords);

          // Dynamically insert/update tracking codes
          const analyticsId = (data.googleAnalyticsId || "").trim();
          const tagManagerId = (data.googleTagId || "").trim();
          const adsId = (data.googleAdsId || "").trim();

          const fbPixelId = (data.facebookPixelId || "").trim();
          const tkPixelId = (data.tiktokPixelId || "").trim();

          // 1. Google Analytics integration (G-XXXXXXXX)
          if (analyticsId) {
            const gaId = "ga-tracker-script-src";
            if (!document.getElementById(gaId)) {
              const script = document.createElement("script");
              script.id = gaId;
              script.async = true;
              script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`;
              document.head.appendChild(script);
            }
            const gaSetupId = "ga-tracker-script-setup";
            let setupScript = document.getElementById(
              gaSetupId,
            ) as HTMLScriptElement;
            if (!setupScript) {
              setupScript = document.createElement("script");
              setupScript.id = gaSetupId;
              document.head.appendChild(setupScript);
            }
            setupScript.text = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${analyticsId}');
          `;
          }

          // 2. Google Tag Manager integration (GTM-XXXXXXX)
          if (tagManagerId) {
            const gtmId = "gtm-tracker-script";
            let gtmScript = document.getElementById(gtmId) as HTMLScriptElement;
            if (!gtmScript) {
              gtmScript = document.createElement("script");
              gtmScript.id = gtmId;
              document.head.appendChild(gtmScript);
            }
            gtmScript.text = `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${tagManagerId}');
          `;
          }

          // 3. Google Ads integration (AW-XXXXXXXXXX)
          if (adsId) {
            const adsIdSrc = "ads-tracker-script-src";
            if (!document.getElementById(adsIdSrc)) {
              const script = document.createElement("script");
              script.id = adsIdSrc;
              script.async = true;
              script.src = `https://www.googletagmanager.com/gtag/js?id=${adsId}`;
              document.head.appendChild(script);
            }
            const adsSetupId = "ads-tracker-script-setup";
            let setupAds = document.getElementById(
              adsSetupId,
            ) as HTMLScriptElement;
            if (!setupAds) {
              setupAds = document.createElement("script");
              setupAds.id = adsSetupId;
              document.head.appendChild(setupAds);
            }
            setupAds.text = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('config', '${adsId}');
          `;
          }

          // 4. Facebook Pixel Integration
          if (fbPixelId) {
            const fbId = "fb-pixel-script";
            let fbScript = document.getElementById(fbId) as HTMLScriptElement;
            if (!fbScript) {
              fbScript = document.createElement("script");
              fbScript.id = fbId;
              document.head.appendChild(fbScript);
            }
            fbScript.text = `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${fbPixelId}');
            fbq('track', 'PageView');
          `;
          }

          // 5. TikTok Pixel Integration
          if (tkPixelId) {
            const tkId = "tiktok-pixel-script";
            let tkScript = document.getElementById(tkId) as HTMLScriptElement;
            if (!tkScript) {
              tkScript = document.createElement("script");
              tkScript.id = tkId;
              document.head.appendChild(tkScript);
            }
            tkScript.text = `
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=i+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
              ttq.load('${tkPixelId}');
              ttq.page();
            }(window, document, 'ttq');
          `;
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "settings/general");
      },
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (logoUrl) setDocumentFavicon(logoUrl);
  }, [logoUrl]);

  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    root.classList.add("dark");
    root.classList.remove("light");
    body.classList.add("dark");
    body.classList.remove("light");
  }, []);

  // Strip HTML utility to generate text description
  const stripHtmlText = (text: string) => {
    if (!text) return "";
    return text
      .replace(/<\/?[^>]+(>|$)/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  // Dynamically update document title and head metadata
  const updateHtmlMeta = (title: string, desc: string, keywords: string) => {
    document.title = title;

    // Meta description
    let descMeta = document.querySelector('meta[name="description"]');
    if (!descMeta) {
      descMeta = document.createElement("meta");
      descMeta.setAttribute("name", "description");
      document.head.appendChild(descMeta);
    }
    descMeta.setAttribute("content", desc);

    // Meta keywords
    let kwsMeta = document.querySelector('meta[name="keywords"]');
    if (!kwsMeta) {
      kwsMeta = document.createElement("meta");
      kwsMeta.setAttribute("name", "keywords");
      document.head.appendChild(kwsMeta);
    }
    kwsMeta.setAttribute("content", keywords);

    // Facebook / OpenGraph optimization
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute("content", title);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement("meta");
      ogDesc.setAttribute("property", "og:description");
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute("content", desc);
  };

  // Cập nhật title tạm từ slug URL ngay khi vào trang chi tiết
  useEffect(() => {
    const path = window.location.pathname;
    if (route.screen === "news-detail" && route.newsId) {
      const slugTitle = parseSlugTitleFromPath(path, "/news/");
      if (slugTitle) setDocumentTitle(`${slugTitle} | Greenia Homes`);
      return;
    }
    if (route.screen === "product-detail" && route.productId) {
      const slugTitle = parseSlugTitleFromPath(path, "/product/");
      if (slugTitle) setDocumentTitle(`${slugTitle} | Greenia Homes`);
      return;
    }
    if (route.screen === "project-detail" && route.projectId) {
      const slugTitle = parseSlugTitleFromPath(path, "/project/");
      if (slugTitle) setDocumentTitle(`${slugTitle} | Dự Án Greenia Homes`);
    }
  }, [route.screen, route.newsId, route.productId, route.projectId]);

  // SEO trang tĩnh + danh mục
  useEffect(() => {
    if (
      route.screen === "product-detail" ||
      route.screen === "project-detail" ||
      route.screen === "news-detail"
    ) {
      return;
    }

    let suffix = "";
    if (route.screen === "san-pham") suffix = " | Giỏ hàng Bất Động Sản";
    else if (route.screen === "du-an") suffix = " | Dự Án Quy Hoạch Nổi Bật";
    else if (route.screen === "tin-tuc") suffix = " | Cẩm Nang Phong Thủy & Tin Tức";
    else if (route.screen === "lien-he") suffix = " | Liên Hệ Chuyên Gia Môi Giới";
    else if (route.screen === "admin") suffix = " | Hệ Thống Tổng Đài Admin";

    if (route.screen === "category-news" && route.categoryName) {
      updateHtmlMeta(
        `${route.categoryName} | Cẩm Nang Phong Thủy & Tin Tức`,
        globalMetaDesc,
        globalMetaKeywords,
      );
      return;
    }

    if (route.screen === "category-product" && route.categoryName) {
      updateHtmlMeta(
        `Danh mục ${route.categoryName} | Giỏ hàng BĐS`,
        globalMetaDesc,
        globalMetaKeywords,
      );
      return;
    }

    if (route.screen === "latest-sales") {
      updateHtmlMeta(
        "Quỹ Biệt Thự & Nhà Bán Mới Nhất | Mua Bán BĐS",
        globalMetaDesc,
        globalMetaKeywords,
      );
      return;
    }

    if (route.screen === "latest-rents") {
      updateHtmlMeta(
        "Quỹ Căn Hộ & Nhà Cho thuê Mới Nhất | Cho thuê BĐS",
        globalMetaDesc,
        globalMetaKeywords,
      );
      return;
    }

    updateHtmlMeta(
      globalMetaTitle + (suffix ? suffix : ""),
      globalMetaDesc,
      globalMetaKeywords,
    );
  }, [route, globalMetaTitle, globalMetaDesc, globalMetaKeywords]);

  // SEO trang chi tiết – tách riêng để không bị globalMeta ghi đè
  useEffect(() => {
    let active = true;

    async function applyDetailSEO() {
      if (route.screen === "product-detail" && route.productId) {
        try {
          const docSnap = await getDoc(doc(db, "products", route.productId));
          if (!active || !docSnap.exists()) return;
          const item = docSnap.data();
          const draftTitle = resolveItemTitle(item, "Greenia Homes");
          const cleanDesc = stripHtmlText(item.description || item.title);
          const draftDesc =
            item.metaDesc ||
            item.seoDesc ||
            (cleanDesc.length > 155
              ? cleanDesc.substring(0, 155) + "..."
              : cleanDesc);
          const draftKeywords =
            item.metaKeywords ||
            item.seoKeywords ||
            `${item.category || "Bất động sản"}, ${item.district || "Nam Sài Gòn"}, greenia homes`;
          updateHtmlMeta(draftTitle, draftDesc, draftKeywords);

          const itemSlug = generateSlug(item.title);
          const currentPath = window.location.pathname;
          if (itemSlug && !currentPath.includes(itemSlug)) {
            window.history.replaceState(
              null,
              "",
              `/product/${itemSlug}-${route.productId}`,
            );
          }
        } catch (err) {
          console.error("SEO loading error for product", err);
        }
        return;
      }

      if (route.screen === "project-detail" && route.projectId) {
        try {
          const docSnap = await getDoc(doc(db, "projects", route.projectId));
          if (!active || !docSnap.exists()) return;
          const proj = docSnap.data();
          const draftTitle = resolveItemTitle(proj, "Dự Án Greenia Homes");
          const cleanDesc = stripHtmlText(proj.description || proj.title);
          const draftDesc =
            proj.metaDesc ||
            proj.seoDesc ||
            (cleanDesc.length > 155
              ? cleanDesc.substring(0, 155) + "..."
              : cleanDesc);
          const draftKeywords =
            proj.metaKeywords ||
            proj.seoKeywords ||
            `${proj.location || "Dự án"}, quy hoạch đại đô thị, greenia homes`;
          updateHtmlMeta(draftTitle, draftDesc, draftKeywords);

          const projSlug = generateSlug(proj.title);
          const currentPath = window.location.pathname;
          if (projSlug && !currentPath.includes(projSlug)) {
            window.history.replaceState(
              null,
              "",
              `/project/${projSlug}-${route.projectId}`,
            );
          }
        } catch (err) {
          console.error("SEO loading error for project", err);
        }
        return;
      }

      if (route.screen === "news-detail" && route.newsId) {
        try {
          const docSnap = await getDoc(doc(db, "news", route.newsId));
          if (!active || !docSnap.exists()) return;
          const article = docSnap.data();
          const draftTitle = resolveItemTitle(article, "Greenia Homes");
          const cleanDesc = stripHtmlText(
            article.content || article.description || article.title,
          );
          const draftDesc =
            article.metaDesc ||
            article.seoDesc ||
            (cleanDesc.length > 155
              ? cleanDesc.substring(0, 155) + "..."
              : cleanDesc);
          const draftKeywords =
            article.metaKeywords ||
            article.seoKeywords ||
            `${article.category || "Tin tức"}, kiến thức phong thủy, tin bat dong san`;
          updateHtmlMeta(draftTitle, draftDesc, draftKeywords);

          const newsSlug = generateSlug(article.title);
          const currentPath = window.location.pathname;
          if (newsSlug && !currentPath.includes(newsSlug)) {
            window.history.replaceState(
              null,
              "",
              `/news/${newsSlug}-${route.newsId}`,
            );
          }
        } catch (err) {
          console.error("SEO loading error for news", err);
        }
      }
    }

    applyDetailSEO();
    return () => {
      active = false;
    };
  }, [route.screen, route.productId, route.projectId, route.newsId]);

  // Custom Toast State
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Sync routing triggers for browsers
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (!path || path === "/" || path === "/home" || path === "#home") {
        setRoute({ screen: "home" });
      } else if (path === "/san-pham") {
        setRoute({ screen: "san-pham" });
      } else if (path === "/du-an") {
        setRoute({ screen: "du-an" });
      } else if (path === "/tin-tuc") {
        setRoute({ screen: "tin-tuc" });
      } else if (path === "/lien-he") {
        setRoute({ screen: "lien-he" });
      } else if (path.startsWith("/product/")) {
        // Extract the ID from the end of the URL (e.g. /product/slug-ID), or fallback to front (e.g. ID-slug)
        const pathPart = path.replace("/product/", "");
        const parts = pathPart.split("-");
        let id = parts[parts.length - 1];
        if (parts[0].length === 20 && /^[a-zA-Z0-9]+$/.test(parts[0])) {
          id = parts[0];
        }
        setRoute({ screen: "product-detail", productId: id });
      } else if (path.startsWith("/project/")) {
        const pathPart = path.replace("/project/", "");
        const parts = pathPart.split("-");
        let id = parts[parts.length - 1];
        if (parts[0].length === 20 && /^[a-zA-Z0-9]+$/.test(parts[0])) {
          id = parts[0];
        }
        setRoute({ screen: "project-detail", projectId: id });
      } else if (path.startsWith("/news/")) {
        const pathPart = path.replace("/news/", "");
        const parts = pathPart.split("-");
        let id = parts[parts.length - 1];
        if (parts[0].length === 20 && /^[a-zA-Z0-9]+$/.test(parts[0])) {
          id = parts[0];
        }
        setRoute({ screen: "news-detail", newsId: id });
      } else if (path === "/admin") {
        setRoute({ screen: "admin" });
      } else if (path.startsWith("/category-product/")) {
        const catName = decodeURIComponent(
          path.replace("/category-product/", ""),
        );
        setRoute({ screen: "category-product", categoryName: catName });
      } else if (path.startsWith("/category-news/")) {
        const catName = decodeURIComponent(path.replace("/category-news/", ""));
        setRoute({ screen: "category-news", categoryName: catName });
      } else if (path === "/latest-sales") {
        setRoute({ screen: "latest-sales" });
      } else if (path === "/latest-rents") {
        setRoute({ screen: "latest-rents" });
      } else if (path === "/terms-of-use") {
        setRoute({ screen: "terms-of-use" });
      } else if (path === "/privacy-policy") {
        setRoute({ screen: "privacy-policy" });
      } else {
        // Fallback for unknown paths
      }
    };

    window.addEventListener("popstate", handlePopState);
    handlePopState(); // Run once initially on load
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Update hash when React navigation triggers
  const handleNavigate = (newRoute: RouteState) => {
    setRoute(newRoute);
    window.scrollTo(0, 0); // Reset scroll position when navigating to a new page
    let targetPath = "/";

    if (newRoute.screen === "home") targetPath = "/";
    else if (newRoute.screen === "san-pham") targetPath = "/san-pham";
    else if (newRoute.screen === "du-an") targetPath = "/du-an";
    else if (newRoute.screen === "tin-tuc") targetPath = "/tin-tuc";
    else if (newRoute.screen === "lien-he") targetPath = "/lien-he";
    else if (newRoute.screen === "product-detail" && newRoute.productId)
      targetPath = `/product/${newRoute.slug ? `${newRoute.slug}-` : ""}${newRoute.productId}`;
    else if (newRoute.screen === "project-detail" && newRoute.projectId)
      targetPath = `/project/${newRoute.slug ? `${newRoute.slug}-` : ""}${newRoute.projectId}`;
    else if (newRoute.screen === "news-detail" && newRoute.newsId)
      targetPath = `/news/${newRoute.slug ? `${newRoute.slug}-` : ""}${newRoute.newsId}`;
    else if (newRoute.screen === "admin") targetPath = "/admin";
    else if (newRoute.screen === "category-product" && newRoute.categoryName)
      targetPath = `/category-product/${encodeURIComponent(newRoute.categoryName)}`;
    else if (newRoute.screen === "category-product")
      targetPath = "/category-product";
    else if (newRoute.screen === "category-news" && newRoute.categoryName)
      targetPath = `/category-news/${encodeURIComponent(newRoute.categoryName)}`;
    else if (newRoute.screen === "category-news") targetPath = "/category-news";
    else if (newRoute.screen === "latest-sales") targetPath = "/latest-sales";
    else if (newRoute.screen === "latest-rents") targetPath = "/latest-rents";
    else if (newRoute.screen === "terms-of-use") targetPath = "/terms-of-use";
    else if (newRoute.screen === "privacy-policy")
      targetPath = "/privacy-policy";

    if (targetPath && window.location.pathname !== targetPath) {
      window.history.pushState(null, "", targetPath);
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Toast helper setup
  const triggerNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Seeding sample data
  useEffect(() => {
    async function guaranteeSampleData() {
      try {
        const prodCol = collection(db, "products");
        const querySnapshot = await getDocs(prodCol);

        if (querySnapshot.empty) {
          console.log("Empty repository. Seeding custom-tailored database...");
          setSeeding(true);

          const seedProds = [
            {
              title: "Dinh Thự Đơn Lập Chateau Sông Sài Gòn Phú Mỹ Hưng Quận 7",
              priceText: "128 Tỷ VND",
              priceVal: 128000000000,
              type: "sale",
              district: "Quận 7",
              phone: "0932 966 700",
              imageUrl:
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
              description:
                "<h2>CHATEAU - KHU BIỆT THỰ THƯỢNG LƯU NHẤT NAM SÀI GÒN</h2><p>Chính chủ sang nhượng siêu biệt thự lâu đài Phú Mỹ Hưng. Toàn khu ôm quanh dải hoa viên công viên ven sông Sài Gòn, nơi hội tụ của các CEO, chủ tập đoàn lớn.</p><ul><li>Diện tích đất khuôn viên: 520m² (rộng rãi nhất lô góc).</li><li>Xây dựng: Trệt, lầu, 4 giếng trời phong thuỷ rước tài lộc cực thịnh.</li><li>Sổ hồng riêng chính chủ công chứng ngay.</li></ul>",
              category: "Biệt thự sinh thái",
              bedrooms: 5,
              area: 520,
              viewsCount: 150,
              createdAt: new Date().toISOString(),
              createdBy: "thuankdbds@gmail.com",
              approvalStatus: "approved",
            },
            {
              title: "Penthouse Thông Tầng Đỉnh Cao Masteri Thảo Điền Quận 2",
              priceText: "44 Triệu/tháng",
              priceVal: 44000000,
              type: "rent",
              district: "Quận 2",
              phone: "0932 966 700",
              imageUrl:
                "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800",
              description:
                "<h2>SỐNG TRÊN MÂY TẠI TRUNG TÂM THẢO ĐIỀN QUẬN 2</h2><p>Cho thuê Penthouse thông tầng siêu sang trọng tại tòa Masteri Thảo Điền. View 360 độ ngắm pháo hoa và toàn bộ khúc sông Sài Gòn ôm sầm uất.</p><ul><li>Diện tích: 280m², ban công ngập nắng xanh.</li><li>Layout thông minh với rạp hát gia đình, quầy bar khép kín thượng hạng.</li></ul>",
              category: "Chung cư cao cấp",
              bedrooms: 3,
              area: 280,
              viewsCount: 95,
              createdAt: new Date().toISOString(),
              createdBy: "thuankdbds@gmail.com",
              approvalStatus: "approved",
            },
            {
              title: "Đất Nền Biệt Thự Mặt Sông Nguyễn Văn Hưởng Quận 2",
              priceText: "95 Tỷ VND",
              priceVal: 95000000000,
              type: "sale",
              district: "Quận 2",
              phone: "0932 966 700",
              imageUrl:
                "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800",
              description:
                "<h2>QUỸ ĐẤT SÔNG CỰC HIẾM SỞ HỮU TRỌN ĐỜI THẢO ĐIỀN</h2><p>Lô đất mặt tiền Nguyễn Văn Hưởng, hướng ra toàn cảnh sông không bị khuất chắn bởi các tòa cao ốc xung quanh.</p><ul><li>Diện tích: 400m² sổ đỏ chính chủ xây dựng tự do.</li><li>Mặt tiền đường rộng rãi, an ninh compound khép kín.</li></ul>",
              category: "Đất nền sổ đỏ",
              bedrooms: 0,
              area: 400,
              viewsCount: 110,
              createdAt: new Date().toISOString(),
              createdBy: "Nguyenthanhthuan091095@gmail.com",
              approvalStatus: "approved",
            },
          ];

          for (const item of seedProds) {
            await addDoc(prodCol, item);
          }

          // Seed Projects
          const seedProjs = [
            {
              title: "Đại Đô Thị Quy Hoạch Vinhomes Can Gio",
              priceText: "Chỉ từ 6 tỷ/căn",
              priceVal: 6000000000,
              location: "Huyện Cần Giờ, TP. HCM",
              imageUrl:
                "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800",
              status: "opening",
              description:
                "<h1>SIÊU ĐÔ THỊ ĐẮP BIỂN QUY MÔ HOÀNG GIA</h1><p>Vinhomes Cần Giờ là dự án lấn biển tầm cỡ thế kỷ với trọn vẹn những đại công viên sinh thái, bến du thuyền rực rỡ và hệ sinh thái Vingroup thông minh bậc nhất.</p>",
              locationTab:
                "<h2>BÁN ĐẢO XANH GẦN BIỂN ĐÔNG</h2><p>Tọa lạc tại vùng sinh thái ngập mặn Cần Giờ, tận hưởng làn gió mát lành không bụi bặm đô thị.</p>",
              amenityTab:
                "<ul><li>Bãi biển nhân tạo nhân văn lớn Việt Nam</li><li>Thành phố ánh sáng mộng mơ hòn ngọc Viễn Đông</li></ul>",
              viewsCount: 220,
              createdAt: new Date().toISOString(),
            },
          ];
          const projCol = collection(db, "projects");
          for (const item of seedProjs) {
            await addDoc(projCol, item);
          }

          // Seed News articles
          const seedNews = [
            {
              title:
                "Nguyên Tắc Phong Thủy Chọn Nhà Ở Vượng Khí Cho Sức Khỏe Gia Chủ",
              category: "Phong thủy địa ốc",
              description:
                "Bí quyết chọn hướng gió tụ khí lành và khơi thông long mạch dòng tiền cho năm mới cát tường.",
              content:
                "<h1>TẦM QUAN TRỌNG CỦA HƯỚNG GIÓ VÀ ĐẤT BỒI</h1><p>Theo cụ Tả Ao, 'Địa thế long sinh địa ngọc'. Việc lựa chọn một căn nhà có khoảng minh đường thoáng đãng và có sông bao bọc hướng Đông Nam giúp tích lũy vượng khí, tài lộc cuộn cuộn.</p><h2>SỰ BIỂN HIỆN CỦA NƯỚC SÔNG</h2><p>Nên ưu tiên những lô đất có thế tựa sơn hướng thủy nhẹ nhàng, tránh góc chữ T hoặc ngã ba lớn đâm trực diện.</p>",
              imageUrl:
                "https://images.unsplash.com/photo-1628624747186-a941c476b7ef?auto=format&fit=crop&q=80&w=800",
              viewsCount: 250,
              author: "Admin",
              createdAt: new Date().toISOString(),
            },
          ];
          const newsCol = collection(db, "news");
          for (const item of seedNews) {
            await addDoc(newsCol, item);
          }

          console.log("Finished seeding full ecosystem.");
        }
      } catch (err) {
        console.error("Lỗi seeding dữ liệu khởi điểm:", err);
      } finally {
        setSeeding(false);
      }
    }

    guaranteeSampleData();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Section Reordering Logic
  const handleMoveSection = async (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    await handleUpdateSections(updated);
    triggerNotification("Đã dịch chuyển vị trí khối thành công!", "success");
  };

  // Section Padding Adjustment Logic
  const handlePaddingChange = async (
    index: number,
    field: "paddingTop" | "paddingBottom",
    val: number,
  ) => {
    const updated = [...sections];
    updated[index] = {
      ...updated[index],
      [field]: val,
    };
    await handleUpdateSections(updated);
  };

  // Section Visibility Toggle Logic
  const handleToggleVisibility = async (index: number) => {
    const updated = [...sections];
    updated[index] = {
      ...updated[index],
      visible: !updated[index].visible,
    };
    await handleUpdateSections(updated);
    triggerNotification(
      updated[index].visible
        ? "Đã đặt hiển thị khối thiết kế"
        : "Đã tạm thời ẩn khối thiết kế này",
      "success",
    );
  };

  // Add Dynamic LadiPage Component (Custom Section)
  const handleInsertCustomSection = async (presetIndex: number) => {
    const preset = GENERIC_CUSTOM_SECTIONS[presetIndex];
    if (!preset) return;

    const prefix = preset.prefix || "custom";
    const newBlock = {
      ...preset,
      id: `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      visible: true,
      paddingTop: preset.paddingTop || 60,
      paddingBottom: preset.paddingBottom || 60,
    };

    const updated = [...sections, newBlock];
    await handleUpdateSections(updated);
    triggerNotification(
      `Đã chèn khối "${preset.name}" đại diện LadiPage thành công!`,
      "success",
    );
  };

  // Delete Section Layout Block
  const handleDeleteSection = async (index: number) => {
    const item = sections[index];
    if (!item) return;

    const updated = sections.filter((_, i) => i !== index);
    await handleUpdateSections(updated);
    setSelectedSectionId(null);
    triggerNotification(
      `Đã gỡ bỏ khối "${item.name || item.id}" thành công!`,
      "success",
    );
  };

  // Helper title names for the designer panel active route config
  const getScreenDisplayName = () => {
    switch (route.screen) {
      case "home":
        return "Trang Chủ";
      case "san-pham":
        return "Giỏ BĐS";
      case "du-an":
        return "Dự Án Quy Hoạch";
      case "tin-tuc":
        return "Phong Thủy & Tin Tức";
      case "category-news":
        return `Danh mục: ${route.categoryName || ""}`;
      case "category-product":
        return `Danh mục BĐS: ${route.categoryName || ""}`;
      case "latest-sales":
        return "BĐS Chuyển Nhượng";
      case "latest-rents":
        return "BĐS Cho thuê";
      case "lien-he":
        return "Liên Hệ";
      default:
        return route.screen;
    }
  };

  const isEditableScreen = [
    "home",
    "san-pham",
    "du-an",
    "tin-tuc",
    "lien-he",
    "category-news",
    "category-product",
    "latest-sales",
    "latest-rents",
  ].includes(route.screen);

  if (route.screen === "admin") {
    return (
      <div
        className="min-h-screen w-full bg-slate-950 text-slate-105 font-sans"
        id="app-root"
      >
        {/* Toast Notification popups in Admin */}
        <AnimatePresence>
          {notification && (
            <motion.div
              id="toast-notification"
              initial={{ opacity: 0, y: -50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-lg border shadow-2xl backdrop-blur-md max-w-md w-[calc(100%-2rem)] ${
                notification.type === "success"
                  ? "bg-slate-900 border-amber-500/30 text-amber-400"
                  : "bg-slate-900 border-rose-500/30 text-rose-400"
              }`}
            >
              {notification.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <p className="text-xs sm:text-sm font-light text-slate-100 leading-relaxed font-display text-left">
                {notification.message}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AdminPanel
          onShowNotification={triggerNotification}
          onNavigate={handleNavigate}
          logoUrl={logoUrl}
        />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950 font-sans"
      id="app-root"
    >
      <Helmet>
        {logoUrl ? (
          <>
            <link rel="icon" href={logoUrl} />
            <link rel="apple-touch-icon" href={logoUrl} />
          </>
        ) : (
          <>
            <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
            <link rel="apple-touch-icon" href="/favicon.svg" />
          </>
        )}
      </Helmet>
      {/* Toast Notification popups */}
      <AnimatePresence>
        {notification && (
          <motion.div
            id="toast-notification"
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-lg border shadow-2xl backdrop-blur-md max-w-md w-[calc(100%-2rem)] ${
              notification.type === "success"
                ? "bg-slate-900 border-amber-500/30 text-amber-400"
                : "bg-slate-900 border-rose-500/30 text-rose-400"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <p className="text-xs sm:text-sm font-light text-slate-100 leading-relaxed font-display text-left">
              {notification.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Sticky Navigation */}
      <Navbar
        currentRoute={route}
        onNavigate={handleNavigate}
        onShowNotification={triggerNotification}
        logoUrl={logoUrl}
      />

      <div className="flex-1 flex flex-col lg:flex-row" id="app-workspace-flow">
        {/* Global Live Web Preview Render Screen */}
        <main className="flex-1 relative min-h-screen" id="main-viewport">
          {seeding && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 text-center py-2 text-[10px] text-amber-400 font-mono flex items-center justify-center gap-2 animate-pulse">
              <Compass className="w-4 h-4 animate-spin" />
              <span>
                Đang kết nối kho dữ liệu quy hoạch Phú Mỹ Hưng, vui lòng chờ
                giây lát...
              </span>
            </div>
          )}

          <React.Suspense
            fallback={
              <div className="flex h-screen items-center justify-center text-amber-500 font-mono text-sm tracking-widest">
                <Compass className="w-5 h-5 mr-2 animate-spin" /> VUI LÒNG
                CHỜ...
              </div>
            }
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={
                  route.screen +
                  (route.productId || "") +
                  (route.projectId || "") +
                  (route.newsId || "") +
                  (route.categoryName || "") +
                  (route.location || "") +
                  (route.priceRange || "") +
                  (route.areaRange || "")
                }
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {route.screen === "home" && (
                  <Home
                    onNavigate={handleNavigate}
                    onShowNotification={triggerNotification}
                    isEditMode={isEditMode}
                    sections={sections}
                    onUpdateSections={handleUpdateSections}
                    selectedSectionId={selectedSectionId}
                    setSelectedSectionId={setSelectedSectionId}
                  />
                )}

                {route.screen === "san-pham" && (
                  <ProductList
                    onNavigate={handleNavigate}
                    onShowNotification={triggerNotification}
                    isEditMode={isEditMode}
                    sections={sections}
                    onUpdateSections={handleUpdateSections}
                    selectedSectionId={selectedSectionId}
                    setSelectedSectionId={setSelectedSectionId}
                    initialLocation={route.location}
                    initialPriceRange={route.priceRange}
                    initialAreaRange={route.areaRange}
                  />
                )}

                {route.screen === "du-an" && (
                  <ProjectList
                    onNavigate={handleNavigate}
                    onShowNotification={triggerNotification}
                    isEditMode={isEditMode}
                    sections={sections}
                    onUpdateSections={handleUpdateSections}
                    selectedSectionId={selectedSectionId}
                    setSelectedSectionId={setSelectedSectionId}
                  />
                )}

                {(route.screen === "tin-tuc" ||
                  route.screen === "category-news") && (
                  <NewsList
                    onNavigate={handleNavigate}
                    onShowNotification={triggerNotification}
                    isEditMode={isEditMode}
                    sections={sections}
                    onUpdateSections={handleUpdateSections}
                    selectedSectionId={selectedSectionId}
                    setSelectedSectionId={setSelectedSectionId}
                    categoryName={route.categoryName}
                  />
                )}

                {route.screen === "lien-he" && (
                  <ContactPage
                    onNavigate={handleNavigate}
                    onShowNotification={triggerNotification}
                    isEditMode={isEditMode}
                    sections={sections}
                    onUpdateSections={handleUpdateSections}
                    selectedSectionId={selectedSectionId}
                    setSelectedSectionId={setSelectedSectionId}
                  />
                )}

                {route.screen === "product-detail" && route.productId && (
                  <ProductDetail
                    productId={route.productId}
                    onNavigate={handleNavigate}
                    onShowNotification={triggerNotification}
                    logoUrl={logoUrl}
                  />
                )}

                {route.screen === "project-detail" && route.projectId && (
                  <ProjectDetail
                    projectId={route.projectId}
                    onNavigate={handleNavigate}
                    onShowNotification={triggerNotification}
                    logoUrl={logoUrl}
                  />
                )}

                {route.screen === "news-detail" && route.newsId && (
                  <NewsDetail
                    newsId={route.newsId}
                    onNavigate={handleNavigate}
                    onShowNotification={triggerNotification}
                  />
                )}

                {route.screen === "category-product" && (
                  <ProductList
                    onNavigate={handleNavigate}
                    onShowNotification={triggerNotification}
                    isEditMode={isEditMode}
                    sections={sections}
                    onUpdateSections={handleUpdateSections}
                    selectedSectionId={selectedSectionId}
                    setSelectedSectionId={setSelectedSectionId}
                    initialCategory={route.categoryName}
                  />
                )}

                {route.screen === "favorites" && (
                  <FavoritesPage onNavigate={handleNavigate} />
                )}

                {route.screen === "terms-of-use" && (
                  <TermsOfUse onNavigate={handleNavigate} />
                )}

                {route.screen === "privacy-policy" && (
                  <PrivacyPolicy onNavigate={handleNavigate} />
                )}

                {route.screen === "latest-sales" && (
                  <ProductList
                    onNavigate={handleNavigate}
                    onShowNotification={triggerNotification}
                    isEditMode={isEditMode}
                    sections={sections}
                    onUpdateSections={handleUpdateSections}
                    selectedSectionId={selectedSectionId}
                    setSelectedSectionId={setSelectedSectionId}
                    initialType="sale"
                  />
                )}

                {route.screen === "latest-rents" && (
                  <ProductList
                    onNavigate={handleNavigate}
                    onShowNotification={triggerNotification}
                    isEditMode={isEditMode}
                    sections={sections}
                    onUpdateSections={handleUpdateSections}
                    selectedSectionId={selectedSectionId}
                    setSelectedSectionId={setSelectedSectionId}
                    initialType="rent"
                  />
                )}

                {route.screen === "admin" && (
                  <AdminPanel
                    onShowNotification={triggerNotification}
                    onNavigate={handleNavigate}
                    logoUrl={logoUrl}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </React.Suspense>
        </main>
      </div>

      <React.Suspense fallback={null}>
        <CookieConsent />
      </React.Suspense>

      {/* Footer block */}
      <footer
        className="bg-slate-950 border-t-2 border-amber-500 pt-12 pb-8 relative overflow-hidden"
        id="footer"
      >
        {/* Decorative Grid/Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(197,160,89,0.1)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-full h-[300px] bg-gradient-to-t from-[#0b1120] to-transparent pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 text-left">
            {/* Column 1: Info */}
            <div className="space-y-6 lg:col-span-1">
              <span className="font-display font-bold text-2xl text-amber-500 uppercase tracking-wide">
                Greenia Homes
              </span>
              <ul className="space-y-4 text-[13px] text-slate-300">
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Trụ sở:</strong> 67 Võ Văn Kiệt, P. An Lạc, Quận
                    Bình Tân, TP.HCM.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Văn phòng:</strong> 520 Võ Văn Kiệt, Quận Bình Tân,
                    TP.HCM.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Hotline:</strong> 0932 966 700
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Email:</strong> cskh@greeniahomes.vn
                  </span>
                </li>
              </ul>
            </div>

            {/* Column 2: Về Chúng Tôi */}
            <div className="space-y-6">
              <h3 className="font-display font-bold text-white text-sm uppercase tracking-wider relative pb-3 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-0.5 after:bg-amber-500">
                Về Chúng Tôi
              </h3>
              <ul className="space-y-3 text-[13px] text-slate-400">
                <li>
                  <button
                    onClick={() => handleNavigate({ screen: "home" })}
                    className="hover:text-amber-400 hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer bg-transparent border-none text-left"
                  >
                    <span className="text-amber-500 text-lg leading-none">
                      ›
                    </span>{" "}
                    Giới Thiệu
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate({ screen: "du-an" })}
                    className="hover:text-amber-400 hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer bg-transparent border-none text-left"
                  >
                    <span className="text-amber-500 text-lg leading-none">
                      ›
                    </span>{" "}
                    Dự Án
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate({ screen: "latest-sales" })}
                    className="hover:text-amber-400 hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer bg-transparent border-none text-left"
                  >
                    <span className="text-amber-500 text-lg leading-none">
                      ›
                    </span>{" "}
                    Chuyển Nhượng
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate({ screen: "tin-tuc" })}
                    className="hover:text-amber-400 hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer bg-transparent border-none text-left"
                  >
                    <span className="text-amber-500 text-lg leading-none">
                      ›
                    </span>{" "}
                    Tin Tức & Sự Kiện
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate({ screen: "lien-he" })}
                    className="hover:text-amber-400 hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer bg-transparent border-none text-left"
                  >
                    <span className="text-amber-500 text-lg leading-none">
                      ›
                    </span>{" "}
                    Liên Hệ
                  </button>
                </li>
                <li className="border-t border-white/5 pt-3">
                  <button
                    onClick={() => handleNavigate({ screen: "privacy-policy" })}
                    className="hover:text-amber-400 hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer bg-transparent border-none text-left"
                  >
                    <span className="text-amber-500 text-lg leading-none">
                      ›
                    </span>{" "}
                    Chính sách bảo mật
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate({ screen: "terms-of-use" })}
                    className="hover:text-amber-400 hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer bg-transparent border-none text-left"
                  >
                    <span className="text-amber-500 text-lg leading-none">
                      ›
                    </span>{" "}
                    Điều khoản sử dụng
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Sản Phẩm */}
            <div className="space-y-6">
              <h3 className="font-display font-bold text-white text-sm uppercase tracking-wider relative pb-3 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-0.5 after:bg-amber-500">
                Sản Phẩm
              </h3>
              <ul className="space-y-3 text-[13px] text-slate-400">
                <li>
                  <button
                    onClick={() => handleNavigate({ screen: "san-pham" })}
                    className="hover:text-amber-400 hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer bg-transparent border-none text-left"
                  >
                    <span className="text-amber-500 text-lg leading-none">
                      ›
                    </span>{" "}
                    Tất Cả Sản Phẩm
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate({ screen: "latest-sales" })}
                    className="hover:text-amber-400 hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer bg-transparent border-none text-left"
                  >
                    <span className="text-amber-500 text-lg leading-none">
                      ›
                    </span>{" "}
                    Chuyển Nhượng
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate({ screen: "latest-rents" })}
                    className="hover:text-amber-400 hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer bg-transparent border-none text-left"
                  >
                    <span className="text-amber-500 text-lg leading-none">
                      ›
                    </span>{" "}
                    Cho thuê
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      handleNavigate({
                        screen: "category-product",
                        categoryName: "Căn Hộ",
                      })
                    }
                    className="hover:text-amber-400 hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer bg-transparent border-none text-left"
                  >
                    <span className="text-amber-500 text-lg leading-none">
                      ›
                    </span>{" "}
                    Căn Hộ
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      handleNavigate({
                        screen: "category-product",
                        categoryName: "Nhà Phố - Biệt Thự",
                      })
                    }
                    className="hover:text-amber-400 hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer bg-transparent border-none text-left"
                  >
                    <span className="text-amber-500 text-lg leading-none">
                      ›
                    </span>{" "}
                    Nhà Phố - Biệt Thự
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Social Placeholder */}
            <div className="space-y-6 lg:col-span-1 border-l border-white/5 pl-0 lg:pl-10">
              <h3 className="font-display font-bold text-white text-sm uppercase tracking-wider relative pb-3 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-0.5 after:bg-amber-500">
                Kết Nối
              </h3>
              <p className="text-[13px] text-slate-400 leading-relaxed">
                Theo dõi Greenia Homes trên các nền tảng mạng xã hội để cập nhật
                thông tin dự án mới nhất.
              </p>
              <div className="flex gap-3">
                <a
                  href="https://www.facebook.com/greeniahomes"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-amber-500 hover:text-slate-950 hover:-translate-y-1 transition-all"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 320 512">
                    <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
                  </svg>
                </a>
                <a
                  href="https://www.youtube.com/@greeniahomes.vn"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-amber-500 hover:text-slate-950 hover:-translate-y-1 transition-all"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 576 512">
                    <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" />
                  </svg>
                </a>
                <a
                  href="https://www.tiktok.com/@greeniahomes.vn"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-amber-500 hover:text-slate-950 hover:-translate-y-1 transition-all"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 448 512">
                    <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z" />
                  </svg>
                </a>
                <a
                  href="https://zalo.me/0932966700"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-amber-500 hover:text-slate-950 hover:-translate-y-1 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10">
            <p className="text-[11px] text-slate-500 italic leading-relaxed text-justify mb-8">
              * Thông tin, hình ảnh, các tiện ích trên website chỉ mang tính
              chất tham khảo và có thể được điều chỉnh theo quy định của Chủ đầu
              tư hoặc cơ quan nhà nước có thẩm quyền tại từng thời điểm. Các cam
              kết chính thức sẽ được quy định cụ thể tại Hợp đồng mua bán. Chúng
              tôi không chịu trách nhiệm cho bất kỳ tổn thất nào phát sinh từ
              việc sử dụng thông tin trên trang web này mà chưa qua xác nhận
              trực tiếp từ chuyên viên tư vấn.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-white/50 bg-black/20 px-6 py-4 rounded-xl">
              <p>
                © {new Date().getFullYear()} <strong>Greenia Homes</strong>. All
                Rights Reserved.
              </p>
              <button
                onClick={scrollToTop}
                className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
              >
                <span>Về đầu trang</span>
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Action Buttons */}
      <div className="fixed z-50 pointer-events-none
        bottom-0 left-0 right-0 w-full bg-slate-900 border-t border-slate-800 p-1 flex flex-row items-center justify-around gap-1
        md:bottom-6 md:left-6 md:right-auto md:w-auto md:bg-transparent md:border-none md:p-0 md:flex-col md:items-start md:gap-3">
        
        {/* Gọi ngay */}
        <a
          href="tel:0932966700"
          className="flex flex-col md:flex-row flex-1 md:flex-none items-center justify-center md:justify-start gap-1 md:gap-0 md:hover:gap-[12px] bg-transparent md:bg-slate-900 border-none md:border md:border-emerald-900/50 md:hover:border-emerald-500 md:hover:bg-emerald-600 text-white p-0 md:hover:pr-[24px] rounded-none md:rounded-full shadow-none md:shadow-lg md:hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] md:hover:-translate-y-1 transition-all duration-300 pointer-events-auto group"
        >
          <div className="bg-emerald-500/20 md:bg-emerald-500/20 md:group-hover:bg-white text-[14px] text-emerald-500 md:text-emerald-400 md:group-hover:text-emerald-600 w-[40px] h-[40px] flex items-center justify-center rounded-full animate-pulse md:group-hover:animate-none shrink-0 transition-colors duration-300">
            <Phone className="w-[15px] h-[15px] md:w-5 md:h-5" />
          </div>
          <span className="text-[10px] md:text-[14px] font-medium md:font-bold capitalize md:normal-case tracking-wide text-slate-300 md:text-emerald-50 md:group-hover:text-white transition-all duration-300 whitespace-nowrap overflow-hidden md:max-w-0 md:opacity-0 md:group-hover:max-w-[200px] md:group-hover:opacity-100">
            <span className="md:hidden">Gọi ngay</span>
            <span className="hidden md:inline">0932 966 700</span>
          </span>
        </a>

        {/* Chat Zalo */}
        <a
          href="https://zalo.me/0932966700"
          target="_blank"
          rel="noreferrer"
          onClick={(e) => {
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
              e.preventDefault();
              window.location.href = "https://zalo.me/0932966700";
            }
          }}
          className="flex flex-col md:flex-row flex-1 md:flex-none items-center justify-center md:justify-start gap-1 md:gap-0 md:hover:gap-[12px] bg-transparent md:bg-slate-900 border-none md:border md:border-blue-900/50 md:hover:border-blue-400 md:hover:bg-blue-600 text-white p-0 md:hover:pr-[24px] rounded-none md:rounded-full shadow-none md:shadow-lg md:hover:shadow-[0_0_15px_rgba(37,99,235,0.5)] md:hover:-translate-y-1 transition-all duration-300 pointer-events-auto group"
        >
          <div className="bg-transparent w-[40px] h-[40px] rounded-full shrink-0 flex items-center justify-center transition-colors duration-300">
            <img 
              loading="lazy" 
              decoding="async" 
              src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg" 
              alt="Zalo" 
              className="w-[35px] h-[35px] object-contain drop-shadow-sm md:group-hover:drop-shadow-none" 
            />
          </div>
          <span className="text-[10px] md:text-[14px] font-medium md:font-bold capitalize md:normal-case tracking-wide text-slate-300 md:text-blue-50 md:group-hover:text-white transition-all duration-300 whitespace-nowrap overflow-hidden md:max-w-0 md:opacity-0 md:group-hover:max-w-[200px] md:group-hover:opacity-100">
            Zalo
          </span>
        </a>

        {/* Đăng ký tư vấn */}
        <button
          onClick={() => setShowQuotePopup(true)}
          className="flex flex-col md:flex-row flex-1 md:flex-none items-center justify-center md:justify-start gap-1 md:gap-0 md:hover:gap-[12px] bg-transparent md:bg-slate-900 border-none md:border md:border-amber-900/50 md:hover:border-amber-400 md:hover:bg-amber-500 text-white p-0 md:hover:pr-[24px] rounded-none md:rounded-full shadow-none md:shadow-lg md:hover:shadow-[0_0_15px_rgba(245,158,11,0.5)] md:hover:-translate-y-1 transition-all duration-300 pointer-events-auto group"
        >
          <div className="bg-amber-500/20 md:bg-amber-500/20 md:group-hover:bg-slate-900 text-amber-500 md:text-amber-400 md:group-hover:text-amber-400 p-0 w-[40px] h-[40px] rounded-full shrink-0 flex items-center justify-center transition-colors duration-300">
            <Mail className="w-[15px] h-[15px] md:w-5 md:h-5" />
          </div>
          <span className="text-[10px] md:text-[14px] font-medium md:font-bold capitalize md:normal-case tracking-wide text-slate-300 md:text-amber-50 md:group-hover:text-slate-900 transition-all duration-300 whitespace-nowrap overflow-hidden md:max-w-0 md:opacity-0 md:group-hover:max-w-[200px] md:group-hover:opacity-100">
            Đăng ký
          </span>
        </button>
      </div>

      <AnimatePresence>
        {showQuotePopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-[374px] h-[460px] bg-slate-900 border-0 rounded-[10px] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between pt-3 px-3 pb-[1px] md:pt-4 md:px-4 md:pb-[1px] border-b border-slate-800">
                <h3 className="text-base md:text-lg font-bold text-white font-display">
                  Tư vấn mua hồ sơ chuyên sâu
                </h3>
                <button
                  onClick={closeQuotePopup}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 md:p-4 pb-4 md:pb-5">
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2 text-[13px] text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>
                      <span className="font-semibold text-white">
                        Phân tích
                      </span>{" "}
                      quỹ căn, chính sách, tiện ích giúp Khách hàng lựa chọn căn
                      tốt nhất.
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-[13px] text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>
                      <span className="font-semibold text-white">
                        Giải đáp mọi thắc mắc
                      </span>{" "}
                      của khách hàng.
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-[13px] text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>
                      <span className="font-semibold text-white">
                        Tuyệt đối bảo mật
                      </span>{" "}
                      thông tin cá nhân.
                    </span>
                  </li>
                </ul>

                <h4 className="font-semibold text-white text-sm mb-3">
                  Thông tin liên hệ
                </h4>

                {quoteSuccess ? (
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mb-3">
                      <CheckCircle2 className="w-6 h-6 text-amber-500" />
                    </div>
                    <p className="text-amber-500 text-sm text-center font-medium">
                      Cảm ơn bạn! Chúng tôi đã nhận được thông tin.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleQuoteSubmit} className="space-y-3">
                    <div>
                      <input
                        type="text"
                        required
                        value={quoteName}
                        onChange={(e) => setQuoteName(e.target.value)}
                        className="w-full bg-[#081026] border border-slate-700 rounded-[10px] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-xs px-3 py-2 text-white placeholder-slate-500"
                        placeholder="Họ tên *"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        required
                        value={quotePhone}
                        onChange={(e) => setQuotePhone(e.target.value)}
                        className="w-full bg-[#081026] border border-slate-700 rounded-[10px] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-xs px-3 py-2 text-white placeholder-slate-500"
                        placeholder="Số điện thoại *"
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        value={quoteEmail}
                        onChange={(e) => setQuoteEmail(e.target.value)}
                        className="w-full bg-[#081026] border border-slate-700 rounded-[10px] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-xs px-3 py-2 text-white placeholder-slate-500"
                        placeholder="Email (Tùy chọn)"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={quoteMessage}
                        onChange={(e) => setQuoteMessage(e.target.value)}
                        className="w-full bg-[#081026] border border-slate-700 rounded-[10px] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-xs px-3 py-2 text-white placeholder-slate-500"
                        placeholder="Nhu cầu của bạn (Tùy chọn)"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={quoteSubmitting}
                      className="w-full py-2.5 rounded-[10px] font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs mt-2"
                    >
                      {quoteSubmitting ? "Đang gửi..." : "Nhận tư vấn ngay"}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
