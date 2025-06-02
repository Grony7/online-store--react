import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import styles from './Payment.module.scss';

interface PaymentStatusResponse {
  payment_status: string;
  order_status:   string;
}

const API_URL = import.meta.env.VITE_API_URL as string;

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const jwt = useSelector((s: RootState) => s.user.jwt);
  const [status, setStatus] = useState<PaymentStatusResponse | null>(null);
  const [error, setError] = useState<string>('');

  // Проверяем, что id не undefined и не "undefined"
  useEffect(() => {
    console.log('ID заказа:', id);
    if (!id || id === 'undefined') {
      navigate('/checkout');
    }
  }, [id, navigate]);

  const handlePay = () => {
    // Проверяем, что id не undefined перед переходом
    if (!id || id === 'undefined') {
      setError('ID заказа не определен');
      return;
    }
    
    // сразу переводим пользователя на YooMoney
    window.location.href =
      `https://yoomoney.ru/checkout/payments/v2/contract?orderId=${id}`;
  };

  const handleCheckStatus = async () => {
    // Проверяем, что id не undefined перед запросом
    if (!id || id === 'undefined') {
      setError('ID заказа не определен');
      return;
    }
    
    try {
      const resp = await axios.get<PaymentStatusResponse>(
        `${API_URL}/api/orders/payment/id/${id}`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );
      setStatus(resp.data);
      setError('');
    } catch (e: any) {
      console.error(e);
      setError(
        e.response?.data?.message ||
        e.message ||
        'Не удалось получить статус'
      );
    }
  };

  const handleCancel = () => {
    // Возвращаемся на страницу оформления заказа
    navigate('/checkout');
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        Оплата заказа {id && id !== 'undefined' ? `#${id}` : ''}
      </h1>

      <div className={styles.buttons}>
        <button
          className={styles.payBtn}
          onClick={handlePay}
          disabled={!id || id === 'undefined'}
        >
          Оплатить
        </button>
        <button
          className={styles.checkBtn}
          onClick={handleCheckStatus}
          disabled={!id || id === 'undefined'}
        >
          Проверить статус
        </button>
        <button
          className={styles.cancelBtn}
          onClick={handleCancel}
        >
          Вернуться к оформлению
        </button>
      </div>

      {status && (
        <div className={styles.statusBlock}>
          <p>
            <strong>Статус оплаты:</strong>{' '}
            {status.payment_status}
          </p>
          <p>
            <strong>Статус заказа:</strong>{' '}
            {status.order_status}
          </p>
          {status.payment_status === 'succeeded' &&
            status.order_status === 'paid' && (
              <p className={styles.success}>
                🎉 Заказ успешно оплачен!
              </p>
            )}
        </div>
      )}

      {error && (
        <p className={styles.error}>
          Ошибка: {error}
        </p>
      )}
    </div>
  );
};

export default PaymentPage;
