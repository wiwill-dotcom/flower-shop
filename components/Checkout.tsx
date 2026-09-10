'use client';

import { useEffect, useRef, useState, type FormEvent, type InputHTMLAttributes } from 'react';
import { ArrowLeft, ArrowUpRight, Check, MapPin, ShoppingBag } from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';
import { emptyCheckout, localToday, makeOrder, timeSlots, validateCheckout, type CheckoutData, type CheckoutErrors, type OrderItem } from '@/lib/checkout';

const money = (n: number) => new Intl.NumberFormat('ru-RU').format(n) + ' ₽';
type TextField = Exclude<keyof CheckoutData, 'sameRecipient' | 'method'>;
type Props = { items: OrderItem[]; onBack: () => void; onReturn: () => void };

function Items({ items }: { items: OrderItem[] }) {
  return <ul className="checkout-items">{items.map(item => <li key={item.id}>
    <img src={item.image} alt={item.name} /><div><h3>{item.name}</h3><p>{item.quantity} шт. × {money(item.price)}</p></div><strong>{money(item.price * item.quantity)}</strong>
  </li>)}</ul>;
}
function Totals({ total, delivery }: { total: number; delivery: boolean }) {
  return <dl className="checkout-totals"><div><dt>Товары</dt><dd>{money(total)}</dd></div>
    <div><dt>{delivery ? 'Доставка' : 'Самовывоз'}</dt><dd>{delivery ? 'уточнит администратор' : 'Бесплатно'}</dd></div>
    <div className="checkout-grand-total"><dt>Итого товаров</dt><dd>{money(total)}</dd></div></dl>;
}

