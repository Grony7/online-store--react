import { configureStore } from '@reduxjs/toolkit';
import userSlice, { JWT_PERSISTENT_STATE } from './user.slice.ts';
import { saveState } from './storage.ts';
import cartSlice, { CART_PERSISTENT_STATE } from './cart.slice.ts';
import favoritesSlice, { FAVORITES_PERSISTENT_STATE } from './favorites.slice.ts';

export const store = configureStore({
  reducer: {
    user: userSlice,
    cart: cartSlice,
    favorites: favoritesSlice
  }
});

store.subscribe(() => {
  saveState({ jwt: store.getState().user.jwt }, JWT_PERSISTENT_STATE);
  saveState( store.getState().cart, CART_PERSISTENT_STATE);
  saveState( store.getState().favorites, FAVORITES_PERSISTENT_STATE);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
