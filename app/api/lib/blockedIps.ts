import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getEnv } from "./env";
import { normalizeIpAddress } from "./ipAddress";

export { getClientIp, isBlockedIp } from "./ipAddress";

const MAX_BLOCKED_IPS = 500;

export function normalizeBlockedIps(value: unknown): string[] {
  const entries = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[\s,;]+/)
      : [];

  return Array.from(
    new Set(
      entries
        .filter((entry): entry is string => typeof entry === "string")
        .map(normalizeIpAddress)
        .filter(Boolean),
    ),
  ).slice(0, MAX_BLOCKED_IPS);
}

export function isValidBlockedIpList(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= MAX_BLOCKED_IPS &&
    value.every(
      (entry) => typeof entry === "string" && Boolean(normalizeIpAddress(entry)),
    )
  );
}

export async function getBlockedIpsForRequest(options: { strict?: boolean } = {}): Promise<string[]> {
  const environmentIps = normalizeBlockedIps(getEnv("BLOCKED_IPS"));
  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || serviceRoleKey.length < 40) {
    if (options.strict) throw new Error("Chưa cấu hình nguồn kiểm tra IP");
    return environmentIps;
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await supabase
      .from("settings")
      .select("data")
      .eq("id", "blocked-ips")
      .maybeSingle();

    if (error) {
      if (options.strict) throw new Error("Không thể xác minh danh sách IP bị chặn");
      console.error("Không thể tải danh sách IP bị chặn:", error.message);
      return environmentIps;
    }

    return Array.from(
      new Set([...environmentIps, ...normalizeBlockedIps(data?.data?.ips)]),
    );
  } catch (error) {
    if (options.strict) throw error;
    console.error(
      "Không thể kết nối Supabase để kiểm tra IP bị chặn:",
      error instanceof Error ? error.message : "Lỗi không xác định",
    );
    return environmentIps;
  }
}
