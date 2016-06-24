# Language Services Example

This examples shows how to build A language services layer using Chevrotain.
"Language Services Layer" is a component responsible for implementing the logic
for IDE capabilities such as:
 * Outline.
 * Syntax Errors.
 * Semantic Errors.
 * Navigation.
 * Refactoring.
 * Code Folding.
 * Formatting.
 * And more...

In essence a Language Services Layer is in fact a special kind of compiler front end.
And one of the basic parts of compiler is the Parser.

Most Parsers are not suitable for building high quality Language Services as they lack certain
required capabilities:


* **Error Recovery / Fault Tolerance**
  Required to allow the language service capabilities to work on partially **invalid** inputs
  and not only valid inputs. This is extremely important as while users are typing code
  in an IDE they still expect the language services capabilities to work, yet most of the time
  a user is typing in an IDE that file will not be syntactically valid.

  A prime example of this is the expectation that the context assist capabilities will still
  work even in a partially completed statement.

  Example:

  ```javascript
     var x
     x = new // <--- content assist point here
  ```

  In the above example the second statement is incomplete, yet an IDE user would still expect
  The content assist to work, or even the 'go to definition' on the 'x' variable.

* **Partial Parsing**
  Partial parsing means the capability to parse only a small part of the input. It is required
  to allow building **high performance** IDEs as every **single** key press by an IDE user should not cause
  the **whole** document to be re-parsed. This could lead to **several order of magnitude** less work
  having to be done by the parser for large files.