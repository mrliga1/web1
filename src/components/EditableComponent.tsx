import React from 'react';
import dynamic from 'next/dynamic';
import type { VisualSection } from '../types';
import { normalizeEditableTextValue } from '../lib/editableTextValue';

const LazyTextEditor = dynamic(() => import('./EditableComponentEditor').then(module => module.TextEditor));
const LazyImageEditor = dynamic(() => import('./EditableComponentEditor').then(module => module.ImageEditor));

export interface EditableTextProps {
  sectionId: string;
  field: string;
  subField?: string;
  value?: string;
  isEditMode: boolean;
  sections: VisualSection[];
  onUpdateSections: (sections: VisualSection[]) => void;
  isArea?: boolean;
  className?: string;
  tag?: React.ElementType;
}

export interface EditableImageProps {
  sectionId: string;
  field: string;
  imageUrl: string;
  isEditMode: boolean;
  sections: VisualSection[];
  onUpdateSections: (sections: VisualSection[]) => void;
  onShowNotification: (message: string, type: 'success' | 'error') => void;
  className?: string;
}

export function EditableText(props: EditableTextProps) {
  if (props.isEditMode) return <LazyTextEditor {...props} />;
  const val = normalizeEditableTextValue(props.value);
  const Tag = props.tag || 'p';
  const className = props.className || '';
  if (!val) return null;
  // Hiển thị chữ chuyển màu theo cú pháp [gradient].
  const lines = val.split('\n').map((line, lidx) => {
    let content: React.ReactNode = line;

    if (line.includes('[gradient]') && line.includes('[/gradient]')) {
      const pre = line.split('[gradient]')[0];
      const inner = line.split('[gradient]')[1].split('[/gradient]')[0];
      const post = line.split('[/gradient]')[1] || '';
      content = (
        <span key={lidx}>
          {pre}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 font-bold">
            {inner}
          </span>
          {post}
        </span>
      );
    }

    return <React.Fragment key={lidx}>{content}{lidx < val.split('\n').length - 1 ? <br /> : null}</React.Fragment>;
  });
  return <Tag className={className}>{lines}</Tag>;
}

export function EditableImage(props: EditableImageProps) {
  if (props.isEditMode) return <LazyImageEditor {...props} />;
  const url = props.imageUrl || '';
  return (
    <div className={`relative group/img ${props.className || ''}`}>
      {url ? (
        <img loading="lazy" decoding="async" src={url} alt="Bố cục" width={1200} height={675} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <div className="w-full h-full bg-bg-surface border border-border-color flex items-center justify-center text-white/70 text-xs">
          (Trắng)
        </div>
      )}
    </div>
  );
}
