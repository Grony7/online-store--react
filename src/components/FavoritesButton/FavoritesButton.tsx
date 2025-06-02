/// <reference types="vite-plugin-svgr/client" />

import styles from './FavoritesButton.module.scss';
import { FavoritesButtonProps } from './FavoritesButton.props.ts';
import cn from 'classnames';
import HeartIcon from './heart.svg?react';
import { useDispatch, useSelector } from 'react-redux';
import { favoritesActions } from '../../store/favorites.slice.ts';
import { RootState } from '../../store/store.ts';
import { useState } from 'react';
import axios from 'axios';

const FavoritesButton = ({ ref, className, product, isFavorite, ...props }: FavoritesButtonProps) => {
  const dispatch = useDispatch();
  const favorites = useSelector((state: RootState) => state.favorites.items);
  const userJwt = useSelector((state: RootState) => state.user.jwt);
  const isInFavorites = isFavorite !== undefined ? 
    isFavorite : 
    favorites.some(item => item.id === product.id);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleFavorite = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!product || !product.id) {
      console.error('Ошибка: товар не определен или не имеет ID');
      return;
    }
    
    console.log('Обработка клика по кнопке избранного:', { product, isInFavorites });
    setIsLoading(true);
    
    try {
      if (isInFavorites) {
        // Удаляем из избранного в Redux
        dispatch(favoritesActions.remove(product.id));
        
        // Если пользователь авторизован, синхронизируем с сервером
        if (userJwt) {
          console.log('Отправка запроса на удаление товара из избранного, ID:', product.id);
          // Используем запрос DELETE на эндпоинт /favorites/ID
          const response = await axios.delete(`${import.meta.env.VITE_API_URL}/api/favorites/${product.id}`, {
            headers: { Authorization: `Bearer ${userJwt}` }
          });
          console.log('Ответ сервера на удаление из избранного:', response.data);
        }
      } else {
        // Добавляем в избранное в Redux
        dispatch(favoritesActions.add(product));
        
        // Если пользователь авторизован, синхронизируем с сервером
        if (userJwt) {
          console.log('Отправка запроса на добавление товара в избранное, ID:', product.id);
          // Используем POST запрос с productId в теле запроса
          const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/favorites`, 
            { productId: product.id },
            { headers: { Authorization: `Bearer ${userJwt}` } }
          );
          console.log('Ответ сервера на добавление в избранное:', response.data);
        }
      }
    } catch (error) {
      console.error('Ошибка при обновлении избранного:', error);
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
