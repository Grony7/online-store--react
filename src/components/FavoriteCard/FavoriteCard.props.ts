import { HTMLAttributes} from 'react';
import { IProduct } from '../../interfaces/product.interface.ts';

export interface FavoriteCardProps extends HTMLAttributes<HTMLDivElement> {
  product: IProduct;
}
