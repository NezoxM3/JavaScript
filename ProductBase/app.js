var CATEGORIES = ['Електроніка', 'Одяг', 'Продукти', 'Книги', 'Інше'];
var MAX_IMAGE_SIDE = 600;

var priceFormat = new Intl.NumberFormat('uk-UA', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

var $ = function (id) { return document.getElementById(id); };

var listEl = $('list');
var counterEl = $('counter');
var bannerEl = $('errorBanner');

var searchInput = $('searchInput');
var categoryFilter = $('categoryFilter');
var priceFrom = $('priceFrom');
var priceTo = $('priceTo');
var sortSelect = $('sortSelect');

var productModal = $('productModal');
var form = $('productForm');
var modalTitle = $('modalTitle');
var formError = $('formError');
var saveBtn = $('saveBtn');
var imageInput = $('imageInput');
var previewEl = $('preview');

var confirmModal = $('confirmModal');

var fields = {
  name: $('nameInput'),
  price: $('priceInput'),
  quantity: $('quantityInput'),
  category: $('categoryInput'),
  description: $('descriptionInput')
};

var editing = null;
var currentImage = null;
var previewUrl = null;
var listUrls = [];
var touched = {};
var productToDelete = null;
var refreshCounter = 0;

function makeEl(tag, className, text) {
  var e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

function errorText(err) {
  return err && err.message ? err.message : String(err);
}

function showBanner(message) {
  bannerEl.textContent = message;
  bannerEl.hidden = false;
}

function hideBanner() {
  bannerEl.hidden = true;
}

function fillCategorySelect(select, firstText) {
  select.textContent = '';
  var first = document.createElement('option');
  first.value = '';
  first.textContent = firstText;
  select.appendChild(first);
  CATEGORIES.forEach(function (c) {
    var o = document.createElement('option');
    o.value = c;
    o.textContent = c;
    select.appendChild(o);
  });
}

function setHighlightedText(target, text, query) {
  target.textContent = '';
  if (!query) {
    target.textContent = text;
    return;
  }
  var lower = text.toLowerCase();
  var q = query.toLowerCase();
  var pos = 0;
  while (true) {
    var i = lower.indexOf(q, pos);
    if (i === -1) break;
    target.appendChild(document.createTextNode(text.slice(pos, i)));
    var mark = document.createElement('mark');
    mark.textContent = text.slice(i, i + q.length);
    target.appendChild(mark);
    pos = i + q.length;
  }
  target.appendChild(document.createTextNode(text.slice(pos)));
}

function buildCard(product, query) {
  var card = makeEl('div', 'card');

  var imageBox = makeEl('div', 'card-image');
  if (product.image instanceof Blob) {
    var url = URL.createObjectURL(product.image);
    listUrls.push(url);
    var img = document.createElement('img');
    img.src = url;
    img.alt = '';
    imageBox.appendChild(img);
  } else {
    imageBox.textContent = '📦';
  }
  card.appendChild(imageBox);

  var body = makeEl('div', 'card-body');
  var name = makeEl('h3', 'card-name');
  setHighlightedText(name, product.name, query);
  body.appendChild(name);
  body.appendChild(makeEl('div', 'card-category', product.category));
  body.appendChild(makeEl('div', 'card-price', priceFormat.format(product.price) + ' грн'));
  body.appendChild(makeEl('div', 'card-qty', 'Кількість: ' + product.quantity));
  if (product.quantity === 0) {
    body.appendChild(makeEl('span', 'badge', 'Немає в наявності'));
  }
  card.appendChild(body);

  var buttons = makeEl('div', 'card-buttons');
  var editBtn = makeEl('button', 'btn small', 'Редагувати');
  editBtn.type = 'button';
  editBtn.addEventListener('click', function () { openEdit(product.id); });
  var delBtn = makeEl('button', 'btn small danger', 'Видалити');
  delBtn.type = 'button';
  delBtn.addEventListener('click', function () { openConfirm(product); });
  buttons.appendChild(editBtn);
  buttons.appendChild(delBtn);
  card.appendChild(buttons);

  return card;
}

function parsePriceFilter(input) {
  var v = input.value.trim();
  if (v === '') return null;
  var n = Number(v);
  return isNaN(n) ? null : n;
}

function sortProducts(products, mode) {
  products.sort(function (a, b) {
    if (mode === 'name') return a.nameLower.localeCompare(b.nameLower, 'uk');
    if (mode === 'price-asc') return a.price - b.price;
    if (mode === 'price-desc') return b.price - a.price;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

async function refresh() {
  var myId = ++refreshCounter;
  try {
    var query = searchInput.value.trim();

    var products = await queryProducts({
      category: categoryFilter.value,
      priceFrom: parsePriceFilter(priceFrom),
      priceTo: parsePriceFilter(priceTo)
    });
    var total = await countProducts();

    if (myId !== refreshCounter) return;

    if (query) {
      var q = query.toLowerCase();
      products = products.filter(function (p) {
        return p.nameLower.indexOf(q) !== -1;
      });
    }
    sortProducts(products, sortSelect.value);

    listUrls.forEach(function (u) { URL.revokeObjectURL(u); });
    listUrls = [];

    listEl.textContent = '';
    if (total === 0) {
      listEl.appendChild(makeEl('p', 'message', 'Товарів поки немає'));
    } else if (products.length === 0) {
      listEl.appendChild(makeEl('p', 'message', 'За вашим запитом нічого не знайдено'));
    } else {
      products.forEach(function (p) {
        listEl.appendChild(buildCard(p, query));
      });
    }
    counterEl.textContent = 'Знайдено: ' + products.length + ' з ' + total;
    hideBanner();
  } catch (err) {
    if (myId === refreshCounter) {
      showBanner('Не вдалося завантажити товари: ' + errorText(err));
    }
  }
}

function validateField(key) {
  var value = fields[key].value;

  if (key === 'name') {
    var n = value.trim().length;
    if (n === 0) return 'Введіть назву';
    if (n < 2) return 'Назва має містити щонайменше 2 символи';
    if (n > 100) return 'Назва має бути не довшою за 100 символів';
  }

  if (key === 'price') {
    var p = value.trim().replace(',', '.');
    if (p === '') return 'Введіть ціну';
    if (!/^\d+(\.\d{1,2})?$/.test(p)) return 'Ціна — число не більше ніж з двома знаками після коми';
    if (Number(p) <= 0) return 'Ціна має бути більшою за 0';
  }

  if (key === 'quantity') {
    var q = value.trim();
    if (q === '') return 'Введіть кількість';
    if (!/^\d+$/.test(q)) return 'Кількість — ціле число, 0 або більше';
  }

  if (key === 'category') {
    if (value === '') return 'Оберіть категорію';
  }

  if (key === 'description') {
    if (value.length > 500) return 'Опис не може бути довшим за 500 символів';
  }

  return '';
}

function showFieldError(key, message) {
  $(key + 'Error').textContent = message;
  fields[key].classList.toggle('invalid', message !== '');
}

function validateForm(showAll) {
  var ok = true;
  Object.keys(fields).forEach(function (key) {
    var message = validateField(key);
    if (message) ok = false;
    if (touched[key] || showAll) {
      showFieldError(key, message);
    }
  });
  saveBtn.disabled = !ok;
  return ok;
}

Object.keys(fields).forEach(function (key) {
  var eventName = key === 'category' ? 'change' : 'input';
  fields[key].addEventListener(eventName, function () {
    touched[key] = true;
    validateForm(false);
  });
});

function showPreview(blob) {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  }
  previewEl.textContent = '';
  if (!blob) return;

  previewUrl = URL.createObjectURL(blob);
  var thumb = makeEl('div', 'thumb');
  var img = document.createElement('img');
  img.src = previewUrl;
  img.alt = 'Мініатюра';

  var removeBtn = makeEl('button', '', '×');
  removeBtn.type = 'button';
  removeBtn.title = 'Видалити зображення';
  removeBtn.addEventListener('click', function () {
    currentImage = null;
    imageInput.value = '';
    showPreview(null);
  });

  thumb.appendChild(img);
  thumb.appendChild(removeBtn);
  previewEl.appendChild(thumb);
}

function resizeImage(file) {
  return new Promise(function (resolve, reject) {
    var url = URL.createObjectURL(file);
    var img = new Image();

    img.onload = function () {
      URL.revokeObjectURL(url);
      var scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.width, img.height));
      var canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));

      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(function (blob) {
        if (blob) resolve(blob);
        else reject(new Error('Не вдалося обробити зображення'));
      }, 'image/jpeg', 0.85);
    };

    img.onerror = function () {
      URL.revokeObjectURL(url);
      reject(new Error('Не вдалося прочитати зображення'));
    };

    img.src = url;
  });
}

