/// <reference types="vite-plugin-svgr/client" />

import { forwardRef } from 'react';
import cn from 'classnames';
import styles from './Search.module.scss';
import SearchIcon from './search.svg?react';
import { SearchProps } from './Search.props.ts';

const Search = forwardRef<HTMLInputElement, SearchProps>(({className, ...props }, ref) => {
  return (
    <div className={styles.wrapper}>
      <input  {...props}
        ref={ref}
        className={
          cn(styles.search, className)
        }
      />
      <SearchIcon className={styles.icon} width='16' height='16'/>
    </div>

  );
});

export default Search;
