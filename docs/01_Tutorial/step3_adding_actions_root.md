* Previous tutorial step - [Step 2 - Parsing](./step2_parsing.md)

# Tutorial Step 3 - Adding Actions to the Parser.

### Introduction - The Problem:
In the [previous](./step2_parsing.md) tutorial step
we have implemented a parser for a "mini" SQL Select grammar. The current problem is that our parser only
validates that the input conforms to the grammar. In most real world use cases the parser will also have to output some
result/data structure/value.

### The Solutions:

Chevrotain supports two **very different** solutions to this problem:

 * **Separation** of grammar and user actions (Semantics) using a **CST Visitor**.
   - [Example](https://github.com/SAP/chevrotain/blob/master/examples/grammars/calculator/calculator_pure_grammar.js)

 * **Embedding** user actions (Semantics) inside the grammar rules.
   - [Example](https://github.com/SAP/chevrotain/blob/master/examples/grammars/calculator/calculator_embedded_actions.js)

Before we continue one of the two approaches must be chosen.

The main difference between the two approaches is in regards to the question:
**Where are the user actions (a.k.a semantics) written?**

When using a CST Visitor the semantics are **completely separated** from the grammar
They could actually be implemented in a **different** file. This has great benefits
for the parser's ease of **maintenance** and its **re-usability**.
Thus using a CST Visitor is the **recommended approach**.

That is not to say there are no use cases in which **embedded actions** are better.
The main advantage of embedded actions is their **performance**. Embedded actions are
about 50% faster than using a CST Visitor. This may sound like an unbeatable advantage
but that is not the case:

* Chevrotain is [so fast](https://sap.github.io/chevrotain/performance/) that even with that performance penalty.
  penalty it would beat most other parsing solutions and still be close to the performance of an hand built parser.
  - Tested on Modern V8

* The Parsing step is normally just one step of a larger flow, a large performance penalty in one step
  does not equate to a large performance penalty in the whole flow...


### Summary

* It is recommended to use a CST Visitor to separate the semantics(actions) from the syntax(grammar).
* Prefer embedding the semantics (actions) in the grammar only in use cases where performance is of utmost concern.

#### What is Next?
* Next step in the tutorial: [Step 3a - Separated Actions with a Visitor](./step3a_adding_actions_visitor.md).
* Next step in the tutorial: [Step 3b - Embedded Actions](./step3b_adding_actions_embedded.md).
