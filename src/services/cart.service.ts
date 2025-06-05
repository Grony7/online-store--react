import axios from 'axios';
import { CartItemDetails } from '../interfaces/cart.interface';

export const cartService = {
  // Получение краткой информации о товаре
  async getProductBrief(productId: number, colorId: number): Promise<CartItemDetails> {
    const response = await axios.get<CartItemDetails>(
      `${import.meta.env.VITE_API_URL}/api/products/brief/${productId}?colorId=${colorId}`
    );
    return response.data;
  },

  // Получение краткой информации о нескольких товарах
  async getProductsBrief(items: Array<{id: number, colorId: number}>): Promise<CartItemDetails[]> {
    const promises = items.map(item => 
      this.getProductBrief(item.id, item.colorId)
    );
    
    try {
      const results = await Promise.allSettled(promises);
      return results
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<CartItemDetails>).value);
    } catch (error) {
      console.error('Ошибка при получении данных товаров:', error);
      return [];
    }
  }
}; 