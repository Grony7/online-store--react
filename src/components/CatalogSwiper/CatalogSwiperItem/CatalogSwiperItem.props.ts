import { HTMLAttributes } from 'react';
import { ICatalogCategory } from '../../../interfaces/products.interface.ts';

export interface CatalogSwiperItemProps extends HTMLAttributes<HTMLAnchorElement > {
  data: ICatalogCategory
}
