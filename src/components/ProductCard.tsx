import React, { useState, useEffect } from 'react';
import { Product, RouteState } from '../types';
import { MapPin, Tag, Layers, Bookmark, Bath, Heart } from 'lucide-react';
import { generateSlug } from '../lib/utils';

interface ProductCardProps {
  key?: React.Key;
  item: Product;
  onNavigate: (route: RouteState) => void;
  badgeText?: string;
  badgeColor?: string;
}

export default function ProductCard({ item, onNavigate, badgeText, badgeColor }: ProductCardProps) {
  const displayBadgeText = badgeText || (item.type === 'rent' ? 'Cho thuê' : 'Bán');
  const displayBadgeColor = badgeColor || (item.type === 'rent' ? 'bg-[#00b894] text-white' : 'bg-[#ff4d4f] text-white');
  const safeImageUrl = item.imageUrl || (item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls[0] : 'https://placehold.co/600x400/1e293b/a4b5fd?text=No+Image');

  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const favs: string[] = JSON.parse(localStorage.getItem('saved_favorites') || '[]');
    setIsFavorite(favs.includes(item.id));
  }, [item.id]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    const favs: string[] = JSON.parse(localStorage.getItem('saved_favorites') || '[]');
    if (favs.includes(item.id)) {
      const newFavs = favs.filter(id => id !== item.id);
      localStorage.setItem('saved_favorites', JSON.stringify(newFavs));
      setIsFavorite(false);
      window.dispatchEvent(new Event('favorites_changed'));
    } else {
      favs.push(item.id);
      localStorage.setItem('saved_favorites', JSON.stringify(favs));
      setIsFavorite(true);
      window.dispatchEvent(new Event('favorites_changed'));
    }
  };

  return (
    <div
      onClick={() => onNavigate({ screen: 'product-detail', productId: item.id, slug: generateSlug(item.title) })}
      className="w-full shrink-0 bg-[#0e121b] hover:bg-[#0e121b] border border-[#232d45] hover:border-amber-500/50 rounded overflow-hidden group hover:scale-[1.01] transition-all cursor-pointer flex flex-col shadow-sm"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-950 flex items-center justify-center">
        <img 
          src={(safeImageUrl) || undefined} 
          alt={item.title || 'Product'} 
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          referrerPolicy="no-referrer" 
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/1e293b/a4b5fd?text=No+Image';
          }}
        />
        <div className={`absolute top-0 left-0 text-[10px] font-semibold px-[8px] py-[4px] rounded-br-[5px] z-10 ${displayBadgeColor}`}>
          {displayBadgeText.replace('undefined', '0')}
        </div>
        <button
          onClick={toggleFavorite}
          className={`absolute top-2 right-2 z-20 p-1.5 rounded-full backdrop-blur-md border border-white/20 transition-colors ${isFavorite ? 'bg-amber-500/80 text-white' : 'bg-black/40 text-slate-300 hover:text-white hover:bg-black/60'}`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>
      <div className="p-[15px] flex-1 flex flex-col">
        <h3 className="font-semibold text-[14px] text-white group-hover:text-amber-500 line-clamp-2 leading-[1.4] transition-colors mb-[10px] min-h-[40px]">
          {item.title}
        </h3>
        <div className="flex items-center gap-[5px] text-[12px] text-[#999] mb-[2px]">
          <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
          <span className="truncate">{item.district}</span>
        </div>
        
        <div className="pt-[10px] border-t border-dashed border-[#232d45] mt-auto">
          <div className="flex items-center justify-between mb-[5px]">
            <span className="font-bold text-[14px] text-amber-500 truncate">{item.priceText || 'Đang cập nhật'}</span>
          </div>
          <div className="flex items-center gap-[10px] text-[11px] text-[#999]">
            <div className="flex items-center gap-[5px]">
              <Layers className="w-3 h-3 shrink-0" />
              <span>{item.area ? `${item.area} m²` : '--'}</span>
            </div>
            <div className="flex items-center gap-[5px]">
              <Bookmark className="w-3 h-3 shrink-0" />
              <span>{item.bedrooms ? `${item.bedrooms} PN` : '--'}</span>
            </div>
            <div className="flex items-center gap-[5px]">
              <Bath className="w-3 h-3 shrink-0" />
              <span>{item.toilets ? `${item.toilets} WC` : '--'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
