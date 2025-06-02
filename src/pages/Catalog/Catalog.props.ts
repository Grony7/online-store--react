import { HTMLAttributes } from 'react';
import { IProduct } from '../../interfaces/products.interface';

export interface CatalogProps extends HTMLAttributes<HTMLDivElement> {
}


export interface IGetCatalog {
    data: Data
    meta: Meta
}
  
  export interface Data {
    category: ICategory
    products: IProduct[]
  }
  
  export interface ICategory {
    slug: string
    name: string
  }
  

  
  export interface Meta {
    pagination: Pagination
  }
  
  export interface Pagination {
    page: number
    pageSize: number
    pageCount: number
    total: number
  }