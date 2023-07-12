function attachEditorEvents() {
  var diagramHeaders = $(".diagramHeader");
  _.forEach(diagramHeaders, function (header) {
    header.addEventListener("mouseover", onDiagramHeaderMouseOver);
    header.addEventListener("mouseout", onDiagramHeaderMouseOut);
    header.addEventListener("click", onDiagramHeaderMouseClick);
  });

  var noneTerminals = $(".non-terminal text");
  _.forEach(noneTerminals, function (nonTerminal) {
    nonTerminal.addEventListener("mouseover", onDiagramNonTerminalMouseOver);
    nonTerminal.addEventListener("mouseout", onDiagramNonTerminalMouseOut);
    nonTerminal.addEventListener("click", onDiagramNonTerminalMouseClick);
  });

  var terminals = $(".terminal text");
  _.forEach(terminals, function (terminal) {
    terminal.addEventListener("mouseover", onDiagramTerminalMouseOver);
    terminal.addEventListener("mouseout", onDiagramTerminalMouseOut);
    terminal.addEventListener("click", onDiagramTerminalMouseClick);
  });
}

var usageMarkers = [];
// we only need one but this simplifies the logic (at the cost of redundant work...)
var definitionTextMarkers = [];

var markNonTerminalsUsagesAndDefs = _.partialRight(
  markUsagesAndDefsInTextEditor,
  locateSubruleRef,
  locateRuleDefinition
);
var markTerminalsConsumeUsagesAndDefs = _.partialRight(
  markUsagesAndDefsInTextEditor,
  locateConsume,
  locateTokenDefinition
);
var markTerminalsManySepUsagesAndDefs = _.partialRight(
  markUsagesAndDefsInTextEditor,
  locateManySepSeparator,
  locateTokenDefinition
);
var markTerminalsAtLeastOneUsagesAndDefs = _.partialRight(
  markUsagesAndDefsInTextEditor,
  locateAtLeastOneSepSeparator,
  locateTokenDefinition
);

function markUsagesAndDefsInTextEditor(
  ruleName,
  usagesLocatorFunc,
  definitionLocatorFunc
) {
  var escapedRuleName = _.escapeRegExp(ruleName);
  var textUsages = usagesLocatorFunc(
    javaScriptEditor.getValue(),
    escapedRuleName,
    javaScriptEditor
  );
  var newMarkers = _.map(textUsages, function (currTextUsagePos) {
    return javaScriptEditor.markText(
      currTextUsagePos.start,
      currTextUsagePos.end,
      {
        className: "markDiagramsUsageTextHover",
      }
    );
  });
  usageMarkers = usageMarkers.concat(newMarkers);

  var definitionPos = definitionLocatorFunc(
    escapedRuleName,
    javaScriptEditor.getValue(),
    javaScriptEditor
  );
  var pos = _.first(definitionPos);
  definitionTextMarkers.push(
    javaScriptEditor.markText(pos.start, pos.end, {
      className: "markDiagramsTextHover",
    })
  );
}

function clearUsagesAndDefsInTextEditor() {
  _.forEach(usageMarkers, function (currMarker) {
    currMarker.clear();
  });
  usageMarkers = [];

  _.forEach(definitionTextMarkers, function (currMarker) {
    currMarker.clear();
  });

  definitionTextMarkers = [];
}

function getMatchingNonTerminalPositionsInText(textNode) {
  var ruleName = textNode.innerHTML;
  var occurrenceIdx = textNode.getAttribute("occurrenceidx");
  var topRuleName = textNode.getAttribute("toprulename");
  var topRuleText = parser[topRuleName].originalGrammarAction.toString();

  var positions = locateSubruleRef(
    javaScriptEditor.getValue(),
    ruleName,
    javaScriptEditor,
    topRuleText,
    occurrenceIdx
  );

  return positions;
}

