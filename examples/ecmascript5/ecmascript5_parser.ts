/// <reference path="../../src/parse/recognizer.ts" />
/// <reference path="../../src/scan/tokens.ts" />
/// <reference path="../../src/scan/lexer.ts" />

module chevrotain.examples.ecma5 {

    import recog = chevrotain.recognizer
    import tok = chevrotain.tokens

    // as defined in http://www.ecma-international.org/publications/standards/Ecma-262.htm
    export class ECMAScript5Parser extends recog.BaseIntrospectionRecognizer {

        constructor(input:tok.Token[] = []) {
            super(input, <any>chevrotain.examples.ecma5)
            ECMAScript5Parser.performSelfAnalysis(this)
        }

        // A.3 Expressions

        // See 11.1
        public PrimaryExpression = this.RULE("PrimaryExpression", () => {
            // @formatter:off
            this.OR([
                {ALT: () => { this.CONSUME(ThisTok) }},
                {ALT: () => { this.CONSUME(Identifier) }},
                {ALT: () => { this.CONSUME(AbsLiteral) }},
                {ALT: () => { this.SUBRULE(this.ArrayLiteral) }},
                {ALT: () => { this.SUBRULE(this.ObjectLiteral) }},
                {ALT: () => {
                    this.CONSUME(LParen)
                    this.SUBRULE(this.Expression)
                    this.CONSUME(RParen)
                }},
            ], "'this', Identifier, Literal or parenthesis expression")
            // @formatter:on
        })

        // See 11.1.4
        public ArrayLiteral = this.RULE("ArrayLiteral", () => {
            this.CONSUME(LBracket)
            this.MANY(() => {
                this.OR([
                    {ALT: () => { this.SUBRULE(this.ElementList) }},
                    {ALT: () => { this.SUBRULE(this.Elision) }}
                ], "expression or comma")
            })
            this.CONSUME(RBracket)
        })

        // See 11.1.4
        public ElementList = this.RULE("ElementList", () => {
            this.OPTION(() => {
                this.SUBRULE(this.Elision)
            })
            this.SUBRULE(this.AssignmentExpression)
            this.MANY(() => {
                this.SUBRULE2(this.Elision)
                this.SUBRULE2(this.AssignmentExpression)
            })

        })

        // See 11.1.4
        public Elision = this.RULE("Elision", () => {
            this.AT_LEAST_ONE(() => {
                this.CONSUME(Comma)
            }, "a comma")
        })

        // See 11.1.5
        // this inlines PropertyNameAndValueList
        public ObjectLiteral = this.RULE("ObjectLiteral", () => {
            this.CONSUME(LCurly)
            this.OPTION(() => {
                this.SUBRULE(this.PropertyAssignment)
                this.MANY(() => {
                    this.CONSUME(Comma)
                    this.SUBRULE2(this.PropertyAssignment)
                })
                this.OPTION2(() => {
                    this.CONSUME2(Comma)
                })
            })
            this.CONSUME(RCurly)
        })

        // See 11.1.5
        public PropertyAssignment = this.RULE("PropertyAssignment", () => {
            // @formatter:off
            this.OR([
                {ALT: () => {
                    this.SUBRULE(this.PropertyName)
                    this.CONSUME(Colon)
                    this.SUBRULE(this.AssignmentExpression)
                }},
                {ALT: () => {
                    this.CONSUME(GetTok)
                    this.SUBRULE2(this.PropertyName)
                    this.CONSUME(LParen)
                    this.CONSUME(RParen)
                    this.CONSUME(LCurly)
                    this.SUBRULE(this.FunctionBody)
                    this.CONSUME(RCurly)
                }},
                {ALT: () => {
                    this.CONSUME(SetTok)
                    this.SUBRULE3(this.PropertyName)
                    this.CONSUME2(LParen)
                    this.CONSUME1(Identifier)
                    this.CONSUME2(RParen)
                    this.CONSUME2(LCurly)
                    this.SUBRULE2(this.FunctionBody)
                    this.CONSUME2(RCurly)
                }}
            ], "a property assignment")
            // @formatter:on
        })

