// Базовый элемент избранных (только ID)
export interface FavoriteItemBase {
  id: number;        // ID продукта
  colorId?: number;  // ID выбранного цвета (опционально)
}

// Краткая информация о товаре из API для избранных
export interface FavoriteItemDetails {
  id: number;
  title: string;
  price: number;
  sale_price: number | null;
  on_sale: boolean;
  image: string;
  quantity: number;
  color: {
    name: string;
    hex_code: string;
  };
  inStock?: boolean; // Расчетное поле
  discount_percent?: number; // Расчетное поле
}

// Полный элемент избранных с подгруженными данными
export interface FavoriteItemFull extends FavoriteItemBase {
  details?: FavoriteItemDetails;
  isLoading?: boolean;
  isError?: boolean;
}

export interface FavoritesState {
  items: FavoriteItemFull[];
} 