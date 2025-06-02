import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store.ts';

const RequireAuth = ({children} : {children: ReactNode}) => {

  const jwt = useSelector((state: RootState) => state.user.jwt);

  if (!jwt) {
    return <Navigate to='/auth/login' replace />;
  }

  return children;
};


export default RequireAuth;
