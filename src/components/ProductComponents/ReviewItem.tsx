import { HTMLAttributes} from 'react';
import cn from 'classnames';
import { IReview } from '../../interfaces/reviews.interface';
import noImage from '../../assets/no-image.svg';
import styles from './ReviewItem.module.scss';

interface ReviewItemProps extends HTMLAttributes<HTMLDivElement> {
  review: IReview;
  isExpanded: boolean;
  onToggleExpanded: (reviewId: number) => void;
  onMediaClick: (reviews: IReview[], reviewId: number, mediaIndex: number) => void;
  onEdit?: (review: IReview) => void;
  onDelete?: (reviewId: number) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const ReviewItem = ({
  review,
  isExpanded,
  onToggleExpanded,
  onMediaClick,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
  className,
  ...props
}: ReviewItemProps) => {
  return (
    <div className={cn(styles.review, className)} {...props} >
      <div className={styles.reviewHeader}>
        <div className={styles.reviewUser}>
          {review.user.avatar ? (
            <img 
              src={`${import.meta.env.VITE_API_URL}${review.user.avatar.url}`}
              alt={review.user.username}
              className={styles.reviewUserAvatar}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className={styles.reviewUserAvatarPlaceholder}>
              {review.user.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className={styles.reviewUserInfo}>
            <span className={styles.reviewUserName}>{review.user.username}</span>
            <span className={styles.reviewDate}>
              {new Date(review.createdAt).toLocaleDateString('ru-RU')}
            </span>
          </div>
        </div>
        
        <div className={styles.reviewHeaderActions}>
          <div className={styles.reviewRating}>
            {Array.from({ length: 5 }).map((_, index) => (
              <svg
                key={index}
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill={index < review.rating ? '#EBBA1A' : 'none'}
                stroke={index < review.rating ? 'none' : '#C4C4C4'}
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M8 1L10.163 5.27926L15 6.11852L11.5 9.41574L12.326 14L8 11.7793L3.674 14L4.5 9.41574L1 6.11852L5.837 5.27926L8 1Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ))}
          </div>
          
          {/* Кнопки управления отзывом */}
          {(canEdit || canDelete) && (
            <div className={styles.reviewActions}>
              {canEdit && onEdit && (
                <button
                  className={styles.editButton}
                  onClick={() => onEdit(review)}
                  title="Редактировать отзыв"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.43739 22.1213 4.00001C22.1213 4.56264 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
              
              {canDelete && onDelete && (
                <button
                  className={styles.deleteButton}
                  onClick={() => onDelete(review.id)}
                  title="Удалить отзыв"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Информация о варианте товара */}
      {review.variant && (
        <div className={styles.reviewVariant}>
          {review.variant.color && (
            <span className={styles.variantItem}>
              <span className={styles.variantLabel}>Цвет товара:</span> {review.variant.color}
            </span>
          )}
          {review.variant.size && (
            <span className={styles.variantItem}>
              <span className={styles.variantLabel}>Размер:</span> {review.variant.size}
            </span>
          )}
          {Object.entries(review.variant).map(([key, value]) => {
            if (key !== 'color' && key !== 'size' && value) {
              return (
                <span key={key} className={styles.variantItem}>
                  <span className={styles.variantLabel}>{key}:</span> {value}
                </span>
              );
            }
            return null;
          })}
        </div>
      )}
      
      {review.comment && (
        <>
          <div className={cn(styles.reviewComment, {
            [styles.truncated]: !isExpanded && review.comment.length > 200
          })}>
            {isExpanded || review.comment.length <= 200 
              ? review.comment 
              : `${review.comment.slice(0, 200)}...`
            }
          </div>
          {review.comment.length > 200 && (
            <button 
              className={styles.readMoreButton}
              onClick={() => onToggleExpanded(review.id)}
            >
              {isExpanded ? 'Скрыть' : 'Читать полностью'}
            </button>
          )}
        </>
      )}
      
      {review.media && review.media.length > 0 && (
        <div className={styles.reviewMedia}>
          {review.media.map((media, index) => (
            <div 
              key={media.id || `media-${index}`}
              className={cn(styles.reviewMediaItem, {
                [styles.reviewVideoItem]: media.type === 'video'
              })}
              onClick={() => onMediaClick([review], review.id, index)}
            >
              {media.type === 'image' ? (
                <img
                  src={`${import.meta.env.VITE_API_URL}${media.url}`}
                  alt="Фото отзыва"
                  className={styles.reviewImage}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = noImage;
                  }}
                />
              ) : (
                <video
                  src={`${import.meta.env.VITE_API_URL}${media.url}`}
                  className={styles.reviewVideo}
                  poster={media.thumbnail ? `${import.meta.env.VITE_API_URL}${media.thumbnail}` : undefined}
                  muted
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewItem; 