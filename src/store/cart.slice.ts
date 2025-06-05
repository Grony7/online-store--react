import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { loadState, saveState } from './storage.ts';
import { CartState, CartItemBase } from '../interfaces/cart.interface';
import { cartService } from '../services/cart.service';

export const CART_PERSISTENT_STATE = 'cartData';

// Функция для очистки данных перед сохранением в localStorage
const cleanItemsForStorage = (items: CartState['items']): CartItemBase[] => {
  return items.map(item => ({
    id: item.id,
    colorId: item.colorId,
    count: item.count,
    selected: item.selected
  }));
};

// Функция для восстановления данных из localStorage с пометкой для загрузки
const restoreItemsFromStorage = (items: CartItemBase[]): CartState['items'] => {
  return items.map(item => ({
    ...item,
    isLoading: true, // Помечаем что нужно загрузить данные
    isError: false,
    details: undefined
  }));
};

const initialState: CartState = (() => {
  const stored = loadState<{ items: CartItemBase[] }>(CART_PERSISTENT_STATE);
  if (stored && stored.items) {
    return {
      items: restoreItemsFromStorage(stored.items)
    };
  }
  return { items: [] };
})();

// Функция сохранения без details
const saveCartState = (state: CartState) => {
  const cleanedState = {
    items: cleanItemsForStorage(state.items)
  };
  saveState(cleanedState, CART_PERSISTENT_STATE);
};

// Async thunk для загрузки детальной информации о товаре
export const loadCartItemDetails = createAsyncThunk(
  'cart/loadItemDetails',
  async ({ id, colorId }: { id: number; colorId: number }) => {
    const details = await cartService.getProductBrief(id, colorId);
    return { id, colorId, details };
  }
);

// Async thunk для загрузки всех товаров корзины
export const loadAllCartItems = createAsyncThunk(
  'cart/loadAllItems',
  async (_, { getState }) => {
    const state = getState() as { cart: CartState };
    const items = state.cart.items.map(item => ({ id: item.id, colorId: item.colorId }));
    
    if (items.length === 0) return [];
    
    const details = await cartService.getProductsBrief(items);
    return details;
  }
);

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Очистка корзины
    clear: (state): void => {
      state.items = [];
      saveCartState(state);
    },

    // Добавление товара в корзину (только базовая информация)
    add: (state, action: PayloadAction<{id: number, colorId: number, count?: number}>) => {
      const { id, colorId, count = 1 } = action.payload;
      
      // Ищем товар с тем же ID и вариантом цвета
      const existedItemIndex = state.items.findIndex(
        item => item.id === id && item.colorId === colorId
      );
      
      if (existedItemIndex === -1) {
        // Если товара с таким ID и цветом нет, добавляем новый
        state.items.push({
          id,
          colorId,
          count,
          selected: true,
          isLoading: true, // Помечаем что данные загружаются
          isError: false,
          details: undefined
        });
      } else {
        // Если товар уже есть, увеличиваем количество
        state.items[existedItemIndex].count += count;
      }
      
      saveCartState(state);
    },

    // Увеличение количества товара на 1
    increase: (state, action: PayloadAction<{id: number, colorId: number}>) => {
      const { id, colorId } = action.payload;
      
      const item = state.items.find(
        item => item.id === id && item.colorId === colorId
      );
      
      if (item) {
        item.count++;
        saveCartState(state);
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
      
      saveCartState(state);
    },

    // Удаление товара из корзины
    remove: (state, action: PayloadAction<{id: number, colorId: number}>) => {
      const { id, colorId } = action.payload;
      
      state.items = state.items.filter(
        item => !(item.id === id && item.colorId === colorId)
      );
      
      saveCartState(state);
    },
    
    // Установка конкретного количества товара
    setCount: (state, action: PayloadAction<{id: number, colorId: number, count: number}>) => {
      const { id, colorId, count } = action.payload;
      
      const item = state.items.find(
        item => item.id === id && item.colorId === colorId
      );
      
      if (item && count > 0) {
        item.count = count;
        saveCartState(state);
      } else if (item && count <= 0) {
        // Если указано количество <= 0, удаляем товар
        state.items = state.items.filter(
          item => !(item.id === id && item.colorId === colorId)
        );
        saveCartState(state);
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
        saveCartState(state);
      }
    },

    // Выбрать все товары
    selectAll: (state) => {
      state.items.forEach(item => {
        item.selected = true;
      });
      saveCartState(state);
    },

    // Отменить выбор всех товаров
    deselectAll: (state) => {
      state.items.forEach(item => {
        item.selected = false;
      });
      saveCartState(state);
    },

    // Удалить все выбранные товары
    removeSelected: (state) => {
      state.items = state.items.filter(item => !item.selected);
      saveCartState(state);
    }
  },
  
  extraReducers: (builder) => {
    builder
      // Обработка загрузки детальной информации об одном товаре
      .addCase(loadCartItemDetails.pending, (state, action) => {
        const { id, colorId } = action.meta.arg;
        const item = state.items.find(item => item.id === id && item.colorId === colorId);
        if (item) {
          item.isLoading = true;
          item.isError = false;
        }
      })
      .addCase(loadCartItemDetails.fulfilled, (state, action) => {
        const { id, colorId, details } = action.payload;
        const item = state.items.find(item => item.id === id && item.colorId === colorId);
        if (item) {
          item.details = details;
          item.isLoading = false;
          item.isError = false;
        }
      })
      .addCase(loadCartItemDetails.rejected, (state, action) => {
        const { id, colorId } = action.meta.arg;
        const item = state.items.find(item => item.id === id && item.colorId === colorId);
        if (item) {
          item.isLoading = false;
          item.isError = true;
        }
      })
      
      // Обработка загрузки всех товаров
      .addCase(loadAllCartItems.pending, (state) => {
        state.items.forEach(item => {
          item.isLoading = true;
          item.isError = false;
        });
      })
      .addCase(loadAllCartItems.fulfilled, (state, action) => {
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
      .addCase(loadAllCartItems.rejected, (state) => {
        state.items.forEach(item => {
          item.isLoading = false;
          item.isError = true;
        });
      });
  }
});

export default cartSlice.reducer;
export const cartActions = cartSlice.actions;
