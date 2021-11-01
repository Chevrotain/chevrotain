import compact from "lodash/compact"
import {
  forEach,
  isString,
  filter,
  has,
  contains,
  cloneArr,
  cloneObj,
  find,
  reduce,
  uniq,
  pick,
  partial,
  some,
  every,
  indexOf,
  sortBy,
  zipObject,
  assign,
  groupBy,
  upperFirst
} from "../src/api"
import { expect } from "chai"

describe("The Utils functions namespace", () => {
  it("exports a forEach utility", () => {
    forEach([1, 2, 3], (item, idx) => {
      expect(item).to.equal(idx + 1)
    })

    forEach([], (item) => {
      throw Error("call back should not be invoked for empty array")
    })
  })

  it("exports a isString utility", () => {
    expect(isString("")).to.be.true
    expect(isString("bamba")).to.be.true
    expect(isString(66)).to.be.false
    expect(isString(null)).to.be.false
  })

  it("exports a filter utility", () => {
    expect(
      filter([], (item) => {
        return true
      })
    ).to.deep.equal([])
    expect(
      filter([1, 2, 3], (item) => {
        return true
      })
    ).to.deep.equal([1, 2, 3])
    expect(
      filter([1, 2, 3], (item) => {
        return false
      })
    ).to.deep.equal([])
    expect(
      filter([1, 2, 3], (item) => {
        return item % 2 === 0
      })
    ).to.deep.equal([2])
    expect(
      filter([1, 2, 3], (item) => {
        return item % 2 === 1
      })
    ).to.deep.equal([1, 3])
  })

  it("exports a has utility", () => {
    expect(has([1, 2, 3], "0")).to.be.true
    expect(has([1, 2, 3], "5")).to.be.false
    expect(has({}, "bamba")).to.be.false
    expect(has({ bamba: 666 }, "bamba")).to.be.true
  })

  it("exports a contains utility", () => {
    expect(contains([1, 2, 3], 4)).to.be.false
    expect(contains([1, 2, 3], 2)).to.be.true
    expect(contains([] as number[], 2)).to.be.false
    expect(contains([0], 0)).to.be.true
  })

  it("exports a cloneArr utility", () => {
    expect(cloneArr([1, 2, 3])).to.deep.equal([1, 2, 3])
    expect(cloneArr([])).to.deep.equal([])
    const arr: undefined[] = []
    expect(cloneArr(arr)).to.not.equal(arr)
  })

  it("exports a cloneObj utility", () => {
    expect(cloneObj({ bamba: 666, bisli: 777 })).to.deep.equal({
      bamba: 666,
      bisli: 777
    })
    const obj = { bamba: 666, bisli: 777 }
    expect(cloneObj(obj)).to.not.equal(obj)
    expect(cloneObj(["bamba"])).to.not.have.property("length")
    expect(cloneObj(["bamba"])).to.deep.equal({ "0": "bamba" })
  })

  it("exports a find utility", () => {
    expect(find([1, 2, 3], (item) => item === 2)).to.equal(2)
    expect(find([], (item) => item === 2)).to.be.undefined
    const a = {}
    const b = {}
    expect(find([a, b], (item) => item === b)).to.equal(b)
  })

  it("exports a reduce utility", () => {
    expect(
      reduce(
        [1, 2, 3],
        (result, item) => {
          return result.concat([item * 2])
        },
        [] as number[]
      )
    ).to.deep.equal([2, 4, 6])

    expect(
      reduce(
        { one: 1, two: 2, three: 3 },
        (result, item) => {
          return result.concat([item * 2])
        },
        [] as number[]
      )
    ).to.deep.equal([2, 4, 6])
  })

  it("exports a compact utility", () => {
    expect(compact([1, 2, null, 3])).to.deep.equal([1, 2, 3])
    expect(compact([1, undefined, 2, 3])).to.deep.equal([1, 2, 3])
    expect(compact([])).to.deep.equal([])
    expect(compact([1, 2, 3])).to.deep.equal([1, 2, 3])
  })

  it("exports a uniq utility", () => {
    expect(uniq([1, 2, 3, 2])).to.contain.members([1, 2, 3])
    expect(
      uniq([2, 2, 4, 2], (item) => {
        return 666
      })
    ).to.have.length(1)
    expect(uniq([])).to.deep.equal([])
  })

  it("exports a pick utility", () => {
    expect(pick({ bamba: true, bisli: false }, (item) => item)).to.deep.equal({
      bamba: true
    })
    expect(pick({}, (item) => item)).to.be.empty
  })

  it("exports a partial utility", () => {
    const add = function (x: number, y: number) {
      return x + y
    }
    expect(partial(add)(2, 3)).to.equal(5)
    expect(partial(add, 2)(3)).to.equal(5)
    expect(partial(add, 2, 3)()).to.equal(5)
  })

  it("exports an every utility", () => {
    expect(
      every([], (item) => {
        return true
      })
    ).to.be.true
    // empty set always true...
    expect(
      every([], (item) => {
        return false
      })
    ).to.be.true
    expect(
      every([1, 2, 3], (item) => {
        return item % 2 === 0
      })
    ).to.be.false
    expect(
      every([2, 4, 6], (item) => {
        return item % 2 === 0
      })
    ).to.be.true
  })

  it("exports an some utility", () => {
    expect(
      some([], (item) => {
        return true
      })
    ).to.be.false
    expect(
      some([], (item) => {
        return false
      })
    ).to.be.false
    expect(
      some([1, 2, 3], (item) => {
        return item % 2 === 0
      })
    ).to.be.true
    expect(
      some([1, 3, 5], (item) => {
        return item % 2 === 0
      })
    ).to.be.false
  })

  it("exports an indexOf utility", () => {
    expect(indexOf([1, 2, 3], 2)).to.equal(1)
    expect(indexOf([1, 2, 3], 3)).to.equal(2)
    expect(indexOf([1, 2, 3], 0)).to.equal(-1)
    expect(indexOf([], -2)).to.equal(-1)
  })

  it("exports a sortBy utility", () => {
    expect(sortBy([1, 2, 3], (num) => num)).to.deep.equal([1, 2, 3])
    expect(sortBy([3, 2, 1], (num) => num)).to.deep.equal([1, 2, 3])
  })

  it("exports a zipObject utility", () => {
    expect(zipObject(["ima", "aba", "bamba"], [1, 2, 3])).to.deep.equal({
      ima: 1,
      aba: 2,
      bamba: 3
    })
    expect(() => zipObject(["ima", "aba"], [1, 2, 3])).to.throw(
      "can't zipObject"
    )
    expect(zipObject([], [])).to.deep.equal({})
  })

  it("exports an assign utility", () => {
    expect(assign(["ima", "aba", "bamba"], [1, 2, 3])).to.deep.equal([1, 2, 3])
    expect(assign({}, { ima: 666 }, { aba: 333 })).to.deep.equal({
      ima: 666,
      aba: 333
    })
    expect(assign({}, { ima: 666 }, { aba: 333 }, { ima: 999 })).to.deep.equal({
      ima: 999,
      aba: 333
    })
  })

  it("exports a groupBy utility", () => {
    expect(groupBy([1, 2, 3, 4], (num) => "" + (num % 2))).to.deep.equal({
      0: [2, 4],
      1: [1, 3]
    })
    expect(groupBy([1, 2, 3, 4], (num) => "" + num)).to.deep.equal({
      1: [1],
      2: [2],
      3: [3],
      4: [4]
    })
  })

  it("exports a groupBy utility", () => {
    expect(groupBy([1, 2, 3, 4], (num) => "" + (num % 2))).to.deep.equal({
      0: [2, 4],
      1: [1, 3]
    })
    expect(groupBy([1, 2, 3, 4], (num) => "" + num)).to.deep.equal({
      1: [1],
      2: [2],
      3: [3],
      4: [4]
    })
  })

  it("exports a upperFirst utility", () => {
    expect(upperFirst("a")).to.equal("A")
    expect(upperFirst("abc")).to.equal("Abc")
    expect(upperFirst("Abc")).to.equal("Abc")
    expect(upperFirst("aBc")).to.equal("ABc")
    expect(upperFirst("😀Bc")).to.equal("😀Bc")
    expect(upperFirst("åbc")).to.equal("Åbc")
    expect(upperFirst("")).to.equal("")
  })
})
