import {
  ADSENSE_SLOT_KEYS,
  DEFAULT_ADSENSE_SETTINGS,
  type AdSenseSettingsData,
  type AdSenseSlotKey,
} from '../types';

const PUBLISHER_ID_PATTERN = /^ca-pub-\d{16}$/;
const SLOT_ID_PATTERN = /^\d{6,20}$/;

export const ADSENSE_SCRIPT_ID = 'greenia-adsense-script';

export function isValidAdSensePublisherId(value: string) {
  return PUBLISHER_ID_PATTERN.test(value.trim());
}

export function isValidAdSenseSlotId(value: string) {
  return SLOT_ID_PATTERN.test(value.trim());
}

export function normalizeAdSenseSettings(value: unknown): AdSenseSettingsData {
  const input = value && typeof value === 'object'
    ? value as Partial<AdSenseSettingsData>
    : {};
  const publisherId = typeof input.publisherId === 'string' && isValidAdSensePublisherId(input.publisherId)
    ? input.publisherId.trim()
    : DEFAULT_ADSENSE_SETTINGS.publisherId;
  const rawSlots = input.slots && typeof input.slots === 'object' ? input.slots : {};
  const slots = ADSENSE_SLOT_KEYS.reduce((result, key) => {
    const candidate = (rawSlots as Partial<Record<AdSenseSlotKey, unknown>>)[key];
    result[key] = typeof candidate === 'string' && isValidAdSenseSlotId(candidate)
      ? candidate.trim()
      : '';
    return result;
  }, { ...DEFAULT_ADSENSE_SETTINGS.slots });

  return {
    enabled: input.enabled !== false,
    publisherId,
    mode: input.mode === 'manual' ? 'manual' : 'auto',
    slots,
  };
}

export function toAdsTxtPublisherId(publisherId: string) {
  return publisherId.trim().replace(/^ca-/, '');
}