        // See 11.1.5
        // this inlines PropertySetParameterList
        public PropertyName = this.RULE("PropertyName", () => {
            this.OR([
                {ALT: () => { this.CONSUME(AbsIdentifierNamesAndIdentifiers) }},
                {ALT: () => { this.CONSUME(AbsStringLiteral) }},
                {ALT: () => { this.CONSUME(AbsNumericLiteral) }}
            ], "Property name")
        })

        // See 11.2
        // merging MemberExpression, NewExpression and CallExpression into one rule
        public MemberCallNewExpression = this.RULE("MemberCallNewExpression", () => {
            this.MANY(() => {
                this.CONSUME(NewTok)
            })

            this.OR([
                {ALT: () => { this.SUBRULE(this.PrimaryExpression) }},
                {ALT: () => { this.SUBRULE(this.FunctionExpression) }}
            ], "expression or comma")

            this.MANY2(() => {
                // @formatter:off
                // TODO: empty alternative support?
                this.OR2([
                    {ALT: () => {
                        this.CONSUME(LBracket)
                        this.SUBRULE(this.Expression)
                        this.CONSUME(RBracket)
                    }},
                    {ALT: () => {
                        this.CONSUME(Dot)
                        this.CONSUME(AbsIdentifierNamesAndIdentifiers)
                    }},
                    {ALT: () => {
                        this.SUBRULE(this.Arguments)
                    }}
                ], "property access or arguments")
                // @formatter:on
            })
        })

        // See 11.2
        // this inlines ArgumentList
        public Arguments = this.RULE("Arguments", () => {
            this.CONSUME(LParen)
            // TODO: MANY_SEP (separator) parsing DSL support?
            this.OPTION(() => {
                this.SUBRULE(this.AssignmentExpression)
                this.MANY(() => {
                    this.CONSUME(Comma)
                    this.SUBRULE2(this.AssignmentExpression)
                })
            })
            this.CONSUME(RParen)
        })

        // See 11.2
        public LeftHandSideExpression = this.RULE("LeftHandSideExpression", () => {
            // TODO: consider factoring out LHSExpression all together ?
            this.SUBRULE(this.MemberCallNewExpression)
        })

        // See 11.3
        public PostfixExpression = this.RULE("PostfixExpression", () => {
            this.SUBRULE(this.LeftHandSideExpression)
            this.OPTION(() => {
                // TODO [no LineTerminator here]
                this.OR([
                    {ALT: () => { this.CONSUME(PlusPlus) }},
                    {ALT: () => { this.CONSUME(MinusMinus) }}
                ], "++ or --")
            })
        })

        // See 11.4
        public UnaryExpression = this.RULE("UnaryExpression", () => {
            // @formatter:off
            this.OR([
                {ALT: () => { this.SUBRULE(this.PostfixExpression) }},
                {ALT: () => {
                    this.OR([
                        {ALT: () => { this.CONSUME(DeleteTok) }},
                        {ALT: () => { this.CONSUME(VoidTok) }},
                        {ALT: () => { this.CONSUME(TypeOfTok) }},
                        {ALT: () => { this.CONSUME(PlusPlus) }},
                        {ALT: () => { this.CONSUME(MinusMinus) }},
                        {ALT: () => { this.CONSUME(Plus) }},
                        {ALT: () => { this.CONSUME(Minus) }},
                        {ALT: () => { this.CONSUME(Tilde) }},
                        {ALT: () => { this.CONSUME(Exclamation) }}
                    ], "")
                    this.SUBRULE(this.UnaryExpression)
                }},
            ], "PostFixExpression or UnaryExpression")
            // @formatter:on
        })

        // See 11.5
        public MultiplicativeExpression = this.RULE("MultiplicativeExpression", () => {
            this.SUBRULE(this.UnaryExpression)
            this.MANY(() => {
                this.CONSUME(AbsMultiplicativeOperator)
                this.SUBRULE2(this.UnaryExpression)
            })
        })

