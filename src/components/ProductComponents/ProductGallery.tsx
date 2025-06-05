import React, { FC, useRef, useCallback, useEffect, useState } from 'react';
import cn from 'classnames';
import noImage from '../../assets/no-image.svg';
import { IProductDetail } from '../../interfaces/product-detail.interface';
import styles from './ProductGallery.module.scss';

interface ProductGalleryProps {
  product: IProductDetail;
  currentImage: string;
  onImageClick: (url: string) => void;
  onMainImageClick: () => void;
  selectedColor?: number | null;
  className?: string;
}

const ProductGallery: FC<ProductGalleryProps> = ({
  product,
  currentImage,
  onImageClick,
  onMainImageClick,
  selectedColor,
  className
}) => {
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const [videoThumbnails, setVideoThumbnails] = useState<Map<string, string>>(new Map());

  // Функция для создания превью из видео
  const generateVideoThumbnail = useCallback(async (videoUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.crossOrigin = 'anonymous';
      video.currentTime = 1;
      video.muted = true;
      
      video.onloadeddata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
          resolve(thumbnail);
        } else {
          resolve('');
        }
      };
      
      video.onerror = () => {
        resolve('');
      };
      
      video.load();
    });
  }, []);

  // Загружаем превью для видео
  useEffect(() => {
    const loadThumbnails = async () => {
      const thumbnailsMap = new Map<string, string>();
      
      // Обрабатываем основные видео товара
      if (product.videos && product.videos.length > 0) {
        for (const video of product.videos) {
          const videoUrl = `${import.meta.env.VITE_API_URL}${video.url}`;
          const thumbnail = await generateVideoThumbnail(videoUrl);
          if (thumbnail) {
            thumbnailsMap.set(video.url, thumbnail);
          }
        }
      }
      
      // Обрабатываем видео из variantColors
      if (product.variantColors) {
        for (const variant of product.variantColors) {
          if (variant.videos) {
            for (const videoUrl of variant.videos) {
              const fullVideoUrl = `${import.meta.env.VITE_API_URL}${videoUrl}`;
              const thumbnail = await generateVideoThumbnail(fullVideoUrl);
              if (thumbnail) {
                thumbnailsMap.set(videoUrl, thumbnail);
              }
            }
          }
        }
      }
      
      setVideoThumbnails(thumbnailsMap);
    };
    
    if ((product.videos && product.videos.length > 0) || 
        (product.variantColors && product.variantColors.some(v => v.videos && v.videos.length > 0))) {
      loadThumbnails();
    }
  }, [product.videos, product.variantColors, generateVideoThumbnail]);

  // Функция для определения типа URL (видео или изображение)
  const isVideoUrl = (url: string): boolean => {
    const videoExtensions = ['.mp4', '.webm', '.ogg'];
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
  };

  const scrollThumbnailsLeft = () => {
    if (thumbnailsRef.current) {
      thumbnailsRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollThumbnailsRight = () => {
    if (thumbnailsRef.current) {
      thumbnailsRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className={cn(styles.gallery, className)}>
      <div 
        className={cn(styles.mainImage, {
          [styles.videoMain]: currentImage && isVideoUrl(currentImage)
        })}
        onClick={onMainImageClick}
      >
        {currentImage && isVideoUrl(currentImage) ? (
          <video 
            src={currentImage}
            controls
            autoPlay
            muted
            loop
            className={styles.videoPlayer}
          />
        ) : (
          <img
            src={currentImage || noImage}
            alt={product.title}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = noImage;
            }}
          />
        )}
      </div>
      
      {/* Галерея миниатюр - изображения и видео */}
      <div className={styles.thumbnailsContainer}>
        <button className={styles.thumbnailScrollButton} onClick={scrollThumbnailsLeft} aria-label="Прокрутить влево">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18l-6-6 6-6" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        <div 
          className={styles.thumbnails} 
          ref={thumbnailsRef}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            
            if (x < 40) {
              scrollThumbnailsLeft();
            } else if (x > rect.width - 40) {
              scrollThumbnailsRight();
            }
          }}
        >
          {/* Миниатюры изображений */}
          {product.images && product.images.length > 0 && (
            product.images.map((image, index) => (
              <div
                key={image.id || `img-${index}`}
                className={cn(styles.thumbnail, {
                  [styles.active]: currentImage === `${import.meta.env.VITE_API_URL}${image.url}`
                })}
                onClick={() => onImageClick(image.url)}
              >
                <img
                  src={`${import.meta.env.VITE_API_URL}${image.url}`}
                  alt={`${product.title} ${index + 1}`}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = noImage;
                  }}
                />
              </div>
            ))
          )}
          
          {/* Изображения из вариантов цветов */}
          {product.variantColors && selectedColor && product.variantColors
            .filter(variant => variant.id === selectedColor)
            .map((variant) => (
              <React.Fragment key={`variant-${variant.id}`}>
                {/* Основное изображение варианта */}
                {variant.image && (
                  <div
                    key={`variant-img-${variant.id}`}
                    className={cn(styles.thumbnail, {
                      [styles.active]: currentImage === (variant.image.startsWith('http') ? variant.image : `${import.meta.env.VITE_API_URL}${variant.image}`)
                    })}
                    onClick={() => variant.image && onImageClick(variant.image)}
                  >
                    <img
                      src={variant.image.startsWith('http') ? variant.image : `${import.meta.env.VITE_API_URL}${variant.image}`}
                      alt={`${product.title} ${variant.color.name}`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = noImage;
                      }}
                    />
                    <div className={styles.colorBadge} style={{ backgroundColor: variant.color.hex }}>
                      {variant.color.name}
                    </div>
                  </div>
                )}
                
                {/* Дополнительные изображения варианта */}
                {variant.images && variant.images.map((imageUrl, imgIndex) => (
                  imageUrl ? (
                    <div
                      key={`variant-${variant.id}-img-${imgIndex}`}
                      className={cn(styles.thumbnail, {
                        [styles.active]: currentImage === (imageUrl.startsWith('http') ? imageUrl : `${import.meta.env.VITE_API_URL}${imageUrl}`)
                      })}
                      onClick={() => onImageClick(imageUrl)}
                    >
                      <img
                        src={imageUrl.startsWith('http') ? imageUrl : `${import.meta.env.VITE_API_URL}${imageUrl}`}
                        alt={`${product.title} ${variant.color.name} ${imgIndex + 1}`}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = noImage;
                        }}
                      />
                      <div className={styles.colorBadge} style={{ backgroundColor: variant.color.hex }}>
                        {variant.color.name}
                      </div>
                    </div>
                  ) : null
                ))}
              </React.Fragment>
            ))}
          
          {/* Миниатюры видео */}
          {product.videos && product.videos.length > 0 && (
            product.videos.map((video, index) => (
              <div
                key={video.id || `video-${index}`}
                className={cn(styles.thumbnail, styles.videoThumbnailWrapper, {
                  [styles.active]: currentImage === `${import.meta.env.VITE_API_URL}${video.url}`
                })}
                onClick={() => onImageClick(video.url)}
              >
                <div className={styles.videoThumbnail}>
                  {videoThumbnails.get(video.url) ? (
                    <img 
                      src={videoThumbnails.get(video.url)}
                      alt={`${product.title} видео ${index + 1}`}
                    />
                  ) : (
                    <img 
                      src={video.thumbnail 
                        ? `${import.meta.env.VITE_API_URL}${video.thumbnail}` 
                        : product.images.length > 0 
                          ? `${import.meta.env.VITE_API_URL}${product.images[0].url}` 
                          : noImage
                      }
                      alt={`${product.title} видео ${index + 1}`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = noImage;
                      }}
                    />
                  )}
                  <div className={styles.videoIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" fill="rgba(0, 0, 0, 0.5)" stroke="white" strokeWidth="1.5"/>
                      <path d="M10 8L16 12L10 16V8Z" fill="white" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {/* Видео из вариантов цветов */}
          {product.variantColors && selectedColor && product.variantColors
            .filter(variant => variant.id === selectedColor)
            .map((variant) => (
              <React.Fragment key={`variant-videos-${variant.id}`}>
                {variant.videos && variant.videos.map((videoUrl, videoIndex) => (
                  videoUrl ? (
                    <div
                      key={`variant-${variant.id}-video-${videoIndex}`}
                      className={cn(styles.thumbnail, styles.videoThumbnailWrapper, {
                        [styles.active]: currentImage === `${import.meta.env.VITE_API_URL}${videoUrl}`
                      })}
                      onClick={() => onImageClick(videoUrl)}
                    >
                      <div className={styles.videoThumbnail}>
                        {videoThumbnails.get(videoUrl) ? (
                          <img 
                            src={videoThumbnails.get(videoUrl)}
                            alt={`${product.title} ${variant.color.name} видео ${videoIndex + 1}`}
                          />
                        ) : (
                          <img 
                            src={variant.image 
                              ? `${import.meta.env.VITE_API_URL}${variant.image}`
                              : product.images.length > 0 
                                ? `${import.meta.env.VITE_API_URL}${product.images[0].url}` 
                                : noImage
                            }
                            alt={`${product.title} ${variant.color.name} видео ${videoIndex + 1}`}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = noImage;
                            }}
                          />
                        )}
                        <div className={styles.videoIcon}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" fill="rgba(0, 0, 0, 0.5)" stroke="white" strokeWidth="1.5"/>
                            <path d="M10 8L16 12L10 16V8Z" fill="white" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div className={styles.colorBadge} style={{ backgroundColor: variant.color.hex }}>
                          {variant.color.name}
                        </div>
                      </div>
                    </div>
                  ) : null
                ))}
              </React.Fragment>
            ))}
        </div>
        
        <button className={styles.thumbnailScrollButton} onClick={scrollThumbnailsRight} aria-label="Прокрутить вправо">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18l6-6-6-6" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ProductGallery; 