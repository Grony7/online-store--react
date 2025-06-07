import axios from 'axios';
import { FavoriteItemDetails } from '../interfaces/favorites.interface';

export const favoritesService = {
  // Получение краткой информации о товаре для избранных
  async getFavoriteProductDetails(productId: number, colorId?: number): Promise<FavoriteItemDetails> {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337';
      
      const url = colorId 
        ? `${API_URL}/api/products/brief/${productId}?colorId=${colorId}`
        : `${API_URL}/api/products/brief/${productId}`;
      
      const response = await axios.get(url);
      
      const product = response.data;
      
      // Преобразуем данные для обратной совместимости
      const result = {
        id: product.id,
        title: product.title,
        price: product.price,
        sale_price: product.sale_price,
        on_sale: product.on_sale || false,
        image: product.image,
        quantity: product.quantity,
        color: product.color,
        category: product.category,
        inStock: product.quantity > 0,
        discount_percent: product.sale_price && product.price > product.sale_price
          ? Math.round(((product.price - product.sale_price) / product.price) * 100)
          : 0
      };
      
      return result;
    } catch (error) {
      console.error(`Ошибка при запросе товара ${productId}:`, {
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        productId,
        colorId
      });
      throw error;
    }
  },

  // Получение краткой информации о нескольких товарах с использованием Promise.map
  async getFavoriteProductsDetails(items: Array<{id: number, colorId?: number}>): Promise<FavoriteItemDetails[]> {
    const promises = items.map(item => 
      this.getFavoriteProductDetails(item.id, item.colorId).catch(error => {
        console.error(`Ошибка загрузки товара ${item.id}:`, error);
        return null;
      })
    );
    
    const results = await Promise.all(promises);
    const filteredResults = results.filter(result => result !== null);
    
    return filteredResults;
  },

  // Альтернативный метод с использованием Promise.allSettled для большего контроля
  async getFavoriteProductsDetailsSettled(items: Array<{id: number, colorId?: number}>): Promise<FavoriteItemDetails[]> {
    const promises = items.map(item => 
      this.getFavoriteProductDetails(item.id, item.colorId)
    );

    const results = await Promise.allSettled(promises);
      
    // Фильтруем только успешные результаты
    return results
      .filter((result): result is PromiseFulfilledResult<FavoriteItemDetails> => result.status === 'fulfilled')
      .map(result => result.value);
  }
}; 