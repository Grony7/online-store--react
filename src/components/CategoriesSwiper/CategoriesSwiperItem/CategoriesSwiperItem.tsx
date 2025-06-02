import styles from './CategoriesSwiperItem.module.scss';
import { CategoriesSwiperItemProps } from './CategoriesSwiperItem.props.ts';
import { Link } from 'react-router-dom';

const CategoriesSwiperItem = ({ data, ...props }: CategoriesSwiperItemProps) => {
  return (
    <Link className={styles.wrapper} to={`/catalog/${data.slug}`} {...props}>
      <div className={styles.imageWrapper}>
        <img className={styles.image} src={`${import.meta.env.VITE_API_URL}${data.image?.url}`} width='100%' height='100%' alt={data.name} />
      </div>
      <span className={styles.title}>{data.name}</span>
    </Link>
  );
};

export default CategoriesSwiperItem;
