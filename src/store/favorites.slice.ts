import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { favoritesService } from '../services/favorites.service';
import { FavoriteItemBase } from '../interfaces/favorites.interface';

interface FavoritesState {
  items: FavoriteItemBase[];
}

const initialState: FavoritesState = {
  items: []
};

// Загрузка состояния из localStorage
export const loadFavoritesState = (): FavoriteItemBase[] => {
  try {
    const stored = localStorage.getItem('favorites');
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    }
    return [];
  } catch (error) {
    console.error('Ошибка загрузки избранного из localStorage:', error);
    return [];
  }
};

// Загрузка данных об избранных товарах с сервера (детальная информация)
export const loadAllFavoriteItems = createAsyncThunk(
  'favorites/loadAllFavoriteItems',
  async (_, { getState }) => {
    const state = getState() as { favorites: FavoritesState };
    const { items } = state.favorites;
    
    if (items.length === 0) {
      return [];
    }
    
    const details = await favoritesService.getFavoriteProductsDetailsSettled(items);
    return details;
  }
);

export const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    // Загрузка состояния из localStorage
    loadFromStorage: (state, action: PayloadAction<FavoriteItemBase[]>) => {
      const stored = action.payload;
      state.items = stored;
    },

    // Сохранение в localStorage
    saveToStorage: (state) => {
      try {
        const cleanedState = state.items.filter(
          item => item.id != null && !isNaN(Number(item.id))
        );
        state.items = cleanedState;
        localStorage.setItem('favorites', JSON.stringify(cleanedState));
      } catch (error) {
        console.error('Ошибка сохранения в localStorage:', error);
      }
    },

    addItem: (state, action: PayloadAction<FavoriteItemBase>) => {
      const { id, colorId } = action.payload;
      
      // Проверяем, не добавлен ли уже товар
      const existingIndex = state.items.findIndex(
        item => item.id === id && item.colorId === colorId
      );
      
      if (existingIndex === -1) {
        state.items.push({ id, colorId });
      }
    },

    removeItemByProductId: (state, action: PayloadAction<number>) => {
      const productId = action.payload;
      state.items = state.items.filter(item => item.id !== productId);
    },
    
    removeItem: (state, action: PayloadAction<{ id: number; colorId?: number }>) => {
      const { id, colorId } = action.payload;
      state.items = state.items.filter(
        item => !(item.id === id && item.colorId === colorId)
      );
    },

    clear: (state) => {
      state.items = [];
    },

    setItems: (state, action: PayloadAction<FavoriteItemBase[]>) => {
      state.items = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadAllFavoriteItems.pending, () => {
        // Обработка состояния загрузки
      })
      .addCase(loadAllFavoriteItems.fulfilled, () => {
        // Данные загружены успешно
      })
      .addCase(loadAllFavoriteItems.rejected, () => {
        // Обработка ошибки загрузки
      });
  }
});

export const favoritesActions = {
  ...favoritesSlice.actions,
  loadAllFavoriteItems
};

export default favoritesSlice.reducer; 