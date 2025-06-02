export interface ICartItem {
  id: number;
  colorId: number;
  count: number;
  name: string;
  price: number;
  sale_price?: number | null;
  image: string;
  mediaType?: 'image' | 'video';
  selected?: boolean;
  color: {
    name: string;
    hex: string;
  }
}

export interface ICartState {
  items: ICartItem[];
} 