import { timer } from "../src/api.js"
import { expect } from "chai"

describe("The timer helper", () => {
  it("will return the total execution time of a sync function", () => {
    const { time } = timer(() => {
      const sab = new SharedArrayBuffer(1024)
      const int32 = new Int32Array(sab)
      Atomics.wait(int32, 0, 0, 100)
    })
    expect(time).to.be.greaterThanOrEqual(100)
  })

  it("will return the value of the callback function", () => {
    const { value } = timer(() => {
      return 2 * 2
    })
    expect(value).to.eql(4)
  })
})
