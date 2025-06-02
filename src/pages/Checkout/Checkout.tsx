import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
} from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../store/store';
import {
  YMaps,
  Map,
  Placemark,
} from '@pbe/react-yandex-maps';
import styles from './Checkout.module.scss';
import axios, { AxiosError } from 'axios';

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
  // user + cart из Redux
  const jwt = useSelector((s: RootState) => s.user.jwt);
  const profile = useSelector((s: RootState) => s.user.profile);
  const cartItems = useSelector(
    (s: RootState) => s.cart.items
  ) as Array<{ colorId: number; count: number }>;

  // form state
  const [form, setForm] = useState<FormState>({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: '',
  });
  const [addressId, setAddressId] = useState<number | null>(null);
  const [addressString, setAddressString] = useState<string>('');
  const [errors, setErrors] = useState<ErrorState>({});

  // modal + points
  const [modalOpen, setModalOpen] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);

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
    if (!/^[\w-.]+@[\w-]+\.[a-z]{2,}$/i.test(form.email))
      newErrors.email = 'Неверный формат email';
    if (!/^\+?\d{10,15}$/.test(form.phone))
      newErrors.phone = 'Неверный формат телефона';
    if (!addressId) newErrors.address = 'Укажите адрес пункта выдачи';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Собираем тело заказа
    const orderPayload = {
      pickup_point_id: addressId!,
      delivery_method:     'pickup',
      customer_name:       form.name,
      phone:       form.phone,// <-- ваше новое поле
      payment_method:      'online',       // <-- уже было
      items: cartItems.map((it) => ({
        variant_id: it.colorId,
        quantity:   it.count,
      })),
    };

    try {
      const resp = await axios.post<{ payment_url: string; id: number }>(
        `${import.meta.env.VITE_API_URL}/api/orders`,
        orderPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwt}`
          }
        }
      );

      // Сохраняем информацию о том, что мы переходим с checkout
      sessionStorage.setItem('payment_access', 'true');
      
      // Редирект на внутреннюю страницу оплаты с использованием React Router
      navigate(resp.data.payment_url);
    } catch (err: unknown) {
      const error = err as AxiosError;
      console.error(
        'Ошибка оформления заказа:',
        error.response?.data || error
      );
      // TODO: уведомить пользователя
    }
  };


  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumbs}>
        Главная / Корзина / Оформление заказа
      </nav>
      <h1 className={styles.title}>Оформление заказа</h1>

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

        {/* Футер */}
        <div className={styles.footerBar}>
          <div className={styles.total}>
            Итого:{' '}
            <span className={styles.amount}>
              279 978 ₽
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
                      addresses[0].longitude,
                    ]
                    : [59.93, 30.31],
                  zoom: 10,
                }}
                className={styles.mapContainer}
              >
                {addresses.map((addr) => (
                  <Placemark
                    key={addr.id}
                    geometry={[
                      addr.latitude,
                      addr.longitude,
                    ]}
                    properties={{
                      balloonContent: addr.full_address,
                    }}
                    options={{
                      preset:
                        'islands#violetDotIcon',
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
