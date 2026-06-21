import React, { useState, useEffect } from 'react';
import { RouteState, Product } from '../types';
import { db, collection, getDocs } from '../firebase';
import { Helmet } from 'react-helmet-async';
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
        
        prodSnap.forEach(doc => {
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
      <Helmet>
        <title>Tin đã lưu | Greenia Homes</title>
      </Helmet>

      <div className="flex items-center gap-3 mb-8 pb-[5px] h-[35px] border-b border-slate-800">
        <Heart className="w-6 h-6 text-amber-500 fill-current" />
        <h1 className="text-xl sm:text-2xl font-display font-medium text-white tracking-tight leading-normal m-0 p-0">
          Danh sách tin đã lưu
        </h1>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
          <Compass className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-slate-400 text-sm font-mono">Đang tải danh sách...</p>
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {favorites.map((product) => (
            <ProductCard 
              key={product.id} 
              item={product} 
              onNavigate={onNavigate} 
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mx-auto mb-4 border border-slate-800">
            <Heart className="w-6 h-6 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-300 mb-2">Chưa có tin đăng nào được lưu</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">Bạn có thể lưu các tin đăng bất động sản yêu thích để xem lại sau bằng cách nhấn vào biểu tượng trái tim.</p>
          <button
            onClick={() => onNavigate({ screen: 'san-pham' })}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer"
          >
            Khám phá nhà đất
          </button>
        </div>
      )}
    </div>
  );
}
