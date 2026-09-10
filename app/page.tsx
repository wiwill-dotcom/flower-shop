'use client';

import { useEffect, useRef, useState } from 'react';
import Checkout from '@/components/Checkout';
import { ArrowDown, ArrowLeft, ArrowUpRight, Check, Flower2, Home, LayoutGrid, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';

type Bouquet = { id: number; name: string; composition: string; price: number; category: string[]; image: string; tag?: string };
const bouquets: Bouquet[] = [
  { id: 1, name: 'Розовое облако', composition: 'Розовые и белые кустовые розы', price: 4200, category: ['Розы', 'Нежные'], image: '/images/bouquet-1.jpg', tag: 'Любимчик' },
  { id: 2, name: 'Тихое утро', composition: 'Белые и розовые розы', price: 2900, category: ['Розы', 'Нежные'], image: '/images/bouquet-2.jpg' },
  { id: 3, name: 'Тёплые чувства', composition: 'Крупные розы в пастельных оттенках', price: 3600, category: ['Розы', 'Авторские'], image: '/images/bouquet-3.png', tag: 'Авторский' },
  { id: 4, name: 'Маленькая радость', composition: 'Белые и ярко-розовые розы', price: 2600, category: ['Нежные'], image: '/images/bouquet-4.jpg' },
  { id: 5, name: 'Для тебя', composition: 'Розовые розы, рускус', price: 3900, category: ['Розы'], image: '/images/bouquet-5.jpg' },
  { id: 6, name: 'Садовая история', composition: 'Белые розы, тюльпаны, эвкалипт', price: 5400, category: ['Авторские'], image: '/images/bouquet-6.jpg', tag: 'Особенный' },
  { id: 7, name: 'Нежное письмо', composition: 'Коралловые и белые розы, гипсофила', price: 2800, category: ['Нежные', 'Авторские'], image: '/images/bouquet-7.jpg' },
  { id: 8, name: 'Лесная нежность', composition: 'Белые розы, эустома, альстромерия', price: 3200, category: ['Авторские'], image: '/images/bouquet-8.jpg' },
];
const categories = ['Все', 'Розы', 'Авторские', 'Нежные', 'До 3000 ₽'];
const money = (value: number) => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';

export default function Store() {
  const [view, setView] = useState<'home' | 'catalog' | 'cart' | 'checkout'>('home');
  const [category, setCategory] = useState('Все');
  const [cart, setCart] = useState<Record<number, number>>({});
  const [selected, setSelected] = useState<Bouquet | null>(null);
  const [notice, setNotice] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = bouquets.reduce((sum, item) => sum + item.price * (cart[item.id] || 0), 0);
  const visible = bouquets.filter(b => category === 'Все' || (category === 'До 3000 ₽' ? b.price <= 3000 : b.category.includes(category)));
  useEffect(() => {
    if (selected) { dialog.current?.showModal(); document.body.style.overflow = 'hidden'; }
    else { dialog.current?.close(); document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [selected]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 2600); return () => clearTimeout(timer); }, [notice]);
  function add(item: Bouquet) { setCart(c => ({ ...c, [item.id]: (c[item.id] || 0) + 1 })); setNotice(`${item.name} — в корзине`); }
  function change(id: number, difference: number) { setCart(c => { const next = { ...c, [id]: Math.max(0, (c[id] || 0) + difference) }; if (!next[id]) delete next[id]; return next; }); }
  function navigate(next: typeof view) { setView(next); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  return <div className="store-shell">
    <header className="header flex items-center justify-between">
      <button className="brand flex items-center gap-2.5" onClick={() => navigate('home')} aria-label="Лепесток — главная"><span className="brand-icon"><Flower2 size={25} strokeWidth={1.4} /></span><span>лепесток<span className="brand-caption">ЦВЕТОЧНАЯ МАСТЕРСКАЯ</span></span></button>
      <button className="header-cart relative" onClick={() => navigate('cart')} aria-label={`Корзина, ${count} букетов`}><ShoppingBag size={22} strokeWidth={1.5} />{count > 0 && <span className="badge">{count}</span>}</button>
    </header>

    <main>
      {view === 'home' && <section className="hero">
        <div className="hero-copy"><span className="eyebrow">ПОВОД БЫТЬ БЛИЖЕ</span><h1>Чувства,<br />которые <em>цветут.</em></h1><p>Для важных слов.<br />И просто так.</p><button className="hero-button" onClick={() => { setView('catalog'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Выбрать букет <ArrowUpRight size={18} /></button></div>
        <img src="/images/bouquet-1.jpg" alt="Нежный розовый букет" className="hero-image" /><span className="hero-note">собрано с любовью ♡</span>
      </section>}

      {view === 'checkout' ? <Checkout items={bouquets.filter(item => cart[item.id]).map(item => ({ ...item, quantity: cart[item.id] }))} onBack={() => navigate('cart')} onReturn={() => navigate('home')} /> : view !== 'cart' ? <section className="catalog" aria-label="Каталог букетов">
        <div className="section-title flex items-end justify-between"><div><span className="eyebrow">ЦВЕТЫ ГОВОРЯТ ЗА ВАС</span><h2>{view === 'home' ? 'Ваш маленький жест' : 'Каталог букетов'}</h2></div><span className="catalog-count">{visible.length} букетов <ArrowDown size={14} /></span></div>
        <div className="categories flex gap-2" aria-label="Категории">{categories.map(c => <button key={c} aria-pressed={category === c} className={category === c ? 'category active' : 'category'} onClick={() => setCategory(c)}>{c}</button>)}</div>
        <div className="product-grid grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">{visible.map(item => <article className="product" key={item.id}>
          <button className="product-open" onClick={() => setSelected(item)} aria-label={`Подробнее: ${item.name}`}><div className="product-image"><img src={item.image} alt={item.name} loading={item.id > 2 ? 'lazy' : 'eager'} />{item.tag && <span className="product-tag">{item.tag}</span>}<span className="image-arrow"><ArrowUpRight size={18} /></span></div><div className="product-description"><h3>{item.name}</h3><p>{item.composition}</p></div></button>
          <div className="product-bottom"><strong>{money(item.price)}</strong><button className="add-button" onClick={() => add(item)}><Plus size={16} /><span>В корзину</span></button></div>
        </article>)}</div>
        <p className="catalog-footnote"><Flower2 size={17} /> Каждый букет немного особенный. Как и тот, кому он предназначен.</p>
      </section> : <section className="cart-page">
        <button className="back-link" onClick={() => navigate('catalog')}><ArrowLeft size={16} /> К букетам</button><div className="section-title"><span className="eyebrow">ВАШ ВЫБОР</span><h1>Корзина <span className="muted">({count})</span></h1></div>
        {count === 0 ? <div className="empty-cart"><span className="empty-icon"><ShoppingBag size={36} strokeWidth={1.2} /></span><h2>Здесь расцветёт ваш выбор</h2><p>Добавьте букет, который скажет всё за вас.</p><button className="primary-button" onClick={() => navigate('catalog')}>Выбрать букет <ArrowUpRight size={18} /></button></div> : <div className="cart-layout"><div className="cart-items">{bouquets.filter(b => cart[b.id]).map(item => <article className="cart-item" key={item.id}><button onClick={() => setSelected(item)} aria-label={`Открыть ${item.name}`}><img src={item.image} alt={item.name} /></button><div className="cart-item-info"><h3>{item.name}</h3><p>{item.composition}</p><strong>{money(item.price * cart[item.id])}</strong><div className="quantity"><button aria-label={`Уменьшить количество: ${item.name}`} onClick={() => change(item.id, -1)}><Minus size={16} /></button><span>{cart[item.id]}</span><button aria-label={`Увеличить количество: ${item.name}`} onClick={() => change(item.id, 1)}><Plus size={16} /></button></div></div><button className="remove-button" aria-label={`Удалить ${item.name}`} onClick={() => setCart(c => { const next = { ...c }; delete next[item.id]; return next; })}><Trash2 size={18} /></button></article>)}</div><aside className="cart-summary"><h2>Ваш заказ</h2><div className="summary-line"><span>Букеты · {count} шт.</span><span>{money(total)}</span></div><div className="summary-total"><span>Итого</span><strong>{money(total)}</strong></div><button className="primary-button" onClick={() => navigate('checkout')}>Оформить заказ <ArrowUpRight size={18} /></button><p>Пока это демоверсия — заказ не отправляется.</p></aside></div>}
      </section>}
    </main>

    <footer className="footer"><span>лепесток</span><span>Цветы. Чувства. Вы.</span></footer>
    <nav className="bottom-nav" aria-label="Основная навигация">{([{ id: 'home', label: 'Главная', icon: Home }, { id: 'catalog', label: 'Каталог', icon: LayoutGrid }, { id: 'cart', label: 'Корзина', icon: ShoppingBag }] as const).map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? 'nav-item selected' : 'nav-item'} aria-current={view === id ? 'page' : undefined} onClick={() => navigate(id)}><span className="relative"><Icon size={22} strokeWidth={1.6} />{id === 'cart' && count > 0 && <span className="badge">{count}</span>}</span><span>{label}</span></button>)}</nav>
    <div role="status" aria-live="polite" className={notice ? 'toast show' : 'toast'}>{notice && <><Check size={18} /><span>{notice}</span></>}</div>
    <dialog ref={dialog} aria-label={selected?.name || 'Карточка букета'} className="detail-dialog" onCancel={() => setSelected(null)} onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>{selected && <div className="detail-content"><button className="close-button" aria-label="Закрыть карточку" onClick={() => setSelected(null)}><X size={22} /></button><img className="detail-image" src={selected.image} alt={selected.name} /><div className="detail-copy"><span className="eyebrow">СОБРАНО С ЛЮБОВЬЮ</span><h2>{selected.name}</h2><p className="detail-intro">Маленький знак внимания, который останется в сердце.</p><h3>Состав букета</h3><p>{selected.composition}</p><p className="detail-note">Тестовый букет. Состав и фотографии приведены для демонстрации.</p><div className="detail-bottom"><strong>{money(selected.price)}</strong><button className="primary-button" onClick={() => add(selected)}><Plus size={18} /> В корзину{cart[selected.id] ? ` · ${cart[selected.id]}` : ''}</button></div></div></div>}</dialog>
  </div>;
}
