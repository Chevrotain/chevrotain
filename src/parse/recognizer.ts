/// <reference path="../lang/lang_extensions.ts" />
/// <reference path="cache.ts" />
/// <reference path="../scan/tokens.ts" />
/// <reference path="grammar/gast.ts" />
/// <reference path="gast_builder.ts" />
/// <reference path="constants.ts" />
/// <reference path="grammar/interpreter.ts" />
/// <reference path="grammar/follow.ts" />
/// <reference path="grammar/lookahead.ts" />


/// <reference path="../../libs/lodash.d.ts" />
module chevrotain.recognizer {

    import cache = chevrotain.cache
    import tok = chevrotain.tokens
    import gast = chevrotain.gast
    import IN = chevrotain.constants.IN
    import interp = chevrotain.interpreter
    import lang = chevrotain.lang
    import gastBuilder = chevrotain.gastBuilder
    import follows = chevrotain.follow
    import lookahead = chevrotain.lookahead

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

    export function MismatchedTokenException(message:string, token:tok.Token) {
        this.name = lang.functionName(MismatchedTokenException)
        this.message = message
        this.token = token
    }

    // must use the "Error.prototype" instead of "new Error"
    // because the stack trace points to where "new Error" was invoked"
    MismatchedTokenException.prototype = Error.prototype

    export function NoViableAltException(message:string, token:tok.Token) {
        this.name = lang.functionName(NoViableAltException)
        this.message = message
        this.token = token
    }

    NoViableAltException.prototype = Error.prototype

    export function NotAllInputParsedException(message:string, token:tok.Token) {
        this.name = lang.functionName(NotAllInputParsedException)
        this.message = message
        this.token = token
    }

    NotAllInputParsedException.prototype = Error.prototype


    export function EarlyExitException(message:string, token:tok.Token) {
        this.name = lang.functionName(EarlyExitException)
        this.message = message
        this.token = token
    }

    EarlyExitException.prototype = Error.prototype

    export class EOF extends tok.VirtualToken {}

    /**
     * OR([
     *  { WHEN:LA1, THEN_DO:XXX },
     *  { WHEN:LA2, THEN_DO:YYY },
     *  { WHEN:LA3, THEN_DO:ZZZ },
     * ])
     */
    export interface IOrAlt<T> {
        WHEN:() => boolean
        // TODO: change THEN_DO property to ALT (may need to modify gast builder)
        THEN_DO:() => T
    }

    /**
     * OR([
     *  {ALT:XXX },
     *  {ALT:YYY },
     *  {ALT:ZZZ }
     * ])
     */
    export interface IOrAltImplicit<T> {
        ALT:() => T
    }

    export interface IBaseRecogState {
        errors: Error[]
        inputIdx:number
    }

    export interface IErrorRecoveryRecogState extends IBaseRecogState {
        RULE_STACK:string[]
        FOLLOW_STACK:Function[][]
    }

    export type LookAheadFunc = () => boolean
    export type GrammarAction = () => void

    // TODO: TSC 1.5 switch to const
    // used to toggle ignoring of OR production ambiguities
    export var IGNORE_AMBIGUITIES:boolean = true
    export var NO_RESYNC:boolean = false

    /**
     * This is The BaseRecognizer, this should generally not be extended directly, instead
     * the BaseIntrospectionRecognizer should be used as the base class for external users.
     * as it has the full feature set.
     */
    export class BaseRecognizer {

        public errors:Error[] = []
        protected _input:tok.Token[] = []
        protected inputIdx = -1
        protected isBackTrackingStack = []

        constructor(input:tok.Token[] = []) {
            this._input = input
        }

        set input(newInput:tok.Token[]) {
            this.reset()
            this._input = newInput
        }

