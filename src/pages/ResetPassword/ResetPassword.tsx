import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './ResetPassword.module.scss';
import { FormEvent, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resetPassword, userActions } from '../../store/user.slice.ts';
import { RootState, AppDispatch } from '../../store/store.ts';

export type ResetPasswordForm = {
  password: {
    value: string;
  };
  passwordConfirmation: {
    value: string;
  };
};

export const ResetPassword = () => {
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordConfirmationError, setPasswordConfirmationError] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({
    password: false,
    passwordConfirmation: false
  });
  
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();
  
  const { 
    resetPasswordErrorMessage, 
    isResetPasswordLoading,
    jwt
  } = useSelector((state: RootState) => state.user);
  
  const [showError, setShowError] = useState<boolean>(false);
  const [code, setCode] = useState<string | null>(null);
  
  // Получаем код из URL параметров
  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (!codeParam) {
      // Если нет кода, перенаправляем на страницу восстановления пароля
      navigate('/auth/forgot-password');
      return;
    }
    setCode(codeParam);
  }, [searchParams, navigate]);
  
  // Если пользователь успешно сбросил пароль (получил JWT), перенаправляем на главную
  useEffect(() => {
    if (jwt) {
      navigate('/');
    }
  }, [jwt, navigate]);
  
  // Показывать ошибку при получении ошибки
  useEffect(() => {
    if (resetPasswordErrorMessage) {
      setShowError(true);
    }
  }, [resetPasswordErrorMessage]);
  
  // Закрыть всплывающее окно ошибки через 5 секунд
  useEffect(() => {
    if (showError) {
      const timer = setTimeout(() => {
        setShowError(false);
        dispatch(userActions.clearResetPasswordError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showError, dispatch]);
  
  // Отметить поле как посещенное
  const handleBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    
    // Запуск валидации для посещенного поля
    const form = document.querySelector('form') as HTMLFormElement;
    if (field === 'password') {
      validatePassword((form.elements.namedItem('password') as HTMLInputElement).value);
    } else if (field === 'passwordConfirmation') {
      const password = (form.elements.namedItem('password') as HTMLInputElement).value;
      const passwordConfirmation = (form.elements.namedItem('passwordConfirmation') as HTMLInputElement).value;
      validatePasswordConfirmation(password, passwordConfirmation);
    }
  };
  
  // Валидация пароля
  const validatePassword = (password: string): boolean => {
    if (password.length < 6) {
      setPasswordError('Пароль должен содержать минимум 6 символов');
      return false;
    }
    setPasswordError(null);
    return true;
  };
  
  // Валидация подтверждения пароля
  const validatePasswordConfirmation = (password: string, passwordConfirmation: string): boolean => {
    if (password !== passwordConfirmation) {
      setPasswordConfirmationError('Пароли не совпадают');
      return false;
    }
    setPasswordConfirmationError(null);
    return true;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!code) {
      return;
    }
    
    dispatch(userActions.clearResetPasswordError());
    
    // Отметить все поля как посещенные при отправке формы
    setTouchedFields({
      password: true,
      passwordConfirmation: true
    });
    
    const target = e.target as typeof e.target & ResetPasswordForm;
    const { password, passwordConfirmation } = target;
    
    // Валидация всех полей
    const isPasswordValid = validatePassword(password.value);
    const isPasswordConfirmationValid = validatePasswordConfirmation(password.value, passwordConfirmation.value);
    
    // Если есть ошибки валидации, не отправляем запрос
    if (!isPasswordValid || !isPasswordConfirmationValid) {
      return;
    }
    
    try {
      await dispatch(resetPassword({ 
        code, 
        password: password.value, 
        passwordConfirmation: passwordConfirmation.value 
      }));
    } catch {
      // Ошибка уже обрабатывается в reducer
      setShowError(true);
    }
  };

  if (!code) {
    return (
      <div className={styles.resetPasswordContainer}>
        <div className={styles.resetPasswordForm}>
          <h2 className={styles.title}>Загрузка...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.resetPasswordContainer}>
      <form className={styles.resetPasswordForm} onSubmit={submit}>
        <h2 className={styles.title}>Новый пароль</h2>
        <p className={styles.description}>
          Введите новый пароль для вашего аккаунта
        </p>
        
        <div className={styles.inputGroup}>
          <label htmlFor="password">Новый пароль</label>
          <input 
            type="password" 
            name="password" 
            id="password" 
            required 
            placeholder="Введите новый пароль"
            onBlur={() => handleBlur('password')}
            disabled={isResetPasswordLoading}
          />
          {touchedFields.password && passwordError && (
            <div className={styles.fieldError}>{passwordError}</div>
          )}
        </div>
        
        <div className={styles.inputGroup}>
          <label htmlFor="passwordConfirmation">Подтвердите пароль</label>
          <input 
            type="password" 
            name="passwordConfirmation" 
            id="passwordConfirmation" 
            required 
            placeholder="Подтвердите новый пароль"
            onBlur={() => handleBlur('passwordConfirmation')}
            disabled={isResetPasswordLoading}
          />
          {touchedFields.passwordConfirmation && passwordConfirmationError && (
            <div className={styles.fieldError}>{passwordConfirmationError}</div>
          )}
        </div>
        
        <button 
          className={styles.submitButton} 
          type="submit"
          disabled={isResetPasswordLoading}
        >
          {isResetPasswordLoading ? 'Сохраняем...' : 'Сохранить пароль'}
        </button>
      </form>
      
      {/* Всплывающее окно с ошибкой */}
      {showError && resetPasswordErrorMessage && (
        <div className={styles.errorPopup}>
          <div className={styles.errorContent}>
            <span className={styles.errorMessage}>{resetPasswordErrorMessage}</span>
            <button 
              className={styles.closeButton} 
              onClick={() => {
                setShowError(false);
                dispatch(userActions.clearResetPasswordError());
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResetPassword; 