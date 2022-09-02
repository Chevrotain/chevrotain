# LL(K) Grammars

Chevrotain can be used to build parsers for [LL(K)](https://en.wikipedia.org/wiki/LL_grammar) Grammars.
This means that the number of lookahead tokens needed to disambiguate two alternatives must
be a fixed number and known in advance.

For example given the grammar

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

Chevrotain will throw a an error during the parser initialization in this case.
This is because there is no fixed number of tokens we can use to choose between the alternatives
that is due to a potentially **infinite** number of "A" tokens that can appear before the "B" - "C" tokens.

## Flexible Lookahead Strategy

In addition to the default LL(K) lookahead, the parser constructor also accepts a custom lookahead strategy:

```ts
constructor() {
    super(tokens, {
        lookaheadStrategy: new CustomLookaheadStrategy()
    });
}
```

This feature allows to implement custom logic for specific or even all productions in your grammar
which require lookahead.
For example, this could be used to implement an unbounded lookahead that could resolve problems such
as the `longRule` issue above.
