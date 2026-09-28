// Dữ liệu trình duyệt cũ hoặc bị sửa không được làm hỏng trang công khai.
export function readStoredStringList(key: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value)
      ? Array.from(new Set(value.filter((item): item is string => typeof item === 'string' && item.length > 0)))
      : [];
  } catch {
    return [];
  }
}
