import { TitleProps } from './Title.props.ts';
import styles from './Title.module.scss';
import cn from 'classnames';
import { JSX } from 'react';


const Title = ({ level = 2, children, className, ...props }: TitleProps) => {
  const HeadingTag: keyof JSX.IntrinsicElements = `h${level}`;

  return (
    <HeadingTag className={cn(className, styles.title)} {...props}>
      {children}
    </HeadingTag>
  );
};

export default Title;
