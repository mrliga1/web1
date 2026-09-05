import { after, NextRequest, NextResponse } from "next/server";
import { getClientIp, getBlockedIpsForRequest, isBlockedIp } from "../lib/blockedIps";
import { createServiceRoleClient } from "../../../src/lib/serverSupabase";
import { notifyLeadStakeholders } from "../../../src/lib/leadNotifications";

export const runtime = "nodejs";

const ALLOWED_FIELDS = new Set([
  "name",
  "phone",
  "email",
  "message",
  "demand",
  "images",
  "propertyId",
  "propertyTitle",
  "sourceUrl",
  "pageTitle",
  "popupOpenedUrl",
  "popupOpenedTitle",
  "source",
  "termsAccepted",
  "privacyAccepted",
  "marketingConsent",
]);

type SpamStatus = "clean" | "review" | "blocked";

function normalizePhone(value: unknown) {
  return typeof value === "string" ? value.replace(/[\s().-]/g, "") : "";
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function evaluateSpam(
  payload: Record<string, unknown>,
  clientIp: string,
  existingRows: Array<{ data?: Record<string, unknown> | null }>,
) {
  const phone = normalizePhone(payload.phone);
  const email = normalizeEmail(payload.email);
  const name = String(payload.name || "").trim().toLowerCase();
  let score = 0;
  const reasons: string[] = [];

  const phoneMatches = existingRows.filter((row) => normalizePhone(row.data?.phone) === phone).length;
  const emailMatches = email
    ? existingRows.filter((row) => normalizeEmail(row.data?.email) === email).length
    : 0;
  const ipMatches = clientIp === "unknown"
    ? 0
    : existingRows.filter((row) => String(row.data?.ipAddress || "") === clientIp).length;

  if (phoneMatches >= 3) {
    score += 50;
    reasons.push("Số điện thoại gửi lặp nhiều lần");
  } else if (phoneMatches > 0) {
    score += 15;
    reasons.push("Số điện thoại đã từng gửi yêu cầu");
  }
  if (emailMatches >= 2) {
    score += 25;
    reasons.push("Email gửi lặp nhiều lần");
  }
  if (ipMatches >= 5) {
    score += 45;
    reasons.push("IP gửi quá nhiều yêu cầu");
  } else if (ipMatches >= 2) {
    score += 20;
    reasons.push("IP gửi nhiều yêu cầu");
  }
  if (/^(.)\1{4,}$/u.test(name.replace(/\s/g, ""))) {
    score += 60;
    reasons.push("Tên có dấu hiệu dữ liệu rác");
  }

  const status: SpamStatus = score >= 70 ? "blocked" : score >= 40 ? "review" : "clean";
  return { score, status, reasons };
}

function normalizeConsultationPayload(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const source = value as Record<string, unknown>;
  const payload: Record<string, unknown> = {};
  for (const [key, fieldValue] of Object.entries(source)) {
    if (!ALLOWED_FIELDS.has(key)) continue;
    if (key === "images" && Array.isArray(fieldValue)) {
      payload.images = fieldValue
        .filter((image): image is string => typeof image === "string")
        .map((image) => image.trim())
        .filter((image) => /^https:\/\//i.test(image))
        .slice(0, 8);
      continue;
    }
    if (typeof fieldValue === "string") {
      payload[key] = fieldValue.trim().slice(0, key === "message" || key === "demand" ? 3000 : 500);
    } else if (typeof fieldValue === "number" || typeof fieldValue === "boolean" || fieldValue === null) {
      payload[key] = fieldValue;
    }
  }

  const name = typeof payload.name === "string" ? payload.name : "";
  const phone = typeof payload.phone === "string" ? payload.phone : "";
  if (!name || !phone) return null;
  if (!/^(?:\+84|0)\d{9}$/.test(normalizePhone(phone))) return null;

  const email = normalizeEmail(payload.email);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  if (payload.termsAccepted !== true || payload.privacyAccepted !== true) return null;
  payload.phone = normalizePhone(phone);
  payload.email = email;

  payload.termsAccepted = true;
  payload.privacyAccepted = true;
  payload.marketingConsent = payload.marketingConsent === true;
  payload.consentRecordedAt = new Date().toISOString();

  payload.createdAt = typeof payload.createdAt === "string" && payload.createdAt
    ? payload.createdAt
    : new Date().toISOString();
  payload.status = typeof payload.status === "string" && payload.status
    ? payload.status
    : "pending";

  return payload;
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const blockedIps = await getBlockedIpsForRequest();
    if (isBlockedIp(clientIp, blockedIps)) {
      return NextResponse.json(
        { error: "Địa chỉ IP đã bị chặn gửi yêu cầu." },
        { status: 403 },
      );
    }

    const payload = normalizeConsultationPayload(await request.json());
    if (!payload) {
      return NextResponse.json(
        { error: "Thông tin khách hàng không hợp lệ." },
        { status: 400 },
      );
    }

    const supabase = createServiceRoleClient();
    const { data: existingConsultations, error: lookupError } = await supabase
      .from("consultations")
      .select("data")
      .limit(100);
    if (lookupError) {
      console.error("Không thể đối chiếu dữ liệu chống spam:", lookupError.message);
    }
    const spam = evaluateSpam(
      payload,
      clientIp,
      (existingConsultations || []) as Array<{ data?: Record<string, unknown> | null }>,
    );
    const trackingEligible = !lookupError && payload.marketingConsent === true && spam.status === "clean";
    const { data, error } = await supabase
      .from("consultations")
      .insert({
        data: {
          ...payload,
          ipAddress: clientIp === "unknown" ? "" : clientIp,
          spamScore: spam.score,
          spamStatus: spam.status,
          spamReasons: spam.reasons,
          remarketingEligible: trackingEligible,
        },
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      console.error("Không thể lưu yêu cầu tư vấn:", error?.message || "Thiếu mã bản ghi");
      return NextResponse.json(
        { error: "Không thể lưu yêu cầu tư vấn." },
        { status: 500 },
      );
    }

    const consultationId = String(data.id);
    after(async () => {
      await notifyLeadStakeholders(consultationId).catch((notificationError) => {
        console.error("Không thể gửi thông báo khách hàng mới:", notificationError);
      });
    });

    return NextResponse.json({ success: true, id: consultationId, trackingEligible });
  } catch (error) {
    console.error(
      "Lỗi API tiếp nhận yêu cầu tư vấn:",
      error instanceof Error ? error.message : "Lỗi không xác định",
    );
    return NextResponse.json(
      { error: "Máy chủ không thể tiếp nhận yêu cầu tư vấn." },
      { status: 500 },
    );
  }
}
