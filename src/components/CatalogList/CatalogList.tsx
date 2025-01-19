import styles from './CatalogList.module.scss';
import { CatalogListProps } from './CatalogList.props.ts';
import CatalogListItem from './CatalogListItem/CatalogListItem.tsx';

// const productList = [
//   {
//     "id": 1,
//     "listImages": "mainPhoto/117d7336-fefa-4248-a0e4-75b181cbbcc2.png",
//     "name": "Смартфон TECNO POVA 20 16/256 ГБ",
//     "colors": [
//       "Black",
//       "White"
//     ],
//     "characteristics": {
//       "колличество сим-карт": "2",
//       "описание": "Отличная автономность и выбор скорости зарядки. Энергоемкий аккумулятор дополнен зарядкой с различными режимами работы, которые можно менять в различных сценариях.",
//       "наличие микрофона": "да",
//       "вес": "0.5 кг",
//       "материал": "стекло"
//     },
//     "price": 18000.99,
//     "type": "phone",
//     "quantity": 100,
//     "discount": "0"
//   }
// ]

const CatalogList = ({ products, ...props }: CatalogListProps) => {
  return (
    <div className={styles.wrapper} {...props}>
      {products.map((product) => <CatalogListItem product={product} />)}
    </div>
  );
};

export default CatalogList;
