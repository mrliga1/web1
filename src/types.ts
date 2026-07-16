export interface Product {
  id: string;
  title: string;
  priceText: string;     // Display price e.g. "45.5 Tỷ" or "12 Triệu/tháng"
  priceVal: number;      // Numerical value for range queries and filters
  type: 'sale' | 'rent'; // 'sale' = Bán, 'rent' = Cho thuê
  district: string;      // District or area (e.g. "Quận 1", "TP. Thủ Đức", "Quận 7", "Huyện Nhà Bè")
  street?: string;       // Street name or address (e.g. "Đường Nguyễn Hoàng")
  phone: string;         // Contact phone number
  description?: string;   // HTML formatting description
  imageUrl: string;      // Primary cover image layout
  imageUrls?: string[];  // Multiple carousel images if defined, fallback to [imageUrl]
  avatarUrl?: string;    // Contact avatar representation
  area?: number;         // Diện tích m²
  bedrooms?: number;     // Số phòng ngủ
  toilets?: number;      // Số wc
  direction?: string;    // Hướng nhà
  roadWidth?: string;    // Đường vào m
  legalStatus?: string;  // Pháp lý (e.g. Sổ hồng, Đang chờ sổ)
  floors?: number | string; // Số tầng
  interior?: string;     // Nội thất
  mapHtml?: string;      // Sơ đồ bản đồ iframe
  latitude?: number;
  longitude?: number;
  category: string;      // Danh mục sản phẩm (e.g. "Biệt thự", "Nhà phố", "Căn hộ", "Đất nền")
  price?: string;        // Fallback for price property
  location?: string;     // Fallback for location property
  viewsCount: number;    // Lượt xem thực tế
  createdAt: string;     // ISO date
  updatedAt?: string;
  createdBy: string;     // email / username
  createdByRole: 'admin' | 'editor' | 'member';
  approvalStatus: 'approved' | 'pending' | 'rejected';
  metaTitle?: string;
  metaDesc?: string;
  metaKeywords?: string;
  seoTitle?: string;
  seoDesc?: string;
  seoKeywords?: string;
  baseRating?: number;
  baseReviewCount?: number;
  userTotalRating?: number;
  userReviewCount?: number;
}

export interface FloorPlanTab {
  id: string;
  name: string;
  content: string;
  images: string[];
}

export interface CustomSection {
  id: string;
  title: string;
  content: string;
  position: 'before_overview' | 'after_overview' | 'after_subdivision' | 'after_location' | 'after_amenity' | 'after_floorplan' | 'after_price' | 'after_qa' | 'after_news';
}

export interface Project {
  id: string;
  title: string;
  priceText: string;     // Display e.g. "Chỉ từ 4 tỷ/căn"
  priceVal: number;
  location: string;      // Vị trí hiển thị
  units?: string | number; // Số lượng căn
  imageUrl: string;
  imageUrls?: string[];
  images?: string[];     // Fallback for images property
  avatarUrl?: string;    // Agent/Author avatar
  status: 'opening' | 'handed-over' | 'handed_over' | 'coming_soon'; // Mở rộng thêm các trạng thái bị sai chính tả
  description: string;   // Tab 1: Trang chủ dự án
  locationShortDesc?: string; // Đoạn mô tả ngắn Vị trí
  locationTab?: string;   // Tab 2: Vị trí dư án
  subdivisionTab?: string; // Rich text editor for subdivision
  subdivisionsCards?: Array<{ name: string; imageUrl: string; status?: string; projectStr?: string; styleStr?: string; priceStr?: string; types?: string[]; linkedProjectId?: string }>;
  amenityTab?: string;    // Tab 3: Tiện ích dự án
  amenityImages?: string[];
  floorPlanTab?: string; // Tab 4: Mặt bằng
  floorPlanImages?: string[]; // Ảnh mặt bằng
  floorPlanTabs?: FloorPlanTab[];
  priceTab?: string;     // Tab 5: Giá bán
  qaTab?: string;        // Tab Q&A (Hỏi Đáp) (Rich text)
  qaList?: { question: string; answer: string; }[]; // Câu hỏi / Trả lời
  mapHtml?: string;      // Sơ đồ bản đồ iframe
  latitude?: number;
  longitude?: number;
  developer?: string;    // Chủ đầu tư
  scale?: string;        // Quy mô
  productType?: string;  // Loại hình sản phẩm
  population?: string;   // Quy mô dân số
  buildingDensity?: string; // Mật độ xây dựng
  handoverTime?: string; // Thời gian bàn giao
  subdivisions?: string; // Phân khu
  supportedBanks?: string; // Ngân hàng hỗ trợ
  additionalInfo?: string; // Thông tin thêm
  newsCategoryUrl?: string; // URL danh mục tin tức
  productCategoryUrl?: string; // URL danh mục sản phẩm (bất động sản)
  customSections?: CustomSection[]; // Các khu vực nội dung tuỳ chỉnh
  commencementDate?: string; // Thời điểm khởi công
  ownership?: string;    // Hình thức sở hữu
  viewsCount: number;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  metaTitle?: string;
  metaDesc?: string;
  metaKeywords?: string;
  seoTitle?: string;
  seoDesc?: string;
  seoKeywords?: string;
  baseRating?: number;
  baseReviewCount?: number;
  userTotalRating?: number;
  userReviewCount?: number;
  approvalStatus?: 'approved' | 'pending' | 'rejected';
}

