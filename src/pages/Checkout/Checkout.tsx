import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../../store/store';
import { cartActions } from '../../store/cart.slice';
import {
  YMaps,
  Map,
  Placemark
} from '@pbe/react-yandex-maps';
import styles from './Checkout.module.scss';
import axios, { AxiosError } from 'axios';
import { CartItemFull } from '../../interfaces/cart.interface';

// Добавляем интерфейс для ответа API
interface OrderApiResponse {
  data: {
    payment_url: string;
    order_id: number;
  }
}

interface FormState {
  name: string;
  email: string;
  phone: string;
}
interface ErrorState {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}
interface Address {
  id: number;
  full_address: string;
  latitude: number;
  longitude: number;
}

const API_KEY = import.meta.env.VITE_MAP_API_KEY as string;

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  // user + cart из Redux
  const jwt = useSelector((s: RootState) => s.user.jwt);
  const profile = useSelector((s: RootState) => s.user.profile);
  const cartItems = useSelector(
    (s: RootState) => s.cart.items
  );

  // Состояние для товаров с загруженными деталями
  const [itemsWithDetails, setItemsWithDetails] = useState<CartItemFull[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // form state
  const [form, setForm] = useState<FormState>({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: ''
  });
  const [addressId, setAddressId] = useState<number | null>(null);
  const [addressString, setAddressString] = useState<string>('');
  const [errors, setErrors] = useState<ErrorState>({});

  // modal + points
  const [modalOpen, setModalOpen] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);

  // Добавляем состояние для отображения ошибки заказа
  const [orderError, setOrderError] = useState<string | null>(null);

  // Загружаем детали товаров в корзине
  useEffect(() => {
    const loadCartItemsDetails = async () => {
      // Отфильтровываем только выбранные товары
      const selectedItems = cartItems.filter(item => item.selected);
      
      if (selectedItems.length === 0) {
        setItemsWithDetails([]);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        // Подготавливаем запросы для всех выбранных товаров
        const requests = selectedItems.map(async (item): Promise<CartItemFull> => {
          try {
            const url = `${import.meta.env.VITE_API_URL}/api/products/brief/${item.id}?colorId=${item.colorId}`;
            const response = await axios.get(url);
            
            return {
              ...item,
              details: {
                id: response.data.id,
                title: response.data.title,
                price: response.data.price,
                sale_price: response.data.sale_price || response.data.price,
                on_sale: response.data.on_sale || false,
                image: response.data.image,
                quantity: response.data.quantity,
                color: response.data.color
              },
              isLoading: false,
              isError: false
            };
          } catch {
            return {
              ...item,
              isLoading: false,
              isError: true
            };
          }
        });

        const results = await Promise.all(requests);
        setItemsWithDetails(results);
      } catch (error) {
        console.error('Ошибка при загрузке деталей товаров:', error);
        setLoadError('Не удалось загрузить информацию о товарах');
      } finally {
        setIsLoading(false);
      }
    };

    loadCartItemsDetails();
  }, [cartItems]);

  // при открытии модалки — грузим список
  useEffect(() => {
    if (!modalOpen) return;

    const fetchPickupPoints = async () => {
      try {
        const response = await axios.get<{ data: Address[] }>(
          `${import.meta.env.VITE_API_URL}/api/pickup-points`
        );
        setAddresses(response.data.data);
      } catch (err) {
        console.error('Ошибка загрузки пунктов выдачи:', err);
      }
    };

    fetchPickupPoints();
  }, [modalOpen]);

  useEffect(() => {
    // Проверяем наличие JWT - если его нет, перенаправляем на страницу логина
    if (!jwt) {
      // Сохраняем URL для возврата после авторизации
      sessionStorage.setItem('redirect_after_login', '/checkout');
      navigate('/login');
    }
  }, [jwt, navigate]);

  // хелперы формы
  const handleChange =
    (field: keyof FormState) =>
      (e: ChangeEvent<HTMLInputElement>) => {
        setForm((p) => ({ ...p, [field]: e.target.value }));
        if (errors[field]) {
          setErrors((p) => ({ ...p, [field]: undefined }));
        }
      };

  const validate = (): boolean => {
    const newErrors: ErrorState = {};
    if (!form.name.trim()) newErrors.name = 'Введите имя';
    if (!/^\+?\d{10,15}$/.test(form.phone))
      newErrors.phone = 'Неверный формат телефона';
    if (!addressId) newErrors.address = 'Укажите адрес пункта выдачи';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setOrderError(null); // Сбрасываем ошибку при каждой отправке
    
    if (!validate()) return;

    // Получаем только выбранные товары
    const selectedCartItems = cartItems.filter(item => item.selected);
    
    if (selectedCartItems.length === 0) {
      setOrderError('В корзине нет выбранных товаров');
      return;
    }

    // Собираем тело заказа
    const orderPayload = {
      pickup_point_id: addressId!,
      delivery_method: 'pickup',
      customer_name: form.name,
      phone: form.phone,
      payment_method: 'online',
      items: selectedCartItems.map((it) => ({
        variant_id: it.colorId,
        quantity: it.count
      }))
    };

    try {
      console.log('Отправка заказа:', orderPayload);
      
      const { data } = await axios.post<OrderApiResponse>(
        `${import.meta.env.VITE_API_URL}/api/orders`,
        orderPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwt}`
          }
        }
      );

      console.log('Ответ сервера:', data.data);

      // Очищаем корзину после успешного создания заказа
      dispatch(cartActions.clear());

      // Сохраняем информацию о том, что мы переходим с checkout
      sessionStorage.setItem('payment_access', 'true');
      
      // Проверяем, что URL начинается с "/", если да - используем как есть, иначе - считаем его полным URL
      if (data.data.payment_url && data.data.payment_url.startsWith('/')) {
        // Удаляем начальный слеш, чтобы избежать двойного слеша
        const paymentUrl = data.data.payment_url.substring(1);
        console.log('Формируем URL для внутренней навигации:', `/payment/${paymentUrl}`);
        window.location.href = `/payment/${paymentUrl}`;
      } else if (data.data.payment_url && data.data.payment_url.startsWith('http')) {
        // Если это полный URL, используем window.location
        console.log('Перенаправление на внешний URL:', data.data.payment_url);
        window.location.href = data.data.payment_url;
      } else {
        // Если это ID или что-то иное - переходим на страницу оплаты с ID
        console.log('Перенаправление на страницу оплаты с order_id:', data.data.order_id);
        window.location.href = `/payment/${data.data.order_id}`;
      }

    } catch (err: unknown) {
      const error = err as AxiosError;
      const errorMessage = 
        typeof error.response?.data === 'object' && error.response?.data && 'message' in error.response.data
          ? (error.response.data as { message: string }).message
          : 'Ошибка оформления заказа';
      
      console.error(
        'Ошибка оформления заказа:',
        error.response?.data || error
      );
      setOrderError(errorMessage);
    }
  };

  // Расчет итоговой суммы заказа
  const totalPrice = itemsWithDetails.reduce((sum, item) => {
    if (!item.details) return sum;
    
    // Используем цену со скидкой если товар участвует в акции, иначе обычную цену
    const effectivePrice = item.details.on_sale && item.details.sale_price 
      ? item.details.sale_price 
      : item.details.price;
      
    return sum + effectivePrice * item.count;
  }, 0);

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumbs}>
        Главная / Корзина / Оформление заказа
      </nav>
      <h1 className={styles.title}>Оформление заказа</h1>

      {isLoading ? (
        <div className={styles.loading}>Загрузка данных о товарах...</div>
      ) : loadError ? (
        <div className={styles.error}>{loadError}</div>
      ) : (
      <form
        className={styles.form}
        onSubmit={handleSubmit}
        noValidate
      >
        {/* Самовывоз */}
        <section className={styles.pickupSection}>
          <h2 className={styles.sectionTitle}>Самовывоз</h2>
          <div className={styles.fieldGroup}>
            <label
              htmlFor="address"
              className={styles.label}
            >
              Адрес пункта выдачи
            </label>
            <div
              className={`${styles.inputWrapper} ${
                errors.address ? styles.error : ''
              }`}
            >
              <input
                id="address"
                type="text"
                readOnly
                value={addressString}
                placeholder="Выберите адрес"
                className={styles.input}
                onClick={() => setModalOpen(true)}
              />
              <button
                type="button"
                className={styles.editBtn}
                aria-label="Выбрать адрес"
                onClick={() => setModalOpen(true)}
              >
                +
              </button>
            </div>
            {errors.address && (
              <span className={styles.errorMsg}>
                {errors.address}
              </span>
            )}
          </div>
        </section>

        {/* Контакты */}
        <section className={styles.contactsSection}>
          <h2 className={styles.sectionTitle}>
            Контактные данные
          </h2>

          {/* Имя */}
          <div className={styles.fieldGroup}>
            <label
              htmlFor="name"
              className={styles.label}
            >
              Имя
            </label>
            <div
              className={`${styles.inputWrapper} ${
                errors.name ? styles.error : ''
              }`}
            >
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={handleChange('name')}
                className={styles.input}
              />
              {!errors.name && form.name && (
                <span className={styles.validIcon}>✔</span>
              )}
            </div>
            {errors.name && (
              <span className={styles.errorMsg}>
                {errors.name}
              </span>
            )}
          </div>

          {/* Телефон */}
          <div className={styles.fieldGroup}>
            <label
              htmlFor="phone"
              className={styles.label}
            >
              Телефон
            </label>
            <div
              className={`${styles.inputWrapper} ${
                errors.phone ? styles.error : ''
              }`}
            >
              <input
                id="phone"
                type="tel"
                placeholder="+7XXXXXXXXXX"
                value={form.phone}
                onChange={handleChange('phone')}
                className={styles.input}
              />
              {errors.phone && (
                <span className={styles.errorIcon}>!</span>
              )}
            </div>
            {errors.phone && (
              <span className={styles.errorMsg}>
                {errors.phone}
              </span>
            )}
          </div>
          </section>
          
          {/* Информация о заказе */}
          <section className={styles.orderSection}>
            <h2 className={styles.sectionTitle}>Ваш заказ</h2>
            
            {itemsWithDetails.length > 0 ? (
              <div className={styles.orderItems}>
                {itemsWithDetails.map(item => (
                  item.details && (
                    <div key={`${item.id}-${item.colorId}`} className={styles.orderItem}>
                      <div className={styles.orderItemInfo}>
                        <div className={styles.orderItemTitle}>
                          {item.details.title} 
                          {item.details.color && (
                            <span className={styles.orderItemColor}>
                              {item.details.color.name}
                            </span>
                          )}
                        </div>
                        <div className={styles.orderItemQuantity}>
                          {item.count} шт.
                        </div>
                      </div>
                      <div className={styles.orderItemPrice}>
                        {((item.details.on_sale && item.details.sale_price ? 
                          item.details.sale_price : 
                          item.details.price) * item.count).toLocaleString()} ₽
                      </div>
                    </div>
                  )
                ))}
              </div>
            ) : (
              <div className={styles.emptyOrder}>
                Нет выбранных товаров в корзине
              </div>
            )}
        </section>

        {/* Футер */}
        <div className={styles.footerBar}>
            {orderError && (
              <div className={styles.orderError}>
                {orderError}
              </div>
            )}
          <div className={styles.total}>
            Итого:{' '}
            <span className={styles.amount}>
                {totalPrice.toLocaleString()} ₽
            </span>
          </div>
          <button
            type="submit"
            className={styles.submitBtn}
          >
            Оплатить
          </button>
        </div>
      </form>
      )}

      {/* Модалка с картой */}
      {modalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setModalOpen(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <YMaps
              query={{ apikey: API_KEY, lang: 'ru_RU' }}
            >
              <Map
                defaultState={{
                  center: addresses.length
                    ? [
                      addresses[0].latitude,
                      addresses[0].longitude
                    ]
                    : [59.93, 30.31],
                  zoom: 10
                }}
                className={styles.mapContainer}
              >
                {addresses.map((addr) => (
                  <Placemark
                    key={addr.id}
                    geometry={[
                      addr.latitude,
                      addr.longitude
                    ]}
                    properties={{
                      balloonContent: addr.full_address
                    }}
                    options={{
                      preset:
                        'islands#violetDotIcon'
                    }}
                    onClick={() => {
                      setAddressId(addr.id);
                      setAddressString(
                        addr.full_address
                      );
                      setModalOpen(false);
                    }}
                  />
                ))}
              </Map>
            </YMaps>

            <ul className={styles.addressList}>
              {addresses.map((addr) => (
                <li
                  key={addr.id}
                  className={
                    styles.addressItem
                  }
                  onClick={() => {
                    setAddressId(addr.id);
                    setAddressString(
                      addr.full_address
                    );
                    setModalOpen(false);
                  }}
                >
                  {addr.full_address}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
