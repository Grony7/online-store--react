import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import styles from './Favorites.module.scss';
import ProductCard from '../../components/ProductCard/ProductCard';
import Title from '../../components/Title/Title';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { IProduct } from '../../interfaces/products.interface';
import { favoritesActions } from '../../store/favorites.slice';

const Favorites = () => {
  const dispatch = useDispatch();
  const favorites = useSelector((state: RootState) => state.favorites.items);
  const userJwt = useSelector((state: RootState) => state.user.jwt);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Если пользователь авторизован, загружаем избранные товары с сервера
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!userJwt) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Получаем список избранных товаров
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/favorites`, {
          headers: { Authorization: `Bearer ${userJwt}` }
        });
        
        console.log('Ответ API на запрос избранных товаров:', response.data);
        
        // Предполагаем, что ответ содержит массив товаров
        let productsData: IProduct[] = [];
        
        // В зависимости от формата ответа, выбираем нужные данные
        if (Array.isArray(response.data)) {
          // Если API возвращает просто массив
          productsData = response.data;
        } else if (response.data && response.data.data) {
          // Если API возвращает объект с массивом в свойстве data
          if (Array.isArray(response.data.data)) {
            productsData = response.data.data;
          }
        }
        
        console.log('Извлеченные данные о товарах:', productsData);
        
        // Обновляем состояние Redux
        if (productsData.length > 0) {
          dispatch(favoritesActions.setItems(productsData));
        } else {
          console.log('Список избранных товаров пуст');
          dispatch(favoritesActions.clear());
        }
      } catch (error) {
        console.error('Ошибка при загрузке избранных товаров:', error);
        setError('Не удалось загрузить избранные товары. Пожалуйста, попробуйте позже.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFavorites();
  }, [userJwt, dispatch]);
  
  console.log('Избранные товары в Redux:', favorites);

  return (
    <div className={styles.container}>
      <Title>Избранные товары</Title>
      
      {isLoading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Загрузка избранных товаров...</p>
        </div>
      )}
      
      {error && !isLoading && (
        <div className={styles.error}>
          <p>{error}</p>
          <button 
            className={styles.button}
            onClick={() => window.location.reload()}
          >
            Попробовать снова
          </button>
        </div>
      )}
      
      {!isLoading && !error && favorites.length > 0 ? (
        <div className={styles.grid}>
          {favorites.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              isFavoritePage={true}
            />
          ))}
        </div>
      ) : (
        !isLoading && !error && (
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