        // See 11.6
        public AdditiveExpression = this.RULE("AdditiveExpression", () => {
            this.SUBRULE(this.MultiplicativeExpression)
            this.MANY(() => {
                this.CONSUME(AbsAdditiveOperator)
                this.SUBRULE2(this.MultiplicativeExpression)
            })
        })

        // See 11.7
        public ShiftExpression = this.RULE("ShiftExpression", () => {
            this.SUBRULE(this.AdditiveExpression)
            this.MANY(() => {
                this.CONSUME(AbsShiftOperator)
                this.SUBRULE2(this.AdditiveExpression)
            })
        })

        // See 11.8
        public RelationalExpression = this.RULE("RelationalExpression", () => {
            this.SUBRULE(this.ShiftExpression)
            this.MANY(() => {
                this.OR([
                    {ALT: () => { this.CONSUME(AbsRelationalOperator) }},
                    {ALT: () => { this.CONSUME(InstanceOfTok) }},
                    {ALT: () => { this.CONSUME(InTok) }}
                ], "a Relational operator")
                this.SUBRULE2(this.ShiftExpression)
            })
        })
        // See 11.8
        public RelationalExpressionNoIn = this.RULE("RelationalExpressionNoIn", () => {
            this.SUBRULE(this.ShiftExpression)
            this.MANY(() => {
                this.OR([
                    {ALT: () => { this.CONSUME(AbsRelationalOperator) }},
                    {ALT: () => { this.CONSUME(InstanceOfTok) }},
                ], "a Relational operator excluding 'in'")
                this.SUBRULE2(this.ShiftExpression)
            })
        })
        // See 11.9
        public EqualityExpression = this.RULE("EqualityExpression", () => {
            this.SUBRULE(this.RelationalExpression)
            this.MANY(() => {
                this.CONSUME(AbsEqualityOperator)
                this.SUBRULE2(this.RelationalExpression)
            })
        })

        // See 11.9
        public EqualityExpressionNoIn = this.RULE("EqualityExpressionNoIn", () => {
            this.SUBRULE(this.RelationalExpressionNoIn)
            this.MANY(() => {
                this.CONSUME(AbsEqualityOperator)
                this.SUBRULE2(this.RelationalExpressionNoIn)
            })
        })

        // See 11.10
        public BitwiseANDExpression = this.RULE("BitwiseANDExpression", () => {
            this.SUBRULE(this.EqualityExpression)
            this.MANY(() => {
                this.CONSUME(Ampersand)
                this.SUBRULE2(this.EqualityExpression)
            })
        })

        // See 11.10
        public BitwiseANDExpressionNoIn = this.RULE("BitwiseANDExpressionNoIn", () => {
            this.SUBRULE(this.EqualityExpressionNoIn)
            this.MANY(() => {
                this.CONSUME(Ampersand)
                this.SUBRULE2(this.EqualityExpressionNoIn)
            })
        })

        // See 11.10
        public BitwiseXORExpression = this.RULE("BitwiseXORExpression", () => {
            this.SUBRULE(this.BitwiseANDExpression)
            this.MANY(() => {
                this.CONSUME(Circumflex)
                this.SUBRULE2(this.BitwiseANDExpression)
            })
        })

        // See 11.10
        public BitwiseXORExpressionNoIn = this.RULE("BitwiseXORExpressionNoIn", () => {
            this.SUBRULE(this.BitwiseANDExpressionNoIn)
            this.MANY(() => {
                this.CONSUME(Circumflex)
                this.SUBRULE2(this.BitwiseANDExpressionNoIn)
            })
        })

        // See 11.10
        public BitwiseORExpression = this.RULE("BitwiseORExpression", () => {
            this.SUBRULE(this.BitwiseXORExpression)
            this.MANY(() => {
                this.CONSUME(VerticalBar)
                this.SUBRULE2(this.BitwiseXORExpression)
            })
        })

