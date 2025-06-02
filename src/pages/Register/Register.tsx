import { Link, useNavigate } from 'react-router-dom';
import styles from './Register.module.scss';
import { FormEvent, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registration, userActions } from '../../store/user.slice.ts';
import { RootState, AppDispatch } from '../../store/store.ts';

export type RegisterForm = {
  name: { value: string };
  email: { value: string };
  password: { value: string };
  confirmPassword: { value: string };
};

export const Register = () => {
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({
    name: false,
    email: false,
    password: false,
    confirmPassword: false
  });
  
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const { registerErrorMessage } = useSelector((state: RootState) => state.user);
  const [showError, setShowError] = useState<boolean>(false);
  
  // Показывать ошибку при получении ошибки регистрации
  useEffect(() => {
    if (registerErrorMessage) {
      setShowError(true);
    }
  }, [registerErrorMessage]);

  // Закрыть всплывающее окно ошибки через 5 секунд
  useEffect(() => {
    if (showError) {
      const timer = setTimeout(() => {
        setShowError(false);
        // Очищаем ошибку в сторе
        dispatch(userActions.clearRegisterError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showError, dispatch]);

  // Отметить поле как посещенное
  const handleBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    
    // Запуск валидации для посещенного поля
    const form = document.querySelector('form') as HTMLFormElement;
    if (field === 'name') {
      validateName((form.elements.namedItem('name') as HTMLInputElement).value);
    } else if (field === 'email') {
      validateEmail((form.elements.namedItem('email') as HTMLInputElement).value);
    } else if (field === 'password') {
      validatePassword((form.elements.namedItem('password') as HTMLInputElement).value);
    } else if (field === 'confirmPassword') {
      validatePasswordMatch(
        (form.elements.namedItem('password') as HTMLInputElement).value,
        (form.elements.namedItem('confirmPassword') as HTMLInputElement).value
      );
    }
  };

  // Валидация имени
  const validateName = (name: string): boolean => {
    if (name.length < 2) {
      setNameError('Имя должно содержать минимум 2 символа');
      return false;
    }
    setNameError(null);
    return true;
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

  // Валидация совпадения паролей
  const validatePasswordMatch = (password: string, confirmPassword: string): boolean => {
    if (password !== confirmPassword) {
      setConfirmPasswordError('Пароли не совпадают');
      return false;
    }
    setConfirmPasswordError(null);
    return true;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    dispatch(userActions.clearRegisterError());
    
    // Отметить все поля как посещенные при отправке формы
    setTouchedFields({
      name: true,
      email: true,
      password: true,
      confirmPassword: true
    });
    
    const target = e.target as typeof e.target & RegisterForm;
    const { name, email, password, confirmPassword } = target;
    
    // Валидация всех полей
    const isNameValid = validateName(name.value);
    const isEmailValid = validateEmail(email.value);
    const isPasswordValid = validatePassword(password.value);
    const isPasswordMatch = validatePasswordMatch(password.value, confirmPassword.value);
    
    // Если есть ошибки валидации, не отправляем запрос
    if (!isNameValid || !isEmailValid || !isPasswordValid || !isPasswordMatch) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await dispatch(registration({ 
        name: name.value, 
        email: email.value, 
        password: password.value 
      }));
      
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
    <div className={styles.registerContainer}>
      <form className={styles.registerForm} onSubmit={submit}>
        <h2 className={styles.title}>Регистрация</h2>
        <div className={styles.inputGroup}>
          <label htmlFor="name">Имя</label>
          <input 
            type="text" 
            name="name" 
            id="name" 
            required 
            placeholder="Введите ваше имя"
            onBlur={() => handleBlur('name')}
          />
          {touchedFields.name && nameError && (
            <div className={styles.fieldError}>{nameError}</div>
          )}
        </div>
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
        <div className={styles.inputGroup}>
          <label htmlFor="confirmPassword">Повторите пароль</label>
          <input 
            type="password" 
            name="confirmPassword" 
            id="confirmPassword" 
            required 
            placeholder="Повторите пароль"
            onBlur={() => handleBlur('confirmPassword')}
          />
          {touchedFields.confirmPassword && confirmPasswordError && (
            <div className={styles.fieldError}>{confirmPasswordError}</div>
          )}
        </div>
        <button 
          className={styles.submitButton} 
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Выполняется регистрация...' : 'Зарегистрироваться'}
        </button>
        <div className={styles.links}>
          <div>Есть аккаунт?</div>
          <Link to="/auth/login">Войти</Link>
        </div>
      </form>

      {/* Всплывающее окно с ошибкой */}
      {showError && registerErrorMessage && (
        <div className={styles.errorPopup}>
          <div className={styles.errorContent}>
            <span className={styles.errorMessage}>{registerErrorMessage}</span>
            <button 
              className={styles.closeButton} 
              onClick={() => {
                setShowError(false);
                dispatch(userActions.clearRegisterError());
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

export default Register;
