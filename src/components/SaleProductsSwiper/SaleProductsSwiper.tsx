// @ts-expect-error
import 'swiper/css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { SaleProductsSwiperProps } from './SaleProductsSwiper.props.ts';
import { IProduct } from '../../interfaces/products.interface.ts';
import styles from './SaleProductsSwiper.module.scss';
import axios, { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
import Title from '../Title/Title.tsx';
import ProductCard from '../ProductCard/ProductCard.tsx';

const SaleProductsSwiper = ({ ...props }: SaleProductsSwiperProps) => {
  const [saleProducts, setSaleProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getSaleProducts = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get<{ data: IProduct[] }>(`${import.meta.env.VITE_API_URL}/api/products/sale`);
      setSaleProducts(data.data);
    } catch (e) {
      const error = e as AxiosError;
      console.error('Ошибка при загрузке товаров со скидкой:', error.message);
      setError('Не удалось загрузить товары со скидкой');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSaleProducts();
  }, []);

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <Title className={styles.title}>Акции</Title>
        <div className={styles.loading}>Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.wrapper}>
        <Title className={styles.title}>Акции</Title>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  if (saleProducts.length === 0) {
    return null; // Если нет товаров со скидкой, не показываем секцию
  }

  return (
    <div {...props} className={styles.wrapper}>
      <Title className={styles.title}>Акции</Title>
      <Swiper
        spaceBetween={16}
        slidesPerView="auto"
        loop={saleProducts.length > 3}
        className={styles.swiper}
      >
        {saleProducts.map((product: IProduct) => (
          <SwiperSlide key={product.id} className={styles.swiperSlide}>
            <ProductCard product={product} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default SaleProductsSwiper; 