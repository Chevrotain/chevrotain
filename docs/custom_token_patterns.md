## Custom Token Patterns

See: [**Runnable example**](../examples/lexer/custom_patterns/custom_patterns.js) for quick starting.

### Background
Normally a Token's pattern is defined using a JavaScript regular expression:

```JavaScript
let IntegerToken = createToken({name: "IntegerToken", pattern: /\d+/})
```
 
However in some circumstances the capability to provide a custom pattern matching implementation may be required. 
Perhaps a special Token which cannot be easily defined using regular expressions, or perhaps
to enable working around performance problems in a specific RegularExpression engine, for example:

* [WebKit/Safari multiple orders of magnitude performance degradation for specific regExp patterns](https://bugs.webkit.org/show_bug.cgi?id=152578) 😞 


### Usage
A custom pattern must conform to the API of the [RegExp.prototype.exec](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec)
function. Additionally it must perform any matches from the **start** of the input. In RegExp semantics this means
that any custom pattern implementations should behave as if the [start of input anchor](http://www.rexegg.com/regex-anchors.html#caret) 
has been used.


The basic syntax for supplying a custom pattern is defined by the [ICustomPattern](http://sap.github.io/chevrotain/documentation/0_21_0/interfaces/icustompattern.html) interface.
Example:

```JavaScript
function matchInteger(text) {
   let i = 0
   let charCode = text.charCodeAt(i)
   while (charCode >= 48 && charCode <= 57) {
     i++
     charCode = text.charCodeAt(i)
   }
   
   // No match, must return null to conform with the RegExp.prototype.exec signature
   if (i === 0) {
      return null
   }
   else {
      let matchedString = text.substring(0, i)
      // according to the RegExp.prototype.exec API the first item in 
      // the returned array must be the whole matched string.
      return [matchedString]
   }
}

let IntegerToken = createToken({
                                 name: "IntegerToken",
                                 pattern: {
                                   exec:  matchInteger,
                                   containsLineTerminator: false
                              }})
```

The **containsLineTerminator** property is used by the lexer to properly compute the line/column numbers.
If the custom matched pattern could possibly include a line terminator then this property must be defined as "true".
Most Tokens can never contain a line terminator so the property is optional (false by default) which enables a shorter syntax:

```JavaScript
let IntegerToken = createToken({
                                 name: "IntegerToken",
                                 pattern: {
                                   exec:  matchInteger
                              }})
```

Using an Object literal with only a single property is still a little verbose so an even more concise syntax is also supported:
```JavaScript
let IntegerToken = createToken({name: "IntegerToken", pattern: matchInteger})
```


 

