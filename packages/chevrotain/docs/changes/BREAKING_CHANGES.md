## 5.0.0

-   Setting the Parser's input **before** `this.performSelfAnalysis` is called will now throw an error.
    This has been done to enable the automatic detection of missing `this.performSelfAnalysis` calls.

## 4.0.0

-   The Parser constructor no longer accepts a token vector as an argument.
    The "input" **setter** should be used instead, for example:

    ```javascript
    // Old API
    class MyOldParser extends Parser {
        constructor(input, config) {
            super(input, allTokens, config)
        }
    }

    const oldInstance = new MyOldParser(
        [
            /* token vector */
        ],
        {}
    )

    // New API
    class MyNewParser extends Parser {
        constructor(config) {
            super(allTokens, config)
        }
    }

    const newInstance = new MyNewParser({})
    newInstance.input = [
        /* token vector */
    ]
    ```

    -   Note that the input **setter** has existed for a while and has been used
        in the official examples and documentation, therefore it is likely that
        only the constructor need be modified in existing parsers.

-   Automatic [Concrete Syntax Tree](https://sap.github.io/chevrotain/docs/guide/concrete_syntax_tree.html) output is now enabled by default.
    This means that parser which rely on **embedded actions** must **explicitly** disable
    the CST output, for example:

    ```javascript
    class MyNewParser extends Parser {
        constructor() {
            // we have to explicitly disable the CST building for embedded actions to work.
            super(allTokens, { outputCst: false })
        }
    }
    ```

    -   If a parser already uses CST output no change is needed in 4.0

-   DSL repetitions no longer return any values in **embedded actions** mode:

    -   **MANY** / **AT_LEAST_ONE** no longer return an array of the iteration results.
        The iterations results should be collected manually instead:

        ```javascript
        // Before 4.0.0
        const stmts = $.MANY(() => {
            return $.SUBRULE(Statement)
        })

        // After 4.0.0
        const stmts = []
        $.MANY(() => {
            stmts.push($.SUBRULE(Statement))
        })
        ```

    -   Similarly **MANY_SEP** / **AT_LEAST_ONE_SEP** also no longer return any results.
        These used to return both the repetition result array and an array of separators Tokens consumed.
        It is still possible to manually collect the repetition results, but not the separator tokens.

    -   This change has no effect when using automatic **CST creation**.

## 3.0.0

-   A CST Node's children dictionary no longer contains empty arrays
    for unmatched terminals and non-terminals. This means that some existence checks
    conditions in the CST visitor must be refactored, for example:

    ```javascript
    class MyVisitor extends SomeBaseVisitor {
        atomicExpression(ctx) {
            // BAD - will fail due to "TypeError: Cannot read property '0' of undefined"
            if (ctx.Integer[0]) {
                return ctx.Integer[0].image
            }

            // GOOD - safe check
            if (ctx.Integer) {
                // if a property exists it's value is guaranteed to have at least one element.
                return ctx.Identifier[0].image
            }
        }
    }
    ```

## 2.0.0

-   The creation of TokenTypes using the class keyword syntax has been soft deprecated.
    and is no longer officially supported.
    e.g:

    ```javascript
    // No longer officially supported
    class Identifier {
        static pattern = /[a-zA-Z_]\w+/
    }

    // Use the createToken API instead
    const Identifier = createToken({
        name: "Identifier",
        pattern: /[a-zA-Z_]\w+/
    })
    ```

    See the reasoning in [this issue](https://github.com/SAP/chevrotain/issues/653).

*   defaultErrorProvider was renamed to defaultParserErrorProvider

*   **All** the gast namespace was flattened into the API's root, e.g:

    ```javascript
    // Old API - using nested namespace.
    chevrotain.gast.Alternation

    // New API - No nested namespaces.
    chevrotain.Alternation
    ```

*   The exceptions namespace was also flattened into the API's root.

*   The constructors of all the gast (Grammar AST) structure have been
    refactored to use the config object pattern additionally some properties have been renamed or removed.
    See the new SDK docs for details:
    -   [Rule](https://sap.github.io/chevrotain/documentation/2_0_0/classes/rule.html)
    -   [Terminal](https://sap.github.io/chevrotain/documentation/2_0_0/classes/terminal.html)
    -   [NonTerminal](https://sap.github.io/chevrotain/documentation/2_0_0/classes/nonterminal.html)
    -   [Alternation](https://sap.github.io/chevrotain/documentation/2_0_0/classes/alternation.html)
    -   [Option](https://sap.github.io/chevrotain/documentation/2_0_0/classes/option.html)
    -   [Repetition](https://sap.github.io/chevrotain/documentation/2_0_0/classes/repetition.html)
    -   [RepetitionWithSeparator](https://sap.github.io/chevrotain/documentation/2_0_0/classes/repetitionwithseparator.html)
    -   [RepetitionMandatory](https://sap.github.io/chevrotain/documentation/2_0_0/classes/repetitionmandatory.html)
    -   [RepetitionMandatoryWithSeparator](https://sap.github.io/chevrotain/documentation/2_0_0/classes/repetitionmandatorywithseparator.html)
    -   [Flat](https://sap.github.io/chevrotain/documentation/2_0_0/classes/flat.html) (sequence)
