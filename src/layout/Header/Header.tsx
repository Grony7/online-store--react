import styles from './Header.module.scss';
import { HeaderProps } from './Header.props.ts';
import Search from '../../components/Search/Search.tsx';
import Navigation from '../../components/Navigation/Navigation.tsx';

const Header = ({isLargeScreen}: HeaderProps) => {
  return (
    <header className={styles.header}>
      <div className={styles.headerWrapper}>
        <img className={styles.logo} src='/images/glance.svg' alt='Логотип' width='115' height='34'/>
        <div className={styles.searchWrapper}>
          <Search className={styles.search} placeholder='Поиск'/>
        </div>

        {isLargeScreen && <Navigation className={styles.navigation} device='desktop'/>}
      </div>
    </header>
  );
};

export default Header;
