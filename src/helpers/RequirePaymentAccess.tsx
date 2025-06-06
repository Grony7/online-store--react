import { ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

const RequirePaymentAccess = ({ children }: { children: ReactNode }) => {
  const jwt = useSelector((state: RootState) => state.user.jwt);
  const { id } = useParams<{ id: string }>();
  const hasAccess = sessionStorage.getItem('payment_access') === 'true';

  // Проверяем авторизацию
  if (!jwt) {
    return <Navigate to="/auth/login" replace />;
  }

  // Если у нас есть доступ или существует ID в URL, разрешаем доступ
  if (hasAccess || id) {
    return children;
  }

  // В противном случае перенаправляем на checkout
  return <Navigate to="/checkout" replace />;
};

export default RequirePaymentAccess;
