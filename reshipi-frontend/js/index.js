'use strict';

function main() {
    let signup_form = document.getElementById("sign-up");
    signup_form.addEventListener("submit", (event) => {
        console.log(event);
        console.log(signup_form);
        return false;
    });
}

// main();