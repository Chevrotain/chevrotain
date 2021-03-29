# Grammar Inheritance

Chevrotain supports Grammar Inheritance, This is useful to represent multiple variants of the same grammar
for example a grammar for ECMAScript 6 **extends** an ECMAScript 5.1 grammar.

Chevrotain Grammars are JavaScript classes, so Grammar inheritance is simply JavaScript inheritance
with the replacement of the [**RULE**](https://chevrotain.io/documentation/9_0_1/classes/cstparser.html#rule)
DSL method with [**OVERRIDE_RULE**](https://chevrotain.io/documentation/9_0_1/classes/cstparser.html#override_rule) method when needed.

See [executable example](https://github.com/chevrotain/chevrotain/tree/master/examples/parser/inheritance)
for further details.
