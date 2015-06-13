/// <reference path="../../src/parse/recognizer.ts" />
/// <reference path="../../src/scan/tokens.ts" />
/// <reference path="../../src/parse/parse_tree.ts" />
/// <reference path="../../src/scan/lexer.ts" />

module chevrotain.examples.ecma5 {

    import recog = chevrotain.recognizer
    import tok = chevrotain.tokens
    import PT = chevrotain.tree.PT
    import ParseTree = chevrotain.tree.ParseTree

    // TODO: in Typescript 1.5 use const
    var DISABLE_SEMICOLON_INSERTION = false
    var ENABLE_SEMICOLON_INSERTION = true

    function isSingleOperandExp(binExpParts:chevrotain.tree.ParseTree[]):boolean {
        return binExpParts.length === 1
    }

    // as defined in http://www.ecma-international.org/publications/standards/Ecma-262.htm
    export class ECMAScript5Parser extends recog.BaseIntrospectionRecognizer {

        /*
         * overridden to always enable re-sync and the creation of InvalidRetFunction from Virtual Token class.
         */
        protected RULE<T>(ruleName:string,
                          impl:(...implArgs:any[]) => T,
                          invalidVirtualClass:tok.VirtualTokenClass,
                          doResync = true):(idxInCallingRule?:number, ...args:any[]) => T {
            var invalidRet:any = function () { return PT(new (<any>invalidVirtualClass)()) }
            return super.RULE(ruleName, impl, invalidRet, doResync)
        }

        /**
         *
         * @param {Token[]} input
         *    The "meaningful" Token stream without the LineTerminator Tokens.
         *    this includes everything that modify the parser's behavior.
         *    excluding the line terminators (which are meaningful in some edge cases)
         *
         * @param {Object<number, LineTerminator>} lineTerminatorsInfo
         *    This adds the missing information about LineTerminators.
         *    lineTerminatorsInfo[x] is an AbsLineTerminator instance IFF
         *    in the "complete" meaningful token input vector there is an AbsLineTerminator instance
         *    in the index 'x'.
         *
         *    example:
         *    text = "throw \r\n new NaughtyException(....)
         *    input = [Token('throw'), Token('new'), Token('NaughtyException'), ...]
         *    lineTerminatorsInfo = {
         *          "1" : AbsLineTerminator("\r\n")
         *    }
         */
        constructor(input:tok.Token[] = [], protected lineTerminatorsInfo:lexer.IdxToLineTerminator = {}) {
            super(input, <any>chevrotain.examples.ecma5)
            ECMAScript5Parser.performSelfAnalysis(this)
        }

        protected isNextLineTerminator():boolean {
            var nextLT = this.lineTerminatorsInfo[this.inputIdx + 1]
            return nextLT instanceof LineTerminator ||
                nextLT instanceof MultipleLineCommentWithTerminator
        }

        protected nextLineTerminator():LineTerminator {
            return this.lineTerminatorsInfo[this.inputIdx + 1]
        }

        protected canTokenTypeBeInsertedInRecovery(tokClass:Function) {
            var tokInstance = new (<any>tokClass)()
            // Literals and Identifiers tokens carry additional information.
            // Thus inserting them automatically can cause other errors "down the line"
            // for example, inserting a variable Identifier may cause duplicate identifiers,
            // or inserting a number literal may cause division by zero.
            // thus in these cases the parser avoids automatic single token insertion.
            return !(tokInstance instanceof AbsLiteral || tokInstance instanceof Identifier)
        }

        /*
         * Link http://www.ecma-international.org/ecma-262/5.1/#sec-7.9.1
         * Automatic semicolon insertion implementation.
         * The spec defines the insertion in terms of encountering an "offending"
         * token and then inserting a semicolon under one of three basic rules.
         * 1. Offending token is after a lineTerminator.
         * 2. Offending token is a '}' RCurly.
         * 3. Reached EOF but failed to parse a complete ECMAScript Program.
         *
         * In addition there are two overriding conditions on these rules.
         * 1. do not insert if the semicolon would then be parsed as an empty statement.
         * 2. do not If that semicolon would become one of the two semicolons in the header of a for statement.
         *
         * The implementation approaches this problem in a slightly different but equivalent approach:
         *
         * anytime a semicolon should be consumed AND
         * the nextToken is not a semicolon AND
         * the context is one that allows semicolon insertion (not in a for header or empty Statement) AND
         * one of the 3 basic rules match
         * ---------------------------------->
         * THEN insert a semicolon
         *
         * Note that the context information is passed as the 'trySemiColonInsertion' argument
         * to the CONSUME parsing DSL method
         */
        protected canAndShouldDoSemiColonInsertion():boolean {
            var isNextTokenSemiColon = this.NEXT_TOKEN() instanceof Semicolon
            return !isNextTokenSemiColon &&
                (this.isNextLineTerminator() || // basic rule 1a and 3
                this.NEXT_TOKEN() instanceof RCurly || // basic rule 1b
                this.NEXT_TOKEN() instanceof recog.EOF)  // basic rule 2
        }

        protected CONSUME(tokClass:Function, trySemiColonInsertion = false):tok.Token {
            if (trySemiColonInsertion && this.canAndShouldDoSemiColonInsertion()) {
                var insertedSemiColon = new Semicolon(";", -1, -1, -1)
                insertedSemiColon.isAutomaticSemiColonInsertion = true
                return insertedSemiColon
            }
            return super.CONSUME1(tokClass)
        }

        protected CONSUME2(tokClass:Function, trySemiColonInsertion = false):tok.Token {
            if (trySemiColonInsertion && this.canAndShouldDoSemiColonInsertion()) {
                var insertedSemiColon = new Semicolon(";", -1, -1, -1)
                insertedSemiColon.isAutomaticSemiColonInsertion = true
                return insertedSemiColon
            }
            return super.CONSUME2(tokClass)
        }

        // A.3 Expressions

        // See 11.1
        public PrimaryExpression = this.RULE("PrimaryExpression", () => {
            return this.OR([
                {ALT: () => { return PT(this.CONSUME(ThisTok)) }},
                {ALT: () => { return PT(this.CONSUME(Identifier)) }},
                {ALT: () => { return PT(this.CONSUME(AbsLiteral)) }},
                {ALT: () => { return this.SUBRULE(this.ArrayLiteral) }},
                {ALT: () => { return this.SUBRULE(this.ObjectLiteral) }},
                {ALT: () => { return this.SUBRULE(this.ParenthesisExpression)}},
            ], "'this', Identifier, Literal or parenthesis expression")
        }, InvalidPrimaryExpression)


