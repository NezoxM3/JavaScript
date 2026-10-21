function recognizePlate(gateId, callback) {
  const plates = ['АА 1234 ВС', 'ВІ 7777 КА', 'ВА 0042 ХМ', 'КА 5511 ІО', 'ВН 3030 ЕЕ'];
  setTimeout(() => {
    if (Math.random() < 0.2) {
      callback(new Error(`${gateId}: камера не відповідає`));
      return;
    }
    const plate = Math.random() < 0.15
      ? null
      : plates[Math.floor(Math.random() * plates.length)];
    callback(null, { gateId, plate });
  }, 200 + Math.random() * 600);
}

function checkPass(plate, callback) {
  const passes = {
    'АА 1234 ВС': { owner: 'Григоряк', validUntil: '2027-03-31' },
    'ВІ 7777 КА': { owner: 'Шевченко', validUntil: '2026-01-15' },
    'КА 5511 ІО': { owner: 'Матвієнко', validUntil: '2026-12-31' },
  };
  setTimeout(() => {
    if (Math.random() < 0.2) {
      callback(new Error('База абонементів недоступна'));
      return;
    }
    callback(null, passes[plate] || null);
  }, 150 + Math.random() * 350);
}

function processCar(gateId, done) {

  recognizePlate(gateId, function (err, data) {
    if (err) {
      done(err);
      return;
    }

    if (data.plate === null) {
      done(new Error('Номер не розпізнано'));
      return;
    }

    checkPass(data.plate, function (err2, pass) {
      if (err2) {
        done(null, { gateId: gateId, plate: data.plate, pass: null,
                     decision: 'Ручна перевірка охоронцем' });
        return;
      }

      var decision;
      if (pass === null) {
        decision = 'Погодинна оплата';
      } else {
        var end = new Date(pass.validUntil + 'T23:59:59');
        if (end >= new Date()) {
          decision = "Абонемент, в'їзд дозволено";
        } else {
          decision = 'Абонемент прострочено, погодинна оплата';
        }
      }

      done(null, { gateId: gateId, plate: data.plate, pass: pass, decision: decision });
    });
  });
}

function addRow(tableId, err, result) {
  var tbody = document.getElementById(tableId);
  var row = tbody.insertRow(0);

  var time = new Date().toLocaleTimeString('uk-UA');
  var plate = '—';
  var pass = '—';
  var text;

  if (err) {
    text = 'Помилка: ' + err.message;
    row.className = 'err';
  } else {
    plate = result.plate;
    text = result.decision;
    if (result.pass) {
      pass = result.pass.owner + ', до ' + result.pass.validUntil;
    }

    if (text === "Абонемент, в'їзд дозволено") {
      row.className = 'ok';
    } else if (text === 'Ручна перевірка охоронцем') {
      row.className = 'manual';
    } else {
      row.className = 'pay';
    }
  }

  row.insertCell(0).textContent = time;
  row.insertCell(1).textContent = plate;
  row.insertCell(2).textContent = pass;
  row.insertCell(3).textContent = text;
}

function startCheck(gateNumber) {
  var button = document.getElementById('btn' + gateNumber);
  button.disabled = true;

  processCar("В'їзд " + gateNumber, function (err, result) {
    addRow('table' + gateNumber, err, result);
    button.disabled = false;
  });
}

document.getElementById('btn1').onclick = function () { startCheck(1); };
document.getElementById('btn2').onclick = function () { startCheck(2); };
document.getElementById('btn3').onclick = function () { startCheck(3); };