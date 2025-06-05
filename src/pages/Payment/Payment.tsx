import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import styles from './Payment.module.scss';

interface PaymentStatusResponse {
  payment_status: string;
  order_status: string;
}

interface PaymentUrlResponse {
  confirmation_url: string;
  payment_id: string;
}

interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
  message: string;
}

const API_URL = import.meta.env.VITE_API_URL as string;

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const jwt = useSelector((s: RootState) => s.user.jwt);
  const [status, setStatus] = useState<PaymentStatusResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Получаем ссылку на оплату при загрузке страницы
  useEffect(() => {
    console.log('ID заказа в Payment компоненте:', id);
    console.log('URL страницы:', window.location.href);
    
    if (!id || id === 'undefined') {
      console.log('ID не определен, перенаправление на /checkout');
      navigate('/checkout');
      return;
    }

    // Устанавливаем маркер доступа для случая перезагрузки страницы
    sessionStorage.setItem('payment_access', 'true');

    // Получаем ссылку на оплату
    const fetchPaymentUrl = async () => {
      try {
        setIsLoading(true);
        console.log('Запрашиваем ссылку на оплату для заказа ID:', id);
        
        const response = await axios.get<PaymentUrlResponse>(
          `${API_URL}/api/orders/${id}/payment`,
          {
            headers: { Authorization: `Bearer ${jwt}` }
          }
        );
        
        console.log('Получен ответ:', response.data);
        
        if (response.data && response.data.confirmation_url) {
          setPaymentUrl(response.data.confirmation_url);
        } else {
          setError('Не удалось получить ссылку на оплату');
        }
      } catch (e) {
        console.error('Ошибка при получении ссылки на оплату:', e);
        setError('Не удалось получить ссылку на оплату');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPaymentUrl();
  }, [id, jwt, navigate]);

  const handlePay = () => {
    if (!paymentUrl) {
      setError('Ссылка на оплату не найдена');
      return;
    }
    
    // Перенаправляем на платежную систему
    window.location.href = paymentUrl;
  };

  // const handleCheckStatus = async () => {
  //   // Проверяем, что id не undefined перед запросом
  //   if (!id || id === 'undefined') {
  //     setError('ID заказа не определен');
  //     return;
  //   }
    
  //   try {
  //     const resp = await axios.get<PaymentStatusResponse>(
  //       `${API_URL}/api/orders/payment/id/${id}`,
  //       {
  //         headers: { Authorization: `Bearer ${jwt}` }
  //       }
  //     );
  //     setStatus(resp.data);
  //     setError('');
  //   } catch (e) {
  //     console.error(e);
  //     const err = e as AxiosErrorResponse;
  //     setError(
  //       err.response?.data?.message ||
  //       err.message ||
  //       'Не удалось получить статус'
  //     );
  //   }
  // };

  const handleCancel = () => {
    // Возвращаемся на страницу оформления заказа
    navigate('/checkout');
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        Оплата заказа {id && id !== 'undefined' ? `#${id}` : ''}
      </h1>

      {isLoading ? (
        <div className={styles.loading}>Загрузка информации об оплате...</div>
      ) : (
        <>
          <div className={styles.buttons}>
            <button
              className={styles.payBtn}
              onClick={handlePay}
              disabled={!paymentUrl || !id || id === 'undefined'}
            >
              Оплатить
            </button>
            {/* <button
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
            </button> */}
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
        </>
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