export interface News {
  id: string;
  title: string;
  description: string;   // Sơ lược ngắn gọn
  content: string;       // Toàn bộ nội dung bài viết dạng HTML
  category: string;      // Danh mục bài viết (như 'Tin thị trường', 'Lưu ý khi mua nhà',...)
  imageUrl: string;
  thumbnail?: string;    // Thumbnail image
  imageUrls?: string[];  // Custom photo album arrays
  avatarUrl?: string;    // Custom editor profile photograph
  viewsCount: number;
  author: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  metaTitle?: string;
  metaDesc?: string;
  metaKeywords?: string;
  seoTitle?: string;
  seoDesc?: string;
  seoKeywords?: string;
  baseRating?: number;
  baseReviewCount?: number;
  userTotalRating?: number;
  userReviewCount?: number;
  approvalStatus?: 'approved' | 'pending' | 'rejected';
}

export interface Category {
  id: string;
  name: string;
  type: 'product' | 'news';
}

export interface Consultation {
  id: string;
  name: string;
  phone: string;
  email?: string;
  createdAt: string;
  status: 'new' | 'contacted' | 'negotiating' | 'won' | 'lost' | 'pending' | 'processed';
  source?: string;
  priority?: 'high' | 'medium' | 'low';
  notes?: string;
  careHistory?: { time: number; note: string; author: string }[];
  assignee?: string;
  assignedTo?: string;
  expectedValue?: number;
  propertyId?: string;
  propertyTitle?: string;
  message?: string;
  demand?: string;
  images?: string[];
}

export type ScreenType = 
  | 'home' 
  | 'san-pham' 
  | 'du-an' 
  | 'tin-tuc' 
  | 'lien-he' 
  | 'product-detail' 
  | 'project-detail' 
  | 'news-detail'
  | 'category-news'
  | 'category-product'
  | 'admin'
  | 'favorites'
  | 'latest-sales'
  | 'latest-rents'
  | 'terms-of-use'
  | 'privacy-policy';

export interface NewsCategoryExt {
  id: string;
  name: string;
  parentId: string | null;
  seoTitle?: string;
  seoDesc?: string;
  seoKeywords?: string;
}

export interface RouteState {
  screen: ScreenType;
  productId?: string;
  projectId?: string;
  newsId?: string;
  slug?: string;         // for URL generation
  categoryName?: string; // dynamically view by category name
  location?: string;     // filter by location
  priceRange?: string;   // filter by price range
  areaRange?: string;    // filter by area range
}

export interface VisualSection {
  id: string;
  name: string;
  visible: boolean;
  paddingTop?: number;
  paddingBottom?: number;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  extraData?: Record<string, any>;
}
