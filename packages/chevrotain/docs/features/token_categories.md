# Token Categories

When parsing it is sometimes useful to match a terminal against a **set of Token Types**.
This can be accomplished by using Token Categories.

For example:

```javascript
// "KeywordOrIdentifier" is our Token category used to match any keyword or Identifier
const KeywordOrIdentifier = createToken({
    name: "AnyWord",
    pattern: Lexer.NA
})

// General Identifier
export const Identifier = createToken({
    name: "Identifier",
    pattern: /[a-zA-Z]\w*/,
    categories: [KeywordOrIdentifier]
})

// a Keyword
export const Class = createToken({
    name: "Class",
    pattern: /Class/,
    longer_alt: Identifier,
    categories: [KeywordOrIdentifier]
})
```

```javascript
$.RULE("SomeRule", () => {
    // This would match either an Identifier or a keyword thus allowing for
    // "None Reserved keywords"
    $.CONSUME(KeywordOrIdentifier)
})
```

Note that:

-   A Token category is simply another Token Type.
-   A Token Type may have **multiple** Token Categories.
