# Multiple Start Rules

Chevrotain supports using **any** of the grammar rules as a starting rule.
This means that any subset of a language can be parsed without being wrapped in
other constructs, For example this can be used for:

-   Implementing "debugger watch expressions" and "evaluate expression" in an IDE.
-   Parsing only modified text in an IDE for performance.
-   Easy unit testing for small language snippets.

See [executable example](https://github.com/SAP/chevrotain/tree/master/examples/parser/multi_start_rules)
for further details.
