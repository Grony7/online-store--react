/// <reference types="vite-plugin-svgr/client" />
import cn from 'classnames';
import styles from './CartItem.module.scss';
import { CartItemProps } from './CartItem.props';
import noImage from '../../assets/no-image.svg';
import DeleteIcon from '../../assets/icons/delete-icon.svg?react';
import HeartIcon from '../../components/ProductCard/heart.svg?react';
import MinusIcon from '../../assets/icons/minus-icon.svg?react';
import PlusVerticalIcon from '../../assets/icons/plus-vertical-icon.svg?react';
import PlusHorizontalIcon from '../../assets/icons/plus-horizontal-icon.svg?react';

const CartItem = ({ className, item, onRemove, onIncrement, onDecrement, onToggleSelect, ...props }: CartItemProps) => {
  // Показываем лоадер если данные загружаются
  if (item.isLoading || !item.details) {
    return (
      <div className={cn(styles.cartItem, styles.loading, className)} {...props}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingSpinner}></div>
          <span>Загрузка товара...</span>
        </div>
      </div>
    );
  }

  // Показываем ошибку если не удалось загрузить данные
  if (item.isError) {
    return (
      <div className={cn(styles.cartItem, styles.error, className)} {...props}>
        <div className={styles.errorContent}>
          <span>Ошибка загрузки товара</span>
          <button 
            className={styles.removeErrorButton}
            onClick={() => onRemove(item.id, item.colorId)}
          >
            Удалить
          </button>
        </div>
      </div>
    );
  }

  const { details } = item;

  return (
    <div className={cn(styles.cartItem, className, {
      [styles.selected]: item.selected
    })} {...props}>
      <div className={styles.checkbox}>
        <input 
          type="checkbox" 
          checked={item.selected} 
          onChange={() => onToggleSelect(item.id, item.colorId)}
          className={styles.checkboxInput}
          id={`item-${item.id}-${item.colorId}`}
        />
        <label 
          htmlFor={`item-${item.id}-${item.colorId}`} 
          className={styles.checkboxLabel}
        ></label>
      </div>

      <div className={styles.content}>
        <div className={styles.imageWrapper}>
          <img 
            src={details.image ? `${import.meta.env.VITE_API_URL}${details.image}` : noImage}
            alt={details.title}
            className={styles.image}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = noImage;
            }}
          />
        </div>
        
        <div className={styles.info}>
          <div className={styles.nameWrapper}>
            <h3 className={styles.name}>{details.title}</h3>
            {details.color && (
              <div className={styles.colorIndicator}>
                <div className={styles.colorBox} style={{ backgroundColor: details.color.hex_code }}></div>
                <span className={styles.colorName}>{details.color.name}</span>
              </div>
            )}
          </div>
          
          <div className={styles.priceBlock}>
            {details.on_sale && details.sale_price ? (
              <>
                <span className={styles.currentPrice}>
                  {details.sale_price} ₽
                </span>
                <span className={styles.oldPrice}>
                  {details.price} ₽
                </span>
                <span className={styles.discount}>
                  -{Math.round(((details.price - details.sale_price) / details.price) * 100)}%
                </span>
              </>
            ) : (
              <span className={styles.currentPrice}>
                {details.price} ₽
              </span>
            )}
          </div>
          
          {details.quantity > 0 && (
            <div className={styles.stockInfo}>
              В наличии: {details.quantity} шт.
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.actions}>
        <div className={styles.buttons}>
          <button 
            className={styles.favoriteButton}
            type="button"
            aria-label="Добавить в избранное"
          >
            <HeartIcon />
          </button>
          
          <button 
            className={styles.deleteButton}
            type="button"
            aria-label="Удалить из корзины"
            onClick={() => onRemove(item.id, item.colorId)}
          >
            <DeleteIcon />
          </button>
        </div>
        
        <div className={styles.counter}>
          <button 
            className={cn(styles.counterButton, {
              [styles.disabled]: item.count <= 1
            })}
            disabled={item.count <= 1}
            onClick={() => onDecrement(item.id, item.colorId)}
            aria-label="Уменьшить количество"
          >
            <MinusIcon />
          </button>
          
          <span className={styles.count}>{item.count}</span>
          
          <button 
            className={cn(styles.counterButton, {
              [styles.disabled]: item.count >= details.quantity
            })}
            disabled={item.count >= details.quantity}
            onClick={() => onIncrement(item.id, item.colorId)}
            aria-label="Увеличить количество"
          >
            <div className={styles.plusIconWrapper}>
              <PlusHorizontalIcon className={styles.plusHorizontal} />
              <PlusVerticalIcon className={styles.plusVertical} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItem; 