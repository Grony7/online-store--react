import React, { FC } from 'react';
import cn from 'classnames';
import { IReview } from '../../interfaces/reviews.interface';
import styles from './ReviewsStats.module.scss';

interface ReviewsStatsProps {
  reviews: IReview[];
  reviewsStats?: { averageRating: number; reviewCount: number; ratingDistribution?: Record<number, number> } | null;
  generateStatsFromReviews: (reviews: IReview[]) => { averageRating: number; reviewCount: number; ratingDistribution: Record<number, number> };
  className?: string;
}

const ReviewsStats: FC<ReviewsStatsProps> = ({
  reviews,
  reviewsStats,
  generateStatsFromReviews,
  className
}) => {
  if (!reviewsStats && reviews.length === 0) {
    return null;
  }

  return (
    <div className={cn(styles.reviewsStatsSidebar, className)}>
      <div className={styles.statsHeader}>
        <div className={styles.overallRating}>
          <div className={styles.stars}>
            {Array.from({ length: 5 }).map((_, index) => {
              const rating = reviewsStats 
                ? reviewsStats.averageRating 
                : generateStatsFromReviews(reviews)?.averageRating || 0;
              return (
                <svg
                  key={index}
                  width="24"
                  height="24"
                  viewBox="0 0 16 16"
                  fill={index < Math.round(rating) ? '#EBBA1A' : 'none'}
                  stroke={index < Math.round(rating) ? 'none' : '#C4C4C4'}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M8 1L10.163 5.27926L15 6.11852L11.5 9.41574L12.326 14L8 11.7793L3.674 14L4.5 9.41574L1 6.11852L5.837 5.27926L8 1Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              );
            })}
          </div>
          <div>
            <span className={styles.ratingNumber}>
              {reviewsStats 
                ? reviewsStats.averageRating.toFixed(1) 
                : generateStatsFromReviews(reviews)?.averageRating.toFixed(1) || '0.0'
              }
            </span>
            <span className={styles.ratingMax}> / 5</span>
          </div>
        </div>
        <div className={styles.statsDescription}>
          Рейтинг формируется на основе актуальных отзывов
        </div>
      </div>
      
      {((reviewsStats && reviewsStats.ratingDistribution) || reviews.length > 0) && (
        <div className={styles.ratingDistribution}>
          {[5, 4, 3, 2, 1].map(rating => {
            let count = 0;
            let totalReviews = 0;
            
            if (reviewsStats && reviewsStats.ratingDistribution) {
              count = reviewsStats.ratingDistribution[rating] || 0;
              totalReviews = reviewsStats.reviewCount;
            } else if (reviews.length > 0) {
              count = reviews.filter(r => r.rating === rating).length;
              totalReviews = reviews.length;
            }
            
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            
            return (
              <div key={rating} className={styles.ratingRow}>
                <div className={styles.ratingLabel}>
                  {rating} звезд{rating === 1 ? 'а' : rating < 5 ? 'ы' : ''}
                </div>
                <div className={styles.ratingBar}>
                  <div 
                    className={styles.ratingFill} 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className={styles.ratingCount}>{count}</div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className={styles.statsFooter}>
        Отзывы могут оставлять только те, кто купил товар. Так мы формируем честный рейтинг
      </div>
    </div>
  );
};

export default ReviewsStats; 