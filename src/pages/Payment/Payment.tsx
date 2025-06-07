import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Payment.module.scss';

export const Payment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) {
      navigate('/checkout');
      return;
    }

    const getPaymentLink = async () => {
      try {
        const userJwt = localStorage.getItem('jwt');
        
        if (!userJwt) {
          navigate('/login');
          return;
        }

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/orders/${id}/payment`,
          {
            headers: { Authorization: `Bearer ${userJwt}` }
          }
        );

        if (response.data && response.data.payment_url) {
          window.location.href = response.data.payment_url;
        } else {
          console.error('Не получена ссылка для оплаты');
          navigate('/orders');
        }
      } catch (e) {
        console.error('Ошибка при получении ссылки на оплату:', e);
        navigate('/orders');
      }
    };

    getPaymentLink();
  }, [id, navigate]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        Оплата заказа {id && id !== 'undefined' ? `#${id}` : ''}
      </h1>
      <div className={styles.loading}>Перенаправление на страницу оплаты...</div>
    </div>
  );
};

export default Payment;

