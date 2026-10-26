var DB_NAME = 'shopDb';
var DB_VERSION = 2;
var STORE = 'products';

var dbPromise = null;

function req(request) {
  return new Promise(function (resolve, reject) {
    request.onsuccess = function () { resolve(request.result); };
    request.onerror = function () { reject(request.error); };
  });
}

function txDone(tx) {
  return new Promise(function (resolve, reject) {
    tx.oncomplete = function () { resolve(); };
    tx.onerror = function () { reject(tx.error); };
    tx.onabort = function () { reject(tx.error || new Error('Транзакцію скасовано')); };
  });
}

function openDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise(function (resolve, reject) {
    if (!window.indexedDB) {
      reject(new Error('Ваш браузер не підтримує IndexedDB'));
      return;
    }

    var request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = function (event) {
      var db = request.result;
      var tx = request.transaction;
      var store;

      if (!db.objectStoreNames.contains(STORE)) {
        store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      } else {
        store = tx.objectStore(STORE);
      }

      if (!store.indexNames.contains('category')) {
        store.createIndex('category', 'category');
      }
      if (!store.indexNames.contains('price')) {
        store.createIndex('price', 'price');
      }
      if (!store.indexNames.contains('nameLower')) {
        store.createIndex('nameLower', 'nameLower');
      }

      if (event.oldVersion === 1) {
        store.openCursor().onsuccess = function (e) {
          var cursor = e.target.result;
          if (cursor) {
            var product = cursor.value;
            product.nameLower = String(product.name).toLowerCase();
            cursor.update(product);
            cursor.continue();
          }
        };
      }
    };

    request.onsuccess = function () {
      var db = request.result;
      db.onversionchange = function () {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };

    request.onerror = function () {
      dbPromise = null;
      reject(request.error);
    };

    request.onblocked = function () {
      dbPromise = null;
      reject(new Error('Закрийте інші вкладки з цією сторінкою й оновіть її'));
    };
  });

  return dbPromise;
}

async function addProduct(product) {
  var db = await openDb();
  var tx = db.transaction(STORE, 'readwrite');
  var results = await Promise.all([
    req(tx.objectStore(STORE).add(product)),
    txDone(tx)
  ]);
  return results[0];
}

async function updateProduct(product) {
  var db = await openDb();
  var tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).put(product);
  await txDone(tx);
}

async function deleteProduct(id) {
  var db = await openDb();
  var tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).delete(id);
  await txDone(tx);
}

async function getProduct(id) {
  var db = await openDb();
  var tx = db.transaction(STORE, 'readonly');
  return req(tx.objectStore(STORE).get(id));
}

async function getAllProducts() {
  var db = await openDb();
  var tx = db.transaction(STORE, 'readonly');
  return req(tx.objectStore(STORE).getAll());
}

async function countProducts() {
  var db = await openDb();
  var tx = db.transaction(STORE, 'readonly');
  return req(tx.objectStore(STORE).count());
}

async function queryProducts(filters) {
  var db = await openDb();
  var tx = db.transaction(STORE, 'readonly');
  var store = tx.objectStore(STORE);

  var from = filters.priceFrom;
  var to = filters.priceTo;
  var hasPrice = from !== null || to !== null;

  var range = null;
  if (hasPrice) {
    if (from !== null && to !== null) {
      if (from > to) return [];
      range = IDBKeyRange.bound(from, to);
    } else if (from !== null) {
      range = IDBKeyRange.lowerBound(from);
    } else {
      range = IDBKeyRange.upperBound(to);
    }
  }

  var byCategory = null;
  var byPrice = null;

  if (filters.category) {
    byCategory = await req(store.index('category').getAll(IDBKeyRange.only(filters.category)));
  }
  if (range) {
    byPrice = await req(store.index('price').getAll(range));
  }

  if (byCategory && byPrice) {
    var ids = new Set(byPrice.map(function (p) { return p.id; }));
    return byCategory.filter(function (p) { return ids.has(p.id); });
  }
  if (byCategory) return byCategory;
  if (byPrice) return byPrice;
  return req(store.getAll());
}