        protected ParenthesisExpression = this.RULE("ParenthesisExpression", () => {
            var exp

            this.CONSUME(LParen)
            exp = this.SUBRULE(this.Expression)
            this.CONSUME(RParen)

            return PT(ParenthesisExpression, exp)
        }, InvalidParenthesisExpression)


        // See 11.1.4
        public ArrayLiteral = this.RULE("ArrayLiteral", () => {
            var elements = []

            this.CONSUME(LBracket)
            this.MANY(() => {
                this.OR([ // TODO: fix ambiguities with commas
                    {ALT: () => { elements.push(this.SUBRULE(this.ElementList)) }},
                    {ALT: () => { elements.push(this.SUBRULE(this.Elision)) }}
                ], "expression or comma")
            })
            this.CONSUME(RBracket)

            return PT(ArrayLiteral, elements)
        }, InvalidArrayLiteral)


        // See 11.1.4
        public ElementList = this.RULE("ElementList", () => {
            var elements = []

            // in the spec this may start with an optional Elision,
            // this create an ambiguity in the ArrayLiteral rule.
            // removing the Elision from this here does not modify the grammar
            // as the ElementList rule is only invoked from ArrayLiteral rule
            elements.push(this.SUBRULE(this.AssignmentExpression))
            this.MANY(() => {
                elements.push(this.SUBRULE2(this.Elision))
                elements.push(this.SUBRULE2(this.AssignmentExpression))
            })

            return PT(ElementList, elements)
        }, InvalidElementList)


        // See 11.1.4
        public Elision = this.RULE("Elision", () => {
            var commas = []
            this.AT_LEAST_ONE(() => {
                commas.push(PT(this.CONSUME(Comma)))
            }, "a comma")

            return PT(Elision, commas)
        }, InvalidElision)


        // See 11.1.5
        // this inlines PropertyNameAndValueList
        public ObjectLiteral = this.RULE("ObjectLiteral", () => {
            var props = []

            this.CONSUME(LCurly)
            this.OPTION(() => {
                props.push(this.SUBRULE(this.PropertyAssignment))
                this.MANY(() => {
                    this.CONSUME(Comma)
                    props.push(this.SUBRULE2(this.PropertyAssignment))
                })
                this.OPTION2(() => {
                    this.CONSUME2(Comma)
                })
            })
            this.CONSUME(RCurly)

            return PT(ObjectLiteral, props)
        }, InvalidObjectLiteral)


        // See 11.1.5
        public PropertyAssignment = this.RULE("PropertyAssignment", () => {
            return this.OR([
                {ALT: () => { return this.SUBRULE(this.RegularPropertyAssignment) }},
                {ALT: () => { return this.SUBRULE(this.GetPropertyAssignment) }},
                {ALT: () => { return this.SUBRULE(this.SetPropertyAssignment) }},
            ], "a property assignment")
            // @formatter:on
        }, InvalidPropertyAssignment)


        protected RegularPropertyAssignment = this.RULE("RegularPropertyAssignment", () => {
            var name, value

            name = this.SUBRULE(this.PropertyName)
            this.CONSUME(Colon)
            value = this.SUBRULE(this.AssignmentExpression)

            return PT(RegularPropertyAssignment, [name, value])
        }, InvalidRegularPropertyAssignment)


        protected GetPropertyAssignment = this.RULE("GetPropertyAssignment", () => {
            var name, value

            this.CONSUME(GetTok)
            name = this.SUBRULE(this.PropertyName)
            this.CONSUME(LParen)
            this.CONSUME(RParen)
            this.CONSUME(LCurly)
            value = this.SUBRULE(this.SourceElements) // FunctionBody(clause 13) is equivalent to SourceElements
            this.CONSUME(RCurly)

            return PT(GetPropertyAssignment, [name, value])
        }, InvalidGetPropertyAssignment)


        protected SetPropertyAssignment = this.RULE("SetPropertyAssignment", () => {
            var name, value

            this.CONSUME(SetTok)
            name = this.SUBRULE(this.PropertyName)
            this.CONSUME2(LParen)
            this.CONSUME(Identifier)
            this.CONSUME(RParen)
            this.CONSUME(LCurly)
            value = this.SUBRULE(this.SourceElements) // FunctionBody(clause 13) is equivalent to SourceElements
            this.CONSUME(RCurly)

            return PT(SetPropertyAssignment, [name, value])
        }, InvalidSetPropertyAssignment)


        // See 11.1.5
        // this inlines PropertySetParameterList
        public PropertyName = this.RULE("PropertyName", () => {
            var propNameTok = undefined

            this.OR([
                {ALT: () => { propNameTok = this.CONSUME(IdentifierName) }},
                {ALT: () => { propNameTok = this.CONSUME(AbsStringLiteral) }},
                {ALT: () => { propNameTok = this.CONSUME(AbsNumericLiteral) }}
            ], "Property name")

            return PT(PropertyName, [PT(propNameTok)])
        }, InvalidPropertyName)


        // See 11.2
        // merging MemberExpression, NewExpression and CallExpression into one rule
        public MemberCallNewExpression = this.RULE("MemberCallNewExpression", () => {
            var newPts = [], exp = undefined, memberCallParts = []

            this.MANY(() => {
                newPts.push(PT(this.CONSUME(NewTok)))
            })

            this.OR([
                {ALT: () => { exp = this.SUBRULE(this.PrimaryExpression) }},
                {ALT: () => { exp = this.SUBRULE(this.FunctionExpression) }}
            ], "expression or comma")

            this.MANY2(() => {
                this.OR2([
                    {ALT: () => { memberCallParts.push(this.SUBRULE(this.BoxMemberExpression)) }},
                    {ALT: () => { memberCallParts.push(this.SUBRULE(this.DotMemberExpression)) }},
                    {ALT: () => { memberCallParts.push(this.SUBRULE(this.Arguments)) }}
                ], "property access or arguments")
            })

            return PT(MemberCallNewExpression, newPts.concat([exp], memberCallParts))
        }, InvalidMemberCallNewExpression)


