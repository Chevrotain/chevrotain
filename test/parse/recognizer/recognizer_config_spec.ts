import { Parser } from "../../../src/parse/parser_public"

describe("The Recognizer's Configuration", () => {
    it("default config values - empty config", () => {
        class EmptyConfigParser extends Parser {
            constructor() {
                super([], [], {})
            }
        }

        let parser = new EmptyConfigParser()
        expect((<any>parser).recoveryEnabled).to.be.false
        expect((<any>parser).maxLookahead).to.equal(4)
    })

    it("default config values - no config", () => {
        class NoConfigParser extends Parser {
            constructor() {
                super([], [])
            }
        }

        let parser = new NoConfigParser()
        expect((<any>parser).recoveryEnabled).to.be.false
        expect((<any>parser).maxLookahead).to.equal(4)
    })
})
