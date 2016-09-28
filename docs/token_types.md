## Token Types
Chevrotain provides three different types of Tokens with varying 
performance and usability characteristics.

See Performance [Benchmark](http://sap.github.io/chevrotain/performance/token_types) comparing different Token Types.

 
### The Base Token
The Base [Tokens](http://sap.github.io/chevrotain/documentation/0_16_1/classes/token.html)
are **mutable** Inheritance based Tokens which have all their properties **pre-computed** as standard EcmaScript properties.

Base Tokens can be defined either using ES2015 inheritance or
using the provided [extendToken](http://sap.github.io/chevrotain/documentation/0_16_1/globals.html#extendtoken) utility.
 
```typescript
var chevrotain = require("chevrotain")
// using ES2015 class keyword
class Integer extends chevrotain.Token {
    static PATTERN = /0|([1-9]\d+)/ 
}

// using the extendToken utility
var Integer = chevrotain.extendToken("Integer", /0|([1-9]\d+)/)
``` 
 
When to use base Tokens:
 * When mutable Token instances are required.
 * When maximum performance is not important.
 * When memory usage is not important.
 * When [Token inheritance](https://github.com/SAP/chevrotain/blob/master/examples/parser/dynamic_tokens/dynamic_delimiters.js) is needed.
 * When most of the Token properties(startLine, startColumn, startOffset, ...) are expected to be used.
   * Note that for most parsers only a **small** portion of these properties will be used, 
     with some exceptions such as: code formatters/beautifiers.  



### The Lazy Token
The [Lazy Tokens](http://sap.github.io/chevrotain/documentation/0_16_1/classes/lazytoken.html) are **im-mutable** Inheritance based Tokens which have most of their properties computed only on demand.
This is accomplished by using ECMASciprt getters. This approach achieves both memory conservation and increased performance
for most use cases. 

Lazy Tokens can be defined either using ES2015 inheritance or
using the provided [extendLazyToken](http://sap.github.io/chevrotain/documentation/0_16_1/globals.html#extendlazytoken) utility.
 
```typescript
var chevrotain = require("chevrotain")
// using ES2015 class keyword
class Integer extends chevrotain.LazyToken {
    static PATTERN = /0|([1-9]\d+)/ 
}

// using the extendToken utility
var Integer = chevrotain.extendLazyToken("Integer", /0|([1-9]\d+)/)
``` 
 
When to use Lazy Tokens:
 * When maximizing performance is important.
 * When reducing memory usage is important.
 * When [Token inheritance](https://github.com/SAP/chevrotain/blob/master/examples/parser/dynamic_tokens/dynamic_delimiters.js) is needed.
 * When most of the Token properties(startLine, startColumn, startOffset, ...) are **not** expected to be used.
   * Note that for most parsers only a **small** portion of these properties will be used, 
     with some exceptions such as: code formatters/beautifiers.
     


### The Simple Lazy Token
The [Simple Lazy Tokens](http://sap.github.io/chevrotain/documentation/0_16_1/classes/simplelazytoken.html) are **im-mutable** plain 
structure based Tokens which have most of their properties computed only on demand. "Simple" Tokens are not created
using the **new** operator, instead they are plain ECMAScript objects. This approach achieves an even greater performance than Lazy 
Tokens but at the cost of:

* Having to use utility functions to extract token properties as only the start and end offsets are directly saved on the plain token object.
  ```javascript
  var image
  var startLine
  var endColumn

  var myTokenInstance = lexerResults.tokens[0]
  
  // with "base" Tokens and Lazy Tokens
  var image = myTokenInstance.image
  var startLine = myTokenInstance.startLine
  var endColumn = myTokenInstance.endColumn
  
  // with Simple Tokens
  var image = chevrotain.getImage(myTokenInstance)
  var startLine = chevrotain.getStartLine(startLine)
  var endColumn = chevrotain.getEndColumn(myTokenInstance)
  ```
* being harder to debug as there is less information for the .  


Simple Lazy Tokens can be defined either using ES2015 inheritance or
using the provided [extendSimpleLazyToken](http://sap.github.io/chevrotain/documentation/0_16_1/globals.html#extendsimplelazytoken) utility.
 
```typescript
var chevrotain = require("chevrotain")
// using ES2015 class keyword
class Integer extends chevrotain.SimpleLazyToken {
    static PATTERN = /0|([1-9]\d+)/ 
}

// using the extendToken utility
var Integer = chevrotain.extendSimpleLazyToken("Integer", /0|([1-9]\d+)/)
``` 
 
When to use Simple Lazy Tokens:
 * When maximizing performance is of is of the utmost concern.
 * When reducing memory usage is important.
 * When [Token inheritance](https://github.com/SAP/chevrotain/blob/master/examples/parser/dynamic_tokens/dynamic_delimiters.js) is **not** needed.
 * When most of the Token properties(startLine, startColumn, startOffset, ...) are **not** expected to be used.
   * Note that for most parsers only a **small** portion of these properties will be used, 
     with some exceptions such as: code formatters/beautifiers.
      
      
#### A Note on Token properties and switching between token Types.
Chevrotain Lexers and Parsers will automatically adjust to the type of tokens used.
Therefor switching between the Token types can be easily accomplished in the dynamic world of ECMAScript:
 
```javascript
    var extendToken
    var tokenType = ???
    // dynamically choose which "extendToken" to use.
    switch (tokensType) {
        case "base" :
            extendToken = chevrotain.extendToken
            break;
        case "kazy" :
            extendToken = chevrotain.extendLazyToken
            break;
        case "simple lazy" :
            extendToken = chevrotain.extendSimpleLazyToken
            break;
    }

    var True = extendToken("True", /true/)
    var False = extendToken("False", /false/)
    var Null = extendToken("Null", /null/)
    var LCurly = extendToken("LCurly", /{/)
``` 

This switching can be useful either to investigate possible performance benefits of switching Token type,
or to make debugging easier by having simpler Token objects to debug (plain properties without getters, human readable instance's 
constructor name).

This however raises one concern, as the APIs of Inheritance based tokens are **different** than the Simple Tokens.
To get around this it is **highly recommended** to **only** use the token utility functions which extract the token properties,
regardless of the Token type used and **never** directly access the Token properties.

```javascript
var chevrotain = require("chevrotain")
var getImage = chevrotain.getImage
var getStartLine = chevrotain.getStartLine


this.dummyRule = this.RULE("dummyRule", function() {
        var keyToken, value
    
        keyToken = $.CONSUME(StringLiteral);
        
        return {
                 // GOOD - will work with ALL Token types
                 image: getImage(keyToken),
                 startLine: getStartLine(keyToken),
                 
                 // BAD - will ONLY work with Base and Lazy Tokens
                 endLine: keyToken.endLine
        } 
});
```