### Minificaion of Chevrotain Grammars

~~Chevrotain relies on **Function.prototype.toString**
to run. This means that minification of Chevrotain parsers must be done carefully, otherwise
a minified parser may fail during initialization.~~

The dependence on `Function.prototype.toString` was removed in
[version 6.0.0](http://chevrotain.io/docs/changes/CHANGELOG.html#_6-0-0-8-20-2019) of Chevrotain.
No special handling is needed during minification scenarios.
