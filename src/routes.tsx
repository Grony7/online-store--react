import { createBrowserRouter, Outlet } from 'react-router-dom';
import Layout from './layout/Layout/Layout.tsx';
import Main from './pages/Index/Index.tsx';
import Cart from './pages/Cart/Cart.tsx';
import Login from './pages/Login/Login.tsx';
import Register from './pages/Register/Register.tsx';
import ErrorPage from './pages/ErrorPage/ErrorPage.tsx';
import Catalog from './pages/Catalog/Catalog.tsx';
import ProductDetail from './pages/ProductDetail/ProductDetail.tsx';
import RequireAuth from './helpers/RequireAuth.tsx';
import RequirePaymentAccess from './helpers/RequirePaymentAccess.tsx';
import Checkout from './pages/Checkout/Checkout.tsx';
import PaymentPage from './pages/Payment/Payment.tsx';
import Favorites from './pages/Favorites/Favorites.tsx';


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
        path: '/favorites',
        element: <Favorites />
      },
      {
        path: '/catalog/:slug',
        element: <Catalog />
      },
      {
        path: '/products/:id',
        element: <ProductDetail />
      },
      {
        path: '*',
        element: <ErrorPage/>
      },
      {
        element: <RequireAuth><Outlet/></RequireAuth>,
        children: [
          {
            path: 'cart',
            element: <Cart />
          },
          {
            path: 'checkout',
            element: <Checkout />
          },
          {
            path: 'payment/:id',
            element: <RequirePaymentAccess><PaymentPage /></RequirePaymentAccess>
          }
        ]
      },
      {
        path: '/auth',
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
      }
    ]
  }
]);
