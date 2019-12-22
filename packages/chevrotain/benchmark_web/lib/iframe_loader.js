var lexerOnly = false
var parserOnly = false

function includeTestIFrame(id, url) {
  var iframe = document.createElement("iframe")
  iframe.src = url
  iframe.id = id
  iframe.style = "visibility: hidden;"
  document.body.appendChild(iframe)
  return iframe.contentWindow
}

function addTest(suite, id, action) {
  var $el = $("." + id + " input")
  if ($el && $el.is(":checked")) {
    suite.add(id, {
      defer: true,
      fn: function(deferred) {
        action({ lexerOnly: lexerOnly, parserOnly: parserOnly }, deferred)
      }
    })
  }
}
