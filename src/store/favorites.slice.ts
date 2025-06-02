import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IProduct } from '../interfaces/products.interface';
import { loadState, saveState } from './storage.ts';

export const FAVORITES_PERSISTENT_STATE = 'favorites';

export interface FavoritesState {
  items: IProduct[];
}

// Загружаем состояние из localStorage
const storedState = loadState<FavoritesState>(FAVORITES_PERSISTENT_STATE);
console.log('Загружено состояние из localStorage:', storedState);

const initialState: FavoritesState = {
  items: storedState?.items || []
};

export const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    // Добавление товара в избранное
    add: (state, action: PayloadAction<IProduct>) => {
      const isExist = state.items.some(item => item.id === action.payload.id);
      if (!isExist) {
        state.items.push(action.payload);
        // Сохраняем состояние в localStorage
        saveState({ items: state.items }, FAVORITES_PERSISTENT_STATE);
        console.log('Товар добавлен в избранное:', action.payload);
      }
    },
    // Удаление товара из избранного
    remove: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      // Сохраняем состояние в localStorage
      saveState({ items: state.items }, FAVORITES_PERSISTENT_STATE);
      console.log('Товар удален из избранного, ID:', action.payload);
    },
    // Очистка списка избранных товаров
    clear: (state) => {
      state.items = [];
      // Сохраняем состояние в localStorage
      saveState({ items: [] }, FAVORITES_PERSISTENT_STATE);
      console.log('Список избранных товаров очищен');
    },
    // Установка списка избранных товаров (например, при загрузке с сервера)
    setItems: (state, action: PayloadAction<IProduct[]>) => {
      state.items = action.payload;
      // Сохраняем состояние в localStorage
      saveState({ items: action.payload }, FAVORITES_PERSISTENT_STATE);
      console.log('Установлен список избранных товаров:', action.payload);
    }
  }
});

export const favoritesActions = favoritesSlice.actions;
export default favoritesSlice.reducer; 