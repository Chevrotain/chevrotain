// change to generated code: wrapping in basic javascript module instead of 'require'
var antlr4Json;
(function (antlr4Json) {
    // Generated from JSON_ANTLR.g4 by ANTLR 4.6
// jshint ignore: start

// This class defines a complete listener for a parse tree produced by JSON_ANTLRParser.
function JSON_ANTLRListener() {
	antlr4.tree.ParseTreeListener.call(this);
	return this;
}

JSON_ANTLRListener.prototype = Object.create(antlr4.tree.ParseTreeListener.prototype);
JSON_ANTLRListener.prototype.constructor = JSON_ANTLRListener;

// Enter a parse tree produced by JSON_ANTLRParser#json.
JSON_ANTLRListener.prototype.enterJson = function(ctx) {
};

// Exit a parse tree produced by JSON_ANTLRParser#json.
JSON_ANTLRListener.prototype.exitJson = function(ctx) {
};


// Enter a parse tree produced by JSON_ANTLRParser#object.
JSON_ANTLRListener.prototype.enterObject = function(ctx) {
};

// Exit a parse tree produced by JSON_ANTLRParser#object.
JSON_ANTLRListener.prototype.exitObject = function(ctx) {
};


// Enter a parse tree produced by JSON_ANTLRParser#pair.
JSON_ANTLRListener.prototype.enterPair = function(ctx) {
};

// Exit a parse tree produced by JSON_ANTLRParser#pair.
JSON_ANTLRListener.prototype.exitPair = function(ctx) {
};


// Enter a parse tree produced by JSON_ANTLRParser#array.
JSON_ANTLRListener.prototype.enterArray = function(ctx) {
};

// Exit a parse tree produced by JSON_ANTLRParser#array.
JSON_ANTLRListener.prototype.exitArray = function(ctx) {
};


// Enter a parse tree produced by JSON_ANTLRParser#value.
JSON_ANTLRListener.prototype.enterValue = function(ctx) {
};

// Exit a parse tree produced by JSON_ANTLRParser#value.
JSON_ANTLRListener.prototype.exitValue = function(ctx) {
};

    // change to generated code: 'exporting' via ns object
    antlr4Json.JSON_ANTLRListener = JSON_ANTLRListener;

})(antlr4Json || (antlr4Json = {}));