        // See 11.10
        public BitwiseORExpressionNoIn = this.RULE("BitwiseORExpressionNoIn", () => {
            this.SUBRULE(this.BitwiseXORExpressionNoIn)
            this.MANY(() => {
                this.CONSUME(VerticalBar)
                this.SUBRULE2(this.BitwiseXORExpressionNoIn)
            })
        })

        // See 11.11
        public LogicalANDExpression = this.RULE("LogicalANDExpression", () => {
            this.SUBRULE(this.BitwiseORExpression)
            this.MANY(() => {
                this.CONSUME(AmpersandAmpersand)
                this.SUBRULE2(this.BitwiseORExpression)
            })
        })

        // See 11.11
        public LogicalANDExpressionNoIn = this.RULE("LogicalANDExpressionNoIn", () => {
            this.SUBRULE(this.BitwiseORExpressionNoIn)
            this.MANY(() => {
                this.CONSUME(AmpersandAmpersand)
                this.SUBRULE2(this.BitwiseORExpressionNoIn)
            })

        })

        // See 11.11
        public LogicalORExpression = this.RULE("LogicalORExpression", () => {
            this.SUBRULE(this.LogicalANDExpression)
            this.MANY(() => {
                this.CONSUME(VerticalBarVerticalBar)
                this.SUBRULE2(this.LogicalANDExpression)
            })
        })

        // See 11.11
        public LogicalORExpressionNoIn = this.RULE("LogicalORExpressionNoIn", () => {
            this.SUBRULE(this.LogicalANDExpressionNoIn)
            this.MANY(() => {
                this.CONSUME(VerticalBarVerticalBar)
                this.SUBRULE2(this.LogicalANDExpressionNoIn)
            })
        })

        // See 11.12
        public ConditionalExpression = this.RULE("ConditionalExpression", () => {
            this.SUBRULE(this.LogicalORExpression)
            this.OPTION(() => {
                this.CONSUME(Question)
                this.SUBRULE(this.AssignmentExpression)
                this.CONSUME(Colon)
                this.SUBRULE2(this.AssignmentExpression)
            })
        })

        // See 11.12
        public ConditionalExpressionNoIn = this.RULE("ConditionalExpressionNoIn", () => {
            this.SUBRULE(this.LogicalORExpressionNoIn)
            this.OPTION(() => {
                this.CONSUME(Question)
                this.SUBRULE(this.AssignmentExpression) // TODO: why does spec not say "NoIn" here?
                this.CONSUME(Colon)
                this.SUBRULE2(this.AssignmentExpressionNoIn)
            })
        })

        // See 11.13
        public AssignmentExpression = this.RULE("AssignmentExpression", () => {
            this.SUBRULE(this.ConditionalExpression)
            this.OPTION(() => {
                this.CONSUME(AbsAssignmentOperator)
                this.SUBRULE(this.AssignmentExpression)
            })
        })

        // See 11.13
        public AssignmentExpressionNoIn = this.RULE("AssignmentExpressionNoIn", () => {
            this.SUBRULE(this.ConditionalExpressionNoIn)
            this.OPTION(() => {
                this.CONSUME(AbsAssignmentOperator)
                this.SUBRULE(this.AssignmentExpressionNoIn)
            })
        })

        // See 11.13 // this is implemented as a Token Abs class
        //public AssignmentOperator = this.RULE("AssignmentOperator", () => {})

        // See 11.14
        public Expression = this.RULE("Expression", () => {
            this.SUBRULE(this.AssignmentExpression)
            this.MANY(() => {
                this.CONSUME(Comma)
                this.SUBRULE2(this.AssignmentExpression)
            })
        })

        // See 11.14
        public ExpressionNoIn = this.RULE("ExpressionNoIn", () => {
            this.SUBRULE(this.AssignmentExpressionNoIn)
            this.MANY(() => {
                this.CONSUME(Comma)
                this.SUBRULE2(this.AssignmentExpressionNoIn)
            })
        })


        // A.4 Statements

