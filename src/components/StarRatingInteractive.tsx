import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { doc, updateDoc, increment, db } from '../firebase';

interface StarRatingInteractiveProps {
  collectionName: 'products' | 'projects' | 'news';
  documentId: string;
  baseRating: number;
  baseReviewCount: number;
  userTotalRating: number;
  userReviewCount: number;
}

export default function StarRatingInteractive({
  collectionName,
  documentId,
  baseRating,
  baseReviewCount,
  userTotalRating,
  userReviewCount,
}: StarRatingInteractiveProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const [hasRated, setHasRated] = useState(() => {
    return localStorage.getItem(`rated_${collectionName}_${documentId}`) === 'true';
  });

  const rawBaseRating = baseRating || 5;
  const rawBaseCount = baseReviewCount || 0;
  const totalStars = rawBaseRating * rawBaseCount + (userTotalRating || 0);
  const totalCount = rawBaseCount + (userReviewCount || 0);
  
  const currentAvg = totalCount === 0 ? rawBaseRating : totalStars / totalCount;
  
  const handleRate = async (rating: number) => {
    if (hasRated) return;

    try {
      const docRef = doc(db, collectionName, documentId);
      await updateDoc(docRef, {
        userTotalRating: increment(rating),
        userReviewCount: increment(1)
      });
      localStorage.setItem(`rated_${collectionName}_${documentId}`, 'true');
      setHasRated(true);
    } catch (error) {
      console.error("Lỗi khi gửi đánh giá:", error);
    }
  };

  return (
    <div className="flex flex-col items-start pt-[10px] pb-[5px] border-t border-slate-800/60 border-b">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-xs text-slate-400 font-medium whitespace-nowrap hidden sm:block">
          Đánh giá bài viết
        </div>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={16}
              className={`cursor-pointer transition-colors ${
                (hoverRating || currentAvg) >= star 
                  ? "text-amber-500 fill-amber-500" 
                  : "text-slate-800 fill-slate-800 hover:text-amber-500 hover:fill-amber-500"
              } ${hasRated ? 'opacity-50 cursor-not-allowed' : ''}`}
              onMouseEnter={() => !hasRated && setHoverRating(star)}
              onMouseLeave={() => !hasRated && setHoverRating(0)}
              onClick={() => handleRate(star)}
            />
          ))}
        </div>
        <div className="text-[11px] text-slate-300 font-medium flex items-center space-x-1 border-l border-slate-700/50 pl-3">
          <span className="text-white bg-amber-500/10 text-amber-500 pr-1.5 rounded font-bold text-[10px] mr-1 py-[1px] pl-[6px]">{currentAvg.toFixed(1)}</span>
          <span className="text-slate-500">/ 5</span>
          <span className="text-slate-500 ml-1">({totalCount} đánh giá)</span>
        </div>
      </div>
      {hasRated && (
        <span className="text-[10px] text-amber-500/80 mt-2 sm:ml-28">
          Cảm ơn bạn đã gửi đánh giá!
        </span>
      )}
    </div>
  );
}
