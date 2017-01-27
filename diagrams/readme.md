## Template for Generating Syntax Diagrams for a Grammar.
 
It is often useful to visually inspect a grammar's syntax diagrams during development
or for documentation purposes.

This folder contains two templates which can be easily modified to render and display
A grammar as railroad syntax diagrams using the [railroad-diagrams](https://github.com/tabatkins/railroad-diagrams)
library by @tabatkins.

### Examples:
* [JSON diagrams](http://sap.github.io/chevrotain/diagrams_sample/diagrams_sample.html).
* [CSS diagrams](https://rawgit.com/SAP/chevrotain/master/examples/grammars/css/css_diagrams.html).
 
 
### Features:
  * Highlight usages and definitions on mouse hover.
  * Scroll to definition of non-terminal on mouse click. 
 

### Instructions:
There are two templates for two separate use cases:

#### Diagrams from Serialized Grammar.
Drawing the diagrams from a **serialized** format is useful when your grammar has been implemented in node.js
and cannot (at least not easily) be bundled for use in a browser.

**Instructions:**
- Copy **[diagrams_serialized.html](https://github.com/SAP/chevrotain/blob/master/diagrams/diagrams_serialized.html)** into a source controlled folder.
  * In the rest of this document this folder will be called **root**.

- Modify the references to the resources (script/stylesheet tags) in your copied **root/diagrams_serialized.html** so they will still be valid.
 * This depends on both your project structure and on how you consume chevrotain (npm/other).
 * For convenience **diagrams_serialized.html** contains three blocks of references for common use cases,
   comment/uncomment the relevant block for your needs. 

- Create a script to serialize your grammar. Use [sample/serialize_sample.js](https://github.com/SAP/chevrotain/blob/master/diagrams/sample/serialize_sample.js)
  as a template. 
  * Note that this simple serializer only exports the serialized grammar as a global variable on the window object.
    For more complex behavior create your own serialization logic by using the available Chevrotain APIs:
    - [serializeGrammar](http://sap.github.io/chevrotain/documentation/0_22_0/modules/gast.html#serializegrammar) 
    - [serializeProduction](http://sap.github.io/chevrotain/documentation/0_22_0/modules/gast.html#serializeproduction)

- Modify or replace 
  ```<script src='sample/generated_serialized_grammar.js'></script>```
  script tag in your copied **root/diagrams_serialized.html** to load & use your serialized grammar.


#### Diagrams from a Parser instance.
Drawing the diagrams from a **Parser instance** is useful when your grammar has already been implemented in a browser compatible format
(not node.js). Or if you already have a browser bundling process as part of your workflow (browserify/webpack).

**Instructions:**
- Copy **[diagrams.html](https://github.com/SAP/chevrotain/blob/master/diagrams/diagrams.html)** into a source controlled folder.
  * In the rest of this document this folder will be called **root**.

- Modify the references to the resources (script/stylesheet tags) in your copied **root/diagrams.html** so they will still be valid.
 * This depends on both your project structure and on how you consume chevrotain (npm/other).
 * For convenience **diagrams.html** contains three blocks of references for common use cases,
   comment/uncomment the relevant block for your needs. 

- Modify or replace 
  ```<<script src='sample/dummy_sample.js'></script>``` 
  script tag in your copied **root/diagrams.html** to load your relevant resources needed to instantiate your grammar in the browser.
   
- Modify or replace 
   ```javascript
       var parserInstanceToDraw = new dummy_sample.DummySampleParser([]);
   ``` 
  line in your copied **root/diagrams.html** to instantiate your Parser.
  
   
[Example of a modified Parser Instance template](https://github.com/SAP/chevrotain/blob/master/examples/grammars/css/css_diagrams.html)
 * This example loads the resources from a unpkg.com.
   

#### What about grammars written with AMD (require.js) modules.
All the sources used in the template are wrapped using the [UMD](https://github.com/umdjs/umd) pattern.
Thus they are compatible with AMD modules. In such a case the html can be modified to additionally load require.js and perform
the grammar rendering in the require.js **data-main** script.
