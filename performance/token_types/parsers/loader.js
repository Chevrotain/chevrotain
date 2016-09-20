var base = {};
var baseIframe = document.createElement("iframe");
baseIframe.setAttribute("src", "parsers/base_parser.html");
baseIframe.style.visibility = "hidden"
baseIframe.style.height = 0
baseIframe.style.width = 0
document.body.appendChild(baseIframe);
baseIframe.addEventListener("load", function () {
    base.parser = baseIframe.contentWindow.parser
    base.lexer = baseIframe.contentWindow.lexer
})

var lazy = {};
var lazyIframe = document.createElement("iframe");
lazyIframe.setAttribute("src", "parsers/lazy_parser.html");
lazyIframe.style.visibility = "hidden"
lazyIframe.style.height = 0
lazyIframe.style.width = 0
document.body.appendChild(lazyIframe);
lazyIframe.addEventListener("load", function () {
    lazy.parser = lazyIframe.contentWindow.parser
    lazy.lexer = lazyIframe.contentWindow.lexer
})

var simpleLazy = {};
var simpleLazyIframe = document.createElement("iframe");
simpleLazyIframe.setAttribute("src", "parsers/simple_lazy_parser.html");
simpleLazyIframe.style.visibility = "hidden"
simpleLazyIframe.style.height = 0
simpleLazyIframe.style.width = 0
document.body.appendChild(simpleLazyIframe);
simpleLazyIframe.addEventListener("load", function () {
    simpleLazy.parser = simpleLazyIframe.contentWindow.parser
    simpleLazy.lexer = simpleLazyIframe.contentWindow.lexer
})

