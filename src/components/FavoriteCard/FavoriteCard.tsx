import { useState } from 'react';

import styles from './FavoriteCard.module.scss';
import cn from 'classnames';
import noImage from '../../assets/no-image.svg';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import { favoritesActions } from '../../store/favorites.slice';
import axios, { AxiosError } from 'axios';
import { FavoriteCardProps } from './FavoriteCard.props.ts';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL

const FavoriteCard = ({ className, product, ...props }: FavoriteCardProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const userJwt = useSelector((state: RootState) => state.user.jwt);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveFromFavorites = async () => {
    try {
      setIsRemoving(true);

      // Удаляем из избранного в Redux
      dispatch(favoritesActions.removeItem({
        id: product.id,
      }));

      // Если пользователь авторизован, синхронизируем с сервером
      if (userJwt) {
        await axios.delete(`${API_URL}/api/favorites/${product.id}`, {
          headers: { Authorization: `Bearer ${userJwt}` }
        });
      }
    } catch (e) {
      const error = e as AxiosError;
      console.error('Ошибка при удалении из избранного:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className={cn(styles.card, className)} {...props}>
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

      <Link to={`/products/${product.id}`} className={styles.imageWrapper}>
        <img
          src={product.image ? API_URL + product.image : noImage}
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
          <span className={cn(styles.status, {
            [styles.inStock]: product.inStock,
            [styles.outOfStock]: !product.inStock
          })}>
            {product.inStock ? 'В наличии' : 'Нет в наличии'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FavoriteCard;
