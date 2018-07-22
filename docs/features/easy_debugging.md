# Easy Debugging

Chevrotain is an **internal** JavaScript DSL. This means that Chevrotain grammars
are just plain JavaScript source code without any additional levels of abstraction
as in parser generators (EBNF vs generated code).

In practical terms this means that debugging a Chevrotain parser is the same as debugging any
other JavaScript code, just setup breakpoints or debugger statements using your favorite IDE.

For example:

```javascript
$.RULE("statement", () => {
      debugger;
      $.RULE("objectItem", () => {
        $.CONSUME(StringLiteral)
        debugger;
        $.CONSUME(Colon);
        $.SUBRULE($.value);
      });
```
