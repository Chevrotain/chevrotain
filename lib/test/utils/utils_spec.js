"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("../../src/utils/utils");
describe("The Utils functions namespace", function () {
    it("exports a last utility", function () {
        expect(utils_1.last([1, 2, 3])).to.equal(3);
        expect(utils_1.last([])).to.equal(undefined);
        expect(utils_1.last(null)).to.equal(undefined);
    });
    it("exports a forEach utility", function () {
        utils_1.forEach([1, 2, 3], function (item, idx) {
            expect(item).to.equal(idx + 1);
        });
        expect(function () { return utils_1.forEach(null, function (item) { }); }).to.throw("non exhaustive match");
        utils_1.forEach([], function (item) {
            throw Error("call back should not be invoked for empty array");
        });
    });
    it("exports a isString utility", function () {
        expect(utils_1.isString("")).to.be.true;
        expect(utils_1.isString("bamba")).to.be.true;
        expect(utils_1.isString(66)).to.be.false;
        expect(utils_1.isString(null)).to.be.false;
    });
    it("exports a drop utility", function () {
        expect(utils_1.drop([])).to.deep.equal([]);
        expect(utils_1.drop([1, 2, 3])).to.deep.equal([2, 3]);
        expect(utils_1.drop([1, 2, 3], 2)).to.deep.equal([3]);
        expect(utils_1.drop([1, 2, 3], 3)).to.deep.equal([]);
    });
    it("exports a dropRight utility", function () {
        expect(utils_1.dropRight([])).to.deep.equal([]);
        expect(utils_1.dropRight([1, 2, 3])).to.deep.equal([1, 2]);
        expect(utils_1.dropRight([1, 2, 3], 2)).to.deep.equal([1]);
        expect(utils_1.dropRight([1, 2, 3], 3)).to.deep.equal([]);
    });
    it("exports a filter utility", function () {
        expect(utils_1.filter([], function (item) {
            return true;
        })).to.deep.equal([]);
        expect(utils_1.filter([1, 2, 3], function (item) {
            return true;
        })).to.deep.equal([1, 2, 3]);
        expect(utils_1.filter([1, 2, 3], function (item) {
            return false;
        })).to.deep.equal([]);
        expect(utils_1.filter([1, 2, 3], function (item) {
            return item % 2 === 0;
        })).to.deep.equal([2]);
        expect(utils_1.filter([1, 2, 3], function (item) {
            return item % 2 === 1;
        })).to.deep.equal([1, 3]);
        expect(utils_1.filter(null, function (item) {
            return item % 2 === 1;
        })).to.deep.equal([]);
    });
    it("exports a reject utility", function () {
        expect(utils_1.reject([], function (item) {
            return true;
        })).to.deep.equal([]);
        expect(utils_1.reject([1, 2, 3], function (item) {
            return false;
        })).to.deep.equal([1, 2, 3]);
        expect(utils_1.reject([1, 2, 3], function (item) {
            return true;
        })).to.deep.equal([]);
        expect(utils_1.reject([1, 2, 3], function (item) {
            return item % 2 === 0;
        })).to.deep.equal([1, 3]);
        expect(utils_1.reject([1, 2, 3], function (item) {
            return item % 2 === 1;
        })).to.deep.equal([2]);
        expect(utils_1.reject(null, function (item) {
            return item % 2 === 1;
        })).to.deep.equal([]);
    });
    it("exports a has utility", function () {
        expect(utils_1.has([1, 2, 3], "0")).to.be.true;
        expect(utils_1.has([1, 2, 3], "5")).to.be.false;
        expect(utils_1.has({}, "bamba")).to.be.false;
        expect(utils_1.has({ bamba: 666 }, "bamba")).to.be.true;
    });
    it("exports a contains utility", function () {
        expect(utils_1.contains([1, 2, 3], 4)).to.be.false;
        expect(utils_1.contains([1, 2, 3], 2)).to.be.true;
        expect(utils_1.contains([], 2)).to.be.false;
        expect(utils_1.contains([0], 0)).to.be.true;
    });
    it("exports a cloneArr utility", function () {
        expect(utils_1.cloneArr([1, 2, 3])).to.deep.equal([1, 2, 3]);
        expect(utils_1.cloneArr([])).to.deep.equal([]);
        var arr = [];
        expect(utils_1.cloneArr(arr)).to.not.equal(arr);
    });
    it("exports a cloneObj utility", function () {
        expect(utils_1.cloneObj({ bamba: 666, bisli: 777 })).to.deep.equal({
            bamba: 666,
            bisli: 777
        });
        var obj = { bamba: 666, bisli: 777 };
        expect(utils_1.cloneObj(obj)).to.not.equal(obj);
        expect(utils_1.cloneObj(["bamba"])).to.not.have.property("length");
        expect(utils_1.cloneObj(["bamba"])).to.deep.equal({ "0": "bamba" });
    });
    it("exports a find utility", function () {
        expect(utils_1.find([1, 2, 3], function (item) { return item === 2; })).to.equal(2);
        expect(utils_1.find([], function (item) { return item === 2; })).to.be.undefined;
        var a = {};
        var b = {};
        expect(utils_1.find([a, b], function (item) { return item === b; })).to.equal(b);
    });
    it("exports a reduce utility", function () {
        expect(utils_1.reduce([1, 2, 3], function (result, item) {
            return result.concat([item * 2]);
        }, [])).to.deep.equal([2, 4, 6]);
        expect(utils_1.reduce({ one: 1, two: 2, three: 3 }, function (result, item) {
            return result.concat([item * 2]);
        }, [])).to.deep.equal([2, 4, 6]);
    });
    it("exports a compact utility", function () {
        expect(utils_1.compact([1, 2, null, 3])).to.deep.equal([1, 2, 3]);
        expect(utils_1.compact([1, undefined, 2, 3])).to.deep.equal([1, 2, 3]);
        expect(utils_1.compact([])).to.deep.equal([]);
        expect(utils_1.compact([1, 2, 3])).to.deep.equal([1, 2, 3]);
    });
    it("exports a uniq utility", function () {
        expect(utils_1.uniq([1, 2, 3, 2])).to.contain.members([1, 2, 3]);
        expect(utils_1.uniq([2, 2, 4, 2], function (item) {
            return 666;
        })).to.have.length(1);
        expect(utils_1.uniq([])).to.deep.equal([]);
    });
    it("exports a pick utility", function () {
        expect(utils_1.pick({ bamba: true, bisli: false }, function (item) { return item; })).to.deep.equal({ bamba: true });
        expect(utils_1.pick({}, function (item) { return item; })).to.be.empty;
    });
    it("exports a partial utility", function () {
        var add = function (x, y) {
            return x + y;
        };
        expect(utils_1.partial(add)(2, 3)).to.equal(5);
        expect(utils_1.partial(add, 2)(3)).to.equal(5);
        expect(utils_1.partial(add, 2, 3)()).to.equal(5);
    });
    it("exports an every utility", function () {
        expect(utils_1.every([], function (item) {
            return true;
        })).to.be.true;
        // empty set always true...
        expect(utils_1.every([], function (item) {
            return false;
        })).to.be.true;
        expect(utils_1.every([1, 2, 3], function (item) {
            return item % 2 === 0;
        })).to.be.false;
        expect(utils_1.every([2, 4, 6], function (item) {
            return item % 2 === 0;
        })).to.be.true;
    });
    it("exports an difference utility", function () {
        expect(utils_1.difference([1, 2, 3], [2])).to.deep.equal([1, 3]);
        expect(utils_1.difference([1, 2, 3], [1, 3])).to.deep.equal([2]);
        expect(utils_1.difference([1, 2, 3], [])).to.deep.equal([1, 2, 3]);
        expect(utils_1.difference([], [1, 2])).to.deep.equal([]);
    });
    it("exports an some utility", function () {
        expect(utils_1.some([], function (item) {
            return true;
        })).to.be.false;
        expect(utils_1.some([], function (item) {
            return false;
        })).to.be.false;
        expect(utils_1.some([1, 2, 3], function (item) {
            return item % 2 === 0;
        })).to.be.true;
        expect(utils_1.some([1, 3, 5], function (item) {
            return item % 2 === 0;
        })).to.be.false;
    });
    it("exports an indexOf utility", function () {
        expect(utils_1.indexOf([1, 2, 3], 2)).to.equal(1);
        expect(utils_1.indexOf([1, 2, 3], 3)).to.equal(2);
        expect(utils_1.indexOf([1, 2, 3], 0)).to.equal(-1);
        expect(utils_1.indexOf([], -2)).to.equal(-1);
    });
    it("exports a sortBy utility", function () {
        expect(utils_1.sortBy([1, 2, 3], function (num) { return num; })).to.deep.equal([1, 2, 3]);
        expect(utils_1.sortBy([3, 2, 1], function (num) { return num; })).to.deep.equal([1, 2, 3]);
    });
    it("exports a zipObject utility", function () {
        expect(utils_1.zipObject(["ima", "aba", "bamba"], [1, 2, 3])).to.deep.equal({
            ima: 1,
            aba: 2,
            bamba: 3
        });
        expect(function () { return utils_1.zipObject(["ima", "aba"], [1, 2, 3]); }).to.throw("can't zipObject");
        expect(utils_1.zipObject([], [])).to.deep.equal({});
    });
    it("exports an assign utility", function () {
        expect(utils_1.assign(["ima", "aba", "bamba"], [1, 2, 3])).to.deep.equal([
            1,
            2,
            3
        ]);
        expect(utils_1.assign({}, { ima: 666 }, { aba: 333 })).to.deep.equal({
            ima: 666,
            aba: 333
        });
        expect(utils_1.assign({}, { ima: 666 }, { aba: 333 }, { ima: 999 })).to.deep.equal({ ima: 999, aba: 333 });
    });
    it("exports a groupBy utility", function () {
        expect(utils_1.groupBy([1, 2, 3, 4], function (num) { return "" + (num % 2); })).to.deep.equal({
            0: [2, 4],
            1: [1, 3]
        });
        expect(utils_1.groupBy([1, 2, 3, 4], function (num) { return "" + num; })).to.deep.equal({
            1: [1],
            2: [2],
            3: [3],
            4: [4]
        });
    });
    it("exports a groupBy utility", function () {
        expect(utils_1.groupBy([1, 2, 3, 4], function (num) { return "" + (num % 2); })).to.deep.equal({
            0: [2, 4],
            1: [1, 3]
        });
        expect(utils_1.groupBy([1, 2, 3, 4], function (num) { return "" + num; })).to.deep.equal({
            1: [1],
            2: [2],
            3: [3],
            4: [4]
        });
    });
    it("exports a mapValues utility", function () {
        expect(utils_1.mapValues({ key1: 1, key2: 2 }, function (val) { return val * 2; })).to.deep.equal([2, 4]);
    });
});
//# sourceMappingURL=utils_spec.js.map