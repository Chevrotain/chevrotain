import {HashTable} from "../../src/lang/lang_extensions"

describe("The HashTable implementation", function () {

    it("will return undefined for a key that does not exist, and the value for a key that does exist", function () {
        let hashTable = new HashTable<number>();
        hashTable.put("one", 1)
        hashTable.put("two", 2)

        expect(hashTable.get("one")).to.equal(1)
        expect(hashTable.get("two")).to.equal(2)
        expect(hashTable.get("three")).to.equal(undefined)
    })

    it("support property names that are also names of built in properties on javascript Object", function () {
        let hashTable = new HashTable<number>();
        hashTable.put("toString", 1)
        hashTable.put("hasOwnProperty", 2)

        expect(hashTable.get("toString")).to.equal(1)
        expect(hashTable.get("hasOwnProperty")).to.equal(2)
    })
})
