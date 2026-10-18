'use strict';


const STATUSES = ['нове', 'в дорозі', 'доставлено'];

function normalizeTag(tag) {
  return String(tag).trim().toLowerCase();
}

function parseTags(str) {
  return String(str)
    .split(',')
    .map(normalizeTag)
    .filter(t => t !== '');
}

class Order {
  constructor({ number, address, weight, deliveryAt, tags = [], status = 'нове', createdAt = new Date() }) {
    if (!(deliveryAt instanceof Date) || isNaN(deliveryAt)) {
      throw new TypeError('Час доставки має бути об’єктом Date');
    }
    if (!STATUSES.includes(status)) {
      throw new RangeError('Невідомий статус: ' + status);
    }
    this.number = number;
    this.address = address;
    this.weight = weight;
    this.deliveryAt = deliveryAt;
    this.tags = new Set();
    for (const t of tags) this.addTag(t);
    this.status = status;
    this.createdAt = createdAt;
  }

  isOverdue() {
    return this.deliveryAt.getTime() < Date.now() && this.status !== 'доставлено';
  }

  addTag(tag) {
    const t = normalizeTag(tag);
    if (t !== '') this.tags.add(t);
  }

  nextStatus() {
    const i = STATUSES.indexOf(this.status);
    if (i < STATUSES.length - 1) this.status = STATUSES[i + 1];
  }

  toJSON() {
    return {
      v: 1,
      number: this.number,
      address: this.address,
      weight: this.weight,
      deliveryAt: this.deliveryAt.toISOString(),
      tags: [...this.tags].sort(),
      status: this.status,
      createdAt: this.createdAt.toISOString()
    };
  }

  static fromJSON(obj) {
    if (obj === null || typeof obj !== 'object') {
      throw new Error('Замовлення має бути об’єктом');
    }
    if (obj.v !== 1) {
      throw new Error('Непідтримувана версія формату: ' + obj.v);
    }
    if (typeof obj.number !== 'string' || obj.number === '') {
      throw new Error('У замовленні немає номера');
    }
    if (obj.deliveryAt === undefined || obj.deliveryAt === null || obj.deliveryAt === '') {
      throw new Error('У замовленні ' + obj.number + ' немає часу доставки');
    }
    const toDate = (value, name) => {
      const d = value instanceof Date ? value : new Date(value);
      if (isNaN(d)) throw new Error('Некоректна дата в полі ' + name);
      return d;
    };
    if (typeof obj.weight !== 'number' || !isFinite(obj.weight)) {
      throw new Error('Некоректна вага в замовленні ' + obj.number);
    }
    return new Order({
      number: obj.number,
      address: String(obj.address ?? ''),
      weight: obj.weight,
      deliveryAt: toDate(obj.deliveryAt, 'deliveryAt'),
      tags: Array.isArray(obj.tags) ? obj.tags : [],
      status: obj.status,
      createdAt: obj.createdAt ? toDate(obj.createdAt, 'createdAt') : new Date()
    });
  }
}

function dateReviver(key, value) {
  if (key.endsWith('At') && typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d) ? value : d;
  }
  return value;
}


const STORAGE_KEY = 'delivery-dispatcher:orders';
let orders = [];

function showNotice(text) {
  const el = document.getElementById('notice');
  el.textContent = text;
  el.hidden = !text;
}

function saveOrders() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    showNotice('Не вдалося зберегти дані в браузері');
  }
}

function loadOrders() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    return [];
  }
  if (raw === null) return [];
  try {
    const data = JSON.parse(raw, dateReviver);
    if (!Array.isArray(data)) throw new Error('Очікувався масив');
    return data.map(Order.fromJSON);
  } catch (e) {
    showNotice('Збережені дані пошкоджено');
    return [];
  }
}


const $ = id => document.getElementById(id);
const form = $('order-form');
const fields = {
  number: $('f-number'),
  weight: $('f-weight'),
  address: $('f-address'),
  time: $('f-time'),
  tags: $('f-tags')
};

function setError(name, text) {
  const input = fields[name];
  $('e-' + name).textContent = text;
  if (text) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
}

