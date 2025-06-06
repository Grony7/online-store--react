/// <reference types="vite-plugin-svgr/client" />
import styles from './FavoritesButton.module.scss';
import { FavoritesButtonProps } from './FavoritesButton.props.ts';
import cn from 'classnames';
import HeartIcon from './heart.svg?react';
import { useDispatch, useSelector } from 'react-redux';
import { favoritesActions, loadFavoriteItemDetails } from '../../store/favorites.slice.ts';
import { RootState, AppDispatch } from '../../store/store.ts';
import { useState, MouseEvent } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL

const FavoritesButton = ({ ref, className, product, isFavorite, ...props }: FavoritesButtonProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const favorites = useSelector((state: RootState) => state.favorites.items);
  const userJwt = useSelector((state: RootState) => state.user.jwt);
  const isInFavorites = isFavorite !== undefined ?
    isFavorite :
    favorites.some(item => item.id === product.id);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleFavorite = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product || !product.id) {
      console.error('Ошибка: товар не определен или не имеет ID');
      return;
    }
    setIsLoading(true);

    try {
      if (isInFavorites) {
        dispatch(favoritesActions.remove(product.id));

        if (userJwt) {
          await axios.delete(`${API_URL}/api/favorites/${product.id}`, {
            headers: { Authorization: `Bearer ${userJwt}` }
          });
        }
      } else {
        dispatch(favoritesActions.add({
          id: product.id,
        }));

        // Загружаем детальную информацию о товаре
        try {
          await dispatch(loadFavoriteItemDetails({
            id: product.id,
          }));
        } catch (loadError) {
          console.error('Ошибка загрузки деталей товара:', loadError);
        }

        // Если пользователь авторизован, синхронизируем с сервером
        if (userJwt) {
          console.log('Отправка запроса на добавление товара в избранное, ID:', product.id);
          await axios.post(`${API_URL}/api/favorites`,
            { productId: product.id },
            { headers: { Authorization: `Bearer ${userJwt}` } }
          );

        }
      }
    } catch (error) {
      console.error('Ошибка при обновлении избранного:', error);
      if (!isInFavorites) {
        dispatch(favoritesActions.remove(product.id));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={cn(styles.btn, className, {
        [styles.active]: isInFavorites,
        [styles.loading]: isLoading
      })}
      onClick={handleToggleFavorite}
      {...props}
      ref={ref}
      type="button"
      disabled={isLoading}
      aria-label={isInFavorites ? 'Удалить из избранного' : 'Добавить в избранное'}
    >
      {isLoading ? (
        <span className={styles.loader}></span>
      ) : (
        <HeartIcon className={styles.icon} />
      )}
    </button>
  );
};

export default FavoritesButton;
