# Gates

Chevrotain supports Gates on parsing DSL methods.
Gates act as a type of **guard condition** that prevents an alternative
from being taken. Gates are often used in combination with parametrized rules
to represent multiple variants of the same parsing rule while avoiding code duplication.

For example:

```javascript
// isConst is a parameter passed from another rule.
$.RULE("Value", (isConst) => {
  $.OR([
    // the Variable alternative is only possible when "isConst" is Falsey
    { GATE: () => !isConst, ALT: () => $.SUBRULE($.Variable) },
    { ALT: () => $.CONSUME(IntValue) },
    { ALT: () => $.CONSUME(FloatValue) },
    { ALT: () => $.CONSUME(StringValue) },
  ]);
});
```

## Using the [Look Ahead](https://chevrotain.io/documentation/11_1_2/classes/CstParser.html#LA) method is often helpful with the use of Gates to determine if a path should be followed or not, for example:

## Using the `LA(k)` Method with Gates

The `LA(k)` (Look Ahead) method allows inspecting upcoming tokens
without consuming them.

- `LA(1)` → returns the next token
- `LA(2)` → returns the second upcoming token.
- and so on...

This is especially useful when a parsing decision cannot be made
based solely on the current token.

### Example

```javascript
$.RULE("Statement", () => {
  $.OR([
    {
      GATE: () => $.LA(1).tokenType === If,
      ALT: () => {
        $.CONSUME(If);
      },
    },
    {
      ALT: () => {
        $.CONSUME(Identifier);
      },
    },
  ]);
});
```

In this example:

- The parser checks the next token using `LA(1)`
- If the next token is `If`, the first alternative is taken
- Otherwise, the second alternative is chosen

The key idea is that `LA()` does **not consume** the token —
it only peeks ahead to help decide which parsing path to follow.

```javascript
// SELECT LIMIT.ID FROM USER_LIMIT LIMIT
// SELECT ID, NAME FROM USER_LIMIT LIMIT 1
$.RULE("FromClause", () => {
  $.CONSUME(From);
  $.CONSUME(Identifier);

  $.OPTION({
    GATE: () => $.LA(2).tokenType !== UnsignedInteger,
    DEF: () => $.CONSUME1(Identifier, { LABEL: "alias" }),
  });
});
```

If **LIMIT** is an identifier or a keyword based on the surrounding tokens, looking ahead at subsequent tokens is required to know if the token should be consumed as an identifier or should be skipped to be picked up by a subsequent rule.

See [executable example](https://github.com/chevrotain/chevrotain/tree/master/examples/parser/predicate_lookahead)
for further details.
