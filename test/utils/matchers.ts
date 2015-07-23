
module specs.matchers {

    // won't always work for arrays with duplicates...
    export function arrayEqualityNoOrder<T>(actual:T[], expected:T[]):void {
        expect(actual.length).to.equal(expected.length)

        var intersection = _.intersection(actual, expected)
        expect(intersection.length === actual.length).to.be.true
    }

}
