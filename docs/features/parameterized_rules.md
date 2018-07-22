# Parameterized Rules

Chevrotain supports passing parameters to rules.
This means that grammar rules may accept arguments from the calling rule.
This is often used in combination with [gates](./gates.md) to
to represent multiple variants of the same parsing rule while avoiding code duplication.
It can also

For example:

```javascript
$.RULE("ArgumentInConst", () => {
    $.CONSUME(Name)
    $.CONSUME(Colon)
    // passing the argument using the "ARGS" property
    $.SUBRULE($.Value, { ARGS: [true] })
})

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

See [executable example](https://github.com/SAP/chevrotain/tree/master/examples/parser/parametrized_rules).
