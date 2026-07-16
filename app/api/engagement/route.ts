import "server-only";

import { createHmac, randomUUID } from "node:crypto";
import { isIP } from "node:net";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getBlockedIpsForRequest } from "../lib/blockedIps";
import { getEnv } from "../lib/env";

export const runtime = "nodejs";

const CONTENT_TABLES = new Set(["products", "projects", "news"]);
const ACTIONS = new Set(["view", "rating"]);
const MAX_BODY_BYTES = 2_048;

type EngagementAction = "view" | "rating";

interface EngagementBody {
  table?: unknown;
  id?: unknown;
  action?: unknown;
  value?: unknown;
}

type BodyReadResult =
  | { body: EngagementBody; error?: never }
  | { body?: never; error: "invalid" | "too_large" };

async function readJsonBody(request: NextRequest): Promise<BodyReadResult> {
  if (!request.body) return { error: "invalid" };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    totalBytes += value.byteLength;
    if (totalBytes > MAX_BODY_BYTES) {
      await reader.cancel().catch(() => undefined);
      return { error: "too_large" };
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { error: "invalid" };
    }
    return { body: parsed as EngagementBody };
  } catch {
    return { error: "invalid" };
  }
}

function getClientIp(request: NextRequest): string {
  const candidates = [
    request.headers.get("cf-connecting-ip"),
    request.headers.get("x-real-ip"),
    request.headers.get("x-forwarded-for")?.split(",")[0],
  ];

  for (const candidate of candidates) {
    const normalized = candidate?.trim() || "";
    if (isIP(normalized) !== 0) return normalized;
  }

  return "unknown";
}

function isValidBody(body: EngagementBody): body is {
  table: "products" | "projects" | "news";
  id: string;
  action: EngagementAction;
  value?: number;
} {
  if (
    typeof body.table !== "string" ||
    !CONTENT_TABLES.has(body.table) ||
    typeof body.id !== "string" ||
    body.id.trim().length < 1 ||
    body.id.trim().length > 200 ||
    typeof body.action !== "string" ||
    !ACTIONS.has(body.action)
  ) {
    return false;
  }

  return (
    body.action === "view" ||
    (Number.isInteger(body.value) && Number(body.value) >= 1 && Number(body.value) <= 5)
  );
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Dữ liệu gửi lên quá lớn" }, { status: 413 });
  }

  const bodyResult = await readJsonBody(request);
  if ("error" in bodyResult) {
    const status = bodyResult.error === "too_large" ? 413 : 400;
    const error =
      bodyResult.error === "too_large"
        ? "Dữ liệu gửi lên quá lớn"
        : "Dữ liệu JSON không hợp lệ";
    return NextResponse.json({ error }, { status });
  }
  const body = bodyResult.body;

  if (!isValidBody(body)) {
    return NextResponse.json({ error: "Dữ liệu tương tác không hợp lệ" }, { status: 400 });
  }

  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || serviceRoleKey.length < 40) {
    return NextResponse.json(
      { error: "Máy chủ chưa được cấu hình Supabase service-role" },
      { status: 503 },
    );
  }

  const clientIp = getClientIp(request);
  const blockedIps = await getBlockedIpsForRequest();
  if (clientIp !== "unknown" && blockedIps.includes(clientIp)) {
    return NextResponse.json({ error: "Yêu cầu đã bị từ chối" }, { status: 403 });
  }

  const existingVisitorId = request.cookies.get("greenia_engagement_id")?.value || "";
  const visitorId = /^[a-f0-9-]{36}$/i.test(existingVisitorId)
    ? existingVisitorId
    : randomUUID();
  const userAgent = request.headers.get("user-agent")?.slice(0, 200) || "unknown";
  const rateKey = createHmac("sha256", serviceRoleKey)
    .update(
      `${clientIp}|${visitorId}|${userAgent}|${body.table}|${body.id.trim()}|${body.action}`,
    )
    .digest("hex");

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await supabase.rpc("record_content_engagement", {
      p_table: body.table,
      p_id: body.id.trim(),
      p_action: body.action,
      p_value: body.action === "rating" ? Number(body.value) : 0,
      p_rate_key: rateKey,
    });

    if (error) {
      console.error("Không thể ghi tương tác nội dung:", error.message);
      return NextResponse.json({ error: "Không thể ghi nhận tương tác" }, { status: 502 });
    }

    const result =
      data && typeof data === "object" && !Array.isArray(data)
        ? (data as Record<string, unknown>)
        : {};
    const response = NextResponse.json({
      accepted: result.accepted === true,
      viewsCount: Number(result.viewsCount) || 0,
      userTotalRating: Number(result.userTotalRating) || 0,
      userReviewCount: Number(result.userReviewCount) || 0,
    });
    response.headers.set("Cache-Control", "no-store");
    response.cookies.set("greenia_engagement_id", visitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error(
      "Không thể kết nối Supabase để ghi tương tác:",
      error instanceof Error ? error.message : "Lỗi không xác định",
    );
    return NextResponse.json({ error: "Không thể ghi nhận tương tác" }, { status: 502 });
  }
}
