import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import styles from './Favorites.module.scss';
import Title from '../../components/Title/Title';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { favoritesActions } from '../../store/favorites.slice';
import FavoriteCard from '../../components/FavoriteCard/FavoriteCard';

interface FavoriteItemData {
  id: number;
  colorId?: number;
  details?: {
    id: number;
    title: string;
    price: number;
    sale_price: number | null;
    on_sale: boolean;
    image: string;
    quantity: number;
    color: {
      name: string;
      hex_code: string;
    };
    inStock?: boolean;
    discount_percent?: number;
  };
  isLoading?: boolean;
  isError?: boolean;
}

const Favorites = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: favoriteItems } = useSelector((state: RootState) => state.favorites);
  const userJwt = useSelector((state: RootState) => state.user.jwt);
  const [items, setItems] = useState<FavoriteItemData[]>([]);
  const [isServerLoading, setIsServerLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (favoriteItems.length === 0) {
      setItems([]);
      return;
    }

    const loadItemsData = async () => {
      const requests = favoriteItems.map(async (item): Promise<FavoriteItemData> => {
        try {
          const baseUrl = import.meta.env.VITE_API_URL;
          const url = item.colorId 
            ? `${baseUrl}/api/products/brief/${item.id}?colorId=${item.colorId}`
            : `${baseUrl}/api/products/brief/${item.id}`;
          
          const response = await axios.get(url);
          
          return {
            id: item.id,
            colorId: item.colorId,
            details: {
              id: response.data.id,
              title: response.data.title,
              price: response.data.price,
              sale_price: response.data.sale_price,
              on_sale: response.data.on_sale || false,
              image: response.data.image,
              quantity: response.data.quantity,
              color: response.data.color,
              inStock: response.data.quantity > 0,
              discount_percent: response.data.sale_price && response.data.price > response.data.sale_price 
                ? Math.round(((response.data.price - response.data.sale_price) / response.data.price) * 100)
                : 0
            },
            isLoading: false,
            isError: false
          };
        } catch {
          return {
            id: item.id,
            colorId: item.colorId,
            isLoading: false,
            isError: true
          };
        }
      });

      try {
        const results = await Promise.all(requests);
        setItems(results);
      } catch (error) {
        console.error('Ошибка при загрузке избранных товаров:', error);
      }
    };

    loadItemsData();
  }, [favoriteItems]);

  useEffect(() => {
    const syncWithServer = async () => {
      if (!userJwt) return;
      
      setIsServerLoading(true);
      setServerError(null);
      
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/favorites`, {
          headers: { Authorization: `Bearer ${userJwt}` }
        });
        
        let favoriteIds: Array<{id: number, colorId?: number}> = [];
        
        if (Array.isArray(response.data)) {
          favoriteIds = response.data.map((item: {id: number, colorId?: number}) => ({ 
            id: item.id, 
            colorId: item.colorId 
          }));
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          favoriteIds = response.data.data.map((item: {id: number, colorId?: number}) => ({ 
            id: item.id, 
            colorId: item.colorId 
          }));
        }
        
      
        // Только обновляем избранные товары, если с сервера пришли данные
        // Не очищаем локальные данные если сервер вернул пустой список
        if (favoriteIds.length > 0) {
          dispatch(favoritesActions.setItems(favoriteIds));
        }
        // Не делаем clear() - оставляем локальные данные
      } catch (error) {
        console.error('Ошибка при синхронизации избранных товаров:', error);
        setServerError('Не удалось синхронизировать с сервером. Показываем локальные данные.');
      } finally {
        setIsServerLoading(false);
      }
    };
    
    syncWithServer();
  }, [userJwt, dispatch]);

  const isAnyItemLoading = items.some(item => item.isLoading);
  const itemsWithDetails = items.filter(item => item.details);
  const hasErrors = items.some(item => item.isError);

  const handleRetryLoad = () => {
    const loadItemsData = async () => {
      const requests = favoriteItems.map(async (item): Promise<FavoriteItemData> => {
        try {
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:1337';
          const url = item.colorId 
            ? `${baseUrl}/api/products/brief/${item.id}?colorId=${item.colorId}`
            : `${baseUrl}/api/products/brief/${item.id}`;
          
          const response = await axios.get(url);
          
          return {
            id: item.id,
            colorId: item.colorId,
            details: {
              id: response.data.id,
              title: response.data.title,
              price: response.data.price,
              sale_price: response.data.sale_price,
              on_sale: response.data.on_sale || false,
              image: response.data.image,
              quantity: response.data.quantity,
              color: response.data.color,
              inStock: response.data.quantity > 0,
              discount_percent: response.data.sale_price && response.data.price > response.data.sale_price 
                ? Math.round(((response.data.price - response.data.sale_price) / response.data.price) * 100)
                : 0
            },
            isLoading: false,
            isError: false
          };
        } catch {
          return {
            id: item.id,
            colorId: item.colorId,
            isLoading: false,
            isError: true
          };
        }
      });

      try {
        const results = await Promise.all(requests);
        setItems(results);
      } catch (error) {
        console.error('Ошибка при повторной загрузке избранных товаров:', error);
      }
    };

    loadItemsData();
  };

  return (
    <div className={styles.container}>
      <Title>Избранные товары</Title>
      
      {(isServerLoading || isAnyItemLoading) && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>
            {isServerLoading ? 'Синхронизация с сервером...' : 'Загрузка избранных товаров...'}
          </p>
        </div>
      )}
      
      {serverError && (
        <div className={styles.warning}>
          <p>{serverError}</p>
        </div>
      )}
      
      {hasErrors && !isAnyItemLoading && (
        <div className={styles.error}>
          <p>Некоторые товары не удалось загрузить</p>
          <button 
            className={styles.button}
            onClick={handleRetryLoad}
          >
            Попробовать снова
          </button>
        </div>
      )}
      
      {!isServerLoading && !isAnyItemLoading && itemsWithDetails.length > 0 ? (
        <div className={styles.grid}>
          {itemsWithDetails.map(favorite => (
            favorite.details && (
              <FavoriteCard 
                key={`${favorite.id}-${favorite.colorId || 'default'}`} 
                product={{
                  id: favorite.details.id,
                  title: favorite.details.title,
                  price: favorite.details.price,
                  image: favorite.details.image,
                  inStock: favorite.details.inStock || false,
                  colorId: favorite.colorId
                }} 
              />
            )
          ))}
        </div>
      ) : (
        !isServerLoading && !isAnyItemLoading && (
          <div className={styles.empty}>
            <p>У вас пока нет избранных товаров</p>
            <a href="/" className={styles.button}>Перейти к покупкам</a>
          </div>
        )
      )}
    </div>
  );
};

export default Favorites; 