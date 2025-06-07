import { Outlet } from 'react-router-dom';
import styles from './Layout.module.scss';
import Navigation from '../../components/Navigation/Navigation.tsx';
import Header from '../Header/Header.tsx';
import { useMediaQuery } from 'react-responsive';
import { Chat } from '../../components/Chat/Chat';
import { useChatAuth } from '../../hooks/useChatAuth';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getProfile } from '../../store/user.slice';
import { AppDispatch, RootState } from '../../store/store';
import { favoritesActions, loadFavoritesState } from '../../store/favorites.slice';

const ADAPTIVE_SCREEN_SIZE = 768;

const Layout = () => {
  const isLargeScreen = useMediaQuery({
    query: `(min-width: ${ADAPTIVE_SCREEN_SIZE}px)`
  });
  
  const dispatch = useDispatch<AppDispatch>();
  const { jwt, profile } = useSelector((state: RootState) => state.user);
  const chatAuth = useChatAuth();
  
  useEffect(() => {
    const storedFavorites = loadFavoritesState();
    if (storedFavorites.length > 0) {
      dispatch(favoritesActions.loadFromStorage(storedFavorites));
    }
  }, [dispatch]);

  useEffect(() => {
    if (jwt && !profile) {
      dispatch(getProfile());
    }
  }, [jwt, profile, dispatch]);


  return (
    <div className={styles.wrapper}>
      <Header isLargeScreen={isLargeScreen} />
      <div className={styles.outley}>
        <Outlet/>
      </div>

      {!isLargeScreen && <Navigation device='mobile'/>}
      
      {chatAuth.isAuthenticated && (
        <Chat 
          userToken={chatAuth.userToken!}
          userId={chatAuth.userId!}
        />
      )}
    </div>
  );
};

export default Layout;