imageInput.addEventListener('change', async function () {
  var file = imageInput.files[0];
  if (!file) return;

  formError.hidden = true;
  if (!file.type.startsWith('image/')) {
    imageInput.value = '';
    showFormError('Оберіть файл із зображенням');
    return;
  }

  try {
    currentImage = await resizeImage(file);
    showPreview(currentImage);
  } catch (err) {
    imageInput.value = '';
    showFormError(errorText(err));
  }
});

function showFormError(message) {
  formError.textContent = message;
  formError.hidden = false;
}

function openProductModal(product) {
  editing = product || null;
  modalTitle.textContent = product ? 'Редагування товару' : 'Додати товар';

  form.reset();
  touched = {};
  formError.hidden = true;

  fields.name.value = product ? product.name : '';
  fields.price.value = product ? String(product.price) : '';
  fields.quantity.value = product ? String(product.quantity) : '';
  fields.category.value = product ? product.category : '';
  fields.description.value = product ? product.description : '';

  currentImage = product && product.image instanceof Blob ? product.image : null;
  showPreview(currentImage);

  Object.keys(fields).forEach(function (key) { showFieldError(key, ''); });
  validateForm(false);

  productModal.hidden = false;
  fields.name.focus();
}

function closeProductModal() {
  productModal.hidden = true;
  showPreview(null);
  editing = null;
  currentImage = null;
}

