import axios, { AxiosError } from 'axios';
import { FavoriteItemDetails } from '../interfaces/favorites.interface';

export const favoritesService = {
  // Получение краткой информации о товаре для избранных
  async getFavoriteProductDetails(productId: number, colorId?: number): Promise<FavoriteItemDetails> {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:1337';
    const url = colorId 
      ? `${baseUrl}/api/products/brief/${productId}?colorId=${colorId}`
      : `${baseUrl}/api/products/brief/${productId}`;
      
    console.log('Переменные окружения:', {
      VITE_API_URL: import.meta.env.VITE_API_URL,
      baseUrl,
      finalUrl: url
    });
    console.log('Отправка запроса для товара:', { productId, colorId, url });
    
    try {
      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Получен ответ API для товара', productId, ':', response.data);
      
      const data = response.data;
      
      // Преобразуем данные для совместимости
      const result: FavoriteItemDetails = {
        id: data.id,
        title: data.title,
        price: data.price,
        sale_price: data.sale_price,
        on_sale: data.on_sale,
        image: data.image,
        quantity: data.quantity,
        color: data.color,
        // Расчетные поля для обратной совместимости
        inStock: data.quantity > 0,
        discount_percent: data.sale_price && data.price > data.sale_price 
          ? Math.round(((data.price - data.sale_price) / data.price) * 100)
          : 0
      };
      
      console.log('Преобразованные данные для товара', productId, ':', result);
      return result;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(`Ошибка при запросе товара ${productId}:`, {
        url,
        error: axiosError.response?.data || axiosError.message,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText
      });
      throw error;
    }
  },

  // Получение краткой информации о нескольких товарах с использованием Promise.map
  async getFavoriteProductsDetails(items: Array<{id: number, colorId?: number}>): Promise<FavoriteItemDetails[]> {
    console.log('Запрос деталей для массива товаров:', items);
    
    const promises = items.map(item => 
      this.getFavoriteProductDetails(item.id, item.colorId)
        .catch(error => {
          console.error(`Ошибка загрузки товара ${item.id}:`, error);
          return null; // Возвращаем null для неудачных запросов
        })
    );
    
    try {
      const results = await Promise.all(promises);
      // Фильтруем null значения (неудачные запросы)
      const validResults = results.filter(result => result !== null) as FavoriteItemDetails[];
      console.log('Результат загрузки массива товаров:', { 
        requested: items.length, 
        successful: validResults.length,
        results: validResults
      });
      return validResults;
    } catch (error) {
      console.error('Ошибка при получении данных избранных товаров:', error);
      return [];
    }
  },

  // Альтернативный метод с использованием Promise.allSettled для большего контроля
  async getFavoriteProductsDetailsSettled(items: Array<{id: number, colorId?: number}>): Promise<FavoriteItemDetails[]> {
    console.log('Запрос деталей для массива товаров (settled):', items);
    
    const promises = items.map(item => 
      this.getFavoriteProductDetails(item.id, item.colorId)
    );
    
    try {
      const results = await Promise.allSettled(promises);
      const validResults = results
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<FavoriteItemDetails>).value);
        
      console.log('Результат загрузки массива товаров (settled):', { 
        requested: items.length, 
        successful: validResults.length,
        failed: results.length - validResults.length,
        results: validResults
      });
      
      return validResults;
    } catch (error) {
      console.error('Ошибка при получении данных избранных товаров:', error);
      return [];
    }
  }
}; 