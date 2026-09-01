import { NextRequest, NextResponse } from "next/server";
import { getClientIp, getBlockedIpsForRequest, isBlockedIp } from "../lib/blockedIps";
import { createServiceRoleClient } from "../../../src/lib/serverSupabase";

export const runtime = "nodejs";

const ALLOWED_FIELDS = new Set([
  "name",
  "phone",
  "email",
  "message",
  "demand",
  "images",
  "createdAt",
  "status",
  "propertyId",
  "propertyTitle",
  "sourceUrl",
  "source",
  "assignee",
  "priority",
]);

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
    const { data, error } = await supabase
      .from("consultations")
      .insert({
        data: {
          ...payload,
          ipAddress: clientIp === "unknown" ? "" : clientIp,
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

    return NextResponse.json({ success: true, id: String(data.id) });
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
