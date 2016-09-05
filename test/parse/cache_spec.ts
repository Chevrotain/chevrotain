import * as cache from "../../src/parse/cache"
import {clearCache} from "../../src/parse/cache_public"

describe("The chevrotain cache", () => {

    it("Can clear the cache", () => {
        cache.CLASS_TO_SELF_ANALYSIS_DONE.put("bisli", true)
        expect(cache.CLASS_TO_SELF_ANALYSIS_DONE.containsKey("bisli")).to.be.true

        clearCache()

        expect(cache.CLASS_TO_SELF_ANALYSIS_DONE.containsKey("bisli")).to.be.false
    })
})
