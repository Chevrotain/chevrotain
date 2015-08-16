// using only root namespace name ('chevrotain') and not a longer name ('chevrotain.recognizer')
// because the external and internal API must have the same names for d.ts definition files to be valid
namespace chevrotain {

    import cache = chevrotain.cache
    import gast = chevrotain.gast
    import IN = chevrotain.constants.IN
    import interp = chevrotain.interpreter
    import lang = chevrotain.lang
    import gastBuilder = chevrotain.gastBuilder
    import follows = chevrotain.follow
    import lookahead = chevrotain.lookahead
    import checks = chevrotain.checks
    import resolver = chevrotain.resolver
    import exceptions = chevrotain.exceptions


    export enum ParserDefinitionErrorType {
        INVALID_RULE_NAME,
        DUPLICATE_RULE_NAME,
        DUPLICATE_PRODUCTIONS,
        UNRESOLVED_SUBRULE_REF
    }

    export interface IParserDefinitionError {
        message:string
        type:ParserDefinitionErrorType
        ruleName:string
    }

    export interface IParserDuplicatesDefinitionError extends IParserDefinitionError {
        dslName:string
        occurrence:number
        parameter?:string
    }

    export interface IParserUnresolvedRefDefinitionError extends IParserDefinitionError {
        unresolvedRefName:string
    }

    // parameters needed to compute the key in the FOLLOW_SET map.
    export interface IFollowKey {
        ruleName: string
        idxInCallingRule: number
        inRule:string
    }

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

    export interface IParserState {
        errors: Error[]
        inputIdx:number
        RULE_STACK:string[]
    }

    export type LookAheadFunc = () => boolean
    export type GrammarAction = () => void

    let EOF_FOLLOW_KEY:any = {}

    /**
     * A Recognizer capable of self analysis to determine it's grammar structure
     * This is used for more advanced features requiring such information.
     * for example: Error Recovery, Automatic lookahead calculation
     */
    export class Parser {

        static IGNORE_AMBIGUITIES:boolean = true
        static NO_RESYNC:boolean = false
        // Set this flag to true if you don't want the Parser to throw error when problems in it's definition are detected.
        // (normally during the parser's constructor).
        // This is a design time flag, it will not affect the runtime error handling of the parser, just design time errors,
        // for example: duplicate rule names, referencing an unresolved subrule, ect...
        // This flag should not be enabled during normal usage, it is used in special situations, for example when
        // needing to display the parser definition errors in some GUI(online playground).
        static DEFER_DEFINITION_ERRORS_HANDLING:boolean = false

        protected static performSelfAnalysis(classInstance:Parser) {
            let definitionErrors = []
            let defErrorsMsgs

            let className = lang.classNameFromInstance(classInstance)
            // this information should only be computed once
            if (!cache.CLASS_TO_SELF_ANALYSIS_DONE.containsKey(className)) {
                let grammarProductions = cache.getProductionsForClass(className)

                // assumes this cache has been initialized (in the relevant parser's constructor)
                // TODO: consider making the self analysis a member method to resolve this.
                // that way it won't be callable before the constructor has been invoked...
                definitionErrors = cache.CLASS_TO_DEFINITION_ERRORS.get(className)

                let resolverErrors = resolver.resolveGrammar(grammarProductions)
                definitionErrors.push.apply(definitionErrors, resolverErrors) // mutability for the win?
                cache.CLASS_TO_SELF_ANALYSIS_DONE.put(className, true)
                let validationErrors = checks.validateGrammar(grammarProductions.values())
                definitionErrors.push.apply(definitionErrors, validationErrors) // mutability for the win?
                if (!_.isEmpty(definitionErrors) && !Parser.DEFER_DEFINITION_ERRORS_HANDLING) {
                    defErrorsMsgs = _.map(definitionErrors, defError => defError.message)
                    throw new Error(`Parser Definition Errors detected\n: ${defErrorsMsgs.join("-------------------------------\n")}`)
                }
                if (_.isEmpty(definitionErrors)) { // this analysis may fail if the grammar is not perfectly valid
                    let allFollows = follows.computeAllProdsFollows(grammarProductions.values())
                    cache.setResyncFollowsForClass(className, allFollows)
                }
            }

            // reThrow the validation errors each time an erroneous parser is instantiated
            if (!_.isEmpty(cache.CLASS_TO_DEFINITION_ERRORS.get(className)) && !Parser.DEFER_DEFINITION_ERRORS_HANDLING) {
                defErrorsMsgs = _.map(cache.CLASS_TO_DEFINITION_ERRORS.get(className), defError => defError.message)
                throw new Error(`Parser Definition Errors detected\n: ${defErrorsMsgs.join("-------------------------------\n")}`)
            }
        }

        public errors:Error[] = []

        protected _input:Token[] = []
        protected inputIdx = -1
        protected isBackTrackingStack = []
        protected className:string
        protected RULE_STACK:string[] = []
        protected RULE_OCCURRENCE_STACK:number[] = []
        protected tokensMap:{ [fqn: string] : Function; } = undefined

        private firstAfterRepMap
        private classLAFuncs
        private definitionErrors:IParserDefinitionError[]
        private orLookaheadKeys:lang.HashTable<string>[]
        private manyLookaheadKeys:lang.HashTable<string>[]
        private manySepLookaheadKeys:lang.HashTable<string>[]
        private atLeastOneSepLookaheadKeys:lang.HashTable<string>[]
        private atLeastOneLookaheadKeys:lang.HashTable<string>[]
        private optionLookaheadKeys:lang.HashTable<string>[]
        private definedRulesNames:string[] = []

