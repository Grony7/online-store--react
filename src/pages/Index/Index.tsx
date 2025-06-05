import CategoriesSwiper from '../../components/CategoriesSwiper/CategoriesSwiper.tsx';
import SaleProductsSwiper from '../../components/SaleProductsSwiper/SaleProductsSwiper.tsx';
import PromotionsSwiper from '../../components/PromotionsSwiper';
import styles from './Index.module.scss';

const Index = () => {
  return (
    <div className={styles.container}>
      <PromotionsSwiper />
      <CategoriesSwiper />
      
      <SaleProductsSwiper />
    </div>
  );
};

export default Index;
