/*! chevrotain - v0.5.0 - 2015-08-16 */
declare module chevrotain {
    module lang {
        class HashTable<V>{}
    }

    function tokenName(clazz: Function): string;
    /**
     * utility to help the poor souls who are still stuck writing pure javascript 5.1
     * extend and create Token subclasses in a less verbose manner
     *
     * @param {string} tokenName - the name of the new TokenClass
     * @param {RegExp|Function} patternOrParent - RegExp Pattern or Parent Token Constructor
     * @param {Function} parentConstructor - the Token class to be extended
     * @returns {Function} - a constructor for the new extended Token subclass
     */
    function extendToken(tokenName: string, patternOrParent?: any, parentConstructor?: Function): any;
    class Token {
        image: string;
        offset: number;
        startLine: number;
        startColumn: number;
        endLine: number;
        endColumn: number;
        isInsertedInRecovery: boolean;
        /**
         * @param {string} image the textual representation of the Token as it appeared in the text
         * @param {number} offset offset of the first character of the Token
         * @param {number} startLine line of the first character of the Token
         * @param {number} startColumn column of the first character of the Token
         * @param {number} endLine line of the last character of the Token
         * @param {number} endColumn column of the last character of the Token
         *
         * Things to note:
         * * "do"  {startColumn : 1, endColumn: 2} --> the range is inclusive to exclusive 1...2 (2 chars long).
         * * "\n"  {startLine : 1, endLine: 1} --> a lineTerminator as the last character does not effect the Token's line numbering.
         * * "'hello\tworld\uBBBB'"  {image: "'hello\tworld\uBBBB'"} --> a Token's image is the "literal" text
         *                                                              (unicode escaping is untouched).
         */
        constructor(image: string, offset: number, startLine: number, startColumn: number, endLine?: number, endColumn?: number);
    }
    /**
     * a special kind of Token which does not really exist in the input
     * (hence the 'Virtual' prefix). These type of Tokens can be used as special markers:
     * for example, EOF (end-of-file).
     */
    class VirtualToken extends Token {
        constructor();
    }
    class EOF extends VirtualToken {
    }

    type TokenConstructor = Function;
    interface ILexingResult {
        tokens: Token[];
        groups: {
            [groupName: string]: Token;
        };
        errors: ILexingError[];
    }
    enum LexerDefinitionErrorType {
        MISSING_PATTERN = 0,
        INVALID_PATTERN = 1,
        EOI_ANCHOR_FOUND = 2,
        UNSUPPORTED_FLAGS_FOUND = 3,
        DUPLICATE_PATTERNS_FOUND = 4,
        INVALID_GROUP_TYPE_FOUND = 5,
    }
    interface ILexerDefinitionError {
        message: string;
        type: LexerDefinitionErrorType;
        tokenClasses: Function[];
    }
    interface ILexingError {
        line: number;
        column: number;
        length: number;
        message: string;
    }
    class Lexer {
        protected tokenClasses: TokenConstructor[];
        static SKIPPED: {
            description: string;
        };
        static NA: RegExp;
        lexerDefinitionErrors: any[];
        protected allPatterns: RegExp[];
        protected patternIdxToClass: Function[];
        protected patternIdxToGroup: boolean[];
        protected patternIdxToLongerAltIdx: number[];
        protected patternIdxToCanLineTerminator: boolean[];
        protected emptyGroups: {
            [groupName: string]: Token;
        };
        /**
         * @param {Function[]} tokenClasses constructor functions for the Tokens types this scanner will support
         *                     These constructors must be in one of three forms:
         *
         *  1. With a PATTERN property that has a RegExp value for tokens to match:
         *     example: -->class Integer extends Token { static PATTERN = /[1-9]\d }<--
         *
         *  2. With a PATTERN property that has a RegExp value AND an IGNORE property with boolean value true.
         *     These tokens will be matched but not as part of the main token vector.
         *     this is usually used for ignoring whitespace/comments
         *     example: -->    class Whitespace extends Token { static PATTERN = /(\t| )/; static IGNORE = true}<--
         *
         *  3. With a PATTERN property that has the value of the var Lexer.NA defined above.
         *     This is a convenience form used to avoid matching Token classes that only act as categories.
         *     example: -->class Keyword extends Token { static PATTERN = NA }<--
         *
         *
         *   The following RegExp patterns are not supported:
         *   a. '$' for match at end of input
         *   b. /b global flag
         *   c. /m multi-line flag
         *
         *   The Lexer will identify the first pattern the matches, Therefor the order of Token Constructors passed
         *   To the SimpleLexer's constructor is meaningful. If two patterns may match the same string, the longer one
         *   should be before the shorter one.
         *
         *   Note that there are situations in which we may wish to place the longer pattern after the shorter one.
         *   For example: keywords vs Identifiers.
         *   'do'(/do/) and 'done'(/w+)
         *
         *   * If the Identifier pattern appears before the 'do' pattern both 'do' and 'done'
         *     will be lexed as an Identifier.
         *
         *   * If the 'do' pattern appears before the Identifier pattern 'do' will be lexed correctly as a keyword.
         *     however 'done' will be lexed as TWO tokens keyword 'do' and identifier 'ne'.
         *
         *   To resolve this problem, add a static property on the keyword's Tokens constructor named: LONGER_ALT
         *   example:
         *
         *       export class Identifier extends Keyword { static PATTERN = /[_a-zA-Z][_a-zA-Z0-9]/ }
         *       export class Keyword extends Token {
         *          static PATTERN = lex.NA
         *          static LONGER_ALT = Identifier
         *       }
         *       export class Do extends Keyword { static PATTERN = /do/ }
         *       export class While extends Keyword { static PATTERN = /while/ }
         *       export class Return extends Keyword { static PATTERN = /return/ }
         *
         *   The lexer will then also attempt to match a (longer) Identifier each time a keyword is matched
         *
         *
         * @param {boolean} [deferDefinitionErrorsHandling=false]
         *                  an optional flag indicating that lexer definition errors
         *                  should not automatically cause an error to be raised.
         *                  This can be useful when wishing to indicate lexer errors in another manner
         *                  than simply throwing an error (for example in an online playground).
         */
        constructor(tokenClasses: TokenConstructor[], deferDefinitionErrorsHandling?: boolean);
        /**
         * Will lex(Tokenize) a string.
         * Note that this can be called repeatedly on different strings as this method
         * does not modify the state of the Lexer.
         *
         * @param {string} text the string to lex
         * @returns {{tokens: {Token}[], errors: string[]}}
         */
        tokenize(text: string): ILexingResult;
    }

