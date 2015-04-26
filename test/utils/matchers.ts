/// <reference path="../../libs/lodash.d.ts" />
/// <reference path="../../libs/jasmine.d.ts" />

module test.matchers {

    // won't always work for arrays with duplicates...
    export function arrayEqualityNoOrder<T>(actual:T[], expected:T[]):void {
        expect(actual.length).toBe(expected.length)

        var intersection = _.intersection(actual, expected)
        expect(intersection.length === actual.length).toBeTruthy()
    }

}
