## 0.6.00 (INSERT_DATE_HERE)

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
