import { Outlet } from 'react-router-dom';
import styles from './Layout.module.scss';
import Navigation from '../../components/Navigation/Navigation.tsx';
import Header from '../Header/Header.tsx';
import { useMediaQuery } from 'react-responsive';

const ADAPTIVE_SCREEN_SIZE = 768;

const Layout = () => {
  const isLargeScreen = useMediaQuery({
    query: `(min-width: ${ADAPTIVE_SCREEN_SIZE}px)`
  })


  return (

    <div className={styles.wrapper}>
      <Header isLargeScreen={isLargeScreen} />
      <div className={styles.outley}>
        <Outlet/>
      </div>

      {!isLargeScreen && <Navigation device='mobile'/>}
    </div>
  );
};

export default Layout;
