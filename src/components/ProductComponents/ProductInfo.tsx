import { FC } from 'react';
import cn from 'classnames';
import { IProductDetail, VariantColor } from '../../interfaces/product-detail.interface';
import { IProduct } from '../../interfaces/product.interface.ts';
import FavoritesButton from '../FavoritesButton/FavoritesButton';
import styles from './ProductInfo.module.scss';

interface ProductInfoProps {
  product: IProductDetail;
  selectedColor: number | null;
  selectedVariant: VariantColor | null;
  isAddingToCart: boolean;
  onColorSelect: (colorId: number) => void;
  onAddToCart: () => void;
  getProductForFavorites: () => IProduct;
  className?: string;
}

const ProductInfo: FC<ProductInfoProps> = ({
  product,
  selectedColor,
  selectedVariant,
  isAddingToCart,
  onColorSelect,
  onAddToCart,
  getProductForFavorites,
  className
}) => {
  return (
    <div className={cn(styles.info, className)}>
      <h1 className={styles.title}>{product.title}</h1>

      {/* Рейтинг и отзывы */}
      <div className={styles.rating}>
        <div className={styles.stars}>
          {Array.from({ length: 5 }).map((_, index) => (
            <svg
              key={index}
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill={index < Math.round(product.averageRating || 0) ? '#EBBA1A' : 'none'}
              stroke={index < Math.round(product.averageRating || 0) ? 'none' : '#C4C4C4'}
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M8 1L10.163 5.27926L15 6.11852L11.5 9.41574L12.326 14L8 11.7793L3.674 14L4.5 9.41574L1 6.11852L5.837 5.27926L8 1Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ))}
        </div>
        <span className={styles.reviewCount}>{product.reviewCount} отзыва</span>
      </div>

      {/* Статус наличия и артикул */}
      <div className={styles.statusBlock}>
        <span className={cn(styles.status, {
          [styles.inStock]: selectedVariant && selectedVariant.stock > 0,
          [styles.outOfStock]: !selectedVariant || selectedVariant.stock <= 0
        })}>
          {selectedVariant && selectedVariant.stock > 0 ? 'В наличии' : 'Нет в наличии'}
        </span>
        <span className={styles.articleNumber}>Артикул: {product.id}</span>
      </div>

      {/* Цена */}
      <div className={styles.priceBlock}>
        <span className={styles.currentPrice}>
          {selectedVariant?.on_sale && selectedVariant.sale_price ? selectedVariant.sale_price : selectedVariant?.price} ₽
        </span>
        {selectedVariant?.on_sale && selectedVariant.sale_price && (
          <span className={styles.oldPrice}>{selectedVariant.price} ₽</span>
        )}
        {selectedVariant?.on_sale && selectedVariant.sale_price && selectedVariant.price > selectedVariant.sale_price && (
          <span className={styles.discount}>
            -{Math.round((1 - selectedVariant.sale_price / selectedVariant.price) * 100)}%
          </span>
        )}
      </div>

      {/* Варианты цветов */}
      {product.variantColors && product.variantColors.length > 0 && (
        <div className={styles.colors}>
          <h3 className={styles.colorsTitle}>Цвет</h3>
          <div className={styles.colorOptions}>
            {product.variantColors.map(variant => (
              <div
                key={variant.id}
                className={cn(styles.colorOption, {
                  [styles.active]: selectedColor === variant.id
                })}
                onClick={() => onColorSelect(variant.id)}
                title={variant.color.name}
              >
                <div
                  className={styles.colorInner}
                  style={{ backgroundColor: variant.color.hex }}
                ></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Кнопки действий */}
      <div className={styles.actions}>
        <button
          className={cn(styles.addToCartButton, {
            [styles.loading]: isAddingToCart
          })}
          disabled={!selectedVariant?.stock || isAddingToCart}
          onClick={onAddToCart}
        >
          {isAddingToCart ? (
            <span className={styles.loader}></span>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 1.66699L2.5 5.00033V16.667C2.5 17.109 2.67559 17.5329 2.98816 17.8455C3.30072 18.158 3.72464 18.3337 4.16667 18.3337H15.8333C16.2754 18.3337 16.6993 18.158 17.0118 17.8455C17.3244 17.5329 17.5 17.109 17.5 16.667V5.00033L15 1.66699H5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2.5 5H17.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13.3334 8.33301C13.3334 9.21706 12.9822 10.0648 12.357 10.6899C11.7319 11.3151 10.8842 11.6663 10.0001 11.6663C9.11603 11.6663 8.26818 11.3151 7.64306 10.6899C7.01794 10.0648 6.66675 9.21706 6.66675 8.33301" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              В корзину
            </>
          )}
        </button>
        <FavoritesButton className={styles.favoriteButton} product={getProductForFavorites()} />
      </div>
    </div>
  );
};

export default ProductInfo;
