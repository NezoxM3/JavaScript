function readStation(id, callback) {
    const responseTime = 200 + Math.random() * 600;

    setTimeout(() => {
        if (Math.random() < 0.3) {

            const errors = [
                new Error(`Станція ${id}: немає зв'язку`),
                new Error(`Станція ${id}: помилка датчика`),
                new Error(`Станція ${id}: перевищено час очікування`),
            ]

            callback(errors[Math.floor(Math.random() * errors.length)]);
            return;
        }

        const tempF = Math.round(-80 + Math.random() * 240);

        callback(null, { id, tempF });
    }, responseTime);
}

function readStationAsync(id) {
  return new Promise(function (resolve, reject) {
    readStation(id, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

var running = false;
var timer = null;

var startBtn = document.getElementById('startBtn');
var stopBtn = document.getElementById('stopBtn');

function updateCard(id) {
  var card = document.getElementById('card' + id);

  readStationAsync(id)
    .then(function (data) {
      if (!running) return;

      var c = (data.tempF - 32) * 5 / 9;
      c = Math.round(c * 10) / 10;

      if (c < -50 || c > 60) {
        card.innerHTML = '<div class="error">Несправний датчик (' + c + ' °C)</div>';
      } else {
        var percent = (c + 50) / 110 * 100;
        card.innerHTML =
          '<p class="temp">' + c + ' °C</p>' +
          '<div class="bar"><div class="fill" style="width:' + percent + '%"></div></div>';
      }
    })
    .catch(function (err) {
      if (!running) return;
      card.innerHTML = '<div class="error">' + err.message + '</div>';
    });
}

function updateAll() {
  updateCard(1);
  updateCard(2);
  updateCard(3);
}

startBtn.onclick = function () {
  running = true;
  startBtn.disabled = true;
  stopBtn.disabled = false;
  updateAll();
  timer = setInterval(updateAll, 3000);
};

stopBtn.onclick = function () {
  running = false;
  clearInterval(timer);
  startBtn.disabled = false;
  stopBtn.disabled = true;

  document.getElementById('card1').innerHTML = '';
  document.getElementById('card2').innerHTML = '';
  document.getElementById('card3').innerHTML = '';
};