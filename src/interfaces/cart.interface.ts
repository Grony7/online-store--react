// Базовый элемент корзины (только ID)
export interface CartItemBase {
  id: number;        // ID продукта
  colorId: number;   // ID выбранного цвета
  count: number;     // Количество товаров
  selected?: boolean; // Выбран ли товар (для чекбоксов)
}

// Краткая информация о товаре из API
export interface CartItemDetails {
  id: number;
  title: string;
  price: number;
  image: string;
  sale_price: number;
  on_sale: boolean;
  quantity: number;
  color: {
    name: string;
    hex_code: string;
  };
}

// Полный элемент корзины с подгруженными данными
export interface CartItemFull extends CartItemBase {
  details?: CartItemDetails;
  isLoading?: boolean;
  isError?: boolean;
}

export interface CartState {
  items: CartItemFull[];
} 