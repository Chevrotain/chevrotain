## Resolving Lexer Errors

* [No LINE_BREAKS Error.](#LINE_BREAKS)


### <a name="LINE_BREAKS"></a> No LINE_BREAKS Error. 

A Chevrotain Lexer will by default track the full position information for each token.
This includes line and column information.

In order to support this the Lexer must be aware of which Tokens may include line terminators.
This information must be provided by the lexer's author.

This error means that the Lexer has been defined to track line and column information (perhaps by default).
Yet not a single one of the Token definitions passed to it was defined as possibly containing line terminators.

To resolve this choose one of the following:

1. Disable the line and column position tracking using the [positionTracking][position_tracking] configuration option.
   ```javascript
   const myTokens = [IntegerLiteral, StringLiteral, WhiteSpace /*, ... */]
   const myLexer = new chevrotain.Lexer([myTokens], {
      positionTracking: "onlyOffset" 
   })
   ```
   
2. Mark the Tokens which may include a line terminator with a line_breaks flag.
   ```javascript
    const createToken = chevrotain.createToken
    
    // Using createToken API
    const Whitespace = createToken({
        name: "Whitespace",
        pattern: /\s+/,
        line_breaks: true
    })
    
    // or in ES2015 syntax with static properties
    class Whitespace extends chevrotain.Token {}
    Whitespace.PATTERN = /\s+/
    Whitespace.LINE_BREAKS = true
    
    const myTokens = [IntegerLiteral, StringLiteral, WhiteSpace /*, ... */]
    
    const myLexer = new chevrotain.Lexer([myTokens])
   ```
   
   - Note that the definition of what constitutes a line terminator is controlled by the
     [lineTerminatorsPattern][line_terminator_docs] lexer configuration property.
   
   - Also note that multi-line tokens such as some types of comments and string literals tokens may contain
     line terminators, if your language includes such tokens they must also be marked with the line_breaks flag.
   
   
[position_tracking]: http://sap.github.io/chevrotain/documentation/0_30_0/interfaces/_chevrotain_d_.ilexerconfig.html#positiontracking
[line_terminator_docs]: http://sap.github.io/chevrotain/documentation/0_30_0/interfaces/_chevrotain_d_.ilexerconfig.html#lineTerminatorsPattern   
