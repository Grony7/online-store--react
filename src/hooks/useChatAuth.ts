import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

export const useChatAuth = () => {
  const { jwt, profile } = useSelector((state: RootState) => state.user);
  
  if (!jwt || !profile) {
    return {
      isAuthenticated: false,
      userToken: null,
      userId: null,
      isSupport: false
    };
  }

  return {
    isAuthenticated: true,
    userToken: jwt,
    userId: profile.id,
    isSupport: false
  };
}; 