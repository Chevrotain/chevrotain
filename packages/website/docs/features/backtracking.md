# Backtracking

Chevrotain supports backtracking to resolve ambiguities.
Backtracking means **fully** trying an alternative instead of using a fixed
token lookahead, this is similar to a DFS versus a BFS.

Backtracking is not automatic and must be **explicitly** invoked.
This is because it is inefficient and is mutually exclusive with error recovery.
It is strongly recommended to avoid using backtracking if possible.

Backtracking is implemented by using [Gates](https://chevrotain.io/docs/features/gates.html)

For example, given the following grammar which is not LL(K), as
both the alternatives in "statement" have a potentially infinitely long common prefix.

```antlr
statement:
   longRule1 |
   longRule2 |

longRule1:
   A+ B

longRule2:
   A+ C
```

We can resolve the ambiguity by using backtracking, effectively fully trying out
the alternatives (in order) instead of trying to choose one using a limited token lookahead.

```javascript
$.RULE("statement", () => {
  $.OR([
    {
      GATE: $.BACKTRACK($.longRule1),
      ALT: () => $.SUBRULE($.longRule1)
    },
    {
      GATE: $.BACKTRACK($.longRule2),
      ALT: () => $.SUBRULE($.longRule2)
    }
  ])
})
```

See [executable example](https://github.com/chevrotain/chevrotain/tree/master/examples/parser/backtracking)
for further details.
