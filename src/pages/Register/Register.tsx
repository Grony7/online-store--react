import styles from './Register.module.scss';
import Input from '../../components/Input/Input.tsx';
import Button from '../../components/Button/Button.tsx';
import { Link } from 'react-router-dom';
import Title from '../../components/Title/Title.tsx';
import cn from 'classnames';
import * as axios from 'axios';
import { RegisterResponse } from '../../interfaces/auth.interface.ts';

export interface IRegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
}


const Register = () => {
  const handleSubmit = async (formData: unknown) => {
    // const { data } = await axios.post<RegisterResponse>('https://150.241.113.6/api/register', {
    //   username: formData.username;
    //   email: string;
    //   password: string;
    //   confirmPassword: string;
    //   phoneNumber: string;
    // });
  };

  return (
    <div className={styles.wrapper}>
      <Title className={styles.title}>Регистрация</Title>
      <form className={styles.form} action={handleSubmit}>
        <label className={styles.label}>
          <span className={styles.labelText}>Ваше имя</span>
          <Input placeholder='Имя' name='username' type='text'/>
        </label>
        <label className={styles.label}>
          <span className={styles.labelText}>Ваш email</span>
          <Input placeholder='Email' name='email' type='email'/>
        </label>
        <label className={styles.label}>
          <span className={styles.labelText}>Ваш номер телефона</span>
          <Input placeholder='phoneNumber' name='phoneNumber' type='tel'/>
        </label>
        <label className={styles.label}>
          <span className={styles.labelText}>Ваш пароль</span>
          <Input placeholder='Пароль' name='password' type='password'/>
        </label>
        <label className={styles.label}>
          <span className={styles.labelText}>Повторите ваш пароль</span>
          <Input placeholder='Повторите ваш пароль' name='confirmPassword' type='password'/>
        </label>
        <Button className={styles.button}>Зарегистрироваться</Button>
      </form>
      <div className={styles.registerWrapper}>
        <span className={styles.registerText}>Есть аккаунт?</span>
        <Link className={cn(styles.registerLink, styles.registerText)} to='/auth/login'>Войти</Link>
      </div>
    </div>
  );
};

export default Register;
