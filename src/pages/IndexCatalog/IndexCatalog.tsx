import { useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';
import { Link } from 'react-router-dom';
import styles from './IndexCatalog.module.scss';
import { IndexCatalogProps } from './IndexCatalog.props';
import Title from '../../components/Title/Title';
import { ICatalogCategory } from '../../interfaces/catalog.interface';

const API_URL = import.meta.env.VITE_API_URL

const IndexCatalog = ({ ...props }: IndexCatalogProps) => {
  const [categories, setCategories] = useState<ICatalogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data } = await axios.get<ICatalogCategory[]>(
          `${API_URL}/api/categories`
        );

        setCategories(data);
      } catch (e) {
        const error = e as AxiosError;
        console.error('Ошибка при загрузке категорий:', error.message);
        setError('Не удалось загрузить категории');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (isLoading) {
    return (
      <div className={styles.wrapper} {...props}>
        <div className={styles.header}>
          <Title level={1}>Загрузка...</Title>
        </div>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Загружаем категории...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.wrapper} {...props}>
        <div className={styles.header}>
          <Title level={1}>Ошибка</Title>
        </div>
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper} {...props}>
      <div className={styles.header}>
        <Title level={1}>Каталог товаров</Title>
        <p className={styles.categoriesCount}>
          Выберите категорию: {categories.length} {categories.length === 1 ? 'категория' : categories.length < 5 ? 'категории' : 'категорий'}
        </p>
      </div>

      {categories.length > 0 ? (
        <div className={styles.grid}>
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/catalog/${category.slug}`}
              className={styles.categoryCard}
            >
              <div className={styles.imageWrapper}>
                <img
                  src={category.image?.url ? `${API_URL}${category.image.url}` : '/images/no-image.svg'}
                  alt={category.name}
                  className={styles.image}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/no-image.svg';
                  }}
                />
              </div>
              <div className={styles.content}>
                <h3 className={styles.title}>{category.name}</h3>
                <p className={styles.description}>
                  Перейти к товарам категории
                </p>
                <div className={styles.arrow}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <h3>Категории не найдены</h3>
          <p>Пока нет доступных категорий товаров</p>
        </div>
      )}
    </div>
  );
};

export default IndexCatalog;
