(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.cursornext = {}));
}(this, (function (exports) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __values(o) {
        var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
        if (m) return m.call(o);
        return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    var Loc = /** @class */ (function () {
        function Loc(_a) {
            var index = _a.index, line = _a.line, column = _a.column;
            this.index = index;
            this.line = line;
            this.column = column;
        }
        return Loc;
    }());

    (function (EolType) {
        EolType["CR"] = "\r";
        EolType["LF"] = "\n";
        EolType["CRLF"] = "\r\n";
        EolType["EOF"] = "";
    })(exports.EolType || (exports.EolType = {}));
    var Eol = /** @class */ (function () {
        function Eol(start, end, type) {
            if (type === void 0) { type = exports.EolType.LF; }
            this.type = type;
            this.start = start;
            this.end = end;
        }
        return Eol;
    }());

    var Cursor = /** @class */ (function () {
        function Cursor(_a) {
            var doc = _a.doc, index = _a.index, end = _a.end;
            this.doc = doc;
            this.index = index || 0;
            this.end = end
                ? end < doc.length
                    ? end
                    : undefined
                : undefined;
        }
        Cursor.from = function (cursorLike) {
            if (typeof cursorLike === 'string') {
                return new Cursor({ doc: cursorLike });
            }
            var doc = cursorLike.doc;
            return new Cursor({ doc: doc });
        };
        Cursor.prototype.clone = function (options) {
            return new Cursor(__assign(__assign({}, this), (options ? options : {})));
        };
        Cursor.prototype.getLoc = function () {
            var _this = this;
            this.compute();
            var line = this.eols.findIndex(function (eol) { return _this.index <= eol.start; });
            var column = this.index - this.eols[line - 1].end + 1;
            return new Loc({
                index: this.index,
                line: line,
                column: column
            });
        };
        Cursor.prototype.extractLine = function (line, includeEol) {
            if (includeEol === void 0) { includeEol = false; }
            this.compute();
            if (line > 0 && line <= this.numberOfLines()) {
                var start = this.eols[line - 1].end;
                var end = includeEol
                    ? this.eols[line].end
                    : this.eols[line].start;
                return this.doc.substring(start, end);
            }
            return;
        };
        Cursor.prototype.extractEol = function (line) {
            this.compute();
            return this.eols[line - 1];
        };
        Cursor.prototype.numberOfLines = function () {
            this.compute();
            return this.eols.length - 1;
        };
        Cursor.prototype.compute = function () {
            if (!this.eols) {
                this.eols = [new Eol(0, 0)];
                var cursor = new Cursor({
                    doc: this.doc,
                    index: 0
                });
                while (!cursor.isEof()) {
                    if (cursor.startsWith('\r\n')) {
                        this.eols.push(new Eol(cursor.index, cursor.index + 2, exports.EolType.CRLF));
                        cursor.next(2);
                    }
                    else if (cursor.startsWith('\r')) {
                        this.eols.push(new Eol(cursor.index, cursor.index + 1, exports.EolType.CR));
                        cursor.next(1);
                    }
                    else if (cursor.startsWith('\n')) {
                        this.eols.push(new Eol(cursor.index, cursor.index + 1, exports.EolType.LF));
                        cursor.next(1);
                    }
                    else {
                        cursor.next(1);
                    }
                }
                this.eols.push(new Eol(cursor.endIndex(), cursor.endIndex(), exports.EolType.EOF));
            }
        };
        Cursor.prototype.endIndex = function () {
            return this.end || this.doc.length;
        };
        Cursor.prototype.setIndex = function (index) {
            if (index !== 0 && !index) {
                this.index = this.endIndex();
                return;
            }
            this.index = index;
            if (this.index < 0) {
                return;
            }
            var endIndex = this.endIndex();
            if (this.index >= endIndex) {
                this.index = endIndex;
            }
        };
        Cursor.prototype.moveTo = function (cursor) {
            this.setIndex(cursor.index);
        };
        Cursor.prototype.next = function (offset) {
            if (offset < 1) {
                return;
            }
            this.move(offset);
        };
        Cursor.prototype.previous = function (offset) {
            if (offset < 1) {
                return;
            }
            this.move(-offset);
        };
        Cursor.prototype.move = function (offset) {
            this.setIndex(this.index + offset);
        };
        Cursor.prototype.lookahead = function (len) {
            return this.doc.substring(this.index, len && this.index + len);
        };
        Cursor.prototype.startsWith = function (compareString) {
            return (compareString === this.lookahead(compareString.length));
        };
        Cursor.prototype.oneOf = function (compareStrings) {
            var e_1, _a;
            try {
                for (var compareStrings_1 = __values(compareStrings), compareStrings_1_1 = compareStrings_1.next(); !compareStrings_1_1.done; compareStrings_1_1 = compareStrings_1.next()) {
                    var compareString = compareStrings_1_1.value;
                    if (this.startsWith(compareString)) {
                        return compareString;
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (compareStrings_1_1 && !compareStrings_1_1.done && (_a = compareStrings_1.return)) _a.call(compareStrings_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return undefined;
        };
        Cursor.prototype.exec = function (input) {
            var regExp = new RegExp(input);
            var regExpFlags = regExp.flags.indexOf('g') !== -1
                ? regExp.flags
                : regExp.flags + 'g';
            var newRegExp = new RegExp(regExp.source, regExpFlags);
            newRegExp.lastIndex = this.index;
            return newRegExp.exec(this.doc);
        };
        Cursor.prototype.isEof = function () {
            return this.index >= this.endIndex();
        };
        Cursor.prototype.setEndIndex = function (index) {
            if (index <= this.endIndex()) {
                if (index < 0) {
                    return this.clone({
                        end: 0
                    });
                }
                return this.clone({
                    end: index
                });
            }
            return this.clone();
        };
        Cursor.prototype.takeUntil = function (cursorOrIndex) {
            if (typeof cursorOrIndex === 'number') {
                return this.doc.substring(this.index, cursorOrIndex);
            }
            return this.doc.substring(this.index, cursorOrIndex.index);
        };
        Cursor.prototype.isAt = function (cursorOrIndex) {
            var index = typeof cursorOrIndex === 'number'
                ? cursorOrIndex
                : cursorOrIndex.index;
            return this.index === index;
        };
        Cursor.prototype.printDebug = function (_a) {
            var label = (_a === void 0 ? {} : _a).label;
            var loc = this.getLoc();
            var padLength = (loc.line + 1).toString().length;
            var lines = [];
            for (var i = -1; i < 2; ++i) {
                var lineNumber = loc.line + i;
                var line = this.extractLine(lineNumber);
                if (line !== undefined) {
                    var outputLine = lineNumber.toString().padStart(padLength) +
                        ' | ' +
                        line;
                    lines.push(outputLine);
                    if (lineNumber === loc.line) {
                        var markerLine = ''.padStart(padLength) +
                            ' | ' +
                            ' '.repeat(loc.column - 1) +
                            '^' +
                            '\n' +
                            (label
                                ? ''.padStart(padLength) +
                                    ' | ' +
                                    ' '.repeat(loc.column - 1) +
                                    label
                                : '');
                        lines.push(markerLine);
                    }
                }
            }
            return lines.join('\n');
        };
        return Cursor;
    }());

    function parseLabel(cursor) {
        if (cursor.startsWith('(')) {
            cursor.next(1);
            var marker = cursor.clone();
            while (!cursor.startsWith(')') && !cursor.isEof()) {
                cursor.next(1);
            }
            var label = marker.takeUntil(cursor);
            cursor.next(1);
            return label;
        }
        return '';
    }

    var CaptureBuffer = /** @class */ (function () {
        function CaptureBuffer() {
            this.indexes = [];
        }
        CaptureBuffer.prototype.add = function (label, index) {
            this.indexes.push([label, index]);
        };
        CaptureBuffer.prototype.toCaptureResult = function (doc) {
            return new CaptureResult(doc, this.indexes.sort(function (a, b) { return a[1] - b[1]; }));
        };
        return CaptureBuffer;
    }());
    var CaptureResult = /** @class */ (function () {
        function CaptureResult(doc, indexes) {
            if (indexes === void 0) { indexes = []; }
            this.doc = doc;
            this.indexes = indexes;
        }
        CaptureResult.prototype.toMap = function () {
            var e_1, _a;
            var result = {};
            var indexes = this.indexes;
            var doc = this.doc;
            try {
                for (var indexes_1 = __values(indexes), indexes_1_1 = indexes_1.next(); !indexes_1_1.done; indexes_1_1 = indexes_1.next()) {
                    var _b = __read(indexes_1_1.value, 2), label = _b[0], index = _b[1];
                    result[label] = new Cursor({
                        doc: doc,
                        index: index
                    });
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (indexes_1_1 && !indexes_1_1.done && (_a = indexes_1.return)) _a.call(indexes_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return result;
        };
        CaptureResult.prototype.toArray = function () {
            var doc = this.doc;
            return this.indexes.map(function (_a) {
                var _b = __read(_a, 2), index = _b[1];
                return new Cursor({
                    doc: doc,
                    index: index
                });
            });
        };
        CaptureResult.prototype.toIter = function () {
            var e_2, _a;
            var cursors = [];
            var doc = this.doc;
            var indexes = this.indexes;
            try {
                for (var indexes_2 = __values(indexes), indexes_2_1 = indexes_2.next(); !indexes_2_1.done; indexes_2_1 = indexes_2.next()) {
                    var _b = __read(indexes_2_1.value, 2), index = _b[1];
                    cursors.push(new Cursor({
                        doc: doc,
                        index: index
                    }));
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (indexes_2_1 && !indexes_2_1.done && (_a = indexes_2.return)) _a.call(indexes_2);
                }
                finally { if (e_2) throw e_2.error; }
            }
            return new CaptureIterable(cursors);
        };
        CaptureResult.prototype.toPairs = function () {
            var e_3, _a;
            var pairs = [];
            var indexes = this.indexes;
            var doc = this.doc;
            var stack = [];
            var list = [];
            var _loop_1 = function (label, index) {
                var matchResult = label.match(/(start|end)\s*\((.*)\)/);
                if (matchResult) {
                    var _a = __read(matchResult, 3), prefix = _a[1], label_1 = _a[2];
                    if (prefix === 'start') {
                        list.unshift([label_1, index]);
                    }
                    else {
                        var itemIndex = list.findIndex(function (_a) {
                            var _b = __read(_a, 1), lastLabel = _b[0];
                            return lastLabel === label_1;
                        });
                        if (itemIndex !== -1) {
                            var _b = __read(list.splice(itemIndex, 1), 1), _c = __read(_b[0], 2), lastIndex = _c[1];
                            var start = new Cursor({
                                doc: doc,
                                index: lastIndex
                            });
                            var end = new Cursor({
                                doc: doc,
                                index: index
                            });
                            pairs.push({
                                label: label_1,
                                start: start,
                                end: end
                            });
                        }
                    }
                }
                else {
                    if (stack.length) {
                        var _d = __read(stack[stack.length - 1], 2), lastLabel = _d[0], lastIndex = _d[1];
                        if (label === lastLabel) {
                            var start = new Cursor({
                                doc: doc,
                                index: lastIndex
                            });
                            var end = new Cursor({
                                doc: doc,
                                index: index
                            });
                            pairs.push({
                                label: label,
                                start: start,
                                end: end
                            });
                            stack.pop();
                        }
                        else {
                            stack.push([label, index]);
                        }
                    }
                    else {
                        stack.push([label, index]);
                    }
                }
            };
            try {
                for (var indexes_3 = __values(indexes), indexes_3_1 = indexes_3.next(); !indexes_3_1.done; indexes_3_1 = indexes_3.next()) {
                    var _b = __read(indexes_3_1.value, 2), label = _b[0], index = _b[1];
                    _loop_1(label, index);
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (indexes_3_1 && !indexes_3_1.done && (_a = indexes_3.return)) _a.call(indexes_3);
                }
                finally { if (e_3) throw e_3.error; }
            }
            return pairs;
        };
        return CaptureResult;
    }());
    var CaptureIterable = /** @class */ (function () {
        function CaptureIterable(cursors) {
            if (cursors === void 0) { cursors = []; }
            this.cursors = cursors;
            this.index = 0;
        }
        CaptureIterable.prototype.next = function () {
            var value = this.cursors[this.index];
            if (value) {
                ++this.index;
            }
            return value;
        };
        CaptureIterable.prototype[Symbol.iterator] = function () {
            var _this = this;
            return {
                next: function () {
                    var value = _this.next();
                    return value
                        ? { value: value, done: false }
                        : { value: value, done: true };
                }
            };
        };
        return CaptureIterable;
    }());
    var CursorTest = /** @class */ (function () {
        function CursorTest(options) {
            this._options = options || {
                prefix: '🌵',
                noLabel: false
            };
        }
        CursorTest.prototype.config = function (testOptions) {
            this._options = __assign(__assign({}, this._options), testOptions);
        };
        CursorTest.prototype.options = function (testOptions) {
            return new CursorTest(__assign(__assign({}, this._options), testOptions));
        };
        CursorTest.prototype.capture = function (input, testOptions) {
            return this._inline(input, __assign(__assign({}, this._options), (testOptions || {})));
        };
        CursorTest.prototype.inline = function (input, testOptions) {
            return this._inline(this.trim(input), testOptions);
        };
        CursorTest.prototype._inline = function (input, testOptions) {
            var cursor = Cursor.from(input);
            var offset = 0;
            var buffer = new CaptureBuffer();
            var chunks = [];
            var _a = __assign({ prefix: '🌵', noLabel: false }, testOptions), prefix = _a.prefix, noLabel = _a.noLabel;
            var prefixLen = prefix.length;
            var marker = cursor.clone();
            while (!cursor.isEof()) {
                if (cursor.startsWith(prefix)) {
                    var captureIndex = cursor.index - offset;
                    chunks.push(marker.takeUntil(cursor));
                    marker.moveTo(cursor);
                    cursor.next(prefixLen);
                    if (!noLabel) {
                        var label = parseLabel(cursor);
                        switch (label) {
                            case 'iter':
                            case '':
                                buffer.add('none', captureIndex);
                                break;
                            case 'symbol':
                                chunks.push(prefix);
                                break;
                            default:
                                buffer.add(label, captureIndex);
                                break;
                        }
                    }
                    else {
                        buffer.add('none', captureIndex);
                    }
                    offset += cursor.index - marker.index;
                    marker.moveTo(cursor);
                }
                else {
                    cursor.next(1);
                }
            }
            chunks.push(marker.takeUntil(cursor));
            var doc = chunks.join('');
            return buffer.toCaptureResult(doc);
        };
        CursorTest.prototype.block = function (input, _testOptions) {
            var cursor = Cursor.from(input);
            var chunks = [];
            var buffer = new CaptureBuffer();
            var offset = 0;
            var lineLen = 0;
            while (!cursor.isEof()) {
                var regexpArray = cursor.exec(/^[ \t]*([0-9]+)?[ \t]*\|[ \t](.*?)$/m);
                if (regexpArray) {
                    var lineNumber = regexpArray[1];
                    var line = regexpArray[2] + '\n';
                    if (lineNumber) {
                        offset += lineLen;
                        chunks.push(line);
                        lineLen = line.length;
                    }
                    else {
                        if (!line.match(/\s*\^/)) {
                            var matchResult = line.match(/([\s|]*)(.*)/);
                            if (matchResult) {
                                var index = offset + matchResult[1].length;
                                var label = matchResult[2].trim();
                                buffer.add(label, index);
                            }
                        }
                    }
                    cursor.setIndex(regexpArray.index + regexpArray[0].length);
                }
                else {
                    cursor.next(1);
                }
            }
            return buffer.toCaptureResult(chunks.join(''));
        };
        CursorTest.prototype.trim = function (input) {
            return input
                .replace(/^[ \t]*?\r?\n/, '')
                .replace(/\r?\n[ \t]*?$/, '');
        };
        return CursorTest;
    }());
    var t = new CursorTest();

    exports.CaptureBuffer = CaptureBuffer;
    exports.CaptureIterable = CaptureIterable;
    exports.CaptureResult = CaptureResult;
    exports.Cursor = Cursor;
    exports.CursorTest = CursorTest;
    exports.Eol = Eol;
    exports.Loc = Loc;
    exports.t = t;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
