export function generateSlug(text: string): string {
  if (!text) return '';
  return text.toString().toLowerCase()
    .replace(/a|á|à|ả|ã|ạ|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a')
    .replace(/e|é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e')
    .replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i')
    .replace(/o|ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o')
    .replace(/u|ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u')
    .replace(/y|ý|ỳ|ỷ|ỹ|ỵ/gi, 'y')
    .replace(/đ/gi, 'd')
    .replace(/\s+/g, '-') 
    .replace(/[^\w\-]+/g, '') 
    .replace(/\-\-+/g, '-') 
    .replace(/^-+/, '') 
    .replace(/-+$/, '');
}

export function optimizeImageUrl(url: string | undefined | null, width?: number): string {
  if (!url) return '';
  let finalUrl = url;
  if (url.includes('raw.githubusercontent.com')) {
    const match = url.match(/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.+)/);
    if (match) {
      const [, owner, repo, branch, path] = match;
      finalUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${path}`;
    }
  }
  
  // Use wsrv.nl image proxy for automatic WebP/AVIF compression
  // Skip local SVGs, Unsplash, or already proxied URLs
  if (finalUrl.startsWith('http') && !finalUrl.includes('wsrv.nl') && !finalUrl.includes('unsplash.com') && !finalUrl.endsWith('.svg')) {
     let optimized = `https://wsrv.nl/?url=${encodeURIComponent(finalUrl)}&output=webp&q=70`;
     if (width) {
       optimized += `&w=${width}`;
     }
     return optimized;
  }
  
  return finalUrl;
}
