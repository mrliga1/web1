import { generateSlug } from './utils';

interface SearchContent {
  title?: string; description?: string; content?: string;
  locationTab?: string; amenityTab?: string; priceTab?: string; qaTab?: string;
}

export function getSearchReadinessWarnings(content: SearchContent): string[] {
  const warnings: string[] = [];
  const slug = generateSlug(content.title || '');
  if (!slug || /^(?:text-san-pham-moi|kiem-tra-bai-viet-moi|test(?:-|$))/.test(slug)) {
    warnings.push('Tiêu đề có dấu hiệu thử nghiệm hoặc chưa có tiêu đề.');
  }
  const text = [content.description, content.content, content.locationTab, content.amenityTab, content.priceTab, content.qaTab]
    .filter((value): value is string => typeof value === 'string')
    .join(' ').replace(/data:image\/[^;]+;base64,[\w+/=]+/gi, '').replace(/<[^>]*>/g, ' ');
  if (/([a-zà-ỹ])\1{19,}/iu.test(text)) warnings.push('Nội dung còn chuỗi ký tự lặp cần biên tập.');
  return warnings;
}

export const isContentSearchReady = (content: SearchContent) => getSearchReadinessWarnings(content).length === 0;
