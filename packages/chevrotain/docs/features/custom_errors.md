# Customizable Error Messages.

Chevrotain allows users to customize both the parser and lexer error messages.
This can be accomplished by implementing the following interfaces:

-   [IParserErrorMessageProvider](https://sap.github.io/chevrotain/documentation/4_7_0/interfaces/iparsererrormessageprovider.html)
-   [ILexerErrorMessageProvider](https://sap.github.io/chevrotain/documentation/4_7_0/interfaces/ilexererrormessageprovider.html)

See executable examples:

-   [Custom Parser Errors](https://github.com/SAP/chevrotain/blob/master/examples/parser/custom_errors/custom_errors.js).
-   [Custom Lexer Errors](https://github.com/SAP/chevrotain/blob/master/examples/lexer/custom_errors/custom_errors.js).

In addition it is also possible to directly provide strings values to be used in errors
for specific parsing DSL methods, for example:

```javascript
$.RULE("myStatement", () => {
    // ...
    $.CONSUME(SemiColon, {
        ERR_MSG: "expecting semiColon at end of myStatement"
    })
})
```

The **ERR_MSG** config property is available for the following DSL methods:

-   [CONSUME](https://sap.github.io/chevrotain/documentation/4_7_0/classes/cstparser.html#consume)
-   [OR](https://sap.github.io/chevrotain/documentation/4_7_0/classes/cstparser.html#or)
-   [AT_LEAST_ONE](https://sap.github.io/chevrotain/documentation/4_7_0/classes/cstparser.html#at_least_one)
-   [AT_LEAST_ONE_SEP](https://sap.github.io/chevrotain/documentation/4_7_0/classes/cstparser.html#at_least_one_sep)
