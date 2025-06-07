import { HTMLAttributes } from 'react';
import { ICatalogCategory } from '../../../interfaces/catalog.interface.ts';

export interface CategoriesSwiperItemProps extends HTMLAttributes<HTMLAnchorElement > {
  data: ICatalogCategory
}
