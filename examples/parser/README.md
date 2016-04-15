# Parser Examples

A few simple examples of using the Chevrotain Parser to resolve some common parsing problems/scenarios.

Example how to use custom lookahead functions to handle grammars that are LL(>1),
or to implement predicates/gates.

* [Lookahead(K) > 1](large_lookahead/large_lookahead.js)

* [Predicate/Gate lookahead](predicate_lookahead/predicate_lookahead.js)

* [Multiple grammar versions using grammar inheritance](versioning/versioning.js)

* ['Structured natural language' supporting multiple 'spoken languages' using grammar inheritance](inheriance/inheritance.js)

* [Multiple starting/top rules](multi_start_rules/multi_start_rules.js)


to run all the parser examples's tests:
* ```npm update``` (only once)
* ```npm test```
