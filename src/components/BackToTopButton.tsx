'use client';

import { ArrowUp } from 'lucide-react';

export default function BackToTopButton() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({
        top: 0,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      })}
      className="flex items-center gap-1 hover:text-accent transition-colors cursor-pointer font-medium bg-transparent border-none"
    >
      <span>Về đầu trang</span>
      <ArrowUp className="w-3.5 h-3.5" />
    </button>
  );
}
