// @ts-expect-error - Swiper CSS imports don't have TypeScript declarations
import 'swiper/css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { CategoriesSwiperProps } from './CategoriesSwiper.props.ts';
import CategoriesSwiperItem from './CategoriesSwiperItem/CategoriesSwiperItem.tsx';
import styles from './CategoriesSwiper.module.scss';
import axios, { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
import Title from '../Title/Title.tsx';
import { ICatalogCategory } from '../../interfaces/catalog.interface.ts';

const CategoriesSwiper = ({ ...props }: CategoriesSwiperProps) => {
  const [catalogTypes, setCatalogTypes] = useState<ICatalogCategory[]>([]);

  const getCatalogTypes = async () => {
    try {
      const { data } = await axios.get<ICatalogCategory[]>(`${import.meta.env.VITE_API_URL}/api/categories`);
      setCatalogTypes(data);
    } catch (e) {
      const error = e as AxiosError;
      console.log(error.message);
    }
  };

  useEffect(() => {
    getCatalogTypes();
  }, []);



  return (
    catalogTypes.length > 0 &&
    <div {...props} className={styles.wrapper}>
      <Title className={styles.title}>Каталог</Title>
      <Swiper
        spaceBetween={16}
        slidesPerView='auto'
        loop={true}
        className={styles.swiper}
      >
        {
          catalogTypes.map((data: ICatalogCategory) =>
            <SwiperSlide key={data.id} className={styles.swiperSlide}>
              <CategoriesSwiperItem data={data} />
            </SwiperSlide>
          )
        }

      </Swiper>
    </div>
  );
};

export default CategoriesSwiper;
