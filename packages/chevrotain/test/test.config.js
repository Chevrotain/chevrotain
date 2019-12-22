if (typeof global === "object") {
  global.expect = require("chai").expect
  require("chai").use(require("sinon-chai"))
  global.sinon = require("sinon")
} else if (typeof window === "object") {
  window.expect = chai.expect
}
