## X.Y.Z (INSERT_DATE_HERE)

#### Minor Changes
- [Parsing Errors should include Parser context information.](#165)
- [AT_LEAST_ONE dsl rule, errMsg param should be optional.](#91)


#### Minor Changes
- [Re-synced tokens should be reported to the user.](#154)


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
