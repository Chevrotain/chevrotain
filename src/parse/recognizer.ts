// using only root module name ('chevrotain') and not a longer name ('chevrotain.recognizer')
// because the external and internal API must have the same names for d.ts definition files to be valid
// TODO: examine module in module to reduce spam on chevrotain namespace
module chevrotain {

    import cache = chevrotain.cache
    import gast = chevrotain.gast
    import IN = chevrotain.constants.IN
    import interp = chevrotain.interpreter
    import lang = chevrotain.lang
    import gastBuilder = chevrotain.gastBuilder
    import follows = chevrotain.follow
    import lookahead = chevrotain.lookahead
    import validations = chevrotain.validations

    // hacks to bypass no support for custom Errors in javascript/typescript
    export function isRecognitionException(error:Error) {
        var recognitionExceptions = [
            lang.functionName(MismatchedTokenException),
            lang.functionName(NoViableAltException),
            lang.functionName(EarlyExitException),
            lang.functionName(NotAllInputParsedException)]
        // can't do instanceof on hacked custom js exceptions
        return _.contains(recognitionExceptions, error.name)
    }

    export function MismatchedTokenException(message:string, token:Token) {
        this.name = lang.functionName(MismatchedTokenException)
        this.message = message
        this.token = token
    }

    // must use the "Error.prototype" instead of "new Error"
    // because the stack trace points to where "new Error" was invoked"
    MismatchedTokenException.prototype = Error.prototype

    export function NoViableAltException(message:string, token:Token) {
        this.name = lang.functionName(NoViableAltException)
        this.message = message
        this.token = token
    }

    NoViableAltException.prototype = Error.prototype

    export function NotAllInputParsedException(message:string, token:Token) {
        this.name = lang.functionName(NotAllInputParsedException)
        this.message = message
        this.token = token
    }

    NotAllInputParsedException.prototype = Error.prototype


    export function EarlyExitException(message:string, token:Token) {
        this.name = lang.functionName(EarlyExitException)
        this.message = message
        this.token = token
    }

    EarlyExitException.prototype = Error.prototype

    export class EOF extends VirtualToken {}
    export var EOF_FOLLOW_KEY:any = {} // TODO const in Typescript 1.5

    /**
     * This is The BaseRecognizer, this should generally not be extended directly, instead
     * the BaseIntrospectionRecognizer should be used as the base class for external users.
     * as it has the full feature set.
     */
    export class BaseRecognizer {

        public errors:Error[] = []
        protected _input:Token[] = []
        protected inputIdx = -1
        protected isBackTrackingStack = []
        // caching for performance
        protected className:string


        constructor(input:Token[] = []) {
            this._input = input
            this.className = lang.classNameFromInstance(this)
        }

        set input(newInput:Token[]) {
            this.reset()
            this._input = newInput
        }

        get input():Token[] {
            return _.clone(this._input)
        }

        protected isBackTracking():boolean {
            return !(_.isEmpty(this.isBackTrackingStack))
        }

        // simple and quick reset of the parser to enable reuse of the same parser instance
        public reset():void {
            this.isBackTrackingStack = []
            this.errors = []
            this._input = []
            this.inputIdx = -1
        }

        public isAtEndOfInput():boolean {
            return this.LA(1) instanceof EOF
        }

        protected SAVE_ERROR(error:Error):Error {
            if (isRecognitionException(error)) {
                this.errors.push(error)
                return error
            }
            else {
                throw Error("trying to save an Error which is not a RecognitionException")
            }
        }

        protected NEXT_TOKEN():Token {
            return this.LA(1)
        }

        // skips a token and returns the next token
        protected SKIP_TOKEN():Token {
            // example: assume 45 tokens in the input, if input index is 44 it means that NEXT_TOKEN will return
            // input[45] which is the 46th item and no longer exists,
            // so in this case the largest valid input index is 43 (input.length - 2 )
            if (this.inputIdx <= this._input.length - 2) {
                this.inputIdx++
                return this.NEXT_TOKEN()
            }
            else {
                return new EOF()
            }
        }

