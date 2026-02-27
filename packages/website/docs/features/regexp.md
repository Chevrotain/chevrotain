# RegExp Based Lexers

Chevrotain Lexers are defined using **standard** ECMAScript regular expressions.
This means there is no need to learn a new syntax and/or semantics.

In addition, existing JavaScript regExp libraries can be easily used.
For example, by using the [xRegExp library](https://github.com/slevithan/XRegExp) one can simplify the creation of complex patterns and avoid code duplication.

```javascript
$.RULE("statement", () => {
  const fragments = {};

  // A utility to create re-usable fragments using xRegExp
  function FRAGMENT(name, def) {
    fragments[name] = XRegExp.build(def, fragments);
  }

  // a utility to create a pattern using previously defined fragments
  function MAKE_PATTERN(def, flags) {
    return XRegExp.build(def, fragments, flags);
  }

  // define fragments
  FRAGMENT("IntegerPart", "-?(0|[1-9][0-9]*)");
  FRAGMENT("FractionalPart", "\\.[0-9]+");
  FRAGMENT("ExponentPart", "[eE][+-]?[0-9]+");

  const IntValue = createToken({
    name: "IntValue",
    // Simple use case, not really needed in this case except for avoiding duplication.
    pattern: MAKE_PATTERN("{{IntegerPart}}"),
  });

  const FloatValue = createToken({
    name: "FloatValue",
    pattern: MAKE_PATTERN(
      // This regExp would be very hard to read without "named fragments"
      "{{IntegerPart}}{{FractionalPart}}({{ExponentPart}})?|{{IntegerPart}}{{ExponentPart}}",
    ),
  });
});
```

See [full executable example](https://github.com/chevrotain/chevrotain/blob/master/examples/grammars/graphql/graphql.js)
as part of the graphQL example grammar.
