
function attachHighlightEvents() {
    var diagramHeaders = $(".diagramHeader")
    _.forEach(diagramHeaders, function (header) {
        header.addEventListener("mouseover", onDiagramHeaderMouseOver)
        header.addEventListener("mouseout", onDiagramHeaderMouseOut)
        header.addEventListener("click", onDiagramHeaderMouseClick)
    })

    var noneTerminals = $(".non-terminal")
    _.forEach(noneTerminals, function (nonTerminal) {
        nonTerminal.addEventListener("mouseover", onDiagramNonTerminalMouseOver)
        nonTerminal.addEventListener("mouseout", onDiagramNonTerminalMouseOut)
    })
}


function onDiagramNonTerminalMouseOver(mouseEvent) {
    var rectsAndHeader = getUsageRectAndDefHeader(mouseEvent.target)
    $(rectsAndHeader.rects).toggleClass("diagramRectUsage")
    $(rectsAndHeader.header).toggleClass("diagramHeaderDef")
}


function onDiagramNonTerminalMouseOut(mouseEvent) {
    var rectAndHeader = getUsageRectAndDefHeader(mouseEvent.target)
    $(rectAndHeader.rects).toggleClass("diagramRectUsage")
    $(rectAndHeader.header).toggleClass("diagramHeaderDef")
}

var headerImplTextMarker = null
function onDiagramHeaderMouseOver(mouseEvent) {
    var definitionName = mouseEvent.target.innerHTML
    $(mouseEvent.target).toggleClass("diagramHeaderDef")
    _.forEach(getUsageSvgRect(definitionName), function (rect) {
        $(rect).toggleClass("diagramRectUsage")
    })

    var definitionPos = locateRuleDefinition(definitionName, javaScriptEditor.getValue(), javaScriptEditor)
    var pos = _.first(definitionPos)
    headerImplTextMarker = javaScriptEditor.markText(pos.start, pos.end, {
        className: "markDiagramsTextHover"
    })
}


function onDiagramHeaderMouseOut(mouseEvent) {
    var definitionName = mouseEvent.target.innerHTML
    $(mouseEvent.target).toggleClass("diagramHeaderDef")
    _.forEach(getUsageSvgRect(definitionName), function (rect) {
        $(rect).toggleClass("diagramRectUsage")
    })
    headerImplTextMarker.clear()
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
    if (target instanceof SVGRectElement) {
        // only mark usages/def on the text
        // TODO: maybe the code can be refactored and simplified now that we only care about the text?
        // i.e add event listeners on more specific dom nodes.
        return {rects: [], header: undefined}
    }
    else {
        rects = $(target).siblings("rect")
        text = target.innerHTML
    }
    var header = _.find($(".diagramHeader"), function (currHeader) {
        return currHeader.innerHTML === text
    })

    return {rects: rects, header: header}
}


function center(line) {
    var wholeHeight = javaScriptEditor.charCoords({line: line, ch: 0}, "local").top
    var offsetFromTop = javaScriptEditor.getScrollerElement().offsetHeight / 5
    javaScriptEditor.scrollTo(null, wholeHeight - offsetFromTop - 5)
}
