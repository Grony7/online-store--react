import { useState, MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { ProductCardProps } from './ProductCard.props';
import styles from './ProductCard.module.scss';
import cn from 'classnames';
import noImage from '../../assets/no-image.svg';
import { useDispatch } from 'react-redux';
import { cartActions } from '../../store/cart.slice';
import { AppDispatch } from '../../store/store';
import FavoritesButton from '../FavoritesButton/FavoritesButton';

export const ProductCard = ({ className, product, ...props }: ProductCardProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleAddToCart = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.inStock) return;

    setIsAddingToCart(true);

    try {
      const colorId = product.variantColorIds?.[0] || 0;

      // Добавляем товар в корзину с базовой информацией
      // Детальная информация загрузится автоматически на странице корзины
      dispatch(cartActions.add({
        id: product.id,
        colorId: colorId,
        count: 1
      }));

    } catch (error) {
      console.error('Ошибка добавления товара в корзину:', error);
    } finally {
      setTimeout(() => {
        setIsAddingToCart(false);
      }, 500);
    }
  };

  if (product.variantColorIds?.length === 0) return;

  return (
    <div className={cn(styles.card, className)} {...props}>
      {product.discount_percent && product.discount_percent > 0 && (
        <div className={styles.discount}>
          -{product.discount_percent}%
        </div>
      )}

      <Link to={`/products/${product.id}`} className={styles.imageWrapper}>
        <img
          src={product.image ? import.meta.env.VITE_API_URL + product.image : noImage}
          alt={product.title}
          className={styles.image}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = noImage;
          }}
        />
      </Link>

      <div className={styles.content}>
        <div className={styles.info}>
          <Link to={`/products/${product.id}`}>
            <h3 className={styles.title}>{product.title}</h3>
          </Link>
        </div>

        <div className={styles.bottom}>
          <div className={styles.priceBlock}>
            <span className={cn(styles.status, {
              [styles.inStock]: product.inStock,
              [styles.outOfStock]: !product.inStock
            })}>
              {product.inStock ? 'В наличии' : 'Нет в наличии'}
            </span>
            <div className={styles.prices}>
              {product.sale_price &&
                <span className={styles.currentPrice}>
                  {product.sale_price.toLocaleString()} ₽
                </span>
              }
              {product.discount_percent && product.discount_percent > 0 && (
                <span className={styles.oldPrice}>
                  {product.price?.toLocaleString()} ₽
                </span>
              )}
            </div>
          </div>

          <div className={styles.actions}>
            <>
              <FavoritesButton
                className={styles.wishlist}
                product={product}
              />
              <button
                className={cn(styles.addToCart, {
                  [styles.disabled]: !product.inStock,
                  [styles.loading]: isAddingToCart
                })}
                type="button"
                disabled={!product.inStock || isAddingToCart}
                onClick={handleAddToCart}
              >
                {isAddingToCart ? (
                  <span className={styles.loader}></span>
                ) : (
                  'В корзину'
                )}
              </button>
            </>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
