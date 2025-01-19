import styles from './Header.module.scss';
import { HeaderProps } from './Header.props.ts';
import Search from '../../components/Search/Search.tsx';
import Navigation from '../../components/Navigation/Navigation.tsx';
import { Link } from 'react-router-dom';

const Header = ({isLargeScreen}: HeaderProps) => {
  return (
    <header className={styles.header}>
      <div className={styles.headerWrapper}>
        <Link to='/'>
          <img className={styles.logo} src='/images/glance.svg' alt='Логотип' width='115' height='34'/>
        </Link>
        <div className={styles.searchWrapper}>
          <Search className={styles.search} placeholder='Поиск'/>
        </div>

        {isLargeScreen && <Navigation className={styles.navigation} device='desktop'/>}
      </div>
    </header>
  );
};

export default Header;
