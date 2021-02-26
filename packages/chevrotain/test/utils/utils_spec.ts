import {
  last,
  forEach,
  isString,
  drop,
  dropRight,
  filter,
  reject,
  has,
  contains,
  cloneArr,
  cloneObj,
  find,
  reduce,
  compact,
  uniq,
  pick,
  partial,
  difference,
  some,
  every,
  indexOf,
  sortBy,
  zipObject,
  assign,
  groupBy,
  mapValues
} from "../../src/utils/utils"

describe("The Utils functions namespace", () => {
  it("exports a last utility", () => {
    expect(last([1, 2, 3])).to.equal(3)
    expect(last([])).to.equal(undefined)
    expect(last(null)).to.equal(undefined)
  })

  it("exports a forEach utility", () => {
    forEach([1, 2, 3], (item, idx) => {
      expect(item).to.equal(idx + 1)
    })

    expect(() => forEach(null, (item) => {})).to.throw("non exhaustive match")

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

  it("exports a drop utility", () => {
    expect(drop([])).to.deep.equal([])
    expect(drop([1, 2, 3])).to.deep.equal([2, 3])
    expect(drop([1, 2, 3], 2)).to.deep.equal([3])
    expect(drop([1, 2, 3], 3)).to.deep.equal([])
  })

  it("exports a dropRight utility", () => {
    expect(dropRight([])).to.deep.equal([])
    expect(dropRight([1, 2, 3])).to.deep.equal([1, 2])
    expect(dropRight([1, 2, 3], 2)).to.deep.equal([1])
    expect(dropRight([1, 2, 3], 3)).to.deep.equal([])
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
    expect(
      filter(null, (item) => {
        return item % 2 === 1
      })
    ).to.deep.equal([])
  })

  it("exports a reject utility", () => {
    expect(
      reject([], (item) => {
        return true
      })
    ).to.deep.equal([])
    expect(
      reject([1, 2, 3], (item) => {
        return false
      })
    ).to.deep.equal([1, 2, 3])
    expect(
      reject([1, 2, 3], (item) => {
        return true
      })
    ).to.deep.equal([])
    expect(
      reject([1, 2, 3], (item) => {
        return item % 2 === 0
      })
    ).to.deep.equal([1, 3])
    expect(
      reject([1, 2, 3], (item) => {
        return item % 2 === 1
      })
    ).to.deep.equal([2])
    expect(
      reject(null, (item) => {
        return item % 2 === 1
      })
    ).to.deep.equal([])
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
    expect(contains([], 2)).to.be.false
    expect(contains([0], 0)).to.be.true
  })

  it("exports a cloneArr utility", () => {
    expect(cloneArr([1, 2, 3])).to.deep.equal([1, 2, 3])
    expect(cloneArr([])).to.deep.equal([])
    const arr = []
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
        []
      )
    ).to.deep.equal([2, 4, 6])

    expect(
      reduce(
        { one: 1, two: 2, three: 3 },
        (result, item) => {
          return result.concat([item * 2])
        },
        []
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
    const add = function (x, y) {
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

  it("exports an difference utility", () => {
    expect(difference([1, 2, 3], [2])).to.deep.equal([1, 3])
    expect(difference([1, 2, 3], [1, 3])).to.deep.equal([2])
    expect(difference([1, 2, 3], [])).to.deep.equal([1, 2, 3])
    expect(difference([], [1, 2])).to.deep.equal([])
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

  it("exports a mapValues utility", () => {
    expect(
      mapValues({ key1: 1, key2: 2 }, (val: number) => val * 2)
    ).to.deep.equal([2, 4])
  })
})
