import { IProduct } from '../../../interfaces/products.interface.ts';
import { HTMLAttributes } from 'react';

export interface CatalogListItemProps extends HTMLAttributes<HTMLDivElement>  {
  product: IProduct;
  titleLevel?:  1 | 2 | 3 | 4 | 5 | 6;
}
