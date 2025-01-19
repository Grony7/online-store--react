import styles from './Catalog.module.scss';
import { CatalogProps } from './Catalog.props.ts';
import { useParams } from 'react-router-dom';
import CatalogList from '../../components/CatalogList/CatalogList.tsx';
import axios from 'axios';
import {  IProduct } from '../../interfaces/products.interface.ts';
import { useEffect, useState } from 'react';

const Catalog = ({ ...props }: CatalogProps) => {
  const { type } = useParams<string>();
  const [products, setProducts] = useState<IProduct[]>([]);

  const getProducts = async () => {
    const {data} = await axios.get<IProduct[]>(`${import.meta.env.VITE_API_URL}/api/products/get/phone`)
    setProducts(data)
  }

  useEffect(() => {
    getProducts();
  }, [products]);

  return (
    <section className={styles.wrapper} {...props}>
      <h1>Каталог</h1>
      <p>Текущий ID: {type}</p>
      {products.length > 0 && <CatalogList products={products} />}
    </section>
  );
};

export default Catalog;
