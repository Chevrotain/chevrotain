import {Parser} from "../../../src/parse/parser_public"

describe("The Recognizer's Configuration", () => {

    it("has a default false value for 'recoveryEnabled' - empty config", () => {

        class EmptyConfigParser extends Parser {
            constructor() {
                super([], [], {})
            }
        }

        let parser = new EmptyConfigParser()
        expect(parser.recoveryEnabled).to.be.false

    })

    it("has a default false value for 'recoveryEnabled' - no config", () => {

        class NoConfigParser extends Parser {
            constructor() {
                super([], [])
            }
        }

        let parser = new NoConfigParser()
        expect(parser.recoveryEnabled).to.be.false
    })

})
