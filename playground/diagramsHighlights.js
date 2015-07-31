
function attachHighlightEvents() {
    var diagramHeaders = $(".diagramHeader")
    _.forEach(diagramHeaders, function (header) {
        header.addEventListener("mouseover", onDiagramHeaderMouseOver);
        header.addEventListener("mouseout", onDiagramHeaderMouseOut);
        header.addEventListener("click", onDiagramHeaderMouseClick);
    })

    var noneTerminals = $(".non-terminal")
    _.forEach(noneTerminals, function (nonTerminal) {
        nonTerminal.addEventListener("mouseover", onDiagramNonTerminalMouseOver);
        nonTerminal.addEventListener("mouseout", onDiagramNonTerminalMouseOut);
    })
}


function onDiagramNonTerminalMouseOver(mouseEvent) {
    var rectAndHeader = getUsageRectAndDefHeader(mouseEvent.target)
    $(rectAndHeader.rect).toggleClass("diagramRectUsage")
    $(rectAndHeader.header).toggleClass("diagramHeaderDef")
}


function onDiagramNonTerminalMouseOut(mouseEvent) {
    var rectAndHeader = getUsageRectAndDefHeader(mouseEvent.target)
    $(rectAndHeader.rect).toggleClass("diagramRectUsage")
    $(rectAndHeader.header).toggleClass("diagramHeaderDef")
}


function onDiagramHeaderMouseOver(mouseEvent) {
    var definitionName = mouseEvent.target.innerHTML
    $(mouseEvent.target).toggleClass("diagramHeaderDef")
    _.forEach(getUsageSvgRect(definitionName), function (rect) {
        $(rect).toggleClass("diagramRectUsage")
    })
}


function onDiagramHeaderMouseOut(mouseEvent) {
    var definitionName = mouseEvent.target.innerHTML
    $(mouseEvent.target).toggleClass("diagramHeaderDef")
    _.forEach(getUsageSvgRect(definitionName), function (rect) {
        $(rect).toggleClass("diagramRectUsage")
    })
}


function onDiagramHeaderMouseClick(mouseEvent) {
    var definitionName = mouseEvent.target.innerHTML
    var definitionPos = locateRuleDefinition(definitionName, javaScriptEditor.getValue(), javaScriptEditor)
    var pos = _.first(definitionPos).start
    center(pos.line)
    javaScriptEditor.focus()
    javaScriptEditor.setCursor(pos)
}


function getUsageSvgRect(definitionName) {
    var rects = $(".non-terminal").find("rect")
    return _.filter(rects, function (rect) {
        var textNode = rect.parentNode.getElementsByTagName('text')[0];
        return textNode.innerHTML === definitionName
    })
}


function getUsageRectAndDefHeader(target) {
    var rect, text
    if (target instanceof SVGRectElement) {
        rect = target
        text = _.first($(target).siblings("text")).innerHTML
    }
    else {
        rect = _.first($(target).siblings("rect"))
        text = target.innerHTML
    }
    var header = _.find($(".diagramHeader"), function (currHeader) {
        return currHeader.innerHTML === text;
    })

    return {rect: rect, header: header}
}


function center(line) {
    var y = javaScriptEditor.charCoords({line: line, ch: 0}, "local").top;
    var halfHeight = javaScriptEditor.getScrollerElement().offsetHeight / 5;
    javaScriptEditor.scrollTo(null, y - halfHeight - 5);
}
