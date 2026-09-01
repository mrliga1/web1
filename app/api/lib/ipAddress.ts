import { isIP } from "node:net";
import type { NextRequest } from "next/server";

export function normalizeIpAddress(value: unknown): string {
  if (typeof value !== "string") return "";

  let candidate = value.split(",")[0]?.trim().toLowerCase() || "";
  if (!candidate) return "";

  if (candidate.startsWith("[") && candidate.includes("]")) {
    candidate = candidate.slice(1, candidate.indexOf("]"));
  }

  const ipv4WithPort = candidate.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
  if (ipv4WithPort) candidate = ipv4WithPort[1];

  const mappedIpv4 = candidate.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mappedIpv4 && isIP(mappedIpv4[1]) === 4) candidate = mappedIpv4[1];

  const zoneIndex = candidate.indexOf("%");
  if (zoneIndex > 0) candidate = candidate.slice(0, zoneIndex);

  return isIP(candidate) !== 0 ? candidate : "";
}

export function getClientIp(request: Pick<NextRequest, "headers">): string {
  const candidates = [
    request.headers.get("cf-connecting-ip"),
    request.headers.get("x-real-ip"),
    request.headers.get("x-vercel-forwarded-for"),
    request.headers.get("x-forwarded-for"),
  ];

  for (const candidate of candidates) {
    const normalized = normalizeIpAddress(candidate);
    if (normalized) return normalized;
  }

  return "unknown";
}

export function isBlockedIp(clientIp: string, blockedIps: string[]): boolean {
  const normalizedClientIp = normalizeIpAddress(clientIp);
  if (!normalizedClientIp) return false;
  return blockedIps.some((blockedIp) => normalizeIpAddress(blockedIp) === normalizedClientIp);
}
