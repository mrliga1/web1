export type ConsentStatus = "granted" | "denied";

type TrackingValue = string | number | boolean | null | undefined | TrackingValue[] | { [key: string]: TrackingValue };
type TrackingPayload = Record<string, TrackingValue>;

interface TrackingWindow extends Window {
  dataLayer?: Array<Record<string, unknown> | unknown[]>;
  fbq?: (...args: unknown[]) => void;
  ttq?: { track?: (event: string, payload?: Record<string, unknown>) => void };
  __greeniaPendingMetaEvents?: Array<{
    method: "track" | "trackCustom";
    event: string;
    payload: Record<string, TrackingValue>;
  }>;
}

const SENSITIVE_KEYS = new Set([
  "name",
  "full_name",
  "email",
  "phone",
  "telephone",
  "address",
  "message",
]);

function getDataLayer() {
  const trackingWindow = window as TrackingWindow;
  trackingWindow.dataLayer = trackingWindow.dataLayer || [];
  return trackingWindow.dataLayer;
}

function sanitizePayload(payload: TrackingPayload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => {
      return !SENSITIVE_KEYS.has(key.toLowerCase()) && value !== undefined;
    }),
  );
}

function emitMetaEvent(
  method: "track" | "trackCustom",
  event: string,
  payload: Record<string, TrackingValue>,
) {
  const trackingWindow = window as TrackingWindow;
  if (typeof trackingWindow.fbq === "function") {
    trackingWindow.fbq(method, event, payload);
    return;
  }

  const pending = trackingWindow.__greeniaPendingMetaEvents || [];
  trackingWindow.__greeniaPendingMetaEvents = [
    ...pending.slice(-49),
    { method, event, payload },
  ];
}

export function flushPendingMetaEvents() {
  if (typeof window === "undefined") return;
  const trackingWindow = window as TrackingWindow;
  if (typeof trackingWindow.fbq !== "function") return;

  const pending = trackingWindow.__greeniaPendingMetaEvents || [];
  trackingWindow.__greeniaPendingMetaEvents = [];
  pending.forEach(({ method, event, payload }) => {
    trackingWindow.fbq?.(method, event, payload);
  });
}

export function pushTrackingEvent(event: string, payload: TrackingPayload = {}) {
  if (typeof window === "undefined" || !event.trim()) return;
  const cleanPayload = sanitizePayload(payload);
  const dataLayer = getDataLayer();
  dataLayer.push({
    event: event.trim(),
    ...cleanPayload,
  });

  const trackingWindow = window as TrackingWindow;
  const metaEventMap: Record<string, string> = {
    page_view: "PageView",
    view_item: "ViewContent",
    search: "Search",
    add_to_wishlist: "AddToWishlist",
    generate_lead: "Lead",
    contact_click: "Contact",
    complete_registration: "CompleteRegistration",
    schedule: "Schedule",
  };
  const metaEvent = metaEventMap[event];
  if (metaEvent) {
    emitMetaEvent("track", metaEvent, cleanPayload);
  } else if (event === "share") {
    emitMetaEvent("trackCustom", "Share", cleanPayload);
  }

  const tiktokEventMap: Record<string, string> = {
    view_item: "ViewContent",
    search: "Search",
    add_to_wishlist: "AddToWishlist",
    generate_lead: "SubmitForm",
    contact_click: "Contact",
  };
  const tiktokEvent = tiktokEventMap[event];
  if (tiktokEvent && typeof trackingWindow.ttq?.track === "function") {
    trackingWindow.ttq.track(tiktokEvent, cleanPayload);
  }
}

export function setTrackingConsent(status: ConsentStatus, waitForUpdate = false) {
  if (typeof window === "undefined") return;
  const dataLayer = getDataLayer();
  const consent: Record<string, ConsentStatus | number> = {
    analytics_storage: status,
    ad_storage: status,
    ad_user_data: status,
    ad_personalization: status,
  };
  if (waitForUpdate) consent.wait_for_update = 500;
  dataLayer.push(["consent", waitForUpdate ? "default" : "update", consent]);
}

export function trackLead(formName: string, source: string, itemId?: string) {
  pushTrackingEvent("generate_lead", {
    form_name: formName,
    lead_source: source,
    item_id: itemId,
    currency: "VND",
  });
}

export function trackContentView(
  contentType: "product" | "project" | "article",
  itemId: string,
  itemName: string,
  category?: string,
) {
  pushTrackingEvent("view_item", {
    content_type: contentType,
    item_id: itemId,
    item_name: itemName,
    item_category: category,
  });
}

export function trackContentListView(
  contentType: "product" | "project" | "article",
  listId: string,
  listName: string,
  items: Array<{ id: string; name: string }>,
) {
  const normalizedItems = items
    .filter((item) => item.id.trim() && item.name.trim())
    .slice(0, 20)
    .map((item, index) => ({
      item_id: item.id.trim(),
      item_name: item.name.trim(),
      index,
    }));
  if (normalizedItems.length === 0) return;

  pushTrackingEvent("view_item_list", {
    content_type: contentType,
    item_list_id: listId.trim() || `${contentType}_list`,
    item_list_name: listName.trim() || `${contentType} list`,
    items: normalizedItems,
  });
}

export function trackSearch(searchTerm: string, contentType: "product" | "project" | "article") {
  const normalizedTerm = searchTerm.trim().slice(0, 100);
  if (!normalizedTerm) return;
  pushTrackingEvent("search", {
    search_term: normalizedTerm,
    content_type: contentType,
  });
}

export function trackWishlist(itemId: string, itemName: string, added: boolean) {
  pushTrackingEvent(added ? "add_to_wishlist" : "remove_from_wishlist", {
    item_id: itemId,
    item_name: itemName,
    content_type: "product",
  });
}

export function trackShare(method: string, contentType: string, itemId: string) {
  pushTrackingEvent("share", {
    method,
    content_type: contentType,
    item_id: itemId,
  });
}

export function trackContactClick(channel: "phone" | "email" | "zalo") {
  pushTrackingEvent("contact_click", { channel });
}

export function trackCompleteRegistration(method: "email" | "google") {
  pushTrackingEvent("complete_registration", {
    registration_method: method,
    status: "completed",
  });
}

export function trackSchedule(source: string, itemId?: string) {
  pushTrackingEvent("schedule", {
    schedule_source: source,
    item_id: itemId,
  });
}
