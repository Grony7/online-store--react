import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loadState, saveState } from './storage.ts';
import axios, { AxiosError } from 'axios';
import { LoginResponse, RegisterResponse, ForgotPasswordResponse, ResetPasswordResponse } from '../interfaces/auth.interface.ts';

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
  updateProfileErrorMessage?: string;
  forgotPasswordErrorMessage?: string;
  resetPasswordErrorMessage?: string;
  forgotPasswordSuccessMessage?: string;
  profile?: IProfile;
  isUpdatingProfile?: boolean;
  isForgotPasswordLoading?: boolean;
  isResetPasswordLoading?: boolean;
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
    const {data} = await axios.get<IProfile>(`${import.meta.env.VITE_API_URL}/api/profile/me`, {
      headers: {
        Authorization: `Bearer ${jwt}`
      }
    });
    return data;
  }
);

export interface UpdateProfileDto {
  name?: string;
  email?: string;
  phone?: string;
  birthdate?: string;
  gender?: string;
  avatarFile?: File;
}

interface UpdateProfileRequest {
  name?: string;
  email?: string;
  username?: string;
  phone?: string;
  birthdate?: string;
  gender?: string;
}

export const updateProfile = createAsyncThunk<IProfile, UpdateProfileDto, {state: RootState}>(
  'user/updateProfile',
  async (profileData, thunkAPI) => {
    try {
      const jwt = thunkAPI.getState().user.jwt;
      
      if (!jwt) {
        throw new Error('Пользователь не авторизован');
      }
      
      // Определяем тип запроса - multipart если есть файл, иначе JSON
      let requestData: FormData | UpdateProfileRequest;
      
      if (profileData.avatarFile instanceof File) {
        // Если есть файл аватара, используем FormData
        const formData = new FormData();
        
        if (profileData.name !== undefined) formData.append('name', profileData.name);
        if (profileData.email !== undefined) {
          formData.append('email', profileData.email);
          formData.append('username', profileData.email);
        }
        if (profileData.phone !== undefined) formData.append('phone', profileData.phone);
        if (profileData.birthdate !== undefined) formData.append('birthdate', profileData.birthdate);
        if (profileData.gender !== undefined) formData.append('gender', profileData.gender);
        
        // Добавляем файл аватара
        formData.append('files.avatar', profileData.avatarFile);
        
        requestData = formData;
      } else {
        // Если файла нет, используем обычный JSON
        const updateData: UpdateProfileRequest = {};
        
        if (profileData.name !== undefined) updateData.name = profileData.name;
        if (profileData.email !== undefined) {
          updateData.email = profileData.email;
          updateData.username = profileData.email;
        }
        if (profileData.phone !== undefined) updateData.phone = profileData.phone;
        if (profileData.birthdate !== undefined) updateData.birthdate = profileData.birthdate;
        if (profileData.gender !== undefined) updateData.gender = profileData.gender;
        
        requestData = updateData;
      }
      
      // Отправляем запрос на обновление профиля
      const headers: Record<string, string> = {
        Authorization: `Bearer ${jwt}`
      };
      
      // Для JSON запросов добавляем Content-Type, для FormData axios сам установит правильный
      if (!(requestData instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }
      
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/profile/update`, 
        requestData, 
        { headers }
      );
      
      // После обновления профиля получаем обновленные данные пользователя
      const response = await axios.get<IProfile>(`${import.meta.env.VITE_API_URL}/api/profile/me`, {
        headers: {
          Authorization: `Bearer ${jwt}`
        }
      });
      
      return response.data;
    } catch (e) {
      console.error('Ошибка при обновлении профиля:', e);
      if (e instanceof AxiosError) {
        const errorMessage = e.response?.data?.error?.message || 
                           e.response?.data?.message || 
                           'Ошибка обновления профиля';
        throw new Error(errorMessage);
      }
      throw new Error('Ошибка обновления профиля');
    }
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

export const forgotPassword = createAsyncThunk('user/forgotPassword',
  async (params: { email: string }) => {
    try {
      const { data } = await axios.post<ForgotPasswordResponse>(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
        email: params.email
      });
      return data;
    } catch (e) {
      if (e instanceof AxiosError) {
        throw new Error(e.response?.data.error?.message || 'Ошибка при отправке письма для восстановления пароля');
      }
      throw new Error('Ошибка при отправке письма для восстановления пароля');
    }
  }
);

export const resetPassword = createAsyncThunk('user/resetPassword',
  async (params: { code: string; password: string; passwordConfirmation: string }) => {
    try {
      const { data } = await axios.post<ResetPasswordResponse>(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        code: params.code,
        password: params.password,
        passwordConfirmation: params.passwordConfirmation
      });
      saveState<UserPersistentState>({ jwt: data.jwt }, JWT_PERSISTENT_STATE);
      return data;
    } catch (e) {
      if (e instanceof AxiosError) {
        throw new Error(e.response?.data.error?.message || 'Ошибка при сбросе пароля');
      }
      throw new Error('Ошибка при сбросе пароля');
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

    clearUpdateProfileError: (state) => {
      state.updateProfileErrorMessage = undefined;
    },

    clearForgotPasswordError: (state) => {
      state.forgotPasswordErrorMessage = undefined;
    },

    clearResetPasswordError: (state) => {
      state.resetPasswordErrorMessage = undefined;
    },

    clearForgotPasswordSuccess: (state) => {
      state.forgotPasswordSuccessMessage = undefined;
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

    builder.addCase(updateProfile.pending, (state) => {
      state.isUpdatingProfile = true;
      state.updateProfileErrorMessage = undefined;
    });

    builder.addCase(updateProfile.fulfilled, (state, action) => {
      state.profile = action.payload;
      state.isUpdatingProfile = false;
    });

    builder.addCase(updateProfile.rejected, (state, action) => {
      state.isUpdatingProfile = false;
      state.updateProfileErrorMessage = action.error.message;
    });

    // Forgot Password handlers
    builder.addCase(forgotPassword.pending, (state) => {
      state.isForgotPasswordLoading = true;
      state.forgotPasswordErrorMessage = undefined;
      state.forgotPasswordSuccessMessage = undefined;
    });

    builder.addCase(forgotPassword.fulfilled, (state) => {
      state.isForgotPasswordLoading = false;
      state.forgotPasswordSuccessMessage = 'Письмо с инструкциями для восстановления пароля отправлено на ваш email';
    });

    builder.addCase(forgotPassword.rejected, (state, action) => {
      state.isForgotPasswordLoading = false;
      state.forgotPasswordErrorMessage = action.error.message;
    });

    // Reset Password handlers
    builder.addCase(resetPassword.pending, (state) => {
      state.isResetPasswordLoading = true;
      state.resetPasswordErrorMessage = undefined;
    });

    builder.addCase(resetPassword.fulfilled, (state, action) => {
      state.isResetPasswordLoading = false;
      if (action.payload) {
        state.jwt = action.payload.jwt;
      }
    });

    builder.addCase(resetPassword.rejected, (state, action) => {
      state.isResetPasswordLoading = false;
      state.resetPasswordErrorMessage = action.error.message;
    });
  }
});
export default userSlice.reducer;
export const userActions = userSlice.actions;
