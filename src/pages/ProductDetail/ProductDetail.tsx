import { FC, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import cn from 'classnames';
import styles from './ProductDetail.module.scss';
import { ProductDetailProps } from './ProductDetail.props';
import { IProductDetail, IProductDetailResponse, VariantColor } from '../../interfaces/product-detail.interface';
import { IReviewsResponse, IReview } from '../../interfaces/reviews.interface';
import { useDispatch, useSelector } from 'react-redux';
import { cartActions } from '../../store/cart.slice';
import { IProduct } from '../../interfaces/product.interface.ts';
import {
  ProductGallery,
  ProductInfo,
  ProductSpecifications,
  ProductDescription,
  ProductReviews,
  ReviewForm
} from '../../components/ProductComponents';
import { ReviewFormData } from '../../components/ProductComponents/ReviewForm';
import { RootState } from '../../store/store';

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

  // Получаем токен авторизации из Redux store
  const jwt = useSelector((state: RootState) => state.user.jwt);
  const userProfile = useSelector((state: RootState) => state.user.profile);

  // Получаем ID текущего пользователя
  const currentUserId = userProfile?.id || null;

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

  // Состояние для пагинации отзывов
  const [reviewsPage, setReviewsPage] = useState<number>(1);
  const [hasMoreReviews, setHasMoreReviews] = useState<boolean>(false);
  const [loadingMoreReviews, setLoadingMoreReviews] = useState<boolean>(false);
  const reviewsPerPage = 10;

  // Состояние для сворачивания текста отзывов
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set());

  // Состояние для формы отзыва
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);
  const [editingReview, setEditingReview] = useState<IReview | null>(null);
  const [isReviewFormEditing, setIsReviewFormEditing] = useState<boolean>(false);

  // Состояние для лайтбокса
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);

  // Состояние для лайтбокса отзывов
  const [reviewLightboxOpen, setReviewLightboxOpen] = useState<boolean>(false);
  const [reviewLightboxIndex, setReviewLightboxIndex] = useState<number>(0);
  const [reviewLightboxItems, setReviewLightboxItems] = useState<Slide[]>([]);

  // Подготавливаем данные для лайтбокса
  const getLightboxItems = (): Slide[] => {
    if (!product) return [];

    // Основные изображения товара
    const imageItems: SlideImage[] = product.images.map(image => ({
      src: `${import.meta.env.VITE_API_URL}${image.url}`,
      type: 'image' as const
    }));

    // Основные видео товара
    const videoItems: SlideVideo[] = product.videos.map(video => ({
      sources: [{ src: `${import.meta.env.VITE_API_URL}${video.url}`, type: 'video/mp4' }],
      type: 'video' as const,
      poster: video.thumbnail
        ? `${import.meta.env.VITE_API_URL}${video.thumbnail}`
        : product.images.length > 0
          ? `${import.meta.env.VITE_API_URL}${product.images[0].url}`
          : ''
    }));

    // Изображения из вариантов цветов
    const variantImageItems: SlideImage[] = [];
    const variantVideoItems: SlideVideo[] = [];

    if (product.variantColors && selectedColor) {
      const selectedVariantColor = product.variantColors.find(variant => variant.id === selectedColor);

      if (selectedVariantColor) {
        // Добавляем основное изображение варианта
        if (selectedVariantColor.image) {
          variantImageItems.push({
            src: `${import.meta.env.VITE_API_URL}${selectedVariantColor.image}`,
            type: 'image' as const
          });
        }

        // Добавляем дополнительные изображения варианта
        if (selectedVariantColor.images) {
          selectedVariantColor.images.forEach(imageUrl => {
            if (imageUrl) {
              variantImageItems.push({
                src: `${import.meta.env.VITE_API_URL}${imageUrl}`,
                type: 'image' as const
              });
            }
          });
        }

        // Добавляем видео варианта
        if (selectedVariantColor.videos) {
          selectedVariantColor.videos.forEach(videoUrl => {
            if (videoUrl) {
              variantVideoItems.push({
                sources: [{ src: `${import.meta.env.VITE_API_URL}${videoUrl}`, type: 'video/mp4' }],
                type: 'video' as const,
                poster: selectedVariantColor.image
                  ? `${import.meta.env.VITE_API_URL}${selectedVariantColor.image}`
                  : product.images.length > 0
                    ? `${import.meta.env.VITE_API_URL}${product.images[0].url}`
                    : ''
              });
            }
          });
        }
      }
    }

    return [...imageItems, ...variantImageItems, ...videoItems, ...variantVideoItems];
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const openReviewLightbox = (reviewMedia: IReview[], selectedReviewId: number, selectedMediaIndex: number) => {
    const selectedReview = reviewMedia.find(r => r.id === selectedReviewId);
    if (!selectedReview?.media) return;

    const lightboxItems: Slide[] = selectedReview.media.map(media => {
      if (media.type === 'image') {
        return {
          src: `${import.meta.env.VITE_API_URL}${media.url}`,
          type: 'image' as const
        };
      } else {
        return {
          sources: [{ src: `${import.meta.env.VITE_API_URL}${media.url}`, type: 'video/mp4' }],
          type: 'video' as const,
          poster: media.thumbnail ? `${import.meta.env.VITE_API_URL}${media.thumbnail}` : ''
        };
      }
    });

    setReviewLightboxItems(lightboxItems);
    setReviewLightboxIndex(selectedMediaIndex);
    setReviewLightboxOpen(true);
  };

  const generateStatsFromReviews = (reviews: IReview[]) => {
    if (reviews.length === 0) {
      return {
        averageRating: 0,
        reviewCount: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    const ratingDistribution = reviews.reduce((acc, review) => {
      acc[review.rating] = (acc[review.rating] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      averageRating,
      reviewCount: reviews.length,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, ...ratingDistribution }
    };
  };

  const fetchReviews = async (productId: string, page: number = 1, append: boolean = false) => {
    try {
      if (!append) {
        setReviewsLoading(true);
        setReviewsError(null);
      } else {
        setLoadingMoreReviews(true);
      }

      const response = await axios.get<IReviewsResponse>(`${import.meta.env.VITE_API_URL}/api/products/${productId}/reviews?page=${page}&limit=${reviewsPerPage}`);

      if (response.data && response.data.reviews) {
        if (append) {
          setReviews(prev => [...prev, ...response.data.reviews]);
        } else {
          setReviews(response.data.reviews);
        }

        // Проверяем, есть ли еще отзывы для загрузки
        const hasMore = response.data.reviews.length === reviewsPerPage;
        setHasMoreReviews(hasMore);

        if (response.data.stats) {
          setReviewsStats(response.data.stats);
        } else {
          // Для append режима пересчитываем статистику для всех загруженных отзывов
          const allReviews = append ? [...reviews, ...response.data.reviews] : response.data.reviews;
          setReviewsStats(generateStatsFromReviews(allReviews));
        }
      }
    } catch (err) {
      console.error('Ошибка при загрузке отзывов:', err);
      if (!append) {
        setReviewsError('Не удалось загрузить отзывы');
      }
    } finally {
      if (!append) {
        setReviewsLoading(false);
      } else {
        setLoadingMoreReviews(false);
      }
    }
  };

  const loadMoreReviews = async () => {
    if (!product || loadingMoreReviews) return;

    const nextPage = reviewsPage + 1;
    setReviewsPage(nextPage);
    await fetchReviews(product.id.toString(), nextPage, true);
  };

  const createReview = async (reviewData: ReviewFormData) => {
    if (!product) return;

    const formData = new FormData();
    formData.append('product', product.id.toString());
    formData.append('rating', reviewData.rating.toString());
    formData.append('comment', reviewData.comment);

    // Добавляем медиа файлы
    if (reviewData.media && reviewData.media.length > 0) {
      reviewData.media.forEach((file) => {
        formData.append('media', file);
      });
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/reviews`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(jwt && { 'Authorization': `Bearer ${jwt}` })
        }
      });

      // Сбрасываем пагинацию и обновляем список отзывов
      setReviewsPage(1);
      await fetchReviews(product.id.toString(), 1, false);

      // Закрываем форму
      setShowReviewForm(false);
    } catch (error) {
      console.error('Ошибка при создании отзыва:', error);
      throw error;
    }
  };

  const updateReview = async (reviewData: ReviewFormData) => {
    if (!product || !editingReview) return;

    const formData = new FormData();
    formData.append('rating', reviewData.rating.toString());
    formData.append('comment', reviewData.comment);

    // Добавляем медиа файлы
    if (reviewData.media && reviewData.media.length > 0) {
      reviewData.media.forEach((file) => {
        formData.append('media', file);
      });
    }

    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/reviews/by-product/${product.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(jwt && { 'Authorization': `Bearer ${jwt}` })
        }
      });

      // Сбрасываем пагинацию и обновляем список отзывов
      setReviewsPage(1);
      await fetchReviews(product.id.toString(), 1, false);

      // Закрываем форму
      setShowReviewForm(false);
      setEditingReview(null);
      setIsReviewFormEditing(false);
    } catch (error) {
      console.error('Ошибка при обновлении отзыва:', error);
      throw error;
    }
  };

  const deleteReview = async () => {
    if (!product) return;

    if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) {
      return;
    }

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/reviews/by-product/${product.id}`, {
        headers: {
          ...(jwt && { 'Authorization': `Bearer ${jwt}` })
        }
      });

      // Сбрасываем пагинацию и обновляем список отзывов
      setReviewsPage(1);
      await fetchReviews(product.id.toString(), 1, false);
    } catch (error) {
      console.error('Ошибка при удалении отзыва:', error);
      alert('Не удалось удалить отзыв. Попробуйте еще раз.');
    }
  };

  // Обработчики для формы отзыва
  const handleCreateReview = () => {
    setEditingReview(null);
    setIsReviewFormEditing(false);
    setShowReviewForm(true);
  };

  const handleEditReview = (review: IReview) => {
    setEditingReview(review);
    setIsReviewFormEditing(true);
    setShowReviewForm(true);
  };

  const handleDeleteReview = () => {
    deleteReview();
  };

  const handleReviewFormSubmit = async (reviewData: ReviewFormData) => {
    if (isReviewFormEditing && editingReview) {
      await updateReview(reviewData);
    } else {
      await createReview(reviewData);
    }
  };

  const handleReviewFormCancel = () => {
    setShowReviewForm(false);
    setEditingReview(null);
    setIsReviewFormEditing(false);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await axios.get<IProductDetailResponse>(`${import.meta.env.VITE_API_URL}/api/products/${id}`);

        if (response.data && response.data.data) {
          setProduct(response.data.data);

          if (response.data.data.images && response.data.data.images.length > 0) {
            setCurrentImage(`${import.meta.env.VITE_API_URL}${response.data.data.images[0].url}`);
          }

          if (response.data.data.variantColors && response.data.data.variantColors.length > 0) {
            const firstVariant = response.data.data.variantColors[0];
            setSelectedColor(firstVariant.id);
            setSelectedVariant(firstVariant);
          }

          await fetchReviews(id);
        }
      } catch (err) {
        console.error('Ошибка при загрузке продукта:', err);
        setError('Не удалось загрузить информацию о продукте');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleImageClick = (url: string) => {
    setCurrentImage(`${import.meta.env.VITE_API_URL}${url}`);
  };

  const handleMainImageClick = () => {
    if (product) {
      // Создаем массивы точно так же как в getLightboxItems
      const allLightboxItems = getLightboxItems();

      // Получаем URL текущего изображения без VITE_API_URL
      let currentMediaUrl = currentImage;
      if (currentMediaUrl.startsWith(import.meta.env.VITE_API_URL)) {
        currentMediaUrl = currentMediaUrl.replace(import.meta.env.VITE_API_URL, '');
      }

      // Ищем индекс в массиве лайтбокса
      const index = allLightboxItems.findIndex(item => {
        if (item.type === 'image') {
          const itemUrl = item.src.replace(import.meta.env.VITE_API_URL, '');
          return itemUrl === currentMediaUrl;
        } else if (item.type === 'video') {
          const itemUrl = item.sources[0].src.replace(import.meta.env.VITE_API_URL, '');
          return itemUrl === currentMediaUrl;
        }
        return false;
      });

      if (index !== -1) {
        openLightbox(index);
      }
    }
  };

  const handleColorSelect = (colorId: number) => {
    setSelectedColor(colorId);

    const variant = product?.variantColors?.find(v => v.id === colorId);
    if (variant) {
      setSelectedVariant(variant);
    }
  };

  const handleAddToCart = () => {
    if (!selectedVariant || !product) return;

    setIsAddingToCart(true);

    try {
      dispatch(cartActions.add({
        id: product.id,
        colorId: selectedVariant.id,
        count: 1
      }));

      setTimeout(() => {
        setIsAddingToCart(false);
      }, 500);
    } catch (error) {
      console.error('Ошибка при добавлении в корзину:', error);
      setIsAddingToCart(false);
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  const getProductForFavorites = (): IProduct => {
    if (!product) {
      return {
        id: 0,
        title: '',
        price: 0,
        on_sale: false,
        sale_price: null
      };
    }

    return {
      id: product.id,
      title: product.title,
      price: selectedVariant?.price ?? 0,
      on_sale: selectedVariant?.on_sale ?? false,
      sale_price: selectedVariant?.sale_price ?? null
    };
  };

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
        <ProductGallery
          product={product}
          currentImage={currentImage}
          onImageClick={handleImageClick}
          onMainImageClick={handleMainImageClick}
          selectedColor={selectedColor}
        />

        {/* Информация о продукте */}
        <ProductInfo
          product={product}
          selectedColor={selectedColor}
          selectedVariant={selectedVariant}
          isAddingToCart={isAddingToCart}
          onColorSelect={handleColorSelect}
          onAddToCart={handleAddToCart}
          getProductForFavorites={getProductForFavorites}
        />
      </div>

      {/* Дополнительная информация о продукте */}
      <div className={styles.additionalInfo}>
        {/* Характеристики */}
        <ProductSpecifications product={product} />

        {/* Описание */}
        <ProductDescription product={product} />

        {/* Отзывы */}
        <ProductReviews
          reviews={reviews}
          reviewsLoading={reviewsLoading}
          reviewsError={reviewsError}
          reviewsStats={reviewsStats}
          expandedReviews={expandedReviews}
          onToggleReviewExpanded={toggleReviewExpanded}
          onOpenReviewLightbox={openReviewLightbox}
          onCreateReview={handleCreateReview}
          onEditReview={handleEditReview}
          onDeleteReview={handleDeleteReview}
          onLoadMoreReviews={loadMoreReviews}
          hasMoreReviews={hasMoreReviews}
          loadingMoreReviews={loadingMoreReviews}
          currentUserId={currentUserId}
          isAuthenticated={!!jwt}
          generateStatsFromReviews={generateStatsFromReviews}
        />
      </div>

      {/* Форма отзыва */}
      <ReviewForm
        existingReview={editingReview}
        isEditing={isReviewFormEditing}
        isVisible={showReviewForm}
        onSubmit={handleReviewFormSubmit}
        onCancel={handleReviewFormCancel}
      />

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
