# Customizable Error Messages.

Chevrotain allows users to customize the parsing error messages.
This can be accomplished by implementing the [IParserErrorMessageProvider](https://sap.github.io/chevrotain/documentation/4_1_0/interfaces/iparsererrormessageprovider.html)
interface.

See [executable example](https://github.com/SAP/chevrotain/blob/master/examples/parser/custom_errors/custom_errors.js).

In addition it is also possible to provide strings values to be used in errors
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

-   [CONSUME](https://sap.github.io/chevrotain/documentation/4_1_0/classes/parser.html#consume)
-   [OR](https://sap.github.io/chevrotain/documentation/4_1_0/classes/parser.html#or)
-   [AT_LEAST_ONE](https://sap.github.io/chevrotain/documentation/4_1_0/classes/parser.html#at_least_one)
-   [AT_LEAST_ONE_SEP](https://sap.github.io/chevrotain/documentation/4_1_0/classes/parser.html#at_least_one_sep)
