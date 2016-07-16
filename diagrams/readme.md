## Template for Generating Syntax Diagrams for a Grammar.
 
It is often useful to visually inspect a grammar's syntax diagrams during development
or for documentation purposes.

This folder contains a template which can be easily modified to render and display
A grammar as railroad syntax diagrams using the [railroad-diagrams](https://github.com/tabatkins/railroad-diagrams)
library by @tabatkins.

Examples of generated diagrams:
* [JSON diagrams](http://sap.github.io/chevrotain/diagrams_sample/diagrams_sample.html).
* [CSS diagrams](https://rawgit.com/SAP/chevrotain/master/examples/grammars/css/css_diagrams.html).
 
 
### Features:
  * Highlight usages and definitions on mouse hover.
  * Scroll to definition of non-terminal on mouse click. 
 

### Usage Instructions:
The template will runs as is, but it will render a sample grammar instead of your custom grammar.

There are **only** three steps needed to render a custom grammar:        
1. Copy **diagrams.html** into a source controlled folder (root of your project is recommended).
 
2. Modify the references to the resources (script/stylesheet tags) in your copied **diagrams.html** so they will still be valid.
   * This depends on both your project structure and on how you consume chevrotain (npm/bower/other).
   * For example, assuming chevrotain is located in **node_modules/chevrotain**: 
     ```<script src='src/diagrams_builder.js'></script>``` should be change to: 
     ```<script src='node_modules/chevrotain/diagrams/src/diagrams_builder.js'></script>```
   * For convenience **diagrams.html** contains three blocks of references for common use cases,
     comment/uncomment the relevant one for your needs. 

3. Replace the two references to **DUMMY_SAMPLE** with script tags/logic that will load and initialize an instance of
   the custom Parser whose grammar should be rendered.
   
[Example of a modified template](https://github.com/SAP/chevrotain/blob/master/examples/grammars/css/css_diagrams.html) of a modified html 
with a custom grammar.
   
   
#### What about grammars written with commonjs (node.js) modules.
Because The diagrams are rendered in a browser, The grammar's implementation must be runnable in a browser.
This means the commonjs code must be wrapped / transformed to be browser compatible.
Some options to accomplish this:
 * [UMD](https://github.com/umdjs/umd)
 * [browserify](http://browserify.org/)
 * [webpack](https://webpack.github.io/)
 * [systemjs](https://github.com/systemjs/systemjs)


#### What about grammars written with AMD (require.js) modules.
All the sources used in the template are wrapped using the [UMD](https://github.com/umdjs/umd) pattern.
Thus they are compatible with AMD modules. In such a case the html can be modified to additionally load require.js and perform
the grammar rendering in the require.js **data-main** script.
