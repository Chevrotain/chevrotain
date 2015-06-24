// CHEV_TEST_MODE will cause the WHOLE 'chevrotain' namespace object to be exported
// normally during production this flag is undefined (false), and only a small part
// of Chevrotain is exposed as a public API.

if (typeof global === "object") {
    console.log("CHEV_TEST_MODE flag enabled")
    global.CHEV_TEST_MODE = true
    global.expect = require("chai").expect
}

else if (typeof window === "object") {
    console.log("CHEV_TEST_MODE flag enabled")
    window.CHEV_TEST_MODE = true
}