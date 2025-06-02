import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loadState, saveState } from './storage.ts';
import axios, { AxiosError } from 'axios';
import { LoginResponse, RegisterResponse } from '../interfaces/auth.interface.ts';

import { RootState } from './store.ts';
import { IProfile } from '../interfaces/user.interface.ts';

export const JWT_PERSISTENT_STATE = 'userData';
export interface UserPersistentState {
  jwt: string | null
}

export interface UserState {
  jwt: string | null;
  loginErrorMessage?: string;
  registerErrorMessage?: string;
  profile?: IProfile;
}

const initialState: UserState = {
  jwt: loadState<UserPersistentState>(JWT_PERSISTENT_STATE)?.jwt ?? null
};

export const login = createAsyncThunk('user/login',
  async (params: {email: string, password: string}) => {
    try {
      const {data} = await axios.post<LoginResponse>(`${import.meta.env.VITE_API_URL}/api/auth/local`, {
        identifier: params.email,
        password: params.password
      });
      saveState<UserPersistentState>({ jwt: data.jwt }, JWT_PERSISTENT_STATE);
      return data;
    } catch (e) {
      if (e instanceof AxiosError) {
        throw new Error(e.response?.data.message || 'Ошибка авторизации');
      }
      throw new Error('Ошибка авторизации');
    }
  }
);

export const getProfile = createAsyncThunk<IProfile, void, {state: RootState}>('user/getProfile',
  async (_, thunkAPI) => {
    const jwt = thunkAPI.getState().user.jwt;
    const {data} = await axios.get<IProfile>(`${import.meta.env.VITE_API_URL}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${jwt}`
      }
    });
    return data;
  }
);

export const registration = createAsyncThunk('user/registration',
  async (params: {email: string, password: string, name: string}) => {
    try {
      const {data} = await axios.post<RegisterResponse>(`${import.meta.env.VITE_API_URL}/api/auth/local/register`, {
        username: params.email,
        email: params.email,
        password: params.password,
        name: params.name
      });
      saveState<UserPersistentState>({ jwt: data.jwt }, JWT_PERSISTENT_STATE);
      return data;
    } catch (e) {
      if (e instanceof AxiosError) {
        throw new Error(e.response?.data.message || 'Ошибка регистрации');
      }
      throw new Error('Ошибка регистрации');
    }
  }
);

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    addJwt: (state: UserState, action: PayloadAction<string>) => {
      state.jwt = action.payload;
      saveState<UserPersistentState>({ jwt: action.payload }, JWT_PERSISTENT_STATE);
    },

    clearLoginError: (state) => {
      state.loginErrorMessage = undefined;
    },

    clearRegisterError: (state) => {
      state.registerErrorMessage = undefined;
    },

    logout: (state: UserState) => {
      state.jwt = null;
      state.profile = undefined;
      saveState<UserPersistentState>({ jwt: null }, JWT_PERSISTENT_STATE);
    }
  },
  extraReducers: (builder) => {
    builder.addCase(login.fulfilled, (state, action) => {
      if (!action.payload) {
        return;
      }
      state.jwt = action.payload.jwt;
    });

    builder.addCase(login.rejected, (state, action) => {
      state.loginErrorMessage = action.error.message;
    });

    builder.addCase(getProfile.fulfilled, (state, action) => {
      state.profile = action.payload;
    });

    builder.addCase(registration.fulfilled, (state, action) => {
      if (!action.payload) {
        return;
      }
      state.jwt = action.payload.jwt;
    });

    builder.addCase(registration.rejected, (state, action) => {
      state.registerErrorMessage = action.error.message;
    });
  }
});
export default userSlice.reducer;
export const userActions = userSlice.actions;
