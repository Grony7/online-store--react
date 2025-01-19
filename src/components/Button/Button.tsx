import styles from './Button.module.scss';
import cn from 'classnames';
import { ButtonProps } from './Button.props.ts';

const Button = ({ children, className, ...props }:ButtonProps) => {
  return (
    <button className={cn(styles.button, styles.accent, className)} {...props}>
      {children}
    </button>
  );
};

export default Button;
