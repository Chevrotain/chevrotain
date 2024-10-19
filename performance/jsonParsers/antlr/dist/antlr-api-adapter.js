
// Adapt our bunlde of antlr4.web.cjs output to fit the APIs expected
// by the generated antlr4 source code.
antlr4.atn = {};
antlr4.atn.ATNDeserializer = antlr4.ATNDeserializer;
antlr4.atn.LexerATNSimulator = antlr4.LexerATNSimulator;
antlr4.atn.ParserATNSimulator = antlr4.ParserATNSimulator;
antlr4.atn.PredictionContextCache = antlr4.PredictionContextCache;
antlr4.atn.PredictionMode = antlr4.PredictionMode;

antlr4.dfa = {};
antlr4.dfa.DFA = antlr4.DFA;

antlr4.error = {};
antlr4.error.NoViableAltException = antlr4.NoViableAltException;
antlr4.error.RecognitionException = antlr4.RecognitionException;