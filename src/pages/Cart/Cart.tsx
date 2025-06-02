import { FC, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import cn from 'classnames';
import styles from './Cart.module.scss';
import { CartProps } from './Cart.props';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { cartActions } from '../../store/cart.slice';
import CartItem from '../../components/CartItem/CartItem';


export const Cart: FC<CartProps> = ({ className, ...props }) => {
  const dispatch = useDispatch();
  const { items } = useSelector((state: RootState) => state.cart);
  const [isAllSelected, setIsAllSelected] = useState<boolean>(false);

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
    dispatch(cartActions.toggleSelectItem({ id, colorId }));
  };

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      dispatch(cartActions.deselectAll());
    } else {
      dispatch(cartActions.selectAll());
    }
  };

  const handleRemoveSelected = () => {
    dispatch(cartActions.removeSelected());
  };

  // Расчет итоговой суммы и скидки только для выбранных товаров
  const totalRegularPrice = items
    .filter(item => item.selected)
    .reduce((sum, item) => sum + item.price * item.count, 0);
    
  const totalSalePrice = items
    .filter(item => item.selected)
    .reduce((sum, item) => {
      const price = item.sale_price ? item.sale_price : item.price;
      return sum + price * item.count;
    }, 0);
    
  const hasDiscount = totalRegularPrice > totalSalePrice;
  const selectedCount = items.filter(item => item.selected).length;

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
                  {selectedCount > 0 && (
                    <button 
                      className={styles.removeSelectedButton}
                      onClick={handleRemoveSelected}
                    >
                      Удалить выбранные ({selectedCount})
                    </button>
                  )}
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
                      {totalSalePrice.toLocaleString()} ₽
                    </span>
                    {hasDiscount && (
                      <span className={styles.summaryOldPrice}>
                        {totalRegularPrice.toLocaleString()} ₽
                      </span>
                    )}
                  </div>
                </div>

                <button
                  className={cn(styles.checkoutButton, {
                    [styles.disabled]: selectedCount === 0
                  })}
                  disabled={selectedCount === 0}
                  onClick={() => {
                    if (selectedCount > 0) {
                      window.location.href = '/checkout';
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

// Функция для правильного склонения слова "товар"
function getItemsCountText(count: number): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return 'товаров';
  }
  
  if (lastDigit === 1) {
    return 'товар';
  }
  
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'товара';
  }
  
  return 'товаров';
}

export default Cart;