        // See clause 12
        public Statement = this.RULE("Statement", () => {
            this.OR([
                {ALT: () => { this.SUBRULE(this.Block) }},
                {ALT: () => { this.SUBRULE(this.VariableStatement) }},
                {ALT: () => { this.SUBRULE(this.EmptyStatement) }},
                {ALT: () => { this.SUBRULE(this.ExpressionStatement) }},
                {ALT: () => { this.SUBRULE(this.IfStatement) }},
                {ALT: () => { this.SUBRULE(this.IterationStatement) }},
                {ALT: () => { this.SUBRULE(this.ContinueStatement) }},
                {ALT: () => { this.SUBRULE(this.BreakStatement) }},
                {ALT: () => { this.SUBRULE(this.ReturnStatement) }},
                {ALT: () => { this.SUBRULE(this.WithStatement) }},
                {ALT: () => { this.SUBRULE(this.LabelledStatement) }},
                {ALT: () => { this.SUBRULE(this.SwitchStatement) }},
                {ALT: () => { this.SUBRULE(this.ThrowStatement) }},
                {ALT: () => { this.SUBRULE(this.TryStatement) }},
                {ALT: () => { this.SUBRULE(this.DebuggerStatement) }}
            ], "a Statement")
        })

        // See 12.1
        public Block = this.RULE("Block", () => {
            this.CONSUME(LCurly)
            this.OPTION(() => {
                this.SUBRULE(this.StatementList)
            })
            this.CONSUME(RCurly)
        })

        // See 12.1
        public StatementList = this.RULE("StatementList", () => {
            this.AT_LEAST_ONE(() => {
                this.SUBRULE(this.Statement)
            }, "a Statement")
        })

        // See 12.2
        public VariableStatement = this.RULE("VariableStatement", () => {
            this.CONSUME(VarTok)
            this.SUBRULE(this.VariableDeclaration)
        })

        // See 12.2
        public VariableDeclarationList = this.RULE("VariableDeclarationList", () => {
            this.SUBRULE(this.VariableDeclaration)
            this.MANY(() => {
                this.CONSUME(Comma)
                this.SUBRULE2(this.VariableDeclaration)
            })
        })

        //// See 12.2
        public VariableDeclarationListNoIn = this.RULE("VariableDeclarationListNoIn", () => {
            this.SUBRULE(this.VariableDeclarationNoIn)
            this.MANY(() => {
                this.CONSUME(Comma)
                this.SUBRULE2(this.VariableDeclarationNoIn)
            })
        })

        // See 12.2
        public VariableDeclaration = this.RULE("VariableDeclaration", () => {
            this.CONSUME(Identifier)
            this.SUBRULE(this.Initialiser)
        })

        //// See 12.2
        public VariableDeclarationNoIn = this.RULE("VariableDeclarationNoIn", () => {
            this.CONSUME(Identifier)
            this.SUBRULE(this.InitialiserNoIn)
        })

        // See 12.2
        public Initialiser = this.RULE("Initialiser", () => {
            this.CONSUME(Eq)
            this.SUBRULE(this.AssignmentExpression)
        })

        // See 12.2
        public InitialiserNoIn = this.RULE("InitialiserNoIn", () => {
            this.CONSUME(Eq)
            this.SUBRULE(this.AssignmentExpressionNoIn)
        })

        // See 12.3
        public EmptyStatement = this.RULE("EmptyStatement", () => {
            this.CONSUME(Semicolon)
        })

        // See 12.4
        public ExpressionStatement = this.RULE("ExpressionStatement", () => {
            // the spec defines [lookahead ? {{, function}] to avoid some ambiguities, however those ambiguities only exist
            // because in a BNF grammar there is no priority between alternatives. This implementation however, is deterministic
            // the first alternative found to match will be taken. thus these ambiguities can be resolved
            // by ordering of the alternatives
            this.SUBRULE(this.Expression)
        })

