# Gates

Chevrotain supports Gates on parsing DSL methods.
Gates act as a type of **guard condition** that prevents an alternative
from being taken. Gates are often used in combination with parametrized rules
to represent multiple variants of the same parsing rule while avoiding code duplication.

For example:

```javascript
// for (let x = 1; ...) — declaration allowed
// for (x + 1; ...)     — expression only
$.RULE("Statement", (allowDeclaration) => {
  $.OR([
    { GATE: () => allowDeclaration, ALT: () => $.SUBRULE($.Declaration) },
    { ALT: () => $.SUBRULE($.Expression) },
  ]);
});
```

Using the [Look Ahead](https://chevrotain.io/documentation/11_2_0/classes/CstParser.html#LA) method is often helpful with the use of Gates to determine if a path should be followed or not, for example:

```javascript
// foo(a, b, c)   - three arguments
// foo(a, b,)     - two arguments with trailing comma
$.RULE("ArgumentList", () => {
  $.SUBRULE($.Expression);
  $.MANY({
    // stop consuming arguments if the token after the comma is ")"
    GATE: () => $.LA(2).tokenType !== RParen,
    DEF: () => {
      $.CONSUME(Comma);
      $.SUBRULE1($.Expression);
    },
  });
  $.OPTION(() => $.CONSUME1(Comma)); // optional trailing comma
});
```

Here `$.LA(2)` peeks past the comma to check whether a closing parenthesis follows. If it does, the GATE prevents the MANY from consuming the trailing comma as the start of another argument, leaving it for the OPTION to handle instead.

See executable examples for further details:

- [Parametrized Rules](https://github.com/chevrotain/chevrotain/tree/master/examples/parser/parametrized_rules) — using Gates with parameterized rules to control grammar flow.
- [Predicate Lookahead](https://github.com/chevrotain/chevrotain/tree/master/examples/parser/predicate_lookahead) — using Gates with external state to enable/disable alternatives.
- [Backtracking](https://github.com/chevrotain/chevrotain/tree/master/examples/parser/backtracking) — using Gates with `BACKTRACK` to resolve ambiguous alternatives.
