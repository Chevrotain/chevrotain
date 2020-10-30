# Gates

Chevrotain supports Gates on parsing DSL method.
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
    { ALT: () => $.CONSUME(StringValue) }
  ])
})
```

Using the [Look Ahead](https://sap.github.io/chevrotain/documentation/7_0_3/classes/cstparser.html#la) method is often helpful with the use of Gates to determine if a path should be followed or not, for example:

```javascript
// SELECT LIMIT.ID FROM USER_LIMIT LIMIT
// SELECT ID, NAME FROM USER_LIMIT LIMIT 1
$.RULE("FromClause", () => {
  $.CONSUME(From)
  $.CONSUME(Identifier)

  $.OPTION({
    GATE: () => $.LA(2).tokenType !== UnsignedInteger,
    DEF: () => $.CONSUME1(Identifier, { LABEL: "alias" })
  })
})
```

If **LIMIT** is an identifier or a keyword based on the surrounding tokens, looking ahead at subsequent tokens is required to know if the token should be consumed as an identifer or should be skipped to be parsed up by a subsequent rule.

See [executable example](https://github.com/SAP/chevrotain/tree/master/examples/parser/predicate_lookahead)
for further details.
