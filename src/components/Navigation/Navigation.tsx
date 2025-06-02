/// <reference types="vite-plugin-svgr/client" />

import styles from './Navigation.module.scss';
import { NavigationProps } from './Navigation.props';
import cn from 'classnames';
import { NavLink, useNavigate } from 'react-router-dom';
import { ReactNode, useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { getProfile, userActions } from '../../store/user.slice';
import HomeIcon from './icons/home.svg?react';
import CartIcon from './icons/cart.svg?react';
import ProfileIcon from './icons/profile.svg?react';
import CatalogIcon from './icons/catalog.svg?react';


interface INavElement {
  route: string;
  name: string;
  icon: ReactNode;
}

const navElements: INavElement[] = [
  {
    route: '/',
    name: 'Главная',
    icon: <HomeIcon />
  },
  {
    route: '/catalog',
    name: 'Каталог',
    icon: <CatalogIcon />
  },
  {
    route: '/cart',
    name: 'Корзина',
    icon: <CartIcon />
  }
];

const Navigation = ({ className, device = 'desktop', ...props }: NavigationProps) => {
  const { jwt, profile } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Получаем данные профиля при наличии jwt
  useEffect(() => {
    if (jwt && !profile) {
      dispatch(getProfile());
    }
  }, [jwt, profile, dispatch]);
  
  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleLogout = () => {
    dispatch(userActions.logout());
    setIsMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className={cn(className, styles.wrapper)} {...props}>
      {
        navElements.map((e) =>
          (e.route !== '/' || device !== 'desktop') &&
          <NavLink key={e.route} to={e.route} className={({ isActive }) => cn(styles.link, {
            [styles.active]: isActive
          })}>
            {e.icon}
            <span className={styles.name}>{e.name}</span>
          </NavLink>
        )
      }

      {jwt ? (
        <div className={styles.profileContainer} ref={menuRef}>
          <button 
            className={cn(styles.link, styles.profileButton, {
              [styles.active]: isMenuOpen
            })}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <ProfileIcon />
            <span className={styles.name}>{profile?.name || 'Профиль'}</span>
          </button>
          
          {isMenuOpen && (
            <div className={styles.profileMenu}>
              <NavLink 
                to='/profile' 
                className={styles.menuItem}
                onClick={() => setIsMenuOpen(false)}
              >
                Мой профиль
              </NavLink>
              <NavLink 
                to='/orders' 
                className={styles.menuItem}
                onClick={() => setIsMenuOpen(false)}
              >
                Мои заказы
              </NavLink>
              <NavLink 
                to='/favorites' 
                className={styles.menuItem}
                onClick={() => setIsMenuOpen(false)}
              >
                Избранное
              </NavLink>
              <button 
                className={cn(styles.menuItem, styles.logoutButton)}
                onClick={handleLogout}
              >
                Выйти
              </button>
            </div>
          )}
        </div>
      ) : (
        <NavLink to='/auth/login' className={({ isActive }) => cn(styles.link, {
          [styles.active]: isActive
        })}>
          <ProfileIcon />
          <span className={styles.name}>Войти</span>
        </NavLink>
      )}
    </nav>
  );
};

export default Navigation;
