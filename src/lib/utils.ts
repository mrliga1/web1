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
  
  // Extract original URL if it's already wrapped in wsrv.nl
  if (finalUrl.includes('wsrv.nl')) {
    try {
      const urlObj = new URL(finalUrl);
      const innerUrl = urlObj.searchParams.get('url');
      if (innerUrl) {
        finalUrl = innerUrl;
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  if (finalUrl.includes('raw.githubusercontent.com')) {
    const match = finalUrl.match(/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.+)/);
    if (match) {
      const [, owner, repo, branch, path] = match;
      finalUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${path}`;
    }
  }
  
  // Handle Unsplash natively for much faster LCP and auto WebP/AVIF
  if (finalUrl.includes('unsplash.com')) {
    // If it already has query params, we append, otherwise create new
    try {
      const urlObj = new URL(finalUrl);
      urlObj.searchParams.set('auto', 'format,compress');
      urlObj.searchParams.set('q', '75');
      if (width) urlObj.searchParams.set('w', width.toString());
      return urlObj.toString();
    } catch (e) {
      // Fallback if URL parsing fails
      const separator = finalUrl.includes('?') ? '&' : '?';
      return `${finalUrl}${separator}auto=format,compress&q=75${width ? `&w=${width}` : ''}`;
    }
  }
  
  // Use wsrv.nl image proxy and force WebP for other external images
  if (finalUrl.startsWith('http') && !finalUrl.endsWith('.svg')) {
     let optimized = `https://wsrv.nl/?url=${encodeURIComponent(finalUrl)}&output=webp&q=75`;
     if (width) {
       optimized += `&w=${width}`;
     }
     return optimized;
  }
  
  return finalUrl;
}

export function generateSrcSet(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  return `${optimizeImageUrl(url, 400)} 400w, ${optimizeImageUrl(url, 800)} 800w, ${optimizeImageUrl(url, 1200)} 1200w, ${optimizeImageUrl(url, 1600)} 1600w`;
}

export function getRouteUrl(route: import('../types').RouteState): string {
  if (route.screen === "home") return "/";
  if (route.screen === "san-pham") {
    const params = new URLSearchParams();
    if (route.priceRange) params.append("priceRange", route.priceRange);
    if (route.areaRange) params.append("areaRange", route.areaRange);
    if (route.location) params.append("location", route.location);
    const queryString = params.toString();
    return queryString ? `/san-pham?${queryString}` : "/san-pham";
  }
  if (route.screen === "du-an") return "/du-an";
  if (route.screen === "tin-tuc") return "/tin-tuc";
  if (route.screen === "lien-he") return "/lien-he";
  if (route.screen === "product-detail" && (route.slug || route.productId))
    return `/san-pham/${route.slug || route.productId}`;
  if (route.screen === "project-detail" && (route.slug || route.projectId))
    return `/du-an/${route.slug || route.projectId}`;
  if (route.screen === "news-detail" && (route.slug || route.newsId))
    return `/tin-tuc/${route.slug || route.newsId}`;
  if (route.screen === "admin") return "/admin";
  if (route.screen === "category-product" && route.categoryName)
    return `/category-product/${generateSlug(route.categoryName)}`;
  if (route.screen === "category-product") return "/category-product";
  if (route.screen === "category-news" && route.categoryName)
    return `/category-news/${generateSlug(route.categoryName)}`;
  if (route.screen === "category-news") return "/category-news";
  if (route.screen === "latest-sales") return "/latest-sales";
  if (route.screen === "latest-rents") return "/latest-rents";
  if (route.screen === "terms-of-use") return "/terms-of-use";
  if (route.screen === "privacy-policy") return "/privacy-policy";
  if (route.screen === "favorites") return "/yeu-thich";
  return "/";
}

