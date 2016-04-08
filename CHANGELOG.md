## X.Y.Z (INSERT_DATE_HERE)

#### Breaking Changes
- [Use a config object for RULE DSL method.](https://github.com/SAP/chevrotain/issues/168)

  The [RULE method's](http://sap.github.io/chevrotain/documentation/0_7_2/classes/parser.html#rule) optional third and fourth parameters 
  have been been replaced with a single configuration object of the type [IRuleConfig](http://sap.github.io/chevrotain/documentation/0_8_0/interfaces/iruleconfig.html)
  Therefore any RULE invocation with more than two arguments must be refactored to the new form.
  For example:
  
  ```Typescript
      // old deprecated form  
      this.RULE("createStmt", function(){ /* ... */}, function(){ return 666 })
      
      // new form
      this.RULE("createStmt", function(){ /* ... */}, {recoveryValueFunc: function(){ return 666 }})
  ```
  
- [Remove RULE_NO_RESYNC DSL method.](https://github.com/SAP/chevrotain/issues/172)

  The RULE_NO_RESYNC convenience method has been removed.
  All usages of it must be replaced with an equivalent RULE call using the IRuleconfig [resyncEnabled](http://sap.github.io/chevrotain/documentation/0_8_0/interfaces/iruleconfig.html#resyncenabled)
  property.
  
  For example:
  ```Typescript
      // old deprecated form  
      this.RULE_NO_RESYNC("createStmt", function(){ /* ... */})
    
      // new form
      this.RULE("createStmt", function(){ /* ... */}, {resyncEnabled: false})
   ```
   
- [Error Recovery / Fault Tolerance abilities should be disabled by default.](https://github.com/SAP/chevrotain/issues/174)
  
  The Error recovery functionality is now **disabled** by default, it can be enabled via the parser's configuration.
  [example](https://github.com/SAP/chevrotain/blob/refactor_parser_const/examples/grammars/json/json.js#L34)
  
- [Parser Configuration should be done using a "Config" Object instead of constructor parameters.](https://github.com/SAP/chevrotain/issues/175) 
  
   The [Parser constructors's](http://sap.github.io/chevrotain/documentation/0_7_2/classes/parser.html#rule) optional parameter
   has been been replaced with a single configuration object of the type [IParserConfig](http://sap.github.io/chevrotain/documentation/0_8_0/interfaces/iparserconfig.html)
   Therefore any Parser super constructor invocation must be updated:
   
   [example(same as above)](https://github.com/SAP/chevrotain/blob/refactor_parser_const/examples/grammars/json/json.js#L34)
    


## 0.7.2 (4-7-2016)

#### Minor Changes
- [Support Overriding Rule implementations in inheriting grammars.](#169)

#### Documentation 
- [Bring order to the chaos of the examples folder.] (https://github.com/SAP/chevrotain/tree/master/examples)


## 0.7.1 (4-3-2016)

#### Minor Changes
- [Parsing Errors should include Parser context information.](#165)
- [AT_LEAST_ONE dsl rule, errMsg param should be optional.](#91)


## 0.7.0 (4-2-2016)

#### Major Changes
- [Lexer multi "modes" support.](#134)


## 0.6.3 (3-28-2016)

#### Minor Changes
- [Re-synced tokens should be reported to the user.](#154)


## 0.6.2 (3-25-2016)

#### Bug Fixes
- [LexerDefinitionErrorType enum was not exported as part of the public API.](#158)


## 0.6.1 (3-25-2016)

#### Bug Fixes
- [ParserDefinitionError enum was not exported.](https://github.com/SAP/chevrotain/commit/96edf7fe26d41f25272ea2a39d27fd7eb27991b2)


## 0.6.0 (3-20-2016)

#### Breaking Changes
- [Reorganized projected structure to be consistent and use "lib" folder](#155)
  Chevrotain's aggregated artifacts are now located under the **lib** folder instead of the **bin** folder in the npm package
  or the **release** folder in the bower pacakge.

  This means that references to "bower_components/chevrotain/**release**/..."  or "node_modules/chevrotain/**bin**/..."
  Will have to be replaced with references to ".../**lib**/...".
  
  [For example - modified diagrams.html](https://github.com/SAP/chevrotain/pull/155/files#diff-c5283f95a0a6408c8016dcaff5abe0fa)
  
  Note that no changes are needed for standard consumption of chevrotain under node.js (**require('chevrotain')**).
  

#### Bug Fixes
- [Diagrams - Fixed global references to permit UMD loading.](#152) 



## 0.5.23 (3-17-2016)

#### Bug Fixes
- [Syntax Diagrams usage highlights issues.](#149) 



## 0.5.22 (3-15-2016)

#### Minor Changes
- [Human Readable Token Labels in Syntax Diagrams.](#144)
- [Use Token Labels in error messages.](#146)

#### Bug Fixes
- [Diagrams template resources were not fully included in bower "package".](#145) 

**Older Releases** changelog is available on [Github Releases.](https://github.com/SAP/chevrotain/releases)
