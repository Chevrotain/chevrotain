# Syntactic Content Assist

### TLDR

For a quick start, see:

- [**Runnable example - simple**](https://github.com/chevrotain/chevrotain/blob/master/examples/parser/content_assist/content_assist_simple.js)
- [**Runnable example - complex**](https://github.com/chevrotain/chevrotain/blob/master/examples/parser/content_assist/content_assist_complex.js)

## Introduction

Chevrotain provides syntactic content assist capabilities.
These can be accessed via the [**computeContentAssist**](https://chevrotain.io/documentation/11_1_1/classes/CstParser.html#computeContentAssist) method.

Note that this feature **only** provides syntactic suggestions (meaning next possible token types) **not** semantic suggestions.
It could be used as a building block in a semantic suggestions provider, but it cannot do this on "its own".

Also note that this feature is implemented as a **separate** interpreted backtracking parser,
completely unrelated to the normal parsing flow except for using the same internal grammar representation.

## Basic Flow

The `computeContentAssist` method is called on a Parser instance and given as inputs the starting rule's name
and a partial token vector. The output of this method would be the (first) possible Token Types that can appear after the
partial token vector.

See the simple [**Runnable example**](https://github.com/chevrotain/chevrotain/blob/master/examples/parser/content_assist/content_assist_simple.js)
to understand this flow.

## Advanced Flow

A real-world scenario would be far more complex than the simple scenario shown above. For example:

- A partial Identifier may lead to suggestions being offered from a table of symbols.
- For some types of tokens, suggestions may not be offered (e.g. Commas).
- Filtering on the suggested Identifier names may have to take into account the current semantic scope.

These concerns are not part of the Chevrotain library. Chevrotain only deals with **syntactic** content assist,
and it is the responsibility of the end users to handle the **semantic** content assistance logic of their specific languages.
However, a more complex [**Runnable example**](https://github.com/chevrotain/chevrotain/blob/master/examples/parser/content_assist/content_assist_complex.js)
is provided to demonstrate some of these possible "advanced" flows mentioned above.

## Limitations

This causes several important limitations:

- **Performance**: The content assist feature is about 10x slower than the normal parsing flow.

- No embedded actions will be performed.

- Error recovery is unsupported.

- Gates / Predicates are unsupported.

These limitations may seem daunting at first, but should not cause great problems in actual practice.
The following sections will discuss each limitation in detail.

## Performance

An order of magnitude slower performance may at first sound like a horrible thing.
Let's put this in perspective for relevant use cases:

- Being an order of magnitude slower also means approximately the same speed as Jison.
  - Tested on Chrome 68. See: [performance benchmark](https://chevrotain.io/performance/).

- **Smaller input size 1**: Content Assist is requested for an offset inside a text. This means that on average only half the text input
  will have to be parsed. Suddenly the problem is halved...

- **Smaller input size 2**: Syntactic Content Assist is requested for a single text input (file), while standard parsing flow may need
  to handle dozens or hundreds of inputs at once.

- **Less work**: The ~x10 performance difference was measured when comparing pure grammars without any semantics.
  In a **real-world** scenario the difference will be smaller, as the regular parser will have semantics (CST creation / embedded actions).
  Those semantics have their own runtime cost while the content assist parser will **always** remain a pure grammar.

- **Smart beats fast**: Content Assist is normally used in a code editor. A code editor should be by definition
  **incremental** as it does not matter how smart the error recovery is or how fast the parser, re-parsing a whole
  file for every single changed character will simply **not scale**, both from a performance perspective and from the requirement
  of handling partially invalid inputs. What this means is that if a code editor is already (as it should be) incremental.
  It could invoke the call to **computeContentAssist** on a subset of the input as well. This subset could easily
  be **several** orders of magnitude smaller, thus all performance concerns are resolved.
  - Example: Imagine a 1,000-line JavaScript file where a single 10-line function is being edited and content assist
    is requested inside that small function.

    ```javascript
    // line 1
    // .
    // .
    // .
    // line 600
    function foo() {
      // content assist requested somewhere in this function
    }
    // line 610
    // .
    // .
    // .
    // line 1000
    ```

    There is no need to re-parse the whole file. Instead, only the text of that function should be sent
    to **computeContentAssist** and the "startRule" should be "functionDeclaration". Therefore only ~10 lines
    of text will have to be re-parsed to provide syntactic content assist.
    This is a 1/100 difference in input size which is **two orders of magnitude** smaller.

## Semantics & Fault Tolerance

No support for semantic actions and error recovery.

Once again, content assist is often used in a code editor's context.
Semantic actions will normally only output useful results for **valid parts** of the input.
Error recovery can help with invalid inputs by performing small automatic fixes to the input and more often by completely
skipping (re-syncing) parts of the input until a "valid" section is encountered.

The problem is that usually the code area where content assist is requested is also currently being **heavily** modified by the user
and is unlikely to be successfully parsed or automatically recovered (fixed); instead it will probably be skipped (re-synced) entirely.

What this means is that for input areas that are currently being edited (or even written from scratch) by the user
semantic actions and error recovery are less relevant anyhow. And if, as described in the previous section, an incremental approach
to using the content assist will also resolve the issue in which the content assist position follows a syntax error.

Example:

```javascript
let three = // syntax error, missing expression
let five = 5
let six = 1 + // <-- content assist requested after the '+'
return Math.max(five, six)
```

1.  The first and third statements are syntactically invalid.

2.  Error recovery is likely to re-sync to the following statements instead of resolving this with single token insertion / deletion.

3.  Therefore the results of embedded actions on these statements will not be useful.

4.  Content assist is requested in the third statement after the "+" operator.

5.  If we try to send the whole text to request content assist suggestions until the offset after the "+" operator,
    no suggestions will be found due to the syntax error on the first statement.

6.  However, if we only send the text of the third statement ("let six = 1 + "), content assist will work successfully.

## Gates / Predicates

Gates / Predicates behave as limiters of the available grammar. These constructs are not often used in grammars,
which reduces the severity of this limitation.

But more importantly this **does not mean that grammars using Gates cannot use the content assist functionality**.
Rather that in some **pathological edge cases** the suggestions may not be completely valid.
In that case, additional post-processing logic may need to be added to further filter the suggestions.

In detail: the content assist parser is a "backtracking" Parser,
which means it will try **all** the paths until it finds a valid one.
It disregards the max token lookahead constraints of the base Chevrotain parser.
Therefore, for a grammar path that has been disabled by a Gate / Predicate to be offered as a content assist suggestion,
not only does the fixed tokens lookahead have to match at the Gate's position,
The **remaining input** following the Gate's position must **also** match.
This is a much stronger condition (K tokens vs dozens/hundreds/infinity) thus making this issue a very minor one.
