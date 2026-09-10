export const timeSlots = ['09:00–11:00', '11:00–13:00', '13:00–15:00', '15:00–17:00', '17:00–19:00', '19:00–21:00'] as const;
export type CheckoutData = {
  name: string; phone: string; sameRecipient: boolean;
  recipientName: string; recipientPhone: string;
  method: 'delivery' | 'pickup'; city: string; street: string; house: string;
  apartment: string; courierComment: string; date: string; time: string;
  cardText: string; comment: string;
};
export type CheckoutErrors = Partial<Record<keyof CheckoutData, string>>;
export type OrderItem = { id: number; name: string; image: string; price: number; quantity: number };
export const emptyCheckout: CheckoutData = {
  name: '', phone: '', sameRecipient: true, recipientName: '', recipientPhone: '',
  method: 'delivery', city: '', street: '', house: '', apartment: '',
  courierComment: '', date: '', time: '', cardText: '', comment: '',
};
export function localToday(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export function validPhone(phone: string) {
  return /^\+?[\d\s()-]+$/.test(phone.trim()) && /^[78]\d{10}$/.test(phone.replace(/\D/g, ''));
}
export function validateCheckout(data: CheckoutData, today = localToday()): CheckoutErrors {
  const errors: CheckoutErrors = {};
  const required = (key: keyof CheckoutData, message: string) => {
    if (!String(data[key]).trim()) errors[key] = message;
  };
  required('name', 'Укажите ваше имя');
  if (!validPhone(data.phone)) errors.phone = 'Укажите телефон в формате +7 (999) 123-45-67 или 8 999 123-45-67';
  if (!data.sameRecipient) {
    required('recipientName', 'Укажите имя получателя');
    if (!validPhone(data.recipientPhone)) errors.recipientPhone = 'Укажите российский телефон получателя: +7 или 8 и ещё 10 цифр';
  }
  if (!['delivery', 'pickup'].includes(data.method)) errors.method = 'Выберите способ получения';
  if (data.method === 'delivery') {
    required('city', 'Укажите город'); required('street', 'Укажите улицу'); required('house', 'Укажите дом');
  }
  const parsed = new Date(`${data.date}T12:00:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) || Number.isNaN(parsed.getTime()) || localToday(parsed) !== data.date) errors.date = 'Выберите дату получения';
  else if (data.date < today) errors.date = 'Выберите сегодня или будущую дату';
  if (!(timeSlots as readonly string[]).includes(data.time)) errors.time = 'Выберите время получения';
  if (data.cardText.length > 250) errors.cardText = 'Не больше 250 символов';
  return errors;
}

export function makeOrder(data: CheckoutData, items: OrderItem[]) {
  // Local demo snapshot only. No network, persistence, authentication or payment.
  return {
    number: '1024', items: items.map(item => ({ ...item })),
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    customer: { name: data.name.trim(), phone: data.phone.trim() },
    recipient: data.sameRecipient
      ? { name: data.name.trim(), phone: data.phone.trim() }
      : { name: data.recipientName.trim(), phone: data.recipientPhone.trim() },
    method: data.method,
    address: data.method === 'delivery'
      ? [data.city.trim(), data.street.trim(), `д. ${data.house.trim()}`, data.apartment.trim() && `кв. / офис ${data.apartment.trim()}`].filter(Boolean).join(', ')
      : 'ул. Цветочная, 10',
    courierComment: data.method === 'delivery' ? data.courierComment.trim() : '',
    date: data.date, time: data.time, cardText: data.cardText.trim(), comment: data.comment.trim(),
  };
}
