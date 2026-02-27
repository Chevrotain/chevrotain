# LL(K) Grammars

Chevrotain can be used to build parsers for [LL(K)](https://en.wikipedia.org/wiki/LL_grammar) Grammars.
This means that the number of lookahead tokens needed to disambiguate alternatives must
be a fixed number and known in advance.

For example, given the grammar

```antlr
statement:
   A B C |
   A B D |
   A B E
```

Chevrotain will look **three** tokens ahead to decide between the two alternatives.

But given the following grammar

```antlr
statement:
   longRule B  |
   longRule C  |
   longRule D

longRule:
   A+
```

Chevrotain will throw an error during parser initialization in this case.
This is because there is no fixed number of tokens we can use to choose between the alternatives,
due to a potentially **infinite** number of "A" tokens that can appear before the "B"|"C"|"D" tokens.