        constructor(input:Token[], tokensMapOrArr:{ [fqn: string] : Function; } | Function[]) {
            this._input = input
            this.className = lang.classNameFromInstance(this)
            this.firstAfterRepMap = cache.getFirstAfterRepForClass(this.className)
            this.classLAFuncs = cache.getLookaheadFuncsForClass(this.className)

            if (!cache.CLASS_TO_DEFINITION_ERRORS.containsKey(this.className)) {
                this.definitionErrors = []
                cache.CLASS_TO_DEFINITION_ERRORS.put(this.className, this.definitionErrors)
            }
            else {
                this.definitionErrors = cache.CLASS_TO_DEFINITION_ERRORS.get(this.className)
            }

            if (_.isArray(tokensMapOrArr)) {
                this.tokensMap = <any>_.reduce(<any>tokensMapOrArr, (acc, tokenClazz:Function) => {
                    acc[tokenName(tokenClazz)] = tokenClazz
                    return acc
                }, {})
            }
            else if (_.isObject(tokensMapOrArr)) {
                this.tokensMap = _.clone(<any>tokensMapOrArr)
            }
            else {
                throw new Error("'tokensMapOrArr' argument must be An Array of Token constructors or a Dictionary of Tokens.")
            }

            // always add EOF to the tokenNames -> constructors map. it is useful to assure all the input has been
            // parsed with a clear error message ("expecting EOF but found ...")
            this.tokensMap[tokenName(EOF)] = EOF

            if (cache.CLASS_TO_OR_LA_CACHE[this.className] === undefined) {
                cache.initLookAheadKeyCache(this.className)
            }

            this.orLookaheadKeys = cache.CLASS_TO_OR_LA_CACHE[this.className]
            this.manyLookaheadKeys = cache.CLASS_TO_MANY_LA_CACHE[this.className]
            this.manySepLookaheadKeys = cache.CLASS_TO_MANY_SEP_LA_CACHE[this.className]
            this.atLeastOneLookaheadKeys = cache.CLASS_TO_AT_LEAST_ONE_LA_CACHE[this.className]
            this.atLeastOneSepLookaheadKeys = cache.CLASS_TO_AT_LEAST_ONE_SEP_LA_CACHE[this.className]
            this.optionLookaheadKeys = cache.CLASS_TO_OPTION_LA_CACHE[this.className]
        }

        public set input(newInput:Token[]) {
            this.reset()
            this._input = newInput
        }

        public get input():Token[] {
            return _.clone(this._input)
        }

        public reset():void {
            this.isBackTrackingStack = []
            this.errors = []
            this._input = []
            this.inputIdx = -1
            this.RULE_STACK = []
            this.RULE_OCCURRENCE_STACK = []
        }

        public isAtEndOfInput():boolean {
            return this.LA(1) instanceof EOF
        }

        public getGAstProductions():lang.HashTable<gast.Rule> {
            return cache.getProductionsForClass(this.className)
        }

        protected isBackTracking():boolean {
            return !(_.isEmpty(this.isBackTrackingStack))
        }

