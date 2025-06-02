import { FC, useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import cn from 'classnames';
import styles from './ProductDetail.module.scss';
import { ProductDetailProps } from './ProductDetail.props';
import { IProductDetail, IProductDetailResponse, VariantColor } from '../../interfaces/product-detail.interface';
import { IReviewsResponse, IReview } from '../../interfaces/reviews.interface';
import noImage from '../../assets/no-image.svg';
import { useDispatch } from 'react-redux';
import { cartActions } from '../../store/cart.slice';
import FavoritesButton from '../../components/FavoritesButton/FavoritesButton';
import { IProduct } from '../../interfaces/products.interface';
// Импортируем компоненты лайтбокса
import Lightbox from 'yet-another-react-lightbox';
import Video from 'yet-another-react-lightbox/plugins/video';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';

// Переопределяем тип для Render, чтобы добавить поддержку для наших кастомных иконок
declare module 'yet-another-react-lightbox' {
  interface Render {
    iconFullscreen?: () => React.ReactNode;
    iconExitFullscreen?: () => React.ReactNode;
  }
  
  interface FullscreenProps {
    noExit?: boolean;
  }
}

// Типы для лайтбокса
type SlideImage = {
  src: string;
  type: 'image';
};

type SlideVideo = {
  sources: Array<{ src: string; type: string }>;
  type: 'video';
  poster: string;
};

type Slide = SlideImage | SlideVideo;

// Стили для лайтбокса
const lightboxStyles = {
  container: {
    backgroundColor: '#ffffff'
  },
  slide: {
    transition: 'all 0.3s ease'
  },
  button: {
    filter: 'none',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    color: 'black',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.25)'
    }
  },
  navigation: {
    button: {
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      backgroundColor: 'rgba(0, 0, 0, 0.15)',
      color: 'black',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      margin: '0 20px',
      '&:hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        transform: 'scale(1.1)'
      }
    }
  },
  thumbnails: {
    border: '2px solid transparent',
    borderRadius: '8px',
    gap: 10,
    padding: '10px 0',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    '&.yarl__thumbnails_thumbnail_active': {
      border: '2px solid #091D9E'
    }
  }
};

