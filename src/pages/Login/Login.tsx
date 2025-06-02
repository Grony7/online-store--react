import { Link, useNavigate } from 'react-router-dom';
import styles from './Login.module.scss';
import { FormEvent, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, userActions } from '../../store/user.slice.ts';
import { RootState, AppDispatch } from '../../store/store.ts';

export type LoginForm = {
  email: {
    value: string;
  };
  password: {
    value: string;
  };
};

export const Login = () => {
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({
    email: false,
    password: false
  });
  
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const { loginErrorMessage } = useSelector((state: RootState) => state.user);
  const [showError, setShowError] = useState<boolean>(false);
  
  // Показывать ошибку при получении ошибки авторизации
  useEffect(() => {
    if (loginErrorMessage) {
      setShowError(true);
    }
  }, [loginErrorMessage]);
  
  // Закрыть всплывающее окно ошибки через 5 секунд
  useEffect(() => {
    if (showError) {
      const timer = setTimeout(() => {
        setShowError(false);
        // Очищаем ошибку в сторе
        dispatch(userActions.clearLoginError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showError, dispatch]);
  
  // Отметить поле как посещенное
  const handleBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    
    // Запуск валидации для посещенного поля
    const form = document.querySelector('form') as HTMLFormElement;
    if (field === 'email') {
      validateEmail((form.elements.namedItem('email') as HTMLInputElement).value);
    } else if (field === 'password') {
      validatePassword((form.elements.namedItem('password') as HTMLInputElement).value);
    }
  };
  
  // Валидация email
  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = re.test(email);
    if (!isValid) {
      setEmailError('Некорректный формат email');
    } else {
      setEmailError(null);
    }
    return isValid;
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

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    dispatch(userActions.clearLoginError());
    
    // Отметить все поля как посещенные при отправке формы
    setTouchedFields({
      email: true,
      password: true
    });
    
    const target = e.target as typeof e.target & LoginForm;
    const { email, password } = target;
    
    // Валидация всех полей
    const isEmailValid = validateEmail(email.value);
    const isPasswordValid = validatePassword(password.value);
    
    // Если есть ошибки валидации, не отправляем запрос
    if (!isEmailValid || !isPasswordValid) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await dispatch(login({ email: email.value, password: password.value }));
      
      if (result.meta.requestStatus === 'fulfilled' && result.payload) {
        // JWT уже сохранен в slice, перенаправляем на главную
        navigate('/');
      }
    } catch {
      // Ошибка уже обрабатывается в reducer
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <form className={styles.loginForm} onSubmit={submit}>
        <h2 className={styles.title}>Вход</h2>
        <div className={styles.inputGroup}>
          <label htmlFor="email">Email</label>
          <input 
            type="email" 
            name="email" 
            id="email" 
            required 
            placeholder="Введите email"
            onBlur={() => handleBlur('email')}
          />
          {touchedFields.email && emailError && (
            <div className={styles.fieldError}>{emailError}</div>
          )}
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="password">Пароль</label>
          <input 
            type="password" 
            name="password" 
            id="password" 
            required 
            placeholder="Введите пароль"
            onBlur={() => handleBlur('password')}
          />
          {touchedFields.password && passwordError && (
            <div className={styles.fieldError}>{passwordError}</div>
          )}
        </div>
        <button 
          className={styles.submitButton} 
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Выполняется вход...' : 'Войти'}
        </button>
        <div className={styles.links}>
          <div>Нет аккаунта?</div>
          <Link to="/auth/register">Зарегистрироваться</Link>
        </div>
      </form>
      
      {/* Всплывающее окно с ошибкой */}
      {showError && loginErrorMessage && (
        <div className={styles.errorPopup}>
          <div className={styles.errorContent}>
            <span className={styles.errorMessage}>{loginErrorMessage}</span>
            <button 
              className={styles.closeButton} 
              onClick={() => {
                setShowError(false);
                dispatch(userActions.clearLoginError());
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

export default Login;
