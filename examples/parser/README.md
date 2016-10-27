# Parser Examples

A few simple examples of using the Chevrotain Parser to resolve some common parsing problems/scenarios:

* [Predicate/Gate lookahead](predicate_lookahead/predicate_lookahead.js)

* [Multiple grammar versions using grammar inheritance](versioning/versioning.js)

* ['Structured natural language' supporting multiple 'spoken languages' using grammar inheritance](inheritance/inheritance.js)

* [Multiple starting/top rules](multi_start_rules/multi_start_rules.js)

* [Implementing content assist](content_assist/README.md)

* [Dynamically defined Tokens](dynamic_tokens/dynamic_delimiters.js)

* [Minifying Chevrotain Grammars](minification/README.md)


Some of the examples require node.js V4+ to run as ES6 syntax has been used.

To run all the parser examples's tests:
* ```npm update``` (only once)
* ```npm test```