const ProductDetail: FC<ProductDetailProps> = ({ className, ...props }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [product, setProduct] = useState<IProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<VariantColor | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false);
  
  // Состояние для отзывов
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [reviewsStats, setReviewsStats] = useState<{ averageRating: number; reviewCount: number; ratingDistribution?: Record<number, number> } | null>(null);
  
  // Состояние для сворачивания текста отзывов
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set());
  
  // Состояние для лайтбокса
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  
  // Состояние для лайтбокса отзывов
  const [reviewLightboxOpen, setReviewLightboxOpen] = useState<boolean>(false);
  const [reviewLightboxIndex, setReviewLightboxIndex] = useState<number>(0);
  const [reviewLightboxItems, setReviewLightboxItems] = useState<Slide[]>([]);
  
  // Ref для контейнера миниатюр
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  // Состояние для хранения превью видео
  const [videoThumbnails, setVideoThumbnails] = useState<Map<string, string>>(new Map());
  
  // Функция для создания превью из видео
  const generateVideoThumbnail = useCallback(async (videoUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.crossOrigin = 'anonymous';
      video.currentTime = 1; // Взять кадр с 1 секунды
      video.muted = true;
      
      video.onloadeddata = () => {
        // Когда видео загрузилось, берем кадр
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
          resolve(thumbnail);
        } else {
          // Если не удалось создать контекст, возвращаем пустую строку
          resolve('');
        }
      };
      
      video.onerror = () => {
        // Если произошла ошибка, возвращаем пустую строку
        resolve('');
      };
      
      // Форсируем загрузку видео
      video.load();
    });
  }, []);

  // Загружаем превью для видео при инициализации компонента
  useEffect(() => {
    if (product?.videos && product.videos.length > 0) {
      const loadThumbnails = async () => {
        const thumbnailsMap = new Map<string, string>();
        
        for (const video of product.videos) {
          const videoUrl = `${import.meta.env.VITE_API_URL}${video.url}`;
          const thumbnail = await generateVideoThumbnail(videoUrl);
          if (thumbnail) {
            thumbnailsMap.set(video.url, thumbnail);
          }
        }
        
        setVideoThumbnails(thumbnailsMap);
      };
      
      loadThumbnails();
    }
  }, [product?.videos, generateVideoThumbnail]);

  // Функция для определения типа URL (видео или изображение)
  const isVideoUrl = (url: string): boolean => {
    const videoExtensions = ['.mp4', '.webm', '.ogg'];
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
  };

  // Подготавливаем данные для лайтбокса
  const getLightboxItems = (): Slide[] => {
    if (!product) return [];
    
    const imageItems: SlideImage[] = product.images.map(image => ({
      src: `${import.meta.env.VITE_API_URL}${image.url}`,
      type: 'image' as const
    }));
    
    const videoItems: SlideVideo[] = product.videos.map(video => ({
      sources: [
        {
          src: `${import.meta.env.VITE_API_URL}${video.url}`,
          type: 'video/mp4'
        }
      ],
      type: 'video' as const,
      // Используем созданный нами thumbnail из самого видео
      poster: videoThumbnails.get(video.url) || 
        (video.thumbnail ? `${import.meta.env.VITE_API_URL}${video.thumbnail}` : '')
    }));
    
    return [...imageItems, ...videoItems];
  };

  // Открываем лайтбокс и устанавливаем индекс
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Функция для открытия лайтбокса отзывов
  const openReviewLightbox = (reviewMedia: IReview[], selectedReviewId: number, selectedMediaIndex: number) => {
    // Собираем все медиа из всех отзывов
    const allReviewMedia: Slide[] = [];
    let targetIndex = 0;
    let currentIndex = 0;
    
    reviewMedia.forEach((review) => {
      review.media.forEach((media, mediaIndex) => {
        if (review.id === selectedReviewId && mediaIndex === selectedMediaIndex) {
          targetIndex = currentIndex;
        }
        
        if (media.type === 'image') {
          allReviewMedia.push({
            src: `${import.meta.env.VITE_API_URL}${media.url}`,
            type: 'image' as const
          });
        } else if (media.type === 'video') {
          allReviewMedia.push({
            sources: [{
              src: `${import.meta.env.VITE_API_URL}${media.url}`,
              type: 'video/mp4'
            }],
            type: 'video' as const,
            poster: media.thumbnail ? `${import.meta.env.VITE_API_URL}${media.thumbnail}` : ''
          });
        }
        
        currentIndex++;
      });
    });
    
    setReviewLightboxItems(allReviewMedia);
    setReviewLightboxIndex(targetIndex);
    setReviewLightboxOpen(true);
  };

  // Функция для генерации статистики из отзывов, если она не пришла с сервера
  const generateStatsFromReviews = (reviews: IReview[]) => {
    if (reviews.length === 0) return null;
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    const ratingDistribution = {
      1: reviews.filter(r => r.rating === 1).length,
      2: reviews.filter(r => r.rating === 2).length,
      3: reviews.filter(r => r.rating === 3).length,
      4: reviews.filter(r => r.rating === 4).length,
      5: reviews.filter(r => r.rating === 5).length
    };
    
    return {
      averageRating,
      reviewCount: reviews.length,
      ratingDistribution
    };
  };

  // Функция загрузки отзывов
  const fetchReviews = async (productId: string) => {
    setReviewsLoading(true);
    setReviewsError(null);
    try {
      const { data } = await axios.get<IReviewsResponse>(`${import.meta.env.VITE_API_URL}/api/products/${productId}/reviews`);
      console.log('Reviews data:', data);
      setReviews(data.reviews);
      // Если статистика пришла с сервера, используем её, иначе генерируем из отзывов
      if (data.stats) {
        console.log('Using server stats:', data.stats);
        setReviewsStats(data.stats);
      } else {
        console.log('Generating stats from reviews');
        const generatedStats = generateStatsFromReviews(data.reviews);
        console.log('Generated stats:', generatedStats);
        setReviewsStats(generatedStats);
      }
    } catch (error) {
      console.error('Ошибка при загрузке отзывов:', error);
      setReviewsError('Не удалось загрузить отзывы');
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const { data } = await axios.get<IProductDetailResponse>(`${import.meta.env.VITE_API_URL}/api/products/${id}`);
        setProduct(data.data);
        // Устанавливаем первое изображение как текущее или первое видео, если нет изображений
        if (data.data.images && data.data.images.length > 0) {
          setCurrentImage(`${import.meta.env.VITE_API_URL}${data.data.images[0].url}`);
        } else if (data.data.videos && data.data.videos.length > 0) {
          setCurrentImage(`${import.meta.env.VITE_API_URL}${data.data.videos[0].url}`);
        }
        // Устанавливаем первый доступный цвет как выбранный
        if (data.data.variantColors && data.data.variantColors.length > 0) {
          setSelectedColor(data.data.variantColors[0].id);
          setSelectedVariant(data.data.variantColors[0]);
        }
      } catch (error) {
        console.error('Ошибка при загрузке данных о продукте:', error);
        setError('Не удалось загрузить информацию о продукте. Пожалуйста, попробуйте позже.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProduct();
      fetchReviews(id);
    }
  }, [id]);

  const handleImageClick = (url: string) => {
    setCurrentImage(`${import.meta.env.VITE_API_URL}${url}`);
    
    // Определяем индекс для лайтбокса
    const allMedia = [...(product?.images || []), ...(product?.videos || [])];
    const index = allMedia.findIndex(media => media.url === url);
    
    if (index !== -1) {
      openLightbox(index);
    }
  };

  const handleColorSelect = (colorId: number) => {
    setSelectedColor(colorId);
    // Находим выбранный вариант цвета
    const variant = product?.variantColors.find(v => v.id === colorId);
    if (variant) {
      setSelectedVariant(variant);
      // Если у выбранного цвета есть изображение, устанавливаем его как текущее
      if (variant.image) {
        setCurrentImage(`${import.meta.env.VITE_API_URL}${variant.image.url}`);
      } else if (variant.images && variant.images.length > 0) {
        setCurrentImage(`${import.meta.env.VITE_API_URL}${variant.images[0].url}`);
      } else if (variant.videos && variant.videos.length > 0) {
        setCurrentImage(`${import.meta.env.VITE_API_URL}${variant.videos[0].url}`);
      }
    }
  };

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;

    setIsAddingToCart(true);

    // Создаем объект товара для добавления в корзину
    const cartItem = {
      id: product.id,
      colorId: selectedVariant.id,
      count: 1,
      name: product.title,
      price: selectedVariant.price,
      sale_price: selectedVariant.on_sale && selectedVariant.sale_price ? selectedVariant.sale_price : null,
      image: currentImage.replace(`${import.meta.env.VITE_API_URL}`, ''),
      mediaType: isVideoUrl(currentImage) ? 'video' as const : 'image' as const,
      color: {
        name: selectedVariant.color.name,
        hex: selectedVariant.color.hex
      }
    };

    // Добавляем товар в корзину
    dispatch(cartActions.add(cartItem));

    // Имитация загрузки для лучшего UX
    setTimeout(() => {
      setIsAddingToCart(false);
    }, 500);
  };

  const goBack = () => {
    navigate(-1);
  };

  // Функция для прокрутки миниатюр влево
  const scrollThumbnailsLeft = () => {
    if (thumbnailsRef.current) {
      thumbnailsRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  // Функция для прокрутки миниатюр вправо
  const scrollThumbnailsRight = () => {
    if (thumbnailsRef.current) {
      thumbnailsRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Создаем объект IProduct для использования в FavoritesButton
  const getProductForFavorites = (): IProduct => {
    if (!product || !selectedVariant) {
      return {
        id: 0,
        title: '',
        slug: '',
        price: 0,
        sale_price: 0,
        discount_percent: 0,
        inStock: false
      };
    }
    
    const discount_percent = selectedVariant.on_sale && selectedVariant.sale_price && selectedVariant.price > 0
      ? Math.round((1 - selectedVariant.sale_price / selectedVariant.price) * 100)
      : 0;
    
    return {
      id: product.id,
      title: product.title,
      slug: product.slug,
      price: selectedVariant.price,
      sale_price: selectedVariant.sale_price || 0,
      discount_percent,
      inStock: selectedVariant.stock > 0,
      image: product.images.length > 0 ? product.images[0].url : undefined,
      variantColorIds: product.variantColors.map(v => v.id)
    };
  };

  // Функция для переключения развернутости текста отзыва
  const toggleReviewExpanded = (reviewId: number) => {
    setExpandedReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return <div className={cn(styles.wrapper, className)}>Загрузка...</div>;
  }

  if (error || !product) {
    return <div className={cn(styles.wrapper, className)}>{error || 'Продукт не найден'}</div>;
  }

  return (
    <section className={cn(styles.wrapper, className)} {...props}>
      <div className={styles.navigation}>
        <button className={styles.backButton} onClick={goBack}>
          <svg width="8" height="16" viewBox="0 0 8 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 1L1 8L7 15" stroke="#0C0C0C" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className={styles.content}>
        {/* Галерея изображений */}
        <div className={styles.gallery}>
          <div 
            className={cn(styles.mainImage, {
              [styles.videoMain]: currentImage && isVideoUrl(currentImage)
            })}
            onClick={() => {
              if (product) {
                const allMedia = [...product.images, ...product.videos];
                const currentMediaUrl = currentImage.replace(`${import.meta.env.VITE_API_URL}`, '');
                const index = allMedia.findIndex(media => media.url === currentMediaUrl);
                
                if (index !== -1) {
                  openLightbox(index);
                }
              }
            }}
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
                // Обработка клика на псевдоэлементы для прокрутки
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                
                // Если клик был в левой части
                if (x < 40) {
                  scrollThumbnailsLeft();
                }
                // Если клик был в правой части
                else if (x > rect.width - 40) {
                  scrollThumbnailsRight();
                }
              }}
            >
              {/* Миниатюры изображений */}
              {product.images && product.images.length > 0 && (
                product.images.map((image, index) => (
                  <div
                    key={`img-${index}`}
                    className={cn(styles.thumbnail, {
                      [styles.active]: currentImage === `${import.meta.env.VITE_API_URL}${image.url}`
                    })}
                    onClick={() => handleImageClick(image.url)}
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
              
              {/* Миниатюры видео */}
              {product.videos && product.videos.length > 0 && (
                product.videos.map((video, index) => (
                  <div
                    key={`video-${index}`}
                    className={cn(styles.thumbnail, styles.videoThumbnailWrapper, {
                      [styles.active]: currentImage === `${import.meta.env.VITE_API_URL}${video.url}`
                    })}
                    onClick={() => handleImageClick(video.url)}
                  >
                    <div className={styles.videoThumbnail}>
                      {/* Используем превью из самого видео */}
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
            </div>
            
            <button className={styles.thumbnailScrollButton} onClick={scrollThumbnailsRight} aria-label="Прокрутить вправо">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18l6-6-6-6" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Информация о продукте */}
        <div className={styles.info}>
          <h1 className={styles.title}>{product.title}</h1>

          {/* Рейтинг и отзывы */}
          <div className={styles.rating}>
            <div className={styles.stars}>
              {Array.from({ length: 5 }).map((_, index) => (
                <svg
                  key={index}
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill={index < Math.round(product.averageRating || 0) ? '#EBBA1A' : 'none'}
                  stroke={index < Math.round(product.averageRating || 0) ? 'none' : '#C4C4C4'}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M8 1L10.163 5.27926L15 6.11852L11.5 9.41574L12.326 14L8 11.7793L3.674 14L4.5 9.41574L1 6.11852L5.837 5.27926L8 1Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ))}
            </div>
            <span className={styles.reviewCount}>{product.reviewCount} отзыва</span>
          </div>

          {/* Статус наличия и артикул */}
          <div className={styles.statusBlock}>
            <span className={cn(styles.status, {
              [styles.inStock]: selectedVariant && selectedVariant.stock > 0,
              [styles.outOfStock]: !selectedVariant || selectedVariant.stock <= 0
            })}>
              {selectedVariant && selectedVariant.stock > 0 ? 'В наличии' : 'Нет в наличии'}
            </span>
            <span className={styles.articleNumber}>Артикул: {product.id}</span>
          </div>

          {/* Цена */}
          <div className={styles.priceBlock}>
            <span className={styles.currentPrice}>
              {selectedVariant?.on_sale && selectedVariant.sale_price ? selectedVariant.sale_price : selectedVariant?.price} ₽
            </span>
            {selectedVariant?.on_sale && selectedVariant.sale_price && (
              <span className={styles.oldPrice}>{selectedVariant.price} ₽</span>
            )}
            {selectedVariant?.on_sale && selectedVariant.sale_price && selectedVariant.price > selectedVariant.sale_price && (
              <span className={styles.discount}>
                -{Math.round((1 - selectedVariant.sale_price / selectedVariant.price) * 100)}%
              </span>
            )}
          </div>

          {/* Варианты цветов */}
          {product.variantColors && product.variantColors.length > 0 && (
            <div className={styles.colors}>
              <h3 className={styles.colorsTitle}>Цвет</h3>
              <div className={styles.colorOptions}>
                {product.variantColors.map(variant => (
                  <div
                    key={variant.id}
                    className={cn(styles.colorOption, {
                      [styles.active]: selectedColor === variant.id
                    })}
                    onClick={() => handleColorSelect(variant.id)}
                    title={variant.color.name}
                  >
                    <div
                      className={styles.colorInner}
                      style={{ backgroundColor: variant.color.hex }}
                    ></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Кнопки действий */}
          <div className={styles.actions}>
            <button
              className={cn(styles.addToCartButton, {
                [styles.loading]: isAddingToCart
              })}
              disabled={!selectedVariant?.stock || isAddingToCart}
              onClick={handleAddToCart}
            >
              {isAddingToCart ? (
                <span className={styles.loader}></span>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 1.66699L2.5 5.00033V16.667C2.5 17.109 2.67559 17.5329 2.98816 17.8455C3.30072 18.158 3.72464 18.3337 4.16667 18.3337H15.8333C16.2754 18.3337 16.6993 18.158 17.0118 17.8455C17.3244 17.5329 17.5 17.109 17.5 16.667V5.00033L15 1.66699H5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2.5 5H17.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M13.3334 8.33301C13.3334 9.21706 12.9822 10.0648 12.357 10.6899C11.7319 11.3151 10.8842 11.6663 10.0001 11.6663C9.11603 11.6663 8.26818 11.3151 7.64306 10.6899C7.01794 10.0648 6.66675 9.21706 6.66675 8.33301" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  В корзину
                </>
              )}
            </button>
            <FavoritesButton className={styles.favoriteButton} product={getProductForFavorites()} />
          </div>
        </div>
      </div>

      {/* Дополнительная информация о продукте */}
      <div className={styles.additionalInfo}>
        {/* Характеристики */}
        {product.specifications && product.specifications.length > 0 && (
          <div className={styles.specifications}>
            <h2 className={styles.specificationsTitle}>Характеристики</h2>
            <div className={styles.specificationsList}>
              {product.specifications.map(spec => (
                <div key={spec.id} className={styles.specificationItem}>
                  <span className={styles.specName}>{spec.name}</span>
                  <span className={styles.specValue}>{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Описание */}
        {product.description && product.description.length > 0 && (
          <div className={styles.description}>
            <h2 className={styles.descriptionTitle}>Описание</h2>
            <div className={styles.descriptionContent}>
              {product.description.map((item, index) => {
                if (item.type === 'paragraph') {
                  return (
                    <p key={index}>
                      {item.children.map((child, childIndex) => (
                        <span key={childIndex}>{child.text}</span>
                      ))}
                    </p>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}
        
        {/* Отзывы */}
        <div className={styles.reviews}>
          <h2 className={styles.reviewsTitle}>Отзывы покупателей</h2>
          
          {reviewsLoading ? (
            <div className={styles.reviewsLoading}>Загрузка отзывов...</div>
          ) : reviewsError ? (
            <div className={styles.reviewsError}>{reviewsError}</div>
          ) : reviews.length > 0 ? (
            <div className={styles.reviewsContainer}>
              {/* Список отзывов */}
              <div className={styles.reviewsList}>
                {reviews.map(review => (
                  <div key={review.id} className={styles.review}>
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
                          [styles.truncated]: !expandedReviews.has(review.id) && review.comment.length > 200
                        })}>
                          {expandedReviews.has(review.id) || review.comment.length <= 200 
                            ? review.comment 
                            : `${review.comment.slice(0, 200)}...`
                          }
                        </div>
                        {review.comment.length > 200 && (
                          <button 
                            className={styles.readMoreButton}
                            onClick={() => toggleReviewExpanded(review.id)}
                          >
                            {expandedReviews.has(review.id) ? 'Скрыть' : 'Читать полностью'}
                          </button>
                        )}
                      </>
                    )}
                    
                    {review.media && review.media.length > 0 && (
                      <div className={styles.reviewMedia}>
                        {review.media.map((media, index) => (
                          <div 
                            key={media.id} 
                            className={cn(styles.reviewMediaItem, {
                              [styles.reviewVideoItem]: media.type === 'video'
                            })}
                            onClick={() => openReviewLightbox(reviews, review.id, index)}
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
                ))}
              </div>
              
              {/* Статистика рейтингов справа */}
              {(reviewsStats || reviews.length > 0) && (
                <div className={styles.reviewsStatsSidebar}>
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
              )}
            </div>
          ) : (
            <div className={styles.noReviews}>
              <p>Пока нет отзывов о данном товаре</p>
              <p>Станьте первым, кто оставит отзыв!</p>
            </div>
          )}
        </div>
      </div>

      {/* Лайтбокс для просмотра изображений и видео */}
      {product && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={getLightboxItems()}
          index={lightboxIndex}
          plugins={[Video, Zoom, Thumbnails, Fullscreen]}
          video={{ autoPlay: true, controls: true }}
          zoom={{ maxZoomPixelRatio: 5, scrollToZoom: true, doubleTapDelay: 300 }}
          carousel={{ 
            padding: '16px',
            spacing: '30px'
          }}
          thumbnails={{
            position: 'bottom',
            width: 100,
            height: 80,
            border: 2,
            borderRadius: 8,
            padding: 4,
            gap: 8
          }}
          fullscreen={{ auto: true }}
          animation={{ fade: 300 }}
          controller={{ closeOnBackdropClick: true }}
          styles={lightboxStyles}
          render={{
            iconZoomIn: () => (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="black" strokeWidth="2"/>
                <path d="M21 21L16.65 16.65" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                <path d="M8 11H14" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                <path d="M11 8V14" stroke="black" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ),
            iconZoomOut: () => (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="black" strokeWidth="2"/>
                <path d="M21 21L16.65 16.65" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                <path d="M8 11H14" stroke="black" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ),
            iconFullscreen: () => (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 3H5C4.46957 3 3.96086 3.21071 3.58579 3.58579C3.21071 3.96086 3 4.46957 3 5V8" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V8" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V16" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 21H19C19.5304 21 20.0391 20.7893 20.4142 20.4142C20.7893 20.0391 21 19.5304 21 19V16" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ),
            iconExitFullscreen: () => null
          }}
        />
      )}

      {/* Лайтбокс для медиа отзывов */}
      <Lightbox
        open={reviewLightboxOpen}
        close={() => setReviewLightboxOpen(false)}
        slides={reviewLightboxItems}
        index={reviewLightboxIndex}
        plugins={[Video, Zoom, Thumbnails, Fullscreen]}
        video={{ autoPlay: true, controls: true }}
        zoom={{ maxZoomPixelRatio: 5, scrollToZoom: true, doubleTapDelay: 300 }}
        carousel={{ 
          padding: '16px',
          spacing: '30px'
        }}
        thumbnails={{
          position: 'bottom',
          width: 100,
          height: 80,
          border: 2,
          borderRadius: 8,
          padding: 4,
          gap: 8
        }}
        fullscreen={{ auto: true }}
        animation={{ fade: 300 }}
        controller={{ closeOnBackdropClick: true }}
        styles={lightboxStyles}
        render={{
          iconZoomIn: () => (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="8" stroke="black" strokeWidth="2"/>
              <path d="M21 21L16.65 16.65" stroke="black" strokeWidth="2" strokeLinecap="round"/>
              <path d="M8 11H14" stroke="black" strokeWidth="2" strokeLinecap="round"/>
              <path d="M11 8V14" stroke="black" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ),
          iconZoomOut: () => (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="8" stroke="black" strokeWidth="2"/>
              <path d="M21 21L16.65 16.65" stroke="black" strokeWidth="2" strokeLinecap="round"/>
              <path d="M8 11H14" stroke="black" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ),
          iconFullscreen: () => (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 3H5C4.46957 3 3.96086 3.21071 3.58579 3.58579C3.21071 3.96086 3 4.46957 3 5V8" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V8" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V16" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 21H19C19.5304 21 20.0391 20.7893 20.4142 20.4142C20.7893 20.0391 21 19.5304 21 19V16" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ),
          iconExitFullscreen: () => null
        }}
      />
    </section>
  );
};

export default ProductDetail;
