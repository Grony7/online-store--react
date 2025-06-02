import { HTMLAttributes } from 'react';
import { ICatalogCategory } from '../../../interfaces/products.interface.ts';

export interface CategoriesSwiperItemProps extends HTMLAttributes<HTMLAnchorElement > {
  data: ICatalogCategory
}
