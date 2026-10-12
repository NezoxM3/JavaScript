  const serviceSelect = document.getElementById("service");
  const takeBtn = document.getElementById("takeBtn");
  const callBtn = document.getElementById("callBtn");
  const countEl = document.getElementById("count");
  const queueListEl = document.getElementById("queueList");
  const servingEl = document.getElementById("serving");

  const queue = [];
  let ticketCounter = 0;

  function createTicket(service) {
    ticketCounter++;
    const letter = service.charAt(0).toUpperCase();
    const number = `${letter}-${String(ticketCounter).padStart(3, "0")}`;
    return { number, priority: service === "Гарантія" };
  }

  function renderQueue() {
    countEl.textContent = `У черзі: ${queue.length}`;
    queueListEl.innerHTML = "";
    for (const ticket of queue) {
      const li = document.createElement("li");
      li.textContent = ticket.number;
      if (ticket.priority) li.classList.add("priority");
      queueListEl.appendChild(li);
    }
  }

  function renderServing(ticket) {
    servingEl.innerHTML = "";
    if (!ticket) {
      servingEl.textContent = "Черга порожня";
      return;
    }
    const span = document.createElement("span");
    span.textContent = ticket.number;
    if (ticket.priority) span.classList.add("priority");
    servingEl.appendChild(span);
  }

  takeBtn.addEventListener("click", () => {
    queue.push(createTicket(serviceSelect.value));
    renderQueue();
  });

  callBtn.addEventListener("click", () => {
    const next = queue.shift();
    renderServing(next);
    renderQueue();
  });

  renderQueue();