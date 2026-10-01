import type { Config } from 'tailwindcss';
import base from './tailwind.config';

if (!Array.isArray(base.content)) {
  throw new Error('Cấu hình CSS gốc phải dùng danh sách tệp để tách phần quản trị.');
}

// Chỉ loại tệp quản trị đã xác nhận không thuộc cây phụ thuộc của trang công khai.
const config: Config = {
  ...base,
  content: [
    ...base.content,
    '!./src/components/AdminPanel.tsx',
    '!./app/admin/**/*.{js,ts,jsx,tsx}',
  ],
};

export default config;
