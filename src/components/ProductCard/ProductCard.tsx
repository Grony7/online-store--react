import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductCardProps } from './ProductCard.props';
import styles from './ProductCard.module.scss';
import cn from 'classnames';
import noImage from '../../assets/no-image.svg';
import { useDispatch } from 'react-redux';
import { cartActions } from '../../store/cart.slice';
import FavoritesButton from '../FavoritesButton/FavoritesButton';
import { favoritesActions } from '../../store/favorites.slice';

export const ProductCard = ({ className, product, isFavoritePage = false, ...props }: ProductCardProps) => {
  const dispatch = useDispatch();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
    
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Предотвращаем переход по ссылке, если кнопка внутри ссылки
    e.stopPropagation();
    if (!product.inStock) return;
        
    setIsAddingToCart(true);
        
    // Создаем объект товара для добавления в корзину
    // Поскольку на карточке нет выбора цвета, берем первый вариант по умолчанию (id=1)
    const cartItem = {
      id: product.id,
      colorId: product.variantColorIds?.[0] || 0, // Используем дефолтный ID цвета
      count: 1,
      name: product.title,
      price: product.price || 0,
      sale_price: product?.sale_price,
      image: product.image || '',
      color: {
        name: 'Стандартный', // Значение по умолчанию
        hex: '#000000' // Значение по умолчанию
      }
    };
        
    // Добавляем товар в корзину
    dispatch(cartActions.add(cartItem));
        
    // Имитация загрузки для лучшего UX
    setTimeout(() => {
      setIsAddingToCart(false);
    }, 500);
  };

  const handleRemoveFromFavorites = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsRemoving(true);
    
    // Удаляем товар из избранного
    dispatch(favoritesActions.remove(product.id));
    
    // Имитация загрузки для лучшего UX
    setTimeout(() => {
      setIsRemoving(false);
    }, 500);
  };

  return (
    <div className={cn(styles.card, className)} {...props}>
      {product.discount_percent > 0 && (
        <div className={styles.discount}>
                    -{product.discount_percent}%
        </div>
      )}
      
      {isFavoritePage && (
        <button
          className={cn(styles.removeButton, {
            [styles.loading]: isRemoving
          })}
          type="button"
          disabled={isRemoving}
          onClick={handleRemoveFromFavorites}
          aria-label="Удалить из избранного"
        >
          {isRemoving ? (
            <span className={styles.loader}></span>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
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
              {product.discount_percent > 0 && (
                <span className={styles.oldPrice}>
                  {product.price?.toLocaleString()} ₽
                </span>
              )}
            </div>
          </div>

          <div className={styles.actions}>
            {!isFavoritePage && (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard; 