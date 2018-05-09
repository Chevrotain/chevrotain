# Resolving Lexer Errors

*   [No LINE_BREAKS Error.](#LINE_BREAKS)
*   [Unexpected RegExp Anchor Error.](#ANCHORS)
*   [Token Can Never Be Matched.](#UNREACHABLE)
*   [Complement Sets cannot be automatically optimized.](#COMPLEMENT)
*   [Failed parsing < /.../ > Using the regexp-to-ast library.](#REGEXP_PARSING)
*   [The regexp unicode flag is not currently supported by the regexp-to-ast library.](#UNICODE_OPTIMIZE)
*   [TokenType <...> is using a custom token pattern without providing <char_start_hint> parameter](#CUSTOM_OPTIMIZE)

## No LINE_BREAKS Error

A Chevrotain Lexer will by default track the full position information for each token.
This includes line and column information.

In order to support this the Lexer must be aware of which Tokens may include line terminators.
This information must be provided by the lexer's author.

This error means that the Lexer has been defined to track line and column information (perhaps by default).
Yet not a single one of the Token definitions passed to it was defined as possibly containing line terminators.

To resolve this choose one of the following:

1.  Disable the line and column position tracking using the [positionTracking][position_tracking] configuration option.

    ```javascript
    const myTokens = [IntegerLiteral, StringLiteral, WhiteSpace /*, ... */]
    const myLexer = new chevrotain.Lexer([myTokens], {
        positionTracking: "onlyOffset"
    })
    ```

2.  Mark the Tokens which may include a line terminator with a line_breaks flag.

    ```javascript
    const createToken = chevrotain.createToken

    // Using createToken API
    const Whitespace = createToken({
        name: "Whitespace",
        pattern: /\s+/,
        line_breaks: true
    })

    // or in ES2015 syntax with static properties
    class Whitespace extends chevrotain.Token {}
    Whitespace.PATTERN = /\s+/
    Whitespace.LINE_BREAKS = true

    const myTokens = [IntegerLiteral, StringLiteral, WhiteSpace /*, ... */]

    const myLexer = new chevrotain.Lexer([myTokens])
    ```

    *   Note that the definition of what constitutes a line terminator is controlled by the
        [lineTerminatorsPattern][line_terminator_docs] lexer configuration property.

    *   Also note that multi-line tokens such as some types of comments and string literals tokens may contain
        line terminators, if your language includes such tokens they must also be marked with the line_breaks flag.

## Unexpected RegExp Anchor Error

A Token RegExp pattern used in a chevrotain lexer may not use the start/end of input anchors ('$' and '^').

```javascript
const createToken = chevrotain.createToken

// Using createToken API
const Whitespace = createToken({
    name: "Integer",
    // invalid pattern using both anchors
    pattern: /^\d+$/
})
```

This will be checked for during the initialization of the lexer.
Unfortunately, this validation can detect false positives when the anchor characters
are used in certain regExp contexts, for example:

```javascript
const createToken = chevrotain.createToken

const semVer = createToken({
    name: "semVer",
    // will match semantic versions such as: "1.0.2", "^0.3.9"
    // inside a character set ([...]) the carat ('^') character does not act as an anchor.
    // yet it would still cause the validation to fail.
    pattern: /[~^]?\d+\.\d+\.\d+/
})

// will throw an error
new chevrotain.Lexer([semVer])
```

It is possible to workaround this problem by simply **escaping** the the offending carat or dollar sign.

```javascript
const semVer = createToken({
    name: "semVer",
    pattern: /[~\^]?\d+\.\d+\.\d+/
})
```

## Token can never be matched

This error means that A Token type can never be successfully matched as
a **previous** Token type in the lexer definition will **always** matched instead.
This happens because the default behavior of Chevrotain is to attempt to match
tokens **by the order** described in the lexer definition.

For example:

```javascript
const ForKeyword = createToken({
    name: "ForKeyword",
    pattern: /for/
})

const Identifier = createToken({
    name: "Identifier",
    pattern: /[a-zA-z]+/
})

// Will throw Token <ForKeyword> can never be matched...
// Because the input "for" is also a valid identifier
// and matching an identifier will be attempted first.
const myLexer = new chevrotain.Lexer([Identifier, ForKeyword])
```

*   Note that this validation is limited to simple patterns such as keywords
    The more general case of any pattern being a strict subset of a preceding pattern
    will require much more in depth RegExp analysis capabilities.

To resolve this simply re-arrange the order of Token types in the lexer
definition such that the more specific Token types will be listed first.

```javascript
// Identifier is now listed as the last Token type.
const myLexer = new chevrotain.Lexer([ForKeyword, Identifier])
```

Note that the solution provided above will create a new problem.
Any identifier **starting with** "for" will be lexed as **two separate** tokens,
a ForKeyword and an identifier. For example:

```javascript
const myLexer = new chevrotain.Lexer([ForKeyword, Identifier])

// [
//    {image:"for"}
//    {image:"ward"}
// ]
const tokensResult = myLexer.tokenize("forward")
```

To resolve this second problem see how to prefer the **longest match**
as demonstrated in the [keywords vs identifiers example][keywords_idents]

## Complement Sets cannot be automatically optimized

The Chevrotain Lexer performs optimizations by filtering the potential token matchs
using the next [charCode][mdn_char_code] to be consumed.
To apply this optimization the first possible charCodes for **every** TokenType must be identified.

When a TokenType pattern uses a regExp complement Set as a potential **first** character
the optimization is skipped as translating a complement set to a regular set requires too many cpu cycles
during the Lexer's initialization.

For example an XML Text is defined by **everything** except a closing tag.

```javascript
const XMLText = createToken({
    name: "XMLText",
    pattern: /[^<&]+/
})
```

This means that there are **65533** (65535 - 2) possible starting charCodes
For an XMLText token.

If the use of these optimizations is desired and the startup resources cost is acceptable
It is possilbe to enable the optimizations by explicitly providing a "[start_chars_hint][start_chars_hint]" property.
e.g:

```javascript
const hints = []
for (let i = 0; i <= 65535; i++) {
    // 38 is '<' and 60 is '&'
    if (i !== 38 || i !== 60) {
        hints.push(i)
    }
}

const XMLText = createToken({
    name: "XMLText",
    pattern: /[^<&]+/,
    start_chars_hint: hints
})
```

Please Note that filling such an array [can take over 1ms][fill_16_bits] on a modern machine.
So if you are only parsing small inputs and/or starting a new process for each
parser invocation the added initilization cost may be counter productive.

## Failed parsing < /.../ > Using the regexp-to-ast library

The Chevrotain Lexer performs optimizations by filtering the potential token matchs
using the next [charCode][mdn_char_code] to be consumed.
To apply this optimization the first possible charCodes for **every** TokenType must be identified.

This analysis is implemented using the [regexp-to-ast][regexp_to_ast] library.
This error usally indicates a bug in the regexp-to-ast library.
The impact is that the optimization described above would become disabled.
Lexing and Parsing will still work correctly, only slower...

Please open a bug for the [regexp-to-ast][regexp_to_ast] library.
This issue can be **worked around** by explicitly providing a "[start_chars_hint][start_chars_hint]" property.

```javascript
const Integer = createToken({
    name: "Integer",
    // lets assume that this pattern caused an error in regexp-to-ast
    pattern: /[1-9]\d*/,
    // by explicitly providing the first possible characters of this pattern
    // the analysis by the regexp-to-ast library will be skipped
    // and the optimization can be enabled.
    start_chars_hint: ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
})
```

## The regexp unicode flag is not currently supported by the regexp-to-ast library

The Chevrotain Lexer performs optimizations by filtering the potential token matchs
using the next [charCode][mdn_char_code] to be consumed.
To apply this optimization the first possible charCodes for **every** TokenType must be identified.

This analysis is implemented using the [regexp-to-ast][regexp_to_ast] library.
This library currently does not support the [unicode regexp flag][unicode_mdn]
The impact is that the optimization described above would become disabled.
Lexing and Parsing will still work correctly, just slower...

This issue can be **worked around** by explicitly providing a "[start_chars_hint][start_chars_hint]" property.

```javascript
// '💩' character
createToken({
    name: "PileOfPoo",
    // \u{xxxxx} 32bit unicode escape can only be used with the /u flag enabled.
    pattern: /\u{1F4A9}/u,
    // The '💩' character is represented by surrogate pairs: '\uD83D\uDCA9'
    // the start_chars_hint should only be provided the first of the pair.
    start_chars_hint: [55357]
})
```

Another way to **work around** the issue is to define the pattern as a string literal.
As that kind can be trivially optimized.
This is naturally only relevant for simple patterns.
For example:

```javascript
createToken({
    name: "LCurley",
    // note that the pattern is a string literal, not a regExp literal.
    pattern: "{"
})
```

## TokenType <...> is using a custom token pattern without providing <char_start_hint> parameter

The Chevrotain Lexer performs optimizations by filtering the potential token matchs
using the next [charCode][mdn_char_code] to be consumed.
To apply this optimization the first possible charCodes for **every** TokenType must be identified.

This information cannot be automatically computed for [custom token patterns][custom_token_patterns]
and **should** therefore be explicitly provided using the "[start_chars_hint][start_chars_hint]" property.

For example:

```javascript
const IntegerToken = createToken({
    name: "IntegerToken",
    pattern: {
        exec: (text, offset) => {
            /* ... */
        }
    },
    start_chars_hint: ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
})
```

Providing the "[start_chars_hint][start_chars_hint]" property is **not** mandatory.
It will only enable performance optimizations in the lexer.

[position_tracking]: https://sap.github.io/chevrotain/documentation/3_2_1/interfaces/ilexerconfig.html#positiontracking
[line_terminator_docs]: https://sap.github.io/chevrotain/documentation/3_2_1/interfaces/ilexerconfig.html#lineTerminatorsPattern
[start_chars_hint]: https://sap.github.io/chevrotain/documentation/3_2_1/interfaces/itokenconfig.html#start_chars_hint
[keywords_idents]: https://github.com/SAP/Chevrotain/blob/master/examples/lexer/keywords_vs_identifiers/keywords_vs_identifiers.js
[mdn_char_code]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charCodeAt
[fill_16_bits]: https://jsperf.com/fill-16-bits
[regexp_to_ast]: https://github.com/bd82/regexp-to-ast
[unicode_mdn]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/unicode
[custom_token_patterns]: https://sap.github.io/chevrotain/docs/guide/custom_token_patterns.html
