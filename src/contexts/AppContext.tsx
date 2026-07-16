'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { db, doc, getDoc, setDoc } from '../firebase';
import { serializeSectionsForDatabase, deserializeSectionsFromDatabase, sanitizeHomeSections } from '../lib/layoutUtils';
import { getPageDefaultSections } from '../lib/layouts';
import { optimizeImageUrl } from '../lib/utils';

interface AppContextType {
  sections: any;
  setSections: (newSections: any[]) => void; // Intercept setSections
  isEditMode: boolean;
  setIsEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  isQuotePopupOpen: boolean;
  setIsQuotePopupOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const getLayoutDocName = (path: string) => {
    if (path === '/') return 'home';
    if (path.startsWith('/san-pham') || path.startsWith('/category-product') || path === '/latest-sales' || path === '/latest-rents') return 'san-pham';
    if (path.startsWith('/du-an')) return 'du-an';
    if (path.startsWith('/tin-tuc') || path.startsWith('/category-news')) return 'tin-tuc';
    if (path.startsWith('/lien-he')) return 'lien-he';
    return null;
  };

  const [sections, setSectionsState] = useState<any[]>(() => {
    const docName = getLayoutDocName(pathname || '');
    if (docName) {
      let defaults = getPageDefaultSections(docName);
      if (docName === "home") defaults = sanitizeHomeSections(defaults);
      return defaults;
    }
    return [];
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [isQuotePopupOpen, setIsQuotePopupOpen] = useState(false);


  useEffect(() => {
    const docName = getLayoutDocName(pathname || '');
    if (!docName) {
      setSectionsState([]);
      return;
    }

    const docRef = doc(db, 'layouts', docName);
    getDoc(docRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && data.sections) {
          let loaded = deserializeSectionsFromDatabase(data.sections);
          if (loaded.length === 0) {
            let defaults = getPageDefaultSections(docName);
            if (docName === "home") defaults = sanitizeHomeSections(defaults);
            setDoc(docRef, { sections: serializeSectionsForDatabase(defaults) }).catch(console.error);
            setSectionsState(defaults);
          } else {
            if (docName === "home") {
              const sanitized = sanitizeHomeSections(loaded);
              if (sanitized.length !== loaded.length) {
                setDoc(docRef, { sections: serializeSectionsForDatabase(sanitized) }).catch(console.error);
              }
              loaded = sanitized;
            }
            setSectionsState(loaded);
          }
        } else {
          let defaults = getPageDefaultSections(docName);
          if (docName === "home") defaults = sanitizeHomeSections(defaults);
          setDoc(docRef, { sections: serializeSectionsForDatabase(defaults) }).catch(console.error);
          setSectionsState(defaults);
        }
      } else {
        let defaults = getPageDefaultSections(docName);
        if (docName === "home") defaults = sanitizeHomeSections(defaults);
        setDoc(docRef, { sections: serializeSectionsForDatabase(defaults) }).catch(console.error);
        setSectionsState(defaults);
      }
    }).catch((e) => {
      console.error("Lỗi tải layout:", e);
      let defaults = getPageDefaultSections(docName);
      if (docName === "home") defaults = sanitizeHomeSections(defaults);
      setSectionsState(defaults);
    });
  }, [pathname]);

  const setSections = async (newSections: any[] | ((prev: any[]) => any[])) => {
    // Resolve updater function if used
    const updated = typeof newSections === 'function' ? newSections(sections) : newSections;
    
    let sanitized = updated;
    const docName = getLayoutDocName(pathname || '');
    if (docName === "home") {
      sanitized = sanitizeHomeSections(sanitized);
    }
    
    setSectionsState(sanitized);

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
        const data = snapshot.data();
        if (data.logoUrl) {
          localStorage.setItem('greenia_logoUrl', optimizeImageUrl(data.logoUrl, 100));
        }
        if (data.metaTitle) {
          localStorage.setItem("greenia_meta_title", data.metaTitle);
        }

        const loadTrackingScripts = () => {
        // Chỉ chèn mã theo dõi sau khi đã đáp ứng lựa chọn cookie.
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

      }
    }).catch(console.error);
  }, []);

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
