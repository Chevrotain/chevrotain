/// <reference path="../../src/parse/recognizer.ts" />
/// <reference path="../../src/scan/tokens.ts" />
/// <reference path="../../src/scan/lexer.ts" />

module chevrotain.examples.ecma5 {

    import recog = chevrotain.recognizer
    import tok = chevrotain.tokens

    // regexp to replace from the spec's pdf
    // (\w+) : (See \d+\.\d+(?:\.\d+)?)\s+.+
    // // $2\npublic $1 = this.RULE("$1", () => {})

    // as defined in http://www.ecma-international.org/publications/standards/Ecma-262.htm
    export class ECMAScript5Parser extends recog.BaseIntrospectionRecognizer {

        constructor(input:tok.Token[] = []) {
            super(input, <any>{/* TODO: pass Tokens module ->here<-*/})
            ECMAScript5Parser.performSelfAnalysis(this)
        }

        // A.3 Expressions

        // See 11.1
        public PrimaryExpression = this.RULE("PrimaryExpression", () => {})
        // See 11.1.4
        public ArrayLiteral = this.RULE("ArrayLiteral", () => {})
        // See 11.1.4
        public ElementList = this.RULE("ElementList", () => {})
        // See 11.1.4
        public Elision = this.RULE("Elision", () => {})
        // See 11.1.5
        public ObjectLiteral = this.RULE("ObjectLiteral", () => {})
        // See 11.1.5
        public PropertyNameAndValueList = this.RULE("PropertyNameAndValueList", () => {})
        // See 11.1.5
        public PropertyAssignment = this.RULE("PropertyAssignment", () => {})
        // See 11.1.5
        public PropertyName = this.RULE("PropertyName", () => {})
        // See 11.1.5
        public PropertySetParameterList = this.RULE("PropertySetParameterList", () => {})
        // See 11.2
        public MemberExpression = this.RULE("MemberExpression", () => {})
        // See 11.2
        public NewExpression = this.RULE("NewExpression", () => {})
        // See 11.2
        public CallExpression = this.RULE("CallExpression", () => {})
        // See 11.2
        public Arguments = this.RULE("Arguments", () => {})
        // See 11.2
        public ArgumentList = this.RULE("ArgumentList", () => {})
        // See 11.2
        public LeftHandSideExpression = this.RULE("LeftHandSideExpression", () => {})
        // See 11.3
        public PostfixExpression = this.RULE("PostfixExpression", () => {})
        // See 11.4
        public UnaryExpression = this.RULE("UnaryExpression", () => {})
        // See 11.5
        public MultiplicativeExpression = this.RULE("MultiplicativeExpression", () => {})
        // See 11.6
        public AdditiveExpression = this.RULE("AdditiveExpression", () => {})
        // See 11.7
        public ShiftExpression = this.RULE("ShiftExpression", () => {})
        // See 11.8
        public RelationalExpression = this.RULE("RelationalExpression", () => {})
        // See 11.8
        public RelationalExpressionNoIn = this.RULE("RelationalExpressionNoIn", () => {})
        // See 11.9
        public EqualityExpression = this.RULE("EqualityExpression", () => {})
        // See 11.9
        public EqualityExpressionNoIn = this.RULE("EqualityExpressionNoIn", () => {})
        // See 11.10
        public BitwiseANDExpression = this.RULE("BitwiseANDExpression", () => {})
        // See 11.10
        public BitwiseANDExpressionNoIn = this.RULE("BitwiseANDExpressionNoIn", () => {})
        // See 11.10
        public BitwiseXORExpression = this.RULE("BitwiseXORExpression", () => {})
        // See 11.10
        public BitwiseXORExpressionNoIn = this.RULE("BitwiseXORExpressionNoIn", () => {})
        // See 11.10
        public BitwiseORExpression = this.RULE("BitwiseORExpression", () => {})
        // See 11.10
        public BitwiseORExpressionNoIn = this.RULE("BitwiseORExpressionNoIn", () => {})
        // See 11.11
        public LogicalANDExpression = this.RULE("LogicalANDExpression", () => {})
        // See 11.11
        public LogicalANDExpressionNoIn = this.RULE("LogicalANDExpressionNoIn", () => {})
        // See 11.11
        public LogicalORExpression = this.RULE("LogicalORExpression", () => {})
        // See 11.11
        public LogicalORExpressionNoIn = this.RULE("LogicalORExpressionNoIn", () => {})
        // See 11.12
        public ConditionalExpression = this.RULE("ConditionalExpression", () => {})
        // See 11.12
        public ConditionalExpressionNoIn = this.RULE("ConditionalExpressionNoIn", () => {})
        // See 11.13
        public AssignmentExpression = this.RULE("AssignmentExpression", () => {})
        // See 11.13
        public AssignmentExpressionNoIn = this.RULE("AssignmentExpressionNoIn", () => {})
        // See 11.13
        public AssignmentOperator = this.RULE("AssignmentOperator", () => {})
        // See 11.14
        public Expression = this.RULE("Expression", () => {})
        // See 11.14
        public ExpressionNoIn = this.RULE("ExpressionNoIn", () => {})


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
            this.OPTION(() => () => {
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
            this.CONSUME(LParan)
            this.CONSUME(RParan)
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
            this.CONSUME(LParan)
            this.SUBRULE(this.Expression)
            this.CONSUME(RParan)
            this.CONSUME(Semicolon)
        })

        public WhileIteration = this.RULE("WhileIteration", () => {
            this.CONSUME(WhileTok)
            this.CONSUME(LParan)
            this.SUBRULE(this.Expression)
            this.CONSUME(RParan)
            this.SUBRULE(this.Statement)
        })

        public ForIteration = this.RULE("ForIteration", () => {
            this.CONSUME(ForTok)
            this.CONSUME(LParan)

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

            this.CONSUME(RParan)
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
                    this.OPTION(() => {
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
            this.CONSUME(LParan)
            this.SUBRULE(this.Expression)
            this.CONSUME(RParan)
            this.SUBRULE(this.Statement)
        })

        // See 12.11
        public SwitchStatement = this.RULE("SwitchStatement", () => {
            this.CONSUME(SwitchTok)
            this.CONSUME(LParan)
            this.SUBRULE(this.Expression)
            this.CONSUME(RParan)
            this.SUBRULE(this.CaseBlock)
        })

        // See 12.11
        public CaseBlock = this.RULE("CaseBlock", () => {
            this.CONSUME(LCurly)
            this.OPTION(() => {
                this.SUBRULE(this.CaseClauses)
            })
            this.OPTION(() => {
                this.SUBRULE(this.DefaultClause)
            })
            this.OPTION(() => {
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
            this.CONSUME(LParan)
            this.CONSUME(Identifier)
            this.CONSUME(RParan)
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
