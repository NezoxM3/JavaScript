  const ROWS = 6;
  const SEATS_PER_ROW = 10;
  const MAX_SELECTED = 6;
 
  const TAKEN = [
    [1, 5], [1, 6],
    [2, 3], [2, 4], [2, 8],
    [3, 7],
    [4, 1], [4, 2], [4, 10],
    [5, 5], [5, 6],
    [6, 2], [6, 9],
  ];
  const takenSet = new Set(TAKEN.map(([r, s]) => `${r}-${s}`));
 
  const hall = document.getElementById("hall");
  const summaryEl = document.getElementById("summary");
  const listEl = document.getElementById("selectedList");
  const messageEl = document.getElementById("message");
  const infoEl = document.getElementById("info");
 
  for (let row = 1; row <= ROWS; row++) {
    const rowEl = document.createElement("div");
    rowEl.className = "row";
 
    const label = document.createElement("div");
    label.className = "row-label";
    label.textContent = row;
    rowEl.appendChild(label);
 
    for (let seat = 1; seat <= SEATS_PER_ROW; seat++) {
      const seatEl = document.createElement("div");
      seatEl.className = "seat";
      seatEl.dataset.row = row;
      seatEl.dataset.seat = seat;
      seatEl.dataset.price = row <= 4 ? 150 : 220;
      seatEl.dataset.state = takenSet.has(`${row}-${seat}`) ? "taken" : "free";
      seatEl.textContent = seat;
      rowEl.appendChild(seatEl);
    }
    hall.appendChild(rowEl);
  }
 
  function renderPanel() {
    const selected = hall.querySelectorAll(".seat.selected");
    let total = 0;
    listEl.innerHTML = "";
 
    for (const el of selected) {
      total += Number(el.dataset.price);
      const li = document.createElement("li");
      li.textContent = `Ряд ${el.dataset.row}, місце ${el.dataset.seat}`;
      listEl.appendChild(li);
    }
    summaryEl.textContent = `Обрано: ${selected.length} місць, сума: ${total} грн`;
  }
 
  hall.addEventListener("click", (e) => {
    const seat = e.target.closest(".seat");
    if (!seat) return;
    if (seat.dataset.state === "taken") return;
 
    messageEl.textContent = "";
 
    if (seat.classList.contains("selected")) {
      seat.classList.remove("selected");
    } else {
      const count = hall.querySelectorAll(".seat.selected").length;
      if (count >= MAX_SELECTED) {
        messageEl.textContent = `Можна обрати не більше ${MAX_SELECTED} місць за раз.`;
        return;
      }
      seat.classList.add("selected");
    }
    renderPanel();
  });
 
  hall.addEventListener("contextmenu", (e) => {
    const seat = e.target.closest(".seat");
    if (!seat) return;
    e.preventDefault();
 
    const sold = seat.dataset.state === "taken" ? " (продано)" : "";
    infoEl.textContent =
      `Ряд ${seat.dataset.row}, місце ${seat.dataset.seat}, ціна: ${seat.dataset.price} грн${sold}`;
  });
 
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    for (const el of hall.querySelectorAll(".seat.selected")) {
      el.classList.remove("selected");
    }
    messageEl.textContent = "";
    renderPanel();
  });
 
  renderPanel();