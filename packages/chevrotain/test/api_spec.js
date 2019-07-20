const { expect } = require("chai")
const masterApi = require("../chevrotain-master")
const newApi = require("../lib/chevrotain")
const _ = require("lodash")

describe("the new api impel", () => {
    it("is identical to the old API", () => {
        _.forEach(_.keys(masterApi), key => {
            const masterVal = masterApi[key]
            const newVal = newApi[key]

            if (key === "clearCache") {
                // This function is now named vs anonymous so we cannot compare using.toString
                return
            }
            if (_.isFunction(masterVal)) {
                expect(masterVal.toString()).to.eql(newVal.toString())
            } else if (_.endsWith(key, "ErrorProvider")) {
                _.forEach(_.keys(masterVal), key => {
                    const nestedMasterVal = masterVal[key]
                    const nestedNewVal = newVal[key]
                    // All these props are functions
                    expect(nestedMasterVal.toString()).to.deep.eql(
                        nestedNewVal.toString()
                    )
                })
            } else {
                expect(masterVal).to.deep.eql(newVal)
            }
        })
    })
})
