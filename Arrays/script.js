const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Task 1
const tasks = [];

do {
  const text = prompt("Enter task text:");
  if (text === null) break;
  const done = confirm("Is this task done? (OK = yes, Cancel = no)");
  tasks.push({ text, done, created: new Date() });
} while (confirm("Add another object?"));

console.log("All objects:");
for (const t of tasks) console.log(t);

console.log("Done objects:");
for (const t of tasks) {
  if (t.done === true) console.log(t);
}

let doneCount = 0;
let notDoneCount = 0;
for (const t of tasks) {
  if (t.done === true) doneCount++;
  else notDoneCount++;
}
console.log(`done === true: ${doneCount}, done === false: ${notDoneCount}`);

console.log("Days since creation:");
for (const t of tasks) {
  const days = Math.floor((new Date() - t.created) / MS_PER_DAY);
  console.log(`"${t.text}": ${days} day(s)`);
}

// Task 2
function analyzeText(text) {
  const words = text.match(/[\p{L}\p{N}'’-]+/gu) || [];
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim() !== "");

  let longestWord = "";
  let totalLength = 0;
  for (const w of words) {
    totalLength += w.length;
    if (w.length > longestWord.length) longestWord = w;
  }

  const average = words.length ? totalLength / words.length : 0;

  return {
    length: text.length,
    wordCount: words.length,
    sentenceCount: sentences.length,
    longestWord,
    averageWordLength: Number(average.toFixed(1)),
    upperCaseVersion: text.toUpperCase(),
  };
}

const result = analyzeText("Hello, how are you? All is well!");
console.log(result);

// Task 3
const events = [
  { title: "Project deadline", date: new Date(2026, 9, 1) },
  { title: "Colleague's birthday", date: new Date(2026, 8, 20) },
  { title: "JS exam", date: new Date(2026, 8, 15) },
];

function sortByDate(events) {
  return [...events].sort((a, b) => a.date - b.date);
}

function daysUntil(event) {
  return Math.ceil((event.date - new Date()) / MS_PER_DAY);
}

function getUpcoming(events, days) {
  return events.filter((e) => {
    const left = daysUntil(e);
    return left >= 0 && left <= days;
  });
}

function groupByMonth(events) {
  const groups = {};
  for (const e of events) {
    const month = e.date.toLocaleString("en-US", { month: "long" });
    if (!groups[month]) groups[month] = [];
    groups[month].push(e);
  }
  return groups;
}

console.log(sortByDate(events));
console.log(daysUntil(events[0]));
console.log(getUpcoming(events, 30));
console.log(groupByMonth(events));