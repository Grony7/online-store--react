import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import cn from 'classnames';
import styles from './Cart.module.scss';
import { CartProps } from './Cart.props';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { cartActions } from '../../store/cart.slice';
import { CartItemFull } from '../../interfaces/cart.interface';
import CartItem from '../../components/CartItem/CartItem';
import axios from 'axios';

const getItemsCountText = (count: number): string => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'товаров';
  }

  switch (lastDigit) {
  case 1:
    return 'товар';
  case 2:
  case 3:
  case 4:
    return 'товара';
  default:
    return 'товаров';
  }
};

export const Cart  = ({ className, ...props }: CartProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: cartItems } = useSelector((state: RootState) => state.cart);
  const [items, setItems] = useState<CartItemFull[]>([]);
  const [isAllSelected, setIsAllSelected] = useState<boolean>(false);
  const navigate = useNavigate();

  // Загружаем данные о товарах
  useEffect(() => {
    if (cartItems.length === 0) {
      setItems([]);
      return;
    }

    const loadItemsData = async () => {
      const requests = cartItems.map(async (item): Promise<CartItemFull> => {
        try {
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:1337';
          const url = item.colorId 
            ? `${baseUrl}/api/products/brief/${item.id}?colorId=${item.colorId}`
            : `${baseUrl}/api/products/brief/${item.id}`;

          const response = await axios.get(url);
          const { data } = response;

          return {
            id: item.id,
            colorId: item.colorId,
            count: item.count,
            selected: item.selected !== undefined ? item.selected : true,
            details: {
              id: data.id,
              title: data.title,
              price: data.price,
              sale_price: data.sale_price,
              on_sale: data.on_sale || false,
              image: data.image,
              quantity: data.quantity,
              color: data.color
            },
            isLoading: false,
            isError: false
          };
        } catch {
          return {
            id: item.id,
            colorId: item.colorId,
            count: item.count,
            selected: item.selected !== undefined ? item.selected : true,
            isLoading: false,
            isError: true
          };
        }
      });

      try {
        const results = await Promise.all(requests);
        setItems(results);
      } catch (error) {
        console.error('Ошибка при загрузке товаров корзины:', error);
      }
    };

    loadItemsData();
  }, [cartItems]);

  // Обновляем selected в локальном состоянии при изменении в Redux
  useEffect(() => {
    if (cartItems.length === 0) {
      setItems([]);
      return;
    }

    // Обновляем только поля selected, сохраняя остальные данные
    setItems(prevItems =>
      prevItems.map(item => {
        const cartItem = cartItems.find(ci => ci.id === item.id && ci.colorId === item.colorId);
        if (cartItem) {
          return {
            ...item,
            selected: cartItem.selected !== undefined ? cartItem.selected : item.selected
          };
        }
        return item;
      })
    );
  }, [cartItems]);

  // Проверяем выбраны ли все товары
  useEffect(() => {
    if (items.length === 0) {
      setIsAllSelected(false);
      return;
    }

    const allSelected = items.every(item => item.selected);
    setIsAllSelected(allSelected);
  }, [items]);

  const handleRemoveItem = (id: number, colorId: number) => {
    dispatch(cartActions.remove({ id, colorId }));
  };

  const handleIncrementItem = (id: number, colorId: number) => {
    dispatch(cartActions.increase({ id, colorId }));
  };

  const handleDecrementItem = (id: number, colorId: number) => {
    dispatch(cartActions.decrease({ id, colorId }));
  };

  const handleToggleSelectItem = (id: number, colorId: number) => {
    // Находим текущий элемент и его состояние
    const currentItem = items.find(item => item.id === id && item.colorId === colorId);
    const newSelectedState = currentItem ? !currentItem.selected : true;

    // Обновляем локальное состояние для немедленного отображения
    setItems(prev => prev.map(item =>
      item.id === id && item.colorId === colorId
        ? { ...item, selected: newSelectedState }
        : item
    ));

    // Обновляем состояние в Redux для сохранения при навигации
    dispatch(cartActions.toggleSelectItem({ id, colorId }));
  };

  const handleToggleSelectAll = () => {
    const newSelectedState = !isAllSelected;

    // Обновляем локальное состояние
    setItems(prev => prev.map(item => ({ ...item, selected: newSelectedState })));

    // Обновляем состояние в Redux
    if (newSelectedState) {
      dispatch(cartActions.selectAll());
    } else {
      dispatch(cartActions.deselectAll());
    }
  };

  const handleRemoveSelected = () => {
    dispatch(cartActions.removeSelected());
  };

  const handleClearCart = () => {
    if (window.confirm('Вы уверены, что хотите очистить корзину?')) {
      dispatch(cartActions.clear());
    }
  };

  // Расчет итоговой суммы только для выбранных товаров с загруженными данными
  const selectedItemsWithDetails = items.filter(item => item.selected && item.details);

  const totalPrice = selectedItemsWithDetails.reduce((sum, item) => {
    if (!item.details) return sum;

    const effectivePrice = item.details.on_sale && item.details.sale_price
      ? item.details.sale_price
      : item.details.price;

    return sum + effectivePrice * item.count;
  }, 0);

  const selectedCount = selectedItemsWithDetails.length;

  return (
    <div className={cn(styles.cartPage, className)} {...props}>
      <div className={styles.container}>
        <div className={styles.breadcrumbs}>
          <Link to="/" className={styles.breadcrumbLink}>Главная</Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span className={styles.breadcrumbCurrent}>Корзина</span>
        </div>

        <div className={styles.header}>
          <h1 className={styles.title}>Корзина</h1>
        </div>

        {items.length > 0 ? (
          <>
            <div className={styles.content}>
              <div className={styles.itemsList}>
                <div className={styles.controlPanel}>
                  <div className={styles.selectAllContainer}>
                    <label className={styles.selectAllLabel}>
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleToggleSelectAll}
                        className={styles.selectAllCheckbox}
                      />
                      <span className={styles.checkmark}></span>
                      <span className={styles.selectAllText}>Выбрать всё</span>
                    </label>
                  </div>
                  <div className={styles.controlButtons}>
                    {selectedCount > 0 && (
                      <button
                        className={styles.removeSelectedButton}
                        onClick={handleRemoveSelected}
                      >
                        Удалить выбранные ({selectedCount})
                      </button>
                    )}
                    <button
                      className={styles.clearCartButton}
                      onClick={handleClearCart}
                    >
                      Очистить корзину
                    </button>
                  </div>
                </div>

                {items.map(item => (
                  <CartItem
                    key={`${item.id}-${item.colorId}`}
                    item={item}
                    onRemove={handleRemoveItem}
                    onIncrement={handleIncrementItem}
                    onDecrement={handleDecrementItem}
                    onToggleSelect={handleToggleSelectItem}
                  />
                ))}
              </div>

              <div className={styles.orderSummary}>
                <div className={styles.summaryHeader}>
                  <div className={styles.summaryInfo}>
                    <span className={styles.summaryTitle}>Итого:</span>
                    <span className={styles.selectedItemsCount}>
                      {selectedCount} {getItemsCountText(selectedCount)}
                    </span>
                  </div>
                  <div className={styles.summaryPrices}>
                    <span className={styles.summaryCurrentPrice}>
                      {totalPrice.toLocaleString()} ₽
                    </span>
                  </div>
                </div>

                <button
                  className={cn(styles.checkoutButton, {
                    [styles.disabled]: selectedCount === 0
                  })}
                  disabled={selectedCount === 0}
                  onClick={() => {
                    if (selectedCount > 0) {
                      navigate('/checkout');
                    }
                  }}
                >
                  Оформить заказ
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.emptyCart}>
            <h2 className={styles.emptyCartTitle}>Ваша корзина пуста</h2>
            <p className={styles.emptyCartText}>
              Добавьте товары в корзину, чтобы продолжить покупки.
            </p>
            <Link to="/catalog" className={styles.continueShopping}>
              Перейти в каталог
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
