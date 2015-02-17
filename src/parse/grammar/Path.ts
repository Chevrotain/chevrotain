/**
 * extracting the Content Assist Parser api to avoid cyclic dependencies among ts files.
 */
module chevrotain.parse.grammar.path {

    import tok = chevrotain.scan.tokens;

    /**
     * this interfaces defines the path the parser "took" to reach the position
     * in which a content assist is required
     */
    export interface IGrammarPath {
        ruleStack:string[];
        occurrenceStack:number[];
        lastTok:Function;
        lastTokOccurrence:number;
    }

    var invalidContentAssistPath = {ruleStack: [], occurrenceStack: [], lastTok: tok.NoneToken, lastTokOccurrence: -1};

    export function NO_PATH_FOUND():IGrammarPath {
        return invalidContentAssistPath;
    }

    export function ContentAssistPathFoundException(message:string, path:IGrammarPath) {
        this.name = "ContentAssistPathFoundException";
        this.message = message;
        this.path = path;
    }

    // must use the "Error.prototype" instead of "new Error"
    // because the stack trace points to where "new Error" was invoked"
    ContentAssistPathFoundException.prototype = Error.prototype;
}
