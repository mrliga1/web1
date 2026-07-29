import React, { useState, useEffect } from 'react';
import { dbLite } from '../firebase';
import { doc as docLite, getDoc as getDocLite } from '../firebase';
import type { GeneralSettingsData } from '../types';

interface AdBannerProps {
  slot?: string;
  className?: string;
}

export default function AdBanner({ slot = "default-ad-slot", className = "", containerClassName = "" }: AdBannerProps & { containerClassName?: string }) {
  const [googleAdSenseCode, setGoogleAdSenseCode] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocLite(docLite(dbLite, 'settings', 'general')).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as GeneralSettingsData;
        const adCode = typeof data.googleAdSenseCode === 'string' ? data.googleAdSenseCode : '';
        setGoogleAdSenseCode(adCode);
      }
      setLoading(false);
    }).catch(err => {
      console.error("Lỗi AdBanner:", err);
      setLoading(false);
    });
  }, []);

  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && googleAdSenseCode.trim() && containerRef.current) {
      // Tìm và kích hoạt lại script được chèn qua dangerouslySetInnerHTML.
      const scripts = containerRef.current.querySelectorAll('script');
      scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach((attr: Attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.appendChild(document.createTextNode(oldScript.innerHTML));
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
    }
  }, [loading, googleAdSenseCode]);

  // Hiển thị AdSense khi đã có mã cấu hình.
  if (!loading && googleAdSenseCode.trim()) {
    return (
      <div className={containerClassName}>
        <div 
          className={`relative overflow-hidden w-full bg-[#0B1F16]/40 border border-border-color rounded-lg p-4 flex flex-col justify-center items-center gap-2 shadow-sm ${className}`}
          id={`ad-banner-${slot}`}
        >
          <div className="absolute top-0 right-0 bg-[#064E3B]/10 border-b border-l border-primary/25 text-[8px] text-primary font-mono px-2 py-0.5 rounded-bl font-semibold uppercase tracking-widest">
            Google AdSense Live
          </div>
          <div 
            ref={containerRef}
            className="w-full text-center flex justify-center items-center [&_iframe]:mx-auto" 
            dangerouslySetInnerHTML={{ __html: googleAdSenseCode }}
          />
        </div>
      </div>
    );
  }

  // Ẩn hoàn toàn khi chưa cấu hình Google AdSense.
  return null;
}
