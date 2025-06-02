import { ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

const RequirePaymentAccess = ({ children }: { children: ReactNode }) => {
  const jwt = useSelector((state: RootState) => state.user.jwt);
  const hasAccess = sessionStorage.getItem('payment_access') === 'true';

  // Очищаем маркер доступа после проверки, чтобы предотвратить 
  // доступ при обновлении страницы
  useEffect(() => {
    if (hasAccess) {
      // Задержка очистки для предотвращения проблем с навигацией
      const timer = setTimeout(() => {
        sessionStorage.removeItem('payment_access');
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [hasAccess]);

  // Проверяем авторизацию и доступ к странице
  if (!jwt) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!hasAccess) {
    return <Navigate to="/checkout" replace />;
  }

  return children;
};

export default RequirePaymentAccess; 