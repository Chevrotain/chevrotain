(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['chevrotain'], factory)
    } else {
        factory(root.chevrotain)
    }
}(this, function(chevrotain) {


    describe('The Json Parser', function() {

        it('can parse a simple Json without errors', function() {
            expect(1 + 2).to.equal(3)
        })

    })
}))