        protected BoxMemberExpression = this.RULE("BoxMemberExpression", () => {
            var exp

            this.CONSUME(LBracket)
            exp = this.SUBRULE(this.Expression)
            this.CONSUME(RBracket)

            return PT(BoxMemberExpression, [exp])
        }, InvalidBoxMemberExpression)


        protected DotMemberExpression = this.RULE("DotMemberExpression", () => {
            var ident

            this.CONSUME(Dot)
            ident = this.CONSUME(IdentifierName)

            return PT(DotMemberExpression, [PT(ident)])
        }, InvalidDotMemberExpression)


        // See 11.2
        // this inlines ArgumentList
        public Arguments = this.RULE("Arguments", () => {
            var args = []

            this.CONSUME(LParen)
            this.OPTION(() => {
                args.push(this.SUBRULE(this.AssignmentExpression))
                this.MANY(() => {
                    this.CONSUME(Comma)
                    args.push(this.SUBRULE2(this.AssignmentExpression))
                })
            })
            this.CONSUME(RParen)

            return PT(Arguments, args)
        }, InvalidArguments)


        protected isPostFixExp():boolean {
            return !this.isNextLineTerminator() && // [no LineTerminator here]
                this.NEXT_TOKEN() instanceof PlusPlus ||
                this.NEXT_TOKEN() instanceof MinusMinus
        }


        // See 11.3
        public PostfixExpression = this.RULE("PostfixExpression", () => {
            var exp, operator = undefined

            exp = this.SUBRULE(this.MemberCallNewExpression) // LHSExpression(see 11.2) is identical to MemberCallNewExpression
            this.OPTION(this.isPostFixExp, () => {
                this.OR([
                    {ALT: () => { operator = this.CONSUME(PlusPlus) }},
                    {ALT: () => { operator = this.CONSUME(MinusMinus) }}
                ], "++ or --")
            })

            return operator ? PT(PostfixExpression, [PT(operator), exp]) : exp
        }, InvalidPostfixExpression)


        // See 11.4
        public UnaryExpression = this.RULE("UnaryExpression", () => {
            var exp = undefined, operator = undefined

            // @formatter:off
            this.OR([
                {ALT: () => { exp = this.SUBRULE(this.PostfixExpression) }},
                {ALT: () => {
                    this.OR2([
                        {ALT: () => { operator = this.CONSUME(DeleteTok) }},
                        {ALT: () => { operator = this.CONSUME(VoidTok) }},
                        {ALT: () => { operator = this.CONSUME(TypeOfTok) }},
                        {ALT: () => { operator = this.CONSUME(PlusPlus) }},
                        {ALT: () => { operator = this.CONSUME(MinusMinus) }},
                        {ALT: () => { operator = this.CONSUME(Plus) }},
                        {ALT: () => { operator = this.CONSUME(Minus) }},
                        {ALT: () => { operator = this.CONSUME(Tilde) }},
                        {ALT: () => { operator = this.CONSUME(Exclamation) }}
                    ], "")
                    exp = this.SUBRULE(this.UnaryExpression)
                }},
            ], "PostFixExpression or UnaryExpression")
            // @formatter:on

            return operator ? PT(UnaryExpression, [exp, PT(operator)]) : exp
        }, InvalidUnaryExpression)


        // See 11.5
        public MultiplicativeExpression = this.RULE("MultiplicativeExpression", () => {
            var binExpParts = []

            binExpParts.push(this.SUBRULE(this.UnaryExpression))
            this.MANY(() => {
                binExpParts.push(PT(this.CONSUME(AbsMultiplicativeOperator)))
                binExpParts.push(this.SUBRULE2(this.UnaryExpression))
            })

            return isSingleOperandExp(binExpParts) ? _.first(binExpParts) :
                PT(MultiplicativeExpression, binExpParts)
        }, InvalidMultiplicativeExpression)


        // See 11.6
        public AdditiveExpression = this.RULE("AdditiveExpression", () => {
            var binExpParts = []

            binExpParts.push(this.SUBRULE(this.MultiplicativeExpression))
            this.MANY(() => {
                binExpParts.push(PT(this.CONSUME(AbsAdditiveOperator)))
                binExpParts.push(this.SUBRULE2(this.MultiplicativeExpression))
            })

            return isSingleOperandExp(binExpParts) ? _.first(binExpParts) :
                PT(AdditiveExpression, binExpParts)
        }, InvalidAdditiveExpression)


        // See 11.7
        public ShiftExpression = this.RULE("ShiftExpression", () => {
            var binExpParts = []

            binExpParts.push(this.SUBRULE(this.AdditiveExpression))
            this.MANY(() => {
                binExpParts.push(PT(this.CONSUME(AbsShiftOperator)))
                binExpParts.push(this.SUBRULE2(this.AdditiveExpression))
            })

            return isSingleOperandExp(binExpParts) ? _.first(binExpParts) :
                PT(ShiftExpression, binExpParts)
        }, InvalidShiftExpression)


        // See 11.8
        public RelationalExpression = this.RULE("RelationalExpression", () => {
            var binExpParts = []

            binExpParts.push(this.SUBRULE(this.ShiftExpression))
            this.MANY(() => {
                this.OR([
                    {ALT: () => { binExpParts.push(PT(this.CONSUME(AbsRelationalOperator))) }},
                    {ALT: () => { binExpParts.push(PT(this.CONSUME(InstanceOfTok))) }},
                    {ALT: () => { binExpParts.push(PT(this.CONSUME(InTok))) }}
                ], "a Relational operator")
                binExpParts.push(this.SUBRULE2(this.ShiftExpression))
            })

            return isSingleOperandExp(binExpParts) ? _.first(binExpParts) :
                PT(RelationalExpression, binExpParts)
        }, InvalidRelationalExpression)


        // See 11.8
        public RelationalExpressionNoIn = this.RULE("RelationalExpressionNoIn", () => {
            var binExpParts = []

            binExpParts.push(this.SUBRULE(this.ShiftExpression))
            this.MANY(() => {
                this.OR([
                    {ALT: () => { binExpParts.push(PT(this.CONSUME(AbsRelationalOperator))) }},
                    {ALT: () => { binExpParts.push(PT(this.CONSUME(InstanceOfTok))) }},
                ], "a Relational operator excluding 'in'")
                binExpParts.push(this.SUBRULE2(this.ShiftExpression))
            })

            return isSingleOperandExp(binExpParts) ? _.first(binExpParts) :
                PT(RelationalExpression, binExpParts)
        }, InvalidRelationalExpressionNoIn)


