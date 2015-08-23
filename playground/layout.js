
var inResizeHorizontalMode = false
var inResizeVerticalLeft = false
var inResizeVerticalRight = false
// TODO: get from css?
var PAGE_VH = 97
var H_SEPARATOR_VH = 1.12


function modifyCursor(cursorKeyword) {
    document.body.style.cursor = cursorKeyword
}

function revertToOriginalCursor() {
    document.body.style.cursor = "auto"
}

function startResizeHorizontal(event) {
    event.preventDefault()
    modifyCursor("col-resize")
    inResizeHorizontalMode = true
}

function startVerticalLeft(event) {
    event.preventDefault()
    modifyCursor("row-resize")
    inResizeVerticalLeft = true
}

function startVerticalRight(event) {
    event.preventDefault()
    modifyCursor("resizeRow")
    inResizeVerticalRight = true
}

function endResize() {
    revertToOriginalCursor()
    inResizeHorizontalMode = false
    inResizeVerticalLeft = false
    inResizeVerticalRight = false
    refreshCodeMirrorInstances()
}

function resizeRoot(event) {
    if (inResizeHorizontalMode) {
        resizeHorz(event)
    }
    else if (inResizeVerticalLeft) {
        resizeVerticalLeft(event)
    }
    else if (inResizeVerticalRight) {
        resizeVerticalRight(event)
    }

}

// TODO: move to layout.js
var resizeHorz = _.throttle(dragMiddleHorz, 20)
function dragMiddleHorz(event) {
    event.preventDefault()

    var eventX = event.clientX
    var htmlWidth = $("html").width()
    // TODO: more magic numbers!
    var percentageLeft = (eventX / htmlWidth) * 99.3
    if (percentageLeft) {
        percentageLeft = percentageLeft < 1 ? 0 : percentageLeft
        percentageLeft = percentageLeft > 98.26 ? 99.26 : percentageLeft
        var leftFinal = percentageLeft + "%"
        $("#left").width(leftFinal)
        // magical number! TODO: get this from CSS
        var rightFinal = "" + (99.26 - percentageLeft) + "%"
        $("#right").width(rightFinal)
    }
}

var resizeVerticalLeft = _.throttle(_.partialRight(dragVertical, "impel", "input"), 20)
var resizeVerticalRight = _.throttle(_.partialRight(dragVertical, "diagramsDiv", "output"), 20)

function dragVertical(event, topID, buttomID, resizeDiagramsDiv) {
    event.preventDefault()

    var eventY = event.clientY
    var htmlHeight = $("html").height()
    var percentageTop = (eventY / htmlHeight) * PAGE_VH

    if (percentageTop) {
        percentageTop = percentageTop < 1 ? 0 : percentageTop
        percentageTop = percentageTop > PAGE_VH - 1 ? PAGE_VH : percentageTop
        var topFinal = percentageTop + "vh"
        $("#" + topID).height(topFinal)
        var buttomFinal = "" + (PAGE_VH - percentageTop) + "vh"
        $("#" + buttomID).height(buttomFinal)

        //if (resizeDiagramsDiv) {
        //    $("#diagramsDiv").height(percentageTop - 4.7 + "vh")
        //}
    }
}

function refreshCodeMirrorInstances() {
    javaScriptEditor.refresh()
    inputEditor.refresh()
    parserOutput.refresh()
}

// TODO: different tick time according to browser... firefox seems slow... :(
var tickSize = 2;
var tickTime = 4;
var areDiagramsHidden = false
var lastOutputDivPercentage
var lastOutputDivPixels
var lastDiagramsDivPixels

function hideDiagrams() {
    if (areDiagramsHidden) {
        return
    }
    areDiagramsHidden = true
    var htmlHeight = $("html").height()

    $("#rightHorizontalSeparator").css("visibility", "hidden")

    lastOutputDivPixels = $("#output").height()
    lastDiagramsDivPixels = $("#diagramsDiv").height()
    lastOutputDivPercentage = lastOutputDivPixels / htmlHeight * 100
    var currDiagramsDivPercentage = PAGE_VH - lastOutputDivPercentage
    function resizeTick() {
        setTimeout(function () {
            if (currDiagramsDivPercentage > 0) {
                var outputVh = "" + (PAGE_VH - currDiagramsDivPercentage + tickSize) + "vh"
                var diagramsVh = currDiagramsDivPercentage - tickSize + "vh"
                $("#output").height(outputVh)
                $("#diagramsDiv").height(diagramsVh)
                currDiagramsDivPercentage -= tickSize
                resizeTick()
            }
            else {
                $("#output").height(PAGE_VH + H_SEPARATOR_VH + "vh")
                $("#diagramsDiv").height("0vh")
                refreshCodeMirrorInstances()
                $("#rightHorizontalSeparator").css("display", "none")
            }
        }, tickTime)
    }

    resizeTick()
}

function showDiagrams() {
    // always need to re-enable the separator
    $("#rightHorizontalSeparator").css("display", "block");
    $("#rightHorizontalSeparator").css("visibility", "visible")

    if (!areDiagramsHidden) {
        return
    }
    areDiagramsHidden = false

    var tickSize = 1;
    var tickTime = 4;

    var currOutputDivPercentage = PAGE_VH

    function resizeTick() {
        setTimeout(function () {
            if (currOutputDivPercentage > lastOutputDivPercentage) {

                // last tick, must be precise
                if ((currOutputDivPercentage - tickSize) < lastOutputDivPercentage) {
                    var viewportHeight = $(window).height();
                    var lastOutputDivVh = lastOutputDivPixels / viewportHeight * 100;
                    var lasDiagramsDivVh = lastDiagramsDivPixels / viewportHeight * 100;

                    // both VH together must equal PAGE_VH
                    var offset = lastOutputDivVh + lasDiagramsDivVh - PAGE_VH
                    // assumes offset is positive, TODO: is this assumption safe? ???
                    lastOutputDivVh = lastOutputDivVh - (offset / 2)
                    lasDiagramsDivVh = lasDiagramsDivVh - (offset / 2)

                    $("#diagramsDiv").height(lasDiagramsDivVh.toFixed(2) + "vh")
                    $("#output").height(lastOutputDivVh.toFixed(2) + "vh")
                }
                else {
                    var diagramsVh = "" + (PAGE_VH - currOutputDivPercentage + tickSize) + "vh"
                    var outputVh = currOutputDivPercentage - tickSize + "vh"

                    $("#output").height(outputVh)
                    $("#diagramsDiv").height(diagramsVh)
                }

                currOutputDivPercentage -= tickSize
                resizeTick()
            }
            else {
                refreshCodeMirrorInstances()
            }
        }, tickTime)
    }

    resizeTick()
}
