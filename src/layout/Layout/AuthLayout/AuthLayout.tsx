import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  // return (
  //   <div className={styles.layout}>
  //     <div className={styles.logo}>
  //       <img src='/images/catalog/logo.svg' alt='Логотип' width='420' height='374' />
  //     </div>
  //     <div className={styles.content}>
  //       <Outlet/>
  //     </div>
  //   </div>
  // );
  return <Outlet/>;
};

export default AuthLayout;