        // See 11.9
        public EqualityExpression = this.RULE("EqualityExpression", () => {
            var binExpParts = []

            binExpParts.push(this.SUBRULE(this.RelationalExpression))
            this.MANY(() => {
                binExpParts.push(PT(this.CONSUME(AbsEqualityOperator)))
                binExpParts.push(this.SUBRULE2(this.RelationalExpression))
            })

            return isSingleOperandExp(binExpParts) ? _.first(binExpParts) :
                PT(EqualityExpression, binExpParts)
        }, InvalidEqualityExpression)


        // See 11.9
        public EqualityExpressionNoIn = this.RULE("EqualityExpressionNoIn", () => {
            var binExpParts = []

            binExpParts.push(this.SUBRULE(this.RelationalExpressionNoIn))
            this.MANY(() => {
                binExpParts.push(PT(this.CONSUME(AbsEqualityOperator)))
                binExpParts.push(this.SUBRULE2(this.RelationalExpressionNoIn))
            })

            return isSingleOperandExp(binExpParts) ? _.first(binExpParts) :
                PT(EqualityExpression, binExpParts)
        }, InvalidEqualityExpressionNoIn)


        // See 11.10
        public BitwiseANDExpression = this.RULE("BitwiseANDExpression", () => {
            var binExpParts = []

            binExpParts.push(this.SUBRULE(this.EqualityExpression))
            this.MANY(() => {
                binExpParts.push(PT(this.CONSUME(Ampersand)))
                binExpParts.push(this.SUBRULE2(this.EqualityExpression))
            })

            return isSingleOperandExp(binExpParts) ? _.first(binExpParts) :
                PT(BitwiseANDExpression, binExpParts)
        }, InvalidBitwiseANDExpression)


        // See 11.10
        public BitwiseANDExpressionNoIn = this.RULE("BitwiseANDExpressionNoIn", () => {
            var binExpParts = []

            binExpParts.push(this.SUBRULE(this.EqualityExpressionNoIn))
            this.MANY(() => {
                binExpParts.push(PT(this.CONSUME(Ampersand)))
                binExpParts.push(this.SUBRULE2(this.EqualityExpressionNoIn))
            })

            return isSingleOperandExp(binExpParts) ? _.first(binExpParts) :
                PT(BitwiseANDExpression, binExpParts)
        }, InvalidBitwiseANDExpressionNoIn)


        // See 11.10
        public BitwiseXORExpression = this.RULE("BitwiseXORExpression", () => {
            var binExpParts = []

            binExpParts.push(this.SUBRULE(this.BitwiseANDExpression))
            this.MANY(() => {
                binExpParts.push(PT(this.CONSUME(Circumflex)))
                binExpParts.push(this.SUBRULE2(this.BitwiseANDExpression))
            })

            return isSingleOperandExp(binExpParts) ? _.first(binExpParts) :
                PT(BitwiseXORExpression, binExpParts)
        }, InvalidBitwiseXORExpression)


        // See 11.10
        public BitwiseXORExpressionNoIn = this.RULE("BitwiseXORExpressionNoIn", () => {
            var binExpParts = []

            binExpParts.push(this.SUBRULE(this.BitwiseANDExpressionNoIn))
            this.MANY(() => {
                binExpParts.push(PT(this.CONSUME(Circumflex)))
                binExpParts.push(this.SUBRULE2(this.BitwiseANDExpressionNoIn))
            })

            return isSingleOperandExp(binExpParts) ? _.first(binExpParts) :
                PT(BitwiseXORExpression, binExpParts)
        }, InvalidBitwiseXORExpressionNoIn)


        // See 11.10
        public BitwiseORExpression = this.RULE("BitwiseORExpression", () => {
            var binExpParts = []

            binExpParts.push(this.SUBRULE(this.BitwiseXORExpression))
            this.MANY(() => {
                binExpParts.push(PT(this.CONSUME(VerticalBar)))
                binExpParts.push(this.SUBRULE2(this.BitwiseXORExpression))
            })

            return isSingleOperandExp(binExpParts) ? _.first(binExpParts) :
                PT(BitwiseORExpression, binExpParts)
        }, InvalidBitwiseORExpression)


        // See 11.10
        public BitwiseORExpressionNoIn = this.RULE("BitwiseORExpressionNoIn", () => {
            var binExpParts = []

            binExpParts.push(this.SUBRULE(this.BitwiseXORExpressionNoIn))
            this.MANY(() => {
                binExpParts.push(PT(this.CONSUME(VerticalBar)))
                binExpParts.push(this.SUBRULE2(this.BitwiseXORExpressionNoIn))
            })

            return isSingleOperandExp(binExpParts) ? _.first(binExpParts) :
                PT(BitwiseORExpression, binExpParts)
        }, InvalidBitwiseORExpressionNoIn)


        // See 11.11
        public LogicalANDExpression = this.RULE("LogicalANDExpression", () => {
            var binExpParts = []

            binExpParts.push(this.SUBRULE(this.BitwiseORExpression))
            this.MANY(() => {
                binExpParts.push(PT(this.CONSUME(AmpersandAmpersand)))
                binExpParts.push(this.SUBRULE2(this.BitwiseORExpression))
            })

            return isSingleOperandExp(binExpParts) ? _.first(binExpParts) :
                PT(LogicalANDExpression, binExpParts)
        }, InvalidLogicalANDExpression)


        // See 11.11
        public LogicalANDExpressionNoIn = this.RULE("LogicalANDExpressionNoIn", () => {
            var binExpParts = []

            binExpParts.push(this.SUBRULE(this.BitwiseORExpressionNoIn))
            this.MANY(() => {
                binExpParts.push(PT(this.CONSUME(AmpersandAmpersand)))
                binExpParts.push(this.SUBRULE2(this.BitwiseORExpressionNoIn))
            })
            return isSingleOperandExp(binExpParts) ? _.first(binExpParts) :
                PT(LogicalANDExpression, binExpParts)
        }, InvalidLogicalANDExpressionNoIn)


