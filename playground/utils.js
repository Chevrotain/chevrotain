// http://stackoverflow.com/questions/19491336/get-url-parameter-jquery
function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
}

var orgLexer = chevrotain.Lexer

/**
 * Modifies chevrotain's Lexer to by default enable the deferred error handling
 * This should not normally be done in productive flows, but it is very important for the playground
 * as the deferred errors are displayed in the UI...
 */
function wrapChevrotainLexer() {
    chevrotain.Lexer = function (definition, deferred) {

        if (_.isUndefined(deferred)) {
            deferred = true;
        }
        var newLexer = new orgLexer(definition, deferred);
        return newLexer
    }

    _.assign(chevrotain.Lexer, orgLexer)
}