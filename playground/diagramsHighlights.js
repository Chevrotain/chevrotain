
// TODO: use css styles instead of hardcoded values
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
    rectAndHeader.rect.style.fill = "yellow"
    rectAndHeader.header.style["background-color"] = "#31BA5F"
}


function onDiagramNonTerminalMouseOut(mouseEvent) {
    var rectAndHeader = getUsageRectAndDefHeader(mouseEvent.target)
    rectAndHeader.rect.style.fill = "#A8C1FF"
    rectAndHeader.header.style["background-color"] = "transparent"
}


function onDiagramHeaderMouseOver(mouseEvent) {
    var definitionName = mouseEvent.target.innerHTML
    mouseEvent.target.style["background-color"] = "#31BA5F"
    _.forEach(getUsageSvgRect(definitionName), function (rect) {
        rect.style.fill = "yellow"
    })
}


function onDiagramHeaderMouseOut(mouseEvent) {
    var definitionName = mouseEvent.target.innerHTML
    mouseEvent.target.style["background-color"] = "transparent"
    _.forEach(getUsageSvgRect(definitionName), function (rect) {
        rect.style.fill = "#A8C1FF"
    })
}


function onDiagramHeaderMouseClick(mouseEvent) {
    var definitionName = mouseEvent.target.innerHTML
    var definitionPos = locateRuleDefinition(definitionName, javaScriptEditor.getValue(), javaScriptEditor)
    center(_.first(definitionPos).start.line)
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
