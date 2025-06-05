import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import axios from 'axios';
import { Link } from 'react-router-dom';
import styles from './Orders.module.scss';

interface OrderItem {
  variant_id: number;
  quantity: number;
  product: {
    title: string;
    image: string;
  };
  color: {
    name: string;
    value: string;
  };
}

interface Order {
  id: number;
  number: string;
  status: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  delivery_method: string;
  payment_method: string;
  payment_id: string | null;
  payment_session: string;
  items?: OrderItem[];
}

interface PaymentStatusResponse {
  payment_status: string;
  order_status: string;
}

const statusTranslations: Record<string, string> = {
  'waiting_payment': 'Ожидает оплаты',
  'paid': 'Оплачен',
  'shipped': 'Отправлен',
  'delivered': 'Доставлен',
  'cancelled': 'Отменён'
};

const paymentMethodTranslations: Record<string, string> = {
  'online': 'Онлайн',
  'cash': 'Наличными',
  'card': 'Картой при получении'
};

const deliveryMethodTranslations: Record<string, string> = {
  'pickup': 'Самовывоз',
  'delivery': 'Доставка'
};

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [paymentStatuses, setPaymentStatuses] = useState<Record<number, PaymentStatusResponse>>({});
  const [checkingPayment, setCheckingPayment] = useState<Record<number, boolean>>({});
  const [paymentErrors, setPaymentErrors] = useState<Record<number, string>>({});
  
  const jwt = useSelector((state: RootState) => state.user.jwt);
  
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/orders`, {
          headers: {
            Authorization: `Bearer ${jwt}`
          }
        });
        
        console.log('Полученные заказы:', response.data.data);
        setOrders(response.data.data);
      } catch (err) {
        console.error('Ошибка при загрузке заказов:', err);
        setError('Не удалось загрузить список заказов');
      } finally {
        setLoading(false);
      }
    };
    
    if (jwt) {
      fetchOrders();
    }
  }, [jwt]);
  
  const toggleOrderDetails = (orderId: number) => {
    console.log('Переключение деталей заказа:', orderId, 'текущий expandedOrder:', expandedOrder);
    
    // Если уже открыт этот заказ, закрываем его
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      // Открываем новый заказ
      setExpandedOrder(orderId);
    }
  };
  
  const checkPaymentStatus = async (orderId: number, paymentId: string, event: React.MouseEvent) => {
    // Предотвращаем всплытие события, чтобы не срабатывал аккордеон
    event.stopPropagation();
    
    if (!paymentId) {
      setPaymentErrors(prev => ({
        ...prev,
        [orderId]: 'Нет данных для проверки платежа'
      }));
      return;
    }
    
    setCheckingPayment(prev => ({
      ...prev,
      [orderId]: true
    }));
    
    try {
      // Очищаем предыдущие ошибки
      setPaymentErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[orderId];
        return newErrors;
      });
      
      const response = await axios.get<PaymentStatusResponse>(
        `${import.meta.env.VITE_API_URL}/api/orders/payment/id/${paymentId}/status`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`
          }
        }
      );
      
      setPaymentStatuses(prev => ({
        ...prev,
        [orderId]: response.data
      }));
      
      // Если статус изменился на "оплачен", обновляем заказ
      if (response.data.payment_status === 'succeeded' && response.data.order_status === 'paid') {
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, status: 'paid' } 
              : order
          )
        );
      }
    } catch (err) {
      console.error(`Ошибка при проверке статуса платежа ${paymentId}:`, err);
      
      setPaymentErrors(prev => ({
        ...prev,
        [orderId]: 'Не удалось проверить статус платежа'
      }));
    } finally {
      setCheckingPayment(prev => ({
        ...prev,
        [orderId]: false
      }));
    }
  };
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  if (loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Мои заказы</h1>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Загрузка заказов...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Мои заказы</h1>
        <div className={styles.error}>
          <p>{error}</p>
          <button className={styles.button} onClick={() => window.location.reload()}>
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }
  
  if (orders.length === 0) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Мои заказы</h1>
        <div className={styles.empty}>
          <p>У вас пока нет заказов</p>
          <a href="/catalog" className={styles.button}>
            Перейти в каталог
          </a>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Мои заказы</h1>
      <div className={styles.ordersList}>
        {orders.map(order => (
          <div 
            key={order.id} 
            className={`${styles.orderCard} ${expandedOrder === order.id ? styles.expanded : ''}`}
          >
            <div 
              className={styles.orderHeader} 
              onClick={() => toggleOrderDetails(order.id)}
            >
              <div className={styles.orderInfo}>
                <span className={styles.orderNumber}>Заказ №{order.number}</span>
                <span className={styles.orderDate}>{formatDate(order.createdAt)}</span>
              </div>
              
              <div className={styles.orderSummary}>
                <span className={`${styles.orderStatus} ${styles[order.status]}`}>
                  {statusTranslations[order.status] || order.status}
                </span>
                <span className={styles.orderTotal}>{order.total.toLocaleString()} ₽</span>
                
                {/* Кнопка оплаты в заголовке заказа */}
                {order.status === 'waiting_payment' && order.payment_method === 'online' && (
                  <Link 
                    to={`/payment/${order.id}`} 
                    className={styles.headerPayButton}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Оплатить
                  </Link>
                )}
                
                <button 
                  type="button"
                  className={styles.expandButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOrderDetails(order.id);
                  }}
                  aria-label={expandedOrder === order.id ? 'Свернуть' : 'Развернуть'}
                >
                  <span className={styles.expandIcon}>
                    {expandedOrder === order.id ? '▲' : '▼'}
                  </span>
                </button>
              </div>
            </div>
            
            {expandedOrder === order.id && (
              <div className={styles.orderDetails}>
                <div className={styles.orderMetadata}>
                  <div className={styles.metadataItem}>
                    <span className={styles.metadataLabel}>Способ доставки:</span>
                    <span className={styles.metadataValue}>
                      {deliveryMethodTranslations[order.delivery_method] || order.delivery_method}
                    </span>
                  </div>
                  
                  <div className={styles.metadataItem}>
                    <span className={styles.metadataLabel}>Способ оплаты:</span>
                    <span className={styles.metadataValue}>
                      {paymentMethodTranslations[order.payment_method] || order.payment_method}
                    </span>
                  </div>
                  
                  <div className={styles.metadataActions}>
                    {order.status === 'waiting_payment' && order.payment_method === 'online' && (
                      <Link 
                        to={`/payment/${order.id}`} 
                        className={styles.payButton}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Оплатить заказ
                      </Link>
                    )}
                    
                    {order.payment_method === 'online' && order.payment_id && (
                      <button 
                        type="button"
                        className={styles.checkStatusButton}
                        onClick={(e) => checkPaymentStatus(order.id, order.payment_id || order.payment_session, e)}
                        disabled={checkingPayment[order.id]}
                      >
                        {checkingPayment[order.id] ? 'Проверка...' : 'Проверить статус оплаты'}
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Блок статуса платежа */}
                {paymentStatuses[order.id] && (
                  <div className={styles.paymentStatusBlock}>
                    <h3 className={styles.statusTitle}>Статус платежа</h3>
                    <div className={styles.statusInfo}>
                      <p className={styles.statusItem}>
                        <span className={styles.statusLabel}>Статус оплаты:</span>
                        <span className={styles.statusValue}>
                          {paymentStatuses[order.id].payment_status === 'succeeded' 
                            ? 'Успешно' 
                            : paymentStatuses[order.id].payment_status}
                        </span>
                      </p>
                      <p className={styles.statusItem}>
                        <span className={styles.statusLabel}>Статус заказа:</span>
                        <span className={styles.statusValue}>
                          {statusTranslations[paymentStatuses[order.id].order_status] || 
                           paymentStatuses[order.id].order_status}
                        </span>
                      </p>
                      
                      {paymentStatuses[order.id].payment_status === 'succeeded' && (
                        <p className={styles.successMessage}>
                          Платеж успешно проведен!
                        </p>
                      )}
                      
                      {/* Добавляем кнопку оплаты, если статус ожидает оплаты */}
                      {(paymentStatuses[order.id].payment_status !== 'succeeded' && 
                        (order.status === 'waiting_payment' || paymentStatuses[order.id].order_status === 'waiting_payment')) && (
                        <div className={styles.paymentActions}>
                          <Link 
                            to={`/payment/${order.id}`} 
                            className={styles.payButton}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Оплатить заказ
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {paymentErrors[order.id] && (
                  <div className={styles.paymentError}>
                    <p>{paymentErrors[order.id]}</p>
                  </div>
                )}
                
                {/* Кнопка оплаты для неоплаченных заказов с онлайн-оплатой */}
                {!paymentStatuses[order.id] && order.status === 'waiting_payment' && order.payment_method === 'online' && (
                  <div className={styles.paymentActions}>
                    <Link 
                      to={`/payment/${order.id}`} 
                      className={styles.payButton}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Оплатить заказ
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders; 