export interface LoginResponse {
  jwt: string;
}

export interface RegisterResponse {
  jwt: string;
}

export interface ForgotPasswordResponse {
  ok: boolean;
}

export interface ResetPasswordResponse {
  jwt: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}
