# LL(\*) Grammars Support

Chevrotain can be used to build parsers for [LL(\*)](https://en.wikipedia.org/wiki/LL_grammar) Grammars.
This means that the number of lookahead tokens needed to disambiguate two alternatives **must not be known** in advance.

For example given the grammar:

```antlr
statement:
   longRule B  |
   longRule C  |
   longRule D

longRule:
   A+
```

Chevrotain will perform its lookahead until it reads either a "B", "C" or "D" token and then decides on an alternative. In case your grammar contains an ambiguous alternative, such as `statement: longRule | longRule`, an error message will be printed to the console. See [here](https://chevrotain.io/docs/guide/resolving_grammar_errors#AMBIGUOUS_ALTERNATIVES) on how to resolve this issue.
