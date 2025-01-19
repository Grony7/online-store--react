import styles from './CatalogListItem.module.scss';
import { CatalogListItemProps } from './CatalogListItem.props.ts';
import Title from '../../Title/Title.tsx';
import cn from 'classnames';
import FavoritesButton from '../../FavoritesButton/FavoritesButton.tsx';
import Button from '../../Button/Button.tsx';
import { priceConversion } from '../../../helpers/priceConversion.ts';

const CatalogListItem = ({product, titleLevel = 2, ...props }: CatalogListItemProps) => {
  return (
    <div className={styles.wrapper} {...props}>
      <div className={styles.imageWrapper}>
        <img className={styles.image} src={`${import.meta.env.VITE_API_URL}/${product.listImages[0]}`} width='100' height='140' alt={product.name}/>
      </div>
      <div className={styles.textWrapper}>
        <Title className={styles.title} level={titleLevel}>{product.name}</Title>
        <dl className={styles.featuresList}>
          {Object.entries(product.characteristics).slice(0, 3).map(([key, value]) => (
            <div className={styles.featuresListItem} key={key}>
              <dt className={styles.featureTitle}>{key}:</dt>{'\u00A0'}<dd>{value}</dd>
            </div>
          ))}
        </dl>
        <div className={styles.buttonWrapper}>
          <span className={cn(styles.quantityStatus, {
              [styles.inStock]: product.quantity,
            })}>{product.quantity ? 'В наличии' : 'Нет в наличии'}
          </span>
          <span className={styles.price}>{priceConversion(product.price)}</span>
          <FavoritesButton className={styles.favoriteButton} />
          <Button className={styles.cardButton}>В корзину</Button>

        </div>
      </div>
    </div>

  );
};

export default CatalogListItem;
