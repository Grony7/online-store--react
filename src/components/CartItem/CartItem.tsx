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
          {item.mediaType === 'video' ? (
            <video 
              src={`${import.meta.env.VITE_API_URL}${item.image}`}
              className={styles.video}
              muted
              loop
              autoPlay
            />
          ) : (
            <img 
              src={item.image ? `${import.meta.env.VITE_API_URL}${item.image}` : noImage}
              alt={item.name}
              className={styles.image}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = noImage;
              }}
            />
          )}
        </div>
        
        <div className={styles.info}>
          <div className={styles.nameWrapper}>
            <h3 className={styles.name}>{item.name}</h3>
            {item.color && (
              <div className={styles.colorIndicator}>
                <div className={styles.colorBox} style={{ backgroundColor: item.color.hex }}></div>
                <span className={styles.colorName}>{item.color.name}</span>
              </div>
            )}
          </div>
          
          <div className={styles.priceBlock}>
            <span className={styles.currentPrice}>
              {item.sale_price ? item.sale_price : item.price} ₽
            </span>
            {item.sale_price && item.sale_price < item.price && (
              <span className={styles.oldPrice}>{item.price} ₽</span>
            )}
          </div>
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
            className={styles.counterButton}
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