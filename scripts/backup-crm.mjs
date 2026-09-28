import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash, randomBytes } from 'node:crypto';

// Chỉ lưu bản sao dữ liệu CRM trong thư mục riêng đã loại khỏi Git; không lưu khóa.
const env = { ...process.env };
for (const file of ['.env', '.env.local']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
}
const url = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Thiếu cấu hình Supabase máy chủ');
const headers = { apikey: key, Authorization: 'Bearer ' + key, Prefer: 'count=exact' };
async function readTable(table) {
  const rows = [];
  const pageSize = 500;
  let total;
  for (let offset = 0; offset < 500000; offset += pageSize) {
    const response = await fetch(url + '/rest/v1/' + table + '?select=*&order=id.asc&limit=' + pageSize + '&offset=' + offset, { headers, signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error('Không thể sao lưu ' + table + ' (HTTP ' + response.status + ')');
    const page = await response.json();
    const countText = response.headers.get('content-range')?.split('/').pop();
    const count = countText && countText !== '*' ? Number(countText) : NaN;
    if (!Array.isArray(page) || !Number.isFinite(count)) throw new Error('Phản hồi sao lưu không hợp lệ');
    if (total === undefined) total = count;
    if (count !== total) throw new Error('Dữ liệu thay đổi trong lúc sao lưu; cần chạy lại');
    rows.push(...page);
    if (rows.length >= total || page.length < pageSize) break;
  }
  if (rows.length !== total || new Set(rows.map(row => row.id)).size !== total) throw new Error('Bản sao thiếu hoặc trùng hồ sơ');
  return rows;
}
const root = resolve('.local-backups');
const ignored = readFileSync('.gitignore', 'utf8').split(/\r?\n/).some(line => line.trim() === '.local-backups/');
if (!ignored) throw new Error('Thư mục sao lưu chưa được loại khỏi Git');
const rows = await readTable('consultations');
const time = new Date().toISOString();
const name = 'crm-' + time.replace(/[^0-9]/g, '').slice(0, 14) + '-' + randomBytes(4).toString('hex');
const payload = JSON.stringify({ time, project: new URL(url).hostname.split('.')[0], source: 'Supabase REST', schemaIncluded: false, tables: { consultations: rows } }, null, 2);
mkdirSync(root, { recursive: true });
const path = resolve(root, name + '.json');
writeFileSync(path, payload, { flag: 'wx', mode: 0o600 });
const checksum = createHash('sha256').update(payload).digest('hex');
const saved = readFileSync(path, 'utf8');
if (createHash('sha256').update(saved).digest('hex') !== checksum || JSON.parse(saved).tables.consultations.length !== rows.length) throw new Error('Không xác minh được bản sao đã ghi');
writeFileSync(resolve(root, name + '.manifest.json'), JSON.stringify({ time, file: name + '.json', count: rows.length, sha256: checksum, schemaIncluded: false }, null, 2), { flag: 'wx', mode: 0o600 });
console.log(JSON.stringify({ backedUp: true, table: 'consultations', count: rows.length, checksumVerified: true, folder: '.local-backups', schemaIncluded: false }));
