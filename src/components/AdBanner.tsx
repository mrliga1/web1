'use client';

import { useEffect, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import {
  isValidAdSensePublisherId,
  isValidAdSenseSlotId,
} from '../lib/adsense';
import type { AdSenseSlotKey } from '../types';

interface AdBannerProps {
  slot?: AdSenseSlotKey;
  className?: string;
  containerClassName?: string;
}

interface AdSenseWindow extends Window {
  adsbygoogle?: Array<Record<string, never>>;
}

export default function AdBanner({
  slot = 'home-top',
  className = '',
  containerClassName = '',
}: AdBannerProps) {
  const { adSenseSettings } = useAppContext();
  const adRef = useRef<HTMLModElement>(null);
  const slotId = adSenseSettings.slots[slot];
  const canRender = adSenseSettings.enabled
    && adSenseSettings.mode === 'manual'
    && isValidAdSensePublisherId(adSenseSettings.publisherId)
    && isValidAdSenseSlotId(slotId);

  useEffect(() => {
    if (!canRender || !adRef.current) return;
    if (adRef.current.getAttribute('data-ad-status')) return;

    try {
      const adsenseWindow = window as AdSenseWindow;
      adsenseWindow.adsbygoogle = adsenseWindow.adsbygoogle || [];
      adsenseWindow.adsbygoogle.push({});
    } catch (error) {
      console.error(`Không thể khởi tạo vị trí quảng cáo ${slot}:`, error);
    }
  }, [canRender, slot, slotId]);

  // Auto Ads tự chọn vị trí; các khung thủ công chỉ xuất hiện khi có ad slot hợp lệ.
  if (!canRender) return null;

  return (
    <aside
      className={containerClassName}
      aria-label="Quảng cáo"
      data-adsense-placement={slot}
    >
      <div className={`relative w-full overflow-hidden rounded-lg bg-slate-50 ${className}`}>
        <span className="absolute right-2 top-1 z-10 text-[8px] font-medium uppercase tracking-wider text-slate-500">
          Quảng cáo
        </span>
        <ins
          ref={adRef}
          className="adsbygoogle block min-h-[120px] w-full sm:min-h-[180px] lg:min-h-[250px]"
          style={{ display: 'block' }}
          data-ad-client={adSenseSettings.publisherId}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
}
