import "server-only";

import { createClient } from "@supabase/supabase-js";
import { isIP } from "node:net";
import { getEnv } from "./env";

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
        .map((entry) => entry.trim())
        .filter((entry) => isIP(entry) !== 0),
    ),
  ).slice(0, MAX_BLOCKED_IPS);
}

export function isValidBlockedIpList(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= MAX_BLOCKED_IPS &&
    value.every(
      (entry) => typeof entry === "string" && isIP(entry.trim()) !== 0,
    )
  );
}

export async function getBlockedIpsForRequest(): Promise<string[]> {
  const environmentIps = normalizeBlockedIps(getEnv("BLOCKED_IPS"));
  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || serviceRoleKey.length < 40) {
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
      console.error("Không thể tải danh sách IP bị chặn:", error.message);
      return environmentIps;
    }

    return Array.from(
      new Set([...environmentIps, ...normalizeBlockedIps(data?.data?.ips)]),
    );
  } catch (error) {
    console.error(
      "Không thể kết nối Supabase để kiểm tra IP bị chặn:",
      error instanceof Error ? error.message : "Lỗi không xác định",
    );
    return environmentIps;
  }
}
