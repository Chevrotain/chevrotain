var inResizeHorizontalMode = false
var inResizeVerticalLeft = false
var inResizeVerticalRight = false
// TODO: get from css?
var PAGE_VH = 97
var TOP_INITIAL_VH = 76
var BOTTOM_INITAL_VH = PAGE_VH - TOP_INITIAL_VH
var H_SEPARATOR_VH = 1.12
var HEADER_BOX_VH = 4.7

var SNAP_TO_DISTANCE = 2

function initCodeMirrorDivsViewPortHeight() {
    impelEditorDiv.style.height = TOP_INITIAL_VH - HEADER_BOX_VH + "vh"
    inputEditorDiv.style.height = BOTTOM_INITAL_VH - HEADER_BOX_VH + "vh"
    outputEditorDiv.style.height = BOTTOM_INITAL_VH - HEADER_BOX_VH + "vh"
}

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
        percentageLeft = percentageLeft < SNAP_TO_DISTANCE ? 0 : percentageLeft
        percentageLeft = percentageLeft > 99.26 - SNAP_TO_DISTANCE ? 99.26 : percentageLeft
        var leftFinal = percentageLeft + "%"
        $("#left").width(leftFinal)
        // magical number! TODO: get this from CSS
        var rightFinal = "" + (99.26 - percentageLeft) + "%"
        $("#right").width(rightFinal)

        // TODO: need to hide scroll of DiagramsDiv manually ?
    }
}

var resizeVerticalLeft = _.throttle(_.partialRight(dragVertical, "impel", "input", "impelEditorDiv", "inputEditorDiv"), 20)
var resizeVerticalRight = _.throttle(_.partialRight(dragVertical, "diagramsDiv", "output", undefined , "outputEditorDiv"), 20)

function dragVertical(event, topID, buttomID, topCmID, buttomCmID) {
    event.preventDefault()

    var eventY = event.clientY
    var htmlHeight = $("html").height()
    var percentageTop = (eventY / htmlHeight) * PAGE_VH

    if (percentageTop) {
        percentageTop = percentageTop < SNAP_TO_DISTANCE ? 0 : percentageTop
        percentageTop = percentageTop > PAGE_VH - SNAP_TO_DISTANCE ? PAGE_VH : percentageTop
        $("#" + topID).height( percentageTop + "vh")
        var buttomFinal = PAGE_VH - percentageTop
        $("#" + buttomID).height(buttomFinal + "vh")

        if (topCmID) {
            $("#" + topCmID).height( percentageTop - HEADER_BOX_VH + "vh")
        }

        if (buttomCmID) {
            $("#" + buttomCmID).height(buttomFinal - HEADER_BOX_VH + "vh")
        }

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
                $("#outputEditorDiv").height(outputVh - HEADER_BOX_VH + "vh")
                $("#diagramsDiv").height(diagramsVh)
                currDiagramsDivPercentage -= tickSize
                resizeTick()
            }
            else {
                $("#output").height(PAGE_VH + H_SEPARATOR_VH + "vh")
                $("#diagramsDiv").height("0vh")
                $("#outputEditorDiv").height(PAGE_VH + H_SEPARATOR_VH - HEADER_BOX_VH + "vh")
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