        get input():tok.Token[] {
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

        protected NEXT_TOKEN():tok.Token {
            return this.LA(1)
        }

        // skips a token and returns the next token
        protected SKIP_TOKEN():tok.Token {
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

        protected CONSUME(tokClass:Function):tok.Token {
            var nextToken = this.NEXT_TOKEN()
            if (this.NEXT_TOKEN() instanceof tokClass) {
                this.inputIdx++
                return nextToken
            }
            else {
                var expectedTokType = tok.getTokName(tokClass)
                var msg = "Expecting token of type -->" + expectedTokType + "<-- but found -->'" + nextToken.image + "'<--"
                throw this.SAVE_ERROR(new MismatchedTokenException(msg, nextToken))
            }
        }

        protected LA(howMuch:number):tok.Token {
            if (this._input.length <= this.inputIdx + howMuch) {
                return new EOF()
            }
            else {
                return this._input[this.inputIdx + howMuch]
            }
        }


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

    /**
     * A Recognizer capable of self analysis to determine it's grammar structure
     * This is used for more advanced features requiring this information.
     * for example: Error Recovery, Automatic lookahead calculation
     */
    export class BaseIntrospectionRecognizer extends BaseRecognizer {

        protected static performSelfAnalysis(classInstance:any) {
            var className = lang.classNameFromInstance(classInstance)
            // this information only needs to be computed once
            if (!cache.CLASS_TO_SELF_ANALYSIS_DONE.containsKey(className)) {
                var grammarProductions = cache.getProductionsForClass(classInstance)
                var refResolver = new gastBuilder.GastRefResolverVisitor(grammarProductions)
                refResolver.resolveRefs()
                var allFollows = follows.computeAllProdsFollows(grammarProductions.values())
                cache.setResyncFollowsForClass(classInstance, allFollows)
                cache.CLASS_TO_SELF_ANALYSIS_DONE.put(className, true)
            }
        }

        protected RULE_STACK:string[] = []
        protected RULE_OCCURRENCE_STACK:number[] = []
        protected FOLLOW_STACK:Function[][] = []
        protected tokensMap:gastBuilder.ITerminalNameToConstructor = undefined

        constructor(input:tok.Token[], tokensMap:gastBuilder.ITerminalNameToConstructor) {
            super(input)
            this.tokensMap = _.clone(tokensMap)
            // always add EOF to the tokenNames -> constructors map. it is useful to assure all the input has been
            // parsed with a clear error message ("expecting EOF but found ...")
            this.tokensMap[lang.functionName(EOF)] = EOF
        }

        public reset():void {
            super.reset()
            this.RULE_STACK = []
            this.RULE_OCCURRENCE_STACK = []
            this.FOLLOW_STACK = []
        }

        // Parsing DSL

        /**
         * Convenience method equivalent to CONSUME1
         * @see CONSUME1
         */
        protected CONSUME(tokClass:Function):tok.Token {
            return this.CONSUME1(tokClass)
        }

        /**
         *
         * A Parsing DSL method use to consume a single terminal Token.
         * a Token will be consumed, IFF the next token in the token vector is an instanceof tokClass.
         * otherwise the parser will attempt to perform error recovery.
         *
         * The index in the method name indicates the unique occurrence of a terminal consumption
         * inside a the top level rule. What this means is that if a terminal appears
         * more than once in a single rule, each appearance must have a difference index.
         *
         * for example:
         *
         * function parseQualifiedName() {
         *    this.CONSUME1(Identifier);
         *    this.MANY(()=> {
         *       this.CONSUME1(Dot);
         *       this.CONSUME2(Identifier); // <-- here we use CONSUME2 because the terminal
         *    });                           //     'Identifier' has already appeared previously in the
         *                                  //     the rule 'parseQualifiedName'
         * }
         *
         * @param {Function} tokClass A constructor function specifying the type of token
         *        to be consumed.
         *
         * @returns {chevrotain.tokens.Token} The consumed token.
         */
        protected CONSUME1(tokClass:Function):tok.Token {
            return this.consumeInternal(tokClass, 1)
        }

        /**
         * @see CONSUME1
         */
        protected CONSUME2(tokClass:Function):tok.Token {
            return this.consumeInternal(tokClass, 2)
        }

        /**
         * @see CONSUME1
         */
        protected CONSUME3(tokClass:Function):tok.Token {
            return this.consumeInternal(tokClass, 3)
        }

        /**
         * @see CONSUME1
         */
        protected CONSUME4(tokClass:Function):tok.Token {
            return this.consumeInternal(tokClass, 4)
        }

        /**
         * @see CONSUME1
         */
        protected CONSUME5(tokClass:Function):tok.Token {
            return this.consumeInternal(tokClass, 5)
        }

        /**
         * Convenience method equivalent to SUBRULE1
         * @see SUBRULE1
         */
        protected SUBRULE<T>(ruleToCall:(number) => T, args:any[] = []):T {
            return this.SUBRULE1(ruleToCall, args)
        }

        /**
         * The Parsing DSL Method is used by one rule to call another.
         *
         * This may seem redundant as it does not actually do much.
         * However using it is mandatory for all sub rule invocations.
         * calling another rule without wrapping in SUBRULE(...)
         * will cause errors/mistakes in the Recognizer's self analysis
         * which will lead to errors in error recovery/automatic lookahead calcualtion
         * and any other functionality relying on the Recognizer's self analysis
         * output.
         *
         * As in CONSUME the index in the method name indicates the occurrence
         * of the sub rule invocation in its rule.
         *
         * @param {Function} ruleToCall the rule to invoke
         * @param {*[]} args the arguments to pass to the invoked subrule
         * @returns {*} the result of invoking ruleToCall
         */
        protected SUBRULE1<T>(ruleToCall:(number) => T, args:any[] = []):T {
            return ruleToCall.call(this, 1, args)
        }

        /**
         * @see SUBRULE1
         */
        protected SUBRULE2<T>(ruleToCall:(number) => T, args:any[] = []):T {
            return ruleToCall.call(this, 2, args)
        }

        /**
         * @see SUBRULE1
         */
        protected SUBRULE3<T>(ruleToCall:(number) => T, args:any[] = []):T {
            return ruleToCall.call(this, 3, args)
        }

        /**
         * @see SUBRULE1
         */
        protected SUBRULE4<T>(ruleToCall:(number) => T, args:any[] = []):T {
            return ruleToCall.call(this, 4, args)
        }

        /**
         * @see SUBRULE1
         */
        protected SUBRULE5<T>(ruleToCall:(number) => T, args:any[] = []):T {
            return ruleToCall.call(this, 5, args)
        }

        /**
         * Convenience method equivalent to OPTION1
         * @see OPTION1
         */
        protected OPTION(laFuncOrAction:LookAheadFunc | GrammarAction,
                         action?:GrammarAction):boolean {
            return this.OPTION1.apply(this, arguments)
        }

        /**
         * Parsing DSL Method that Indicates an Optional production
         * in EBNF notation: [...]
         *
         * note that the 'action' param is optional. so both of the following forms are valid:
         *
         * short: this.OPTION(()=>{ this.CONSUME(Digit});
         * long: this.OPTION(isDigit, ()=>{ this.CONSUME(Digit});
         *
         * using the short form is recommended as it will compute the lookahead function
         * automatically. however this currently has one limitation:
         * It only works if the lookahead for the grammar is one.
         *
         * As in CONSUME the index in the method name indicates the occurrence
         * of the optional production in it's top rule.
         *
         * @param {Function} laFuncOrAction The lookahead function that 'decides'
         *                                  whether or not the OPTION's action will be
         *                                  invoked or the action to optionally invoke
         * @param {Function} [action] The action to optionally invoke.
         *
         * @returns {boolean} true iff the OPTION's action has been invoked
         */
        protected OPTION1(laFuncOrAction:LookAheadFunc | GrammarAction,
                          action?:GrammarAction):boolean {
            if (arguments.length === 1) {
                action = <any>laFuncOrAction
                laFuncOrAction = this.getLookaheadFuncForOption(1)
            }
            return super.OPTION(<any>laFuncOrAction, <any>action)
        }

        /**
         * @see OPTION1
         */
        protected OPTION2(laFuncOrAction:LookAheadFunc | GrammarAction,
                          action?:GrammarAction):boolean {
            if (arguments.length === 1) {
                action = <any>laFuncOrAction
                laFuncOrAction = this.getLookaheadFuncForOption(2)
            }
            return super.OPTION(<any>laFuncOrAction, <any>action)
        }

        /**
         * @see OPTION1
         */
        protected OPTION3(laFuncOrAction:LookAheadFunc | GrammarAction,
                          action?:GrammarAction):boolean {
            if (arguments.length === 1) {
                action = <any>laFuncOrAction
                laFuncOrAction = this.getLookaheadFuncForOption(3)
            }
            return super.OPTION(<any>laFuncOrAction, <any>action)
        }

        /**
         * @see OPTION1
         */
        protected OPTION4(laFuncOrAction:LookAheadFunc | GrammarAction,
                          action?:GrammarAction):boolean {
            if (arguments.length === 1) {
                action = <any>laFuncOrAction
                laFuncOrAction = this.getLookaheadFuncForOption(4)
            }
            return super.OPTION(<any>laFuncOrAction, <any>action)
        }

        /**
         * @see OPTION1
         */
        protected OPTION5(laFuncOrAction:LookAheadFunc | GrammarAction,
                          action?:GrammarAction):boolean {
            if (arguments.length === 1) {
                action = <any>laFuncOrAction
                laFuncOrAction = this.getLookaheadFuncForOption(5)
            }
            return super.OPTION(<any>laFuncOrAction, <any>action)
        }


        /**
         * Convenience method equivalent to OR1
         * @see OR1
         */
        protected OR<T>(alts:IOrAlt<T>[] | IOrAltImplicit<T>[], errMsgTypes:string, ignoreAmbiguities:boolean = false):T {
            return this.OR1(alts, errMsgTypes, ignoreAmbiguities)
        }

        /**
         * Parsing DSL method that indicates a choice between a set of alternatives must be made.
         * This is equivalent to EBNF alternation (A | B | C | D ...)
         *
         * There are two forms:
         *
         * short: this.OR([
         *           {ALT:()=>{this.CONSUME(One)}},
         *           {ALT:()=>{this.CONSUME(Two)}},
         *           {ALT:()=>{this.CONSUME(Three)}},
         *        ], "a number")
         *
         * long: this.OR([
         *           {WHEN: isOne, THEN_DO:()=>{this.CONSUME(One)}},
         *           {WHEN: isTwo, THEN_DO:()=>{this.CONSUME(Two)}},
         *           {WHEN: isThree, THEN_DO:()=>{this.CONSUME(Three)}},
         *        ], "a number")
         *
         * using the short form is recommended as it will compute the lookahead function
         * automatically. however this currently has one limitation:
         * It only works if the lookahead for the grammar is one.
         *
         * As in CONSUME the index in the method name indicates the occurrence
         * of the alternation production in it's top rule.
         *
         * @param {{ALT:Function}[] | {WHEN:Function, THEN_DO:Function}[]} alts An array of alternatives
         * @param {string} errMsgTypes A description for the alternatives used in error messages
         * @returns {*} The result of invoking the chosen alternative
         * @param {boolean} [ignoreAmbiguities] if true this will ignore ambiguities caused when two alternatives can not
         *                                      be distinguished by a lookahead of one. enabling this means the first alternative
         *                                      that matches will be taken. This is sometimes the grammar's intent.
         *                                      * only enable this if you know what you are doing!
         */
        protected OR1<T>(alts:IOrAlt<T>[] | IOrAltImplicit<T>[], errMsgTypes:string, ignoreAmbiguities:boolean = false):T {
            return this.orInternal(alts, errMsgTypes, 1, ignoreAmbiguities)
        }

        /**
         * @see OR1
         */
        protected OR2<T>(alts:IOrAlt<T>[] | IOrAltImplicit<T>[], errMsgTypes:string, ignoreAmbiguities:boolean = false):T {
            return this.orInternal(alts, errMsgTypes, 2, ignoreAmbiguities)
        }

        /**
         * @see OR1
         */
        protected OR3<T>(alts:IOrAlt<T>[] | IOrAltImplicit<T>[], errMsgTypes:string, ignoreAmbiguities:boolean = false):T {
            return this.orInternal(alts, errMsgTypes, 3, ignoreAmbiguities)
        }

        /**
         * @see OR1
         */
        protected OR4<T>(alts:IOrAlt<T>[] | IOrAltImplicit<T>[], errMsgTypes:string, ignoreAmbiguities:boolean = false):T {
            return this.orInternal(alts, errMsgTypes, 4, ignoreAmbiguities)
        }

        /**
         * @see OR1
         */
        protected OR5<T>(alts:IOrAlt<T>[] | IOrAltImplicit<T>[], errMsgTypes:string, ignoreAmbiguities:boolean = false):T {
            return this.orInternal(alts, errMsgTypes, 5, ignoreAmbiguities)
        }

        /**
         * Convenience method equivalent to MANY1
         * @see MANY1
         */
        protected MANY(lookAheadFunc:LookAheadFunc | GrammarAction,
                       action?:GrammarAction):void {
            return this.MANY1.apply(this, arguments)
        }

        /**
         * Parsing DSL method, that indicates a repetition of zero or more.
         * This is equivalent to EBNF repetition {...}
         *
         * note that the 'action' param is optional. so both of the following forms are valid:
         *
         * short: this.MANY(()=>{
         *                       this.CONSUME(Comma};
         *                       this.CONSUME(Digit});
         * long: this.MANY(isComma, ()=>{
         *                       this.CONSUME(Comma};
         *                       this.CONSUME(Digit});
         *
         * using the short form is recommended as it will compute the lookahead function
         * automatically. however this currently has one limitation:
         * It only works if the lookahead for the grammar is one.
         *
         * As in CONSUME the index in the method name indicates the occurrence
         * of the repetition production in it's top rule.
         *
         * @param {Function} laFuncOrAction The lookahead function that 'decides'
         *                                  whether or not the MANY's action will be
         *                                  invoked or the action to optionally invoke
         * @param {Function} [action] The action to optionally invoke.
         */
        protected MANY1(laFuncOrAction:LookAheadFunc | GrammarAction,
                        action?:GrammarAction):void {
            this.manyInternal(this.MANY1, "MANY1", 1, laFuncOrAction, action)
        }

        /**
         * @see MANY1
         */
        protected MANY2(laFuncOrAction:LookAheadFunc | GrammarAction,
                        action?:GrammarAction):void {
            this.manyInternal(this.MANY2, "MANY2", 2, laFuncOrAction, action)
        }

        /**
         * @see MANY1
         */
        protected MANY3(laFuncOrAction:LookAheadFunc | GrammarAction,
                        action?:GrammarAction):void {
            this.manyInternal(this.MANY3, "MANY3", 3, laFuncOrAction, action)
        }

        /**
         * @see MANY1
         */
        protected MANY4(laFuncOrAction:LookAheadFunc | GrammarAction,
                        action?:GrammarAction):void {
            this.manyInternal(this.MANY4, "MANY4", 4, laFuncOrAction, action)
        }

        /**
         * @see MANY1
         */
        protected MANY5(laFuncOrAction:LookAheadFunc | GrammarAction,
                        action?:GrammarAction):void {
            this.manyInternal(this.MANY5, "MANY5", 5, laFuncOrAction, action)
        }

        /**
         * Convenience method equivalent to AT_LEAST_ONE1
         * @see AT_LEAST_ONE1
         */
        protected AT_LEAST_ONE(laFuncOrAction:LookAheadFunc | GrammarAction,
                               action:GrammarAction | string,
                               errMsg?:string):void {
            return this.AT_LEAST_ONE1.apply(this, arguments)
        }

        /**
         *
         * convenience method, same as MANY but the repetition is of one or more.
         * failing to match at least one repetition will result in a parsing error and
         * cause the parser to attempt error recovery.
         *
         * @see MANY1
         *
         * @param {Function} laFuncOrAction The lookahead function that 'decides'
         *                                  whether or not the AT_LEAST_ONE's action will be
         *                                  invoked or the action to optionally invoke
         * @param {Function} [action] The action to optionally invoke.
         * @param {string} [errMsg] short title/classification to what is being matched
         */
        protected AT_LEAST_ONE1(laFuncOrAction:LookAheadFunc | GrammarAction,
                                action:GrammarAction | string,
                                errMsg?:string):void {
            this.atLeastOneInternal(this.AT_LEAST_ONE1, "AT_LEAST_ONE1", 1, laFuncOrAction, action, errMsg)
        }

        /**
         * @see AT_LEAST_ONE1
         */
        protected AT_LEAST_ONE2(laFuncOrAction:LookAheadFunc | GrammarAction,
                                action:GrammarAction | string,
                                errMsg?:string):void {
            this.atLeastOneInternal(this.AT_LEAST_ONE2, "AT_LEAST_ONE2", 2, laFuncOrAction, action, errMsg)
        }

        /**
         * @see AT_LEAST_ONE1
         */
        protected AT_LEAST_ONE3(laFuncOrAction:LookAheadFunc | GrammarAction,
                                action:GrammarAction | string,
                                errMsg?:string):void {
            this.atLeastOneInternal(this.AT_LEAST_ONE3, "AT_LEAST_ONE1", 3, laFuncOrAction, action, errMsg)
        }

        /**
         * @see AT_LEAST_ONE1
         */
        protected AT_LEAST_ONE4(laFuncOrAction:LookAheadFunc | GrammarAction,
                                action:GrammarAction | string,
                                errMsg?:string):void {
            this.atLeastOneInternal(this.AT_LEAST_ONE4, "AT_LEAST_ONE1", 4, laFuncOrAction, action, errMsg)
        }

        /**
         * @see AT_LEAST_ONE1
         */
        protected AT_LEAST_ONE5(laFuncOrAction:LookAheadFunc | GrammarAction,
                                action:GrammarAction | string,
                                errMsg?:string):void {
            this.atLeastOneInternal(this.AT_LEAST_ONE5, "AT_LEAST_ONE1", 5, laFuncOrAction, action, errMsg)
        }

        /**
         * Convenience method, same as RULE with doReSync=false
         * @see RULE
         */
        protected RULE_NO_RESYNC<T>(ruleName:string,
                                    impl:() => T,
                                    invalidRet:() => T):(idxInCallingRule:number,
                                                         isEntryPoint?:boolean) => T {
            return this.RULE(ruleName, impl, invalidRet, false)
        }

        /**
         *
         * @param {string} ruleName The name of the Rule. must match the var it is assigned to.
         * @param {Function} impl The implementation of the Rule
         * @param {Function} [invalidRet] A function that will return the chosen invalid value for the rule in case of
         *                   re-sync recovery.
         * @param {boolean} [doReSync] enable or disable re-sync recovery for this rule. defaults to true
         * @returns {Function} The parsing rule which is the impl Function wrapped with the parsing logic that handles
         *                     Parser state / error recovery / ...
         */
        protected RULE<T>(ruleName:string,
                          impl:(...implArgs:any[]) => T,
                          invalidRet:() => T = this.defaultInvalidReturn,
                          doReSync = true):(idxInCallingRule?:number, ...args:any[]) => T {
            // TODO: isEntryPoint by default true? SUBRULE explicitly pass false?
            this.validateRuleName(ruleName)
            var parserClassProductions = cache.getProductionsForClass(this)
            // only build the gast representation once
            if (!(parserClassProductions.containsKey(ruleName))) {
                parserClassProductions.put(ruleName, gastBuilder.buildTopProduction(impl.toString(), ruleName, this.tokensMap))
            }

            var wrappedGrammarRule = function (idxInCallingRule:number = 1, args:any[] = []) {
                // state update
                // first rule invocation
                if (_.isEmpty(this.RULE_STACK)) {
                    // the only thing that can appear after the outer most invoked rule is the END OF FILE
                    this.FOLLOW_STACK.push([EOF])
                } else {
                    var followName = ruleName + idxInCallingRule + IN + (<any>_.last)(this.RULE_STACK)
                    // TODO: performance optimization, keep a reference to the follow set on the instance instead of accessing
                    // multiple structures on each rule invocations to find it...
                    var followSet = cache.getResyncFollowsForClass(this).get(followName)
                    if (!followSet) {
                        throw new Error("missing re-sync follows information, possible cause: " +
                            "did not call performSelfAnalysis(this) in the constructor implementation.")
                    }
                    this.FOLLOW_STACK.push(followSet)
                }
                this.RULE_OCCURRENCE_STACK.push(idxInCallingRule)
                this.RULE_STACK.push(ruleName)

                try {
                    // actual parsing happens here
                    return impl.apply(this, args)
                } catch (e) {
                    var isFirstInvokedRule = (this.RULE_STACK.length === 1)
                    // note the reSync is always enabled for the first rule invocation, because we must always be able to
                    // reSync with EOF and just output some INVALID ParseTree
                    // during backtracking reSync recovery is disabled, otherwise we can't be certain the backtracking
                    // path is really the most valid one
                    var reSyncEnabled = (isFirstInvokedRule || doReSync) && !this.isBackTracking()

                    if (reSyncEnabled && isRecognitionException(e)) {
                        var reSyncTokType = this.findReSyncTokenType()
                        if (this.isInCurrentRuleReSyncSet(reSyncTokType)) {
                            this.reSyncTo(reSyncTokType)
                            return invalidRet()
                        }
                        else {
                            // to be handled farther up the call stack
                            throw e
                        }
                    }
                    else {
                        // some other Error type which we don't know how to handle (for example a built in JavaScript Error)
                        throw e
                    }
                }
                finally {
                    this.FOLLOW_STACK.pop()
                    this.RULE_STACK.pop()
                    this.RULE_OCCURRENCE_STACK.pop()

                    var maxInputIdx = this._input.length - 1
                    if ((this.RULE_STACK.length === 0) && this.inputIdx < maxInputIdx) {
                        var firstRedundantTok:tok.Token = this.NEXT_TOKEN()
                        this.SAVE_ERROR(new NotAllInputParsedException(
                            "Redundant input, expecting EOF but found: " + firstRedundantTok.image, firstRedundantTok))
                    }
                }
            }
            var ruleNamePropName = "ruleName"
            wrappedGrammarRule[ruleNamePropName] = ruleName
            return wrappedGrammarRule
        }

        private defaultInvalidReturn():any { return undefined }

        // Not worth the hassle to support Unicode characters in rule names...
        protected ruleNamePattern = /^[a-zA-Z_]\w*$/
        protected definedRulesNames:string[] = []

        /**
         * @param ruleFuncName name of the Grammar rule
         * @throws Grammar validation errors if the name is invalid
         */
        protected validateRuleName(ruleFuncName:string):void {
            if (!ruleFuncName.match(this.ruleNamePattern)) {
                throw Error("Invalid Grammar rule name --> " + ruleFuncName +
                    " it must match the pattern: " + this.ruleNamePattern.toString())
            }

            if ((_.contains(this.definedRulesNames, ruleFuncName))) {
                throw Error("Duplicate definition, rule: " + ruleFuncName +
                    " is already defined in the grammar: " + lang.classNameFromInstance(this))
            }

            this.definedRulesNames.push(ruleFuncName)
        }

        protected tryInRepetitionRecovery(grammarRule:Function,
                                          grammarRuleArgs:any[],
                                          lookAheadFunc:() => boolean,
                                          expectedTokType:Function):void {
            var reSyncTokType = this.findReSyncTokenType()
            var orgInputIdx = this.inputIdx
            var nextTokenWithoutResync = this.NEXT_TOKEN()
            var currToken = this.NEXT_TOKEN()
            while (!(currToken instanceof reSyncTokType)) {
                // we skipped enough tokens so we can resync right back into another iteration of the repetition grammar rule
                if (lookAheadFunc.call(this)) {
                    // we are preemptively re-syncing before an error has been detected, therefor we must reproduce
                    // the error that would have been thrown
                    var expectedTokName = tok.getTokName(expectedTokType)
                    var msg = "Expecting token of type -->" + expectedTokName +
                        "<-- but found -->'" + nextTokenWithoutResync.image + "'<--"
                    this.SAVE_ERROR(new MismatchedTokenException(msg, nextTokenWithoutResync))

                    // recursive invocation in other to support multiple re-syncs in the same top level repetition grammar rule
                    grammarRule.apply(this, grammarRuleArgs)
                    return // must return here to avoid reverting the inputIdx
                }
                currToken = this.SKIP_TOKEN()
            }

            // we were unable to find a CLOSER point to resync inside the MANY, reset the state and
            // rethrow the exception for farther recovery attempts into rules deeper in the rules stack
            this.inputIdx = orgInputIdx
        }

        protected shouldInRepetitionRecoveryBeTried(expectTokAfterLastMatch?:Function, nextTokIdx?:number):boolean {
            // arguments to try and perform resync into the next iteration of the many are missing
            if (_.isUndefined(expectTokAfterLastMatch) || _.isUndefined(nextTokIdx)) {
                return false
            }

            // no need to recover, next token is what we expect...
            if (this.NEXT_TOKEN() instanceof expectTokAfterLastMatch) {
                return false
            }

            // error recovery is disabled during backtracking as it can make the parser ignore a valid grammar path
            // and prefer some backtracking path that includes recovered errors.
            if (this.isBackTracking()) {
                return false
            }

            // if we can perform inRule recovery (single token insertion or deletion) we always prefer that recovery algorithm
            // because if it works, it makes the least amount of changes to the input stream (greedy algorithm)
            //noinspection RedundantIfStatementJS
            if (this.canPerformInRuleRecovery(expectTokAfterLastMatch,
                    this.getFollowsForInRuleRecovery(expectTokAfterLastMatch, nextTokIdx))) {
                return false
            }

            return true
        }

        // Error Recovery functionality
        protected getFollowsForInRuleRecovery(tokClass:Function, tokIdxInRule):Function[] {
            var pathRuleStack:string[] = _.clone(this.RULE_STACK)
            var pathOccurrenceStack:number[] = _.clone(this.RULE_OCCURRENCE_STACK)
            var grammarPath:any = {
                ruleStack:         pathRuleStack,
                occurrenceStack:   pathOccurrenceStack,
                lastTok:           tokClass,
                lastTokOccurrence: tokIdxInRule
            }

            var topRuleName = _.first(pathRuleStack)
            var gastProductions = this.getGAstProductions()
            var topProduction = gastProductions.get(topRuleName)
            var follows = new interp.NextAfterTokenWalker(topProduction, grammarPath).startWalking()
            return follows
        }

        /*
         * Returns an "imaginary" Token to insert when Single Token Insertion is done
         * Override this if you require special behavior in your grammar
         * for example if an IntegerToken is required provide one with the image '0' so it would be valid syntactically
         */
        protected getTokenToInsert(tokClass:Function):tok.Token {
            return new (<any>tokClass)(-1, -1)
        }

        /*
         * By default all tokens type may be inserted. This behavior may be overridden in inheriting Recognizers
         * for example: One may decide that only punctuation tokens may be inserted automatically as they have no additional
         * semantic value. (A mandatory semicolon has no additional semantic meaning, but an Integer may have additional meaning
         * depending on its int value and context (Inserting an integer 0 in cardinality: "[1..]" will cause semantic issues
         * as the max of the cardinality will be greater than the min value. (and this is a false error!)
         */
        protected canTokenTypeBeInsertedInRecovery(tokClass:Function) {
            return true
        }

        protected tryInRuleRecovery(expectedTokType:Function, follows:Function[]):tok.Token {
            if (this.canRecoverWithSingleTokenInsertion(expectedTokType, follows)) {
                var tokToInsert = this.getTokenToInsert(expectedTokType)
                tokToInsert.isInsertedInRecovery = true
                return tokToInsert

            }

            if (this.canRecoverWithSingleTokenDeletion(expectedTokType)) {
                var nextTok = this.SKIP_TOKEN()
                this.inputIdx++
                return nextTok
            }

            throw new InRuleRecoveryException("sad sad panda")
        }

        protected canPerformInRuleRecovery(expectedToken:Function, follows:Function[]):boolean {
            return this.canRecoverWithSingleTokenInsertion(expectedToken, follows) ||
                this.canRecoverWithSingleTokenDeletion(expectedToken)
        }

        protected canRecoverWithSingleTokenInsertion(expectedTokType:Function, follows:Function[]):boolean {
            if (!this.canTokenTypeBeInsertedInRecovery(expectedTokType)) {
                return false
            }

            // must know the possible following tokens to perform single token insertion
            if (_.isEmpty(follows)) {
                return false
            }

            var mismatchedTok = this.NEXT_TOKEN()
            var isMisMatchedTokInFollows = _.find(follows, (possibleFollowsTokType:Function) => {
                    return mismatchedTok instanceof possibleFollowsTokType
                }) !== undefined

            return isMisMatchedTokInFollows
        }

        protected canRecoverWithSingleTokenDeletion(expectedTokType:Function):boolean {
            var isNextTokenWhatIsExpected = this.LA(2) instanceof expectedTokType
            return isNextTokenWhatIsExpected
        }

        protected isInCurrentRuleReSyncSet(token:Function):boolean {
            var currentRuleReSyncSet = _.last(this.FOLLOW_STACK)
            return _.contains(currentRuleReSyncSet, token)
        }

        protected findReSyncTokenType():Function {
            var allPossibleReSyncTokTypes = _.flatten(this.FOLLOW_STACK)
            // this loop will always terminate as EOF is always in the follow stack and also always (virtually) in the input
            var nextToken = this.NEXT_TOKEN()
            var k = 2
            while (true) {
                var nextTokenType:any = (<any>nextToken).constructor
                if (_.contains(allPossibleReSyncTokTypes, nextTokenType)) {
                    return nextTokenType
                }
                nextToken = this.LA(k)
                k++
            }
        }

        protected reSyncTo(tokClass:Function):void {
            var nextTok = this.NEXT_TOKEN()
            while ((nextTok instanceof tokClass) === false) {
                nextTok = this.SKIP_TOKEN()
            }
        }

        private attemptInRepetitionRecovery(prodFunc:Function,
                                            args:any[],
                                            lookaheadFunc:() => boolean,
                                            prodName:string,
                                            prodOccurrence:number,
                                            nextToksWalker:typeof interp.AbstractNextTerminalAfterProductionWalker) {


            var firstAfterRepMap = cache.getFirstAfterRepForClass(this)
            var currRuleName = _.last(this.RULE_STACK)
            var key = prodName + IN + currRuleName
            var firstAfterRepInfo = firstAfterRepMap.get(key)
            if (_.isUndefined(firstAfterRepInfo)) {
                var ruleGrammar = this.getGAstProductions().get(currRuleName)
                var walker:interp.AbstractNextTerminalAfterProductionWalker = new nextToksWalker(ruleGrammar, prodOccurrence)
                firstAfterRepInfo = walker.startWalking()
                firstAfterRepMap.put(key, firstAfterRepInfo)
            }

            var expectTokAfterLastMatch = firstAfterRepInfo.token
            var nextTokIdx = firstAfterRepInfo.occurrence
            var isEndOfRule = firstAfterRepInfo.isEndOfRule

            // special edge case of a TOP most repetition after which the input should END.
            // this will force an attempt for inRule recovery in that scenario.
            if (this.RULE_STACK.length === 1 &&
                isEndOfRule &&
                _.isUndefined(expectTokAfterLastMatch)) {
                expectTokAfterLastMatch = EOF
                nextTokIdx = 1
            }

            if (this.shouldInRepetitionRecoveryBeTried(expectTokAfterLastMatch, nextTokIdx)) {
                // TODO: performance optimization: instead of passing the original args here, we modify
                // the args param (or create a new one) and make sure the lookahead func is explicitly provided
                // to avoid searching the cache for it once more.
                this.tryInRepetitionRecovery(prodFunc, args, lookaheadFunc, expectTokAfterLastMatch)
            }
        }

        // Implementation of parsing DSL
        private atLeastOneInternal(prodFunc:Function,
                                   prodName:string,
                                   prodOccurrence:number,
                                   lookAheadFunc:LookAheadFunc | GrammarAction,
                                   action:GrammarAction | string,
                                   errMsg?:string):void {
            if (_.isString(action)) {
                errMsg = <any>action;
                action = <any>lookAheadFunc
                lookAheadFunc = this.getLookaheadFuncForAtLeastOne(prodOccurrence)
            }

            super.AT_LEAST_ONE(<any>lookAheadFunc, <any>action, errMsg)
            // note that while it may seem that this can cause an error because by using a recursive call to
            // AT_LEAST_ONE we change the grammar to AT_LEAST_TWO, AT_LEAST_THREE ... , the possible recursive call
            // from the tryInRepetitionRecovery(...) will only happen IFF there really are TWO/THREE/.... items.
            this.attemptInRepetitionRecovery(prodFunc, [lookAheadFunc, action, errMsg],
                <any>lookAheadFunc, prodName, prodOccurrence, interp.NextTerminalAfterAtLeastOneWalker)
        }

        private manyInternal(prodFunc:Function,
                             prodName:string,
                             prodOccurrence:number,
                             lookAheadFunc:LookAheadFunc | GrammarAction,
                             action?:GrammarAction):void {

            if (_.isUndefined(action)) {
                action = <any>lookAheadFunc
                lookAheadFunc = this.getLookaheadFuncForMany(prodOccurrence)
            }

            super.MANY(<any>lookAheadFunc, <any>action)
            this.attemptInRepetitionRecovery(prodFunc, [lookAheadFunc, action],
                <any>lookAheadFunc, prodName, prodOccurrence, interp.NextTerminalAfterManyWalker)
        }

        private orInternal<T>(alts:IOrAlt<T>[] | IOrAltImplicit<T>[],
                              errMsgTypes:string,
                              occurrence:number,
                              ignoreAmbiguities:boolean):T {
            // explicit alternatives look ahead
            if ((<any>alts[0]).WHEN) {
                return super.OR(<IOrAlt<T>[]>alts, errMsgTypes)
            }

            // else implicit lookahead
            var laFunc = this.getLookaheadFuncForOr(occurrence, ignoreAmbiguities)
            var altToTake = laFunc.call(this)
            if (altToTake !== -1) {
                return (<any>alts[altToTake]).ALT.call(this)
            }

            this.raiseNoAltException(errMsgTypes)
        }

        /**
         * @param tokClass The Type of Token we wish to consume (Reference to its constructor function)
         * @param idx occurrence index of consumed token in the invoking parser rule text
         *         for example:
         *         IDENT (DOT IDENT)*
         *         the first ident will have idx 1 and the second one idx 2
         *         * note that for the second ident the idx is always 2 even if its invoked 30 times in the same rule
         *           the idx is about the position in grammar (source code) and has nothing to do with a specific invocation
         *           details
         *
         * @returns the consumed Token
         */
        protected consumeInternal(tokClass:Function, idx:number):tok.Token {
            try {
                return super.CONSUME(tokClass)
            } catch (eFromConsumption) {
                // no recovery allowed during backtracking, otherwise backtracking may recover invalid syntax and accept it
                // but the original syntax could have been parsed successfully without any backtracking + recovery
                if (eFromConsumption instanceof MismatchedTokenException && !this.isBackTracking()) {
                    var follows = this.getFollowsForInRuleRecovery(tokClass, idx)
                    try {
                        return this.tryInRuleRecovery(tokClass, follows)
                    } catch (eFromInRuleRecovery) {
                        /* istanbul ignore next */ // TODO: try removing this istanbul ignore with tsc 1.5.
                        // it is only needed for the else branch but in tsc 1.4.1 comments
                        // between if and else seem to get swallowed and disappear.
                        if (eFromConsumption instanceof InRuleRecoveryException) {
                            // throw the original error in order to trigger reSync error recovery
                            throw eFromConsumption
                        }
                        // this is not part of the contract, just a workaround javascript weak error handling
                        // for a test to reach this code one would have to extend the BaseErrorRecoveryParser
                        // and override some of the recovery code to be faulty (example: throw undefined is not a function error)
                        // this is not a useful use case that needs to be tested...
                        /* istanbul ignore next */
                        else {
                            // some other error Type (built in JS error) this needs to be rethrown, we don't want to swallow it
                            throw eFromInRuleRecovery
                        }
                    }
                }
                else {
                    throw eFromConsumption
                }
            }
        }

        // Automatic lookahead calculation
        protected getLookaheadFuncForOption(occurence:number):() => boolean {
            return this.getLookaheadFuncFor("OPTION", occurence, lookahead.buildLookaheadForOption)
        }

        protected getLookaheadFuncForOr(occurence:number, ignoreErrors:boolean):() => number {
            return this.getLookaheadFuncFor("OR", occurence, lookahead.buildLookaheadForOr, [ignoreErrors])
        }

        protected getLookaheadFuncForMany(occurence:number):() => boolean {
            return this.getLookaheadFuncFor("MANY", occurence, lookahead.buildLookaheadForMany)
        }

        protected getLookaheadFuncForAtLeastOne(occurence:number):() => boolean {
            return this.getLookaheadFuncFor("AT_LEAST_ONE", occurence, lookahead.buildLookaheadForAtLeastOne)
        }

        protected isNextRule<T>(ruleName:string):boolean {
            var classLAFuncs = cache.getLookaheadFuncsForClass(this)
            var condition = <any>classLAFuncs.get(ruleName)
            if (_.isUndefined(condition)) {
                var ruleGrammar = this.getGAstProductions().get(ruleName)
                condition = lookahead.buildLookaheadForTopLevel(ruleGrammar)
                classLAFuncs.put(ruleName, condition)
            }

            return condition.call(this)
        }

        protected getLookaheadFuncFor<T>(prodType:string,
                                         occurrence:number,
                                         laFuncBuilder:(number, any) => () => T,
                                         extraArgs:any[] = []):() => T {
            var classLAFuncs = cache.getLookaheadFuncsForClass(this)
            var ruleName = _.last(this.RULE_STACK)
            var key = prodType + occurrence + IN + ruleName
            var condition = <any>classLAFuncs.get(key)
            if (_.isUndefined(condition)) {
                var ruleGrammar = this.getGAstProductions().get(ruleName)
                condition = laFuncBuilder.apply(null, [occurrence, ruleGrammar].concat(extraArgs))
                classLAFuncs.put(key, condition)
            }

            return condition
        }

        // other functionality
        protected saveRecogState():IErrorRecoveryRecogState {
            var baseState = super.saveRecogState()
            var savedRuleStack = _.clone(this.RULE_STACK)
            var savedFollowStack = _.clone(this.FOLLOW_STACK)
            return {
                errors:       baseState.errors,
                inputIdx:     baseState.inputIdx,
                RULE_STACK:   savedRuleStack,
                FOLLOW_STACK: savedFollowStack
            }
        }

        protected reloadRecogState(newState:IErrorRecoveryRecogState) {
            super.reloadRecogState(newState)
            this.RULE_STACK = newState.RULE_STACK
            this.FOLLOW_STACK = newState.FOLLOW_STACK
        }

        protected getGAstProductions():lang.HashTable<gast.TOP_LEVEL> {
            return cache.getProductionsForClass(this)
        }
    }
}
