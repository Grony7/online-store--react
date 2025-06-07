import { FC, HTMLAttributes } from 'react';
import cn from 'classnames';
import { IReview } from '../../interfaces/reviews.interface';
import ReviewItem from './ReviewItem';
import ReviewsStats from './ReviewsStats';
import styles from './ProductReviews.module.scss';

interface ProductReviewsProps extends HTMLAttributes<HTMLDivElement> {
  reviews: IReview[];
  reviewsLoading: boolean;
  reviewsError: string | null;
  reviewsStats?: { averageRating: number; reviewCount: number; ratingDistribution?: Record<number, number> } | null;
  expandedReviews: Set<number>;
  onToggleReviewExpanded: (reviewId: number) => void;
  onOpenReviewLightbox: (reviews: IReview[], reviewId: number, mediaIndex: number) => void;
  onCreateReview: () => void;
  onEditReview: (review: IReview) => void;
  onDeleteReview: (reviewId: number) => void;
  onLoadMoreReviews: () => void;
  hasMoreReviews: boolean;
  loadingMoreReviews: boolean;
  currentUserId?: number | null;
  isAuthenticated: boolean;
  generateStatsFromReviews: (reviews: IReview[]) => { averageRating: number; reviewCount: number; ratingDistribution: Record<number, number> };
}

const ProductReviews: FC<ProductReviewsProps> = ({
  reviews,
  reviewsLoading,
  reviewsError,
  reviewsStats,
  expandedReviews,
  onToggleReviewExpanded,
  onOpenReviewLightbox,
  onCreateReview,
  onEditReview,
  onDeleteReview,
  onLoadMoreReviews,
  hasMoreReviews,
  loadingMoreReviews,
  currentUserId,
  isAuthenticated,
  generateStatsFromReviews,
  className,
  ...props
}) => {
  return (
    <div className={cn(styles.reviews, className)} {...props}>
      <div className={styles.reviewsHeader}>  
        <h2 className={styles.reviewsTitle}>Отзывы покупателей</h2>
        {isAuthenticated && (
          <button 
            className={styles.createReviewButton}
            onClick={onCreateReview}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Написать отзыв
          </button>
        )}
      </div>
      
      {reviewsLoading ? (
        <div className={styles.reviewsLoading}>Загрузка отзывов...</div>
      ) : reviewsError ? (
        <div className={styles.reviewsError}>{reviewsError}</div>
      ) : reviews.length > 0 ? (
        <div className={styles.reviewsContainer}>
          {/* Список отзывов */}
          <div className={styles.reviewsList}>
            {reviews.map(review => (
              <ReviewItem
                key={review.id}
                review={review}
                isExpanded={expandedReviews.has(review.id)}
                onToggleExpanded={onToggleReviewExpanded}
                onMediaClick={onOpenReviewLightbox}
                onEdit={onEditReview}
                onDelete={onDeleteReview}
                canEdit={currentUserId === review.user.id}
                canDelete={currentUserId === review.user.id}
              />
            ))}
            
            {/* Кнопка "Загрузить еще" */}
            {hasMoreReviews && (
              <div className={styles.loadMoreContainer}>
                <button
                  className={styles.loadMoreButton}
                  onClick={onLoadMoreReviews}
                  disabled={loadingMoreReviews}
                >
                  {loadingMoreReviews ? (
                    <>
                      <div className={styles.loadMoreSpinner}></div>
                      Загрузка...
                    </>
                  ) : (
                    'Загрузить еще'
                  )}
                </button>
              </div>
            )}
          </div>
          
          {/* Статистика рейтингов справа */}
          {(reviewsStats || reviews.length > 0) && (
            <ReviewsStats
              reviews={reviews}
              reviewsStats={reviewsStats}
              generateStatsFromReviews={generateStatsFromReviews}
            />
          )}
        </div>
      ) : (
        <div className={styles.noReviews}>
          <p>Пока нет отзывов о данном товаре</p>
          <p>Станьте первым, кто оставит отзыв!</p>
          {isAuthenticated && (
            <button 
              className={styles.firstReviewButton}
              onClick={onCreateReview}
            >
              Написать первый отзыв
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductReviews; 