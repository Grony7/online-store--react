import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { loadState, saveState } from './storage.ts';
import { FavoritesState, FavoriteItemBase } from '../interfaces/favorites.interface';
import { favoritesService } from '../services/favorites.service';

export const FAVORITES_PERSISTENT_STATE = 'favorites';

// Функция для очистки данных перед сохранением в localStorage
const cleanItemsForStorage = (items: FavoritesState['items']): FavoriteItemBase[] => {
  return items.map(item => ({
    id: item.id,
    colorId: item.colorId
  }));
};

// Функция для восстановления данных из localStorage с пометкой для загрузки
const restoreItemsFromStorage = (items: FavoriteItemBase[]): FavoritesState['items'] => {
  return items.map(item => ({
    ...item,
    isLoading: true, // Помечаем что нужно загрузить данные
    isError: false,
    details: undefined
  }));
};

const initialState: FavoritesState = (() => {
  const stored = loadState<{ items: FavoriteItemBase[] }>(FAVORITES_PERSISTENT_STATE);
  console.log('Загружено состояние избранных из localStorage:', stored);
  
  if (stored && stored.items) {
    return {
      items: restoreItemsFromStorage(stored.items)
    };
  }
  return { items: [] };
})();

// Функция сохранения без details
const saveFavoritesState = (state: FavoritesState) => {
  const cleanedState = {
    items: cleanItemsForStorage(state.items)
  };
  saveState(cleanedState, FAVORITES_PERSISTENT_STATE);
  console.log('Сохранено состояние избранных:', cleanedState);
};

// Async thunk для загрузки детальной информации об одном товаре
export const loadFavoriteItemDetails = createAsyncThunk(
  'favorites/loadItemDetails',
  async ({ id, colorId }: { id: number; colorId?: number }) => {
    const details = await favoritesService.getFavoriteProductDetails(id, colorId);
    return { id, colorId, details };
  }
);

// Async thunk для загрузки всех избранных товаров
export const loadAllFavoriteItems = createAsyncThunk(
  'favorites/loadAllItems',
  async (_, { getState }) => {
    console.log('loadAllFavoriteItems thunk запущен');
    
    const state = getState() as { favorites: FavoritesState };
    const items = state.favorites.items.map(item => ({ id: item.id, colorId: item.colorId }));
    
    console.log('Состояние избранных в thunk:', {
      allItems: state.favorites.items,
      itemsToLoad: items
    });
    
    if (items.length === 0) {
      console.log('Нет товаров для загрузки в thunk');
      return [];
    }
    
    console.log('Вызываем favoritesService.getFavoriteProductsDetailsSettled с:', items);
    const details = await favoritesService.getFavoriteProductsDetailsSettled(items);
    console.log('Результат загрузки в thunk:', details);
    return details;
  }
);

export const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    // Добавление товара в избранное (только базовая информация)
    add: (state, action: PayloadAction<{id: number, colorId?: number}>) => {
      const { id, colorId } = action.payload;
      
      // Проверяем, нет ли уже такого товара
      const isExist = state.items.some(item => 
        item.id === id && item.colorId === colorId
      );
      
      if (!isExist) {
        state.items.push({
          id,
          colorId,
          isLoading: true,
          isError: false,
          details: undefined
        });
        
        saveFavoritesState(state);
        console.log('Товар добавлен в избранное:', { id, colorId });
      }
    },

    // Удаление товара из избранного
    remove: (state, action: PayloadAction<number>) => {
      const productId = action.payload;
      state.items = state.items.filter(item => item.id !== productId);
      
      saveFavoritesState(state);
      console.log('Товар удален из избранного, ID:', productId);
    },
    
    // Удаление товара из избранного с учетом цвета
    removeItem: (state, action: PayloadAction<{id: number, colorId?: number}>) => {
      const { id, colorId } = action.payload;
      state.items = state.items.filter(item => 
        item.id !== id || item.colorId !== colorId
      );
      
      saveFavoritesState(state);
      console.log('Товар удален из избранного:', { id, colorId });
    },

    // Очистка списка избранных товаров
    clear: (state) => {
      state.items = [];
      saveFavoritesState(state);
      console.log('Список избранных товаров очищен');
    },

    // Установка списка избранных товаров (для синхронизации с сервером)
    setItems: (state, action: PayloadAction<Array<{id: number, colorId?: number}>>) => {
      state.items = action.payload.map(item => ({
        ...item,
        isLoading: true,
        isError: false,
        details: undefined
      }));
      
      saveFavoritesState(state);
      console.log('Установлен список избранных товаров:', action.payload);
    }
  },

  extraReducers: (builder) => {
    builder
      // Обработка загрузки детальной информации об одном товаре
      .addCase(loadFavoriteItemDetails.pending, (state, action) => {
        const { id, colorId } = action.meta.arg;
        const item = state.items.find(item => 
          item.id === id && item.colorId === colorId
        );
        if (item) {
          item.isLoading = true;
          item.isError = false;
        }
      })
      .addCase(loadFavoriteItemDetails.fulfilled, (state, action) => {
        const { id, colorId, details } = action.payload;
        const item = state.items.find(item => 
          item.id === id && item.colorId === colorId
        );
        if (item) {
          item.details = details;
          item.isLoading = false;
          item.isError = false;
        }
      })
      .addCase(loadFavoriteItemDetails.rejected, (state, action) => {
        const { id, colorId } = action.meta.arg;
        const item = state.items.find(item => 
          item.id === id && item.colorId === colorId
        );
        if (item) {
          item.isLoading = false;
          item.isError = true;
        }
      })
      
      // Обработка загрузки всех товаров
      .addCase(loadAllFavoriteItems.pending, (state) => {
        state.items.forEach(item => {
          item.isLoading = true;
          item.isError = false;
        });
      })
      .addCase(loadAllFavoriteItems.fulfilled, (state, action) => {
        const detailsArray = action.payload;
        
        state.items.forEach(item => {
          const details = detailsArray.find(d => d.id === item.id);
          if (details) {
            item.details = details;
            item.isLoading = false;
            item.isError = false;
          } else {
            item.isLoading = false;
            item.isError = true;
          }
        });
      })
      .addCase(loadAllFavoriteItems.rejected, (state) => {
        state.items.forEach(item => {
          item.isLoading = false;
          item.isError = true;
        });
      });
  }
});

export const favoritesActions = favoritesSlice.actions;
export default favoritesSlice.reducer; 