async function openEdit(id) {
  try {
    var product = await getProduct(id);
    if (!product) {
      showBanner('Цей товар уже не існує');
      await refresh();
      return;
    }
    openProductModal(product);
  } catch (err) {
    showBanner('Не вдалося відкрити товар: ' + errorText(err));
  }
}

form.addEventListener('submit', async function (e) {
  e.preventDefault();
  if (!validateForm(true)) return;

  saveBtn.disabled = true;
  formError.hidden = true;

  try {
    var name = fields.name.value.trim();
    var data = {
      name: name,
      nameLower: name.toLowerCase(),
      price: Number(fields.price.value.trim().replace(',', '.')),
      quantity: Number(fields.quantity.value.trim()),
      category: fields.category.value,
      description: fields.description.value.trim(),
      image: currentImage
    };
    var now = new Date();

    if (editing) {
      var updated = Object.assign({}, editing, data, { updatedAt: now });
      await updateProduct(updated);
    } else {
      data.createdAt = now;
      data.updatedAt = now;
      await addProduct(data);
    }

    closeProductModal();
    await refresh();
  } catch (err) {
    showFormError('Не вдалося зберегти товар: ' + errorText(err));
    saveBtn.disabled = false;
  }
});

$('addBtn').addEventListener('click', function () { openProductModal(null); });
$('cancelBtn').addEventListener('click', closeProductModal);

function openConfirm(product) {
  productToDelete = product;
  $('confirmText').textContent = 'Видалити товар "' + product.name + '"?';
  confirmModal.hidden = false;
}

function closeConfirm() {
  confirmModal.hidden = true;
  productToDelete = null;
}

$('confirmCancel').addEventListener('click', closeConfirm);

$('confirmDelete').addEventListener('click', async function () {
  if (!productToDelete) return;
  var id = productToDelete.id;
  closeConfirm();
  try {
    await deleteProduct(id);
    await refresh();
  } catch (err) {
    showBanner('Не вдалося видалити товар: ' + errorText(err));
  }
});

document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  if (!confirmModal.hidden) closeConfirm();
  else if (!productModal.hidden) closeProductModal();
});

searchInput.addEventListener('input', refresh);
categoryFilter.addEventListener('change', refresh);
priceFrom.addEventListener('input', refresh);
priceTo.addEventListener('input', refresh);
sortSelect.addEventListener('change', refresh);

async function init() {
  fillCategorySelect(categoryFilter, 'Усі категорії');
  fillCategorySelect(fields.category, '— Оберіть категорію —');
  validateForm(false);

  try {
    await openDb();
  } catch (err) {
    showBanner('Не вдалося відкрити базу даних: ' + errorText(err));
    $('addBtn').disabled = true;
    listEl.appendChild(makeEl('p', 'message', 'База даних недоступна'));
    return;
  }
  await refresh();
}

init();