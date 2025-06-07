import { Link } from 'react-router-dom';
import styles from './ForgotPassword.module.scss';
import { FormEvent, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { forgotPassword, userActions } from '../../store/user.slice.ts';
import { RootState, AppDispatch } from '../../store/store.ts';

export type ForgotPasswordForm = {
  email: {
    value: string;
  };
};

export const ForgotPassword = () => {
  const [emailError, setEmailError] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({
    email: false
  });
  
  const dispatch = useDispatch<AppDispatch>();
  
  const { 
    forgotPasswordErrorMessage, 
    forgotPasswordSuccessMessage, 
    isForgotPasswordLoading 
  } = useSelector((state: RootState) => state.user);
  
  const [showError, setShowError] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  
  // Показывать ошибку при получении ошибки
  useEffect(() => {
    if (forgotPasswordErrorMessage) {
      setShowError(true);
    }
  }, [forgotPasswordErrorMessage]);
  
  // Показывать успешное сообщение
  useEffect(() => {
    if (forgotPasswordSuccessMessage) {
      setShowSuccess(true);
    }
  }, [forgotPasswordSuccessMessage]);
  
  // Закрыть всплывающие окна через 5 секунд
  useEffect(() => {
    if (showError) {
      const timer = setTimeout(() => {
        setShowError(false);
        dispatch(userActions.clearForgotPasswordError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showError, dispatch]);
  
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
        dispatch(userActions.clearForgotPasswordSuccess());
      }, 10000); // Успешное сообщение показываем дольше
      return () => clearTimeout(timer);
    }
  }, [showSuccess, dispatch]);
  
  // Отметить поле как посещенное
  const handleBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    
    // Запуск валидации для посещенного поля
    const form = document.querySelector('form') as HTMLFormElement;
    if (field === 'email') {
      validateEmail((form.elements.namedItem('email') as HTMLInputElement).value);
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

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    dispatch(userActions.clearForgotPasswordError());
    dispatch(userActions.clearForgotPasswordSuccess());
    
    // Отметить все поля как посещенные при отправке формы
    setTouchedFields({
      email: true
    });
    
    const target = e.target as typeof e.target & ForgotPasswordForm;
    const { email } = target;
    
    // Валидация email
    const isEmailValid = validateEmail(email.value);
    
    // Если есть ошибки валидации, не отправляем запрос
    if (!isEmailValid) {
      return;
    }
    
    try {
      await dispatch(forgotPassword({ email: email.value }));
    } catch {
      // Ошибка уже обрабатывается в reducer
      setShowError(true);
    }
  };

  return (
    <div className={styles.forgotPasswordContainer}>
      <form className={styles.forgotPasswordForm} onSubmit={submit}>
        <h2 className={styles.title}>Восстановление пароля</h2>
        <p className={styles.description}>
          Введите ваш email адрес и мы отправим вам ссылку для восстановления пароля
        </p>
        
        <div className={styles.inputGroup}>
          <label htmlFor="email">Email</label>
          <input 
            type="email" 
            name="email" 
            id="email" 
            required 
            placeholder="Введите email"
            onBlur={() => handleBlur('email')}
            disabled={isForgotPasswordLoading}
          />
          {touchedFields.email && emailError && (
            <div className={styles.fieldError}>{emailError}</div>
          )}
        </div>
        
        <button 
          className={styles.submitButton} 
          type="submit"
          disabled={isForgotPasswordLoading}
        >
          {isForgotPasswordLoading ? 'Отправляем...' : 'Отправить ссылку'}
        </button>
        
        <div className={styles.links}>
          <Link to="/auth/login">Вернуться к входу</Link>
        </div>
      </form>
      
      {/* Всплывающее окно с ошибкой */}
      {showError && forgotPasswordErrorMessage && (
        <div className={styles.errorPopup}>
          <div className={styles.errorContent}>
            <span className={styles.errorMessage}>{forgotPasswordErrorMessage}</span>
            <button 
              className={styles.closeButton} 
              onClick={() => {
                setShowError(false);
                dispatch(userActions.clearForgotPasswordError());
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* Всплывающее окно с успешным сообщением */}
      {showSuccess && forgotPasswordSuccessMessage && (
        <div className={styles.successPopup}>
          <div className={styles.successContent}>
            <span className={styles.successMessage}>{forgotPasswordSuccessMessage}</span>
            <button 
              className={styles.closeButton} 
              onClick={() => {
                setShowSuccess(false);
                dispatch(userActions.clearForgotPasswordSuccess());
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

export default ForgotPassword; 