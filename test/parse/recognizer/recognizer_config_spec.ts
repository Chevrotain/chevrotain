import { Parser } from "../../../src/parse/parser_public"
import { createToken } from "../../../src/scan/tokens_public"

describe("The Recognizer's Configuration", () => {
    it("default config values - empty config", () => {
        const A = createToken({ name: "A" })

        class EmptyConfigParser extends Parser {
            constructor() {
                super([A], {})
            }
        }

        let parser = new EmptyConfigParser()
        expect((<any>parser).recoveryEnabled).to.be.false
        expect((<any>parser).maxLookahead).to.equal(4)
    })

    it("default config values - no config", () => {
        const A = createToken({ name: "A" })

        class NoConfigParser extends Parser {
            constructor() {
                super([A])
            }
        }

        let parser = new NoConfigParser()
        expect((<any>parser).recoveryEnabled).to.be.false
        expect((<any>parser).maxLookahead).to.equal(4)
    })
})
