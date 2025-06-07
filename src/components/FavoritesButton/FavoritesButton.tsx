/// <reference types="vite-plugin-svgr/client" />
import styles from './FavoritesButton.module.scss';
import { FavoritesButtonProps } from './FavoritesButton.props.ts';
import cn from 'classnames';
import HeartIcon from './heart.svg?react';
import { useDispatch, useSelector } from 'react-redux';
import { favoritesActions } from '../../store/favorites.slice.ts';
import { RootState, AppDispatch } from '../../store/store.ts';
import { useState } from 'react';

import { favoritesService } from '../../services/favorites.service.ts';


const FavoritesButton = ({ ref, className, product, isFavorite, ...props }: FavoritesButtonProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const favorites = useSelector((state: RootState) => state.favorites.items);
  const isInFavorites = isFavorite !== undefined ?
    isFavorite :
    favorites.some(item => item.id === product.id);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleFavorite = async () => {
    if (!product || !product.id) {
      console.error('Ошибка: товар не определен или не имеет ID');
      return;
    }

    setIsLoading(true);

    try {
      if (isInFavorites) {
        dispatch(favoritesActions.removeItem({ id: product.id, colorId: product.colorId }));
      } else {
        if (!product.title && product.id) {
          try {
            const details = await favoritesService.getFavoriteProductDetails(product.id, product.colorId);
            
            if (details) {
              dispatch(favoritesActions.addItem({ id: product.id, colorId: product.colorId }));
            }
          } catch (loadError) {
            console.error('Ошибка загрузки деталей товара:', loadError);
            return;
          }
        } else {
          dispatch(favoritesActions.addItem({ id: product.id, colorId: product.colorId }));
        }
      }
      
      dispatch(favoritesActions.saveToStorage());
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