        protected SAVE_ERROR(error:Error):Error {
            if (exceptions.isRecognitionException(error)) {
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

        protected LA(howMuch:number):Token {
            if (this._input.length <= this.inputIdx + howMuch) {
                return new EOF()
            }
            else {
                return this._input[this.inputIdx + howMuch]
            }
        }

        protected isNextRule<T>(ruleName:string):boolean {
            let classLAFuncs = cache.getLookaheadFuncsForClass(this.className)
            let condition = <any>classLAFuncs.get(ruleName)
            if (condition === undefined) {
                let ruleGrammar = this.getGAstProductions().get(ruleName)
                condition = lookahead.buildLookaheadForTopLevel(ruleGrammar)
                classLAFuncs.put(ruleName, condition)
            }

            return condition.call(this)
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
                let orgState = this.saveRecogState()
                try {
                    let ruleResult = grammarRule.call(this)
                    return isValid(ruleResult)
                } catch (e) {
                    if (exceptions.isRecognitionException(e)) {
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

        // Parsing DSL

        /**
         * Convenience method equivalent to CONSUME1
         * @see CONSUME1
         */
        protected CONSUME(tokClass:Function):Token {
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
        protected CONSUME1(tokClass:Function):Token {
            return this.consumeInternal(tokClass, 1)
        }

        /**
         * @see CONSUME1
         */
        protected CONSUME2(tokClass:Function):Token {
            return this.consumeInternal(tokClass, 2)
        }

        /**
         * @see CONSUME1
         */
        protected CONSUME3(tokClass:Function):Token {
            return this.consumeInternal(tokClass, 3)
        }

        /**
         * @see CONSUME1
         */
        protected CONSUME4(tokClass:Function):Token {
            return this.consumeInternal(tokClass, 4)
        }

        /**
         * @see CONSUME1
         */
        protected CONSUME5(tokClass:Function):Token {
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
            return this.OPTION1.call(this, laFuncOrAction, action)
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
            if (action === undefined) {
                action = <any>laFuncOrAction
                laFuncOrAction = this.getLookaheadFuncForOption(1)
            }
            return this.optionInternal(<any>laFuncOrAction, <any>action)
        }

        /**
         * @see OPTION1
         */
        protected OPTION2(laFuncOrAction:LookAheadFunc | GrammarAction,
                          action?:GrammarAction):boolean {
            if (action === undefined) {
                action = <any>laFuncOrAction
                laFuncOrAction = this.getLookaheadFuncForOption(2)
            }
            return this.optionInternal(<any>laFuncOrAction, <any>action)
        }

        /**
         * @see OPTION1
         */
        protected OPTION3(laFuncOrAction:LookAheadFunc | GrammarAction,
                          action?:GrammarAction):boolean {
            if (action === undefined) {
                action = <any>laFuncOrAction
                laFuncOrAction = this.getLookaheadFuncForOption(3)
            }
            return this.optionInternal(<any>laFuncOrAction, <any>action)
        }

        /**
         * @see OPTION1
         */
        protected OPTION4(laFuncOrAction:LookAheadFunc | GrammarAction,
                          action?:GrammarAction):boolean {
            if (action === undefined) {
                action = <any>laFuncOrAction
                laFuncOrAction = this.getLookaheadFuncForOption(4)
            }
            return this.optionInternal(<any>laFuncOrAction, <any>action)
        }

        /**
         * @see OPTION1
         */
        protected OPTION5(laFuncOrAction:LookAheadFunc | GrammarAction,
                          action?:GrammarAction):boolean {
            if (action === undefined) {
                action = <any>laFuncOrAction
                laFuncOrAction = this.getLookaheadFuncForOption(5)
            }
            return this.optionInternal(<any>laFuncOrAction, <any>action)
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
        protected MANY(laFuncOrAction:LookAheadFunc | GrammarAction,
                       action?:GrammarAction):void {
            return this.MANY1.call(this, laFuncOrAction, action)
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
         * Convenience method equivalent to MANY_SEP1
         * @see MANY_SEP1
         */
        protected MANY_SEP(separator:TokenConstructor, laFuncOrAction:LookAheadFunc | GrammarAction,
                           action?:GrammarAction):Token[] {
            return this.MANY_SEP1.call(this, separator, laFuncOrAction, action)
        }

        /**
         * Parsing DSL method, that indicates a repetition of zero or more with a separator
         * Token between the repetitions.
         *
         * note that the 'action' param is optional. so both of the following forms are valid:
         *
         * short: this.MANY_SEP(Comma, ()=>{
         *                       this.CONSUME(Number};
         *                       ...
         *                       );
         *
         * long: this.MANY(Comma, isNumber, ()=>{
         *                       this.CONSUME(Number}
         *                       ...
         *                       );
         *
         * using the short form is recommended as it will compute the lookahead function
         * (for the first iteration) automatically. however this currently has one limitation:
         * It only works if the lookahead for the grammar is one.
         *
         * As in CONSUME the index in the method name indicates the occurrence
         * of the repetition production in it's top rule.
         *
         * @param separator - The Token to use as a separator between repetitions.
         * @param {Function} laFuncOrAction - The lookahead function that 'decides'
         *                                  whether or not the MANY_SEP's action will be
         *                                  invoked or the action to optionally invoke
         * @param {Function} [action] - The action to optionally invoke.
         *
         * @return {Token[]} - The consumed separator Tokens.
         */
        protected MANY_SEP1(separator:TokenConstructor, laFuncOrAction:LookAheadFunc | GrammarAction,
                            action?:GrammarAction):Token[] {
            return this.manySepFirstInternal(this.MANY_SEP1, "MANY_SEP1", 1, separator, laFuncOrAction, action)
        }

        /**
         * @see MANY_SEP1
         */
        protected MANY_SEP2(separator:TokenConstructor, laFuncOrAction:LookAheadFunc | GrammarAction,
                            action?:GrammarAction):Token[] {
            return this.manySepFirstInternal(this.MANY_SEP2, "MANY_SEP2", 2, separator, laFuncOrAction, action)
        }

        /**
         * @see MANY_SEP1
         */
        protected MANY_SEP3(separator:TokenConstructor, laFuncOrAction:LookAheadFunc | GrammarAction,
                            action?:GrammarAction):Token[] {
            return this.manySepFirstInternal(this.MANY_SEP3, "MANY_SEP3", 3, separator, laFuncOrAction, action)
        }

        /**
         * @see MANY_SEP1
         */
        protected MANY_SEP4(separator:TokenConstructor, laFuncOrAction:LookAheadFunc | GrammarAction,
                            action?:GrammarAction):Token[] {
            return this.manySepFirstInternal(this.MANY_SEP4, "MANY_SEP4", 4, separator, laFuncOrAction, action)
        }

        /**
         * @see MANY_SEP1
         */
        protected MANY_SEP5(separator:TokenConstructor, laFuncOrAction:LookAheadFunc | GrammarAction,
                            action?:GrammarAction):Token[] {
            return this.manySepFirstInternal(this.MANY_SEP5, "MANY_SEP5", 5, separator, laFuncOrAction, action)
        }

        /**
         * Convenience method equivalent to AT_LEAST_ONE1
         * @see AT_LEAST_ONE1
         */
        protected AT_LEAST_ONE(laFuncOrAction:LookAheadFunc | GrammarAction,
                               action:GrammarAction | string,
                               errMsg?:string):void {
            return this.AT_LEAST_ONE1.call(this, laFuncOrAction, action, errMsg)
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
            this.atLeastOneInternal(this.AT_LEAST_ONE3, "AT_LEAST_ONE3", 3, laFuncOrAction, action, errMsg)
        }

        /**
         * @see AT_LEAST_ONE1
         */
        protected AT_LEAST_ONE4(laFuncOrAction:LookAheadFunc | GrammarAction,
                                action:GrammarAction | string,
                                errMsg?:string):void {
            this.atLeastOneInternal(this.AT_LEAST_ONE4, "AT_LEAST_ONE4", 4, laFuncOrAction, action, errMsg)
        }

        /**
         * @see AT_LEAST_ONE1
         */
        protected AT_LEAST_ONE5(laFuncOrAction:LookAheadFunc | GrammarAction,
                                action:GrammarAction | string,
                                errMsg?:string):void {
            this.atLeastOneInternal(this.AT_LEAST_ONE5, "AT_LEAST_ONE5", 5, laFuncOrAction, action, errMsg)
        }

        /**
         * Convenience method equivalent to AT_LEAST_ONE_SEP1
         * @see AT_LEAST_ONE1
         */
        protected AT_LEAST_ONE_SEP(separator:TokenConstructor,
                                   laFuncOrAction:LookAheadFunc | GrammarAction,
                                   action:GrammarAction | string,
                                   errMsg?:string):Token[] {
            return this.AT_LEAST_ONE_SEP1.call(this, separator, laFuncOrAction, action, errMsg)
        }

        /**
         *
         * convenience method, same as MANY_SEP but the repetition is of one or more.
         * failing to match at least one repetition will result in a parsing error and
         * cause the parser to attempt error recovery.
         *
         * @see MANY_SEP1
         *
         * @param separator {Token}
         * @param {Function} laFuncOrAction The lookahead function that 'decides'
         *                                  whether or not the AT_LEAST_ONE's action will be
         *                                  invoked or the action to optionally invoke
         * @param {Function} [action] The action to optionally invoke.
         * @param {string} [errMsg] short title/classification to what is being matched
         */
        protected AT_LEAST_ONE_SEP1(separator:TokenConstructor,
                                    laFuncOrAction:LookAheadFunc | GrammarAction,
                                    action:GrammarAction | string,
                                    errMsg?:string):Token[] {
            return this.atLeastOneSepFirstInternal(this.atLeastOneSepFirstInternal, "AT_LEAST_ONE_SEP1", 1, separator,
                laFuncOrAction, action, errMsg)
        }

        /**
         * @see AT_LEAST_ONE_SEP1
         */
        protected AT_LEAST_ONE_SEP2(separator:TokenConstructor,
                                    laFuncOrAction:LookAheadFunc | GrammarAction,
                                    action:GrammarAction | string,
                                    errMsg?:string):Token[] {
            return this.atLeastOneSepFirstInternal(this.atLeastOneSepFirstInternal, "AT_LEAST_ONE_SEP2", 2, separator,
                laFuncOrAction, action, errMsg)
        }

        /**
         * @see AT_LEAST_ONE_SEP1
         */
        protected AT_LEAST_ONE_SEP3(separator:TokenConstructor,
                                    laFuncOrAction:LookAheadFunc | GrammarAction,
                                    action:GrammarAction | string,
                                    errMsg?:string):Token[] {
            return this.atLeastOneSepFirstInternal(this.atLeastOneSepFirstInternal, "AT_LEAST_ONE_SEP3", 3, separator,
                laFuncOrAction, action, errMsg)
        }

        /**
         * @see AT_LEAST_ONE_SEP1
         */
        protected AT_LEAST_ONE_SEP4(separator:TokenConstructor,
                                    laFuncOrAction:LookAheadFunc | GrammarAction,
                                    action:GrammarAction | string,
                                    errMsg?:string):Token[] {
            return this.atLeastOneSepFirstInternal(this.atLeastOneSepFirstInternal, "AT_LEAST_ONE_SEP4", 4, separator,
                laFuncOrAction, action, errMsg)
        }

        /**
         * @see AT_LEAST_ONE_SEP1
         */
        protected AT_LEAST_ONE_SEP5(separator:TokenConstructor,
                                    laFuncOrAction:LookAheadFunc | GrammarAction,
                                    action:GrammarAction | string,
                                    errMsg?:string):Token[] {
            return this.atLeastOneSepFirstInternal(this.atLeastOneSepFirstInternal, "AT_LEAST_ONE_SEP5", 5, separator,
                laFuncOrAction, action, errMsg)
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
         * @param {string} ruleName The name of the Rule. must match the let it is assigned to.
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
            let ruleNameErrors = checks.validateRuleName(ruleName, this.definedRulesNames, this.className)
            this.definedRulesNames.push(ruleName)
            this.definitionErrors.push.apply(this.definitionErrors, ruleNameErrors) // mutability for the win
            let parserClassProductions = cache.getProductionsForClass(this.className)
            // only build the gast representation once
            if (!(parserClassProductions.containsKey(ruleName))) {
                let gastProduction = gastBuilder.buildTopProduction(impl.toString(), ruleName, this.tokensMap)
                parserClassProductions.put(ruleName, gastProduction)
            }

            let wrappedGrammarRule = function (idxInCallingRule:number = 1, args:any[] = []) {
                this.ruleInvocationStateUpdate(ruleName, idxInCallingRule)

                try {
                    // actual parsing happens here
                    return impl.apply(this, args)
                } catch (e) {
                    let isFirstInvokedRule = (this.RULE_STACK.length === 1)
                    // note the reSync is always enabled for the first rule invocation, because we must always be able to
                    // reSync with EOF and just output some INVALID ParseTree
                    // during backtracking reSync recovery is disabled, otherwise we can't be certain the backtracking
                    // path is really the most valid one
                    let reSyncEnabled = (isFirstInvokedRule || doReSync) && !this.isBackTracking()

                    if (reSyncEnabled && exceptions.isRecognitionException(e)) {
                        let reSyncTokType = this.findReSyncTokenType()
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
                    this.ruleFinallyStateUpdate()
                }
            }
            let ruleNamePropName = "ruleName"
            wrappedGrammarRule[ruleNamePropName] = ruleName
            return wrappedGrammarRule
        }

        protected ruleInvocationStateUpdate(ruleName:string, idxInCallingRule:number):void {
            this.RULE_OCCURRENCE_STACK.push(idxInCallingRule)
            this.RULE_STACK.push(ruleName)
        }

        protected ruleFinallyStateUpdate():void {
            this.RULE_STACK.pop()
            this.RULE_OCCURRENCE_STACK.pop()

            let maxInputIdx = this._input.length - 1
            if ((this.RULE_STACK.length === 0) && this.inputIdx < maxInputIdx) {
                let firstRedundantTok:Token = this.NEXT_TOKEN()
                this.SAVE_ERROR(new exceptions.NotAllInputParsedException(
                    "Redundant input, expecting EOF but found: " + firstRedundantTok.image, firstRedundantTok))
            }
        }

        /*
         * Returns an "imaginary" Token to insert when Single Token Insertion is done
         * Override this if you require special behavior in your grammar
         * for example if an IntegerToken is required provide one with the image '0' so it would be valid syntactically
         */
        protected getTokenToInsert(tokClass:Function):Token {
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

        private defaultInvalidReturn():any { return undefined }

        private tryInRepetitionRecovery(grammarRule:Function,
                                        grammarRuleArgs:any[],
                                        lookAheadFunc:() => boolean,
                                        expectedTokType:Function):void {
            // TODO: can the resyncTokenType be cached?
            let reSyncTokType = this.findReSyncTokenType()
            let orgInputIdx = this.inputIdx
            let nextTokenWithoutResync = this.NEXT_TOKEN()
            let currToken = this.NEXT_TOKEN()
            let passedResyncPoint = false
            while (!passedResyncPoint) {
                // we skipped enough tokens so we can resync right back into another iteration of the repetition grammar rule
                if (lookAheadFunc.call(this)) {
                    // we are preemptively re-syncing before an error has been detected, therefor we must reproduce
                    // the error that would have been thrown
                    let expectedTokName = tokenName(expectedTokType)
                    let msg = "Expecting token of type -->" + expectedTokName +
                        "<-- but found -->'" + nextTokenWithoutResync.image + "'<--"
                    this.SAVE_ERROR(new exceptions.MismatchedTokenException(msg, nextTokenWithoutResync))

                    // recursive invocation in other to support multiple re-syncs in the same top level repetition grammar rule
                    grammarRule.apply(this, grammarRuleArgs)
                    return // must return here to avoid reverting the inputIdx
                }
                if (currToken instanceof reSyncTokType) {
                    passedResyncPoint = true
                }
                currToken = this.SKIP_TOKEN()
            }

            // we were unable to find a CLOSER point to resync inside the MANY, reset the state and
            // rethrow the exception for farther recovery attempts into rules deeper in the rules stack
            this.inputIdx = orgInputIdx
        }

        private shouldInRepetitionRecoveryBeTried(expectTokAfterLastMatch?:Function, nextTokIdx?:number):boolean {
            // arguments to try and perform resync into the next iteration of the many are missing
            if (expectTokAfterLastMatch === undefined || nextTokIdx === undefined) {
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
        private getFollowsForInRuleRecovery(tokClass:Function, tokIdxInRule):Function[] {
            let pathRuleStack:string[] = _.clone(this.RULE_STACK)
            let pathOccurrenceStack:number[] = _.clone(this.RULE_OCCURRENCE_STACK)
            let grammarPath:any = {
                ruleStack:         pathRuleStack,
                occurrenceStack:   pathOccurrenceStack,
                lastTok:           tokClass,
                lastTokOccurrence: tokIdxInRule
            }

            let topRuleName = _.first(pathRuleStack)
            let gastProductions = this.getGAstProductions()
            let topProduction = gastProductions.get(topRuleName)
            let follows = new interp.NextAfterTokenWalker(topProduction, grammarPath).startWalking()
            return follows
        }

        private tryInRuleRecovery(expectedTokType:Function, follows:Function[]):Token {
            if (this.canRecoverWithSingleTokenInsertion(expectedTokType, follows)) {
                let tokToInsert = this.getTokenToInsert(expectedTokType)
                tokToInsert.isInsertedInRecovery = true
                return tokToInsert

            }

            if (this.canRecoverWithSingleTokenDeletion(expectedTokType)) {
                let nextTok = this.SKIP_TOKEN()
                this.inputIdx++
                return nextTok
            }

            throw new InRuleRecoveryException("sad sad panda")
        }

        private canPerformInRuleRecovery(expectedToken:Function, follows:Function[]):boolean {
            return this.canRecoverWithSingleTokenInsertion(expectedToken, follows) ||
                this.canRecoverWithSingleTokenDeletion(expectedToken)
        }

        private canRecoverWithSingleTokenInsertion(expectedTokType:Function, follows:Function[]):boolean {
            if (!this.canTokenTypeBeInsertedInRecovery(expectedTokType)) {
                return false
            }

            // must know the possible following tokens to perform single token insertion
            if (_.isEmpty(follows)) {
                return false
            }

            let mismatchedTok = this.NEXT_TOKEN()
            let isMisMatchedTokInFollows = _.find(follows, (possibleFollowsTokType:Function) => {
                    return mismatchedTok instanceof possibleFollowsTokType
                }) !== undefined

            return isMisMatchedTokInFollows
        }

        private canRecoverWithSingleTokenDeletion(expectedTokType:Function):boolean {
            let isNextTokenWhatIsExpected = this.LA(2) instanceof expectedTokType
            return isNextTokenWhatIsExpected
        }

        private isInCurrentRuleReSyncSet(token:Function):boolean {
            let followKey = this.getCurrFollowKey()
            let currentRuleReSyncSet = this.getFollowSetFromFollowKey(followKey)
            return _.contains(currentRuleReSyncSet, token)
        }

        private findReSyncTokenType():Function {
            let allPossibleReSyncTokTypes = this.flattenFollowSet()
            // this loop will always terminate as EOF is always in the follow stack and also always (virtually) in the input
            let nextToken = this.NEXT_TOKEN()
            let k = 2
            while (true) {
                let nextTokenType:any = (<any>nextToken).constructor
                if (_.contains(allPossibleReSyncTokTypes, nextTokenType)) {
                    return nextTokenType
                }
                nextToken = this.LA(k)
                k++
            }
        }

        private getCurrFollowKey():IFollowKey {
            // the length is at least one as we always add the ruleName to the stack before invoking the rule.
            if (this.RULE_STACK.length === 1) {
                return EOF_FOLLOW_KEY
            }
            let currRuleIdx = this.RULE_STACK.length - 1
            let currRuleOccIdx = currRuleIdx
            let prevRuleIdx = currRuleIdx - 1

            return {
                ruleName:         this.RULE_STACK[currRuleIdx],
                idxInCallingRule: this.RULE_OCCURRENCE_STACK[currRuleOccIdx],
                inRule:           this.RULE_STACK[prevRuleIdx]
            }
        }

        private buildFullFollowKeyStack():IFollowKey[] {
            return _.map(this.RULE_STACK, (ruleName, idx) => {
                if (idx === 0) {
                    return EOF_FOLLOW_KEY
                }
                return {
                    ruleName:         ruleName,
                    idxInCallingRule: this.RULE_OCCURRENCE_STACK[idx],
                    inRule:           this.RULE_STACK[idx - 1]
                }
            })
        }

        private flattenFollowSet():Function[] {
            let followStack = _.map(this.buildFullFollowKeyStack(), (currKey) => {
                return this.getFollowSetFromFollowKey(currKey)
            })
            return <any>_.flatten(followStack)
        }

        private getFollowSetFromFollowKey(followKey:IFollowKey):Function[] {
            if (followKey === EOF_FOLLOW_KEY) {
                return [EOF]
            }

            let followName = followKey.ruleName + followKey.idxInCallingRule + IN + followKey.inRule
            return cache.getResyncFollowsForClass(this.className).get(followName)
        }

        private reSyncTo(tokClass:Function):void {
            let nextTok = this.NEXT_TOKEN()
            while ((nextTok instanceof tokClass) === false) {
                nextTok = this.SKIP_TOKEN()
            }
        }

        private attemptInRepetitionRecovery(prodFunc:Function,
                                            args:any[],
                                            lookaheadFunc:() => boolean,
                                            prodName:string,
                                            prodOccurrence:number,
                                            nextToksWalker:typeof interp.AbstractNextTerminalAfterProductionWalker,
                                            prodKeys:lang.HashTable<string>[]) {

            let key = this.getKeyForAutomaticLookahead(prodName, prodKeys, prodOccurrence)
            let firstAfterRepInfo = this.firstAfterRepMap.get(key)
            if (firstAfterRepInfo === undefined) {
                let currRuleName = _.last(this.RULE_STACK)
                let ruleGrammar = this.getGAstProductions().get(currRuleName)
                let walker:interp.AbstractNextTerminalAfterProductionWalker = new nextToksWalker(ruleGrammar, prodOccurrence)
                firstAfterRepInfo = walker.startWalking()
                this.firstAfterRepMap.put(key, firstAfterRepInfo)
            }

            let expectTokAfterLastMatch = firstAfterRepInfo.token
            let nextTokIdx = firstAfterRepInfo.occurrence
            let isEndOfRule = firstAfterRepInfo.isEndOfRule

            // special edge case of a TOP most repetition after which the input should END.
            // this will force an attempt for inRule recovery in that scenario.
            if (this.RULE_STACK.length === 1 &&
                isEndOfRule &&
                expectTokAfterLastMatch === undefined) {
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

        private optionInternal(condition:LookAheadFunc, action:GrammarAction):boolean {
            if (condition.call(this)) {
                action.call(this)
                return true
            }
            return false
        }

        // Implementation of parsing DSL
        private atLeastOneInternal(prodFunc:Function,
                                   prodName:string,
                                   prodOccurrence:number,
                                   lookAheadFunc:LookAheadFunc | GrammarAction,
                                   action:GrammarAction | string,
                                   errMsg?:string):void {
            if (_.isString(action)) {
                errMsg = <any>action
                action = <any>lookAheadFunc
                lookAheadFunc = this.getLookaheadFuncForAtLeastOne(prodOccurrence)
            }

            if (lookAheadFunc.call(this)) {
                (<any>action).call(this)
                while (lookAheadFunc.call(this)) {
                    (<any>action).call(this)
                }
            }
            else {
                throw this.SAVE_ERROR(new exceptions.EarlyExitException("expecting at least one: " + errMsg, this.NEXT_TOKEN()))
            }

            // note that while it may seem that this can cause an error because by using a recursive call to
            // AT_LEAST_ONE we change the grammar to AT_LEAST_TWO, AT_LEAST_THREE ... , the possible recursive call
            // from the tryInRepetitionRecovery(...) will only happen IFF there really are TWO/THREE/.... items.
            this.attemptInRepetitionRecovery(prodFunc, [lookAheadFunc, action, errMsg],
                <any>lookAheadFunc, prodName, prodOccurrence, interp.NextTerminalAfterAtLeastOneWalker, this.atLeastOneLookaheadKeys)
        }

        private atLeastOneSepFirstInternal(prodFunc:Function,
                                           prodName:string,
                                           prodOccurrence:number,
                                           separator:TokenConstructor,
                                           firstIterationLookAheadFunc:LookAheadFunc | GrammarAction,
                                           action:GrammarAction | string,
                                           errMsg?:string):Token[] {

            let separatorsResult = []

            if (_.isString(action)) {
                errMsg = <any>action
                action = <any>firstIterationLookAheadFunc
                firstIterationLookAheadFunc = this.getLookaheadFuncForAtLeastOneSep(prodOccurrence)
            }

            // 1st iteration
            if (firstIterationLookAheadFunc.call(this)) {
                (<GrammarAction>action).call(this)

                let separatorLookAheadFunc = () => {return this.NEXT_TOKEN() instanceof separator}
                // 2nd..nth iterations
                while (separatorLookAheadFunc()) {
                    // note that this CONSUME will never enter recovery because
                    // the separatorLookAheadFunc checks that the separator really does exist.
                    separatorsResult.push(this.CONSUME(separator));
                    (<GrammarAction>action).call(this)
                }

                this.attemptInRepetitionRecovery(this.repetitionSepSecondInternal,
                    [prodName, prodOccurrence, separator, separatorLookAheadFunc, action, separatorsResult,
                        this.atLeastOneSepLookaheadKeys, interp.NextTerminalAfterAtLeastOneSepWalker],
                    separatorLookAheadFunc,
                    prodName,
                    prodOccurrence,
                    interp.NextTerminalAfterAtLeastOneSepWalker,
                    this.atLeastOneSepLookaheadKeys)
            }
            else {
                throw this.SAVE_ERROR(new exceptions.EarlyExitException("expecting at least one: " + errMsg, this.NEXT_TOKEN()))
            }

            return separatorsResult
        }

        private manyInternal(prodFunc:Function,
                             prodName:string,
                             prodOccurrence:number,
                             lookAheadFunc:LookAheadFunc | GrammarAction,
                             action?:GrammarAction):void {

            if (action === undefined) {
                action = <any>lookAheadFunc
                lookAheadFunc = this.getLookaheadFuncForMany(prodOccurrence)
            }

            while (lookAheadFunc.call(this)) {
                action.call(this)
            }
            this.attemptInRepetitionRecovery(prodFunc, [lookAheadFunc, action],
                <any>lookAheadFunc, prodName, prodOccurrence, interp.NextTerminalAfterManyWalker, this.manyLookaheadKeys)
        }

        private manySepFirstInternal(prodFunc:Function,
                                     prodName:string,
                                     prodOccurrence:number,
                                     separator:TokenConstructor,
                                     firstIterationLookAheadFunc:LookAheadFunc | GrammarAction,
                                     action?:GrammarAction):Token[] {

            let separatorsResult = []

            if (action === undefined) {
                action = <any>firstIterationLookAheadFunc
                firstIterationLookAheadFunc = this.getLookaheadFuncForManySep(prodOccurrence)
            }

            // 1st iteration
            if (firstIterationLookAheadFunc.call(this)) {
                action.call(this)

                let separatorLookAheadFunc = () => {return this.NEXT_TOKEN() instanceof separator}
                // 2nd..nth iterations
                while (separatorLookAheadFunc()) {
                    // note that this CONSUME will never enter recovery because
                    // the separatorLookAheadFunc checks that the separator really does exist.
                    separatorsResult.push(this.CONSUME(separator))
                    action.call(this)
                }

                this.attemptInRepetitionRecovery(this.repetitionSepSecondInternal,
                    [prodName, prodOccurrence, separator, separatorLookAheadFunc, action, separatorsResult,
                        this.manySepLookaheadKeys, interp.NextTerminalAfterManySepWalker],
                    separatorLookAheadFunc,
                    prodName,
                    prodOccurrence,
                    interp.NextTerminalAfterManySepWalker,
                    this.manySepLookaheadKeys)
            }

            return separatorsResult
        }

        private repetitionSepSecondInternal(prodName:string,
                                            prodOccurrence:number,
                                            separator:TokenConstructor,
                                            separatorLookAheadFunc:() => boolean,
                                            action:GrammarAction,
                                            separatorsResult:Token[],
                                            laKeys:lang.HashTable<string>[],
                                            nextTerminalAfterWalker:typeof interp.AbstractNextTerminalAfterProductionWalker):void {


            while (separatorLookAheadFunc()) {
                // note that this CONSUME will never enter recovery because
                // the separatorLookAheadFunc checks that the separator really does exist.
                separatorsResult.push(this.CONSUME(separator))
                action.call(this)
            }

            this.attemptInRepetitionRecovery(this.repetitionSepSecondInternal,
                [prodName, prodOccurrence, separator, separatorLookAheadFunc, action, separatorsResult, laKeys, nextTerminalAfterWalker],
                separatorLookAheadFunc,
                prodName,
                prodOccurrence,
                nextTerminalAfterWalker,
                laKeys)

        }

        private orInternal<T>(alts:IOrAlt<T>[] | IOrAltImplicit<T>[],
                              errMsgTypes:string,
                              occurrence:number,
                              ignoreAmbiguities:boolean):T {
            // explicit alternatives look ahead
            if ((<any>alts[0]).WHEN !== undefined) {
                for (let i = 0; i < alts.length; i++) {
                    if ((<any>alts[i]).WHEN.call(this)) {
                        let res = (<any>alts[i]).THEN_DO()
                        return res
                    }
                }
                this.raiseNoAltException(errMsgTypes)
            }

            // else implicit lookahead
            let laFunc = this.getLookaheadFuncForOr(occurrence, ignoreAmbiguities)
            let altToTake = laFunc.call(this)
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
        private consumeInternal(tokClass:Function, idx:number):Token {
            try {
                return this.consumeInternalOptimized(tokClass)
            } catch (eFromConsumption) {
                // no recovery allowed during backtracking, otherwise backtracking may recover invalid syntax and accept it
                // but the original syntax could have been parsed successfully without any backtracking + recovery
                if (eFromConsumption instanceof exceptions.MismatchedTokenException && !this.isBackTracking()) {
                    let follows = this.getFollowsForInRuleRecovery(tokClass, idx)
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

        // to enable opimizations this logic has been extract to a method as its caller method contains try/catch
        private consumeInternalOptimized(tokClass:Function):Token {
            let nextToken = this.NEXT_TOKEN()
            if (this.NEXT_TOKEN() instanceof tokClass) {
                this.inputIdx++
                return nextToken
            }
            else {
                let expectedTokType = tokenName(tokClass)
                let msg = "Expecting token of type -->" + expectedTokType + "<-- but found -->'" + nextToken.image + "'<--"
                throw this.SAVE_ERROR(new exceptions.MismatchedTokenException(msg, nextToken))
            }
        }

        private getKeyForAutomaticLookahead(prodName:string, prodKeys:lang.HashTable<string>[], occurrence:number):string {

            let occuMap = prodKeys[occurrence - 1]
            let currRule = _.last(this.RULE_STACK)
            let key = occuMap[currRule]
            if (key === undefined) {
                key = prodName + occurrence + IN + currRule
                occuMap[currRule] = key
            }
            return key
        }

        // Automatic lookahead calculation
        private getLookaheadFuncForOption(occurence:number):() => boolean {
            let key = this.getKeyForAutomaticLookahead("OPTION", this.optionLookaheadKeys, occurence)
            return this.getLookaheadFuncFor(key, occurence, lookahead.buildLookaheadForOption)
        }

        private getLookaheadFuncForOr(occurence:number, ignoreErrors:boolean):() => number {
            let key = this.getKeyForAutomaticLookahead("OR", this.orLookaheadKeys, occurence)
            return this.getLookaheadFuncFor(key, occurence, lookahead.buildLookaheadForOr, [ignoreErrors])
        }

        private getLookaheadFuncForMany(occurence:number):() => boolean {
            let key = this.getKeyForAutomaticLookahead("MANY", this.manyLookaheadKeys, occurence)
            return this.getLookaheadFuncFor(key, occurence, lookahead.buildLookaheadForMany)
        }

        private getLookaheadFuncForManySep(occurence:number):() => boolean {
            let key = this.getKeyForAutomaticLookahead("MANY_SEP", this.manySepLookaheadKeys, occurence)
            return this.getLookaheadFuncFor(key, occurence, lookahead.buildLookaheadForManySep)
        }

        private getLookaheadFuncForAtLeastOne(occurence:number):() => boolean {
            let key = this.getKeyForAutomaticLookahead("AT_LEAST_ONE", this.atLeastOneLookaheadKeys, occurence)
            return this.getLookaheadFuncFor(key, occurence, lookahead.buildLookaheadForAtLeastOne)
        }

        private getLookaheadFuncForAtLeastOneSep(occurence:number):() => boolean {
            let key = this.getKeyForAutomaticLookahead("AT_LEAST_ONE_SEP", this.atLeastOneSepLookaheadKeys, occurence)
            return this.getLookaheadFuncFor(key, occurence, lookahead.buildLookaheadForAtLeastOneSep)
        }

        private getLookaheadFuncFor<T>(key:string,
                                       occurrence:number,
                                       laFuncBuilder:(number, any) => () => T,
                                       extraArgs:any[] = []):() => T {
            let ruleName = _.last(this.RULE_STACK)
            let condition = <any>this.classLAFuncs.get(key)
            if (condition === undefined) {
                let ruleGrammar = this.getGAstProductions().get(ruleName)
                condition = laFuncBuilder.apply(null, [occurrence, ruleGrammar].concat(extraArgs))
                this.classLAFuncs.put(key, condition)
            }
            return condition
        }

        // other functionality
        private saveRecogState():IParserState {
            let savedErrors = _.clone(this.errors)
            let savedRuleStack = _.clone(this.RULE_STACK)
            return {
                errors:     savedErrors,
                inputIdx:   this.inputIdx,
                RULE_STACK: savedRuleStack
            }
        }

        private reloadRecogState(newState:IParserState) {
            this.errors = newState.errors
            this.inputIdx = newState.inputIdx
            this.RULE_STACK = newState.RULE_STACK
        }

        private raiseNoAltException(errMsgTypes:string):void {
            throw this.SAVE_ERROR(new exceptions.NoViableAltException("expecting: " + errMsgTypes +
                " but found '" + this.NEXT_TOKEN().image + "'", this.NEXT_TOKEN()))
        }
    }

    function InRuleRecoveryException(message:string) {
        this.name = lang.functionName(InRuleRecoveryException)
        this.message = message
    }

    InRuleRecoveryException.prototype = Error.prototype
}
