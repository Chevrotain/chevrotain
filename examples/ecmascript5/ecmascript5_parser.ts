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
        public Statement = this.RULE("Statement", () => {})
        // See 12.1
        public Block = this.RULE("Block", () => {})
        // See 12.1
        public StatementList = this.RULE("StatementList", () => {})
        // See 12.2
        public VariableStatement = this.RULE("VariableStatement", () => {})
        // See 12.2
        public VariableDeclarationList = this.RULE("VariableDeclarationList", () => {})
        // See 12.2
        public VariableDeclarationListNoIn = this.RULE("VariableDeclarationListNoIn", () => {})
        // See 12.2
        public VariableDeclaration = this.RULE("VariableDeclaration", () => {})
        // See 12.2
        public VariableDeclarationNoIn = this.RULE("VariableDeclarationNoIn", () => {})

        // See 12.2
        public Initialiser = this.RULE("Initialiser", () => {})
        // See 12.2
        public InitialiserNoIn = this.RULE("InitialiserNoIn", () => {})
        // See 12.3
        public EmptyStatement = this.RULE("EmptyStatement", () => {})
        // See 12.4
        public ExpressionStatement = this.RULE("ExpressionStatement", () => {})
        // See 12.5
        public IfStatement = this.RULE("IfStatement", () => {})
        // See 12.6
        public IterationStatement = this.RULE("IterationStatement", () => {})
        // See 12.7
        public ContinueStatement = this.RULE("ContinueStatement", () => {})
        // See 12.8
        public BreakStatement = this.RULE("BreakStatement", () => {})
        // See 12.9
        public ReturnStatement = this.RULE("ReturnStatement", () => {})
        // See 12.10
        public WithStatement = this.RULE("WithStatement", () => {})
        // See 12.11
        public SwitchStatement = this.RULE("SwitchStatement", () => {})
        // See 12.11
        public CaseBlock = this.RULE("CaseBlock", () => {})
        // See 12.11
        public CaseClauses = this.RULE("CaseClauses", () => {})

        // See 12.11
        public CaseClause = this.RULE("CaseClause", () => {})
        // See 12.11
        public DefaultClause = this.RULE("DefaultClause", () => {})
        // See 12.12
        public LabelledStatement = this.RULE("LabelledStatement", () => {})
        // See 12.13
        public ThrowStatement = this.RULE("ThrowStatement", () => {})
        // See 12.14
        public TryStatement = this.RULE("TryStatement", () => {})
        // See 12.14
        public Catch = this.RULE("Catch", () => {})
        // See 12.14
        public Finally = this.RULE("Finally", () => {})
        // See 12.15
        public DebuggerStatement = this.RULE("DebuggerStatement", () => {})


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
