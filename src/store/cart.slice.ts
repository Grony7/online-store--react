import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loadState, saveState } from './storage.ts';

export const CART_PERSISTENT_STATE = 'cartData';

export interface CartItem {
  id: number;        // ID продукта
  colorId: number;   // ID выбранного цвета
  count: number;     // Количество товаров
  name: string;      // Название продукта
  price: number;     // Цена продукта
  sale_price?: number | null; // Цена со скидкой (если есть)
  image: string;     // Ссылка на изображение
  mediaType?: 'image' | 'video'; // Тип медиафайла
  selected?: boolean; // Выбран ли товар (для чекбоксов)
  color: {
    name: string;    // Название цвета
    hex: string;     // Код цвета (HEX)
  };
}

export interface CartState {
  items: CartItem[]
}

const initialState: CartState = loadState<CartState>(CART_PERSISTENT_STATE) ?? {
  items: []
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Очистка корзины
    clear: (state): void => {
      state.items = [];
      saveState<CartState>(state, CART_PERSISTENT_STATE);
    },

    // Добавление товара в корзину
    add: (state, action: PayloadAction<CartItem>) => {
      const { id, colorId } = action.payload;
      
      // Ищем товар с тем же ID и вариантом цвета
      const existedItemIndex = state.items.findIndex(
        item => item.id === id && item.colorId === colorId
      );
      
      if (existedItemIndex === -1) {
        // Если товара с таким ID и цветом нет, добавляем новый
        state.items.push({
          ...action.payload,
          selected: true // По умолчанию новый товар выбран
        });
      } else {
        // Если товар уже есть, увеличиваем количество
        state.items[existedItemIndex].count++;
      }
      
      saveState<CartState>(state, CART_PERSISTENT_STATE);
    },

    // Увеличение количества товара на 1
    increase: (state, action: PayloadAction<{id: number, colorId: number}>) => {
      const { id, colorId } = action.payload;
      
      const item = state.items.find(
        item => item.id === id && item.colorId === colorId
      );
      
      if (item) {
        item.count++;
        saveState<CartState>(state, CART_PERSISTENT_STATE);
      }
    },

    // Уменьшение количества товара на 1
    decrease: (state, action: PayloadAction<{id: number, colorId: number}>) => {
      const { id, colorId } = action.payload;
      
      const existedItemIndex = state.items.findIndex(
        item => item.id === id && item.colorId === colorId
      );
      
      if (existedItemIndex === -1) {
        return;
      }
      
      if (state.items[existedItemIndex].count > 1) {
        // Если количество > 1, уменьшаем на 1
        state.items[existedItemIndex].count--;
      } else {
        // Если количество = 1, удаляем товар из корзины
        state.items = state.items.filter(
          item => !(item.id === id && item.colorId === colorId)
        );
      }
      
      saveState<CartState>(state, CART_PERSISTENT_STATE);
    },

    // Удаление товара из корзины
    remove: (state, action: PayloadAction<{id: number, colorId: number}>) => {
      const { id, colorId } = action.payload;
      
      state.items = state.items.filter(
        item => !(item.id === id && item.colorId === colorId)
      );
      
      saveState<CartState>(state, CART_PERSISTENT_STATE);
    },
    
    // Установка конкретного количества товара
    setCount: (state, action: PayloadAction<{id: number, colorId: number, count: number}>) => {
      const { id, colorId, count } = action.payload;
      
      const item = state.items.find(
        item => item.id === id && item.colorId === colorId
      );
      
      if (item && count > 0) {
        item.count = count;
        saveState<CartState>(state, CART_PERSISTENT_STATE);
      } else if (item && count <= 0) {
        // Если указано количество <= 0, удаляем товар
        state.items = state.items.filter(
          item => !(item.id === id && item.colorId === colorId)
        );
        saveState<CartState>(state, CART_PERSISTENT_STATE);
      }
    },

    // Выбрать или отменить выбор товара
    toggleSelectItem: (state, action: PayloadAction<{id: number, colorId: number}>) => {
      const { id, colorId } = action.payload;
      
      const item = state.items.find(
        item => item.id === id && item.colorId === colorId
      );
      
      if (item) {
        item.selected = !item.selected;
        saveState<CartState>(state, CART_PERSISTENT_STATE);
      }
    },

    // Выбрать все товары
    selectAll: (state) => {
      state.items.forEach(item => {
        item.selected = true;
      });
      saveState<CartState>(state, CART_PERSISTENT_STATE);
    },

    // Отменить выбор всех товаров
    deselectAll: (state) => {
      state.items.forEach(item => {
        item.selected = false;
      });
      saveState<CartState>(state, CART_PERSISTENT_STATE);
    },

    // Удалить все выбранные товары
    removeSelected: (state) => {
      state.items = state.items.filter(item => !item.selected);
      saveState<CartState>(state, CART_PERSISTENT_STATE);
    }
  }
});

export default cartSlice.reducer;
export const cartActions = cartSlice.actions;
