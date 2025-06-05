import { ButtonHTMLAttributes, Ref } from 'react';
import { IProduct } from '../../interfaces/product.interface';

export interface FavoritesButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: Ref<HTMLButtonElement>;
  product: IProduct;
  isFavorite?: boolean;
}
