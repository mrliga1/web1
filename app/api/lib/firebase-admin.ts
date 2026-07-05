/**
 * Thư viện chia sẻ cho các API routes.
 * Chứa hàm đọc biến môi trường, giải mã token, v.v.
 */

import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

/* Đọc và làm sạch biến môi trường */
export function cleanEnvVar(val: string | undefined): string {
  if (!val) return "";
  let s = val.trim();
  while (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

export function getEnv(key: string): string {
  if (fs.existsSync(".env.example")) {
    const envConfig = dotenv.parse(fs.readFileSync(".env.example"));
    if (envConfig[key]) {
      return cleanEnvVar(envConfig[key]);
    }
  }
  return cleanEnvVar(process.env[key]);
}

export function getDecodedGithubToken(): string {
  let githubToken = getEnv("GITHUB_TOKEN") || getEnv("VITE_GITHUB_TOKEN");
  if (githubToken.startsWith("base64:")) {
    const base64Part = githubToken.slice(7);
    if (
      base64Part.startsWith("ghp_") ||
      base64Part.startsWith("github_pat_")
    ) {
      return base64Part;
    }
    try {
      return Buffer.from(base64Part, "base64").toString("utf8").trim();
    } catch (e) {
      console.error(
        "[Token Decode Error] Failed to decode base64 GITHUB_TOKEN:",
        e
      );
    }
  }
  return githubToken;
}
