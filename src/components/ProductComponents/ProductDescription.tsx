import React, { FC } from 'react';
import cn from 'classnames';
import { IProductDetail } from '../../interfaces/product-detail.interface';
import styles from './ProductDescription.module.scss';

interface ProductDescriptionProps {
  product: IProductDetail;
  className?: string;
}

const ProductDescription: FC<ProductDescriptionProps> = ({
  product,
  className
}) => {
  if (!product.description || product.description.length === 0) {
    return null;
  }

  return (
    <div className={cn(styles.description, className)}>
      <h2 className={styles.descriptionTitle}>Описание</h2>
      <div className={styles.descriptionContent}>
        {product.description.map((item, index) => {
          if (item.type === 'paragraph') {
            return (
              <p key={index}>
                {item.children.map((child, childIndex) => (
                  <span key={childIndex}>{child.text}</span>
                ))}
              </p>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default ProductDescription; 