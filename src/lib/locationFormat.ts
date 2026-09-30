// Rút gọn tên hiển thị mà không cần tải danh mục tỉnh, phường và xã.
export function formatLocationName(name: string): string {
  if (!name) return '';
  return name
    .replace(/^Tỉnh\s+/i, '')
    .replace(/Tp\.?\s*Hồ\s*Chí\s*Minh/i, 'TP. HCM')
    .replace(/Thành phố Hồ Chí Minh/i, 'TP. HCM');
}
