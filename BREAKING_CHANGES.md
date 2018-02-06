## Version 2.0.0

- defaultErrorProvider was renamed to defaultParserErrorProvider

- **All** the gast namespace was flattened into the API's root, e.g:
  ```javascript
     // Old API - using nested namespace. 
     chevrotain.gast.Alternation
   
     // New API - No nested namespaces.
     chevrotain.Alternation
  ```
  
- The exceptions namespace was also flattened into the API's root.

- The constructors of all the gast (Grammar AST) structure have been
  refactored to use the config object pattern additionally some properties have been renamed or removed.
  See the new SDK docs for details:
   * [Rule](http://sap.github.io/chevrotain/documentation/1_0_1/classes/rule.html)
   * [Terminal](http://sap.github.io/chevrotain/documentation/1_0_1/classes/terminal.html)
   * [NonTerminal](http://sap.github.io/chevrotain/documentation/1_0_1/classes/nonterminal.html)
   * [Alternation](http://sap.github.io/chevrotain/documentation/1_0_1/classes/alternation.html) 
   * [Option](http://sap.github.io/chevrotain/documentation/1_0_1/classes/option.html)
   * [Repetition](http://sap.github.io/chevrotain/documentation/1_0_1/classes/repetition.html)
   * [RepetitionWithSeparator](http://sap.github.io/chevrotain/documentation/1_0_1/classes/repetitionwithseparator.html)
   * [RepetitionMandatory](http://sap.github.io/chevrotain/documentation/1_0_1/classes/repetitionmandatory.html)
   * [RepetitionMandatoryWithSeparator](http://sap.github.io/chevrotain/documentation/1_0_1/classes/repetitionmandatorywithseparator.html)
   * [Flat](http://sap.github.io/chevrotain/documentation/1_0_1/classes/flat.html) (sequence)
     
