import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { recordContentEngagement } from '../lib/engagement';

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
  const [hasRated, setHasRated] = useState(false);
  const [ratingTotal, setRatingTotal] = useState(userTotalRating || 0);
  const [ratingCount, setRatingCount] = useState(userReviewCount || 0);

  useEffect(() => {
    setHasRated(localStorage.getItem(`rated_${collectionName}_${documentId}`) === 'true');
  }, [collectionName, documentId]);

  useEffect(() => {
    setRatingTotal(userTotalRating || 0);
    setRatingCount(userReviewCount || 0);
  }, [documentId, userReviewCount, userTotalRating]);

  const rawBaseRating = baseRating || 5;
  const rawBaseCount = baseReviewCount || 0;
  const totalStars = rawBaseRating * rawBaseCount + ratingTotal;
  const totalCount = rawBaseCount + ratingCount;
  
  const currentAvg = totalCount === 0 ? rawBaseRating : totalStars / totalCount;
  
  const handleRate = async (rating: number) => {
    if (hasRated) return;

    try {
      const result = await recordContentEngagement({
        table: collectionName,
        id: documentId,
        action: "rating",
        value: rating,
      });
      setRatingTotal(result.userTotalRating);
      setRatingCount(result.userReviewCount);
      localStorage.setItem(`rated_${collectionName}_${documentId}`, 'true');
      setHasRated(true);
    } catch (error) {
      console.error("Lỗi khi gửi đánh giá:", error);
    }
  };

  return (
    <div className="flex flex-col items-start pt-[10px] pb-[5px] border-t border-border-color/60 border-b">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-xs text-text-secondary font-medium whitespace-nowrap hidden sm:block">
          Đánh giá bài viết
        </div>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={16}
              className={`cursor-pointer transition-colors ${
                (hoverRating || currentAvg) >= star 
                  ? "text-primary fill-yellow-500" 
                  : "text-zinc-800 fill-zinc-800 hover:text-primary hover:fill-yellow-500"
              } ${hasRated ? 'opacity-50 cursor-not-allowed' : ''}`}
              onMouseEnter={() => !hasRated && setHoverRating(star)}
              onMouseLeave={() => !hasRated && setHoverRating(0)}
              onClick={() => handleRate(star)}
            />
          ))}
        </div>
        <div className="text-[11px] text-text-secondary font-medium flex items-center space-x-1 border-l border-border-inverse/50 pl-3">
          <span className="text-text-primary bg-[#064E3B]/10 text-primary pr-1.5 rounded font-bold text-[10px] mr-1 py-[1px] pl-[6px]">{currentAvg.toFixed(1)}</span>
          <span className="text-white/70">/ 5</span>
          <span className="text-white/70 ml-1">({totalCount} đánh giá)</span>
        </div>
      </div>
      {hasRated && (
        <span className="text-[10px] text-primary/80 mt-2 sm:ml-28">
          Cảm ơn bạn đã gửi đánh giá!
        </span>
      )}
    </div>
  );
}
