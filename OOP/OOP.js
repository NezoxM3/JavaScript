// Task 1
const TimeUnit = Object.freeze({ DAYS: "days", HOURS: "hours" });

class CalendarEvent {
  constructor(name, description, date) {
    this.name = name;
    this.description = description;
    this.date = date;
  }

  showInfo() {
    console.log(`Name: ${this.name}`);
    console.log(`Description: ${this.description}`);
    console.log(`Date: ${this.date.toLocaleString("en-GB")}`);
  }

  getTimeBetween(other, unit) {
    const diffMs = Math.abs(other.date - this.date);
    switch (unit) {
      case TimeUnit.DAYS:
        return diffMs / (1000 * 60 * 60 * 24);
      case TimeUnit.HOURS:
        return diffMs / (1000 * 60 * 60);
      default:
        throw new Error(`Unknown unit: ${unit}`);
    }
  }
}

// Task 2
class ImportantEvent extends CalendarEvent {
  constructor(name, description, date, importance = "regular") {
    super(name, description, date);
    if (importance !== "regular" && importance !== "important") {
      throw new Error('Importance must be "regular" or "important"');
    }
    this.importance = importance;
  }

  showInfo() {
    super.showInfo();
    console.log(`Importance: ${this.importance}`);
  }
}

// Task 3
class MyString extends String {
  countChar(char) {
    let count = 0;
    for (let i = 0; i < this.length; i++) {
      if (this[i] === char) count++;
    }
    return count;
  }
}

// Task 4
class LogMessage extends String {
  static LEVELS = ["DEBUG", "INFO", "ERROR"];

  constructor(text, level) {
    super(text);
    if (!LogMessage.LEVELS.includes(level)) {
      throw new Error(`Invalid level: ${level}`);
    }
    this.level = level;
    this.date = new Date();
  }

  static debug(text) { return new LogMessage(text, "DEBUG"); }
  static info(text)  { return new LogMessage(text, "INFO"); }
  static error(text) { return new LogMessage(text, "ERROR"); }

  toString() {
    const dateStr = this.date.toISOString().replace("T", " ").slice(0, 19);
    return `${dateStr} [${this.level}] ${this.valueOf()}`;
  }
}

// Task 5
class LogList extends Array {
  errorsCount() {
    let count = 0;
    for (const msg of this) {
      if (msg.level === "ERROR") count++;
    }
    return count;
  }

  errorsList() {
    return Array.from(this).filter((msg) => msg.level === "ERROR");
  }
}

console.log("--- Task 1 ---");
const e1 = new CalendarEvent("Semester start", "First class", new Date(2026, 8, 1, 9, 0));
const e2 = new CalendarEvent("Exam", "Final programming exam", new Date(2026, 11, 20, 12, 0));
e1.showInfo();
console.log(`Days: ${e1.getTimeBetween(e2, TimeUnit.DAYS).toFixed(1)}`);
console.log(`Hours: ${e1.getTimeBetween(e2, TimeUnit.HOURS).toFixed(0)}`);

console.log("\n--- Task 2 ---");
const ie = new ImportantEvent("Defense", "Course project defense", new Date(2026, 11, 25, 10, 0), "important");
ie.showInfo();

console.log("\n--- Task 3 ---");
const s = new MyString("hello world");
console.log(s.countChar("o"));
console.log(s.countChar("l"));

console.log("\n--- Task 4 ---");
console.log(LogMessage.error("No connection to the server").toString());
console.log(String(LogMessage.info("Server started")));

console.log("\n--- Task 5 ---");
const logs = new LogList();
logs.push(LogMessage.info("Started"));
logs.push(LogMessage.error("Disk full"));
logs.push(LogMessage.debug("x = 5"));
logs.push(LogMessage.error("No connection"));
console.log(logs.errorsCount());
console.log(logs.errorsList().map(String));