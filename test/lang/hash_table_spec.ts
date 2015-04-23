/// <reference path="../utils/matchers.ts" />
/// <reference path="../../libs/lodash.d.ts" />
/// <reference path="../../libs/jasmine.d.ts" />

module chevrotain.lang.spec {

    describe("The HashTable implementation", function () {

        it("will return undefined for a key that does not exist, and the value for a key that does exist", function () {
            var hashTable = new HashTable<number>();
            hashTable.put("one", 1)
            hashTable.put("two", 2)

            expect(hashTable.get("one")).toBe(1)
            expect(hashTable.get("two")).toBe(2)
            expect(hashTable.get("three")).toBe(undefined)
        })

        it("support property names that are also names of built in properties on javascript Object", function () {
            var hashTable = new HashTable<number>();
            hashTable.put("toString", 1)
            hashTable.put("hasOwnProperty", 2)

            expect(hashTable.get("toString")).toBe(1)
            expect(hashTable.get("hasOwnProperty")).toBe(2)
        })
    })

}
