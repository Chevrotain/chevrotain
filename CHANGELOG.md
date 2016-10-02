## 0.17.0 (10-3-2016)

#### Major Changes

- [Grammar serialization and de-serialization.](https://github.com/SAP/chevrotain/issues/139)
- [Separate Railroad Diagram Generation into Scriptable Function.](https://github.com/SAP/chevrotain/issues/134)



## 0.16.1 (9-28-2016)

#### Minor Changes

- [Simple Lazy Tokens should support Token inheritance.](https://github.com/SAP/chevrotain/issues/282)



## 0.16.0 (9-24-2016)

#### Breaking Changes

The chevrotain TypeScript definitions file is now **only** compatible with TypeScript 2.0 and later versions.
For older versions of TypeScript use Chevrotain versions <= 0.15.0.

#### Minor Changes

- [Add "typings" field to package.json.](https://github.com/SAP/chevrotain/issues/251)



## 0.15.0 (9-23-2016) 

#### Major Changes

- [Performance Improvements: Lookahead functions.](#274)
- [Performance: SimpleLazyTokens.](#277)
- ["Smart" Map based lookahead for K = 1 with Token inheritance.](#279)

This release is is focused on performance improvements, with **~20%** boost on V8
and potentially **~100%** (double) performance on SpiderMonkey (FireFox 49).

To enjoy the maximum performance boost the new **SimpleLazyTokens** should be used.
See:**[Token Types Docs](docs/token_types.md)** for additional details. 

#### Breaking Changes
Certain advanced uses cases of [dynamically defined Tokens](https://github.com/SAP/chevrotain/blob/master/examples/parser/dynamic_tokens/dynamic_delimiters.js)
Will break if some of new lookahead optimizations are enabled. 

To resolve this a new property **dynamicTokensEnabled** has been defined on the [IParserConfig](http://sap.github.io/chevrotain/documentation/0_15_0/interfaces/iparserconfig.html)
interface. This configuration property is disabled by default, but can be enabled to support the use case of dynamically defined tokens.
See the [dynamically defined Tokens](https://github.com/SAP/chevrotain/blob/master/examples/parser/dynamic_tokens/dynamic_delimiters.js) 
example for details.   



## 0.14.0 (9-3-2016) 

#### Breaking Changes
- [OR DSL method Syntax should be more consistent.](https://github.com/SAP/chevrotain/issues/192)

#### Minor Changes
- [Performance Optimizations for 0.14.0 release.](https://github.com/SAP/chevrotain/pull/272)



## 0.13.4 (9-1-2016) 

#### Minor Changes

- [Change NPMCDN links to use UNPKG domain name.](https://github.com/SAP/chevrotain/issues/270)



## 0.13.3 (8-28-2016) 

#### Bug Fixes
- [Slow Parser Initialization.](https://github.com/SAP/chevrotain/issues/243)



## 0.13.2 (8-23-2016) 

#### Bug Fixes
- [Diagrams with nodejs fail on instanceof check.](https://github.com/SAP/chevrotain/issues/268)



## 0.13.1 (8-15-2016) 

#### Major Changes
- [Lexer: Lazy Tokens support.](https://github.com/SAP/chevrotain/issues/258)
- [Token "startOffset" and "endOffset" properties.](https://github.com/SAP/chevrotain/issues/259)

This Release includes a new **performance** feature called **"Lazy Tokens"**.
These tokens contain less actual state and defer the calculation of their properties
until needed. Considering most of the time this information is never needed (full position information)
the overall speed boost can be as much as **10-25%** (depending on the grammar used).
 
[See "2. Use Lazy Tokens"](https://github.com/SAP/chevrotain/blob/master/docs/faq.md#Q6)
for more details.


## 0.13.0 (8-6-2016) 

#### Major Changes
- [0.13.0 Performance Optimizations.](https://github.com/SAP/chevrotain/issues/248)
- [Performance FAQ section docs.](https://github.com/SAP/chevrotain/blob/master/docs/faq.md#Q6)

This release includes **major performance optimizations and guidelines**. 
Anywhere from 20% to 100% was measured (on V8) depending on the grammar used.
Please read the Performance FAQ section, as much of the performance gain is achieved by changing
the way a Chevrotain parser is initialized which will require code changes (not mandatory)
in user's code.
  
   

## 0.12.1 (8-3-2016) 

#### Bug Fixes
- [Diagrams do not work with custom lexers.](https://github.com/SAP/chevrotain/issues/242)

#### Documentation
- [Improve support for running minified in the browser.](https://github.com/SAP/chevrotain/issues/239)



## 0.12.0 (7-21-2016)

#### Breaking Changes
- [Removed Bower support.](https://github.com/SAP/chevrotain/issues/226)

#### Bug Fixes
- [Predicates / Gates using closures to parameters will cause unexpected behavior.](https://github.com/SAP/chevrotain/issues/221)
- [Diagrams highlights issues under IE Edge.](https://github.com/SAP/chevrotain/issues/229)

#### Documentation
- [Example using parametrized sub-rules.](https://github.com/SAP/chevrotain/issues/218)



## 0.11.4 (7-16-2016)

- Fixes issue with previous release automation.



## 0.11.3 (7-16-2016)

#### Bug Fixes
- [AmbiguousAlternatives error's <occurence> property was always undefined.](https://github.com/SAP/chevrotain/issues/212)

#### Quality
- [Use SauceLabs for browser matrix testing](https://github.com/SAP/chevrotain/issues/217)



## 0.11.2 (7-5-2016)

#### Minor Changes
- [Unresolved subrule references can cause none descriptive exceptions during follow up validations.](https://github.com/SAP/chevrotain/issues/209)
- [More descriptive unresolved grammar error message.](https://github.com/SAP/chevrotain/issues/210)

#### Documentation
- [Dynamically defined Tokens example.](https://github.com/SAP/chevrotain/issues/208)



## 0.11.1 (6-16-2016)

#### Minor Changes
- [extendToken should create constructor functions with meaningful names](https://github.com/SAP/chevrotain/issues/206)



## 0.11.0 (6-7-2016)

- Minor version release as the previous version included a breaking change in a patch version.
 
#### Minor Changes
- [Better runtime checks for Invalid Lexer definitions.](https://github.com/SAP/chevrotain/issues/204)



## 0.10.2 (6-6-2016)

#### Breaking Changes
- [MultiMode Lexer defaultMode should not be implicitly defined.](https://github.com/SAP/chevrotain/issues/202)

#### Documentation
- [XML grammar example.](https://github.com/SAP/chevrotain/issues/201)



## 0.10.1 (5-30-2016)

- Fixes issue with previous release automation.



## 0.10.0 (5-29-2016)

#### Major Changes
- [Predicates / Gates on productions should be in addition to standard lookahead.](https://github.com/SAP/chevrotain/issues/189)

- [Capability to ignore parser definition issues at construction time.](https://github.com/SAP/chevrotain/issues/197)

#### Breaking Changes
- **IsNextRule** method was removed from the Parser class. It's functionality is no longer needed as usage of predicates / gates
  no longer requires manually (re)implementing the lookahead function.

- [DSL methods with separators should not support predicates.](https://github.com/SAP/chevrotain/issues/191)

- [Move all "parse time" grammar validations to the initialization phase (grammar construction).](https://github.com/SAP/chevrotain/issues/103)
     
#### Documentation
- [Example implementing syntactic & semantic content assist.](https://github.com/SAP/chevrotain/issues/194)



## 0.9.0 (4-29-2016)

#### Major Changes
- [Support LL(k) grammars.](https://github.com/SAP/chevrotain/issues/184)



## 0.8.1 (4-11-2016)

#### Minor Changes
- [Avoid rebuilding the GAST on parser construction when using RULE_OVERRIDE.](https://github.com/SAP/chevrotain/issues/171)

#### Bug Fixes
- [GAST Production cache does not take into account grammar inheritance](https://github.com/SAP/chevrotain/issues/181)



## 0.8.0 (4-8-2016)

#### Breaking Changes

Some breaking API changes in this version. Most have the changes have been to optional arguments,
so not many changes will be needed (if at all) for most users.

- [Use a config object for RULE DSL method.](https://github.com/SAP/chevrotain/issues/168)

  The [RULE method's](http://sap.github.io/chevrotain/documentation/0_7_2/classes/parser.html#rule) optional third and fourth parameters 
  have been been replaced with a single configuration object of the type [IRuleConfig](http://sap.github.io/chevrotain/documentation/0_8_0/interfaces/iruleconfig.html).
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
  All usages of it must be replaced with an equivalent RULE call using the IRuleConfig [resyncEnabled](http://sap.github.io/chevrotain/documentation/0_8_0/interfaces/iruleconfig.html#resyncenabled)
  property.
  
  For example:
  ```javascript
      // old deprecated form  
      this.RULE_NO_RESYNC("createStmt", function(){ /* ... */})
    
      // new form
      this.RULE("createStmt", function(){ /* ... */}, {resyncEnabled: false})
   ```

- [Parser Configuration should be done using a "Config" Object instead of constructor parameters.](https://github.com/SAP/chevrotain/issues/175)    
- [Error Recovery / Fault Tolerance abilities should be disabled by default.](https://github.com/SAP/chevrotain/issues/174)

   The [Parser constructors's](http://sap.github.io/chevrotain/documentation/0_7_2/classes/parser.html#rule) third (optional) parameter
   has been been replaced with a single configuration object of the type [IParserConfig](http://sap.github.io/chevrotain/documentation/0_8_0/interfaces/iparserconfig.html)
   Therefore any Base Parser super invocation which uses the optional parameter must be updated.
   Additionally The Error recovery functionality is now **disabled** by default, it can be enabled via the parser's configuration.  
   For example:
   
   ```javascript
   // old deprecated form  
   function JsonParser(input) {
      // The third argument was used to enable/disable error recovery
      // and was **true** by default.
      Parser.call(this, input, true)
    }
    
    // new form
    function JsonParser(input) {
      // invoke super constructor
      Parser.call(this, input, allTokens, {
        // by default the error recovery flag is **false**
        // use recoveryEnabled flag in the IParserConfig object to enable enable it.
        recoveryEnabled: true}
      );
   }
   ```
    


## 0.7.2 (4-7-2016)

#### Minor Changes
- [Support Overriding Rule implementations in inheriting grammars.](https://github.com/SAP/chevrotain/issues/169)

#### Documentation 
- [Bring order to the chaos of the examples folder.](https://github.com/SAP/chevrotain/tree/master/examples)



## 0.7.1 (4-3-2016)

#### Minor Changes
- [Parsing Errors should include Parser context information.](https://github.com/SAP/chevrotain/issues/165)
- [AT_LEAST_ONE dsl rule, errMsg param should be optional.](https://github.com/SAP/chevrotain/issues/91)



## 0.7.0 (4-2-2016)

#### Major Changes
- [Lexer multi "modes" support.](https://github.com/SAP/chevrotain/issues/134)



## 0.6.3 (3-28-2016)

#### Minor Changes
- [Re-synced tokens should be reported to the user.](https://github.com/SAP/chevrotain/issues/154)



## 0.6.2 (3-25-2016)

#### Bug Fixes
- [LexerDefinitionErrorType enum was not exported as part of the public API.](https://github.com/SAP/chevrotain/issues/158)



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
- [Diagrams - Fixed global references to permit UMD loading.](https://github.com/SAP/chevrotain/issues/152) 



## 0.5.23 (3-17-2016)

#### Bug Fixes
- [Syntax Diagrams usage highlights issues.](https://github.com/SAP/chevrotain/issues/149) 



## 0.5.22 (3-15-2016)

#### Minor Changes
- [Human Readable Token Labels in Syntax Diagrams.](https://github.com/SAP/chevrotain/issues/144)
- [Use Token Labels in error messages.](#https://github.com/SAP/chevrotain/issues/146)

#### Bug Fixes
- [Diagrams template resources were not fully included in bower "package".](https://github.com/SAP/chevrotain/issues/145) 

**Older Releases** changelog is available on [Github Releases.](https://github.com/SAP/chevrotain/releases)
