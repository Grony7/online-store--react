import { TitleProps } from './Title.props.ts';
import styles from './Title.module.scss';
import cn from 'classnames';

const Title = ({ children, className, ...props}: TitleProps) => {
  return (
    <h2 className={ cn(className, styles.title)} {...props}>
      {children}
    </h2>
  );

};

export default Title;
