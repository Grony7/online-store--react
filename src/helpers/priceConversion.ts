export const priceConversion = (price: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(price);
