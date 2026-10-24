import { ChargingStation } from './ChargingStation.js';
import {
  createStationBlock,
  drawStation,
  clearStation,
  addHistoryRow,
  setChargeBusy,
  setMonitoringButtons,
} from './Ui.js';

const stations = [
  new ChargingStation('EV-1'),
  new ChargingStation('EV-2'),
  new ChargingStation('EV-3'),
];

let monitoringOn = false;

for (const station of stations) {
  const block = createStationBlock(station.id);

  block.chargeButton.addEventListener('click', async () => {
    setChargeBusy(block.chargeButton, true);
    try {
      const record = await station.charge(block.input.value.trim());
      addHistoryRow(station.id, record);
    } finally {
      setChargeBusy(block.chargeButton, false);
    }
  });
}

document.getElementById('startBtn').addEventListener('click', () => {
  monitoringOn = true;
  for (const station of stations) {
    station.startMonitoring(drawStation);
  }
  setMonitoringButtons(true);
});

document.getElementById('stopBtn').addEventListener('click', () => {
  monitoringOn = false;
  for (const station of stations) {
    station.stopMonitoring();
    clearStation(station.id);
  }
  setMonitoringButtons(false);
});

document.getElementById('refreshBtn').addEventListener('click', async () => {
  const refreshBtn = document.getElementById('refreshBtn');
  refreshBtn.disabled = true;
  try {
    await Promise.all(stations.map(station => station.refresh()));

    if (monitoringOn) {
      for (const station of stations) {
        drawStation(station);
      }
    }
  } finally {
    refreshBtn.disabled = !monitoringOn;
  }
});

setMonitoringButtons(false);