var TABS = {
  departures:    { url: 'data/departures.json' },
  arrivals:      { url: 'data/arrivals.json' },
  announcements: { url: 'data/announcements.json' }
};
var TIMEOUT_MS = 5000;

var DEPARTURE_STATUS = {
  'on-time': 'Вчасно',
  'delayed': 'Затримується',
  'cancelled': 'Скасовано'
};
var ARRIVAL_STATUS = {
  'arrived': 'Прибув',
  'delayed': 'Затримується',
  'expected': 'Очікується'
};

var cache = {};
var activeTab = null;
var currentXhr = null;

var content = document.getElementById('content');
var refreshBtn = document.getElementById('refreshBtn');
var tabButtons = {};

function pad(n) {
  return n < 10 ? '0' + n : String(n);
}

function formatTime(iso) {
  var d = new Date(iso);
  if (isNaN(d)) return '—';
  return pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function text(value) {
  return value === undefined || value === null ? '—' : String(value);
}

function translate(map, status) {
  if (Object.prototype.hasOwnProperty.call(map, status)) {
    return map[status];
  }
  return text(status);
}

function clearContent() {
  content.textContent = '';
}

function buildTable(headers, rows) {
  var table = document.createElement('table');

  var headRow = table.createTHead().insertRow();
  headers.forEach(function (h) {
    var th = document.createElement('th');
    th.textContent = h;
    headRow.appendChild(th);
  });

  var tbody = table.createTBody();
  rows.forEach(function (row) {
    var tr = tbody.insertRow();
    row.forEach(function (value) {
      tr.insertCell().textContent = value;
    });
  });
  return table;
}

function buildDepartures(data) {
  var rows = data.map(function (item) {
    return [
      formatTime(item.departs),
      text(item.id),
      text(item.route),
      text(item.platform),
      text(item.seatsLeft),
      translate(DEPARTURE_STATUS, item.status)
    ];
  });
  return buildTable(['Час', 'Рейс', 'Маршрут', 'Перон', 'Вільні місця', 'Статус'], rows);
}

function buildArrivals(data) {
  var rows = data.map(function (item) {
    var delay = item.delayMin > 0 ? '+' + item.delayMin + ' хв' : '—';
    return [
      formatTime(item.arrives),
      text(item.id),
      text(item.from),
      text(item.platform),
      delay,
      translate(ARRIVAL_STATUS, item.status)
    ];
  });
  return buildTable(['Час', 'Рейс', 'Звідки', 'Перон', 'Затримка', 'Статус'], rows);
}

function buildAnnouncements(data) {
  // новіші зверху
  var sorted = data.slice().sort(function (a, b) {
    return new Date(b.time) - new Date(a.time);
  });

  var ul = document.createElement('ul');
  sorted.forEach(function (item) {
    var li = document.createElement('li');
    if (item.priority === 'urgent' || item.priority === 'warning') {
      li.className = item.priority;
    }

    var time = document.createElement('span');
    time.className = 'a-time';
    time.textContent = formatTime(item.time);

    var msg = document.createElement('span');
    msg.textContent = text(item.text);

    li.appendChild(time);
    li.appendChild(msg);
    ul.appendChild(li);
  });
  return ul;
}

function buildView(name, data) {
  if (!Array.isArray(data)) {
    throw new Error('Очікувався масив');
  }
  data.forEach(function (item) {
    if (typeof item !== 'object' || item === null) {
      throw new Error('Елемент не є об’єктом');
    }
  });

  if (name === 'departures') return buildDepartures(data);
  if (name === 'arrivals') return buildArrivals(data);
  return buildAnnouncements(data);
}

function showLoading() {
  clearContent();
  var p = document.createElement('p');
  p.className = 'loading';
  p.textContent = 'Завантаження…';
  content.appendChild(p);
}

function showView(view) {
  clearContent();
  content.appendChild(view);
}

function showError(name, message) {
  clearContent();
  var box = document.createElement('div');
  box.className = 'error';

  var p = document.createElement('p');
  p.textContent = message;

  var btn = document.createElement('button');
  btn.textContent = 'Спробувати ще';
  btn.addEventListener('click', function () {
    openTab(name, true);
  });

  box.appendChild(p);
  box.appendChild(btn);
  content.appendChild(box);
}

function updateTabTime(name) {
  var d = cache[name].updatedAt;
  var label = 'оновлено ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  tabButtons[name].querySelector('.tab-time').textContent = label;
}

function highlightTab(name) {
  for (var key in tabButtons) {
    tabButtons[key].classList.toggle('active', key === name);
  }
}

function loadData(name) {
  showLoading();
  refreshBtn.disabled = true;

  var xhr = new XMLHttpRequest();
  currentXhr = xhr;
  xhr.open('GET', TABS[name].url);
  xhr.timeout = TIMEOUT_MS;

  function fail(message) {
    if (xhr !== currentXhr) return;
    currentXhr = null;
    refreshBtn.disabled = false;
    showError(name, message);
  }

  xhr.onload = function () {
    if (xhr !== currentXhr) return;

    if (xhr.status < 200 || xhr.status >= 300) {
      fail('Сервер відповів помилкою. Код відповіді: ' + xhr.status);
      return;
    }

    var data, view;
    try {
      data = JSON.parse(xhr.responseText);
      view = buildView(name, data);
    } catch (e) {
      fail('Сервер надіслав некоректні дані');
      return;
    }

    currentXhr = null;
    refreshBtn.disabled = false;
    cache[name] = { data: data, updatedAt: new Date() };
    updateTabTime(name);
    showView(view);
  };

  xhr.onerror = function () {
    fail('Немає зв’язку із сервером');
  };

  xhr.ontimeout = function () {
    fail('Сервер не відповів за 5 секунд');
  };

  xhr.send();
}

function openTab(name, force) {
  if (currentXhr) {
    currentXhr.abort();
    currentXhr = null;
  }

  activeTab = name;
  highlightTab(name);
  refreshBtn.disabled = false;

  if (cache[name] && !force) {
    showView(buildView(name, cache[name].data));
  } else {
    loadData(name);
  }
}

Object.keys(TABS).forEach(function (name) {
  var btn = document.querySelector('.tab[data-tab="' + name + '"]');
  tabButtons[name] = btn;

  btn.addEventListener('click', function () {
    if (name === activeTab && currentXhr) return;
    openTab(name, false);
  });
});

refreshBtn.addEventListener('click', function () {
  if (activeTab) {
    openTab(activeTab, true);
  }
});