# Separation of Grammar and Semantics.

Chevrotain is not limited like many other parsing libraries to only embedding actions inside the grammar,
It can also **automatically** create a [**C**oncrete **S**yntax **T**ree](https://sap.github.io/chevrotain/docs/guide/concrete_syntax_tree.html)
Which can later be traversed using the [visitor pattern](https://en.wikipedia.org/wiki/Visitor_pattern).

This implements the design principle of [Separation of Concerns](https://en.wikipedia.org/wiki/Separation_of_concerns)
which enables **re-use** of the same **pure** grammar for multiple purposes.

See example of two identical mathematical expression grammars:

-   Firstly using [embedded actions](https://github.com/SAP/chevrotain/blob/master/examples/grammars/calculator/calculator_embedded_actions.js) for semantics.
-   Secondly using [Separated semantics](https://github.com/SAP/chevrotain/blob/master/examples/grammars/calculator/calculator_pure_grammar.js) with a CST Visitor.
