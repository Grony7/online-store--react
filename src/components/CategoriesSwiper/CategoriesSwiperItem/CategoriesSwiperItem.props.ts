import { HTMLAttributes } from 'react';
import { ICatalogCategory } from '../../../interfaces/product.interface.ts';

export interface CategoriesSwiperItemProps extends HTMLAttributes<HTMLAnchorElement > {
  data: ICatalogCategory
}
