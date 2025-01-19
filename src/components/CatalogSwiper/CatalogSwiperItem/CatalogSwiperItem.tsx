import styles from './CatalogSwiperItem.module.scss';
import { CatalogSwiperItemProps } from './CatalogSwiperItem.props.ts';
import { Link } from 'react-router-dom';

const CatalogSwiperItem = ({ data, ...props }: CatalogSwiperItemProps) => {
  return (
      <Link className={styles.wrapper} to={`/catalog/${data.category}`} {...props}>
        <div className={styles.imageWrapper}>
          <img className={styles.image} src={import.meta.env.VITE_API_URL + '/' + data.imageURL} width='100%' height='100%' alt={data.name} />
        </div>
        <span className={styles.title}>{data.name}</span>
      </Link>
  );
};

export default CatalogSwiperItem;
