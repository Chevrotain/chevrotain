## 3.0.0

*   A CST Node's children dictionary no longer contains empty arrays
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

*   The creation of TokenTypes using the class keyword syntax has been soft deprecated.
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

-   defaultErrorProvider was renamed to defaultParserErrorProvider

-   **All** the gast namespace was flattened into the API's root, e.g:

    ```javascript
    // Old API - using nested namespace.
    chevrotain.gast.Alternation

    // New API - No nested namespaces.
    chevrotain.Alternation
    ```

-   The exceptions namespace was also flattened into the API's root.

-   The constructors of all the gast (Grammar AST) structure have been
    refactored to use the config object pattern additionally some properties have been renamed or removed.
    See the new SDK docs for details:
    *   [Rule](https://sap.github.io/chevrotain/documentation/2_0_0/classes/rule.html)
    *   [Terminal](https://sap.github.io/chevrotain/documentation/2_0_0/classes/terminal.html)
    *   [NonTerminal](https://sap.github.io/chevrotain/documentation/2_0_0/classes/nonterminal.html)
    *   [Alternation](https://sap.github.io/chevrotain/documentation/2_0_0/classes/alternation.html)
    *   [Option](https://sap.github.io/chevrotain/documentation/2_0_0/classes/option.html)
    *   [Repetition](https://sap.github.io/chevrotain/documentation/2_0_0/classes/repetition.html)
    *   [RepetitionWithSeparator](https://sap.github.io/chevrotain/documentation/2_0_0/classes/repetitionwithseparator.html)
    *   [RepetitionMandatory](https://sap.github.io/chevrotain/documentation/2_0_0/classes/repetitionmandatory.html)
    *   [RepetitionMandatoryWithSeparator](https://sap.github.io/chevrotain/documentation/2_0_0/classes/repetitionmandatorywithseparator.html)
    *   [Flat](https://sap.github.io/chevrotain/documentation/2_0_0/classes/flat.html) (sequence)