        // See 11.11
        public LogicalORExpression = this.RULE("LogicalORExpression", () => {
            var binExpParts = []

            binExpParts.push(this.SUBRULE(this.LogicalANDExpression))
            this.MANY(() => {
                binExpParts.push(PT(this.CONSUME(VerticalBarVerticalBar)))
                binExpParts.push(this.SUBRULE2(this.LogicalANDExpression))
            })

            return isSingleOperandExp(binExpParts) ? _.first(binExpParts) :
                PT(LogicalORExpression, binExpParts)
        }, InvalidLogicalORExpression)


        // See 11.11
        public LogicalORExpressionNoIn = this.RULE("LogicalORExpressionNoIn", () => {
            var binExpParts = []

            binExpParts.push(this.SUBRULE(this.LogicalANDExpressionNoIn))
            this.MANY(() => {
                binExpParts.push(PT(this.CONSUME(VerticalBarVerticalBar)))
                binExpParts.push(this.SUBRULE2(this.LogicalANDExpressionNoIn))
            })

            return isSingleOperandExp(binExpParts) ? _.first(binExpParts) :
                PT(LogicalORExpression, binExpParts)
        }, InvalidLogicalORExpressionNoIn)


        // See 11.12
        public ConditionalExpression = this.RULE("ConditionalExpression", () => {
            var orExp, assignExp1 = undefined, assignExp2 = undefined

            orExp = this.SUBRULE(this.LogicalORExpression)
            this.OPTION(() => {
                this.CONSUME(Question)
                assignExp1 = this.SUBRULE(this.AssignmentExpression)
                this.CONSUME(Colon)
                assignExp2 = this.SUBRULE2(this.AssignmentExpression)
            })

            return assignExp1 ? PT(ConditionalExpression, [orExp, orExp, assignExp2]) : orExp
        }, InvalidConditionalExpression)


        // See 11.12
        public ConditionalExpressionNoIn = this.RULE("ConditionalExpressionNoIn", () => {
            var orExp, assignExp1 = undefined, assignExp2 = undefined

            orExp = this.SUBRULE(this.LogicalORExpressionNoIn)
            this.OPTION(() => {
                this.CONSUME(Question)
                assignExp1 = this.SUBRULE(this.AssignmentExpression) // TODO: why does spec not say "NoIn" here?
                this.CONSUME(Colon)
                assignExp2 = this.SUBRULE2(this.AssignmentExpressionNoIn)
            })

            return assignExp1 ? PT(ConditionalExpression, [orExp, orExp, assignExp2]) : orExp
        }, InvalidConditionalExpressionNoIn)


        // See 11.13
        public AssignmentExpression = this.RULE("AssignmentExpression", () => {
            var condExp, assignExp = undefined

            condExp = this.SUBRULE(this.ConditionalExpression)
            this.OPTION(() => {
                this.CONSUME(AbsAssignmentOperator)
                assignExp = this.SUBRULE(this.AssignmentExpression)
            })

            return assignExp ? PT(AssignmentExpression, [condExp, assignExp]) : condExp
        }, InvalidAssignmentExpression)


        // See 11.13
        public AssignmentExpressionNoIn = this.RULE("AssignmentExpressionNoIn", () => {
            var condExp, assignExp = undefined

            condExp = this.SUBRULE(this.ConditionalExpressionNoIn)
            this.OPTION(() => {
                this.CONSUME(AbsAssignmentOperator) // AssignmentOperator See 11.13 --> this is implemented as a Token Abs class
                assignExp = this.SUBRULE(this.AssignmentExpressionNoIn)
            })

            return assignExp ? PT(AssignmentExpression, [condExp, assignExp]) : condExp
        }, InvalidAssignmentExpressionNoIn)


        // See 11.14
        public Expression = this.RULE("Expression", () => {
            var exps = []

            exps.push(this.SUBRULE(this.AssignmentExpression))
            this.MANY(() => {
                this.CONSUME(Comma)
                exps.push(this.SUBRULE2(this.AssignmentExpression))
            })

            return exps.length === 1 ? _.first(exps) : PT(Expression, exps)
        }, InvalidExpression)


        // See 11.14
        public ExpressionNoIn = this.RULE("ExpressionNoIn", () => {
            var exps = []

            exps.push(this.SUBRULE(this.AssignmentExpressionNoIn))
            this.MANY(() => {
                this.CONSUME(Comma)
                exps.push(this.SUBRULE2(this.AssignmentExpressionNoIn))
            })

            return exps.length === 1 ? _.first(exps) : PT(Expression, exps)
        }, InvalidExpressionNoIn)


        // A.4 Statements

        // See clause 12
        public Statement = this.RULE("Statement", () => {
            return this.OR([
                {ALT: () => { return this.SUBRULE(this.Block) }},
                {ALT: () => { return this.SUBRULE(this.VariableStatement) }},
                {ALT: () => { return this.SUBRULE(this.EmptyStatement) }},
                {
                    ALT: () => {
                        var expOrLabel, stmt = undefined

                        expOrLabel = this.SUBRULE(this.ExpressionStatement)
                        var isOnlyIdentifierStatement = false // TODO: compute from ExpressionStatement once the rules return a parseTree
                        // LabelledStatement (See 12.12) is inlined here as it requires 2 token lookahead
                        // TODO:undo some of the inlining, the suffix (':' stmt) can be extracted for readability and better error reporting
                        this.OPTION(() => { return this.NEXT_TOKEN() instanceof Semicolon && isOnlyIdentifierStatement }, () => {
                            this.CONSUME(Colon)
                            stmt = this.SUBRULE(this.Statement)
                        })
                        return stmt ? PT(LabeledStatement, [stmt]) : expOrLabel
                    }
                },
                {ALT: () => { return this.SUBRULE(this.IfStatement) }},
                {ALT: () => { return this.SUBRULE(this.IterationStatement) }},
                {ALT: () => { return this.SUBRULE(this.ContinueStatement) }},
                {ALT: () => { return this.SUBRULE(this.BreakStatement) }},
                {ALT: () => { return this.SUBRULE(this.ReturnStatement) }},
                {ALT: () => { return this.SUBRULE(this.WithStatement) }},
                {ALT: () => { return this.SUBRULE(this.SwitchStatement) }},
                {ALT: () => { return this.SUBRULE(this.ThrowStatement) }},
                {ALT: () => { return this.SUBRULE(this.TryStatement) }},
                {ALT: () => { return this.SUBRULE(this.DebuggerStatement) }}
            ], "a Statement", recog.IGNORE_AMBIGUITIES)
        }, InvalidStatement)


