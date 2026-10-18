(function () {
  var COOKIE = 'plates';
  var PATTERN = /^[АВЕІКМНОРСТХ]{2}\d{4}[АВЕІКМНОРСТХ]{2}$/;
  var LETTERS = 'АВЕІКМНОРСТХ';

  var LATIN_TO_CYR = {
    A: 'А', B: 'В', E: 'Е', I: 'І', K: 'К', M: 'М',
    H: 'Н', O: 'О', P: 'Р', C: 'С', T: 'Т', X: 'Х'
  };

  var input = document.getElementById('plate');
  var msg = document.getElementById('msg');
  var saveBtn = document.getElementById('save');
  var rows = document.getElementById('rows');
  var plates = [];

  function cleanChar(ch) {
    ch = ch.toUpperCase();
    if (LATIN_TO_CYR[ch]) ch = LATIN_TO_CYR[ch];
    if (/\d/.test(ch) || LETTERS.indexOf(ch) !== -1) return ch;
    return '';
  }
  function clean(str) {
    var out = '';
    for (var i = 0; i < str.length; i++) out += cleanChar(str[i]);
    return out.slice(0, 8);
  }

  function isValid(v) { return PATTERN.test(v); }

  function update() {
    var v = input.value;
    input.classList.remove('valid', 'invalid');
    msg.className = '';
    if (v === '') {
      msg.textContent = '';
    } else if (isValid(v)) {
      input.classList.add('valid');
      msg.classList.add('valid');
      msg.textContent = 'Номер коректний';
    } else {
      input.classList.add('invalid');
      msg.classList.add('invalid');
      msg.textContent = 'Формат: 2 літери, 4 цифри, 2 літери (напр. ВІ1234АН)';
    }
    saveBtn.disabled = !isValid(v);
  }

  input.addEventListener('input', function () {
    var pos = input.selectionStart;
    var cleanedBefore = clean(input.value.slice(0, pos)).length;
    var cleaned = clean(input.value);
    if (cleaned !== input.value) {
      input.value = cleaned;
      var p = Math.min(cleanedBefore, cleaned.length);
      input.setSelectionRange(p, p);
    }
    update();
  });

  function readCookie() {
    try {
      var m = document.cookie.match(new RegExp('(?:^|; )' + COOKIE + '=([^;]*)'));
      if (!m) return [];
      var data = JSON.parse(decodeURIComponent(m[1]));
      return Array.isArray(data) ? data.filter(function (x) {
        return x && typeof x.plate === 'string' && isValid(x.plate);
      }) : [];
    } catch (e) {
      return [];
    }
  }
  function writeCookie(arr) {
    var value = encodeURIComponent(JSON.stringify(arr));
    document.cookie = COOKIE + '=' + value +
      '; max-age=' + 60 * 60 * 24 * 365 + '; path=/; SameSite=Lax';
  }

  function render() {
    rows.textContent = '';
    if (!plates.length) {
      var tr = document.createElement('tr');
      var td = document.createElement('td');
      td.colSpan = 3;
      td.className = 'empty';
      td.textContent = 'Поки що порожньо';
      tr.appendChild(td);
      rows.appendChild(tr);
      return;
    }
    plates.forEach(function (item, i) {
      var tr = document.createElement('tr');
      [String(i + 1), item.plate, item.date].forEach(function (text, c) {
        var td = document.createElement('td');
        if (c === 1) td.className = 'num';
        td.textContent = text;
        tr.appendChild(td);
      });
      rows.appendChild(tr);
    });
  }

  saveBtn.addEventListener('click', function () {
    var v = input.value;
    if (!isValid(v)) return;
    var exists = plates.some(function (p) { return p.plate === v; });
    if (exists) {
      input.classList.remove('valid');
      input.classList.add('invalid');
      msg.className = 'invalid';
      msg.textContent = 'Цей номер уже є в таблиці';
      return;
    }
    plates.push({ plate: v, date: new Date().toLocaleString('uk-UA') });
    writeCookie(plates);
    render();
    input.value = '';
    update();
    input.focus();
  });

  plates = readCookie();
  render();
  update();
})();