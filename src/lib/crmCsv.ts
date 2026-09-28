export function escapeCrmCsvCell(value: unknown): string {
  let text = value == null ? '' : String(value);
  // Giữ dữ liệu khách dưới dạng văn bản để bảng tính không thực thi công thức.
  if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function createCrmCsv(headers: string[], rows: unknown[][]): string {
  return '\uFEFF' + [headers, ...rows].map((row) => row.map(escapeCrmCsvCell).join(',')).join('\r\n');
}
