'use client';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import type { PublicClientSettings } from '../lib/publicSettings';
import { serializeSectionsForDatabase, sanitizeHomeSections } from '../lib/layoutUtils';
import { optimizeImageUrl } from '../lib/utils';
import {
  type AdSenseSettingsData,
  type VisualSection,
} from '../types';
import {
  flushPendingMetaEvents,
  hasMarketingTrackingConsent,
  notifyTrackingConsentGranted,
  pushTrackingEvent,
  setTrackingConsent,
  trackContactClick,
} from '../lib/tracking';
import { useManualIpTrackingPolicy } from '../hooks/useManualIpTrackingPolicy';

interface AppContextType {
  sections: VisualSection[];
  setSections: (newSections: VisualSection[] | ((prev: VisualSection[]) => VisualSection[])) => void; // Chặn cập nhật sections để đồng bộ dữ liệu.
  isEditMode: boolean;
  setIsEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  isQuotePopupOpen: boolean;
  setIsQuotePopupOpen: React.Dispatch<React.SetStateAction<boolean>>;
  adSenseSettings: AdSenseSettingsData;
  cookieConsentEnabled: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

type LayoutDocName = 'home' | 'san-pham' | 'du-an' | 'tin-tuc' | 'lien-he' | null;

interface LayoutState {
  docName: LayoutDocName;
  sections: VisualSection[];
}

interface QuotePopupSettings {
  enabled: boolean;
  version: number;
}

const EMPTY_SECTIONS: VisualSection[] = [];
const QUOTE_POPUP_INITIAL_DELAY_MS = 60_000;
const QUOTE_POPUP_FIRST_RETRY_DELAY_MS = 60_000;
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

export function AppProvider({ children, initialSettings }: { children: React.ReactNode; initialSettings: PublicClientSettings }) {
  const pathname = usePathname();
  const [policyEnabled, setPolicyEnabled] = useState(false);
  useManualIpTrackingPolicy(pathname || '/', policyEnabled && !pathname?.startsWith('/admin'));
  const layoutDocName = getLayoutDocName(pathname || '');
  const [layoutState, setLayoutState] = useState<LayoutState>(() => ({
    docName: layoutDocName,
    sections: EMPTY_SECTIONS,
  }));
  // Không truyền sections của trang cũ cho trang mới trong lúc chờ dữ liệu từ máy chủ.
  const sections = layoutState.docName === layoutDocName
    ? layoutState.sections
    : EMPTY_SECTIONS;
  const [isEditMode, setIsEditMode] = useState(false);
  const [isQuotePopupOpen, setIsQuotePopupOpen] = useState(false);
  const quotePopupSettings: QuotePopupSettings = {
    enabled: initialSettings.quotePopupEnabled,
    version: initialSettings.quotePopupVersion,
  };
  const adSenseSettings = initialSettings.adSenseSettings;
  const previousTrackedPath = useRef<string | null>(null);


  useEffect(() => {
    const docName = layoutDocName;
    if (!docName) {
      setLayoutState({ docName: null, sections: EMPTY_SECTIONS });
      return;
    }
    // Khách xem bố cục từ máy chủ; chỉ tải mẫu dự phòng khi bật chỉnh sửa.
    if (!isEditMode) return;
    let cancelled = false;
    import('../lib/layouts').then(({ getPageDefaultSections }) => {
      const defaults = getPageDefaultSections(docName);
      const fallback = docName === 'home' ? sanitizeHomeSections(defaults) : defaults;
      if (!cancelled) setLayoutState(previous =>
        previous.docName === docName && previous.sections.length > 0
          ? previous
          : { docName, sections: fallback },
      );
    }).catch(error => {
      if (cancelled) return;
      console.error('Không thể tải mẫu bố cục để chỉnh sửa:', error);
      alert('Không thể tải mẫu bố cục. Vui lòng tải lại trang trước khi chỉnh sửa.');
    });
    return () => { cancelled = true; };
  }, [layoutDocName, isEditMode]);

  const setSections = async (newSections: VisualSection[] | ((prev: VisualSection[]) => VisualSection[])) => {
    // Giải quyết hàm cập nhật trước khi lưu bố cục.
    const currentSections = layoutState.docName === layoutDocName
      ? layoutState.sections
      : EMPTY_SECTIONS;
    const updated = typeof newSections === 'function' ? newSections(currentSections) : newSections;
    
    let sanitized = updated;
    const docName = layoutDocName;
    if (docName === "home") {
      sanitized = sanitizeHomeSections(sanitized);
    }
    
    setLayoutState({ docName, sections: sanitized });

    if (isEditMode && docName) {
      try {
        const { db, doc, setDoc } = await import('../firebase');
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

  // Cấu hình công khai đã được máy chủ tải và lọc.
  useEffect(() => {
    let cancelled = false;
    let removeConsentListener: () => void = () => undefined;
    const trackingFlushTimers = new Set<number>();
    let loadTikTokPixel = () => {};
    const scheduleTrackingTask = (callback: () => void, delay: number) => {
      const timer = window.setTimeout(() => {
        trackingFlushTimers.delete(timer);
        if (!cancelled) callback();
      }, delay);
      trackingFlushTimers.add(timer);
    };

    const scheduleMetaFlush = (delays = [1500, 5000, 12000]) => {
      delays.forEach((delay) => {
        scheduleTrackingTask(flushPendingMetaEvents, delay);
      });
    };

    const loadTrackingScripts = () => {
      if (!hasMarketingTrackingConsent()) return;
      const tagManagerId = getSettingString(
        process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID,
      ).trim();
      if (!tagManagerId || document.getElementById("gtm-tracker-script")) return;

      // GTM là nguồn cấu hình Google và Meta duy nhất để tránh nạp trùng thẻ.
      scheduleTrackingTask(() => {
        if (cancelled || !hasMarketingTrackingConsent() || document.getElementById("gtm-tracker-script")) return;
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
        scheduleMetaFlush();
      }, 2000);
    };

    const handleTrackingPolicy = () => {
      if (cancelled) return;
      if (!hasMarketingTrackingConsent()) {
        // Sau khi chặn IP, tải lại trang để dừng mã GTM đã khởi tạo trước đó.
        const state = window as Window & { __greeniaIpTrackingPolicy?: string };
        if (state.__greeniaIpTrackingPolicy === 'blocked' && document.getElementById('gtm-tracker-script')) window.location.reload();
        return;
      }
      loadTrackingScripts();
      notifyTrackingConsentGranted();
      scheduleMetaFlush();
      loadTikTokPixel();
    };
    window.addEventListener('greenia_tracking_policy_changed', handleTrackingPolicy);

    const data = initialSettings;
    try {
      if (data.logoUrl) localStorage.setItem('greenia_logoUrl', optimizeImageUrl(data.logoUrl, 100));
      if (data.metaTitle) localStorage.setItem('greenia_meta_title', data.metaTitle);
    } catch { /* Không phụ thuộc vào quyền lưu trữ để hiển thị trang. */ }
        loadTikTokPixel = () => {
          if (!hasMarketingTrackingConsent()) return;
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

        const requiresConsent = data.cookieConsentEnabled;
        let consentAccepted = false;
        try { consentAccepted = localStorage.getItem('cookie_consent') === 'accepted'; } catch { /* Trình duyệt chặn lưu trữ: giữ trạng thái chưa đồng ý. */ }
        const initialConsentGranted = !requiresConsent || consentAccepted;
        setTrackingConsent(initialConsentGranted ? 'granted' : 'denied', true);
        const needsPolicy = (accepted: boolean) => accepted && (
          Boolean(process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID)
          || data.adSenseSettings.enabled || data.tiktokPixelEnabled
        );
        setPolicyEnabled(needsPolicy(initialConsentGranted));
        // Chỉ nạp thẻ khi đã đồng ý và IP được phép; lệnh consent chờ sẵn trong dataLayer.
        loadTrackingScripts();
        if (initialConsentGranted) {
          notifyTrackingConsentGranted();
          scheduleMetaFlush([3000, 7000, 14000]);
          loadTikTokPixel();
        }

        const handleConsent = (event: Event) => {
          const consentEvent = event as CustomEvent<{ status?: string }>;
          const accepted = consentEvent.detail?.status === 'accepted';
          setTrackingConsent(accepted ? 'granted' : 'denied');
          setPolicyEnabled(needsPolicy(accepted));
          // Thu hồi đồng ý dừng toàn bộ mã Google đã khởi tạo trong phiên hiện tại.
          if (!accepted && document.getElementById('gtm-tracker-script')) window.location.reload();
          if (accepted) {
            notifyTrackingConsentGranted();
            scheduleMetaFlush([500, 2000, 7000]);
            loadTikTokPixel();
          }
        };
        window.addEventListener('cookie_consent_changed', handleConsent);
        removeConsentListener = () => window.removeEventListener('cookie_consent_changed', handleConsent);

    return () => {
      cancelled = true;
      trackingFlushTimers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener('greenia_tracking_policy_changed', handleTrackingPolicy);
      removeConsentListener();
    };
  }, [initialSettings]);

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
      isQuotePopupOpen, setIsQuotePopupOpen,
      adSenseSettings, cookieConsentEnabled: initialSettings.cookieConsentEnabled,
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
