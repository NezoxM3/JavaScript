const STATE_NAMES = {
  free: 'Вільна',
  charging: 'Заряджає авто',
  fault: 'Несправна',
};

export function createStationBlock(stationId) {
  const block = document.createElement('div');
  block.className = 'station';
  block.innerHTML =
    '<div class="card">' +
      '<h2>' + stationId + '</h2>' +
      '<div id="body-' + stationId + '"></div>' +
    '</div>' +
    '<div class="charge-form">' +
      '<input id="input-' + stationId + '" type="text" placeholder="Номер картки">' +
      '<button id="btn-' + stationId + '">Почати зарядку</button>' +
    '</div>' +
    '<table>' +
      '<thead><tr><th>Час</th><th>Картка</th><th>Рішення</th></tr></thead>' +
      '<tbody id="history-' + stationId + '"></tbody>' +
    '</table>';

  document.getElementById('stations').appendChild(block);

  return {
    input: document.getElementById('input-' + stationId),
    chargeButton: document.getElementById('btn-' + stationId),
  };
}

export function drawStation(station) {
  const body = document.getElementById('body-' + station.id);

  if (station.error) {
    body.innerHTML = '<p class="error">' + station.error + '</p>';
    return;
  }
  if (station.status === null) {
    body.innerHTML = '';
    return;
  }

  const s = station.status;
  let html = '<p class="state ' + s.state + '">' + STATE_NAMES[s.state] + '</p>';
  if (s.state === 'charging') {
    html += '<p>Потужність: ' + s.powerKw + ' кВт</p>';
    html += '<p>Заряд батареї: ' + s.batteryPercent + '%</p>';
  }
  body.innerHTML = html;
}

export function clearStation(stationId) {
  document.getElementById('body-' + stationId).innerHTML = '';
}

export function addHistoryRow(stationId, record) {
  const tbody = document.getElementById('history-' + stationId);
  const row = tbody.insertRow(0);
  row.className = record.success ? 'ok' : 'fail';
  row.insertCell(0).textContent = record.time;
  row.insertCell(1).textContent = record.cardId;
  row.insertCell(2).textContent = record.decision;
}

export function setChargeBusy(button, busy) {
  button.disabled = busy;
}

export function setMonitoringButtons(running) {
  document.getElementById('startBtn').disabled = running;
  document.getElementById('stopBtn').disabled = !running;
  document.getElementById('refreshBtn').disabled = !running;
}