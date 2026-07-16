import { existsSync, readFileSync } from "node:fs";

function readLocalEnvironment() {
  const values = {};

  for (const file of [".env", ".env.local"]) {
    if (!existsSync(file)) continue;

    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) continue;

      const value = match[2].trim().replace(/^['"]|['"]$/g, "");
      values[match[1]] = value;
    }
  }

  return values;
}

const localEnvironment = readLocalEnvironment();
const getEnvironment = (name) =>
  process.env[name]?.trim() || localEnvironment[name]?.trim() || "";

const supabaseUrl = getEnvironment("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "");
const anonKey = getEnvironment("NEXT_PUBLIC_SUPABASE_ANON_KEY");

if (!supabaseUrl || !anonKey) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  process.exit(1);
}

async function readRows(path, label) {
  let response;

  try {
    response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    throw new Error(
      `${label}: không thể kết nối Supabase (${error instanceof Error ? error.message : "lỗi không xác định"})`,
    );
  }

  if (response.status === 401 || response.status === 403) {
    return [];
  }

  if (!response.ok) {
    throw new Error(`${label}: Supabase trả HTTP ${response.status}`);
  }

  const rows = await response.json();
  if (!Array.isArray(rows)) {
    throw new Error(`${label}: phản hồi không đúng định dạng mảng`);
  }

  return rows;
}

const failures = [];

for (const [label, path] of [
  ["consultations", "consultations?select=id&limit=1"],
  ["users", "users?select=uid&limit=1"],
]) {
  const rows = await readRows(path, label);
  if (rows.length > 0) {
    failures.push(`Anon vẫn đọc được bảng ${label}.`);
  }
}

const publicSettings = await readRows("settings?select=id", "settings");
const allowedSettings = new Set(["general", "filters"]);
const exposedSettings = publicSettings.filter(
  (row) => typeof row?.id !== "string" || !allowedSettings.has(row.id),
);

if (exposedSettings.length > 0) {
  failures.push("Anon vẫn đọc được settings ngoài danh sách general/filters.");
}

if (failures.length > 0) {
  console.error("Kiểm tra RLS production thất bại:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("RLS production đạt: dữ liệu người dùng và settings nhạy cảm không công khai.");
