class TrafficLight {
  #lights;
  #sequence = ["green", "yellow", "red", "yellow"];
  #step = 0;

  constructor(container) {
    this.#lights = {
      red: container.querySelector(".red"),
      yellow: container.querySelector(".yellow"),
      green: container.querySelector(".green"),
    };
    this.#render();
  }

  change() {
    this.#step = (this.#step + 1) % this.#sequence.length;
    this.#render();
  }

  #render() {
    const active = this.#sequence[this.#step];
    for (const [color, el] of Object.entries(this.#lights)) {
      el.classList.toggle("on", color === active);
    }
  }
}

const light = new TrafficLight(document.getElementById("trafficLight"));
document.getElementById("changeBtn").addEventListener("click", () => light.change());