"use client";

/**
 * ClientApp - Wrapper component bọc toàn bộ App.tsx gốc.
 * Nhận initialRoute từ server page để xác định trang cần hiển thị.
 * Giữ nguyên 100% logic và giao diện từ App.tsx gốc.
 */

import dynamic from 'next/dynamic';
import { AuthProvider } from "../src/contexts/AuthContext";

const App = dynamic(() => import("../src/App"));

interface ClientAppProps {
  /** Route ban đầu được server truyền xuống */
  initialScreen?: string;
  /** ID cho chi tiết (product, project, news) */
  itemId?: string;
  /** Slug cho URL thân thiện */
  slug?: string;
  /** Tên danh mục */
  categoryName?: string;
}

export default function ClientApp({
  initialScreen,
  itemId,
  slug,
  categoryName,
}: ClientAppProps) {
  /* Inject route vào window để App.tsx có thể đọc qua getInitialRoute() */
  if (typeof window !== "undefined" && initialScreen) {
    (window as any).__NEXT_INITIAL_ROUTE__ = {
      screen: initialScreen,
      itemId,
      slug,
      categoryName,
    };
  }

  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