        // See 12.1
        public Block = this.RULE("Block", () => {
            var stmtList = undefined

            this.CONSUME(LCurly)
            this.OPTION(() => {
                stmtList = this.SUBRULE(this.StatementList)
            })
            this.CONSUME(RCurly)

            return PT(Block, stmtList)
        }, InvalidBlock)


        // See 12.1
        public StatementList = this.RULE("StatementList", () => {
            var stmts = []

            this.AT_LEAST_ONE(() => {
                stmts.push(this.SUBRULE(this.Statement))
            }, "a Statement")

            return PT(StatementList, stmts)
        }, InvalidStatementList)


        // See 12.2
        public VariableStatement = this.RULE("VariableStatement", () => {
            var VarDecList

            this.CONSUME(VarTok)
            VarDecList = this.SUBRULE(this.VariableDeclarationList)
            this.CONSUME(Semicolon, ENABLE_SEMICOLON_INSERTION)

            return PT(VariableStatement, [VarDecList])
        }, InvalidVariableStatement)


        // See 12.2
        public VariableDeclarationList = this.RULE("VariableDeclarationList", () => {
            var varDecsVec = []

            varDecsVec.push(this.SUBRULE(this.VariableDeclaration))
            this.MANY(() => {
                this.CONSUME(Comma)
                varDecsVec.push(this.SUBRULE2(this.VariableDeclaration))
            })

            return PT(VariableDeclarationList, varDecsVec)
        }, InvalidVariableDeclarationList)


        //// See 12.2
        public VariableDeclarationListNoIn = this.RULE("VariableDeclarationListNoIn", () => {
            var varDecsVec = []

            varDecsVec.push(this.SUBRULE(this.VariableDeclarationNoIn))
            this.MANY(() => {
                this.CONSUME(Comma)
                varDecsVec.push(this.SUBRULE2(this.VariableDeclarationNoIn))
            })

            return PT(VariableDeclaration, varDecsVec)
        }, InvalidVariableDeclarationListNoIn)


        // See 12.2
        public VariableDeclaration = this.RULE("VariableDeclaration", () => {
            var ident, initExp = undefined

            ident = this.CONSUME(Identifier)
            this.OPTION(() => {
                initExp = this.SUBRULE(this.Initialiser)
            })

            return PT(VariableDeclaration, [PT(ident), initExp])
        }, InvalidVariableDeclaration)


        //// See 12.2
        public VariableDeclarationNoIn = this.RULE("VariableDeclarationNoIn", () => {
            var ident, initExp = undefined

            ident = this.CONSUME(Identifier)
            this.OPTION(() => {
                initExp = this.SUBRULE(this.InitialiserNoIn)
            })


            return PT(VariableDeclaration, [PT(ident), initExp])
        }, InvalidVariableDeclarationNoIn)


        // See 12.2
        public Initialiser = this.RULE("Initialiser", () => {
            var initExp

            this.CONSUME(Eq)
            initExp = this.SUBRULE(this.AssignmentExpression)

            return PT(Initialiser, [initExp])
        }, InvalidInitialiser)


        // See 12.2
        public InitialiserNoIn = this.RULE("InitialiserNoIn", () => {
            var initExp

            this.CONSUME(Eq)
            initExp = this.SUBRULE(this.AssignmentExpressionNoIn)

            return PT(Initialiser, [initExp])
        }, InvalidInitialiserNoIn)


        // See 12.3
        public EmptyStatement = this.RULE("EmptyStatement", () => {
            //  a semicolon is never inserted automatically if the semicolon would then be parsed as an empty statement
            this.CONSUME(Semicolon, DISABLE_SEMICOLON_INSERTION)
            return PT(EmptyStatement)
        }, InvalidEmptyStatement)


        // See 12.4
        public ExpressionStatement = this.RULE("ExpressionStatement", () => {
            // the spec defines [lookahead ? {{, function}] to avoid some ambiguities, however those ambiguities only exist
            // because in a BNF grammar there is no priority between alternatives. This implementation however, is deterministic
            // the first alternative found to match will be taken. thus these ambiguities can be resolved
            // by ordering the alternatives

            var exp

            exp = this.SUBRULE(this.Expression)
            this.CONSUME(Semicolon, ENABLE_SEMICOLON_INSERTION)

            return PT(ExpressionStatement, [exp])
        }, InvalidExpressionStatement)


        // See 12.5
        public IfStatement = this.RULE("IfStatement", () => {
            var cond, ifBody, elseBody = undefined

            this.CONSUME(IfTok)
            this.CONSUME(LParen)
            cond = this.SUBRULE(this.Expression)
            this.CONSUME(RParen)
            ifBody = this.SUBRULE(this.Statement)
            // refactoring spec to use an OPTION production for the 'else'
            // to resolve the dangling if-else problem
            this.OPTION(() => {
                this.CONSUME(ElseTok)
                elseBody = this.SUBRULE2(this.Statement)
            })

            return PT(IfStatement, [cond, ifBody, elseBody])
        }, InvalidIfStatement)


        // See 12.6
        public IterationStatement = this.RULE("IterationStatement", () => {
            // the original spec rule has been refactored into 3 smaller ones
            return this.OR([
                {ALT: () => { return this.SUBRULE(this.DoIteration) }},
                {ALT: () => { return this.SUBRULE(this.WhileIteration) }},
                {ALT: () => { return this.SUBRULE(this.ForIteration) }}
            ], "an Iteration Statement")
        }, InvalidIterationStatement)


        public DoIteration = this.RULE("DoIteration", () => {
            var exp, stmt

            this.CONSUME(DoTok)
            stmt = this.SUBRULE(this.Statement)
            this.CONSUME(WhileTok)
            this.CONSUME(LParen)
            exp = this.SUBRULE(this.Expression)
            this.CONSUME(RParen)
            this.CONSUME(Semicolon, ENABLE_SEMICOLON_INSERTION)

            return PT(DoIteration, [exp, stmt])
        }, InvalidDoIteration)


        public WhileIteration = this.RULE("WhileIteration", () => {
            var exp, stmt

            this.CONSUME(WhileTok)
            this.CONSUME(LParen)
            exp = this.SUBRULE(this.Expression)
            this.CONSUME(RParen)
            stmt = this.SUBRULE(this.Statement)

            return PT(WhileIteration, [exp, stmt])
        }, InvalidWhileIteration)


