const currentYear = 2026;
let age = prompt("Please enter your age:");

if (age < 18) {
    alert("You are a minor.");
}
else if (age >= 18 && age < 65) {
    alert("You are an adult.");
}
else {
    alert("You are a senior citizen.");
}

alert("You were born in the year: " + (currentYear - age));






// let a = "10";
    // let b = 20;

    // let sum = a + b;
    // console.log("The sum of a and b is: " + sum);



    // alert("This is an alert message!");
    // console.log("Hello, World!");