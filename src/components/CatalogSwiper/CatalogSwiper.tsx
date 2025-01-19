// @ts-expect-error
import 'swiper/css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { CatalogSwiperProps } from './CatalogSwiper.props.ts';
import { ICatalogCategory } from '../../interfaces/products.interface.ts';
import CatalogSwiperItem from './CatalogSwiperItem/CatalogSwiperItem.tsx';
import styles from './CatalogSwiper.module.scss'
import axios, { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
import Title from '../Title/Title.tsx';



const CatalogSwiper = ({ ...props }: CatalogSwiperProps) => {
  const [catalogTypes, setCatalogTypes] = useState<ICatalogCategory[]>([]);

  const getCatalogTypes = async () => {
    try {
      const {data} = await axios.get<ICatalogCategory[]>(`${import.meta.env.VITE_API_URL}/api/products/get/categories`)
      setCatalogTypes(data)
    } catch (e) {
      const error = e as AxiosError;
      console.log(error.message)
    }
  }

  useEffect(() => {
    getCatalogTypes();
  }, [catalogTypes]);



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
              <CatalogSwiperItem data={data}/>
            </SwiperSlide>
          )
        }

      </Swiper>
    </div>
  );
};

export default CatalogSwiper;
