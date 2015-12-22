# examples_jison-lex

A Simple example of using [Chevrotain](https://github.com/SAP/chevrotain)
with [jison-lex](https://github.com/zaach/jison-lex) as the lexer generator.

Generally any lexer/scanner can be used with chevrotain.
whether they be lexer generators or hand built ones. 
The only requirement is that the parser's input will consist of 
a vector of [Chevrotain Tokens](https://github.com/SAP/chevrotain/blob/master/src/scan/tokens_public.ts#L61) instances.

 
To run this example:
* ```npm update``` (only once)
* ```npm test```
