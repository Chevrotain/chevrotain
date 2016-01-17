import * as cache from "../../src/parse/cache"
import {clearCache} from "../../src/parse/cache_public"
import {HashTable} from "../../src/lang/lang_extensions"

describe("The chevrotain cache", () => {

    it("Can clear the cache", () => {
        cache.CLASS_TO_AT_LEAST_ONE_LA_CACHE.put("bamba", [new HashTable<string>()])
        cache.CLASS_TO_SELF_ANALYSIS_DONE.put("bisli", true)

        expect(cache.CLASS_TO_AT_LEAST_ONE_LA_CACHE.containsKey("bamba")).to.be.true
        expect(cache.CLASS_TO_SELF_ANALYSIS_DONE.containsKey("bisli")).to.be.true

        clearCache()

        expect(cache.CLASS_TO_AT_LEAST_ONE_LA_CACHE.containsKey("bamba")).to.be.false
        expect(cache.CLASS_TO_SELF_ANALYSIS_DONE.containsKey("bisli")).to.be.false
    })
})
