// change to generated code: wrapping in basic javascript module instead of 'require'
var antlr4Json;
(function (antlr4Json) {

// Generated from JSON_ANTLR.g4 by ANTLR 4.13.2
// jshint ignore: start
const serializedATN = [4,1,12,58,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,
1,0,1,0,3,0,13,8,0,1,1,1,1,1,1,1,1,5,1,19,8,1,10,1,12,1,22,9,1,1,1,1,1,1,
1,1,1,3,1,28,8,1,1,2,1,2,1,2,1,2,1,3,1,3,1,3,1,3,5,3,38,8,3,10,3,12,3,41,
9,3,1,3,1,3,1,3,1,3,3,3,47,8,3,1,4,1,4,1,4,1,4,1,4,1,4,1,4,3,4,56,8,4,1,
4,0,0,5,0,2,4,6,8,0,0,63,0,12,1,0,0,0,2,27,1,0,0,0,4,29,1,0,0,0,6,46,1,0,
0,0,8,55,1,0,0,0,10,13,3,2,1,0,11,13,3,6,3,0,12,10,1,0,0,0,12,11,1,0,0,0,
13,1,1,0,0,0,14,15,5,1,0,0,15,20,3,4,2,0,16,17,5,2,0,0,17,19,3,4,2,0,18,
16,1,0,0,0,19,22,1,0,0,0,20,18,1,0,0,0,20,21,1,0,0,0,21,23,1,0,0,0,22,20,
1,0,0,0,23,24,5,3,0,0,24,28,1,0,0,0,25,26,5,1,0,0,26,28,5,3,0,0,27,14,1,
0,0,0,27,25,1,0,0,0,28,3,1,0,0,0,29,30,5,11,0,0,30,31,5,4,0,0,31,32,3,8,
4,0,32,5,1,0,0,0,33,34,5,5,0,0,34,39,3,8,4,0,35,36,5,2,0,0,36,38,3,8,4,0,
37,35,1,0,0,0,38,41,1,0,0,0,39,37,1,0,0,0,39,40,1,0,0,0,40,42,1,0,0,0,41,
39,1,0,0,0,42,43,5,6,0,0,43,47,1,0,0,0,44,45,5,5,0,0,45,47,5,6,0,0,46,33,
1,0,0,0,46,44,1,0,0,0,47,7,1,0,0,0,48,56,5,11,0,0,49,56,5,12,0,0,50,56,3,
2,1,0,51,56,3,6,3,0,52,56,5,7,0,0,53,56,5,8,0,0,54,56,5,9,0,0,55,48,1,0,
0,0,55,49,1,0,0,0,55,50,1,0,0,0,55,51,1,0,0,0,55,52,1,0,0,0,55,53,1,0,0,
0,55,54,1,0,0,0,56,9,1,0,0,0,6,12,20,27,39,46,55];


const atn = new antlr4.atn.ATNDeserializer().deserialize(serializedATN);

const decisionsToDFA = atn.decisionToState.map( (ds, index) => new antlr4.dfa.DFA(ds, index) );

const sharedContextCache = new antlr4.atn.PredictionContextCache();

class JSON_ANTLRParser extends antlr4.Parser {

    static grammarFileName = "JSON_ANTLR.g4";
    static literalNames = [ null, "'{'", "','", "'}'", "':'", "'['", "']'",
                            "'true'", "'false'", "'null'" ];
    static symbolicNames = [ null, null, null, null, null, null, null, null,
                             null, null, "WS", "STRING", "NUMBER" ];
    static ruleNames = [ "json", "object", "pair", "array", "value" ];

    constructor(input) {
        super(input);
        this._interp = new antlr4.atn.ParserATNSimulator(this, atn, decisionsToDFA, sharedContextCache);
        this.ruleNames = JSON_ANTLRParser.ruleNames;
        this.literalNames = JSON_ANTLRParser.literalNames;
        this.symbolicNames = JSON_ANTLRParser.symbolicNames;
    }



	json() {
	    let localctx = new JsonContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 0, JSON_ANTLRParser.RULE_json);
	    try {
	        this.state = 12;
	        this._errHandler.sync(this);
	        switch(this._input.LA(1)) {
	        case 1:
	            this.enterOuterAlt(localctx, 1);
	            this.state = 10;
	            this.object();
	            break;
	        case 5:
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
	}



	object() {
	    let localctx = new ObjectContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 2, JSON_ANTLRParser.RULE_object);
	    var _la = 0;
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
	            while(_la===2) {
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
	}



	pair() {
	    let localctx = new PairContext(this, this._ctx, this.state);
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
	}



	array() {
	    let localctx = new ArrayContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 6, JSON_ANTLRParser.RULE_array);
	    var _la = 0;
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
	            while(_la===2) {
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
	}



	value() {
	    let localctx = new ValueContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 8, JSON_ANTLRParser.RULE_value);
	    try {
	        this.state = 55;
	        this._errHandler.sync(this);
	        switch(this._input.LA(1)) {
	        case 11:
	            this.enterOuterAlt(localctx, 1);
	            this.state = 48;
	            this.match(JSON_ANTLRParser.STRING);
	            break;
	        case 12:
	            this.enterOuterAlt(localctx, 2);
	            this.state = 49;
	            this.match(JSON_ANTLRParser.NUMBER);
	            break;
	        case 1:
	            this.enterOuterAlt(localctx, 3);
	            this.state = 50;
	            this.object();
	            break;
	        case 5:
	            this.enterOuterAlt(localctx, 4);
	            this.state = 51;
	            this.array();
	            break;
	        case 7:
	            this.enterOuterAlt(localctx, 5);
	            this.state = 52;
	            this.match(JSON_ANTLRParser.T__6);
	            break;
	        case 8:
	            this.enterOuterAlt(localctx, 6);
	            this.state = 53;
	            this.match(JSON_ANTLRParser.T__7);
	            break;
	        case 9:
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
	}


}

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

class JsonContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = JSON_ANTLRParser.RULE_json;
    }

	object() {
	    return this.getTypedRuleContext(ObjectContext,0);
	};

	array() {
	    return this.getTypedRuleContext(ArrayContext,0);
	};


}



class ObjectContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = JSON_ANTLRParser.RULE_object;
    }

	pair = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(PairContext);
	    } else {
	        return this.getTypedRuleContext(PairContext,i);
	    }
	};


}



class PairContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = JSON_ANTLRParser.RULE_pair;
    }

	STRING() {
	    return this.getToken(JSON_ANTLRParser.STRING, 0);
	};

	value() {
	    return this.getTypedRuleContext(ValueContext,0);
	};


}



class ArrayContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = JSON_ANTLRParser.RULE_array;
    }

	value = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(ValueContext);
	    } else {
	        return this.getTypedRuleContext(ValueContext,i);
	    }
	};


}



class ValueContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = JSON_ANTLRParser.RULE_value;
    }

	STRING() {
	    return this.getToken(JSON_ANTLRParser.STRING, 0);
	};

	NUMBER() {
	    return this.getToken(JSON_ANTLRParser.NUMBER, 0);
	};

	object() {
	    return this.getTypedRuleContext(ObjectContext,0);
	};

	array() {
	    return this.getTypedRuleContext(ArrayContext,0);
	};


}




JSON_ANTLRParser.JsonContext = JsonContext;
JSON_ANTLRParser.ObjectContext = ObjectContext;
JSON_ANTLRParser.PairContext = PairContext;
JSON_ANTLRParser.ArrayContext = ArrayContext;
JSON_ANTLRParser.ValueContext = ValueContext;

	// change to generated code: 'exporting' via ns object
	antlr4Json.JSON_ANTLRParser = JSON_ANTLRParser;
})(antlr4Json || (antlr4Json = {}));