function getMatchingTerminalPositionsInText(textNode) {
  // the tokenName attribute is the actual Token name instead of the label.
  var terminalName = textNode.getAttribute("tokenname");
  var occurrenceIdx = textNode.getAttribute("occurrenceidx");
  var dslRule = textNode.getAttribute("dslrulename");
  var topRuleName = textNode.getAttribute("toprulename");
  var topRuleText = parser[topRuleName].originalGrammarAction.toString();

  var positions;
  switch (dslRule) {
    case "consume":
      positions = locateConsume(
        javaScriptEditor.getValue(),
        terminalName,
        javaScriptEditor,
        topRuleText,
        occurrenceIdx
      );
      break;
    case "many_sep":
      positions = locateManySepSeparator(
        javaScriptEditor.getValue(),
        terminalName,
        javaScriptEditor,
        topRuleText,
        occurrenceIdx
      );
      break;
    case "at_least_one_sep":
      positions = locateAtLeastOneSepSeparator(
        javaScriptEditor.getValue(),
        terminalName,
        javaScriptEditor,
        topRuleText,
        occurrenceIdx
      );
      break;
  }

  return positions;
}

function onDiagramTerminalMouseOver(mouseEvent) {
  // the tokenName attribute is the actual Token name instead of the label.
  var terminalName = mouseEvent.target.getAttribute("tokenname");
  markTerminalsConsumeUsagesAndDefs(terminalName);
  markTerminalsManySepUsagesAndDefs(terminalName);
  markTerminalsAtLeastOneUsagesAndDefs(terminalName);

  // marking the matching text for the diagram we are hovering over
  // more explicitly with underline. This is done do differentiate it from
  // other usage markers in the text.
  var usagePositions = getMatchingTerminalPositionsInText(mouseEvent.target);
  var pos = _.first(usagePositions);
  definitionTextMarkers.push(
    javaScriptEditor.markText(pos.start, pos.end, {
      className: "markSelectedDiagramsUsageTextHover",
    })
  );
}

function onDiagramTerminalMouseOut(mouseEvent) {
  clearUsagesAndDefsInTextEditor();
}

function onDiagramTerminalMouseClick(mouseEvent) {
  var usagePositions = getMatchingTerminalPositionsInText(mouseEvent.target);

  var pos = _.first(usagePositions);
  center(pos.start.line);
  javaScriptEditor.focus();
  javaScriptEditor.setCursor(pos.start);
}

function onDiagramNonTerminalMouseOver(mouseEvent) {
  markNonTerminalsUsagesAndDefs(mouseEvent.target.innerHTML);

  // marking the matching text for the diagram we are hovering over
  // more explicitly with underline. This is done do differentiate it from
  // other usage markers in the text.
  var usagePositions = getMatchingNonTerminalPositionsInText(mouseEvent.target);
  var pos = _.first(usagePositions);
  definitionTextMarkers.push(
    javaScriptEditor.markText(pos.start, pos.end, {
      className: "markSelectedDiagramsUsageTextHover",
    })
  );
}

function onDiagramNonTerminalMouseOut(mouseEvent) {
  clearUsagesAndDefsInTextEditor();
}

function onDiagramNonTerminalMouseClick(mouseEvent) {
  var positions = getMatchingNonTerminalPositionsInText(mouseEvent.target);
  var pos = _.first(positions);
  center(pos.start.line);
  javaScriptEditor.focus();
  javaScriptEditor.setCursor(pos.start);
}

function onDiagramHeaderMouseOver(mouseEvent) {
  var definitionName = mouseEvent.target.innerHTML;
  markNonTerminalsUsagesAndDefs(definitionName);
}

function onDiagramHeaderMouseOut(mouseEvent) {
  clearUsagesAndDefsInTextEditor();
}

function onDiagramHeaderMouseClick(mouseEvent) {
  var definitionName = mouseEvent.target.innerHTML;
  var definitionPos = locateRuleDefinition(
    definitionName,
    javaScriptEditor.getValue(),
    javaScriptEditor
  );
  var pos = _.first(definitionPos);
  center(pos.start.line);
  javaScriptEditor.focus();
  javaScriptEditor.setCursor(pos.start);
}

function center(line) {
  var wholeHeight = javaScriptEditor.charCoords(
    { line: line, ch: 0 },
    "local"
  ).top;
  var offsetFromTop = javaScriptEditor.getScrollerElement().offsetHeight / 5;
  javaScriptEditor.scrollTo(null, wholeHeight - offsetFromTop - 5);
}
