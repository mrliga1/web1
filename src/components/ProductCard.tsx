import React, { useState, useEffect } from 'react';
import { Product, RouteState } from '../types';
import { MapPin, Tag, Layers, Bookmark, Bath, Heart } from 'lucide-react';
import { generateSlug, optimizeImageUrl, generateSrcSet } from '../lib/utils';

interface ProductCardProps {
  key?: React.Key;
  item: Product;
  onNavigate: (route: RouteState) => void;
  badgeText?: string;
  badgeColor?: string;
  priority?: boolean;
}

export default function ProductCard({ item, onNavigate, badgeText, badgeColor, priority = false }: ProductCardProps) {
  const displayBadgeText = badgeText || (item.type === 'rent' ? 'Cho thuê' : 'Bán');
  const displayBadgeColor = badgeColor || (item.type === 'rent' ? 'bg-primary text-white' : 'bg-rose-700 text-white');
  let safeImageUrl = item.imageUrl || (item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls[0] : '/no-image.svg');
  if (safeImageUrl.includes('images.unsplash.com')) {
    if (!safeImageUrl.includes('?')) {
      safeImageUrl += '?auto=format&fit=crop&w=400&q=70';
    } else if (!safeImageUrl.includes('&w=')) {
      safeImageUrl += '&w=400&q=70';
    }
  }
  safeImageUrl = optimizeImageUrl(safeImageUrl, 400);

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
      className="w-full shrink-0 bg-bg-surface hover:bg-bg-base border border-border-color hover:border-primary/30 rounded-lg overflow-hidden group hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-row sm:flex-col"
    >
      <div className="relative w-[90px] h-[90px] sm:h-auto shrink-0 sm:w-full sm:aspect-[4/3] overflow-hidden bg-bg-base flex items-center justify-center">
        <img 
          src={safeImageUrl || undefined}
          srcSet={generateSrcSet(item.imageUrl || (item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls[0] : null))}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
          alt={item.title || 'Product'} 
          width="400"
          height="300"
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          className={`w-full h-full sm:h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-[1.03] group-hover:rotate-1 ${priority ? '' : 'animate-fade-in duration-700'}`}
          referrerPolicy="no-referrer" 
          onError={(e) => { e.currentTarget.onerror = null;
            (e.target as HTMLImageElement).src = '/no-image.svg';
          }}
        />
        <div className={`absolute top-0 left-0 text-[10px] font-semibold px-[8px] py-[4px] rounded-br-[5px] z-10 ${displayBadgeColor}`}>
          {displayBadgeText.replace('undefined', '0')}
        </div>
        <button
          onClick={toggleFavorite}
          aria-label={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
          className={`absolute top-0 right-0 sm:top-2 sm:right-2 z-20 w-8 h-8 sm:w-8 sm:h-8 flex items-center justify-center rounded-full backdrop-blur-md border transition-colors shadow-sm ${isFavorite ? 'bg-primary text-text-inverse border-primary' : 'bg-white/90 text-text-secondary border-transparent hover:text-rose-600 hover:bg-white'}`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>
      <div className="px-[12px] py-1 sm:p-[15px] flex-1 flex flex-col justify-center">
        <h3 className="font-semibold text-[13px] sm:text-[14px] text-text-primary group-hover:text-primary line-clamp-2 leading-[1.4] transition-colors pt-[2px] sm:pt-0 mb-[2px] sm:mb-[10px] sm:min-h-[40px] font-playfair tracking-wide">
          {item.title}
        </h3>
        <div className="flex items-center gap-[5px] text-[12px] text-text-secondary mb-[4px] sm:mb-[2px]">
          <MapPin className="w-3 h-3 text-primary shrink-0" />
          <span className="truncate text-[10px]">{item.street ? `${item.street}, ` : ''}{item.district}</span>
        </div>
        
        <div className="pt-[4px] sm:pt-[10px] border-t border-dashed border-border-color mt-auto">
          <div className="flex items-center justify-between mb-[3px] sm:mb-[5px]">
            <span className="font-bold text-[14px] text-primary truncate">{item.priceText || 'Đang cập nhật'}</span>
          </div>
          <div className="flex flex-wrap items-center gap-[8px] sm:gap-[10px] text-[10px] sm:text-[11px] text-text-secondary">
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