function validate() {
  let ok = true;
  const fail = (name, text) => { setError(name, text); ok = false; };

  const number = fields.number.value.trim();
  if (number === '') {
    fail('number', 'Введіть номер замовлення');
  } else if (!/^[A-Z]{2}-\d+$/.test(number)) {
    fail('number', 'Формат: дві великі латинські літери, дефіс, цифри (напр. DL-1024)');
  } else if (orders.some(o => o.number === number)) {
    fail('number', 'Замовлення з таким номером уже існує');
  } else {
    setError('number', '');
  }

  const address = fields.address.value.trim();
  if (address === '') fail('address', 'Введіть адресу доставки');
  else setError('address', '');

  const weightStr = fields.weight.value.trim().replace(',', '.');
  const weight = Number(weightStr);
  if (weightStr === '' || !isFinite(weight)) {
    fail('weight', 'Введіть вагу числом, наприклад 2.5');
  } else if (weight <= 0) {
    fail('weight', 'Вага має бути більшою за 0');
  } else if (weight > 30) {
    fail('weight', 'Вага не може перевищувати 30 кг');
  } else {
    setError('weight', '');
  }

  const timeStr = fields.time.value;
  const time = timeStr ? new Date(timeStr) : null;
  if (!time || isNaN(time)) {
    fail('time', 'Вкажіть бажаний час доставки');
  } else if (time.getTime() < Date.now()) {
    fail('time', 'Час доставки не може бути в минулому');
  } else {
    setError('time', '');
  }

  if (!ok) return null;
  return { number, address, weight, deliveryAt: time, tags: parseTags(fields.tags.value) };
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const data = validate();
  if (!data) return;
  orders.push(new Order(data));
  saveOrders();
  form.reset();
  render();
  fields.number.focus();
});

['number', 'weight', 'address', 'time'].forEach(name => {
  fields[name].addEventListener('input', () => setError(name, ''));
});


const fmt = new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short' });
const rowsEl = $('rows');
const onlyOverdue = $('only-overdue');

function cell(text, className) {
  const td = document.createElement('td');
  td.textContent = text;
  if (className) td.className = className;
  return td;
}

function render() {
  const total = orders.length;
  const overdue = orders.filter(o => o.isOverdue()).length;
  const delivered = orders.filter(o => o.status === 'доставлено').length;
  $('counter').textContent = 'Усього ' + total + ' / прострочено ' + overdue + ' / доставлено ' + delivered;

  const list = onlyOverdue.checked ? orders.filter(o => o.isOverdue()) : orders;
  rowsEl.textContent = '';

  if (!list.length) {
    const tr = document.createElement('tr');
    const td = cell(onlyOverdue.checked && total ? 'Прострочених замовлень немає' : 'Замовлень поки немає', 'empty');
    td.colSpan = 7;
    tr.appendChild(td);
    rowsEl.appendChild(tr);
    return;
  }

  for (const order of list) {
    const tr = document.createElement('tr');
    const late = order.isOverdue();
    if (late) tr.className = 'overdue';

    tr.appendChild(cell(order.number, 'num'));
    tr.appendChild(cell(order.address));
    tr.appendChild(cell(order.weight + ' кг'));

    const timeTd = cell(fmt.format(order.deliveryAt));
    if (late) {
      const l = document.createElement('span');
      l.className = 'late-label';
      l.textContent = 'Прострочено';
      timeTd.appendChild(l);
    }
    tr.appendChild(timeTd);

    const tagsTd = document.createElement('td');
    for (const t of [...order.tags].sort()) {
      const s = document.createElement('span');
      s.className = 'tag';
      s.textContent = t;
      tagsTd.appendChild(s);
    }
    tr.appendChild(tagsTd);

    tr.appendChild(cell(order.status, 'status' + (order.status === 'доставлено' ? ' delivered' : '')));

    const actions = document.createElement('td');
    const wrap = document.createElement('div');
    wrap.className = 'row-actions';

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'secondary';
    next.textContent = 'Наступний статус';
    next.disabled = order.status === 'доставлено';
    next.addEventListener('click', () => {
      order.nextStatus();
      saveOrders();
      render();
    });

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'danger';
    del.textContent = 'Видалити';
    del.addEventListener('click', () => {
      orders = orders.filter(o => o !== order);
      saveOrders();
      render();
    });

    wrap.append(next, del);
    actions.appendChild(wrap);
    tr.appendChild(actions);
    rowsEl.appendChild(tr);
  }
}

onlyOverdue.addEventListener('change', render);


orders = loadOrders();
render();
setInterval(render, 30000);