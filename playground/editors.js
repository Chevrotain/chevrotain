function onInputEditorContentChange() {
  var parseResult, printResult;

  function lex(text) {
    var lexResult = lexer.tokenize(text);
    return lexResult;
  }

  function parse(lexResult, startRuleName) {
    parser.reset();
    parser.input = lexResult.tokens;
    var value = parser[startRuleName]();
    return { value: value, parseErrors: parser.errors };
  }

  parserOutput.setValue("");
  var lexResult = lex(inputEditor.getValue(), defaultRuleName);
  // may be falsy if the example is for the lexer only
  if (parser) {
    parseResult = parse(lexResult, defaultRuleName);
    markInputErrors(lexResult.errors, parseResult.parseErrors);
    if (visitor) {
      printResult = visitor.visit(parseResult.value);
    } else {
      printResult = parseResult.value;
    }
  } else {
    markInputErrors(lexResult.errors, []);

    printResult = _.mapValues(lexResult, function (value, key) {
      if (key === "tokens") {
        return _.map(value, function (token) {
          token.tokenName = chevrotain.tokenName(token.constructor);
          return token;
        });
      } else {
        return value;
      }
    });
  }

  var processedResult;
  if (_.isString(printResult)) {
    processedResult = printResult; // no processing needed
  } else if (_.isNumber(printResult) || _.isBoolean(printResult)) {
    processedResult = new String(printResult);
  } else if (_.isObject(printResult)) {
    processedResult = JSON.stringify(printResult, null, "\t");
  }
  // pure grammar example without output, report status.
  else {
    processedResult = JSON.stringify(
      {
        Lexing: {
          result: lexResult.errors.length > 0 ? "FAILURE" : "SUCCESS",
          num_of_tokens: lexResult.tokens.length,
          lexing_errors: lexResult.errors,
        },
        Parsing: {
          result: parser.errors.length > 0 ? "FAILURE" : "SUCCESS",
          parsing_errors: _.map(parser.errors, function (currError) {
            return _.omit(currError, ["context"]);
          }),
        },
      },
      null,
      "\t"
    );
  }

  parserOutput.setValue(processedResult ? processedResult : "");
}

function onImplementationEditorContentChange() {
  chevrotain.clearCache();
  // TODO: refactor this to be less ugly
  try {
    try {
      var editorFuncVal = eval(javaScriptEditor.getValue());
    } catch (e) {
      // nothing works, draw empty diagrams
      renderDiagramsAndAttachHighlightEvents([]);
      //noinspection ExceptionCaughtLocallyJS
      throw e;
    }

    if (
      !editorFuncVal ||
      !editorFuncVal.lexer ||
      (editorFuncVal.parser && !editorFuncVal.defaultRule)
    ) {
      // nothing works, draw empty diagrams
      renderDiagramsAndAttachHighlightEvents([]);
      //noinspection ExceptionCaughtLocallyJS
      throw Error(
        "The Parser Implementation must return an object of the Type\n" +
          "{\n" +
          "   lexer:chevrotain.Lexer,\n" +
          "   parser?:constructor for chevrotain.Parser,\n" +
          "   defaultRule?:string\n" +
          "}"
      );
    }

    var parserConstructor = editorFuncVal.parser;
    var visitorConstructor = editorFuncVal.visitor;
    lexer = editorFuncVal.lexer;
    markLexerDefinitionErrors(lexer);
    defaultRuleName = editorFuncVal.defaultRule;

    // may be falsy if the example is for the lexer only
    if (parserConstructor) {
      parser = new parserConstructor([]);
      markParserDefinitionErrors(parser);
      var topRules = parser.getSerializedGastProductions();
      renderDiagramsAndAttachHighlightEvents(topRules);
      showDiagrams();
      if (!_.isEmpty(parser.definitionErrors)) {
        var defErrorMessages = _.map(
          parser.definitionErrors,
          function (currErr, idx) {
            return (
              "" + (idx + 1) + ". " + currErr.message.replace(/\n/g, "\n   ")
            );
          }
        );
        //noinspection ExceptionCaughtLocallyJS
        throw Error(defErrorMessages.join("\n"));
      }
      if (visitorConstructor) {
        visitor = new visitorConstructor();
      } else {
        visitor = null;
      }
    } else {
      // lexer Only Example
      parser = undefined;
      renderDiagramsAndAttachHighlightEvents([]);
      hideDiagrams();
    }
    onInputEditorContentChange();
  } catch (e) {
    parserOutput.setValue(
      "Errors during evaluation of the implementation: \n" + e.message
    );
    parserOutput.markText(
      { line: 0, ch: 0 },
      { line: 100, ch: 100 },
      {
        className: "markEvalError",
      }
    );
  }
}

function renderDiagramsAndAttachHighlightEvents(topRules) {
  var diagramsHtml = diagramsHeaderOrgHtml;
  diagramsHtml += diagrams_builder.buildSyntaxDiagramsText(topRules);
  diagramsDiv.innerHTML = diagramsHtml;
  attachEditorEvents();
  diagrams_behavior.initDiagramsBehavior(false);
}