    import gast = chevrotain.gast;
    import lang = chevrotain.lang;
    enum ParserDefinitionErrorType {
        INVALID_RULE_NAME = 0,
        DUPLICATE_RULE_NAME = 1,
        DUPLICATE_PRODUCTIONS = 2,
        UNRESOLVED_SUBRULE_REF = 3,
    }
    interface IParserDefinitionError {
        message: string;
        type: ParserDefinitionErrorType;
        ruleName: string;
    }
    interface IParserDuplicatesDefinitionError extends IParserDefinitionError {
        dslName: string;
        occurrence: number;
        parameter?: string;
    }
    interface IParserUnresolvedRefDefinitionError extends IParserDefinitionError {
        unresolvedRefName: string;
    }
    interface IFollowKey {
        ruleName: string;
        idxInCallingRule: number;
        inRule: string;
    }
    /**
     * OR([
     *  { WHEN:LA1, THEN_DO:XXX },
     *  { WHEN:LA2, THEN_DO:YYY },
     *  { WHEN:LA3, THEN_DO:ZZZ },
     * ])
     */
    interface IOrAlt<T> {
        WHEN: () => boolean;
        THEN_DO: () => T;
    }
    /**
     * OR([
     *  {ALT:XXX },
     *  {ALT:YYY },
     *  {ALT:ZZZ }
     * ])
     */
    interface IOrAltImplicit<T> {
        ALT: () => T;
    }
    interface IParserState {
        errors: Error[];
        inputIdx: number;
        RULE_STACK: string[];
    }
    type LookAheadFunc = () => boolean;
    type GrammarAction = () => void;
    /**
     * A Recognizer capable of self analysis to determine it's grammar structure
     * This is used for more advanced features requiring such information.
     * for example: Error Recovery, Automatic lookahead calculation
     */
    class Parser {
        static IGNORE_AMBIGUITIES: boolean;
        static NO_RESYNC: boolean;
        static DEFER_DEFINITION_ERRORS_HANDLING: boolean;
        protected static performSelfAnalysis(classInstance: Parser): void;
        errors: Error[];
        protected _input: Token[];
        protected inputIdx: number;
        protected isBackTrackingStack: any[];
        protected className: string;
        protected RULE_STACK: string[];
        protected RULE_OCCURRENCE_STACK: number[];
        protected tokensMap: {
            [fqn: string]: Function;
        };
        private firstAfterRepMap;
        private classLAFuncs;
        private definitionErrors;
        private orLookaheadKeys;
        private manyLookaheadKeys;
        private manySepLookaheadKeys;
        private atLeastOneSepLookaheadKeys;
        private atLeastOneLookaheadKeys;
        private optionLookaheadKeys;
        private definedRulesNames;
        constructor(input: Token[], tokensMapOrArr: {
            [fqn: string]: Function;
        } | Function[]);
        input: Token[];
        reset(): void;
        isAtEndOfInput(): boolean;
        getGAstProductions(): lang.HashTable<gast.Rule>;
        protected isBackTracking(): boolean;
        protected SAVE_ERROR(error: Error): Error;
        protected NEXT_TOKEN(): Token;
        protected LA(howMuch: number): Token;
        protected isNextRule<T>(ruleName: string): boolean;
        /**
         *
         * @param grammarRule the rule to try and parse in backtracking mode
         * @param isValid a predicate that given the result of the parse attempt will "decide" if the parse was successfully or not
         * @return a lookahead function that will try to parse the given grammarRule and will return true if succeed
         */
        protected BACKTRACK<T>(grammarRule: (...args) => T, isValid: (T) => boolean): () => boolean;
        protected SKIP_TOKEN(): Token;
        /**
         * Convenience method equivalent to CONSUME1
         * @see CONSUME1
         */
        protected CONSUME(tokClass: Function): Token;
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
        protected CONSUME1(tokClass: Function): Token;
        /**
         * @see CONSUME1
         */
        protected CONSUME2(tokClass: Function): Token;
        /**
         * @see CONSUME1
         */
        protected CONSUME3(tokClass: Function): Token;
        /**
         * @see CONSUME1
         */
        protected CONSUME4(tokClass: Function): Token;
        /**
         * @see CONSUME1
         */
        protected CONSUME5(tokClass: Function): Token;
        /**
         * Convenience method equivalent to SUBRULE1
         * @see SUBRULE1
         */
        protected SUBRULE<T>(ruleToCall: (number) => T, args?: any[]): T;
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
        protected SUBRULE1<T>(ruleToCall: (number) => T, args?: any[]): T;
        /**
         * @see SUBRULE1
         */
        protected SUBRULE2<T>(ruleToCall: (number) => T, args?: any[]): T;
        /**
         * @see SUBRULE1
         */
        protected SUBRULE3<T>(ruleToCall: (number) => T, args?: any[]): T;
        /**
         * @see SUBRULE1
         */
        protected SUBRULE4<T>(ruleToCall: (number) => T, args?: any[]): T;
        /**
         * @see SUBRULE1
         */
        protected SUBRULE5<T>(ruleToCall: (number) => T, args?: any[]): T;
        /**
         * Convenience method equivalent to OPTION1
         * @see OPTION1
         */
        protected OPTION(laFuncOrAction: LookAheadFunc | GrammarAction, action?: GrammarAction): boolean;
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
        protected OPTION1(laFuncOrAction: LookAheadFunc | GrammarAction, action?: GrammarAction): boolean;
        /**
         * @see OPTION1
         */
        protected OPTION2(laFuncOrAction: LookAheadFunc | GrammarAction, action?: GrammarAction): boolean;
        /**
         * @see OPTION1
         */
        protected OPTION3(laFuncOrAction: LookAheadFunc | GrammarAction, action?: GrammarAction): boolean;
        /**
         * @see OPTION1
         */
        protected OPTION4(laFuncOrAction: LookAheadFunc | GrammarAction, action?: GrammarAction): boolean;
        /**
         * @see OPTION1
         */
        protected OPTION5(laFuncOrAction: LookAheadFunc | GrammarAction, action?: GrammarAction): boolean;
        /**
         * Convenience method equivalent to OR1
         * @see OR1
         */
        protected OR<T>(alts: IOrAlt<T>[] | IOrAltImplicit<T>[], errMsgTypes: string, ignoreAmbiguities?: boolean): T;
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
        protected OR1<T>(alts: IOrAlt<T>[] | IOrAltImplicit<T>[], errMsgTypes: string, ignoreAmbiguities?: boolean): T;
        /**
         * @see OR1
         */
        protected OR2<T>(alts: IOrAlt<T>[] | IOrAltImplicit<T>[], errMsgTypes: string, ignoreAmbiguities?: boolean): T;
        /**
         * @see OR1
         */
        protected OR3<T>(alts: IOrAlt<T>[] | IOrAltImplicit<T>[], errMsgTypes: string, ignoreAmbiguities?: boolean): T;
        /**
         * @see OR1
         */
        protected OR4<T>(alts: IOrAlt<T>[] | IOrAltImplicit<T>[], errMsgTypes: string, ignoreAmbiguities?: boolean): T;
        /**
         * @see OR1
         */
        protected OR5<T>(alts: IOrAlt<T>[] | IOrAltImplicit<T>[], errMsgTypes: string, ignoreAmbiguities?: boolean): T;
        /**
         * Convenience method equivalent to MANY1
         * @see MANY1
         */
        protected MANY(laFuncOrAction: LookAheadFunc | GrammarAction, action?: GrammarAction): void;
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
        protected MANY1(laFuncOrAction: LookAheadFunc | GrammarAction, action?: GrammarAction): void;
        /**
         * @see MANY1
         */
        protected MANY2(laFuncOrAction: LookAheadFunc | GrammarAction, action?: GrammarAction): void;
        /**
         * @see MANY1
         */
        protected MANY3(laFuncOrAction: LookAheadFunc | GrammarAction, action?: GrammarAction): void;
        /**
         * @see MANY1
         */
        protected MANY4(laFuncOrAction: LookAheadFunc | GrammarAction, action?: GrammarAction): void;
        /**
         * @see MANY1
         */
        protected MANY5(laFuncOrAction: LookAheadFunc | GrammarAction, action?: GrammarAction): void;
        /**
         * Convenience method equivalent to MANY_SEP1
         * @see MANY_SEP1
         */
        protected MANY_SEP(separator: TokenConstructor, laFuncOrAction: LookAheadFunc | GrammarAction, action?: GrammarAction): Token[];
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
        protected MANY_SEP1(separator: TokenConstructor, laFuncOrAction: LookAheadFunc | GrammarAction, action?: GrammarAction): Token[];
        /**
         * @see MANY_SEP1
         */
        protected MANY_SEP2(separator: TokenConstructor, laFuncOrAction: LookAheadFunc | GrammarAction, action?: GrammarAction): Token[];
        /**
         * @see MANY_SEP1
         */
        protected MANY_SEP3(separator: TokenConstructor, laFuncOrAction: LookAheadFunc | GrammarAction, action?: GrammarAction): Token[];
        /**
         * @see MANY_SEP1
         */
        protected MANY_SEP4(separator: TokenConstructor, laFuncOrAction: LookAheadFunc | GrammarAction, action?: GrammarAction): Token[];
        /**
         * @see MANY_SEP1
         */
        protected MANY_SEP5(separator: TokenConstructor, laFuncOrAction: LookAheadFunc | GrammarAction, action?: GrammarAction): Token[];
        /**
         * Convenience method equivalent to AT_LEAST_ONE1
         * @see AT_LEAST_ONE1
         */
        protected AT_LEAST_ONE(laFuncOrAction: LookAheadFunc | GrammarAction, action: GrammarAction | string, errMsg?: string): void;
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
        protected AT_LEAST_ONE1(laFuncOrAction: LookAheadFunc | GrammarAction, action: GrammarAction | string, errMsg?: string): void;
        /**
         * @see AT_LEAST_ONE1
         */
        protected AT_LEAST_ONE2(laFuncOrAction: LookAheadFunc | GrammarAction, action: GrammarAction | string, errMsg?: string): void;
        /**
         * @see AT_LEAST_ONE1
         */
        protected AT_LEAST_ONE3(laFuncOrAction: LookAheadFunc | GrammarAction, action: GrammarAction | string, errMsg?: string): void;
        /**
         * @see AT_LEAST_ONE1
         */
        protected AT_LEAST_ONE4(laFuncOrAction: LookAheadFunc | GrammarAction, action: GrammarAction | string, errMsg?: string): void;
        /**
         * @see AT_LEAST_ONE1
         */
        protected AT_LEAST_ONE5(laFuncOrAction: LookAheadFunc | GrammarAction, action: GrammarAction | string, errMsg?: string): void;
        /**
         * Convenience method equivalent to AT_LEAST_ONE_SEP1
         * @see AT_LEAST_ONE1
         */
        protected AT_LEAST_ONE_SEP(separator: TokenConstructor, laFuncOrAction: LookAheadFunc | GrammarAction, action: GrammarAction | string, errMsg?: string): Token[];
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
        protected AT_LEAST_ONE_SEP1(separator: TokenConstructor, laFuncOrAction: LookAheadFunc | GrammarAction, action: GrammarAction | string, errMsg?: string): Token[];
        /**
         * @see AT_LEAST_ONE_SEP1
         */
        protected AT_LEAST_ONE_SEP2(separator: TokenConstructor, laFuncOrAction: LookAheadFunc | GrammarAction, action: GrammarAction | string, errMsg?: string): Token[];
        /**
         * @see AT_LEAST_ONE_SEP1
         */
        protected AT_LEAST_ONE_SEP3(separator: TokenConstructor, laFuncOrAction: LookAheadFunc | GrammarAction, action: GrammarAction | string, errMsg?: string): Token[];
        /**
         * @see AT_LEAST_ONE_SEP1
         */
        protected AT_LEAST_ONE_SEP4(separator: TokenConstructor, laFuncOrAction: LookAheadFunc | GrammarAction, action: GrammarAction | string, errMsg?: string): Token[];
        /**
         * @see AT_LEAST_ONE_SEP1
         */
        protected AT_LEAST_ONE_SEP5(separator: TokenConstructor, laFuncOrAction: LookAheadFunc | GrammarAction, action: GrammarAction | string, errMsg?: string): Token[];
        /**
         * Convenience method, same as RULE with doReSync=false
         * @see RULE
         */
        protected RULE_NO_RESYNC<T>(ruleName: string, impl: () => T, invalidRet: () => T): (idxInCallingRule: number, isEntryPoint?: boolean) => T;
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
        protected RULE<T>(ruleName: string, impl: (...implArgs: any[]) => T, invalidRet?: () => T, doReSync?: boolean): (idxInCallingRule?: number, ...args: any[]) => T;
        protected ruleInvocationStateUpdate(ruleName: string, idxInCallingRule: number): void;
        protected ruleFinallyStateUpdate(): void;
        protected getTokenToInsert(tokClass: Function): Token;
        protected canTokenTypeBeInsertedInRecovery(tokClass: Function): boolean;
        private defaultInvalidReturn();
        private tryInRepetitionRecovery(grammarRule, grammarRuleArgs, lookAheadFunc, expectedTokType);
        private shouldInRepetitionRecoveryBeTried(expectTokAfterLastMatch?, nextTokIdx?);
        private getFollowsForInRuleRecovery(tokClass, tokIdxInRule);
        private tryInRuleRecovery(expectedTokType, follows);
        private canPerformInRuleRecovery(expectedToken, follows);
        private canRecoverWithSingleTokenInsertion(expectedTokType, follows);
        private canRecoverWithSingleTokenDeletion(expectedTokType);
        private isInCurrentRuleReSyncSet(token);
        private findReSyncTokenType();
        private getCurrFollowKey();
        private buildFullFollowKeyStack();
        private flattenFollowSet();
        private getFollowSetFromFollowKey(followKey);
        private reSyncTo(tokClass);
        private attemptInRepetitionRecovery(prodFunc, args, lookaheadFunc, prodName, prodOccurrence, nextToksWalker, prodKeys);
        private optionInternal(condition, action);
        private atLeastOneInternal(prodFunc, prodName, prodOccurrence, lookAheadFunc, action, errMsg?);
        private atLeastOneSepFirstInternal(prodFunc, prodName, prodOccurrence, separator, firstIterationLookAheadFunc, action, errMsg?);
        private manyInternal(prodFunc, prodName, prodOccurrence, lookAheadFunc, action?);
        private manySepFirstInternal(prodFunc, prodName, prodOccurrence, separator, firstIterationLookAheadFunc, action?);
        private repetitionSepSecondInternal(prodName, prodOccurrence, separator, separatorLookAheadFunc, action, separatorsResult, laKeys, nextTerminalAfterWalker);
        private orInternal<T>(alts, errMsgTypes, occurrence, ignoreAmbiguities);
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
        private consumeInternal(tokClass, idx);
        private consumeInternalOptimized(tokClass);
        private getKeyForAutomaticLookahead(prodName, prodKeys, occurrence);
        private getLookaheadFuncForOption(occurence);
        private getLookaheadFuncForOr(occurence, ignoreErrors);
        private getLookaheadFuncForMany(occurence);
        private getLookaheadFuncForManySep(occurence);
        private getLookaheadFuncForAtLeastOne(occurence);
        private getLookaheadFuncForAtLeastOneSep(occurence);
        private getLookaheadFuncFor<T>(key, occurrence, laFuncBuilder, extraArgs?);
        private saveRecogState();
        private reloadRecogState(newState);
        private raiseNoAltException(errMsgTypes);
    }