        // See 12.5
        public IfStatement = this.RULE("IfStatement", () => {
            this.CONSUME(IfTok)
            this.CONSUME(LParen)
            this.CONSUME(RParen)
            this.SUBRULE(this.Statement)
            // refactoring spec to use an OPTION production for the 'else'
            // to resolve the dangling if-else problem
            this.OPTION(() => {
                this.CONSUME(ElseTok)
                this.SUBRULE2(this.Statement)
            })
        })

        // See 12.6
        public IterationStatement = this.RULE("IterationStatement", () => {
            // the original spec rule has been refactored into 3 smaller ones
            this.OR([
                {ALT: () => { this.SUBRULE(this.DoIteration) }},
                {ALT: () => { this.SUBRULE(this.WhileIteration) }},
                {ALT: () => { this.SUBRULE(this.ForIteration) }}
            ], "an Iteration Statement")
        })

        public DoIteration = this.RULE("DoIteration", () => {
            this.CONSUME(DoTok)
            this.SUBRULE(this.Statement)
            this.CONSUME(WhileTok)
            this.CONSUME(LParen)
            this.SUBRULE(this.Expression)
            this.CONSUME(RParen)
            this.CONSUME(Semicolon)
        })

        public WhileIteration = this.RULE("WhileIteration", () => {
            this.CONSUME(WhileTok)
            this.CONSUME(LParen)
            this.SUBRULE(this.Expression)
            this.CONSUME(RParen)
            this.SUBRULE(this.Statement)
        })

        public ForIteration = this.RULE("ForIteration", () => {
            this.CONSUME(ForTok)
            this.CONSUME(LParen)

            // @formatter:off
            this.OR([
                { ALT: () => {
                    this.CONSUME(VarTok)
                    this.SUBRULE(this.VariableDeclarationListNoIn)
                    this.SUBRULE(this.ForIterationParts)
                }},
                {ALT: () => {
                    this.OPTION(() => {
                        this.SUBRULE(this.ExpressionNoIn)
                    })
                    // TODO: consider feature to pass arguments to  subRules?
                    this.SUBRULE(this.ForIterationParts)
                }}
            ], "var or expression")
            // @formatter:on

            this.CONSUME(RParen)
            this.SUBRULE(this.Statement)
        })

        protected ForIterationParts = this.RULE("ForIterationParts", () => {
            // TODO: this grammar is not enough to decide between the alternatives
            // need the additional information from the calling rule
            // the IN alternative is only possible if BEFORE it appeared
            // SINGLE VariableDeclarationNoIn or LeftHandSideExpression

            // @formatter:off
            this.OR([
                {ALT: () => {
                    this.CONSUME(Semicolon)
                    this.OPTION(() => {
                        this.SUBRULE(this.Expression)
                    })
                    this.CONSUME2(Semicolon)
                    this.OPTION2(() => {
                        this.SUBRULE2(this.Expression)
                    })
                }},
                {ALT: () => {
                    this.CONSUME(InTok)
                    this.SUBRULE3(this.Expression)
                }}
            ], "in or semiColon")
            // @formatter:on
        })

        // See 12.7
        public ContinueStatement = this.RULE("ContinueStatement", () => {
            this.CONSUME(ContinueTok)
            this.OPTION(() => {
                // TODO: [no LineTerminator here]
                this.CONSUME(Identifier)
            })
            this.CONSUME(Semicolon)
        })
        // See 12.8
        public BreakStatement = this.RULE("BreakStatement", () => {
            this.CONSUME(BreakTok)
            this.OPTION(() => {
                // TODO: [no LineTerminator here]
                this.CONSUME(Identifier)
            })
            this.CONSUME(Semicolon)
        })

        // See 12.9
        public ReturnStatement = this.RULE("ReturnStatement", () => {
            this.CONSUME(ReturnTok)
            this.OPTION(() => {
                // TODO: [no LineTerminator here]
                this.SUBRULE(this.Expression)
            })
            this.CONSUME(Semicolon)
        })