export default function Checkout({ items, onBack, onReturn }: Props) {
  const { telegramUser, isTelegram } = useTelegram();
  const [data, setData] = useState<CheckoutData>({ ...emptyCheckout });
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [today, setToday] = useState('');
  const [order, setOrder] = useState<ReturnType<typeof makeOrder> | null>(null);
  const nameEdited = useRef(false);
  const form = useRef<HTMLFormElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    if (isTelegram && telegramUser?.first_name && !nameEdited.current) {
      setData(d => ({ ...d, name: telegramUser.first_name }));
    }
  }, [isTelegram, telegramUser?.first_name]);
  useEffect(() => {
    const update = () => setToday(localToday());
    update();
    const timer = setInterval(update, 60000);
    window.addEventListener('focus', update);
    return () => { clearInterval(timer); window.removeEventListener('focus', update); };
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    heading.current?.focus({ preventScroll: true });
  }, [order]);

  function update<K extends keyof CheckoutData>(key: K, value: CheckoutData[K]) {
    if (key === 'name') nameEdited.current = true;
    const next = { ...data, [key]: value };
    setData(next);
    if (Object.keys(errors).length) {
      const valid = validateCheckout(next);
      setErrors(previous => Object.fromEntries(Object.keys(previous).filter(k => valid[k as keyof CheckoutData]).map(k => [k, valid[k as keyof CheckoutData]])));
    }
  }
  function blur(key: TextField) {
    setErrors(previous => ({ ...previous, [key]: validateCheckout(data)[key] }));
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateCheckout(data);
    setErrors(nextErrors);
    const first = Object.keys(nextErrors)[0];
    if (first) {
      const control = form.current?.elements.namedItem(first);
      if (control instanceof HTMLElement) control.focus();
      return;
    }
    if (!items.length) return;
    setOrder(makeOrder(data, items));
  }
  const error = (key: keyof CheckoutData) => errors[key] && <p className="checkout-error" id={`error-${key}`} role="alert">{errors[key]}</p>;
  function field(key: TextField, label: string, options: InputHTMLAttributes<HTMLInputElement> = {}) {
    return <div className="checkout-field"><label htmlFor={`checkout-${key}`}>{label}</label><input {...options}
      id={`checkout-${key}`} name={key} value={data[key]} onChange={e => update(key, e.target.value)} onBlur={() => blur(key)}
      aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `error-${key}` : undefined} />{error(key)}</div>;
  }
  function textarea(key: 'cardText' | 'comment' | 'courierComment', label: string) {
    return <div className="checkout-field"><label htmlFor={`checkout-${key}`}>{label} <span>необязательно</span></label><textarea
      id={`checkout-${key}`} name={key} rows={3} value={data[key]} maxLength={key === 'cardText' ? 250 : undefined}
      onChange={e => update(key, e.target.value)} onBlur={() => blur(key)} aria-invalid={Boolean(errors[key])}
      aria-describedby={[errors[key] ? `error-${key}` : '', key === 'cardText' ? 'card-counter' : ''].filter(Boolean).join(' ') || undefined} />
      {key === 'cardText' && <span className="checkout-counter" id="card-counter">{data.cardText.length} / 250</span>}{error(key)}</div>;
  }

  if (order) return <section className="checkout-page checkout-success">
    <div className="checkout-success-heading"><span className="empty-icon"><Check size={34} strokeWidth={1.5} /></span><span className="eyebrow">СОБРАНО С ЛЮБОВЬЮ</span>
      <h1 ref={heading} tabIndex={-1}>Спасибо! Заказ оформлен</h1><span className="checkout-order-number">№{order.number}</span>
      <p>Это тестовое оформление. Заказ никуда не отправлен, корзина сохранена.</p></div>
    <div className="checkout-panel"><h2>Ваш заказ</h2><Items items={order.items} /><Totals total={order.total} delivery={order.method === 'delivery'} /></div>
    <div className="checkout-panel checkout-confirmation"><h2>Детали получения</h2><dl>
      <div><dt>Заказчик</dt><dd>{order.customer.name}<br />{order.customer.phone}</dd></div>
      <div><dt>Получатель</dt><dd>{order.recipient.name}<br />{order.recipient.phone}</dd></div>
      <div><dt>{order.method === 'delivery' ? 'Доставка' : 'Самовывоз'}</dt><dd>{order.address}</dd></div>
      <div><dt>Дата и время</dt><dd>{new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${order.date}T12:00:00`))}<br />{order.time}</dd></div>
      {order.courierComment && <div><dt>Для курьера</dt><dd>{order.courierComment}</dd></div>}
      {order.cardText && <div><dt>Текст открытки</dt><dd>{order.cardText}</dd></div>}
      {order.comment && <div><dt>Комментарий</dt><dd>{order.comment}</dd></div>}
    </dl></div><button className="primary-button checkout-return" onClick={onReturn}>Вернуться в магазин <ArrowUpRight size={18} /></button>
  </section>;

  if (!items.length) return <section className="checkout-page empty-cart"><ShoppingBag size={36} /><h1>В корзине пока нет букетов</h1><button className="primary-button" onClick={onReturn}>Вернуться в магазин</button></section>;

  return <section className="checkout-page"><button className="back-link" onClick={onBack}><ArrowLeft size={16} /> В корзину</button>
    <div className="checkout-heading"><span className="eyebrow">ОСТАЛОСЬ СОВСЕМ НЕМНОГО</span><h1 ref={heading} tabIndex={-1}>Оформление заказа</h1><p>Расскажите, кому и когда передать цветы.</p></div>
    <form ref={form} onSubmit={submit} noValidate className="checkout-layout">
      <div className="checkout-form-sections">
        <section className="checkout-panel"><h2>Ваши данные</h2><div className="checkout-fields">
          {field('name', 'Имя', { autoComplete: 'given-name', required: true })}
          {field('phone', 'Телефон', { type: 'tel', inputMode: 'tel', autoComplete: 'tel', placeholder: '+7 (999) 123-45-67', required: true })}
        </div></section>
        <section className="checkout-panel"><h2>Получатель</h2><label className="checkout-switch"><span>Я получатель</span><input type="checkbox" role="switch" checked={data.sameRecipient} onChange={e => update('sameRecipient', e.target.checked)} /><span className="checkout-switch-track" aria-hidden="true" /></label>
          {!data.sameRecipient && <div className="checkout-fields">
            {field('recipientName', 'Имя получателя', { autoComplete: 'section-recipient given-name', required: true })}
            {field('recipientPhone', 'Телефон получателя', { type: 'tel', inputMode: 'tel', autoComplete: 'section-recipient tel', placeholder: '+7 (999) 123-45-67', required: true })}
          </div>}
        </section>
        <section className="checkout-panel"><h2>Способ получения</h2><fieldset className="checkout-method" aria-describedby={errors.method ? 'error-method' : undefined}><legend className="sr-only">Способ получения</legend>
          <label><input type="radio" name="method" value="delivery" checked={data.method === 'delivery'} onChange={() => update('method', 'delivery')} required /><span>Доставка</span></label>
          <label><input type="radio" name="method" value="pickup" checked={data.method === 'pickup'} onChange={() => update('method', 'pickup')} required /><span>Самовывоз</span></label>
        </fieldset>{error('method')}
          {data.method === 'delivery' ? <div className="checkout-fields">
            {field('city', 'Город', { autoComplete: 'address-level2', required: true })}
            {field('street', 'Улица', { autoComplete: 'address-line1', required: true })}
            <div className="checkout-two-columns">{field('house', 'Дом', { required: true })}{field('apartment', 'Квартира / офис', { placeholder: 'Необязательно', autoComplete: 'address-line2' })}</div>
            {textarea('courierComment', 'Комментарий для курьера')}
          </div> : <div className="checkout-pickup"><MapPin size={21} /><div><strong>ул. Цветочная, 10</strong><p>Администратор свяжется с вами для подтверждения времени.</p></div></div>}
        </section>
        <section className="checkout-panel"><h2>Когда подарим радость?</h2><div className="checkout-two-columns">
          {field('date', 'Дата получения', { type: 'date', min: today || undefined, required: true })}
          <div className="checkout-field"><label htmlFor="checkout-time">Время получения</label><select id="checkout-time" name="time" required value={data.time} onChange={e => update('time', e.target.value)} onBlur={() => blur('time')} aria-invalid={Boolean(errors.time)} aria-describedby={errors.time ? 'error-time' : undefined}><option value="">Выберите интервал</option>{timeSlots.map(slot => <option key={slot}>{slot}</option>)}</select>{error('time')}</div>
        </div></section>
        <section className="checkout-panel"><h2>Ещё немного заботы</h2><div className="checkout-fields">{textarea('cardText', 'Текст для открытки')}{textarea('comment', 'Комментарий к заказу')}</div></section>
      </div>
      <aside className="checkout-panel checkout-order-summary"><h2>Ваш заказ</h2><Items items={items} /><Totals total={total} delivery={data.method === 'delivery'} />
        <button type="submit" className="primary-button">Оформить заказ <ArrowUpRight size={18} /></button><p className="checkout-demo-note">Тестовое оформление: данные не отправляются, корзина сохранится.</p>
      </aside>
    </form>
  </section>;
}
