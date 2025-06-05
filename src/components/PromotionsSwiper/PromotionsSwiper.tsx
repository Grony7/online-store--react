// @ts-expect-error - Swiper использует CSS импорты
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { PromotionsSwiperProps } from './PromotionsSwiper.props';
import { IPromotion } from '../../interfaces/promotions.interface';
import styles from './PromotionsSwiper.module.scss';
import axios, { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
import Title from '../Title/Title.tsx';
import { Link } from 'react-router-dom';

const PromotionsSwiper = ({ ...props }: PromotionsSwiperProps) => {
  const [promotions, setPromotions] = useState<IPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getPromotions = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get<{ data: IPromotion[] }>(`${import.meta.env.VITE_API_URL}/api/promotions`);
      setPromotions(data.data);
    } catch (e) {
      const error = e as AxiosError;
      console.error('Ошибка при загрузке акций:', error.message);
      setError('Не удалось загрузить акции');
    } finally {
      setLoading(false);
    }
  };

  // Функция для очистки HTML-тегов из превью текста
  const stripHtml = (html: string): string => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  useEffect(() => {
    getPromotions();
  }, []);

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <Title className={styles.title}>Акции и предложения</Title>
        <div className={styles.loading}>Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.wrapper}>
        <Title className={styles.title}>Акции и предложения</Title>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  if (promotions.length === 0) {
    return null; // Если нет акций, не показываем секцию
  }

  return (
    <div {...props} className={styles.wrapper}>
      <Title className={styles.title}>Акции и предложения</Title>
      <Swiper
        spaceBetween={16}
        slidesPerView={1}
        loop={promotions.length > 1}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
        }}
        navigation={true}
        modules={[Autoplay, Pagination, Navigation]}
        className={styles.swiper}
        breakpoints={{
          768: {
            slidesPerView: 1
          }
        }}
      >
        {promotions.map((promotion: IPromotion) => (
          <SwiperSlide key={promotion.id} className={styles.swiperSlide}>
            <Link to={`/promotions/${promotion.slug}`} className={styles.promotionLink}>
              <div className={styles.promotion}>
                <div className={styles.imageContainer}>
                  <img 
                    src={`${import.meta.env.VITE_API_URL}${promotion.preview_image}`} 
                    alt={promotion.title} 
                    className={styles.image}
                  />
                </div>
                <div className={styles.content}>
                  <h3 className={styles.promotionTitle}>{promotion.title}</h3>
                  {promotion.preview_text && (
                    <p className={styles.promotionText}>{stripHtml(promotion.preview_text)}</p>
                  )}
                </div>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default PromotionsSwiper; 