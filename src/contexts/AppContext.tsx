'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { db, doc, getDoc, setDoc } from '../firebase';
import { serializeSectionsForDatabase, deserializeSectionsFromDatabase, sanitizeHomeSections } from '../lib/layoutUtils';
import { getPageDefaultSections } from '../lib/layouts';
import { optimizeImageUrl } from '../lib/utils';
import type { VisualSection } from '../types';

interface AppContextType {
  sections: VisualSection[];
  setSections: (newSections: VisualSection[] | ((prev: VisualSection[]) => VisualSection[])) => void; // Chặn cập nhật sections để đồng bộ dữ liệu.
  isEditMode: boolean;
  setIsEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  isQuotePopupOpen: boolean;
  setIsQuotePopupOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

type LayoutDocName = 'home' | 'san-pham' | 'du-an' | 'tin-tuc' | 'lien-he' | null;

interface LayoutState {
  docName: LayoutDocName;
  sections: VisualSection[];
}

interface LayoutDocumentData {
  sections?: unknown;
}

interface ClientSettingsData {
  logoUrl?: string;
  metaTitle?: string;
  googleAnalyticsId?: string;
  googleTagId?: string;
  googleAdsId?: string;
  facebookPixelId?: string;
  tiktokPixelId?: string;
  cookieConsentEnabled?: boolean;
  quotePopupEnabled?: boolean;
  quotePopupDelaySeconds?: number;
  quotePopupFrequency?: "page-load" | "session" | "daily";
}

interface QuotePopupSettings {
  enabled: boolean;
  delaySeconds: number;
  frequency: "page-load" | "session" | "daily";
}

const EMPTY_SECTIONS: VisualSection[] = [];

const getSettingString = (value: unknown) => (typeof value === 'string' ? value : '');

function getLayoutDocName(path: string): LayoutDocName {
  if (path === '/') return 'home';
  if (path.startsWith('/san-pham') || path.startsWith('/category-product') || path === '/latest-sales' || path === '/latest-rents') return 'san-pham';
  if (path.startsWith('/du-an')) return 'du-an';
  if (path.startsWith('/tin-tuc') || path.startsWith('/category-news')) return 'tin-tuc';
  if (path.startsWith('/lien-he')) return 'lien-he';
  return null;
}

function getDefaultSections(docName: LayoutDocName) {
  if (!docName) return EMPTY_SECTIONS;

  const defaults = getPageDefaultSections(docName);
  return docName === 'home' ? sanitizeHomeSections(defaults) : defaults;
}

function usesServerProvidedLayout(docName: string | null) {
  return docName === 'home' || docName === 'san-pham' || docName === 'du-an' || docName === 'tin-tuc';
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const layoutDocName = getLayoutDocName(pathname || '');
  const [layoutState, setLayoutState] = useState<LayoutState>(() => ({
    docName: layoutDocName,
    sections: getDefaultSections(layoutDocName),
  }));
  // Không truyền sections của trang cũ cho trang mới trong lúc chờ dữ liệu từ máy chủ.
  const sections = layoutState.docName === layoutDocName
    ? layoutState.sections
    : getDefaultSections(layoutDocName);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isQuotePopupOpen, setIsQuotePopupOpen] = useState(false);
  const [quotePopupSettings, setQuotePopupSettings] = useState<QuotePopupSettings | null>(null);


  useEffect(() => {
    const docName = layoutDocName;
    let cancelled = false;

    if (!docName) {
      setLayoutState({ docName: null, sections: EMPTY_SECTIONS });
      return;
    }

    // Các trang này đã nhận bố cục Supabase từ Server Component, không tải lại ở client.
    if (usesServerProvidedLayout(docName)) {
      return;
    }

    const defaults = getDefaultSections(docName);
    setLayoutState({ docName, sections: defaults });

    const docRef = doc(db, 'layouts', docName);
    getDoc(docRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = (snapshot.data() || {}) as LayoutDocumentData;
        if (Array.isArray(data.sections)) {
          const loaded = deserializeSectionsFromDatabase<VisualSection>(data.sections as VisualSection[]);
          if (loaded.length === 0) {
            setDoc(docRef, { sections: serializeSectionsForDatabase(defaults) }).catch(console.error);
            if (!cancelled) setLayoutState({ docName, sections: defaults });
          } else if (!cancelled) {
            setLayoutState({ docName, sections: loaded });
          }
        } else {
          setDoc(docRef, { sections: serializeSectionsForDatabase(defaults) }).catch(console.error);
          if (!cancelled) setLayoutState({ docName, sections: defaults });
        }
      } else {
        setDoc(docRef, { sections: serializeSectionsForDatabase(defaults) }).catch(console.error);
        if (!cancelled) setLayoutState({ docName, sections: defaults });
      }
    }).catch((e) => {
      if (cancelled) return;
      console.error("Lỗi tải layout:", e);
      setLayoutState({ docName, sections: defaults });
    });

