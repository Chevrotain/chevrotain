/// <reference path="../../libs/lodash.d.ts" />
/// <reference path="../../libs/jasmine.d.ts" />

module test.matchers {

    export function containsAll<T>(actual:T[], expected:T[]):boolean {
        var containsAll = true;
        _.forEach(expected, function (elem) {
                // test code, it does not need to be efficent :)
                var containsCurrElem = _.intersection(actual, [elem]).length === 1;
                containsAll = containsAll && containsCurrElem;
            }, this
        );
        return containsAll;
    }

    // won't always work for arrays with duplicates...
    export function arrayEqualityNoOrder<T>(actual:T[], expected:T[]):void {
        expect(actual.length).toBe(expected.length);

        var intersection = _.intersection(actual, expected);
        expect(intersection.length === actual.length).toBeTruthy();
    }

    // Will not work for arrays with internal arrays/objects.
    export function scalarArrayEquality<T>(actual:T[], expected:T[]):void {
        expect(actual.length).toBe(expected.length);

        for (var idx = 0; idx < actual.length; idx++) {
            expect(actual[idx]).toEqual(expected[idx]);
        }
    }
}

