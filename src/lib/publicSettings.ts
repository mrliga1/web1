import { normalizeAdSenseSettings } from './adsense';
import type { AdSenseSettingsData } from '../types';

export interface PublicClientSettings {
  logoUrl: string;
  metaTitle: string;
  cookieConsentEnabled: boolean;
  quotePopupEnabled: boolean;
  quotePopupVersion: number;
  tiktokPixelEnabled: boolean;
  tiktokPixelId: string;
  adSenseSettings: AdSenseSettingsData;
}

// Chỉ gửi các trường công khai cần cho giao diện, không đưa toàn bộ settings vào HTML.
export function toPublicClientSettings(value: unknown): PublicClientSettings {
  const data = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
  const version = Number(data.quotePopupVersion);
  return {
    logoUrl: typeof data.logoUrl === 'string' ? data.logoUrl : '',
    metaTitle: typeof data.metaTitle === 'string' ? data.metaTitle : '',
    cookieConsentEnabled: data.cookieConsentEnabled !== false,
    quotePopupEnabled: data.quotePopupEnabled !== false,
    quotePopupVersion: Number.isFinite(version) && version > 0 ? version : 2,
    tiktokPixelEnabled: data.tiktokPixelEnabled === true,
    tiktokPixelId: typeof data.tiktokPixelId === 'string' ? data.tiktokPixelId : '',
    adSenseSettings: normalizeAdSenseSettings(data.adSenseSettings),
  };
}
