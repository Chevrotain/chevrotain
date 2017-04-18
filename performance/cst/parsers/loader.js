var cstOn = {};
var baseIframe = document.createElement("iframe");
baseIframe.setAttribute("src", "parsers/cst_on.html");
baseIframe.style.visibility = "hidden"
baseIframe.style.height = 0
baseIframe.style.width = 0
document.body.appendChild(baseIframe);
baseIframe.addEventListener("load", function () {
    cstOn.parser = baseIframe.contentWindow.parser
    cstOn.lexer = baseIframe.contentWindow.lexer
})

var cstOff = {};
var lazyIframe = document.createElement("iframe");
lazyIframe.setAttribute("src", "parsers/cst_off.html");
lazyIframe.style.visibility = "hidden"
lazyIframe.style.height = 0
lazyIframe.style.width = 0
document.body.appendChild(lazyIframe);
lazyIframe.addEventListener("load", function () {
    cstOff.parser = lazyIframe.contentWindow.parser
    cstOff.lexer = lazyIframe.contentWindow.lexer
})


