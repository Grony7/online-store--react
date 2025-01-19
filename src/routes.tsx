import { createBrowserRouter } from 'react-router-dom';
import Layout from './layout/Layout/Layout.tsx';
import Main from './pages/Index/Index.tsx';
import Cart from './pages/Cart/Cart.tsx';

import AuthLayout from './layout/Layout/AuthLayout/AuthLayout.tsx';
import Login from './pages/Login/Login.tsx';
import Register from './pages/Register/Register.tsx';
import ErrorPage from './pages/ErrorPage/ErrorPage.tsx';


export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout/>,
    children: [
      {
        path: '/',
        element: <Main />
      }, {
        path: '/cart',
        element: <Cart />
      },
      {
        path: '*',
        element: <ErrorPage/>
      }
    ]
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <Login />
      },
      {
        path: 'register',
        element: <Register />
      }
    ]
  },
]
);
