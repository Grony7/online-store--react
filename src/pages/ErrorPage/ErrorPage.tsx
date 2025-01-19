import styles from './ErrorPage.module.scss';


const ErrorPage = () => {
  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Ошибка</h1>
      <img className={styles.image} src='/images/404.svg' width='300' height='280' alt='Ошибка'/>
      <span className={styles.name}>Перезагрузите страницу или проверьте  подключение к интернету</span>
    </div>
  );
};

export default ErrorPage;
