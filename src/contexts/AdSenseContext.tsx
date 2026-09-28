'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAppContext } from './AppContext';
import { ADSENSE_SCRIPT_ID } from '../lib/adsense';
import { hasMarketingTrackingConsent } from '../lib/tracking';

const AdSenseContext = createContext(false);
export const useAdSenseReady = () => useContext(AdSenseContext);

export function AdSenseProvider({ children }: { children: React.ReactNode }) {
  const { adSenseSettings } = useAppContext();
  const [allowed, setAllowed] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const update = () => {
      const next = hasMarketingTrackingConsent();
      setAllowed(next);
      const state = window as Window & { __greeniaRequestedConsent?: string; __greeniaIpTrackingPolicy?: string };
      const loaded = document.getElementById(ADSENSE_SCRIPT_ID)?.dataset.loaded === 'true';
      // Tải lại khi thu hồi quyền để dừng cả mã quảng cáo đã thực thi trên trang cũ.
      if (!next && loaded && (state.__greeniaRequestedConsent === 'denied' || state.__greeniaIpTrackingPolicy === 'blocked')) {
        window.location.reload();
      }
    };
    update();
    window.addEventListener('greenia_tracking_policy_changed', update);
    window.addEventListener('greenia_tracking_consent_changed', update);
    return () => {
      window.removeEventListener('greenia_tracking_policy_changed', update);
      window.removeEventListener('greenia_tracking_consent_changed', update);
    };
  }, []);

  useEffect(() => {
    setReady(false);
    if (!allowed || !adSenseSettings.enabled) return;
    let cancelled = false;
    const source = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseSettings.publisherId}`;
    let script = document.getElementById(ADSENSE_SCRIPT_ID) as HTMLScriptElement | null;
    if (script && script.src !== source) { script.remove(); script = null; }
    if (!script) {
      script = document.createElement('script');
      script.id = ADSENSE_SCRIPT_ID;
      script.src = source;
      script.async = true;
      script.crossOrigin = 'anonymous';
    }
    const onLoad = () => { if (script) script.dataset.loaded = 'true'; if (!cancelled) setReady(true); };
    const onError = () => { console.warn('Chưa tải được quảng cáo. Nội dung website vẫn hoạt động.'); script?.remove(); };
    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);
    if (script.dataset.loaded === 'true') setReady(true);
    if (!script.isConnected) document.head.appendChild(script);
    return () => {
      cancelled = true;
      script?.removeEventListener('load', onLoad);
      script?.removeEventListener('error', onError);
    };
  }, [allowed, adSenseSettings.enabled, adSenseSettings.publisherId]);

  return <AdSenseContext.Provider value={allowed && ready}>{children}</AdSenseContext.Provider>;
}
