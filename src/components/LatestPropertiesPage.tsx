import React, { useState, useEffect } from 'react';
import { collection, getDocs, db } from '../firebase';
import { handleFirestoreError, OperationType } from '../firebase-errors';
import { Product, RouteState } from '../types';
import ProductCard from './ProductCard';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import AdBanner from './AdBanner';

interface LatestPropertiesPageProps {
  onNavigate: (route: RouteState) => void;
  type?: 'sale' | 'rent';
  categoryName?: string;
}

export default function LatestPropertiesPage({ onNavigate, type, categoryName }: LatestPropertiesPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [gridLimit, setGridLimit] = useState(15);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const prodCol = collection(db, 'products');
        const snap = await getDocs(prodCol);
        const list: Product[] = [];
        snap.forEach((doc) => {
          const data = doc.data();
          if (!data.approvalStatus || data.approvalStatus === 'approved') {
            let matches = true;
            if (type === 'rent' && data.type !== 'rent') matches = false;
            if (type === 'sale' && data.type === 'rent') matches = false;
            if (categoryName && data.category !== categoryName) matches = false;
            
            if (matches) {
              list.push({ id: doc.id, ...data } as Product);
            }
          }
        });
        
        list.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        setProducts(list);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'products');
      } finally {
        setLoading(false);
      }
    }
    
    fetchProducts();
  }, [type, categoryName]);

  let title = 'Danh Mục Sản Phẩm';
  let subtitle = 'Cập nhật liên tục';
  
  if (type === 'sale' && !categoryName) {
    title = 'Quỹ Biệt Thự & Nhà Bán Mới Nhất';
    subtitle = 'Cập nhật tin chuyển nhượng liên tục';
  } else if (type === 'rent' && !categoryName) {
    title = 'Quỹ Căn Hộ & Nhà Cho Thuê Mới Nhất';
    subtitle = 'Cập nhật tin cho thuê liên tục';
  } else if (categoryName) {
    title = `Danh mục: ${categoryName}`;
    subtitle = 'Sản phẩm nổi bật';
  }

  return (
    <div className="min-h-screen pb-0 font-sans bg-bg-surface">
      <div className="pt-10 pb-6 border-b border-border-color bg-bg-surface/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center text-center space-y-3">
          <button 
            onClick={() => onNavigate({ screen: 'home' })}
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-primary mb-2 transition-colors cursor-pointer border-none bg-transparent"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Trở về trang quản trị trung tâm
          </button>
          
          <span className="text-xs text-primary font-bold uppercase tracking-widest">{subtitle}</span>
          <h1 className="text-2xl sm:text-4xl font-display font-medium text-text-primary tracking-tight">{title}</h1>
          <p className="text-text-secondary font-light text-xs max-w-xl mx-auto">
            Hệ thống hiển thị các sản phẩm mới nhất được chọn lọc thủ công, đảm bảo pháp lý và sẵn sàng giao dịch.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-20 text-text-secondary text-xs animate-pulse">
            <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-primary" />
            ĐANG TẢI DỮ LIỆU...
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-white/70 text-xs">Không tìm thấy bất động sản nào.</div>
        ) : (
          <div className="space-y-10">
            <ul role="list" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
              {products.slice(0, gridLimit).map((item) => (
                <li key={item.id} className="list-none">
                  <ProductCard 
                    item={item} 
                    onNavigate={onNavigate} 
                    badgeText={item.type !== 'rent' ? 'Bán' : 'Cho thuê'} 
                    badgeColor={item.type !== 'rent' ? 'bg-rose-700 text-white' : 'bg-primary text-black'} 
                  />
                </li>
              ))}
            </ul>

            {products.length > gridLimit && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setGridLimit(prev => prev + 10)}
                  className="bg-bg-surface border border-border-color text-text-secondary hover:bg-slate-850 hover:text-text-primary px-6 py-3 rounded-full text-xs font-semibold tracking-wider font-display transition-all cursor-pointer"
                >
                  Tải Thêm (Ajax +10)
                </button>
              </div>
            )}
          </div>
        )}
        
        <AdBanner slot="latest-properties-bottom" containerClassName="mt-12" />
      </div>
    </div>
  );
}
