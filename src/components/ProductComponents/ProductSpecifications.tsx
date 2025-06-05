import React, { FC } from 'react';
import cn from 'classnames';
import { IProductDetail } from '../../interfaces/product-detail.interface';
import styles from './ProductSpecifications.module.scss';

interface ProductSpecificationsProps {
  product: IProductDetail;
  className?: string;
}

const ProductSpecifications: FC<ProductSpecificationsProps> = ({
  product,
  className
}) => {
  if (!product.specifications || product.specifications.length === 0) {
    return null;
  }

  return (
    <div className={cn(styles.specifications, className)}>
      <h2 className={styles.specificationsTitle}>Характеристики</h2>
      <div className={styles.specificationsList}>
        {product.specifications.map(spec => (
          <div key={spec.id} className={styles.specificationItem}>
            <span className={styles.specName}>{spec.name}</span>
            <span className={styles.specValue}>{spec.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductSpecifications; 