/// <reference types="vite-plugin-svgr/client" />

import styles from './FavoritesButton.module.scss';
import { FavoritesButtonProps } from './FavoritesButton.props.ts';
import cn from 'classnames';
import HeartIcon from './heart.svg?react';

const FavoritesButton = ({ ref, className, ...props }: FavoritesButtonProps) => {
  return (
    <button className={cn(styles.btn, className)} {...props} ref={ref}>
      <HeartIcon className={styles.icon} />
    </button>
  );
};

export default FavoritesButton;
