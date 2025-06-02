import { ButtonHTMLAttributes, Ref } from 'react';
import { IProduct } from '../../interfaces/products.interface';

export interface FavoritesButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: Ref<HTMLButtonElement>;
  product: IProduct;
  isFavorite?: boolean;
}
