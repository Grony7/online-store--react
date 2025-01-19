/// <reference types="vite-plugin-svgr/client" />

import styles from './Navigation.module.scss';
import { NavigationProps } from './Navigation.props';
import cn from 'classnames';
import { NavLink } from 'react-router-dom';
import { ReactNode } from 'react';
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
  const jwt = false;



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

      <NavLink to='/auth/login' className={({ isActive }) => cn(styles.link, {
        [styles.active]: isActive
      })}>
        <ProfileIcon />
        <span className={styles.name}>{jwt ? 'Профиль' : 'Войти'}</span>
      </NavLink>
    </nav>
  );
};

export default Navigation;
