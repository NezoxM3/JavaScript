import { getStationStatus, authorizeCard, startSession } from './Api.js';

export class ChargingStation {
  constructor(id) {
    this.id = id;
    this.status = null;
    this.error = null;
    this.monitoring = false;
    this.history = [];
    this.timer = null;
    this.runId = 0;
  }

  async refresh() {
    try {
      this.status = await getStationStatus(this.id);
      this.error = null;
    } catch (err) {
      this.error = err.message;
    }
  }

  startMonitoring(render) {
    if (this.monitoring) return;
    this.monitoring = true;
    this.runId++;
    this.status = null;
    this.error = null;
    this.loop(render, this.runId);
  }

  stopMonitoring() {
    this.monitoring = false;
    this.runId++;
    clearTimeout(this.timer);
  }


  async loop(render, runId) {
    await this.refresh();

    if (runId !== this.runId) return;

    render(this);
    this.timer = setTimeout(() => this.loop(render, runId), 3000);
  }

  async charge(cardId) {
    let decision = '';
    let success = false;

    try {
      const card = await authorizeCard(cardId);

      if (card === null) {
        decision = 'Картку не знайдено';
      } else if (card.balance < 100) {
        decision = 'Недостатньо коштів';
      } else {
        try {
          const session = await startSession(this.id, card);
          decision = 'Зарядку розпочато, сесія ' + session.sessionId + ', власник ' + session.owner;
          success = true;
        } catch (err) {
          decision = err.message;
        }
      }
    } catch (err) {
      decision = 'Платіжний сервіс недоступний, спробуйте пізніше';
    }

    const record = {
      time: new Date().toLocaleTimeString('uk-UA'),
      cardId: cardId,
      decision: decision,
      success: success,
    };
    this.history.push(record);
    return record;
  }
}