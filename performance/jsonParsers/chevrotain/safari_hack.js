function IsSafari() {
    var isSafari = navigator.vendor && navigator.vendor.indexOf('Apple') > -1 &&
               navigator.userAgent && !navigator.userAgent.match('CriOS');
    return is_safari;
}

var unicdoeRegExp = /^[0-9a-fA-F]{4}/

function matchStringLiteral(text) {
    var i = 0

    if (text[i] !== "\"") {
        return null
    }

    var endOfLiteral = false

    i++
    while (!endOfLiteral) {
        var c = text[i]
        // escaped
        if (c === "\\") {
            i++
            var nc = text[i]
            if (nc === "u") {
                var unicode = text.substr(i, 4)
                if (!unicdoeRegExp.test(unicode)) {
                    return null
                }
                else {
                    i = i + 4
                }
            }
            if (nc !== "b" && nc !== "f" && nc !== "n" && nc !== "r" && nc !== "t" && nc !== "v" && nc !== "\\" && nc !== "\"") {
                return null
            }
        }
        else {
            if (c === "\"") {
                return [text.substr(0, i + 1)]
            }
            i++
        }
    }

    return null
}
