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

  // Загружаем данные о товарах
  useEffect(() => {
    const loadItemsData = async () => {
      if (favoriteItems.length === 0) {
        setItems([]);
        return;
      }

      console.log('Загрузка данных избранных товаров:', favoriteItems);

      // Подготавливаем начальное состояние с loading
      const initialItems: FavoriteItemData[] = favoriteItems.map(item => ({
        id: item.id,
        colorId: item.colorId,
        isLoading: true,
        isError: false
      }));
      setItems(initialItems);

      // Создаем запросы для всех товаров
      const requests = favoriteItems.map(async (item): Promise<FavoriteItemData> => {
        try {
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:1337';
          const url = item.colorId 
            ? `${baseUrl}/api/products/brief/${item.id}?colorId=${item.colorId}`
            : `${baseUrl}/api/products/brief/${item.id}`;
          
          console.log('Запрос избранного товара:', { id: item.id, colorId: item.colorId, url });
          
          const response = await axios.get(url);
          console.log('Ответ для избранного товара', item.id, ':', response.data);
          
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
              // Расчетные поля для обратной совместимости
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
        console.log('Результаты загрузки избранных товаров:', results);
        setItems(results);
      } catch (error) {
        console.error('Ошибка при загрузке избранных товаров:', error);
      }
    };

    loadItemsData();
  }, [favoriteItems]);

  // Если пользователь авторизован, синхронизируем избранные товары с сервером
  useEffect(() => {
    const syncWithServer = async () => {
      if (!userJwt) return;
      
      setIsServerLoading(true);
      setServerError(null);
      
      try {
        // Получаем список избранных товаров с сервера
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/favorites`, {
          headers: { Authorization: `Bearer ${userJwt}` }
        });
        
        console.log('Ответ API на запрос избранных товаров:', response.data);
        
        // Извлекаем ID товаров из ответа сервера
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
        
        console.log('Извлеченные ID избранных товаров:', favoriteIds);
        
        // Обновляем состояние Redux только ID-шниками
        if (favoriteIds.length > 0) {
          dispatch(favoritesActions.setItems(favoriteIds));
        } else {
          console.log('Список избранных товаров пуст');
          dispatch(favoritesActions.clear());
        }
      } catch (error) {
        console.error('Ошибка при синхронизации избранных товаров:', error);
        setServerError('Не удалось синхронизировать с сервером. Показываем локальные данные.');
      } finally {
        setIsServerLoading(false);
      }
    };
    
    syncWithServer();
  }, [userJwt, dispatch]);

  // Проверяем общее состояние загрузки
  const isAnyItemLoading = items.some(item => item.isLoading);
  const itemsWithDetails = items.filter(item => item.details);
  const hasErrors = items.some(item => item.isError);

  console.log('Состояние избранных:', {
    totalItems: items.length,
    itemsWithDetails: itemsWithDetails.length,
    loading: isAnyItemLoading,
    serverLoading: isServerLoading,
    hasErrors
  });

  const handleRetryLoad = () => {
    // Перезапускаем загрузку данных
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