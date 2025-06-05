import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { getProfile, userActions, updateProfile, UpdateProfileDto } from '../../store/user.slice';
import { Navigate } from 'react-router-dom';
import Input from '../../components/Input/Input';
import styles from './Profile.module.scss';
import { IProfile } from '../../interfaces/user.interface';

const Profile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { jwt, profile, isUpdatingProfile, updateProfileErrorMessage } = useSelector((state: RootState) => state.user);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Функция для получения полного URL аватара из различных источников
  const getAvatarUrl = useCallback((profile: IProfile): string | undefined => {
    // В API ответе есть готовый avatarUrl
    if (profile.avatarUrl) {
      return profile.avatarUrl;
    }
    
    // Если есть старое поле avatar
    if (profile.avatar) {
      // Если avatar - полный URL, используем его
      if (profile.avatar.startsWith('http://') || profile.avatar.startsWith('https://')) {
        return profile.avatar;
      }
      // Если avatar содержит относительный путь, добавляем базовый URL
      if (profile.avatar.startsWith('/')) {
        return `${import.meta.env.VITE_API_URL}${profile.avatar}`;
      }
    }
    
    return undefined;
  }, []);
  
  useEffect(() => {
    if (jwt && !profile && !isLoadingProfile) {
      setIsLoadingProfile(true);
      setProfileLoadError(null);
      
      dispatch(getProfile())
        .unwrap()
        .then(() => {
          setIsLoadingProfile(false);
        })
        .catch((error) => {
          setIsLoadingProfile(false);
          setProfileLoadError(error.message || 'Ошибка загрузки профиля');
        });
    }
    
    if (profile) {
      setName(profile.name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setBirthdate(profile.birthdate || '');
      setGender(profile.gender || '');
      setAvatar(getAvatarUrl(profile));
    }
  }, [dispatch, jwt, profile, getAvatarUrl, isLoadingProfile]);
  
  useEffect(() => {
    // При появлении ошибки обновления, очищаем её через 3 секунды
    if (updateProfileErrorMessage) {
      const timer = setTimeout(() => {
        dispatch(userActions.clearUpdateProfileError());
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [updateProfileErrorMessage, dispatch]);
  
  const handleEditProfile = () => {
    setIsEditing(true);
  };
  
  const handleSaveProfile = async () => {
    try {
      // Очищаем предыдущие ошибки валидации
      setValidationErrors({});
      
      // Базовая валидация
      const errors: Record<string, string> = {};
      
      if (!name.trim()) {
        errors.name = 'Имя обязательно для заполнения';
      }
      
      if (!email.trim()) {
        errors.email = 'Email обязателен для заполнения';
      } else if (!email.includes('@')) {
        errors.email = 'Введите корректный email адрес';
      }
      
      if (phone && phone.trim() && !/^[+]?[0-9()\-\s]+$/.test(phone.trim())) {
        errors.phone = 'Введите корректный номер телефона';
      }
      
      // Если есть ошибки валидации, показываем их
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }
      
      // Подготавливаем данные для обновления
      const updateData: UpdateProfileDto = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        birthdate: birthdate || undefined,
        gender: gender || undefined
      };
      
      // Если есть файл аватара, добавляем его
      if (avatarFile) {
        updateData.avatarFile = avatarFile;
      }
      
      // Отправляем запрос на обновление профиля
      const result = await dispatch(updateProfile(updateData));
      
      if (updateProfile.fulfilled.match(result)) {
        // Успешное обновление
        const updatedProfile = result.payload;
        
        // Обновляем локальный аватар, если был получен новый
        if (updatedProfile) {
          setAvatar(getAvatarUrl(updatedProfile));
        }
        
        // Сбрасываем файл аватара после успешной загрузки
        setAvatarFile(null);
        
        // Выходим из режима редактирования
        setIsEditing(false);
        setSuccessMessage('Профиль успешно обновлен!');
        
        // Очистка сообщения через 3 секунды
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else if (updateProfile.rejected.match(result)) {
        // Ошибка обновления - ошибка уже будет показана через Redux
        console.error('Ошибка при обновлении профиля:', result.error.message);
      }
    } catch (err) {
      console.error('Неожиданная ошибка при обновлении профиля:', err);
    }
  };
  
  const handleLogout = () => {
    dispatch(userActions.logout());
  };
  
  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Сохраняем файл для отправки на сервер
      setAvatarFile(file);
      
      // Отображаем превью
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatar(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  if (!jwt) {
    return <Navigate to="/auth/login" />;
  }
  
  if (profileLoadError) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Мой профиль</h1>
        <div className={styles.profileCard}>
          <div className={styles.errorMessage}>
            {profileLoadError}
          </div>
          <button 
            className={styles.editButton}
            onClick={() => {
              setProfileLoadError(null);
              setIsLoadingProfile(true);
              dispatch(getProfile())
                .unwrap()
                .then(() => setIsLoadingProfile(false))
                .catch((error) => {
                  setIsLoadingProfile(false);
                  setProfileLoadError(error.message || 'Ошибка загрузки профиля');
                });
            }}
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }
  
  if (!profile || isLoadingProfile) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Мой профиль</h1>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Загрузка данных профиля...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Мой профиль</h1>
      
      <div className={styles.profileCard}>
        {successMessage && (
          <div className={styles.successMessage}>
            {successMessage}
          </div>
        )}
        
        {updateProfileErrorMessage && (
          <div className={styles.errorMessage}>
            {updateProfileErrorMessage}
          </div>
        )}
        
        <div className={styles.avatarSection}>
          <div 
            className={styles.avatar} 
            onClick={handleAvatarClick}
            style={avatar ? { backgroundImage: `url(${avatar})` } : {}}
          >
            {!avatar && (
              <div className={styles.defaultAvatar}>
                {profile?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            {isEditing && (
              <div className={styles.avatarOverlay}>
                <span>Изменить фото</span>
              </div>
            )}
          </div>
          {isEditing && (
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={handleAvatarChange}
            />
          )}
        </div>
        
        <div className={styles.profileForm}>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>Имя:</label>
            {isEditing ? (
              <>
                <Input 
                  type="text" 
                  id="name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isUpdatingProfile}
                />
                {validationErrors.name && (
                  <div className={styles.validationError}>{validationErrors.name}</div>
                )}
              </>
            ) : (
              <div className={styles.fieldValue}>{profile?.name || 'Не указано'}</div>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email:</label>
            {isEditing ? (
              <>
                <Input 
                  type="email" 
                  id="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isUpdatingProfile}
                />
                {validationErrors.email && (
                  <div className={styles.validationError}>{validationErrors.email}</div>
                )}
              </>
            ) : (
              <div className={styles.fieldValue}>{profile?.email || 'Не указано'}</div>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="phone" className={styles.label}>Телефон:</label>
            {isEditing ? (
              <>
                <Input 
                  type="tel" 
                  id="phone" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isUpdatingProfile}
                  placeholder="+7 (999) 123-45-67"
                />
                {validationErrors.phone && (
                  <div className={styles.validationError}>{validationErrors.phone}</div>
                )}
              </>
            ) : (
              <div className={styles.fieldValue}>{profile?.phone || 'Не указано'}</div>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="birthdate" className={styles.label}>Дата рождения:</label>
            {isEditing ? (
              <Input 
                type="date" 
                id="birthdate" 
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                disabled={isUpdatingProfile}
              />
            ) : (
              <div className={styles.fieldValue}>
                {profile?.birthdate 
                  ? new Date(profile.birthdate).toLocaleDateString('ru-RU') 
                  : 'Не указано'}
              </div>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="gender" className={styles.label}>Пол:</label>
            {isEditing ? (
              <select 
                id="gender" 
                value={gender}
                onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other')}
                disabled={isUpdatingProfile}
                className={styles.select}
              >
                <option value="">Не выбрано</option>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
                <option value="other">Другой</option>
              </select>
            ) : (
              <div className={styles.fieldValue}>
                {profile?.gender === 'male' 
                  ? 'Мужской' 
                  : profile?.gender === 'female' 
                    ? 'Женский' 
                    : profile?.gender === 'other' 
                      ? 'Другой' 
                      : 'Не указано'}
              </div>
            )}
          </div>
          
          <div className={styles.actions}>
            {isEditing ? (
              <>
                <button 
                  className={styles.saveButton} 
                  onClick={handleSaveProfile}
                  disabled={isUpdatingProfile}
                >
                  {isUpdatingProfile ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button 
                  className={styles.cancelButton} 
                  onClick={() => {
                    setIsEditing(false);
                    setAvatarFile(null);
                    // Восстанавливаем исходные значения
                    if (profile) {
                      setName(profile.name || '');
                      setEmail(profile.email || '');
                      setPhone(profile.phone || '');
                      setBirthdate(profile.birthdate || '');
                      setGender(profile.gender || '');
                      setAvatar(getAvatarUrl(profile));
                    }
                  }}
                  disabled={isUpdatingProfile}
                >
                  Отменить
                </button>
              </>
            ) : (
              <button 
                className={styles.editButton} 
                onClick={handleEditProfile}
              >
                Редактировать
              </button>
            )}
            
            <button 
              className={styles.logoutButton}
              onClick={handleLogout}
            >
              Выйти
            </button>
          </div>
        </div>
        
        <div className={styles.profileLinks}>
          <h2 className={styles.linksTitle}>Мои разделы</h2>
          <div className={styles.linkItems}>
            <a href="/orders" className={styles.linkItem}>
              <span className={styles.linkIcon}>📦</span>
              <span className={styles.linkText}>Мои заказы</span>
            </a>
            <a href="/favorites" className={styles.linkItem}>
              <span className={styles.linkIcon}>❤️</span>
              <span className={styles.linkText}>Избранное</span>
            </a>
            <a href="/cart" className={styles.linkItem}>
              <span className={styles.linkIcon}>🛒</span>
              <span className={styles.linkText}>Корзина</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 