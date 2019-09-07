# Tutorial - Fault Tolerant

### TLDR

[Run and Debug the source code](https://github.com/SAP/chevrotain/tree/master/examples/tutorial/step4_error_recovery).

## Introduction

In the previous tutorial steps we have learned how to build a parser for a simple grammar.
Our parser can handle valid inputs just fine, but what happens if the input is not perfectly valid?
For example when building an editor for a programing language, the input is often not completely valid,
yet the editor is still expected to provide functionality (outline/auto-complete/navigation/error locations...)
even for invalid inputs.

Chevrotain uses several fault tolerance / error recovery heuristics, which generally follow error recovery heuristics
used in Antlr3.

## Single Token insertion

Happens when:

-   A token Y is expected.
-   But a token X is found.
-   X is a valid token after the missing Y token.

A Y token will be automatically **inserted** into the token stream.

For example: in a JSON Grammar colons are used between keys and values.

```javascript
// GOOD
{ "key" : 666 }

// BAD, missing colon
{ "key"   666 }
```

If we try parsing the "bad" example, after consuming:

```javascript
{ "key"
```

-   We expect a colon token (Y).
-   We will find a number(666) token (X) in the remaining text: '666 }'.
-   After the colon token, a number token is valid.

Therefore the missing colon will be automatically "inserted".

This heuristic's behavior can be customized by the following methods:

-   [canTokenTypeBeInsertedInRecovery](https://sap.github.io/chevrotain/documentation/6_3_0/classes/cstparser.html#cantokentypebeinsertedinrecovery)

-   [getTokenToInsert](https://sap.github.io/chevrotain/documentation/6_3_0/classes/cstparser.html#gettokentoinsert)

## Single Token deletion:

Happens when:

-   A token Y is expected.
-   But a token X is found.
-   And immediately after X an Y is found.

The unexpected token X will be skipped (**deleted**) and the parsing will continue.

For example: lets look at the case of a

```javascript
// GOOD
{ "key" : 666}

// BAD, redundant "}"
{ "key" }: 666}
```

If we try parsing the "bad" example, after consuming:

```javascript
{ "key"
```

-   We are expecting a colon token (Y).
-   But we found right brackets (X) instead.
-   The next token (":") is a colon token (Y) which the one we originally expected.

Therefore the redundant right brackets "}" will be skipped (deleted) and the parser will consume the number token.

## Re-Sync Recovery

The following re-sync recovery examples use this sample json like grammar:

```ANTLR
object
   : "{" objectItem (comma objectItem)* "}"

objectItem
   : stringLiteral ":" value

value
   : object | stringLiteral | number | ...
```

## Repetition Re-Sync

Repetition re-sync recovery happens when:

-   The parser is in a repetition(MANY/AT_LEAST_ONE/MANY_SEP/AT_LEAST_ONE_SEP).
-   The parser has consumed the last iteration and is about to "exit" the repetition.
-   The next token X is invalid right after the repetition ended.

In such a situation the parser will attempt to skip tokens until it detects the beginning of a another iteration of
the repetition **or** the token it originally expected after the last iteration.

There are a couple of edge cases in which **other** recovery methods will be preferred:

-   If single token insertion/deletion can be performed, it is always preferred as it skips fewer tokens.
-   If between rules re-sync recovery can be performed (see below) **and** it can be done by skipping **fewer** tokens.
    Between rules re-sync will be preferred over repetition re-sync recovery. The same principle applies, the heuristics are greedy
    and "prefer" to skip the fewest number of tokens.

Example:

```javascript
{
  "key1" : 1,
  "key2" : 2 666 // '666' should not appear here!
  "key3  : 3,
  "key4  : 4
}
```

If we try parsing this input example, after consuming:

```javascript
{
  "key1" : 1,
  "key2" : 2
```

-   The parser in in a repetition of **(comma objectItem)\* **
-   After consuming '"key2" : 2' the parser "thinks" it has consumed the last iteration as the next comma is missing.
-   The next token (X) encountered is "666" which is invalid in that position as the parser expected a "}" after the repetition ends.
-   The parser will throw away the following tokens [666, "key3", :, 3] and re-sync to the next comma (,) to continue a another iteration.

Note that in such a situation some input would be lost, (the third key), however the fourth key will still be parsed successfully!

## General Re-Sync

General re-sync recovery happens when the parser encounters a parser error inside a rule which
it cannot recover from in other ways.
For example:

-   An unexpected Token as been found (MisMatchTokenException) but single token insertion/deletion cannot resolve it.
-   None of the alternatives in an OR match.
-   A Repetition of AT_LEAST_ONE cannot match even one iteration.
-   ...

In re-sync recovery the parser will skip tokens from the token stream until it detects a point it can continue parsing from.
The parser will try to skip as few tokens as possible and re-sync to the closest rule in the rule stack.

**An Abstract example:**

-   Grammar Rule A called Grammar Rule B which called Grammar Rule C (A -> B -> C).
-   In Grammar Rule C a parsing error happened which we can not recover from.
-   The Parser will now skip tokens until it find a token that can appear immediately after either:
    -   The call of C in B
    -   The call of B in A

**A concrete example:**

For the following invalid json input:

```javascript
{
	"firstName": "John",
	"someData":
	   { "bad" :: "part" }, // <-- too many colons in the nested object
	"isAlive": true,
	"age": 25
}
```

-   When encountering the the redundant colon the rule stack will be as follows:

    -   **object** --> top level object
    -   **objectItem** --> "someData": ... - second item in the top level object
    -   **value** --> { "bad" :: "part" } - the value of the "someData" key
    -   **object** --> { "bad" :: "part" } - the value of the "someData" key
    -   **objectItem** --> "bad" :: "part" - the single item in the inner object.
    -   **value** --> : "part" - the value with the colon prefix

-   The redundant colon will cause an error (NoViableAltException) as the value rule will not be able to decide
    which alternative to take as none would match.

-   This means the parser needs to find a token to synchronize to, lets check the options:

    -   After value called by ObjectItem --> none
    -   After objectItem called by object --> comma.
    -   After object called by value --> none.
    -   After value called by ObjectItem --> none
    -   after objectItem called by object --> comma (again).

-   so the Parser will re-sync to the closest ObjectItem if it finds a comma in the remaining token stream.

-   Therefore the following tokens will be skipped: [':', '"part"', '}']

-   And the Parser continue from the "nearest" objectItem rule as if it was successfully invoked.

-   Thus the next two items will appear be parsed successfully even though they were preceded by a syntax error!

## Enabling

By default fault tolerance and error recovery heuristics are **disabled**.
They can be enabled by passing a optional **recoveryEnabled** parameter (default true)
To the parser's constructor [constructor](https://sap.github.io/chevrotain/documentation/6_3_0/classes/cstparser.html#constructor).

Once enabled specific rules may have their re-sync recovery disabled explicitly,
This is can be done during the definition of the grammar rule [RULE](https://sap.github.io/chevrotain/documentation/6_3_0/classes/cstparser.html#rule).
The third parameter(**config**) may contain a **resyncEnabled** property that controls whether or not re-sync is enabled for the
**specific** rule.

## CST Integration

When using [Concrete Syntax Tree](../guide/concrete_syntax_tree.md) output
A re-synced will return a CSTNode with the boolean ["recoveredNode"](https://sap.github.io/chevrotain/documentation/6_3_0/interfaces/cstnode.html#recoverednode) flag marked as true.
Additionally a recovered node **may not** have all its contents (children dictionary) filled
as only the Terminals and None-Terminals encountered **before** the error which triggered the re-sync
will be present. This means that code that handles the CST (CST Walker or Visitor) **must not**
assume certain content is always present on a CstNode. Instead it must be very defensive to avoid runtime
errors.

## Embedded Actions Integration

Just being able to continue parsing is not enough, as "someone" probably expects a returned value
from the sub-rule we have recovered from.

By default **undefined** will be returned from a recovered rule, however this should most likely be customize
in any but the most simple cases.

Customization is done during the definition of the grammar [RULE](https://sap.github.io/chevrotain/documentation/6_3_0/classes/cstparser.html#rule).
The third parameter(**config**) may contain a **recoveryValueFunc** property which is a function that will be invoked to produce the returned value in
case of re-sync recovery.

## Types Of Recovery Strategies

-   Single Token insertion/deletion and repetiton re-sync are "in rule" recovery strategies.
-   General re-sync Recovery is a "between rules" recovery strategy.

The main difference is that "in-rule" recovery fixes the problem in the scope of a single rule
without changes to the parser's rule stack and the parser's output will still be valid.

But "Between Rules" recovery will fail at least one parsing rule (and perhaps many more).
Thus the latter tends to "lose" more of the original input, may
potentially causes invalid output structure (e.g: partial CST structure)
and require additional definitions (e.g: what should be returned value of a re-synced rule?).
