import React, { useState, useEffect } from 'react';
import { RouteState, Product } from '../types';
import { db, collection, getDocs } from '../firebase';
import { Heart, Compass } from 'lucide-react';
import ProductCard from './ProductCard';

export default function FavoritesPage({ onNavigate }: { onNavigate: (route: RouteState) => void }) {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavs = async () => {
      try {
        const favIds: string[] = JSON.parse(localStorage.getItem('saved_favorites') || '[]');
        if (favIds.length === 0) {
          setFavorites([]);
          setLoading(false);
          return;
        }

        const prodCol = collection(db, 'products');
        const prodSnap = await getDocs(prodCol);
        const fetchedFavs: Product[] = [];
        
        prodSnap.forEach((doc: any) => {
          if (favIds.includes(doc.id)) {
            const data = doc.data();
            if (!data.approvalStatus || data.approvalStatus === 'approved') {
              fetchedFavs.push({ id: doc.id, ...data } as Product);
            }
          }
        });
        
        setFavorites(fetchedFavs);
      } catch (error) {
        console.error("Lỗi khi tải danh sách yêu thích:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavs();

    const handleFavChange = () => fetchFavs();
    window.addEventListener('favorites_changed', handleFavChange);
    return () => window.removeEventListener('favorites_changed', handleFavChange);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-[20px] py-[30px] animate-in fade-in select-none">
      <div className="flex items-center gap-3 mb-8 pb-[5px] h-[35px] border-b border-border-color">
        <Heart className="w-6 h-6 text-primary fill-current" />
        <h1 className="text-xl sm:text-2xl font-display font-medium text-text-primary tracking-tight leading-normal m-0 p-0">
          Danh sách tin đã lưu
        </h1>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
          <Compass className="w-8 h-8 text-primary animate-spin" />
          <p className="text-text-secondary text-sm font-mono">Đang tải danh sách...</p>
        </div>
      ) : favorites.length > 0 ? (
        <ul role="list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {favorites.map((product) => (
            <li key={product.id} className="list-none">
              <ProductCard 
                item={product} 
                onNavigate={onNavigate} 
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-bg-surface flex items-center justify-center mx-auto mb-4 border border-border-color">
            <Heart className="w-6 h-6 text-white/70" />
          </div>
          <h2 className="text-lg font-medium text-text-secondary mb-2">Chưa có tin đăng nào được lưu</h2>
          <p className="text-white/70 text-sm max-w-md mx-auto mb-6">Bạn có thể lưu các tin đăng bất động sản yêu thích để xem lại sau bằng cách nhấn vào biểu tượng trái tim.</p>
          <button
            onClick={() => onNavigate({ screen: 'san-pham' })}
            className="px-6 py-2.5 bg-primary hover:bg-amber-600 text-black font-bold rounded-lg transition-colors cursor-pointer"
          >
            Khám phá nhà đất
          </button>
        </div>
      )}
    </div>
  );
}