        protected canInComeAfterExp(exp:chevrotain.tree.ParseTree):boolean {
            // anything that a call to MemberCallNewExpression rule may return
            return exp.payload instanceof MemberCallNewExpression ||
                exp.payload instanceof ObjectLiteral ||
                exp.payload instanceof ArrayLiteral ||
                exp.payload instanceof ParenthesisExpression ||
                exp.payload instanceof AbsLiteral ||
                exp.payload instanceof ThisTok ||
                exp.payload instanceof Identifier
        }

        public ForIteration = this.RULE("ForIteration", () => {
            var header, headerExp:ParseTree, headerPart, body
            var inPossible = false

            this.CONSUME(ForTok)
            this.CONSUME(LParen)

            // @formatter:off
            header = this.OR([
                { ALT: () => {
                    this.CONSUME(VarTok)
                    headerExp = this.SUBRULE(this.VariableDeclarationListNoIn)
                    inPossible = headerExp.children.length === 1 // 'in' is only possible if there was just one VarDec
                    headerPart = this.SUBRULE(this.ForHeaderParts, [inPossible])
                    return PT(ForVarHeader, [headerExp, headerPart])
                }},
                {ALT: () => {
                    this.OPTION(() => {
                        headerExp = this.SUBRULE(this.ExpressionNoIn)
                        inPossible = this.canInComeAfterExp(headerExp)
                    })

                    headerPart = this.SUBRULE(this.ForHeaderParts, [inPossible])
                    return PT(ForNoVarHeader, [headerExp, headerPart])
                }}
            ], "var or expression")
            // @formatter:on

            this.CONSUME(RParen)
            body = this.SUBRULE(this.Statement)

            return PT(ForIteration, [header, body])
        }, InvalidForIteration)


        protected isForHeaderRegularPart() {
            return this.NEXT_TOKEN() instanceof Semicolon
        }

        protected ForHeaderParts = this.RULE("ForHeaderParts",

            /**
             * @param inPossible wheather or not the second alternative starting with InTok is aviliable under
             *        the current context. note that this means the grammar is not context free.
             *        however the only other alternative is to use backtracking which is even worse.
             */
            (inPossible:boolean) => {
                var exp1 = undefined, exp2 = undefined

                // @formatter:off
                return this.OR([
                    {WHEN: this.isForHeaderRegularPart , THEN_DO: () => {
                        this.CONSUME(Semicolon, DISABLE_SEMICOLON_INSERTION) // no semicolon insertion in for header
                        this.OPTION(() => {
                            exp1 = this.SUBRULE(this.Expression)
                        })
                        this.CONSUME2(Semicolon, DISABLE_SEMICOLON_INSERTION) // no semicolon insertion in for header
                        this.OPTION2(() => {
                            exp2 = this.SUBRULE2(this.Expression)
                        })
                        return PT(ForHeaderRegularPart, [exp1, exp2])
                    }},
                    {WHEN: () => { return inPossible && this.NEXT_TOKEN() instanceof InTok }, THEN_DO: () => {
                        this.CONSUME(InTok)
                        exp1 = this.SUBRULE3(this.Expression)
                        return PT(ForHeaderInPart, [exp1])
                    }}
                ], "in or semiColon")
                // @formatter:on
            }, InvalidForHeaderPart)


        protected isLabel():boolean {
            return !this.isNextLineTerminator() && // [no LineTerminator here]
                this.NEXT_TOKEN() instanceof Identifier
        }


        // See 12.7
        public ContinueStatement = this.RULE("ContinueStatement", () => {
            var ident = undefined

            this.CONSUME(ContinueTok)
            this.OPTION(this.isLabel, () => {
                ident = this.CONSUME(Identifier)
            })
            this.CONSUME(Semicolon, ENABLE_SEMICOLON_INSERTION)

            return PT(ContinueStatement, [ident])
        }, InvalidContinueStatement)


        // See 12.8
        public BreakStatement = this.RULE("BreakStatement", () => {
            var ident = undefined

            this.CONSUME(BreakTok)
            this.OPTION(this.isLabel, () => {
                ident = this.CONSUME(Identifier)
            })
            this.CONSUME(Semicolon, ENABLE_SEMICOLON_INSERTION)

            return PT(BreakStatement, [ident])
        }, InvalidBreakStatement)


        protected isExpressionNoLineTerminator():boolean {
            return !this.isNextLineTerminator() && // [no LineTerminator here]
                this.isNextRule("Expression")
        }


        // See 12.9
        public ReturnStatement = this.RULE("ReturnStatement", () => {
            var exp = undefined

            this.CONSUME(ReturnTok)
            this.OPTION(this.isExpressionNoLineTerminator, () => {
                exp = this.SUBRULE(this.Expression)
            })
            this.CONSUME(Semicolon, ENABLE_SEMICOLON_INSERTION)

            return PT(ReturnStatement, [exp])
        }, InvalidReturnStatement)


        // See 12.10
        public WithStatement = this.RULE("WithStatement", () => {
            var exp, stmt

            this.CONSUME(WithTok)
            this.CONSUME(LParen)
            exp = this.SUBRULE(this.Expression)
            this.CONSUME(RParen)
            stmt = this.SUBRULE(this.Statement)

            return PT(WithStatement, [exp, stmt])
        }, InvalidWithStatement)


        // See 12.11
        public SwitchStatement = this.RULE("SwitchStatement", () => {
            var exp, block

            this.CONSUME(SwitchTok)
            this.CONSUME(LParen)
            exp = this.SUBRULE(this.Expression)
            this.CONSUME(RParen)
            block = this.SUBRULE(this.CaseBlock)

            return PT(SwitchStatement, [exp, block])

        }, InvalidSwitchStatement)


        // See 12.11
        public CaseBlock = this.RULE("CaseBlock", () => {
            var clausesBeforeDefault = undefined, defaultClause = undefined, clausesAfterDefault = undefined

            this.CONSUME(LCurly)
            this.OPTION(() => {
                clausesBeforeDefault = this.SUBRULE(this.CaseClauses)
            })
            this.OPTION2(() => {
                defaultClause = this.SUBRULE(this.DefaultClause)
            })
            this.OPTION3(() => {
                clausesAfterDefault = this.SUBRULE(this.CaseClauses)
            })
            this.CONSUME(RCurly)

            return PT(CaseBlock, [clausesBeforeDefault, defaultClause, clausesAfterDefault])
        }, InvalidCaseBlock)


