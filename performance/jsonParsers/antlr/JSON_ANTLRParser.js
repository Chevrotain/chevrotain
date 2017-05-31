// change to generated code: wrapping in basic javascript module instead of 'require'
var antlr4Json;
(function (antlr4Json) {

    // Generated from JSON_ANTLR.g4 by ANTLR 4.7
// jshint ignore: start
var grammarFileName = "JSON_ANTLR.g4";

var serializedATN = ["\u0003\u608b\ua72a\u8133\ub9ed\u417c\u3be7\u7786\u5964",
    "\u0003\u000e<\u0004\u0002\t\u0002\u0004\u0003\t\u0003\u0004\u0004\t",
    "\u0004\u0004\u0005\t\u0005\u0004\u0006\t\u0006\u0003\u0002\u0003\u0002",
    "\u0005\u0002\u000f\n\u0002\u0003\u0003\u0003\u0003\u0003\u0003\u0003",
    "\u0003\u0007\u0003\u0015\n\u0003\f\u0003\u000e\u0003\u0018\u000b\u0003",
    "\u0003\u0003\u0003\u0003\u0003\u0003\u0003\u0003\u0005\u0003\u001e\n",
    "\u0003\u0003\u0004\u0003\u0004\u0003\u0004\u0003\u0004\u0003\u0005\u0003",
    "\u0005\u0003\u0005\u0003\u0005\u0007\u0005(\n\u0005\f\u0005\u000e\u0005",
    "+\u000b\u0005\u0003\u0005\u0003\u0005\u0003\u0005\u0003\u0005\u0005",
    "\u00051\n\u0005\u0003\u0006\u0003\u0006\u0003\u0006\u0003\u0006\u0003",
    "\u0006\u0003\u0006\u0003\u0006\u0005\u0006:\n\u0006\u0003\u0006\u0002",
    "\u0002\u0007\u0002\u0004\u0006\b\n\u0002\u0002\u0002A\u0002\u000e\u0003",
    "\u0002\u0002\u0002\u0004\u001d\u0003\u0002\u0002\u0002\u0006\u001f\u0003",
    "\u0002\u0002\u0002\b0\u0003\u0002\u0002\u0002\n9\u0003\u0002\u0002\u0002",
    "\f\u000f\u0005\u0004\u0003\u0002\r\u000f\u0005\b\u0005\u0002\u000e\f",
    "\u0003\u0002\u0002\u0002\u000e\r\u0003\u0002\u0002\u0002\u000f\u0003",
    "\u0003\u0002\u0002\u0002\u0010\u0011\u0007\u0003\u0002\u0002\u0011\u0016",
    "\u0005\u0006\u0004\u0002\u0012\u0013\u0007\u0004\u0002\u0002\u0013\u0015",
    "\u0005\u0006\u0004\u0002\u0014\u0012\u0003\u0002\u0002\u0002\u0015\u0018",
    "\u0003\u0002\u0002\u0002\u0016\u0014\u0003\u0002\u0002\u0002\u0016\u0017",
    "\u0003\u0002\u0002\u0002\u0017\u0019\u0003\u0002\u0002\u0002\u0018\u0016",
    "\u0003\u0002\u0002\u0002\u0019\u001a\u0007\u0005\u0002\u0002\u001a\u001e",
    "\u0003\u0002\u0002\u0002\u001b\u001c\u0007\u0003\u0002\u0002\u001c\u001e",
    "\u0007\u0005\u0002\u0002\u001d\u0010\u0003\u0002\u0002\u0002\u001d\u001b",
    "\u0003\u0002\u0002\u0002\u001e\u0005\u0003\u0002\u0002\u0002\u001f ",
    "\u0007\r\u0002\u0002 !\u0007\u0006\u0002\u0002!\"\u0005\n\u0006\u0002",
    "\"\u0007\u0003\u0002\u0002\u0002#$\u0007\u0007\u0002\u0002$)\u0005\n",
    "\u0006\u0002%&\u0007\u0004\u0002\u0002&(\u0005\n\u0006\u0002\'%\u0003",
    "\u0002\u0002\u0002(+\u0003\u0002\u0002\u0002)\'\u0003\u0002\u0002\u0002",
    ")*\u0003\u0002\u0002\u0002*,\u0003\u0002\u0002\u0002+)\u0003\u0002\u0002",
    "\u0002,-\u0007\b\u0002\u0002-1\u0003\u0002\u0002\u0002./\u0007\u0007",
    "\u0002\u0002/1\u0007\b\u0002\u00020#\u0003\u0002\u0002\u00020.\u0003",
    "\u0002\u0002\u00021\t\u0003\u0002\u0002\u00022:\u0007\r\u0002\u0002",
    "3:\u0007\u000e\u0002\u00024:\u0005\u0004\u0003\u00025:\u0005\b\u0005",
    "\u00026:\u0007\t\u0002\u00027:\u0007\n\u0002\u00028:\u0007\u000b\u0002",
    "\u000292\u0003\u0002\u0002\u000293\u0003\u0002\u0002\u000294\u0003\u0002",
    "\u0002\u000295\u0003\u0002\u0002\u000296\u0003\u0002\u0002\u000297\u0003",
    "\u0002\u0002\u000298\u0003\u0002\u0002\u0002:\u000b\u0003\u0002\u0002",
    "\u0002\b\u000e\u0016\u001d)09"].join("");


var atn = new antlr4.atn.ATNDeserializer().deserialize(serializedATN);

var decisionsToDFA = atn.decisionToState.map( function(ds, index) { return new antlr4.dfa.DFA(ds, index); });

var sharedContextCache = new antlr4.PredictionContextCache();

var literalNames = [ null, "'{'", "','", "'}'", "':'", "'['", "']'", "'true'", 
                     "'false'", "'null'" ];

var symbolicNames = [ null, null, null, null, null, null, null, null, null, 
                      null, "WS", "STRING", "NUMBER" ];

var ruleNames =  [ "json", "object", "pair", "array", "value" ];

function JSON_ANTLRParser (input) {
	antlr4.Parser.call(this, input);
    this._interp = new antlr4.atn.ParserATNSimulator(this, atn, decisionsToDFA, sharedContextCache);
    this.ruleNames = ruleNames;
    this.literalNames = literalNames;
    this.symbolicNames = symbolicNames;
    return this;
}

JSON_ANTLRParser.prototype = Object.create(antlr4.Parser.prototype);
JSON_ANTLRParser.prototype.constructor = JSON_ANTLRParser;

Object.defineProperty(JSON_ANTLRParser.prototype, "atn", {
	get : function() {
		return atn;
	}
});

JSON_ANTLRParser.EOF = antlr4.Token.EOF;
JSON_ANTLRParser.T__0 = 1;
JSON_ANTLRParser.T__1 = 2;
JSON_ANTLRParser.T__2 = 3;
JSON_ANTLRParser.T__3 = 4;
JSON_ANTLRParser.T__4 = 5;
JSON_ANTLRParser.T__5 = 6;
JSON_ANTLRParser.T__6 = 7;
JSON_ANTLRParser.T__7 = 8;
JSON_ANTLRParser.T__8 = 9;
JSON_ANTLRParser.WS = 10;
JSON_ANTLRParser.STRING = 11;
JSON_ANTLRParser.NUMBER = 12;

JSON_ANTLRParser.RULE_json = 0;
JSON_ANTLRParser.RULE_object = 1;
JSON_ANTLRParser.RULE_pair = 2;
JSON_ANTLRParser.RULE_array = 3;
JSON_ANTLRParser.RULE_value = 4;

function JsonContext(parser, parent, invokingState) {
	if(parent===undefined) {
	    parent = null;
	}
	if(invokingState===undefined || invokingState===null) {
		invokingState = -1;
	}
	antlr4.ParserRuleContext.call(this, parent, invokingState);
    this.parser = parser;
    this.ruleIndex = JSON_ANTLRParser.RULE_json;
    return this;
}

JsonContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
JsonContext.prototype.constructor = JsonContext;

JsonContext.prototype.object = function() {
    return this.getTypedRuleContext(ObjectContext,0);
};

JsonContext.prototype.array = function() {
    return this.getTypedRuleContext(ArrayContext,0);
};




JSON_ANTLRParser.JsonContext = JsonContext;

JSON_ANTLRParser.prototype.json = function() {

    var localctx = new JsonContext(this, this._ctx, this.state);
    this.enterRule(localctx, 0, JSON_ANTLRParser.RULE_json);
    try {
        this.state = 12;
        this._errHandler.sync(this);
        switch(this._input.LA(1)) {
        case JSON_ANTLRParser.T__0:
            this.enterOuterAlt(localctx, 1);
            this.state = 10;
            this.object();
            break;
        case JSON_ANTLRParser.T__4:
            this.enterOuterAlt(localctx, 2);
            this.state = 11;
            this.array();
            break;
        default:
            throw new antlr4.error.NoViableAltException(this);
        }
    } catch (re) {
    	if(re instanceof antlr4.error.RecognitionException) {
	        localctx.exception = re;
	        this._errHandler.reportError(this, re);
	        this._errHandler.recover(this, re);
	    } else {
	    	throw re;
	    }
    } finally {
        this.exitRule();
    }
    return localctx;
};

function ObjectContext(parser, parent, invokingState) {
	if(parent===undefined) {
	    parent = null;
	}
	if(invokingState===undefined || invokingState===null) {
		invokingState = -1;
	}
	antlr4.ParserRuleContext.call(this, parent, invokingState);
    this.parser = parser;
    this.ruleIndex = JSON_ANTLRParser.RULE_object;
    return this;
}

ObjectContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
ObjectContext.prototype.constructor = ObjectContext;

ObjectContext.prototype.pair = function(i) {
    if(i===undefined) {
        i = null;
    }
    if(i===null) {
        return this.getTypedRuleContexts(PairContext);
    } else {
        return this.getTypedRuleContext(PairContext,i);
    }
};




JSON_ANTLRParser.ObjectContext = ObjectContext;

JSON_ANTLRParser.prototype.object = function() {

    var localctx = new ObjectContext(this, this._ctx, this.state);
    this.enterRule(localctx, 2, JSON_ANTLRParser.RULE_object);
    var _la = 0; // Token type
    try {
        this.state = 27;
        this._errHandler.sync(this);
        var la_ = this._interp.adaptivePredict(this._input,2,this._ctx);
        switch(la_) {
        case 1:
            this.enterOuterAlt(localctx, 1);
            this.state = 14;
            this.match(JSON_ANTLRParser.T__0);
            this.state = 15;
            this.pair();
            this.state = 20;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
            while(_la===JSON_ANTLRParser.T__1) {
                this.state = 16;
                this.match(JSON_ANTLRParser.T__1);
                this.state = 17;
                this.pair();
                this.state = 22;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
            }
            this.state = 23;
            this.match(JSON_ANTLRParser.T__2);
            break;

        case 2:
            this.enterOuterAlt(localctx, 2);
            this.state = 25;
            this.match(JSON_ANTLRParser.T__0);
            this.state = 26;
            this.match(JSON_ANTLRParser.T__2);
            break;

        }
    } catch (re) {
    	if(re instanceof antlr4.error.RecognitionException) {
	        localctx.exception = re;
	        this._errHandler.reportError(this, re);
	        this._errHandler.recover(this, re);
	    } else {
	    	throw re;
	    }
    } finally {
        this.exitRule();
    }
    return localctx;
};

function PairContext(parser, parent, invokingState) {
	if(parent===undefined) {
	    parent = null;
	}
	if(invokingState===undefined || invokingState===null) {
		invokingState = -1;
	}
	antlr4.ParserRuleContext.call(this, parent, invokingState);
    this.parser = parser;
    this.ruleIndex = JSON_ANTLRParser.RULE_pair;
    return this;
}

PairContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
PairContext.prototype.constructor = PairContext;

PairContext.prototype.STRING = function() {
    return this.getToken(JSON_ANTLRParser.STRING, 0);
};

PairContext.prototype.value = function() {
    return this.getTypedRuleContext(ValueContext,0);
};




JSON_ANTLRParser.PairContext = PairContext;

JSON_ANTLRParser.prototype.pair = function() {

    var localctx = new PairContext(this, this._ctx, this.state);
    this.enterRule(localctx, 4, JSON_ANTLRParser.RULE_pair);
    try {
        this.enterOuterAlt(localctx, 1);
        this.state = 29;
        this.match(JSON_ANTLRParser.STRING);
        this.state = 30;
        this.match(JSON_ANTLRParser.T__3);
        this.state = 31;
        this.value();
    } catch (re) {
    	if(re instanceof antlr4.error.RecognitionException) {
	        localctx.exception = re;
	        this._errHandler.reportError(this, re);
	        this._errHandler.recover(this, re);
	    } else {
	    	throw re;
	    }
    } finally {
        this.exitRule();
    }
    return localctx;
};

function ArrayContext(parser, parent, invokingState) {
	if(parent===undefined) {
	    parent = null;
	}
	if(invokingState===undefined || invokingState===null) {
		invokingState = -1;
	}
	antlr4.ParserRuleContext.call(this, parent, invokingState);
    this.parser = parser;
    this.ruleIndex = JSON_ANTLRParser.RULE_array;
    return this;
}

ArrayContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
ArrayContext.prototype.constructor = ArrayContext;

ArrayContext.prototype.value = function(i) {
    if(i===undefined) {
        i = null;
    }
    if(i===null) {
        return this.getTypedRuleContexts(ValueContext);
    } else {
        return this.getTypedRuleContext(ValueContext,i);
    }
};




JSON_ANTLRParser.ArrayContext = ArrayContext;

JSON_ANTLRParser.prototype.array = function() {

    var localctx = new ArrayContext(this, this._ctx, this.state);
    this.enterRule(localctx, 6, JSON_ANTLRParser.RULE_array);
    var _la = 0; // Token type
    try {
        this.state = 46;
        this._errHandler.sync(this);
        var la_ = this._interp.adaptivePredict(this._input,4,this._ctx);
        switch(la_) {
        case 1:
            this.enterOuterAlt(localctx, 1);
            this.state = 33;
            this.match(JSON_ANTLRParser.T__4);
            this.state = 34;
            this.value();
            this.state = 39;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
            while(_la===JSON_ANTLRParser.T__1) {
                this.state = 35;
                this.match(JSON_ANTLRParser.T__1);
                this.state = 36;
                this.value();
                this.state = 41;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
            }
            this.state = 42;
            this.match(JSON_ANTLRParser.T__5);
            break;

        case 2:
            this.enterOuterAlt(localctx, 2);
            this.state = 44;
            this.match(JSON_ANTLRParser.T__4);
            this.state = 45;
            this.match(JSON_ANTLRParser.T__5);
            break;

        }
    } catch (re) {
    	if(re instanceof antlr4.error.RecognitionException) {
	        localctx.exception = re;
	        this._errHandler.reportError(this, re);
	        this._errHandler.recover(this, re);
	    } else {
	    	throw re;
	    }
    } finally {
        this.exitRule();
    }
    return localctx;
};

function ValueContext(parser, parent, invokingState) {
	if(parent===undefined) {
	    parent = null;
	}
	if(invokingState===undefined || invokingState===null) {
		invokingState = -1;
	}
	antlr4.ParserRuleContext.call(this, parent, invokingState);
    this.parser = parser;
    this.ruleIndex = JSON_ANTLRParser.RULE_value;
    return this;
}

ValueContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
ValueContext.prototype.constructor = ValueContext;

ValueContext.prototype.STRING = function() {
    return this.getToken(JSON_ANTLRParser.STRING, 0);
};

ValueContext.prototype.NUMBER = function() {
    return this.getToken(JSON_ANTLRParser.NUMBER, 0);
};

ValueContext.prototype.object = function() {
    return this.getTypedRuleContext(ObjectContext,0);
};

ValueContext.prototype.array = function() {
    return this.getTypedRuleContext(ArrayContext,0);
};




JSON_ANTLRParser.ValueContext = ValueContext;

JSON_ANTLRParser.prototype.value = function() {

    var localctx = new ValueContext(this, this._ctx, this.state);
    this.enterRule(localctx, 8, JSON_ANTLRParser.RULE_value);
    try {
        this.state = 55;
        this._errHandler.sync(this);
        switch(this._input.LA(1)) {
        case JSON_ANTLRParser.STRING:
            this.enterOuterAlt(localctx, 1);
            this.state = 48;
            this.match(JSON_ANTLRParser.STRING);
            break;
        case JSON_ANTLRParser.NUMBER:
            this.enterOuterAlt(localctx, 2);
            this.state = 49;
            this.match(JSON_ANTLRParser.NUMBER);
            break;
        case JSON_ANTLRParser.T__0:
            this.enterOuterAlt(localctx, 3);
            this.state = 50;
            this.object();
            break;
        case JSON_ANTLRParser.T__4:
            this.enterOuterAlt(localctx, 4);
            this.state = 51;
            this.array();
            break;
        case JSON_ANTLRParser.T__6:
            this.enterOuterAlt(localctx, 5);
            this.state = 52;
            this.match(JSON_ANTLRParser.T__6);
            break;
        case JSON_ANTLRParser.T__7:
            this.enterOuterAlt(localctx, 6);
            this.state = 53;
            this.match(JSON_ANTLRParser.T__7);
            break;
        case JSON_ANTLRParser.T__8:
            this.enterOuterAlt(localctx, 7);
            this.state = 54;
            this.match(JSON_ANTLRParser.T__8);
            break;
        default:
            throw new antlr4.error.NoViableAltException(this);
        }
    } catch (re) {
    	if(re instanceof antlr4.error.RecognitionException) {
	        localctx.exception = re;
	        this._errHandler.reportError(this, re);
	        this._errHandler.recover(this, re);
	    } else {
	    	throw re;
	    }
    } finally {
        this.exitRule();
    }
    return localctx;
};

    // change to generated code: 'exporting' via ns object
    antlr4Json.JSON_ANTLRParser = JSON_ANTLRParser;
})(antlr4Json || (antlr4Json = {}));
