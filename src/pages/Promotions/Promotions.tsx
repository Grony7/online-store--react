import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { PromotionsProps } from './Promotions.props';
import { IPromotion } from '../../interfaces/promotions.interface';
import styles from './Promotions.module.scss';
import Title from '../../components/Title/Title';

const Promotions = ({ ...props }: PromotionsProps) => {
  const [promotions, setPromotions] = useState<IPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const getPromotions = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get<{ data: IPromotion[] }>(
          `${import.meta.env.VITE_API_URL}/api/promotions`
        );
        setPromotions(data.data);
      } catch (e) {
        const error = e as AxiosError;
        console.error('Ошибка при загрузке акций:', error.message);
        setError('Не удалось загрузить акции');
      } finally {
        setLoading(false);
      }
    };

    getPromotions();
  }, []);

  // Функция для очистки HTML-тегов из превью текста
  const stripHtml = (html: string): string => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  if (loading) {
    return (
      <div className={styles.wrapper} {...props}>
        <Title>Акции и специальные предложения</Title>
        <div className={styles.loading}>Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.wrapper} {...props}>
        <Title>Акции и специальные предложения</Title>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper} {...props}>
      <Title>Акции и специальные предложения</Title>
      
      {promotions.length === 0 ? (
        <div className={styles.emptyMessage}>
          В данный момент нет активных акций и предложений
        </div>
      ) : (
        <div className={styles.promotionsGrid}>
          {promotions.map((promotion) => (
            <Link 
              key={promotion.id}
              to={`/promotions/${promotion.slug}`}
              className={styles.promotionCard}
            >
              <div className={styles.imageContainer}>
                <img 
                  src={`${import.meta.env.VITE_API_URL}${promotion.preview_image}`}
                  alt={promotion.title}
                  className={styles.image}
                />
              </div>
              <div className={styles.promotionContent}>
                <h3 className={styles.promotionTitle}>
                  {promotion.title}
                </h3>
                {promotion.preview_text && (
                  <p className={styles.promotionText}>
                    {stripHtml(promotion.preview_text)}
                  </p>
                )}
                <div className={styles.period}>
                  {promotion.start_date && promotion.end_date && (
                    <>
                      {new Date(promotion.start_date).toLocaleDateString()} - {new Date(promotion.end_date).toLocaleDateString()}
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Promotions; 