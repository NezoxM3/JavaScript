const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const randomMs = (min, max) => min + Math.random() * (max - min);

export async function getStationStatus(stationId) {
  await delay(randomMs(300, 1200));

  if (Math.random() < 0.2) {
    const errors = [
      `Станція ${stationId}: немає зв'язку`,
      `Станція ${stationId}: перевищено час очікування`,
      `Станція ${stationId}: контролер перезавантажується`,
    ];
    throw new Error(errors[Math.floor(Math.random() * errors.length)]);
  }

  const roll = Math.random();
  if (roll < 0.4) {
    return { stationId, state: 'free', powerKw: 0 };
  }
  if (roll < 0.9) {
    return {
      stationId,
      state: 'charging',
      powerKw: +(7 + Math.random() * 43).toFixed(1),
      batteryPercent: Math.floor(10 + Math.random() * 90),
    };
  }
  return { stationId, state: 'fault', powerKw: 0 };
}

const cards = {
  'CARD-001': { owner: 'Ткаченко', balance: 850 },
  'CARD-002': { owner: 'Мельник', balance: 40 },
  'CARD-003': { owner: 'Лисенко', balance: 1200 },
};

export async function authorizeCard(cardId) {
  await delay(randomMs(200, 600));
  if (Math.random() < 0.15) {
    throw new Error('Платіжний сервіс недоступний');
  }
  const card = cards[cardId];
  return card ? { cardId, ...card } : null;
}

export async function startSession(stationId, card) {
  await delay(randomMs(300, 800));
  const roll = Math.random();
  if (roll < 0.25) throw new Error(`Станція ${stationId} зайнята іншим авто`);
  if (roll < 0.35) throw new Error(`Станція ${stationId}: збій роз'єму`);
  return {
    sessionId: 'S-' + Math.floor(Math.random() * 1e6),
    stationId,
    owner: card.owner,
    tariffUahPerKwh: 14.5,
  };
}