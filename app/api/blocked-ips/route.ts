import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "../lib/auth";
import { isValidBlockedIpList, normalizeBlockedIps } from "../lib/blockedIps";
import { getEnv } from "../lib/env";

function createAdminClient(req: NextRequest) {
  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const authorization = req.headers.get("Authorization");

  if (!supabaseUrl || !supabaseAnonKey || !authorization) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: authorization } },
  });
}

export async function GET(req: NextRequest) {
  const authResult = await verifyAdmin(req);
  if (!authResult.authorized) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const supabase = createAdminClient(req);
  if (!supabase) {
    return NextResponse.json(
      { error: "Máy chủ chưa được cấu hình Supabase" },
      { status: 503 },
    );
  }

  const { data, error } = await supabase
    .from("settings")
    .select("data")
    .eq("id", "blocked-ips")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Không thể tải danh sách IP bị chặn" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    ips: normalizeBlockedIps(data?.data?.ips),
  });
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAdmin(req);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const payload: unknown = await req.json();
    const ips =
      typeof payload === "object" && payload !== null && "ips" in payload
        ? (payload as { ips: unknown }).ips
        : null;

    if (!isValidBlockedIpList(ips)) {
      return NextResponse.json(
        { error: "Danh sách IP không hợp lệ hoặc vượt quá 500 địa chỉ" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient(req);
    if (!supabase) {
      return NextResponse.json(
        { error: "Máy chủ chưa được cấu hình Supabase" },
        { status: 503 },
      );
    }

    const normalizedIps = normalizeBlockedIps(ips);
    const { error } = await supabase.from("settings").upsert(
      { id: "blocked-ips", data: { ips: normalizedIps } },
      { onConflict: "id" },
    );

    if (error) {
      return NextResponse.json(
        { error: "Không thể lưu danh sách IP bị chặn" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, ips: normalizedIps });
  } catch (error) {
    const message =
      error instanceof SyntaxError
        ? "Dữ liệu gửi lên không phải JSON hợp lệ"
        : "Không thể cập nhật danh sách IP bị chặn";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
