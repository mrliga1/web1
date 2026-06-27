import React, { useState, useEffect } from 'react';
import { Sparkles, Heart } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

interface AdBannerProps {
  slot?: string;
  className?: string;
}

export default function AdBanner({ slot = "default-ad-slot", className = "", containerClassName = "" }: AdBannerProps & { containerClassName?: string }) {
  const [googleAdSenseCode, setGoogleAdSenseCode] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, 'settings', 'general')).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.googleAdSenseCode) {
          setGoogleAdSenseCode(data.googleAdSenseCode);
        } else {
          setGoogleAdSenseCode('');
        }
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
      // Find all script tags that were inserted via dangerouslySetInnerHTML
      const scripts = containerRef.current.querySelectorAll('script');
      scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach((attr: any) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.appendChild(document.createTextNode(oldScript.innerHTML));
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
    }
  }, [loading, googleAdSenseCode]);

  // If Google AdSense code is defined, display it instead of the default placeholder
  if (!loading && googleAdSenseCode.trim()) {
    return (
      <div className={containerClassName}>
        <div 
          className={`relative overflow-hidden w-full bg-slate-950/40 border border-slate-900 rounded-lg p-4 flex flex-col justify-center items-center gap-2 shadow-sm ${className}`}
          id={`ad-banner-${slot}`}
        >
          <div className="absolute top-0 right-0 bg-amber-500/10 border-b border-l border-amber-500/25 text-[8px] text-amber-400 font-mono px-2 py-0.5 rounded-bl font-semibold uppercase tracking-widest">
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

  // Hide completely when no Google AdSense is set, as requested by the user
  return null;
}
