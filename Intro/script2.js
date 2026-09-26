let num1 = prompt("Введіть перше число:");

while (num1 === "" || isNaN(num1)) {
  alert("Помилка: введіть коректне число!");
  num1 = prompt("Введіть перше число:");
}

let operation = prompt("Введіть операцію (+, -, *, /):");

while (operation !== "+" && operation !== "-" && operation !== "*" && operation !== "/") {
  alert("Помилка: підтримуються лише +, -, *, /");
  operation = prompt("Введіть операцію (+, -, *, /):");
}

let num2 = prompt("Введіть друге число:");

while (num2 === "" || isNaN(num2)) {
  alert("Помилка: введіть коректне число!");
  num2 = prompt("Введіть друге число:");
}


let result;

if (operation === "+") {
  result = num1 + num2;
} else if (operation === "-") {
  result = num1 - num2;
} else if (operation === "*") {
  result = num1 * num2;
} else if (operation === "/") {
  if (num2 === 0) {
    alert("Помилка: ділення на нуль неможливе!");
  } else {
    result = num1 / num2;
  }
}

if (num2 !== 0 || operation !== "/") {
  alert("Результат: " + num1 + " " + operation + " " + num2 + " = " + result);
}