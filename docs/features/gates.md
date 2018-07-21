# Gates

Chevrotain supports Gates on parsing DSL method.
Gates act as a type of **guard condition** that prevents an alternative
from being taken. Gates are often used in combination with parametrized rules
to represent multiple variants of the same parsing rule while avoiding code duplication.

For example:

```javascript
// isConst is a parameter passed from another rule.
$.RULE("Value", isConst => {
    $.OR([
        // the Variable alternative is only possible when "isConst" is Falsey
        { GATE: () => !isConst, ALT: () => $.SUBRULE($.Variable) },
        { ALT: () => $.CONSUME(IntValue) },
        { ALT: () => $.CONSUME(FloatValue) },
        { ALT: () => $.CONSUME(StringValue) }
    ])
})
```

See [executable example](https://github.com/SAP/chevrotain/tree/master/examples/parser/predicate_lookahead).
