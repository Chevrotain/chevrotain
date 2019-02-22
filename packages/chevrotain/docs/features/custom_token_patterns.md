# Custom Token Patterns

Chevrotain is not limited to only using JavaScript regular expressions to define Tokens.
Tokens can also be defined using arbitrary JavaScript code, for example:

```javascript
// our custom matcher
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

const IntegerToken = createToken({
    name: "IntegerToken",
    pattern: matchInteger
})
```

This feature is often used to implement complex lexing logic, such as [python indentation](https://github.com/SAP/chevrotain/tree/master/examples/lexer/python_indentation).

See [in depth guide](../guide/custom_token_patterns.md) for further details.
