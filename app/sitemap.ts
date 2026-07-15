import { supabase } from '../src/supabase';
import { generateSlug } from '../src/lib/utils';

// Sitemap động cho Greenia Homes - tự động cập nhật khi có bài mới
export default async function sitemap() {
  const baseUrl = 'https://greeniahomes.vn';
  
  // Các trang tĩnh
  const staticRoutes = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${baseUrl}/san-pham`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/du-an`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${baseUrl}/tin-tuc`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${baseUrl}/lien-he`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${baseUrl}/latest-sales`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.7 },
    { url: `${baseUrl}/latest-rents`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.7 },
    { url: `${baseUrl}/chinh-sach-bao-mat`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${baseUrl}/dieu-khoan-su-dung`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
  ];

  // Lấy sản phẩm từ Supabase
  let productRoutes: any[] = [];
  try {
    const { data: products } = await supabase.from('products').select('data');
    if (products) {
      productRoutes = products
        .filter((p: any) => p.data?.title && (!p.data?.approvalStatus || p.data?.approvalStatus === 'approved'))
        .map((p: any) => ({
          url: `${baseUrl}/san-pham/${generateSlug(p.data.title)}`,
          lastModified: p.data.updatedAt ? new Date(p.data.updatedAt) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }));
    }
  } catch (e) {
    console.error('Lỗi khi tạo sitemap sản phẩm:', e);
  }

  // Lấy tin tức từ Supabase
  let newsRoutes: any[] = [];
  try {
    const { data: news } = await supabase.from('news').select('data');
    if (news) {
      newsRoutes = news
        .filter((n: any) => n.data?.title)
        .map((n: any) => ({
          url: `${baseUrl}/tin-tuc/${generateSlug(n.data.title)}`,
          lastModified: n.data.updatedAt ? new Date(n.data.updatedAt) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }));
    }
  } catch (e) {
    console.error('Lỗi khi tạo sitemap tin tức:', e);
  }

  // Lấy dự án từ Supabase
  let projectRoutes: any[] = [];
  try {
    const { data: projects } = await supabase.from('projects').select('data');
    if (projects) {
      projectRoutes = projects
        .filter((p: any) => p.data?.name)
        .map((p: any) => ({
          url: `${baseUrl}/du-an/${generateSlug(p.data.name)}`,
          lastModified: p.data.updatedAt ? new Date(p.data.updatedAt) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }));
    }
  } catch (e) {
    console.error('Lỗi khi tạo sitemap dự án:', e);
  }

  // Lấy danh mục sản phẩm
  let categoryRoutes: any[] = [];
  try {
    const { data } = await supabase.from('settings').select('*').eq('id', 'general').maybeSingle();
    if (data?.data?.productCategoriesExt) {
      categoryRoutes = data.data.productCategoriesExt.map((c: any) => ({
        url: `${baseUrl}/category-product/${generateSlug(c.name)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
    }
  } catch (e) {
    console.error('Lỗi khi tạo sitemap danh mục:', e);
  }

  return [...staticRoutes, ...productRoutes, ...newsRoutes, ...projectRoutes, ...categoryRoutes];
}
