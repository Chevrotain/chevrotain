# Fault Tolerance and Error Recovery.

Chevrotain provides automatic error recovery capabilities, this means
that Chevrotain parsers are fault tolerant which is an important capability
when creating editor and language services tooling.

In practical terms this means that Chevrotain will be able to report multiple
syntax errors instead of stopping on the first one and also provide
a partial output structure for an invalid input.

For more details on Fault Tolerance and error recovery see
the [in-depth](http://sap.github.io/chevrotain/docs/tutorial/step4_fault_tolerance.html) guide.
