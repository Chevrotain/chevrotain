function attachHighlightEvents() {
    var diagramHeaders = $(".diagramHeader")
    _.forEach(diagramHeaders, function (header) {
        header.addEventListener("mouseover", onDiagramHeaderMouseOver)
        header.addEventListener("mouseout", onDiagramHeaderMouseOut)
        header.addEventListener("click", onDiagramHeaderMouseClick)
    })

    var noneTerminals = $(".non-terminal text")
    _.forEach(noneTerminals, function (nonTerminal) {
        nonTerminal.addEventListener("mouseover", onDiagramNonTerminalMouseOver)
        nonTerminal.addEventListener("mouseout", onDiagramNonTerminalMouseOut)
        nonTerminal.addEventListener("click", onDiagramNonTerminalMouseClick)

    })
}

var usageMarkers = []
var headerImplTextMarker = null
function markUsagesAndDefsInTextEditor(ruleName) {
    clearUsagesAndDefsInTextEditor()

    var textUsages = locateSubruleRef(javaScriptEditor.getValue(), ruleName, javaScriptEditor)
    usageMarkers = _.map(textUsages, function (currTextUsagePos) {
        return javaScriptEditor.markText(currTextUsagePos.start, currTextUsagePos.end, {
            className: "markDiagramsUsageTextHover"
        })
    })

    var definitionPos = locateRuleDefinition(ruleName, javaScriptEditor.getValue(), javaScriptEditor)
    var pos = _.first(definitionPos)
    headerImplTextMarker = javaScriptEditor.markText(pos.start, pos.end, {
        className: "markDiagramsTextHover"
    })
}

function clearUsagesAndDefsInTextEditor() {
    _.forEach(usageMarkers, function (currMarker) {
        currMarker.clear();
    })
    usageMarkers = []

    if (headerImplTextMarker) {
        headerImplTextMarker.clear()
    }
}


function onDiagramNonTerminalMouseOver(mouseEvent) {
    var rectsHeaderAndRuleName = getUsageRectAndDefHeader(mouseEvent.target)
    $(rectsHeaderAndRuleName.rects).toggleClass("diagramRectUsage")
    $(rectsHeaderAndRuleName.header).toggleClass("diagramHeaderDef")

    markUsagesAndDefsInTextEditor(rectsHeaderAndRuleName.ruleName)
}


function onDiagramNonTerminalMouseOut(mouseEvent) {
    var rectAndHeader = getUsageRectAndDefHeader(mouseEvent.target)
    $(rectAndHeader.rects).toggleClass("diagramRectUsage")
    $(rectAndHeader.header).toggleClass("diagramHeaderDef")

    clearUsagesAndDefsInTextEditor()
}

function onDiagramNonTerminalMouseClick(mouseEvent) {
    var ruleName = mouseEvent.target.innerHTML
    var occurrenceIdx = mouseEvent.target.getAttribute("occurrenceidx")
    var topRuleName = mouseEvent.target.getAttribute("toprulename")
    var topRuleText = parser.getGAstProductions().get(topRuleName).orgText

    var usagePos = locateSubruleRef(javaScriptEditor.getValue(), ruleName, javaScriptEditor, topRuleText, occurrenceIdx)
    var pos = _.first(usagePos)
    center(pos.start.line)
    javaScriptEditor.focus()
    javaScriptEditor.setCursor(pos.start)
}


function onDiagramHeaderMouseOver(mouseEvent) {
    var definitionName = mouseEvent.target.innerHTML
    $(mouseEvent.target).toggleClass("diagramHeaderDef")
    _.forEach(getUsageSvgRect(definitionName), function (rect) {
        $(rect).toggleClass("diagramRectUsage")
    })

    markUsagesAndDefsInTextEditor(definitionName)
}


function onDiagramHeaderMouseOut(mouseEvent) {
    var definitionName = mouseEvent.target.innerHTML
    $(mouseEvent.target).toggleClass("diagramHeaderDef")
    _.forEach(getUsageSvgRect(definitionName), function (rect) {
        $(rect).toggleClass("diagramRectUsage")
    })

    clearUsagesAndDefsInTextEditor()
}


function onDiagramHeaderMouseClick(mouseEvent) {
    var definitionName = mouseEvent.target.innerHTML
    var definitionPos = locateRuleDefinition(definitionName, javaScriptEditor.getValue(), javaScriptEditor)
    var pos = _.first(definitionPos)
    center(pos.start.line)
    javaScriptEditor.focus()
    javaScriptEditor.setCursor(pos.start)
}


function getUsageSvgRect(definitionName) {
    var rects = $(".non-terminal").find("rect")
    return _.filter(rects, function (rect) {
        var textNode = rect.parentNode.getElementsByTagName('text')[0]
        return textNode.innerHTML === definitionName
    })
}


function getUsageRectAndDefHeader(target) {
    var rects, text
    text = target.innerHTML
    rects = getUsageSvgRect(text)

    var header = _.find($(".diagramHeader"), function (currHeader) {
        return currHeader.innerHTML === text
    })

    return {rects: rects, header: header, ruleName: text}
}


function center(line) {
    var wholeHeight = javaScriptEditor.charCoords({line: line, ch: 0}, "local").top
    var offsetFromTop = javaScriptEditor.getScrollerElement().offsetHeight / 5
    javaScriptEditor.scrollTo(null, wholeHeight - offsetFromTop - 5)
}
