class CodeLock {
  #combination;
  #digits;

  constructor(combination) {
    if (
      !Array.isArray(combination) ||
      combination.length !== 3 ||
      !combination.every((d) => Number.isInteger(d) && d >= 0 && d <= 9)
    ) {
      throw new Error("Combination must be an array of 3 digits (0-9)");
    }
    this.#combination = [...combination];
    this.#digits = [0, 0, 0].map(() => Math.floor(Math.random() * 10));
  }

  #checkPosition(position) {
    if (!Number.isInteger(position) || position < 0 || position > 2) {
      throw new RangeError("Position must be 0, 1 or 2");
    }
  }

  getDigit(position) {
    this.#checkPosition(position);
    return this.#digits[position];
  }

  click(position) {
    this.#checkPosition(position);
    this.#digits[position] = (this.#digits[position] + 1) % 10;
  }

  isDigitCorrect(position) {
    this.#checkPosition(position);
    return this.#digits[position] === this.#combination[position];
  }

  isOpen() {
    return this.#digits.every((d, i) => d === this.#combination[i]);
  }
}

const secret = Array.from(crypto.getRandomValues(new Uint8Array(3)), (n) => n % 10);
const lock = new CodeLock(secret);
secret.fill(0);

const digitsEl = document.getElementById("digits");
const statusEl = document.getElementById("status");
const squares = [];

for (let i = 0; i < 3; i++) {
  const btn = document.createElement("button");
  btn.className = "digit";
  btn.addEventListener("click", () => {
    lock.click(i);
    render();
  });
  digitsEl.appendChild(btn);
  squares.push(btn);
}

function render() {
  squares.forEach((btn, i) => {
    btn.textContent = lock.getDigit(i);
    btn.classList.toggle("correct", lock.isDigitCorrect(i));
  });
  const open = lock.isOpen();
  statusEl.textContent = open ? "Open" : "Closed";
  statusEl.classList.toggle("open", open);
}

render();