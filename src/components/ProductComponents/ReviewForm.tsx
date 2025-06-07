import React, { FC, useState, useEffect, useRef } from 'react';
import cn from 'classnames';
import { IReview } from '../../interfaces/reviews.interface';
import styles from './ReviewForm.module.scss';

interface ReviewFormProps {
  existingReview?: IReview | null;
  isEditing?: boolean;
  isVisible: boolean;
  onSubmit: (data: ReviewFormData) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

export interface ReviewFormData {
  rating: number;
  comment: string;
  media?: File[];
}

const ReviewForm: FC<ReviewFormProps> = ({
  existingReview,
  isEditing = false,
  isVisible,
  onSubmit,
  onCancel,
  className
}) => {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [media, setMedia] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Заполняем форму данными существующего отзыва при редактировании
  useEffect(() => {
    if (isEditing && existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment || '');
      setMedia([]);
    } else {
      setRating(0);
      setComment('');
      setMedia([]);
    }
    setError(null);
  }, [isEditing, existingReview, isVisible]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Пожалуйста, поставьте оценку');
      return;
    }

    if (comment.trim().length === 0) {
      setError('Пожалуйста, напишите отзыв');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        rating,
        comment: comment.trim(),
        media
      });
      
      // Сбрасываем форму после успешной отправки
      if (!isEditing) {
        setRating(0);
        setComment('');
        setMedia([]);
      }
    } catch (err) {
      console.error('Ошибка при отправке отзыва:', err);
      setError('Не удалось отправить отзыв. Попробуйте еще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const files = Array.from(e.target.files || []);
    
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      
      // Расширенная поддержка видео форматов
      const videoTypes = [
        'video/mp4',
        'video/webm',
        'video/ogg',
        'video/avi',
        'video/mov',
        'video/wmv',
        'video/quicktime',
        'video/x-msvideo'
      ];
      const isVideo = file.type.startsWith('video/') || videoTypes.includes(file.type);
      
      // Также проверяем по расширению файла как fallback
      const fileName = file.name.toLowerCase();
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.qt', '.mkv', '.flv', '.3gp'];
      const hasVideoExtension = videoExtensions.some(ext => fileName.endsWith(ext));
      
      // Если MIME type пустой или неопределенный, определяем по расширению
      const isEmpty = !file.type || file.type === '' || file.type === 'application/octet-stream';
      
      const isVideoFile = isVideo || hasVideoExtension;
      
      // Разные лимиты для изображений и видео
      const maxImageSize = 10 * 1024 * 1024; // 10MB для изображений
      const maxVideoSize = 1024 * 1024 * 1024; // 1GB для видео
      const maxSize = isVideoFile ? maxVideoSize : maxImageSize;
      
      const isValidSize = file.size <= maxSize;
      
      // Дополнительная проверка для файлов с неопределенным MIME type
      let isValidFile;
      if (isEmpty && hasVideoExtension) {
        isValidFile = isValidSize;
      } else {
        isValidFile = (isImage || isVideoFile) && isValidSize;
      }
      
      return isValidFile;
    });
    
    setMedia(prev => {
      const newMedia = [...prev, ...validFiles].slice(0, 5); // Максимум 5 файлов
      return newMedia;
    });
    
    // Сбрасываем значение input для возможности повторного выбора тех же файлов
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={cn(styles.reviewForm, className)}>
      <div className={styles.formOverlay} onClick={onCancel} />
      <div className={styles.formContainer}>
        <div className={styles.formHeader}>
          <h3 className={styles.formTitle}>
            {isEditing ? 'Редактировать отзыв' : 'Оставить отзыв'}
          </h3>
          <button 
            className={styles.closeButton}
            onClick={onCancel}
            type="button"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Рейтинг */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Оценка *</label>
            <div className={styles.ratingInput}>
              {Array.from({ length: 5 }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={cn(styles.starButton, {
                    [styles.active]: index < rating
                  })}
                  onClick={() => setRating(index + 1)}
                >
                  <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
                    <path 
                      d="M8 1L10.163 5.27926L15 6.11852L11.5 9.41574L12.326 14L8 11.7793L3.674 14L4.5 9.41574L1 6.11852L5.837 5.27926L8 1Z" 
                      fill={index < rating ? '#EBBA1A' : 'none'}
                      stroke={index < rating ? 'none' : '#C4C4C4'}
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Комментарий */}
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="comment">Отзыв *</label>
            <textarea
              id="comment"
              className={styles.textarea}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Поделитесь своим мнением о товаре..."
              rows={4}
              maxLength={1000}
            />
            <div className={styles.characterCount}>
              {comment.length}/1000
            </div>
          </div>

          {/* Медиа файлы */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Фото и видео</label>
            <div className={styles.mediaUpload}>
              <input
                type="file"
                id="media"
                className={styles.fileInput}
                multiple
                accept="image/*,video/*,.mp4,.webm,.ogg,.avi,.mov,.wmv,.mkv,.flv,.3gp"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
              <label 
                htmlFor="media" 
                className={styles.uploadButton}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Добавить фото/видео
              </label>
              <div className={styles.uploadHint}>
                Максимум 5 файлов. Изображения: до 10 МБ, видео: до 1 ГБ
              </div>
            </div>

            {/* Предпросмотр загруженных файлов */}
            {media.length > 0 && (
              <div className={styles.mediaPreview}>
                {media.map((file, index) => {
                  const isImageFile = file.type.startsWith('image/');
                  const isVideoFile = file.type.startsWith('video/') || 
                    ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.qt'].some(ext => 
                      file.name.toLowerCase().endsWith(ext)
                    );
                  
                  const fileUrl = URL.createObjectURL(file);
                  
                  return (
                    <div key={`${file.name}-${file.size}-${index}`} className={styles.mediaItem}>
                      {isImageFile ? (
                        <img
                          src={fileUrl}
                          alt={`Предпросмотр ${file.name}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : isVideoFile ? (
                        <video
                          src={fileUrl}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          controls
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '12px' }}>
                          Неизвестный тип файла
                        </div>
                      )}
                      <button
                        type="button"
                        className={styles.removeFileButton}
                        onClick={() => removeFile(index)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ошибка */}
          {error && (
            <div className={styles.error}>{error}</div>
          )}

          {/* Кнопки */}
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting || rating === 0 || comment.trim().length === 0}
            >
              {isSubmitting ? (
                <span className={styles.loader}></span>
              ) : (
                isEditing ? 'Сохранить' : 'Опубликовать'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewForm; 