        protected CONSUME(tokClass:Function):Token {
            var nextToken = this.NEXT_TOKEN()
            if (this.NEXT_TOKEN() instanceof tokClass) {
                this.inputIdx++
                return nextToken
            }
            else {
                var expectedTokType = tokenName(tokClass)
                var msg = "Expecting token of type -->" + expectedTokType + "<-- but found -->'" + nextToken.image + "'<--"
                throw this.SAVE_ERROR(new MismatchedTokenException(msg, nextToken))
            }
        }

        protected LA(howMuch:number):Token {
            if (this._input.length <= this.inputIdx + howMuch) {
                return new EOF()
            }
            else {
                return this._input[this.inputIdx + howMuch]
            }
        }

        // need these docs in parser_public.ts for the public d.ts definitions
        /**
         *
         * @param grammarRule the rule to try and parse in backtracking mode
         * @param isValid a predicate that given the result of the parse attempt will "decide" if the parse was successfully or not
         * @return a lookahead function that will try to parse the given grammarRule and will return true if succeed
         */
        protected BACKTRACK<T>(grammarRule:(...args) => T, isValid:(T) => boolean):() => boolean {
            return () => {
                // save org state
                this.isBackTrackingStack.push(1)
                var orgState = this.saveRecogState()
                try {
                    var ruleResult = grammarRule.call(this)
                    return isValid(ruleResult)
                } catch (e) {
                    if (isRecognitionException(e)) {
                        return false
                    }
                    else {
                        throw e
                    }
                }
                finally {
                    this.reloadRecogState(orgState)
                    this.isBackTrackingStack.pop()
                }
            }
        }

        protected saveRecogState():IBaseRecogState {
            var savedErrors = _.clone(this.errors)
            return {errors: savedErrors, inputIdx: this.inputIdx}
        }

        protected reloadRecogState(newState:IBaseRecogState) {
            this.errors = newState.errors
            this.inputIdx = newState.inputIdx
        }

        protected OPTION(condition:LookAheadFunc, action:GrammarAction):boolean {
            if (condition.call(this)) {
                action.call(this)
                return true
            }
            return false
        }

        protected OR<T>(alts:IOrAlt<T>[], errMsgTypes:string):T {
            for (var i = 0; i < alts.length; i++) {
                if (alts[i].WHEN.call(this)) {
                    var res = alts[i].THEN_DO()
                    return res
                }
            }
            this.raiseNoAltException(errMsgTypes)
        }

        protected MANY(lookAheadFunc:LookAheadFunc, action:GrammarAction):void {
            while (lookAheadFunc.call(this)) {
                action.call(this)
            }
        }

        protected AT_LEAST_ONE(lookAheadFunc:LookAheadFunc, action:GrammarAction, errMsg:string):void {
            if (lookAheadFunc.call(this)) {
                action.call(this)
                this.MANY(<any>lookAheadFunc, <any>action)
            }
            else {
                throw this.SAVE_ERROR(new EarlyExitException("expecting at least one: " + errMsg, this.NEXT_TOKEN()))
            }
        }

        protected raiseNoAltException(errMsgTypes:string):void {
            throw this.SAVE_ERROR(new NoViableAltException("expecting: " + errMsgTypes +
                " but found '" + this.NEXT_TOKEN().image + "'", this.NEXT_TOKEN()))
        }
    }

    export function InRuleRecoveryException(message:string) {
        this.name = lang.functionName(InRuleRecoveryException)
        this.message = message
    }

    InRuleRecoveryException.prototype = Error.prototype

    // parameters needs to compute the key in the FOLLOW_SET map.
    export interface IFollowKey {
        ruleName: string
        idxInCallingRule: number
        inRule:string
    }
}