	module exceptions {
    	function isRecognitionException(error: Error): boolean;
    	function MismatchedTokenException(message: string, token: Token): void;
    	function NoViableAltException(message: string, token: Token): void;
    	function NotAllInputParsedException(message: string, token: Token): void;
    	function EarlyExitException(message: string, token: Token): void;
	}
	

	module gast {
    	interface IProduction {
        	accept(visitor: GAstVisitor): void;
    	}
    	interface IProductionWithOccurrence extends IProduction {
        	occurrenceInParent: number;
        	implicitOccurrenceIndex: boolean;
    	}
    	class AbstractProduction implements IProduction {
        	definition: IProduction[];
        	implicitOccurrenceIndex: boolean;
        	constructor(definition: IProduction[]);
        	accept(visitor: GAstVisitor): void;
    	}
    	class NonTerminal extends AbstractProduction implements IProductionWithOccurrence {
        	nonTerminalName: string;
        	referencedRule: Rule;
        	occurrenceInParent: number;
        	constructor(nonTerminalName: string, referencedRule?: Rule, occurrenceInParent?: number);
        	definition: IProduction[];
        	accept(visitor: GAstVisitor): void;
    	}
    	class Rule extends AbstractProduction {
        	name: string;
        	orgText: string;
        	constructor(name: string, definition: IProduction[], orgText?: string);
    	}
    	class Flat extends AbstractProduction {
        	constructor(definition: IProduction[]);
    	}
    	class Option extends AbstractProduction implements IProductionWithOccurrence {
        	occurrenceInParent: number;
        	constructor(definition: IProduction[], occurrenceInParent?: number);
    	}
    	class RepetitionMandatory extends AbstractProduction implements IProductionWithOccurrence {
        	occurrenceInParent: number;
        	constructor(definition: IProduction[], occurrenceInParent?: number);
    	}
    	class RepetitionMandatoryWithSeparator extends AbstractProduction implements IProductionWithOccurrence {
        	separator: Function;
        	occurrenceInParent: number;
        	constructor(definition: IProduction[], separator: Function, occurrenceInParent?: number);
    	}
    	class Repetition extends AbstractProduction implements IProductionWithOccurrence {
        	occurrenceInParent: number;
        	constructor(definition: IProduction[], occurrenceInParent?: number);
    	}
    	class RepetitionWithSeparator extends AbstractProduction implements IProductionWithOccurrence {
        	separator: Function;
        	occurrenceInParent: number;
        	constructor(definition: IProduction[], separator: Function, occurrenceInParent?: number);
    	}
    	class Alternation extends AbstractProduction implements IProductionWithOccurrence {
        	occurrenceInParent: number;
        	constructor(definition: IProduction[], occurrenceInParent?: number);
    	}
    	class Terminal implements IProductionWithOccurrence {
        	terminalType: Function;
        	occurrenceInParent: number;
        	implicitOccurrenceIndex: boolean;
        	constructor(terminalType: Function, occurrenceInParent?: number);
        	accept(visitor: GAstVisitor): void;
    	}
    	class GAstVisitor {
        	visit(node: IProduction): void;
        	visitNonTerminal(node: NonTerminal): void;
        	visitFlat(node: Flat): void;
        	visitOption(node: Option): void;
        	visitRepetition(node: Repetition): void;
        	visitRepetitionMandatory(node: RepetitionMandatory): void;
        	visitRepetitionMandatoryWithSeparator(node: RepetitionMandatoryWithSeparator): void;
        	visitRepetitionWithSeparator(node: RepetitionWithSeparator): void;
        	visitAlternation(node: Alternation): void;
        	visitTerminal(node: Terminal): void;
    	}
	}
	
}