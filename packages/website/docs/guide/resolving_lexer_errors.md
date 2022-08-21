# Resolving Lexer Errors

- **Warnings**
  - [No LINE_BREAKS Found.](#LINE_BREAKS)
  - [Unable to identify line terminator usage in pattern.](#IDENTIFY_TERMINATOR)
  - [A Custom Token Pattern should specify the <line_breaks> option.](#CUSTOM_LINE_BREAK)
  - [Failed parsing < /.../ > Using the regexp-to-ast library.](#REGEXP_PARSING)
  - [The regexp unicode flag is not currently supported by the regexp-to-ast library.](#UNICODE_OPTIMIZE)
  - [Complement Sets cannot be automatically optimized.](#COMPLEMENT)

* **Errors**
  - [Unexpected RegExp Anchor Error.](#ANCHORS)
  - [Token Can Never Be Matched.](#UNREACHABLE)
  - [TokenType <...> is using a custom token pattern without providing <char_start_hint> parameter](#CUSTOM_OPTIMIZE)
  - [Missing \<lineTerminatorCharacters\> property on the Lexer config.](#MISSING_LINE_TERM_CHARS)

# Warnings

## No LINE_BREAKS Found

A Chevrotain Lexer will by default track the full position information for each token.
This includes line and column information.

In order to support this the Lexer must be aware of which Tokens may include line terminators.
Normally this information can be computed automatically however in some cases Chevrotain needs some hints.

This warning means that the Lexer has been defined to track line and column information (perhaps by default).
Yet not a single one of the Token definitions passed to it was detected as possibly containing line terminators.

To resolve this choose one of the following:

1.  Disable the line and column position tracking using the [positionTracking][position_tracking] configuration option.

    ```javascript
    const myTokens = [IntegerLiteral, StringLiteral, WhiteSpace /*, ... */]
    const myLexer = new chevrotain.Lexer([myTokens], {
      positionTracking: "onlyOffset"
    })
    ```

2.  Mark the Tokens which may include a line terminator with an explicit line_breaks flag.

    ```javascript
    const createToken = chevrotain.createToken

    const Whitespace = createToken({
      name: "Whitespace",
      pattern: /\s+/,
      // This is normally computed automatically...
      line_breaks: true
    })

    const myTokens = [IntegerLiteral, StringLiteral, WhiteSpace /*, ... */]

    const myLexer = new chevrotain.Lexer([myTokens])
    ```

    - Note that the definition of what constitutes a line terminator is controlled by the
      [lineTerminatorsPattern][line_terminator_docs] lexer configuration property.

    - Also note that multi-line tokens such as some types of comments and string literals tokens may contain
      line terminators.

## Unable to identify line terminator usage in pattern

A Chevrotain lexer must be aware which of the Token Types may match a line terminator.
This is required to compute the correct line and column position information.
Normally Chevrotain can identify this information automatically using the [regexp-to-ast library][regexp_to_ast],
however sometimes this logic fails. This is only a **warning** which will cause a small performance
loss to the lexer and would **not** impact its correctness.

To resolve this warning, **explicitly** specify the line_breaks option in the offending Token Types:

```javascript
const MyToken = createToken({
  name: "MyToken",
  pattern: /abc/,
  line_breaks: false
})
const MultiLineStringLiteral = createToken({
  name: "MultiLineStringLiteral",
  pattern: /`[^`]*`/,
  line_breaks: true
})
```

Also please open an issue in the [regexp-to-ast library][regexp_to_ast]
so the root problem could be tracked and resolved.

## A Custom Token Pattern should specify the <line_breaks> option

A Chevrotain lexer must be aware which of the Token Types may match a line terminator.
It is not possible to do so automatically when using [custom token patterns][custom_token_patterns].
This means it is highly recommended to explicitly provide the line_breaks argument when creating
a TokenType:

```javascript
const MyCustomToken = createToken({
  name: "MyCustomToken",
  pattern: { exec: matchFunction },
  line_breaks: false
})
const MyCustomMultiLineToken = createToken({
  name: "MyCustomMultiLineToken",
  pattern: { exec: matchFunction2 },
  line_breaks: true
})
```

This is only a **warning** which will cause a small performance
loss to the lexer and would not impact its correctness.
If no explicit <line_break> option is provided it would be implicitly treated as "true"
for [custom token patterns][custom_token_patterns].

## Failed parsing < /.../ > Using the regexp-to-ast library

The Chevrotain Lexer performs optimizations by filtering the potential token matches
using the next [charCode][mdn_char_code] to be consumed.
To apply this optimization the first possible charCodes for **every** Token Type must be identified.

This analysis is implemented using the [regexp-to-ast][regexp_to_ast] library.
Which means this **warning** usually indicates a bug in the regexp-to-ast library.
The impact is only that the optimization described above would become disabled.
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

The Chevrotain Lexer performs optimizations by filtering the potential token matches
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

## Complement Sets cannot be automatically optimized

The Chevrotain Lexer performs optimizations by filtering the potential token matches
using the next [charCode][mdn_char_code] about to be consumed.
To apply this optimization the first possible charCodes for **every** TokenType must be known in advance.

When a TokenType pattern uses a regExp complement set as a potential **first** character
the optimization is skipped as translating a complement set to a regular set is fairly costly
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

If the use of these runtime optimizations is needed and the startup resources cost is acceptable
It is possible to enable the optimizations by explicitly providing a "[start_chars_hint][start_chars_hint]" property.
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

Please Note that filling such an array can be cpu intensive.
So if you are only parsing small inputs and/or starting a new process for each
parser invocation the added initialization cost may be counterproductive.

Another solution to this problem is to re-define the Token pattern without using a complement.
For example: the XMLText pattern above could be re-defined as:

```javascript
const XMLText = createToken({
  name: "XMLText",
  // Equivalent to: /[^<&]+/ but a-lot less clear :(
  // Note that:
  //   - "\u0026" === "&"
  //   - "\u003C" === "<"
  pattern: /[\u0000-\u0025\u0027-\u003B\u003D-\uFFFF]+/
})
```

Note that internally Chevrotain avoids creating a 16bits large data structure
so this method would be the most optimized both in terms of runtime and initialization time.

# Errors

## Unexpected RegExp Anchor Error

A Token RegExp pattern used in a chevrotain lexer may not use the start/end of input anchors ('\$' and '^').

```javascript
const createToken = chevrotain.createToken

// Using createToken API
const Whitespace = createToken({
  name: "Integer",
  // invalid pattern using both anchors
  pattern: /^\d+$/
})

// will throw an error
new chevrotain.Lexer([semVer])
```

To resolve this simply avoid using anchors in your Token Types patterns.

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

- Note that this validation is limited to simple patterns such as keywords
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

## TokenType <...> is using a custom token pattern without providing <char_start_hint> parameter

The Chevrotain Lexer performs optimizations by filtering the potential token matches
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

## Missing \<lineTerminatorCharacters\> property on the Lexer config

Chevrotain treats `/\n|\r\n?/` as line terminators, but that is insufficient for some grammars.
Therefore, it is possible to customize the definition of line terminators using the [lineTerminatorPattern option][line_terminator_pattern].
When doing so, however, it is also necessary to provide the [lineTerminatorCharacters option][line_terminator_characters].
This causes a bit of duplication and may be simplified in future versions.

Example:

```javascript
const myLexer = new chevrotain.Lexer([], {
  // For our lexer only "\n" is a counted as a line terminator
  lineTerminatorsPattern: /\n/,
  // Duplicate information, "\n".charCodeAt(0) === 10
  lineTerminatorCharacters: [10]
})
```

[position_tracking]: https://chevrotain.io/documentation/10_3_0/interfaces/ILexerConfig.html#positionTracking
[line_terminator_docs]: https://chevrotain.io/documentation/10_3_0/interfaces/ILexerConfig.html#lineTerminatorsPattern
[start_chars_hint]: https://chevrotain.io/documentation/10_3_0/interfaces/ITokenConfig.html#start_chars_hint
[keywords_idents]: https://github.com/chevrotain/chevrotain/blob/master/examples/lexer/keywords_vs_identifiers/keywords_vs_identifiers.js
[mdn_char_code]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charCodeAt
[regexp_to_ast]: https://github.com/bd82/regexp-to-ast
[unicode_mdn]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/unicode
[custom_token_patterns]: https://chevrotain.io/docs/guide/custom_token_patterns.html
[line_terminator_pattern]: https://chevrotain.io/documentation/10_3_0/interfaces/ILexerConfig.html#lineTerminatorsPattern
[line_terminator_characters]: https://chevrotain.io/documentation/10_3_0/interfaces/ILexerConfig.html#lineTerminatorCharacters
