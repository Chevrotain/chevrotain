const chevrotain = require("chevrotain")
const tokens = require("./ecma5_tokens")

const Parser = chevrotain.Parser
const tokenMatcher = chevrotain.tokenMatcher
const EOF = chevrotain.EOF

// for conciseness
const t = tokens

const ENABLE_SEMICOLON_INSERTION = true
const DISABLE_SEMICOLON_INSERTION = false

// as defined in https://www.ecma-international.org/ecma-262/5.1/index.html
class ECMAScript5Parser extends Parser {
    constructor() {
        super([], tokens, {
            // outputCst: true,
            ignoredIssues: {
                Statement: { OR1: true },
                SourceElements: { OR1: true }
            }
        })

        const $ = this

        // A.3 Expressions
        // See 11.1
        $.RULE("PrimaryExpression", () => {
            $.OR([
                { ALT: () => $.CONSUME(t.ThisTok) },
                { ALT: () => $.CONSUME(t.Identifier) },
                { ALT: () => $.CONSUME(t.AbsLiteral) },
                { ALT: () => $.SUBRULE($.ArrayLiteral) },
                { ALT: () => $.SUBRULE($.ObjectLiteral) },
                { ALT: () => $.SUBRULE($.ParenthesisExpression) }
            ])
        })

        $.RULE("ParenthesisExpression", () => {
            $.CONSUME(t.LParen)
            $.SUBRULE($.Expression)
            $.CONSUME(t.RParen)
        })

        // See 11.1.4
        $.RULE("ArrayLiteral", () => {
            $.CONSUME(t.LBracket)
            $.MANY(() => {
                $.OR([
                    // TODO: fix ambiguities with commas // WHICH AMBIGUITIES?! :)
                    { ALT: () => $.SUBRULE($.ElementList) },
                    { ALT: () => $.SUBRULE($.Elision) }
                ])
            })
            $.CONSUME(t.RBracket)
        })

        // See 11.1.4
        $.RULE("ElementList", () => {
            // in the spec this may start with an optional Elision,
            // this create an ambiguity in the ArrayLiteral rule.
            // removing the Elision from this here does not modify the grammar
            // as the ElementList rule is only invoked from ArrayLiteral rule
            $.SUBRULE($.AssignmentExpression)
            $.MANY(() => {
                $.SUBRULE2($.Elision)
                $.SUBRULE2($.AssignmentExpression)
            })
        })

        // See 11.1.4
        $.RULE("Elision", () => {
            $.AT_LEAST_ONE(() => {
                $.CONSUME(t.Comma)
            })
        })

        // See 11.1.5
        // this inlines PropertyNameAndValueList
        $.RULE("ObjectLiteral", () => {
            $.CONSUME(t.LCurly)
            $.OPTION(() => {
                $.SUBRULE($.PropertyAssignment)
                $.MANY(() => {
                    $.CONSUME(t.Comma)
                    $.SUBRULE2($.PropertyAssignment)
                })
                $.OPTION2(() => {
                    $.CONSUME2(t.Comma)
                })
            })
            $.CONSUME(t.RCurly)
        })

        // See 11.1.5
        $.RULE("PropertyAssignment", () => {
            $.OR([
                { ALT: () => $.SUBRULE($.RegularPropertyAssignment) },
                { ALT: () => $.SUBRULE($.GetPropertyAssignment) },
                { ALT: () => $.SUBRULE($.SetPropertyAssignment) }
            ])
        })

        $.RULE("RegularPropertyAssignment", () => {
            $.SUBRULE($.PropertyName)
            $.CONSUME(t.Colon)
            $.SUBRULE($.AssignmentExpression)
        })

        $.RULE("GetPropertyAssignment", () => {
            $.CONSUME(t.GetTok)
            $.SUBRULE($.PropertyName)
            $.CONSUME(t.LParen)
            $.CONSUME(t.RParen)
            $.CONSUME(t.LCurly)
            $.SUBRULE($.SourceElements) // FunctionBody(clause 13) is equivalent to SourceElements
            $.CONSUME(t.RCurly)
        })

        $.RULE("SetPropertyAssignment", () => {
            $.CONSUME(t.SetTok)
            $.SUBRULE($.PropertyName)
            $.CONSUME2(t.LParen)
            $.CONSUME(t.Identifier)
            $.CONSUME(t.RParen)
            $.CONSUME(t.LCurly)
            $.SUBRULE($.SourceElements) // FunctionBody(clause 13) is equivalent to SourceElements
            $.CONSUME(t.RCurly)
        })

        // See 11.1.5
        // this inlines PropertySetParameterList
        $.RULE("PropertyName", () => {
            $.OR([
                { ALT: () => $.CONSUME(t.IdentifierName) },
                { ALT: () => $.CONSUME(t.StringLiteral) },
                { ALT: () => $.CONSUME(t.NumericLiteral) }
            ])
        })

        // See 11.2
        // merging MemberExpression, NewExpression and CallExpression into one rule
        $.RULE("MemberCallNewExpression", () => {
            $.MANY(() => {
                $.CONSUME(t.NewTok)
            })

            $.OR([
                { ALT: () => $.SUBRULE($.PrimaryExpression) },
                { ALT: () => $.SUBRULE($.FunctionExpression) }
            ])

            $.MANY2(() => {
                $.OR2([
                    { ALT: () => $.SUBRULE($.BoxMemberExpression) },
                    { ALT: () => $.SUBRULE($.DotMemberExpression) },
                    { ALT: () => $.SUBRULE($.Arguments) }
                ])
            })
        })

        $.RULE("BoxMemberExpression", () => {
            $.CONSUME(t.LBracket)
            $.SUBRULE($.Expression)
            $.CONSUME(t.RBracket)
        })

        $.RULE("DotMemberExpression", () => {
            $.CONSUME(t.Dot)
            $.CONSUME(t.IdentifierName)
        })

        // See 11.2
        // this inlines ArgumentList
        $.RULE("Arguments", () => {
            $.CONSUME(t.LParen)
            $.OPTION(() => {
                $.SUBRULE($.AssignmentExpression)
                $.MANY(() => {
                    $.CONSUME(t.Comma)
                    $.SUBRULE2($.AssignmentExpression)
                })
            })
            $.CONSUME(t.RParen)
        })

        // See 11.3
        $.RULE("PostfixExpression", () => {
            // LHSExpression(see 11.2) is identical to MemberCallNewExpression
            $.SUBRULE($.MemberCallNewExpression)
            $.OPTION({
                GATE: this.noLineTerminatorHere,
                DEF: () => {
                    $.OR([
                        { ALT: () => $.CONSUME(t.PlusPlus) },
                        { ALT: () => $.CONSUME(t.MinusMinus) }
                    ])
                }
            })
        })

        // See 11.4
        $.RULE("UnaryExpression", () => {
            $.OR([
                { ALT: () => $.SUBRULE($.PostfixExpression) },
                {
                    ALT: () => {
                        $.OR2([
                            { ALT: () => $.CONSUME(t.DeleteTok) },
                            { ALT: () => $.CONSUME(t.VoidTok) },
                            { ALT: () => $.CONSUME(t.TypeOfTok) },
                            { ALT: () => $.CONSUME(t.PlusPlus) },
                            { ALT: () => $.CONSUME(t.MinusMinus) },
                            { ALT: () => $.CONSUME(t.Plus) },
                            { ALT: () => $.CONSUME(t.Minus) },
                            { ALT: () => $.CONSUME(t.Tilde) },
                            { ALT: () => $.CONSUME(t.Exclamation) }
                        ])
                        $.SUBRULE($.UnaryExpression)
                    }
                }
            ])
        })

        // See 11.5
        $.RULE("MultiplicativeExpression", () => {
            $.SUBRULE($.UnaryExpression)
            $.MANY(() => {
                $.CONSUME(t.AbsMultiplicativeOperator)
                $.SUBRULE2($.UnaryExpression)
            })
        })

        // See 11.6
        $.RULE("AdditiveExpression", () => {
            $.SUBRULE($.MultiplicativeExpression)
            $.MANY(() => {
                $.CONSUME(t.AbsAdditiveOperator)
                $.SUBRULE2($.MultiplicativeExpression)
            })
        })

        // See 11.7
        $.RULE("ShiftExpression", () => {
            $.SUBRULE($.AdditiveExpression)
            $.MANY(() => {
                $.CONSUME(t.AbsShiftOperator)
                $.SUBRULE2($.AdditiveExpression)
            })
        })

        // See 11.8
        $.RULE("RelationalExpression", () => {
            $.SUBRULE($.ShiftExpression)
            $.MANY(() => {
                $.OR([
                    { ALT: () => $.CONSUME(t.AbsRelationalOperator) },
                    { ALT: () => $.CONSUME(t.InstanceOfTok) },
                    { ALT: () => $.CONSUME(t.InTok) }
                ])
                $.SUBRULE2($.ShiftExpression)
            })
        })

        // See 11.8
        $.RULE("RelationalExpressionNoIn", () => {
            $.SUBRULE($.ShiftExpression)
            $.MANY(() => {
                $.OR([
                    { ALT: () => $.CONSUME(t.AbsRelationalOperator) },
                    { ALT: () => $.CONSUME(t.InstanceOfTok) }
                ])
                $.SUBRULE2($.ShiftExpression)
            })
        })

        // See 11.9
        $.RULE("EqualityExpression", () => {
            $.SUBRULE($.RelationalExpression)
            $.MANY(() => {
                $.CONSUME(t.AbsEqualityOperator)
                $.SUBRULE2($.RelationalExpression)
            })
        })

        // See 11.9
        $.RULE("EqualityExpressionNoIn", () => {
            $.SUBRULE($.RelationalExpressionNoIn)
            $.MANY(() => {
                $.CONSUME(t.AbsEqualityOperator)
                $.SUBRULE2($.RelationalExpressionNoIn)
            })
        })

        // See 11.10
        $.RULE("BitwiseANDExpression", () => {
            $.SUBRULE($.EqualityExpression)
            $.MANY(() => {
                $.CONSUME(t.Ampersand)
                $.SUBRULE2($.EqualityExpression)
            })
        })

        // See 11.10
        $.RULE("BitwiseANDExpressionNoIn", () => {
            $.SUBRULE($.EqualityExpressionNoIn)
            $.MANY(() => {
                $.CONSUME(t.Ampersand)
                $.SUBRULE2($.EqualityExpressionNoIn)
            })
        })

        // See 11.10
        $.RULE("BitwiseXORExpression", () => {
            $.SUBRULE($.BitwiseANDExpression)
            $.MANY(() => {
                $.CONSUME(t.Circumflex)
                $.SUBRULE2($.BitwiseANDExpression)
            })
        })

        // See 11.10
        $.RULE("BitwiseXORExpressionNoIn", () => {
            $.SUBRULE($.BitwiseANDExpressionNoIn)
            $.MANY(() => {
                $.CONSUME(t.Circumflex)
                $.SUBRULE2($.BitwiseANDExpressionNoIn)
            })
        })

        // See 11.10
        $.RULE("BitwiseORExpression", () => {
            $.SUBRULE($.BitwiseXORExpression)
            $.MANY(() => {
                $.CONSUME(t.VerticalBar)
                $.SUBRULE2($.BitwiseXORExpression)
            })
        })

        // See 11.10
        $.RULE("BitwiseORExpressionNoIn", () => {
            $.SUBRULE($.BitwiseXORExpressionNoIn)
            $.MANY(() => {
                $.CONSUME(t.VerticalBar)
                $.SUBRULE2($.BitwiseXORExpressionNoIn)
            })
        })

        // See 11.11
        $.RULE("LogicalANDExpression", () => {
            $.SUBRULE($.BitwiseORExpression)
            $.MANY(() => {
                $.CONSUME(t.AmpersandAmpersand)
                $.SUBRULE2($.BitwiseORExpression)
            })
        })

        // See 11.11
        $.RULE("LogicalANDExpressionNoIn", () => {
            $.SUBRULE($.BitwiseORExpressionNoIn)
            $.MANY(() => {
                $.CONSUME(t.AmpersandAmpersand)
                $.SUBRULE2($.BitwiseORExpressionNoIn)
            })
        })

        // See 11.11
        $.RULE("LogicalORExpression", () => {
            $.SUBRULE($.LogicalANDExpression)
            $.MANY(() => {
                $.CONSUME(t.VerticalBarVerticalBar)
                $.SUBRULE2($.LogicalANDExpression)
            })
        })

        // See 11.11
        $.RULE("LogicalORExpressionNoIn", () => {
            $.SUBRULE($.LogicalANDExpressionNoIn)
            $.MANY(() => {
                $.CONSUME(t.VerticalBarVerticalBar)
                $.SUBRULE2($.LogicalANDExpressionNoIn)
            })
        })

        // See 11.12
        $.RULE("ConditionalExpression", () => {
            $.SUBRULE($.LogicalORExpression)
            $.OPTION(() => {
                $.CONSUME(t.Question)
                $.SUBRULE($.AssignmentExpression)
                $.CONSUME(t.Colon)
                $.SUBRULE2($.AssignmentExpression)
            })
        })

        // See 11.12
        $.RULE("ConditionalExpressionNoIn", () => {
            $.SUBRULE($.LogicalORExpressionNoIn)
            $.OPTION(() => {
                $.CONSUME(t.Question)
                // TODO: why does spec not say "NoIn" here?
                $.SUBRULE($.AssignmentExpression)
                $.CONSUME(t.Colon)
                $.SUBRULE2($.AssignmentExpressionNoIn)
            })
        })

        // See 11.13
        $.RULE("AssignmentExpression", () => {
            $.SUBRULE($.ConditionalExpression)
            $.OPTION(() => {
                $.CONSUME(t.AbsAssignmentOperator)
                $.SUBRULE($.AssignmentExpression)
            })
        })

        // See 11.13
        $.RULE("AssignmentExpressionNoIn", () => {
            $.SUBRULE($.ConditionalExpressionNoIn)
            $.OPTION(() => {
                // AssignmentOperator See 11.13 --> this is implemented as a Token Abs class
                $.CONSUME(t.AbsAssignmentOperator)
                $.SUBRULE($.AssignmentExpressionNoIn)
            })
        })

        // See 11.14
        $.RULE("Expression", () => {
            $.SUBRULE($.AssignmentExpression)
            $.MANY(() => {
                $.CONSUME(t.Comma)
                $.SUBRULE2($.AssignmentExpression)
            })
        })

        // See 11.14
        $.RULE("ExpressionNoIn", () => {
            $.SUBRULE($.AssignmentExpressionNoIn)
            $.MANY(() => {
                $.CONSUME(t.Comma)
                $.SUBRULE2($.AssignmentExpressionNoIn)
            })
        })

        // A.4 Statements

        // See clause 12
        $.RULE("Statement", () => {
            $.OR([
                { ALT: () => $.SUBRULE($.Block) },
                { ALT: () => $.SUBRULE($.VariableStatement) },
                { ALT: () => $.SUBRULE($.EmptyStatement) },
                // "LabelledStatement" must appear before "ExpressionStatement" due to common lookahead prefix ("inner :" vs "inner")
                { ALT: () => $.SUBRULE($.LabelledStatement) },
                { ALT: () => $.SUBRULE($.ExpressionStatement) },
                { ALT: () => $.SUBRULE($.IfStatement) },
                { ALT: () => $.SUBRULE($.IterationStatement) },
                { ALT: () => $.SUBRULE($.ContinueStatement) },
                { ALT: () => $.SUBRULE($.BreakStatement) },
                { ALT: () => $.SUBRULE($.ReturnStatement) },
                { ALT: () => $.SUBRULE($.WithStatement) },
                { ALT: () => $.SUBRULE($.SwitchStatement) },
                { ALT: () => $.SUBRULE($.ThrowStatement) },
                { ALT: () => $.SUBRULE($.TryStatement) },
                { ALT: () => $.SUBRULE($.DebuggerStatement) }
            ])
        })

        // See 12.1
        $.RULE("Block", () => {
            $.CONSUME(t.LCurly)
            $.OPTION(() => {
                $.SUBRULE($.StatementList)
            })
            $.CONSUME(t.RCurly)
        })

        // See 12.1
        $.RULE("StatementList", () => {
            $.AT_LEAST_ONE(() => {
                $.SUBRULE($.Statement)
            })
        })

        // See 12.2
        $.RULE("VariableStatement", () => {
            $.CONSUME(t.VarTok)
            $.SUBRULE($.VariableDeclarationList)
            // TODO: constant
            $.CONSUME(t.Semicolon, ENABLE_SEMICOLON_INSERTION)
        })

        // See 12.2
        $.RULE("VariableDeclarationList", () => {
            $.SUBRULE($.VariableDeclaration)
            $.MANY(() => {
                $.CONSUME(t.Comma)
                $.SUBRULE2($.VariableDeclaration)
            })
        })

        //// See 12.2
        $.RULE("VariableDeclarationListNoIn", () => {
            $.SUBRULE($.VariableDeclarationNoIn)
            $.MANY(() => {
                $.CONSUME(t.Comma)
                $.SUBRULE2($.VariableDeclarationNoIn)
            })
        })

        // See 12.2
        $.RULE("VariableDeclaration", () => {
            $.CONSUME(t.Identifier)
            $.OPTION(() => {
                $.SUBRULE($.Initialiser)
            })
        })

        //// See 12.2
        $.RULE("VariableDeclarationNoIn", () => {
            $.CONSUME(t.Identifier)
            $.OPTION(() => {
                $.SUBRULE($.InitialiserNoIn)
            })
        })

        // See 12.2
        $.RULE("Initialiser", () => {
            $.CONSUME(t.Eq)
            $.SUBRULE($.AssignmentExpression)
        })

        // See 12.2
        $.RULE("InitialiserNoIn", () => {
            $.CONSUME(t.Eq)
            $.SUBRULE($.AssignmentExpressionNoIn)
        })

        // See 12.3
        $.RULE("EmptyStatement", () => {
            //  a semicolon is never inserted automatically if the semicolon would then be parsed as an empty statement
            $.CONSUME(t.Semicolon, DISABLE_SEMICOLON_INSERTION)
        })

        // See 12.4
        $.RULE("ExpressionStatement", () => {
            // the spec defines [lookahead ? {{, function}] to avoid some ambiguities, however those ambiguities only exist
            // because in a BNF grammar there is no priority between alternatives. This implementation however, is deterministic
            // the first alternative found to match will be taken. thus these ambiguities can be resolved
            // by ordering the alternatives
            $.SUBRULE($.Expression)
            $.CONSUME(t.Semicolon, ENABLE_SEMICOLON_INSERTION)
        })

        // See 12.5
        $.RULE("IfStatement", () => {
            $.CONSUME(t.IfTok)
            $.CONSUME(t.LParen)
            $.SUBRULE($.Expression)
            $.CONSUME(t.RParen)
            $.SUBRULE($.Statement)
            // refactoring spec to use an OPTION production for the 'else'
            // to resolve the dangling if-else problem
            $.OPTION(() => {
                $.CONSUME(t.ElseTok)
                $.SUBRULE2($.Statement)
            })
        })

        // See 12.6
        $.RULE("IterationStatement", () => {
            // the original spec rule has been refactored into 3 smaller ones
            $.OR([
                { ALT: () => $.SUBRULE($.DoIteration) },
                { ALT: () => $.SUBRULE($.WhileIteration) },
                { ALT: () => $.SUBRULE($.ForIteration) }
            ])
        })

        $.RULE("DoIteration", () => {
            $.CONSUME(t.DoTok)
            $.SUBRULE($.Statement)
            $.CONSUME(t.WhileTok)
            $.CONSUME(t.LParen)
            $.SUBRULE($.Expression)
            $.CONSUME(t.RParen)
            $.CONSUME(t.Semicolon, ENABLE_SEMICOLON_INSERTION)
        })

        $.RULE("WhileIteration", () => {
            $.CONSUME(t.WhileTok)
            $.CONSUME(t.LParen)
            $.SUBRULE($.Expression)
            $.CONSUME(t.RParen)
            $.SUBRULE($.Statement)
        })

        $.RULE("ForIteration", () => {
            let headerExp
            let inPossible = false

            $.CONSUME(t.ForTok)
            $.CONSUME(t.LParen)
            $.OR([
                {
                    ALT: () => {
                        $.CONSUME(t.VarTok)
                        headerExp = $.SUBRULE($.VariableDeclarationListNoIn)

                        // 'in' is only possible if there was just one VarDec
                        // TODO, compute this without CST
                        // inPossible = headerExp.children.Comma.length === 1
                        inPossible = true
                        $.SUBRULE($.ForHeaderParts, [inPossible])
                    }
                },
                {
                    ALT: () => {
                        $.OPTION(() => {
                            headerExp = $.SUBRULE($.ExpressionNoIn)
                            inPossible = this.canInComeAfterExp(headerExp)
                        })
                        $.SUBRULE2($.ForHeaderParts, [inPossible])
                    }
                }
            ])
            $.CONSUME(t.RParen)
            $.SUBRULE($.Statement)
        })

        $.RULE(
            "ForHeaderParts",
            /**
             * @param inPossible whether or not the second alternative starting with InTok is available in
             *        the current context. note that this means the grammar is not context free.
             *        however the only other alternative is to use backtracking which is even worse.
             */
            inPossible => {
                $.OR([
                    {
                        ALT: () => {
                            // no semicolon insertion in for header
                            $.CONSUME(t.Semicolon, DISABLE_SEMICOLON_INSERTION)
                            $.OPTION(() => {
                                $.SUBRULE($.Expression)
                            })
                            // no semicolon insertion in for header
                            $.CONSUME2(t.Semicolon, DISABLE_SEMICOLON_INSERTION)
                            $.OPTION2(() => {
                                $.SUBRULE2($.Expression)
                            })
                        }
                    },
                    {
                        GATE: () => inPossible,
                        ALT: () => {
                            $.CONSUME(t.InTok)
                            $.SUBRULE3($.Expression)
                        }
                    }
                ])
            }
        )

        // See 12.7
        $.RULE("ContinueStatement", () => {
            $.CONSUME(t.ContinueTok)
            $.OPTION({
                GATE: this.noLineTerminatorHere,
                DEF: () => {
                    $.CONSUME(t.Identifier)
                }
            })
            $.CONSUME(t.Semicolon, ENABLE_SEMICOLON_INSERTION)
        })

        // See 12.8
        $.RULE("BreakStatement", () => {
            $.CONSUME(t.BreakTok)
            $.OPTION({
                GATE: this.noLineTerminatorHere,
                DEF: () => {
                    $.CONSUME(t.Identifier)
                }
            })
            $.CONSUME(t.Semicolon, ENABLE_SEMICOLON_INSERTION)
        })

        // See 12.9
        $.RULE("ReturnStatement", () => {
            $.CONSUME(t.ReturnTok)
            $.OPTION({
                GATE: this.noLineTerminatorHere,
                DEF: () => {
                    $.SUBRULE($.Expression)
                }
            })
            $.CONSUME(t.Semicolon, ENABLE_SEMICOLON_INSERTION)
        })

        // See 12.10
        $.RULE("WithStatement", () => {
            $.CONSUME(t.WithTok)
            $.CONSUME(t.LParen)
            $.SUBRULE($.Expression)
            $.CONSUME(t.RParen)
            $.SUBRULE($.Statement)
        })

        // See 12.11
        $.RULE("SwitchStatement", () => {
            $.CONSUME(t.SwitchTok)
            $.CONSUME(t.LParen)
            $.SUBRULE($.Expression)
            $.CONSUME(t.RParen)
            $.SUBRULE($.CaseBlock)
        })

        // See 12.11
        $.RULE("CaseBlock", () => {
            $.CONSUME(t.LCurly)
            $.OPTION(() => {
                $.SUBRULE($.CaseClauses)
            })
            $.OPTION2(() => {
                $.SUBRULE($.DefaultClause)
            })
            $.OPTION3(() => {
                $.SUBRULE2($.CaseClauses)
            })
            $.CONSUME(t.RCurly)
        })

        // See 12.11
        $.RULE("CaseClauses", () => {
            $.AT_LEAST_ONE(() => {
                $.SUBRULE($.CaseClause)
            })
        })

        // See 12.11
        $.RULE("CaseClause", () => {
            $.CONSUME(t.CaseTok)
            $.SUBRULE($.Expression)
            $.CONSUME(t.Colon)
            $.OPTION(() => {
                $.SUBRULE($.StatementList)
            })
        })

        // See 12.11
        $.RULE("DefaultClause", () => {
            $.CONSUME(t.DefaultTok)
            $.CONSUME(t.Colon)
            $.OPTION(() => {
                $.SUBRULE($.StatementList)
            })
        })

        // See 12.12
        $.RULE("LabelledStatement", () => {
            $.CONSUME(t.Identifier)
            $.CONSUME(t.Colon)
            $.OPTION(() => {
                $.SUBRULE($.Statement)
            })
        })

        // See 12.13
        $.RULE("ThrowStatement", () => {
            $.CONSUME(t.ThrowTok)
            if (this.lineTerminatorHere()) {
                // this will trigger re-sync recover which is the desired behavior,
                // there is no danger of inRule recovery (single token insertion/deletion)
                // happening in this case because that type of recovery can only happen if CONSUME(...) was invoked.
                this.SAVE_ERROR(
                    new chevrotain.exceptions.MismatchedTokenException(
                        "Line Terminator not allowed before Expression in Throw Statement"
                        // TODO: create line terminator token on the fly?
                    )
                )
            }
            $.SUBRULE($.Expression)
            $.CONSUME(t.Semicolon, ENABLE_SEMICOLON_INSERTION)
        })

        // See 12.14
        $.RULE("TryStatement", () => {
            $.CONSUME(t.TryTok)
            $.SUBRULE($.Block)

            $.OR([
                {
                    ALT: () => {
                        $.SUBRULE($.Catch)
                        $.OPTION(() => {
                            $.SUBRULE($.Finally)
                        })
                    }
                },
                { ALT: () => $.SUBRULE2($.Finally) }
            ])
        })

        // See 12.14
        $.RULE("Catch", () => {
            $.CONSUME(t.CatchTok)
            $.CONSUME(t.LParen)
            $.CONSUME(t.Identifier)
            $.CONSUME(t.RParen)
            $.SUBRULE($.Block)
        })

        // See 12.14
        $.RULE("Finally", () => {
            $.CONSUME(t.FinallyTok)
            $.SUBRULE($.Block)
        })

        // See 12.15
        $.RULE("DebuggerStatement", () => {
            $.CONSUME(t.DebuggerTok)
            $.CONSUME(t.Semicolon, ENABLE_SEMICOLON_INSERTION)
        })

        // A.5 Functions and Programs

        // See clause 13
        $.RULE("FunctionDeclaration", () => {
            $.CONSUME(t.FunctionTok)
            $.CONSUME(t.Identifier)
            $.CONSUME(t.LParen)
            $.OPTION(() => {
                $.SUBRULE($.FormalParameterList)
            })
            $.CONSUME(t.RParen)
            $.CONSUME(t.LCurly)
            $.SUBRULE($.SourceElements) // FunctionBody(clause 13) is equivalent to SourceElements
            $.CONSUME(t.RCurly)
        })

        // See clause 13
        $.RULE("FunctionExpression", () => {
            $.CONSUME(t.FunctionTok)
            $.OPTION1(() => {
                $.CONSUME(t.Identifier)
            })
            $.CONSUME(t.LParen)
            $.OPTION2(() => {
                $.SUBRULE($.FormalParameterList)
            })
            $.CONSUME(t.RParen)
            $.CONSUME(t.LCurly)
            $.SUBRULE($.SourceElements) // FunctionBody(clause 13) is equivalent to SourceElements
            $.CONSUME(t.RCurly)
        })

        // See clause 13
        $.RULE("FormalParameterList", () => {
            $.CONSUME(t.Identifier)
            $.MANY(() => {
                $.CONSUME(t.Comma)
                $.CONSUME2(t.Identifier)
            })
        })

        // See clause 14
        $.RULE("Program", () => {
            $.SUBRULE($.SourceElements)
        })

        // See clause 14
        // this inlines SourceElementRule rule from the spec
        $.RULE("SourceElements", () => {
            $.MANY(() => {
                // FunctionDeclaration appearing before statement implements [lookahead != {{, function}] in ExpressionStatement
                // See Functionhttps://www.ecma-international.org/ecma-262/5.1/index.html#sec-12.4Declaration
                $.OR([
                    { ALT: () => $.SUBRULE($.FunctionDeclaration) },
                    { ALT: () => $.SUBRULE($.Statement) }
                ])
            })
        })

        ECMAScript5Parser.performSelfAnalysis(this)
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
    canAndShouldDoSemiColonInsertion() {
        const isNextTokenSemiColon = tokenMatcher(this.LA(1), t.Semicolon)
        return (
            !isNextTokenSemiColon &&
            (this.lineTerminatorHere() || // basic rule 1a and 3
            tokenMatcher(this.LA(1), t.RCurly) || // basic rule 1b
                tokenMatcher(this.LA(1), EOF))
        ) // basic rule 2
    }

    CONSUME(tokClass, trySemiColonInsertion) {
        if (
            trySemiColonInsertion === true &&
            this.canAndShouldDoSemiColonInsertion()
        ) {
            const insertedSemiColon = {
                tokenType: t.Semicolon.tokenType,
                image: ";",
                startOffset: NaN,
                endOffset: NaN,
                automaticallyInserted: true
            }
            return insertedSemiColon
        }
        return super.CONSUME1(tokClass)
    }

    CONSUME2(tokClass, trySemiColonInsertion) {
        if (
            trySemiColonInsertion === true &&
            this.canAndShouldDoSemiColonInsertion()
        ) {
            const insertedSemiColon = {
                tokenType: t.Semicolon.tokenType,
                image: ";",
                startOffset: NaN,
                endOffset: NaN,
                automaticallyInserted: true
            }
            return insertedSemiColon
        }
        return super.CONSUME2(tokClass)
    }

    canInComeAfterExp(exp) {
        // anything that a call to MemberCallNewExpression rule may return
        // TODO: update logic to match vs CST, remove instanceof usage
        // TODO: exploring the CST will be very ugly here due to the deep depth of the hierarcay.
        // TODO: perhaps extract precedence from the grammar like in the swift parser?
        return (
            exp.payload instanceof MemberCallNewExpression ||
            exp.payload instanceof ObjectLiteral ||
            exp.payload instanceof ArrayLiteral ||
            exp.payload instanceof ParenthesisExpression ||
            exp.payload instanceof t.AbsLiteral ||
            exp.payload instanceof t.ThisTok ||
            exp.payload instanceof t.Identifier
        )
    }

    noLineTerminatorHere() {
        return !this.lineTerminatorHere()
    }

    lineTerminatorHere() {
        // TODO implement
        return false
    }
}

module.exports = {
    ECMAScript5Parser
}
