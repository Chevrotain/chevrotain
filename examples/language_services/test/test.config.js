if (typeof global === "object") {
    global.expect = require("chai").expect
}

else if (typeof window === "object") {
    window.expect = chai.expect
}
