import styles from './Input.module.scss';
import cn from 'classnames';
import { InputProps } from './Input.props.ts';

const Input = ({ isValid = true, className, ref, ...props } : InputProps) => {
  return (
    <input  {...props}
      ref={ref}
      className={
        cn(styles.input, className, {
          [styles.inputInvalid]: !isValid,
          [styles.inputValid]: isValid
        })
      }
    />
  );
};

export default Input;
