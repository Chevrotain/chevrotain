# Custom Token Patterns

### TLDR

See: [**Runnable example**](https://github.com/SAP/chevrotain/blob/master/examples/lexer/custom_patterns/custom_patterns.js) for quick starting.

## Background

Normally a Token's pattern is defined using a JavaScript regular expression:

```javascript
const IntegerToken = createToken({ name: "IntegerToken", pattern: /\d+/ })
```

However in some circumstances the capability to provide a custom pattern matching implementation may be required.
There are a few use cases in which a custom pattern could be used:

-   We want to collect additional properties on the token objects.

    -   See [Custom Payloads](#custom-payloads) section.

-   The token cannot be easily (or at all) be defined using pure regular expressions.

    -   When context on previously lexed tokens is needed.
        For example: [Lexing Python like indentation using Chevrotain](https://github.com/SAP/chevrotain/blob/master/examples/lexer/python_indentation/python_indentation.js).

-   Workaround performance issues in specific regExp engines by providing a none regExp matcher implementation:
    -   [WebKit/Safari multiple orders of magnitude performance degradation for specific regExp patterns](https://bugs.webkit.org/show_bug.cgi?id=152578) 😞

## Usage

A custom pattern has a similar API to the API of the [RegExp.prototype.exec](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec)
function. But with a small constraint.

-   A custom pattern should behave as though the RegExp [sticky flag](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/sticky) has been set.
    This means that attempted matches must begin at the offset argument, **not** at the start of the input.

The basic syntax for supplying a custom pattern is defined by the [ICustomPattern](https://sap.github.io/chevrotain/documentation/6_2_0/interfaces/icustompattern.html) interface.
Example:

```javascript
function matchInteger(text, startOffset) {
    let endOffset = startOffset
    let charCode = text.charCodeAt(endOffset)
    // 0-9 digits
    while (charCode >= 48 && charCode <= 57) {
        endOffset++
        charCode = text.charCodeAt(endOffset)
    }

    // No match, must return null to conform with the RegExp.prototype.exec signature
    if (endOffset === startOffset) {
        return null
    } else {
        let matchedString = text.substring(startOffset, endOffset)
        // according to the RegExp.prototype.exec API the first item in the returned array must be the whole matched string.
        return [matchedString]
    }
}

createToken({
    name: "IntegerToken",
    pattern: { exec: matchInteger },

    // Optional property that will enable optimizations in the lexer
    // See: https://sap.github.io/chevrotain/documentation/6_2_0/interfaces/itokenconfig.html#start_chars_hint
    start_chars_hint: ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
})
```

Using an Object literal with only a single property is still a little verbose so an even more concise syntax is also supported:

```javascript
// pattern is passed the matcher function directly.
createToken({ name: "IntegerToken", pattern: matchInteger })
```

## Lexing Context

A custom token matcher has two optional arguments which allows accessing the current lexing context.
This context can be used to allow or disallow lexing certain Token Types depending
on the previously lexed tokens.

Lets expand the previous example to only allow lexing integers if the previous token was not an identifier (contrived example).

```javascript
const { tokenMatcher } = require("chevrotain")

function matchInteger(text, offset, matchedTokens, groups) {
    let lastMatchedToken = _.last(matchedTokens)

    // An Integer may not follow an Identifier
    if (tokenMatcher(lastMatchedToken, Identifier)) {
        // No match, must return null to conform with the RegExp.prototype.exec signature
        return null
    }
    // rest of the code from the example above...
}
```

A larger and non contrived example can seen here: [Lexing Python like indentation using Chevrotain](https://github.com/SAP/chevrotain/blob/master/examples/lexer/python_indentation/python_indentation.js).

It is important to note that The matchedTokens and groups arguments match the token and groups properties of the tokenize output ([ILexingResult](https://sap.github.io/chevrotain/documentation/6_2_0/interfaces/ilexingresult.html)).
These arguments are the current state of the lexing result so even if the lexer has performed error recovery any tokens found
in those arguments are still guaranteed to be in the final result.

## Custom Payloads

Sometimes we want to collect additional properties on an IToken object, for example:

-   Save RegExp capturing groups on the token object.
-   Subsets of the matched text, e.g: strip away the quotes from string literals.
-   Computed values from the matched text, e.g: Integer values of Date parts (day/month/year).

This can be done by attaching a **payload** property to our custom token matcher returned value,
for example:

```javascript
// We define the regExp only **once** (outside) to avoid performance issues.
const stringLiteralPattern = /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/y
function matchStringLiteral(text, startOffset) {
    // using 'y' sticky flag (Note it is not supported on IE11...)
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/sticky
    stringLiteralPattern.lastIndex = startOffset

    // Note that just because we are using a custom token pattern
    // Does not mean we cannot implement it using JavaScript Regular Expressions...
    const execResult = stringLiteralPattern.exec(text)
    if (execResult !== null) {
        const fullMatch = execResult[0]
        // compute the payload
        const matchWithOutQuotes = fullMatch.substr(1, fullMatch.length - 2)
        // attach the payload
        execResult.payload = matchWithOutQuotes
    }

    return execResult
}

const StringLiteral = createToken({
    name: "StringLiteral",
    pattern: matchStringLiteral,
    // custom patterns should explicitly specify the line_breaks option.
    line_breaks: false
})

// When we lex a StringLiteral text a "payload" property will now exist on the resulting token object.
```

Note:

-   A custom pattern may be implemented using Regular Expressions, these concepts are **not mutually exclusive**.
-   The payload property may be **anything** e.g:
    -   A single value (as in the example above).
    -   A JavaScript object with multiple properties.
    -   Capturing groups from a regExp exec method's results.
    -   The "groups" property of an regExp exec method's result (If [Named Capturing Groups are used](https://github.com/tc39/proposal-regexp-named-groups)).

Additional examples can be found [here](See: [**Runnable example for custom payloads**](https://github.com/SAP/chevrotain/blob/master/examples/lexer/custom_patterns/custom_patterns_payloads.js)).