        // See 12.10
        public WithStatement = this.RULE("WithStatement", () => {
            this.CONSUME(WithTok)
            this.CONSUME(LParen)
            this.SUBRULE(this.Expression)
            this.CONSUME(RParen)
            this.SUBRULE(this.Statement)
        })

        // See 12.11
        public SwitchStatement = this.RULE("SwitchStatement", () => {
            this.CONSUME(SwitchTok)
            this.CONSUME(LParen)
            this.SUBRULE(this.Expression)
            this.CONSUME(RParen)
            this.SUBRULE(this.CaseBlock)
        })

        // See 12.11
        public CaseBlock = this.RULE("CaseBlock", () => {
            this.CONSUME(LCurly)
            this.OPTION(() => {
                this.SUBRULE(this.CaseClauses)
            })
            this.OPTION2(() => {
                this.SUBRULE(this.DefaultClause)
            })
            this.OPTION3(() => {
                this.SUBRULE(this.CaseClauses)
            })
            this.CONSUME(RCurly)
        })

        // See 12.11
        public CaseClauses = this.RULE("CaseClauses", () => {
            this.AT_LEAST_ONE(() => {
                this.SUBRULE(this.CaseClause)
            }, "Case Clause")
        })

        // See 12.11
        public CaseClause = this.RULE("CaseClause", () => {
            this.CONSUME(CaseTok)
            this.SUBRULE(this.Expression)
            this.CONSUME(Colon)
            this.OPTION(() => {
                this.SUBRULE(this.StatementList)
            })
        })

        // See 12.11
        public DefaultClause = this.RULE("DefaultClause", () => {
            this.CONSUME(DefaultTok)
            this.CONSUME(Colon)
            this.OPTION(() => {
                this.SUBRULE(this.StatementList)
            })
        })

        // See 12.12
        public LabelledStatement = this.RULE("LabelledStatement", () => {
            this.CONSUME(Identifier)
            this.CONSUME(Colon)
            this.SUBRULE(this.Statement)
        })

        // See 12.13
        public ThrowStatement = this.RULE("ThrowStatement", () => {
            this.CONSUME(Identifier)
            // TODO: [no LineTerminator here]
            this.SUBRULE(this.Expression)
            this.CONSUME(Semicolon)
        })

        // See 12.14
        public TryStatement = this.RULE("TryStatement", () => {
            this.CONSUME(TryTok)
            this.SUBRULE(this.Block)

            // @formatter:off
            this.OR([
                {ALT: () => {
                    this.SUBRULE(this.Catch)
                    this.OPTION(() => {
                        this.SUBRULE(this.Finally)
                    })
                }},
                {ALT: () => {
                    this.SUBRULE(this.Finally)
                }}
            ], "catch or finally")
            // @formatter:on
        })

        // See 12.14
        public Catch = this.RULE("Catch", () => {
            this.CONSUME(CatchTok)
            this.CONSUME(LParen)
            this.CONSUME(Identifier)
            this.CONSUME(RParen)
            this.SUBRULE(this.Block)
        })

        // See 12.14
        public Finally = this.RULE("Finally", () => {
            this.CONSUME(FinallyTok)
            this.SUBRULE(this.Block)
        })

        // See 12.15
        public DebuggerStatement = this.RULE("DebuggerStatement", () => {
            this.CONSUME(DebuggerTok)
            this.CONSUME(Semicolon)
        })


        // A.5 Functions and Programs

        // See clause 13
        public FunctionDeclaration = this.RULE("FunctionDeclaration", () => {})
        // See clause 13
        public FunctionExpression = this.RULE("FunctionExpression", () => {})
        // See clause 13
        public FormalParameterList = this.RULE("FormalParameterList", () => {})
        // See clause 13
        public FunctionBody = this.RULE("FunctionBody", () => {})
        // See clause 14
        public Program = this.RULE("Program", () => {})
        // See clause 14
        public SourceElements = this.RULE("SourceElements", () => {})
        // See clause 14
        public SourceElement = this.RULE("SourceElement", () => {})

    }
}