    return () => {
      cancelled = true;
    };
  }, [layoutDocName]);

  const setSections = async (newSections: VisualSection[] | ((prev: VisualSection[]) => VisualSection[])) => {
    // Resolve updater function if used
    const currentSections = layoutState.docName === layoutDocName
      ? layoutState.sections
      : getDefaultSections(layoutDocName);
    const updated = typeof newSections === 'function' ? newSections(currentSections) : newSections;
    
    let sanitized = updated;
    const docName = layoutDocName;
    if (docName === "home") {
      sanitized = sanitizeHomeSections(sanitized);
    }
    
    setLayoutState({ docName, sections: sanitized });

    if (isEditMode && docName) {
      try {
        const docRef = doc(db, 'layouts', docName);
        await setDoc(docRef, {
          sections: serializeSectionsForDatabase(sanitized),
        });
      } catch (e) {
        console.error("Lỗi cập nhật cấu trúc trang:", e);
        alert("Không thể tự động lưu sửa đổi vào Supabase. Vui lòng kiểm tra quyền.");
      }
    }
  };

  // Global Settings loading
  useEffect(() => {
    getDoc(doc(db, "settings", "general")).then((snapshot) => {
      if (snapshot.exists()) {
        const data = (snapshot.data() || {}) as ClientSettingsData;
        if (data.logoUrl) {
          localStorage.setItem('greenia_logoUrl', optimizeImageUrl(data.logoUrl, 100));
        }
        if (data.metaTitle) {
          localStorage.setItem("greenia_meta_title", data.metaTitle);
        }

        const popupFrequency = data.quotePopupFrequency;
        const popupDelay = Number(data.quotePopupDelaySeconds);
        setQuotePopupSettings({
          enabled: data.quotePopupEnabled !== false,
          delaySeconds: Number.isFinite(popupDelay)
            ? Math.min(60, Math.max(0, popupDelay))
            : 8,
          frequency:
            popupFrequency === "page-load" || popupFrequency === "daily" || popupFrequency === "session"
              ? popupFrequency
              : "page-load",
        });

        const loadTrackingScripts = () => {
        // Chỉ chèn mã theo dõi sau khi đã đáp ứng lựa chọn cookie.
        const analyticsId = getSettingString(data.googleAnalyticsId).trim();
        const tagManagerId = getSettingString(data.googleTagId).trim();
        const adsId = getSettingString(data.googleAdsId).trim();

        const fbPixelId = getSettingString(data.facebookPixelId).trim();
        const tkPixelId = getSettingString(data.tiktokPixelId).trim();

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

        // Delay injection of heavy tracking scripts to boost PageSpeed performance (TBT/TTI)
        setTimeout(() => {
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
            const tkId = "tk-pixel-script";
            let tkScript = document.getElementById(tkId) as HTMLScriptElement;
            if (!tkScript) {
              tkScript = document.createElement("script");
              tkScript.id = tkId;
              document.head.appendChild(tkScript);
            }
            tkScript.text = `
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
              ttq.load('${tkPixelId}');
              ttq.page();
            }(window, document, 'ttq');
          `;
          }
        }, 2000);
        };

        const requiresConsent = data.cookieConsentEnabled === true;
        if (!requiresConsent || localStorage.getItem('cookie_consent') === 'accepted') {
          loadTrackingScripts();
        } else {
          const handleConsent = (event: Event) => {
            const consentEvent = event as CustomEvent<{ status?: string }>;
            if (consentEvent.detail?.status === 'accepted') {
              loadTrackingScripts();
            }
            window.removeEventListener('cookie_consent_changed', handleConsent);
          };
          window.addEventListener('cookie_consent_changed', handleConsent);
        }

      } else {
        setQuotePopupSettings({ enabled: true, delaySeconds: 8, frequency: "page-load" });
      }
    }).catch((error) => {
      console.error("Không thể tải cấu hình popup tư vấn:", error);
      setQuotePopupSettings({ enabled: true, delaySeconds: 8, frequency: "page-load" });
    });
  }, []);

  useEffect(() => {
    if (!quotePopupSettings?.enabled || pathname?.startsWith("/admin")) return;

    const sessionKey = "greenia_quote_popup_shown_session";
    const dailyKey = "greenia_quote_popup_shown_date";
    const today = new Date().toISOString().slice(0, 10);

    if (
      (quotePopupSettings.frequency === "session" && sessionStorage.getItem(sessionKey) === "true") ||
      (quotePopupSettings.frequency === "daily" && localStorage.getItem(dailyKey) === today)
    ) {
      return;
    }

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const markPopupAsShown = () => {
      if (quotePopupSettings.frequency === "session") {
        sessionStorage.setItem(sessionKey, "true");
      } else if (quotePopupSettings.frequency === "daily") {
        localStorage.setItem(dailyKey, today);
      }
    };

    const openPopupWhenAvailable = () => {
      if (cancelled) return;

      // Không chồng popup tư vấn lên thông báo cookie đang chờ người dùng xử lý.
      if (document.querySelector('[aria-label="Thông báo cookie"]')) {
        retryTimer = setTimeout(openPopupWhenAvailable, 1000);
        return;
      }

      markPopupAsShown();
      setIsQuotePopupOpen(true);
    };

    const openTimer = setTimeout(
      openPopupWhenAvailable,
      quotePopupSettings.delaySeconds * 1000,
    );

    return () => {
      cancelled = true;
      clearTimeout(openTimer);
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [pathname, quotePopupSettings]);

  return (
    <AppContext.Provider value={{
      sections, setSections,
      isEditMode, setIsEditMode,
      isQuotePopupOpen, setIsQuotePopupOpen
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
