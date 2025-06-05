import { configureStore } from '@reduxjs/toolkit';
import userSlice, { JWT_PERSISTENT_STATE } from './user.slice.ts';
import { saveState } from './storage.ts';
import cartSlice from './cart.slice.ts';
import favoritesSlice from './favorites.slice.ts';

export const store = configureStore({
  reducer: {
    user: userSlice,
    cart: cartSlice,
    favorites: favoritesSlice
  }
});

store.subscribe(() => {
  saveState({ jwt: store.getState().user.jwt }, JWT_PERSISTENT_STATE);
  // Корзина и избранные сохраняются вручную в соответствующих slice для контроля над тем что сохраняется
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
