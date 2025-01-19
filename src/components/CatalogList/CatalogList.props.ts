import { HTMLAttributes } from 'react';
import { IProduct } from '../../interfaces/products.interface.ts';

export interface CatalogListProps extends HTMLAttributes<HTMLDivElement> {
  products: IProduct[];
}