        // See 12.11
        public CaseClauses = this.RULE("CaseClauses", () => {
            var caseClausesVec = []

            this.AT_LEAST_ONE(() => {
                caseClausesVec.push(this.SUBRULE(this.CaseClause))
            }, "Case Clause")

            return PT(CaseClauses, caseClausesVec)
        }, InvalidCaseClauses)


        // See 12.11
        public CaseClause = this.RULE("CaseClause", () => {
            var exp, stmtList = undefined

            this.CONSUME(CaseTok)
            exp = this.SUBRULE(this.Expression)
            this.CONSUME(Colon)
            this.OPTION(() => {
                stmtList = this.SUBRULE(this.StatementList)
            })

            return PT(CaseClause, [exp, stmtList])
        }, InvalidCaseClause)


        // See 12.11
        public DefaultClause = this.RULE("DefaultClause", () => {
            var stmtList = undefined

            this.CONSUME(DefaultTok)
            this.CONSUME(Colon)
            this.OPTION(() => {
                stmtList = this.SUBRULE(this.StatementList)
            })

            return PT(DefaultClause, [stmtList])
        }, InvalidDefaultClause)


        // See 12.13
        public ThrowStatement = this.RULE("ThrowStatement", () => {
            var exp

            this.CONSUME(ThrowTok)
            if (this.isNextLineTerminator()) {
                // this will trigger re-sync recover which is the desired behavior,
                // there is no danger of inRule recovery (single token insertion/deletion)
                // happening in this case because that type of recovery can only happen if CONSUME(...) was invoked.
                this.SAVE_ERROR(new recog.MismatchedTokenException(
                    "Line Terminator not allowed before Expression in Throw Statement", this.nextLineTerminator()))
            }
            exp = this.SUBRULE(this.Expression)
            this.CONSUME(Semicolon, ENABLE_SEMICOLON_INSERTION)

            return PT(ThrowStatement, [exp])
        }, InvalidThrowStatement)


        // See 12.14
        public TryStatement = this.RULE("TryStatement", () => {
            var block, catchPt = undefined, finallyPt = undefined

            this.CONSUME(TryTok)
            block = this.SUBRULE(this.Block)

            // @formatter:off
            this.OR([
                {ALT: () => {
                    catchPt = this.SUBRULE(this.Catch)
                    this.OPTION(() => {
                        finallyPt = this.SUBRULE(this.Finally)
                    })
                }},
                {ALT: () => {
                    finallyPt = this.SUBRULE(this.Finally)
                }}
            ], "catch or finally")
            // @formatter:on

            return PT(TryStatement, [block, catchPt, finallyPt])
        }, InvalidTryStatement)


        // See 12.14
        public Catch = this.RULE("Catch", () => {
            var ident, block

            this.CONSUME(CatchTok)
            this.CONSUME(LParen)
            ident = this.CONSUME(Identifier)
            this.CONSUME(RParen)
            block = this.SUBRULE(this.Block)

            return PT(Catch, [PT(ident), block])
        }, InvalidCatch)


        // See 12.14
        public Finally = this.RULE("Finally", () => {
            var block

            this.CONSUME(FinallyTok)
            block = this.SUBRULE(this.Block)

            return PT(Finally, [block])
        }, InvalidFinally)


        // See 12.15
        public DebuggerStatement = this.RULE("DebuggerStatement", () => {
            this.CONSUME(DebuggerTok)
            this.CONSUME(Semicolon, ENABLE_SEMICOLON_INSERTION)

            return PT(DebuggerStatement)
        }, InvalidDebuggerStatement)

        // A.5 Functions and Programs


        // See clause 13
        public FunctionDeclaration = this.RULE("FunctionDeclaration", () => {
            var funcName, params = undefined, body

            this.CONSUME(FunctionTok)
            funcName = this.CONSUME(Identifier)
            this.CONSUME(LParen)
            this.OPTION(() => {
                params = this.SUBRULE(this.FormalParameterList)
            })
            this.CONSUME(RParen)
            this.CONSUME(LCurly)
            body = this.SUBRULE(this.SourceElements) // FunctionBody(clause 13) is equivalent to SourceElements
            this.CONSUME(RCurly)

            return PT(new FunctionDeclaration(), [PT(funcName), params, body])
        }, InvalidFunctionDeclaration)


        // See clause 13
        public FunctionExpression = this.RULE("FunctionExpression", () => {
            var funcName = undefined, params = undefined, body

            this.CONSUME(FunctionTok)
            this.OPTION1(() => {
                funcName = this.CONSUME(Identifier)
            })
            this.CONSUME(LParen)
            this.OPTION2(() => {
                params = this.SUBRULE(this.FormalParameterList)
            })
            this.CONSUME(RParen)
            this.CONSUME(LCurly)
            body = this.SUBRULE(this.SourceElements) // FunctionBody(clause 13) is equivalent to SourceElements
            this.CONSUME(RCurly)

            return PT(new FunctionExpression(), [PT(funcName), params, body])
        }, InvalidFunctionExpression)


        // See clause 13
        public FormalParameterList = this.RULE("FormalParameterList", () => {
            var paramNames = []

            paramNames.push(this.CONSUME(Identifier))
            this.MANY(() => {
                this.CONSUME(Comma)
                paramNames.push(PT(this.CONSUME2(Identifier)))
            })

            return PT(FormalParameterList, paramNames)
        }, InvalidFormalParameterList)


        // See clause 14
        public Program = this.RULE("Program", () => {
            var srcElements

            srcElements = this.SUBRULE(this.SourceElements)

            return PT(Program, [srcElements])
        }, InvalidProgram)


        // See clause 14
        // this inlines SourceElementRule rule from the spec
        public SourceElements = this.RULE("SourceElements", () => {
            var funcDec = [], stmts = []

            this.MANY(() => {
                // FunctionDeclaration must appear before statement to implement [lookahead ? {{, function}] in ExpressionStatement
                this.OR([
                        {ALT: () => { funcDec.push(this.SUBRULE(this.FunctionDeclaration))}},
                        {ALT: () => { stmts.push(this.SUBRULE(this.Statement)) }}
                    ],
                    "Statement or Function Declaration",
                    recog.IGNORE_AMBIGUITIES)
            })

            return PT(SourceElements, funcDec.concat(stmts))
        }, InvalidSourceElements)
    }
}
