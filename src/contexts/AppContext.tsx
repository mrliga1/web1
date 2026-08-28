'use client';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { db, doc, getDoc, setDoc } from '../firebase';
import { serializeSectionsForDatabase, deserializeSectionsFromDatabase, sanitizeHomeSections } from '../lib/layoutUtils';
import { getPageDefaultSections } from '../lib/layouts';
import { optimizeImageUrl } from '../lib/utils';
import type { VisualSection } from '../types';
import { pushTrackingEvent, setTrackingConsent, trackContactClick } from '../lib/tracking';

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
  cookieConsentEnabled?: boolean;
  quotePopupEnabled?: boolean;
  quotePopupVersion?: number;
  tiktokPixelEnabled?: boolean;
  tiktokPixelId?: string;
}

interface QuotePopupSettings {
  enabled: boolean;
  version: number;
}

const EMPTY_SECTIONS: VisualSection[] = [];
const QUOTE_POPUP_INITIAL_DELAY_MS = 60_000;
const QUOTE_POPUP_FIRST_RETRY_DELAY_MS = 90_000;
const QUOTE_POPUP_REPEAT_DELAY_MS = 60_000;
const QUOTE_POPUP_SUBMITTED_KEY_PREFIX = 'greenia_quote_popup_submitted';

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
  const [quotePopupSettings, setQuotePopupSettings] = useState<QuotePopupSettings>({
    enabled: true,
    version: 2,
  });
  const previousTrackedPath = useRef<string | null>(null);


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
    let cancelled = false;
    let removeConsentListener: () => void = () => undefined;

    const loadTrackingScripts = () => {
      const tagManagerId = getSettingString(
        process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID,
      ).trim();
      if (!tagManagerId || document.getElementById("gtm-tracker-script")) return;

      // GTM là nguồn cấu hình Google và Meta duy nhất để tránh nạp trùng thẻ.
      window.setTimeout(() => {
        if (cancelled || document.getElementById("gtm-tracker-script")) return;
        const gtmScript = document.createElement("script");
        gtmScript.id = "gtm-tracker-script";
        gtmScript.text = `
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${tagManagerId}');
        `;
        document.head.appendChild(gtmScript);
      }, 2000);
    };

    getDoc(doc(db, "settings", "general")).then((snapshot) => {
      if (cancelled) return;
      if (snapshot.exists()) {
        const data = (snapshot.data() || {}) as ClientSettingsData;
        if (data.logoUrl) {
          localStorage.setItem('greenia_logoUrl', optimizeImageUrl(data.logoUrl, 100));
        }
        if (data.metaTitle) {
          localStorage.setItem("greenia_meta_title", data.metaTitle);
        }

        const popupVersion = Number(data.quotePopupVersion);
        setQuotePopupSettings({
          enabled: data.quotePopupEnabled !== false,
          version: Number.isFinite(popupVersion) && popupVersion > 0 ? popupVersion : 2,
        });

        const loadTikTokPixel = () => {
          const pixelId = getSettingString(data.tiktokPixelId).trim();
          if (
            data.tiktokPixelEnabled !== true ||
            !/^[A-Z0-9]{10,30}$/i.test(pixelId) ||
            document.getElementById("tiktok-pixel-script")
          ) return;

          const script = document.createElement("script");
          script.id = "tiktok-pixel-script";
          script.text = `!function (w, d, t) {w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var a=document.createElement("script");a.type="text/javascript",a.async=!0,a.src=r+"?sdkid="+e+"&lib="+t;var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(a,s)};ttq.load("${pixelId}");ttq.page();}(window, document, "ttq");`;
          document.head.appendChild(script);
        };

        const requiresConsent = data.cookieConsentEnabled === true;
        const consentAccepted = localStorage.getItem('cookie_consent') === 'accepted';
        setTrackingConsent(requiresConsent && !consentAccepted ? 'denied' : 'granted', true);
        if (!requiresConsent || consentAccepted) {
          loadTrackingScripts();
          loadTikTokPixel();
        }

        const handleConsent = (event: Event) => {
          const consentEvent = event as CustomEvent<{ status?: string }>;
          const accepted = consentEvent.detail?.status === 'accepted';
          setTrackingConsent(accepted ? 'granted' : 'denied');
          if (accepted) {
            loadTrackingScripts();
            loadTikTokPixel();
          }
        };
        window.addEventListener('cookie_consent_changed', handleConsent);
        removeConsentListener = () => window.removeEventListener('cookie_consent_changed', handleConsent);

      } else {
        setQuotePopupSettings({ enabled: true, version: 2 });
        setTrackingConsent('granted', true);
        loadTrackingScripts();
      }
    }).catch((error) => {
      console.error("Không thể tải cấu hình popup tư vấn:", error);
      setQuotePopupSettings({ enabled: true, version: 2 });
      setTrackingConsent('granted', true);
      loadTrackingScripts();
    });

    return () => {
      cancelled = true;
      removeConsentListener();
    };
  }, []);

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;
    if (previousTrackedPath.current && previousTrackedPath.current !== pathname) {
      pushTrackingEvent('page_view', {
        page_path: pathname,
        page_title: document.title,
      });
    }
    previousTrackedPath.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const handleTrackedLinkClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const link = target?.closest('a[href]') as HTMLAnchorElement | null;
      if (!link) return;
      const href = link.getAttribute('href') || '';
      if (href.startsWith('tel:')) trackContactClick('phone');
      else if (href.startsWith('mailto:')) trackContactClick('email');
      else if (/zalo\.me/i.test(href)) trackContactClick('zalo');
    };
    document.addEventListener('click', handleTrackedLinkClick);
    return () => document.removeEventListener('click', handleTrackedLinkClick);
  }, []);

  useEffect(() => {
    if (!quotePopupSettings.enabled || pathname?.startsWith("/admin")) return;
    const submittedKey = `${QUOTE_POPUP_SUBMITTED_KEY_PREFIX}:${quotePopupSettings.version}`;
    if (localStorage.getItem(submittedKey) === 'true') return;

    let cancelled = false;
    let closeCount = 0;
    let openTimer: ReturnType<typeof setTimeout> | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const clearTimers = () => {
      if (openTimer) clearTimeout(openTimer);
      if (retryTimer) clearTimeout(retryTimer);
      openTimer = undefined;
      retryTimer = undefined;
    };

    const openPopupWhenAvailable = () => {
      if (cancelled) return;
      if (localStorage.getItem(submittedKey) === 'true') return;

      // Không chồng popup tư vấn lên thông báo cookie đang chờ người dùng xử lý.
      if (document.querySelector('[aria-label="Thông báo cookie"]')) {
        retryTimer = setTimeout(openPopupWhenAvailable, 1000);
        return;
      }

      setIsQuotePopupOpen(true);
    };

    const schedulePopup = (delayMs: number) => {
      clearTimers();
      openTimer = setTimeout(openPopupWhenAvailable, delayMs);
    };

    const handlePopupClosed = () => {
      if (localStorage.getItem(submittedKey) === 'true') return;
      const delay = closeCount === 0
        ? QUOTE_POPUP_FIRST_RETRY_DELAY_MS
        : QUOTE_POPUP_REPEAT_DELAY_MS;
      closeCount += 1;
      schedulePopup(delay);
    };

    const handlePopupSubmitted = () => {
      try {
        localStorage.setItem(submittedKey, 'true');
        localStorage.removeItem(QUOTE_POPUP_SUBMITTED_KEY_PREFIX);
      } catch {
        // Phiên hiện tại vẫn được dừng lịch popup nếu trình duyệt chặn localStorage.
      }
      clearTimers();
      setIsQuotePopupOpen(false);
    };

    window.addEventListener('greenia_quote_popup_closed', handlePopupClosed);
    window.addEventListener('greenia_quote_popup_submitted', handlePopupSubmitted);
    schedulePopup(QUOTE_POPUP_INITIAL_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimers();
      window.removeEventListener('greenia_quote_popup_closed', handlePopupClosed);
      window.removeEventListener('greenia_quote_popup_submitted', handlePopupSubmitted);
    };
  }, [pathname, quotePopupSettings.enabled, quotePopupSettings.version]);

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
