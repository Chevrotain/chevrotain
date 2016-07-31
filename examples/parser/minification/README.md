### Minificaion of Chevrotain Grammars

Chevrotain relies on **Function.prototype.toString** and **Function.name**
to run. This means that minification of Chevrotain grammars must be done carefully.

A Chevrotain grammar **may or may not** be adversely affected by minification.
It depends on the source structure and how [Uglifyjs](https://github.com/mishoo/UglifyJS2) recognizes the Token names (public/private),
which is in turn dependant on the source structure and Javascript module pattern used.
Therefore **even if** a Chevrotain grammar is currently being minified successfully **without** any custom name mangling options,
There is **no guarantee** it will continue to do so in the future (after refactoring / changes to the minifier library)
The takeaway from this is that is is **highly recommended** to use a more **robust** minification configuration
when minifing Chevrotain grammars.

There are a couple ways to solve this using [Uglifyjs's](https://github.com/mishoo/UglifyJS2) configuration options:

#### Completely disable name mangling.

This will **guarantee** a Chevrotain grammar will run minified
but will also increase the size of the minified file.


#### Selectively avoid the mangling of the specific's grammar Token names.

This is the **recommended** approach as it will allow the maximum minification.


#### Runnable Example
The included [gruntfile.js](./gruntfile.js) implements minification of a sample Chevrotain
Grammar: [unminified.js][./unminified.js] using both the suggested approaches.
Additionally [unit tests](./minify_spec.js) are included to validate the minified grammars actually work.

To run the minification and the tests:

* only once:
  - ```npm install grunt -g``` (only once)
  - ```cd ..```
  - ```npm update``` (in **chevrotain/examples/parser** directory)

* every time:
  - ```grunt build``` (in **chevrotain/examples/parser/minification** directory)
