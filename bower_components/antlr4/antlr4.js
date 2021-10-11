(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.antlr4 = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const {Token} = require('./Token');
const Lexer = require('./Lexer');
const {Interval} = require('./IntervalSet');

// this is just to keep meaningful parameter types to Parser
class TokenStream {}

/**
 * This implementation of {@link TokenStream} loads tokens from a
 * {@link TokenSource} on-demand, and places the tokens in a buffer to provide
 * access to any previous token by index.
 *
 * <p>
 * This token stream ignores the value of {@link Token//getChannel}. If your
 * parser requires the token stream filter tokens to only those on a particular
 * channel, such as {@link Token//DEFAULT_CHANNEL} or
 * {@link Token//HIDDEN_CHANNEL}, use a filtering token stream such a
 * {@link CommonTokenStream}.</p>
 */
class BufferedTokenStream extends TokenStream {
	constructor(tokenSource) {

		super();
		// The {@link TokenSource} from which tokens for this stream are fetched.
		this.tokenSource = tokenSource;
		/**
		 * A collection of all tokens fetched from the token source. The list is
		 * considered a complete view of the input once {@link //fetchedEOF} is set
		 * to {@code true}.
		 */
		this.tokens = [];

		/**
		 * The index into {@link //tokens} of the current token (next token to
		 * {@link //consume}). {@link //tokens}{@code [}{@link //p}{@code ]} should
		 * be
		 * {@link //LT LT(1)}.
		 *
		 * <p>This field is set to -1 when the stream is first constructed or when
		 * {@link //setTokenSource} is called, indicating that the first token has
		 * not yet been fetched from the token source. For additional information,
		 * see the documentation of {@link IntStream} for a description of
		 * Initializing Methods.</p>
		 */
		this.index = -1;

		/**
		 * Indicates whether the {@link Token//EOF} token has been fetched from
		 * {@link //tokenSource} and added to {@link //tokens}. This field improves
		 * performance for the following cases:
		 *
		 * <ul>
		 * <li>{@link //consume}: The lookahead check in {@link //consume} to
		 * prevent
		 * consuming the EOF symbol is optimized by checking the values of
		 * {@link //fetchedEOF} and {@link //p} instead of calling {@link
		 * //LA}.</li>
		 * <li>{@link //fetch}: The check to prevent adding multiple EOF symbols
		 * into
		 * {@link //tokens} is trivial with this field.</li>
		 * <ul>
		 */
		this.fetchedEOF = false;
	}

	mark() {
		return 0;
	}

	release(marker) {
		// no resources to release
	}

	reset() {
		this.seek(0);
	}

	seek(index) {
		this.lazyInit();
		this.index = this.adjustSeekIndex(index);
	}

	get(index) {
		this.lazyInit();
		return this.tokens[index];
	}

	consume() {
		let skipEofCheck = false;
		if (this.index >= 0) {
			if (this.fetchedEOF) {
				// the last token in tokens is EOF. skip check if p indexes any
				// fetched token except the last.
				skipEofCheck = this.index < this.tokens.length - 1;
			} else {
				// no EOF token in tokens. skip check if p indexes a fetched token.
				skipEofCheck = this.index < this.tokens.length;
			}
		} else {
			// not yet initialized
			skipEofCheck = false;
		}
		if (!skipEofCheck && this.LA(1) === Token.EOF) {
			throw "cannot consume EOF";
		}
		if (this.sync(this.index + 1)) {
			this.index = this.adjustSeekIndex(this.index + 1);
		}
	}

	/**
	 * Make sure index {@code i} in tokens has a token.
	 *
	 * @return {Boolean} {@code true} if a token is located at index {@code i}, otherwise
	 * {@code false}.
	 * @see //get(int i)
	 */
	sync(i) {
		const n = i - this.tokens.length + 1; // how many more elements we need?
		if (n > 0) {
			const fetched = this.fetch(n);
			return fetched >= n;
		}
		return true;
	}

	/**
	 * Add {@code n} elements to buffer.
	 *
	 * @return {Number} The actual number of elements added to the buffer.
	 */
	fetch(n) {
		if (this.fetchedEOF) {
			return 0;
		}
		for (let i = 0; i < n; i++) {
			const t = this.tokenSource.nextToken();
			t.tokenIndex = this.tokens.length;
			this.tokens.push(t);
			if (t.type === Token.EOF) {
				this.fetchedEOF = true;
				return i + 1;
			}
		}
		return n;
	}

// Get all tokens from start..stop inclusively///
	getTokens(start, stop, types) {
		if (types === undefined) {
			types = null;
		}
		if (start < 0 || stop < 0) {
			return null;
		}
		this.lazyInit();
		const subset = [];
		if (stop >= this.tokens.length) {
			stop = this.tokens.length - 1;
		}
		for (let i = start; i < stop; i++) {
			const t = this.tokens[i];
			if (t.type === Token.EOF) {
				break;
			}
			if (types === null || types.contains(t.type)) {
				subset.push(t);
			}
		}
		return subset;
	}

	LA(i) {
		return this.LT(i).type;
	}

	LB(k) {
		if (this.index - k < 0) {
			return null;
		}
		return this.tokens[this.index - k];
	}

	LT(k) {
		this.lazyInit();
		if (k === 0) {
			return null;
		}
		if (k < 0) {
			return this.LB(-k);
		}
		const i = this.index + k - 1;
		this.sync(i);
		if (i >= this.tokens.length) { // return EOF token
			// EOF must be last token
			return this.tokens[this.tokens.length - 1];
		}
		return this.tokens[i];
	}

	/**
	 * Allowed derived classes to modify the behavior of operations which change
	 * the current stream position by adjusting the target token index of a seek
	 * operation. The default implementation simply returns {@code i}. If an
	 * exception is thrown in this method, the current stream index should not be
	 * changed.
	 *
	 * <p>For example, {@link CommonTokenStream} overrides this method to ensure
	 * that
	 * the seek target is always an on-channel token.</p>
	 *
	 * @param {Number} i The target token index.
	 * @return {Number} The adjusted target token index.
	 */
	adjustSeekIndex(i) {
		return i;
	}

	lazyInit() {
		if (this.index === -1) {
			this.setup();
		}
	}

	setup() {
		this.sync(0);
		this.index = this.adjustSeekIndex(0);
	}

// Reset this token stream by setting its token source.///
	setTokenSource(tokenSource) {
		this.tokenSource = tokenSource;
		this.tokens = [];
		this.index = -1;
		this.fetchedEOF = false;
	}

	/**
	 * Given a starting index, return the index of the next token on channel.
	 * Return i if tokens[i] is on channel. Return -1 if there are no tokens
	 * on channel between i and EOF.
	 */
	nextTokenOnChannel(i, channel) {
		this.sync(i);
		if (i >= this.tokens.length) {
			return -1;
		}
		let token = this.tokens[i];
		while (token.channel !== this.channel) {
			if (token.type === Token.EOF) {
				return -1;
			}
			i += 1;
			this.sync(i);
			token = this.tokens[i];
		}
		return i;
	}

	/**
	 * Given a starting index, return the index of the previous token on channel.
	 * Return i if tokens[i] is on channel. Return -1 if there are no tokens
	 * on channel between i and 0.
	 */
	previousTokenOnChannel(i, channel) {
		while (i >= 0 && this.tokens[i].channel !== channel) {
			i -= 1;
		}
		return i;
	}

	/**
	 * Collect all tokens on specified channel to the right of
	 * the current token up until we see a token on DEFAULT_TOKEN_CHANNEL or
	 * EOF. If channel is -1, find any non default channel token.
	 */
	getHiddenTokensToRight(tokenIndex,
			channel) {
		if (channel === undefined) {
			channel = -1;
		}
		this.lazyInit();
		if (tokenIndex < 0 || tokenIndex >= this.tokens.length) {
			throw "" + tokenIndex + " not in 0.." + this.tokens.length - 1;
		}
		const nextOnChannel = this.nextTokenOnChannel(tokenIndex + 1, Lexer.DEFAULT_TOKEN_CHANNEL);
		const from_ = tokenIndex + 1;
		// if none onchannel to right, nextOnChannel=-1 so set to = last token
		const to = nextOnChannel === -1 ? this.tokens.length - 1 : nextOnChannel;
		return this.filterForChannel(from_, to, channel);
	}

	/**
	 * Collect all tokens on specified channel to the left of
	 * the current token up until we see a token on DEFAULT_TOKEN_CHANNEL.
	 * If channel is -1, find any non default channel token.
	 */
	getHiddenTokensToLeft(tokenIndex,
			channel) {
		if (channel === undefined) {
			channel = -1;
		}
		this.lazyInit();
		if (tokenIndex < 0 || tokenIndex >= this.tokens.length) {
			throw "" + tokenIndex + " not in 0.." + this.tokens.length - 1;
		}
		const prevOnChannel = this.previousTokenOnChannel(tokenIndex - 1, Lexer.DEFAULT_TOKEN_CHANNEL);
		if (prevOnChannel === tokenIndex - 1) {
			return null;
		}
		// if none on channel to left, prevOnChannel=-1 then from=0
		const from_ = prevOnChannel + 1;
		const to = tokenIndex - 1;
		return this.filterForChannel(from_, to, channel);
	}

	filterForChannel(left, right, channel) {
		const hidden = [];
		for (let i = left; i < right + 1; i++) {
			const t = this.tokens[i];
			if (channel === -1) {
				if (t.channel !== Lexer.DEFAULT_TOKEN_CHANNEL) {
					hidden.push(t);
				}
			} else if (t.channel === channel) {
				hidden.push(t);
			}
		}
		if (hidden.length === 0) {
			return null;
		}
		return hidden;
	}

	getSourceName() {
		return this.tokenSource.getSourceName();
	}

// Get the text of all tokens in this buffer.///
	getText(interval) {
		this.lazyInit();
		this.fill();
		if (interval === undefined || interval === null) {
			interval = new Interval(0, this.tokens.length - 1);
		}
		let start = interval.start;
		if (start instanceof Token) {
			start = start.tokenIndex;
		}
		let stop = interval.stop;
		if (stop instanceof Token) {
			stop = stop.tokenIndex;
		}
		if (start === null || stop === null || start < 0 || stop < 0) {
			return "";
		}
		if (stop >= this.tokens.length) {
			stop = this.tokens.length - 1;
		}
		let s = "";
		for (let i = start; i < stop + 1; i++) {
			const t = this.tokens[i];
			if (t.type === Token.EOF) {
				break;
			}
			s = s + t.text;
		}
		return s;
	}

// Get all tokens from lexer until EOF///
	fill() {
		this.lazyInit();
		while (this.fetch(1000) === 1000) {
			continue;
		}
	}
}


module.exports = BufferedTokenStream;

},{"./IntervalSet":7,"./Lexer":9,"./Token":15}],2:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const InputStream = require('./InputStream');
const fs = require("fs");

/**
 * Utility functions to create InputStreams from various sources.
 *
 * All returned InputStreams support the full range of Unicode
 * up to U+10FFFF (the default behavior of InputStream only supports
 * code points up to U+FFFF).
 */
const CharStreams = {
  // Creates an InputStream from a string.
  fromString: function(str) {
    return new InputStream(str, true);
  },

  /**
   * Asynchronously creates an InputStream from a blob given the
   * encoding of the bytes in that blob (defaults to 'utf8' if
   * encoding is null).
   *
   * Invokes onLoad(result) on success, onError(error) on
   * failure.
   */
  fromBlob: function(blob, encoding, onLoad, onError) {
    const reader = new window.FileReader();
    reader.onload = function(e) {
      const is = new InputStream(e.target.result, true);
      onLoad(is);
    };
    reader.onerror = onError;
    reader.readAsText(blob, encoding);
  },

  /**
   * Creates an InputStream from a Buffer given the
   * encoding of the bytes in that buffer (defaults to 'utf8' if
   * encoding is null).
   */
  fromBuffer: function(buffer, encoding) {
    return new InputStream(buffer.toString(encoding), true);
  },

  /** Asynchronously creates an InputStream from a file on disk given
   * the encoding of the bytes in that file (defaults to 'utf8' if
   * encoding is null).
   *
   * Invokes callback(error, result) on completion.
   */
  fromPath: function(path, encoding, callback) {
    fs.readFile(path, encoding, function(err, data) {
      let is = null;
      if (data !== null) {
        is = new InputStream(data, true);
      }
      callback(err, is);
    });
  },

  /**
   * Synchronously creates an InputStream given a path to a file
   * on disk and the encoding of the bytes in that file (defaults to
   * 'utf8' if encoding is null).
   */
  fromPathSync: function(path, encoding) {
    const data = fs.readFileSync(path, encoding);
    return new InputStream(data, true);
  }
};

module.exports = CharStreams;

},{"./InputStream":6,"fs":48}],3:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const CommonToken = require('./Token').CommonToken;

class TokenFactory {}

/**
 * This default implementation of {@link TokenFactory} creates
 * {@link CommonToken} objects.
 */
class CommonTokenFactory extends TokenFactory {
    constructor(copyText) {
        super();
        /**
         * Indicates whether {@link CommonToken//setText} should be called after
         * constructing tokens to explicitly set the text. This is useful for cases
         * where the input stream might not be able to provide arbitrary substrings
         * of text from the input after the lexer creates a token (e.g. the
         * implementation of {@link CharStream//getText} in
         * {@link UnbufferedCharStream} throws an
         * {@link UnsupportedOperationException}). Explicitly setting the token text
         * allows {@link Token//getText} to be called at any time regardless of the
         * input stream implementation.
         *
         * <p>
         * The default value is {@code false} to avoid the performance and memory
         * overhead of copying text for every token unless explicitly requested.</p>
         */
        this.copyText = copyText===undefined ? false : copyText;
    }

    create(source, type, text, channel, start, stop, line, column) {
        const t = new CommonToken(source, type, channel, start, stop);
        t.line = line;
        t.column = column;
        if (text !==null) {
            t.text = text;
        } else if (this.copyText && source[1] !==null) {
            t.text = source[1].getText(start,stop);
        }
        return t;
    }

    createThin(type, text) {
        const t = new CommonToken(null, type);
        t.text = text;
        return t;
    }
}

/**
 * The default {@link CommonTokenFactory} instance.
 *
 * <p>
 * This token factory does not explicitly copy token text when constructing
 * tokens.</p>
 */
CommonTokenFactory.DEFAULT = new CommonTokenFactory();

module.exports = CommonTokenFactory;

},{"./Token":15}],4:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */


const Token = require('./Token').Token;
const BufferedTokenStream = require('./BufferedTokenStream');

/**
 * This class extends {@link BufferedTokenStream} with functionality to filter
 * token streams to tokens on a particular channel (tokens where
 * {@link Token//getChannel} returns a particular value).
 *
 * <p>
 * This token stream provides access to all tokens by index or when calling
 * methods like {@link //getText}. The channel filtering is only used for code
 * accessing tokens via the lookahead methods {@link //LA}, {@link //LT}, and
 * {@link //LB}.</p>
 *
 * <p>
 * By default, tokens are placed on the default channel
 * ({@link Token//DEFAULT_CHANNEL}), but may be reassigned by using the
 * {@code ->channel(HIDDEN)} lexer command, or by using an embedded action to
 * call {@link Lexer//setChannel}.
 * </p>
 *
 * <p>
 * Note: lexer rules which use the {@code ->skip} lexer command or call
 * {@link Lexer//skip} do not produce tokens at all, so input text matched by
 * such a rule will not be available as part of the token stream, regardless of
 * channel.</p>
 */
class CommonTokenStream extends BufferedTokenStream {
    constructor(lexer, channel) {
        super(lexer);
        this.channel = channel===undefined ? Token.DEFAULT_CHANNEL : channel;
    }

    adjustSeekIndex(i) {
        return this.nextTokenOnChannel(i, this.channel);
    }

    LB(k) {
        if (k===0 || this.index-k<0) {
            return null;
        }
        let i = this.index;
        let n = 1;
        // find k good tokens looking backwards
        while (n <= k) {
            // skip off-channel tokens
            i = this.previousTokenOnChannel(i - 1, this.channel);
            n += 1;
        }
        if (i < 0) {
            return null;
        }
        return this.tokens[i];
    }

    LT(k) {
        this.lazyInit();
        if (k === 0) {
            return null;
        }
        if (k < 0) {
            return this.LB(-k);
        }
        let i = this.index;
        let n = 1; // we know tokens[pos] is a good one
        // find k good tokens
        while (n < k) {
            // skip off-channel tokens, but make sure to not look past EOF
            if (this.sync(i + 1)) {
                i = this.nextTokenOnChannel(i + 1, this.channel);
            }
            n += 1;
        }
        return this.tokens[i];
    }

    // Count EOF just once.
    getNumberOfOnChannelTokens() {
        let n = 0;
        this.fill();
        for (let i =0; i< this.tokens.length;i++) {
            const t = this.tokens[i];
            if( t.channel===this.channel) {
                n += 1;
            }
            if( t.type===Token.EOF) {
                break;
            }
        }
        return n;
    }
}

module.exports = CommonTokenStream;

},{"./BufferedTokenStream":1,"./Token":15}],5:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const InputStream = require('./InputStream');
const fs = require("fs");

/**
 * This is an InputStream that is loaded from a file all at once
 * when you construct the object.
 */
class FileStream extends InputStream {
	constructor(fileName, decodeToUnicodeCodePoints) {
		const data = fs.readFileSync(fileName, "utf8");
		super(data, decodeToUnicodeCodePoints);
		this.fileName = fileName;
	}
}

module.exports = FileStream

},{"./InputStream":6,"fs":48}],6:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const {Token} = require('./Token');
require('./polyfills/codepointat');
require('./polyfills/fromcodepoint');

/**
 * If decodeToUnicodeCodePoints is true, the input is treated
 * as a series of Unicode code points.
 *
 * Otherwise, the input is treated as a series of 16-bit UTF-16 code
 * units.
 */
class InputStream {
	constructor(data, decodeToUnicodeCodePoints) {
		this.name = "<empty>";
		this.strdata = data;
		this.decodeToUnicodeCodePoints = decodeToUnicodeCodePoints || false;
		// _loadString - Vacuum all input from a string and then treat it like a buffer.
		this._index = 0;
		this.data = [];
		if (this.decodeToUnicodeCodePoints) {
			for (let i = 0; i < this.strdata.length; ) {
				const codePoint = this.strdata.codePointAt(i);
				this.data.push(codePoint);
				i += codePoint <= 0xFFFF ? 1 : 2;
			}
		} else {
			for (let i = 0; i < this.strdata.length; i++) {
				const codeUnit = this.strdata.charCodeAt(i);
				this.data.push(codeUnit);
			}
		}
		this._size = this.data.length;
	}

	/**
	 * Reset the stream so that it's in the same state it was
	 * when the object was created *except* the data array is not
	 * touched.
	 */
	reset() {
		this._index = 0;
	}

	consume() {
		if (this._index >= this._size) {
			// assert this.LA(1) == Token.EOF
			throw ("cannot consume EOF");
		}
		this._index += 1;
	}

	LA(offset) {
		if (offset === 0) {
			return 0; // undefined
		}
		if (offset < 0) {
			offset += 1; // e.g., translate LA(-1) to use offset=0
		}
		const pos = this._index + offset - 1;
		if (pos < 0 || pos >= this._size) { // invalid
			return Token.EOF;
		}
		return this.data[pos];
	}

	LT(offset) {
		return this.LA(offset);
	}

// mark/release do nothing; we have entire buffer
	mark() {
		return -1;
	}

	release(marker) {
	}

	/**
	 * consume() ahead until p==_index; can't just set p=_index as we must
	 * update line and column. If we seek backwards, just set p
	 */
	seek(_index) {
		if (_index <= this._index) {
			this._index = _index; // just jump; don't update stream state (line,
									// ...)
			return;
		}
		// seek forward
		this._index = Math.min(_index, this._size);
	}

	getText(start, stop) {
		if (stop >= this._size) {
			stop = this._size - 1;
		}
		if (start >= this._size) {
			return "";
		} else {
			if (this.decodeToUnicodeCodePoints) {
				let result = "";
				for (let i = start; i <= stop; i++) {
					result += String.fromCodePoint(this.data[i]);
				}
				return result;
			} else {
				return this.strdata.slice(start, stop + 1);
			}
		}
	}

	toString() {
		return this.strdata;
	}

	get index(){
		return this._index;
	}

	get size(){
		return this._size;
	}
}


module.exports = InputStream;

},{"./Token":15,"./polyfills/codepointat":43,"./polyfills/fromcodepoint":44}],7:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const {Token} = require('./Token');

/* stop is not included! */
class Interval {
	constructor(start, stop) {
		this.start = start;
		this.stop = stop;
	}

	contains(item) {
		return item >= this.start && item < this.stop;
	}

	toString() {
		if(this.start===this.stop-1) {
			return this.start.toString();
		} else {
			return this.start.toString() + ".." + (this.stop-1).toString();
		}
	}

	get length(){
		return this.stop - this.start;
	}
}


class IntervalSet {
	constructor() {
		this.intervals = null;
		this.readOnly = false;
	}

	first(v) {
		if (this.intervals === null || this.intervals.length===0) {
			return Token.INVALID_TYPE;
		} else {
			return this.intervals[0].start;
		}
	}

	addOne(v) {
		this.addInterval(new Interval(v, v + 1));
	}

	addRange(l, h) {
		this.addInterval(new Interval(l, h + 1));
	}

	addInterval(toAdd) {
		if (this.intervals === null) {
			this.intervals = [];
			this.intervals.push(toAdd);
		} else {
			// find insert pos
			for (let pos = 0; pos < this.intervals.length; pos++) {
				const existing = this.intervals[pos];
				// distinct range -> insert
				if (toAdd.stop < existing.start) {
					this.intervals.splice(pos, 0, toAdd);
					return;
				}
				// contiguous range -> adjust
				else if (toAdd.stop === existing.start) {
					this.intervals[pos].start = toAdd.start;
					return;
				}
				// overlapping range -> adjust and reduce
				else if (toAdd.start <= existing.stop) {
					this.intervals[pos] = new Interval(Math.min(existing.start, toAdd.start), Math.max(existing.stop, toAdd.stop));
					this.reduce(pos);
					return;
				}
			}
			// greater than any existing
			this.intervals.push(toAdd);
		}
	}

	addSet(other) {
		if (other.intervals !== null) {
			other.intervals.forEach( toAdd => this.addInterval(toAdd), this);
		}
		return this;
	}

	reduce(pos) {
		// only need to reduce if pos is not the last
		if (pos < this.intervals.length - 1) {
			const current = this.intervals[pos];
			const next = this.intervals[pos + 1];
			// if next contained in current
			if (current.stop >= next.stop) {
				this.intervals.splice(pos + 1, 1);
				this.reduce(pos);
			} else if (current.stop >= next.start) {
				this.intervals[pos] = new Interval(current.start, next.stop);
				this.intervals.splice(pos + 1, 1);
			}
		}
	}

	complement(start, stop) {
		const result = new IntervalSet();
		result.addInterval(new Interval(start,stop+1));
		if(this.intervals !== null)
			this.intervals.forEach(toRemove => result.removeRange(toRemove));
		return result;
	}

	contains(item) {
		if (this.intervals === null) {
			return false;
		} else {
			for (let k = 0; k < this.intervals.length; k++) {
				if(this.intervals[k].contains(item)) {
					return true;
				}
			}
			return false;
		}
	}

	removeRange(toRemove) {
		if(toRemove.start===toRemove.stop-1) {
			this.removeOne(toRemove.start);
		} else if (this.intervals !== null) {
			let pos = 0;
			for(let n=0; n<this.intervals.length; n++) {
				const existing = this.intervals[pos];
				// intervals are ordered
				if (toRemove.stop<=existing.start) {
					return;
				}
				// check for including range, split it
				else if(toRemove.start>existing.start && toRemove.stop<existing.stop) {
					this.intervals[pos] = new Interval(existing.start, toRemove.start);
					const x = new Interval(toRemove.stop, existing.stop);
					this.intervals.splice(pos, 0, x);
					return;
				}
				// check for included range, remove it
				else if(toRemove.start<=existing.start && toRemove.stop>=existing.stop) {
					this.intervals.splice(pos, 1);
					pos = pos - 1; // need another pass
				}
				// check for lower boundary
				else if(toRemove.start<existing.stop) {
					this.intervals[pos] = new Interval(existing.start, toRemove.start);
				}
				// check for upper boundary
				else if(toRemove.stop<existing.stop) {
					this.intervals[pos] = new Interval(toRemove.stop, existing.stop);
				}
				pos += 1;
			}
		}
	}

	removeOne(value) {
		if (this.intervals !== null) {
			for (let i = 0; i < this.intervals.length; i++) {
				const existing = this.intervals[i];
				// intervals are ordered
				if (value < existing.start) {
					return;
				}
				// check for single value range
				else if (value === existing.start && value === existing.stop - 1) {
					this.intervals.splice(i, 1);
					return;
				}
				// check for lower boundary
				else if (value === existing.start) {
					this.intervals[i] = new Interval(existing.start + 1, existing.stop);
					return;
				}
				// check for upper boundary
				else if (value === existing.stop - 1) {
					this.intervals[i] = new Interval(existing.start, existing.stop - 1);
					return;
				}
				// split existing range
				else if (value < existing.stop - 1) {
					const replace = new Interval(existing.start, value);
					existing.start = value + 1;
					this.intervals.splice(i, 0, replace);
					return;
				}
			}
		}
	}

	toString(literalNames, symbolicNames, elemsAreChar) {
		literalNames = literalNames || null;
		symbolicNames = symbolicNames || null;
		elemsAreChar = elemsAreChar || false;
		if (this.intervals === null) {
			return "{}";
		} else if(literalNames!==null || symbolicNames!==null) {
			return this.toTokenString(literalNames, symbolicNames);
		} else if(elemsAreChar) {
			return this.toCharString();
		} else {
			return this.toIndexString();
		}
	}

	toCharString() {
		const names = [];
		for (let i = 0; i < this.intervals.length; i++) {
			const existing = this.intervals[i];
			if(existing.stop===existing.start+1) {
				if ( existing.start===Token.EOF ) {
					names.push("<EOF>");
				} else {
					names.push("'" + String.fromCharCode(existing.start) + "'");
				}
			} else {
				names.push("'" + String.fromCharCode(existing.start) + "'..'" + String.fromCharCode(existing.stop-1) + "'");
			}
		}
		if (names.length > 1) {
			return "{" + names.join(", ") + "}";
		} else {
			return names[0];
		}
	}

	toIndexString() {
		const names = [];
		for (let i = 0; i < this.intervals.length; i++) {
			const existing = this.intervals[i];
			if(existing.stop===existing.start+1) {
				if ( existing.start===Token.EOF ) {
					names.push("<EOF>");
				} else {
					names.push(existing.start.toString());
				}
			} else {
				names.push(existing.start.toString() + ".." + (existing.stop-1).toString());
			}
		}
		if (names.length > 1) {
			return "{" + names.join(", ") + "}";
		} else {
			return names[0];
		}
	}

	toTokenString(literalNames, symbolicNames) {
		const names = [];
		for (let i = 0; i < this.intervals.length; i++) {
			const existing = this.intervals[i];
			for (let j = existing.start; j < existing.stop; j++) {
				names.push(this.elementName(literalNames, symbolicNames, j));
			}
		}
		if (names.length > 1) {
			return "{" + names.join(", ") + "}";
		} else {
			return names[0];
		}
	}

	elementName(literalNames, symbolicNames, token) {
		if (token === Token.EOF) {
			return "<EOF>";
		} else if (token === Token.EPSILON) {
			return "<EPSILON>";
		} else {
			return literalNames[token] || symbolicNames[token];
		}
	}

	get length(){
		return this.intervals.map( interval => interval.length ).reduce((acc, val) => acc + val);
	}
}

module.exports = {
	Interval,
	IntervalSet
};

},{"./Token":15}],8:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const {Set, BitSet} = require('./Utils');
const {Token} = require('./Token');
const {ATNConfig} = require('./atn/ATNConfig');
const {IntervalSet} = require('./IntervalSet');
const {RuleStopState} = require('./atn/ATNState');
const {RuleTransition, NotSetTransition, WildcardTransition, AbstractPredicateTransition} = require('./atn/Transition');
const {predictionContextFromRuleContext, PredictionContext, SingletonPredictionContext} = require('./PredictionContext');

class LL1Analyzer {
    constructor(atn) {
        this.atn = atn;
    }

    /**
     * Calculates the SLL(1) expected lookahead set for each outgoing transition
     * of an {@link ATNState}. The returned array has one element for each
     * outgoing transition in {@code s}. If the closure from transition
     * <em>i</em> leads to a semantic predicate before matching a symbol, the
     * element at index <em>i</em> of the result will be {@code null}.
     *
     * @param s the ATN state
     * @return the expected symbols for each outgoing transition of {@code s}.
     */
    getDecisionLookahead(s) {
        if (s === null) {
            return null;
        }
        const count = s.transitions.length;
        const look = [];
        for(let alt=0; alt< count; alt++) {
            look[alt] = new IntervalSet();
            const lookBusy = new Set();
            const seeThruPreds = false; // fail to get lookahead upon pred
            this._LOOK(s.transition(alt).target, null, PredictionContext.EMPTY,
                  look[alt], lookBusy, new BitSet(), seeThruPreds, false);
            // Wipe out lookahead for this alternative if we found nothing
            // or we had a predicate when we !seeThruPreds
            if (look[alt].length===0 || look[alt].contains(LL1Analyzer.HIT_PRED)) {
                look[alt] = null;
            }
        }
        return look;
    }

    /**
     * Compute set of tokens that can follow {@code s} in the ATN in the
     * specified {@code ctx}.
     *
     * <p>If {@code ctx} is {@code null} and the end of the rule containing
     * {@code s} is reached, {@link Token//EPSILON} is added to the result set.
     * If {@code ctx} is not {@code null} and the end of the outermost rule is
     * reached, {@link Token//EOF} is added to the result set.</p>
     *
     * @param s the ATN state
     * @param stopState the ATN state to stop at. This can be a
     * {@link BlockEndState} to detect epsilon paths through a closure.
     * @param ctx the complete parser context, or {@code null} if the context
     * should be ignored
     *
     * @return The set of tokens that can follow {@code s} in the ATN in the
     * specified {@code ctx}.
     */
    LOOK(s, stopState, ctx) {
        const r = new IntervalSet();
        const seeThruPreds = true; // ignore preds; get all lookahead
        ctx = ctx || null;
        const lookContext = ctx!==null ? predictionContextFromRuleContext(s.atn, ctx) : null;
        this._LOOK(s, stopState, lookContext, r, new Set(), new BitSet(), seeThruPreds, true);
        return r;
    }

    /**
     * Compute set of tokens that can follow {@code s} in the ATN in the
     * specified {@code ctx}.
     *
     * <p>If {@code ctx} is {@code null} and {@code stopState} or the end of the
     * rule containing {@code s} is reached, {@link Token//EPSILON} is added to
     * the result set. If {@code ctx} is not {@code null} and {@code addEOF} is
     * {@code true} and {@code stopState} or the end of the outermost rule is
     * reached, {@link Token//EOF} is added to the result set.</p>
     *
     * @param s the ATN state.
     * @param stopState the ATN state to stop at. This can be a
     * {@link BlockEndState} to detect epsilon paths through a closure.
     * @param ctx The outer context, or {@code null} if the outer context should
     * not be used.
     * @param look The result lookahead set.
     * @param lookBusy A set used for preventing epsilon closures in the ATN
     * from causing a stack overflow. Outside code should pass
     * {@code new Set<ATNConfig>} for this argument.
     * @param calledRuleStack A set used for preventing left recursion in the
     * ATN from causing a stack overflow. Outside code should pass
     * {@code new BitSet()} for this argument.
     * @param seeThruPreds {@code true} to true semantic predicates as
     * implicitly {@code true} and "see through them", otherwise {@code false}
     * to treat semantic predicates as opaque and add {@link //HIT_PRED} to the
     * result if one is encountered.
     * @param addEOF Add {@link Token//EOF} to the result if the end of the
     * outermost context is reached. This parameter has no effect if {@code ctx}
     * is {@code null}.
     */
    _LOOK(s, stopState , ctx, look, lookBusy, calledRuleStack, seeThruPreds, addEOF) {
        const c = new ATNConfig({state:s, alt:0, context: ctx}, null);
        if (lookBusy.contains(c)) {
            return;
        }
        lookBusy.add(c);
        if (s === stopState) {
            if (ctx ===null) {
                look.addOne(Token.EPSILON);
                return;
            } else if (ctx.isEmpty() && addEOF) {
                look.addOne(Token.EOF);
                return;
            }
        }
        if (s instanceof RuleStopState ) {
            if (ctx ===null) {
                look.addOne(Token.EPSILON);
                return;
            } else if (ctx.isEmpty() && addEOF) {
                look.addOne(Token.EOF);
                return;
            }
            if (ctx !== PredictionContext.EMPTY) {
                const removed = calledRuleStack.contains(s.ruleIndex);
                try {
                    calledRuleStack.remove(s.ruleIndex);
                    // run thru all possible stack tops in ctx
                    for (let i = 0; i < ctx.length; i++) {
                        const returnState = this.atn.states[ctx.getReturnState(i)];
                        this._LOOK(returnState, stopState, ctx.getParent(i), look, lookBusy, calledRuleStack, seeThruPreds, addEOF);
                    }
                }finally {
                    if (removed) {
                        calledRuleStack.add(s.ruleIndex);
                    }
                }
                return;
            }
        }
        for(let j=0; j<s.transitions.length; j++) {
            const t = s.transitions[j];
            if (t.constructor === RuleTransition) {
                if (calledRuleStack.contains(t.target.ruleIndex)) {
                    continue;
                }
                const newContext = SingletonPredictionContext.create(ctx, t.followState.stateNumber);
                try {
                    calledRuleStack.add(t.target.ruleIndex);
                    this._LOOK(t.target, stopState, newContext, look, lookBusy, calledRuleStack, seeThruPreds, addEOF);
                } finally {
                    calledRuleStack.remove(t.target.ruleIndex);
                }
            } else if (t instanceof AbstractPredicateTransition ) {
                if (seeThruPreds) {
                    this._LOOK(t.target, stopState, ctx, look, lookBusy, calledRuleStack, seeThruPreds, addEOF);
                } else {
                    look.addOne(LL1Analyzer.HIT_PRED);
                }
            } else if( t.isEpsilon) {
                this._LOOK(t.target, stopState, ctx, look, lookBusy, calledRuleStack, seeThruPreds, addEOF);
            } else if (t.constructor === WildcardTransition) {
                look.addRange( Token.MIN_USER_TOKEN_TYPE, this.atn.maxTokenType );
            } else {
                let set = t.label;
                if (set !== null) {
                    if (t instanceof NotSetTransition) {
                        set = set.complement(Token.MIN_USER_TOKEN_TYPE, this.atn.maxTokenType);
                    }
                    look.addSet(set);
                }
            }
        }
    }
}

/**
 * Special value added to the lookahead sets to indicate that we hit
 * a predicate during analysis if {@code seeThruPreds==false}.
 */
LL1Analyzer.HIT_PRED = Token.INVALID_TYPE;

module.exports = LL1Analyzer;


},{"./IntervalSet":7,"./PredictionContext":12,"./Token":15,"./Utils":16,"./atn/ATNConfig":18,"./atn/ATNState":23,"./atn/Transition":31}],9:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const {Token} = require('./Token');
const Recognizer = require('./Recognizer');
const CommonTokenFactory = require('./CommonTokenFactory');
const {RecognitionException} = require('./error/Errors');
const {LexerNoViableAltException} = require('./error/Errors');

class TokenSource {}

/**
 * A lexer is recognizer that draws input symbols from a character stream.
 * lexer grammars result in a subclass of this object. A Lexer object
 * uses simplified match() and error recovery mechanisms in the interest of speed.
 */
class Lexer extends Recognizer {
	constructor(input) {
		super();
		this._input = input;
		this._factory = CommonTokenFactory.DEFAULT;
		this._tokenFactorySourcePair = [ this, input ];

		this._interp = null; // child classes must populate this

		/**
		 * The goal of all lexer rules/methods is to create a token object.
		 * this is an instance variable as multiple rules may collaborate to
		 * create a single token. nextToken will return this object after
		 * matching lexer rule(s). If you subclass to allow multiple token
		 * emissions, then set this to the last token to be matched or
		 * something nonnull so that the auto token emit mechanism will not
		 * emit another token.
		 */
		this._token = null;

		/**
		 * What character index in the stream did the current token start at?
		 * Needed, for example, to get the text for current token. Set at
		 * the start of nextToken.
		 */
		this._tokenStartCharIndex = -1;

		// The line on which the first character of the token resides///
		this._tokenStartLine = -1;

		// The character position of first character within the line///
		this._tokenStartColumn = -1;

		// Once we see EOF on char stream, next token will be EOF.
		// If you have DONE : EOF ; then you see DONE EOF.
		this._hitEOF = false;

		// The channel number for the current token///
		this._channel = Token.DEFAULT_CHANNEL;

		// The token type for the current token///
		this._type = Token.INVALID_TYPE;

		this._modeStack = [];
		this._mode = Lexer.DEFAULT_MODE;

		/**
		 * You can set the text for the current token to override what is in
		 * the input char buffer. Use setText() or can set this instance var.
		 */
		this._text = null;
	}

	reset() {
		// wack Lexer state variables
		if (this._input !== null) {
			this._input.seek(0); // rewind the input
		}
		this._token = null;
		this._type = Token.INVALID_TYPE;
		this._channel = Token.DEFAULT_CHANNEL;
		this._tokenStartCharIndex = -1;
		this._tokenStartColumn = -1;
		this._tokenStartLine = -1;
		this._text = null;

		this._hitEOF = false;
		this._mode = Lexer.DEFAULT_MODE;
		this._modeStack = [];

		this._interp.reset();
	}

// Return a token from this source; i.e., match a token on the char stream.
	nextToken() {
		if (this._input === null) {
			throw "nextToken requires a non-null input stream.";
		}

		/**
		 * Mark start location in char stream so unbuffered streams are
		 * guaranteed at least have text of current token
		 */
		const tokenStartMarker = this._input.mark();
		try {
			while (true) {
				if (this._hitEOF) {
					this.emitEOF();
					return this._token;
				}
				this._token = null;
				this._channel = Token.DEFAULT_CHANNEL;
				this._tokenStartCharIndex = this._input.index;
				this._tokenStartColumn = this._interp.column;
				this._tokenStartLine = this._interp.line;
				this._text = null;
				let continueOuter = false;
				while (true) {
					this._type = Token.INVALID_TYPE;
					let ttype = Lexer.SKIP;
					try {
						ttype = this._interp.match(this._input, this._mode);
					} catch (e) {
						if(e instanceof RecognitionException) {
							this.notifyListeners(e); // report error
							this.recover(e);
						} else {
							console.log(e.stack);
							throw e;
						}
					}
					if (this._input.LA(1) === Token.EOF) {
						this._hitEOF = true;
					}
					if (this._type === Token.INVALID_TYPE) {
						this._type = ttype;
					}
					if (this._type === Lexer.SKIP) {
						continueOuter = true;
						break;
					}
					if (this._type !== Lexer.MORE) {
						break;
					}
				}
				if (continueOuter) {
					continue;
				}
				if (this._token === null) {
					this.emit();
				}
				return this._token;
			}
		} finally {
			// make sure we release marker after match or
			// unbuffered char stream will keep buffering
			this._input.release(tokenStartMarker);
		}
	}

	/**
	 * Instruct the lexer to skip creating a token for current lexer rule
	 * and look for another token. nextToken() knows to keep looking when
	 * a lexer rule finishes with token set to SKIP_TOKEN. Recall that
	 * if token==null at end of any token rule, it creates one for you
	 * and emits it.
	 */
	skip() {
		this._type = Lexer.SKIP;
	}

	more() {
		this._type = Lexer.MORE;
	}

	mode(m) {
		this._mode = m;
	}

	pushMode(m) {
		if (this._interp.debug) {
			console.log("pushMode " + m);
		}
		this._modeStack.push(this._mode);
		this.mode(m);
	}

	popMode() {
		if (this._modeStack.length === 0) {
			throw "Empty Stack";
		}
		if (this._interp.debug) {
			console.log("popMode back to " + this._modeStack.slice(0, -1));
		}
		this.mode(this._modeStack.pop());
		return this._mode;
	}

	/**
	 * By default does not support multiple emits per nextToken invocation
	 * for efficiency reasons. Subclass and override this method, nextToken,
	 * and getToken (to push tokens into a list and pull from that list
	 * rather than a single variable as this implementation does).
	 */
	emitToken(token) {
		this._token = token;
	}

	/**
	 * The standard method called to automatically emit a token at the
	 * outermost lexical rule. The token object should point into the
	 * char buffer start..stop. If there is a text override in 'text',
	 * use that to set the token's text. Override this method to emit
	 * custom Token objects or provide a new factory.
	 */
	emit() {
		const t = this._factory.create(this._tokenFactorySourcePair, this._type,
				this._text, this._channel, this._tokenStartCharIndex, this
						.getCharIndex() - 1, this._tokenStartLine,
				this._tokenStartColumn);
		this.emitToken(t);
		return t;
	}

	emitEOF() {
		const cpos = this.column;
		const lpos = this.line;
		const eof = this._factory.create(this._tokenFactorySourcePair, Token.EOF,
				null, Token.DEFAULT_CHANNEL, this._input.index,
				this._input.index - 1, lpos, cpos);
		this.emitToken(eof);
		return eof;
	}

// What is the index of the current character of lookahead?///
	getCharIndex() {
		return this._input.index;
	}

	/**
	 * Return a list of all Token objects in input char stream.
	 * Forces load of all tokens. Does not include EOF token.
	 */
	getAllTokens() {
		const tokens = [];
		let t = this.nextToken();
		while (t.type !== Token.EOF) {
			tokens.push(t);
			t = this.nextToken();
		}
		return tokens;
	}

	notifyListeners(e) {
		const start = this._tokenStartCharIndex;
		const stop = this._input.index;
		const text = this._input.getText(start, stop);
		const msg = "token recognition error at: '" + this.getErrorDisplay(text) + "'";
		const listener = this.getErrorListenerDispatch();
		listener.syntaxError(this, null, this._tokenStartLine,
				this._tokenStartColumn, msg, e);
	}

	getErrorDisplay(s) {
		const d = [];
		for (let i = 0; i < s.length; i++) {
			d.push(s[i]);
		}
		return d.join('');
	}

	getErrorDisplayForChar(c) {
		if (c.charCodeAt(0) === Token.EOF) {
			return "<EOF>";
		} else if (c === '\n') {
			return "\\n";
		} else if (c === '\t') {
			return "\\t";
		} else if (c === '\r') {
			return "\\r";
		} else {
			return c;
		}
	}

	getCharErrorDisplay(c) {
		return "'" + this.getErrorDisplayForChar(c) + "'";
	}

	/**
	 * Lexers can normally match any char in it's vocabulary after matching
	 * a token, so do the easy thing and just kill a character and hope
	 * it all works out. You can instead use the rule invocation stack
	 * to do sophisticated error recovery if you are in a fragment rule.
	 */
	recover(re) {
		if (this._input.LA(1) !== Token.EOF) {
			if (re instanceof LexerNoViableAltException) {
				// skip a char and try again
				this._interp.consume(this._input);
			} else {
				// TODO: Do we lose character or line position information?
				this._input.consume();
			}
		}
	}

	get inputStream(){
		return this._input;
	}

	set inputStream(input) {
		this._input = null;
		this._tokenFactorySourcePair = [ this, this._input ];
		this.reset();
		this._input = input;
		this._tokenFactorySourcePair = [ this, this._input ];
	}

	get sourceName(){
		return this._input.sourceName;
	}

	get type(){
		return this.type;
	}

	set type(type) {
		this._type = type;
	}

	get line(){
		return this._interp.line;
	}

	set line(line) {
		this._interp.line = line;
	}

	get column(){
		return this._interp.column;
	}

	set column(column) {
		this._interp.column = column;
	}

	get text(){
		if (this._text !== null) {
			return this._text;
		} else {
			return this._interp.getText(this._input);
		}
	}

	set text(text) {
		this._text = text;
	}
}




Lexer.DEFAULT_MODE = 0;
Lexer.MORE = -2;
Lexer.SKIP = -3;

Lexer.DEFAULT_TOKEN_CHANNEL = Token.DEFAULT_CHANNEL;
Lexer.HIDDEN = Token.HIDDEN_CHANNEL;
Lexer.MIN_CHAR_VALUE = 0x0000;
Lexer.MAX_CHAR_VALUE = 0x10FFFF;

// Set the char stream and reset the lexer


module.exports = Lexer;

},{"./CommonTokenFactory":3,"./Recognizer":13,"./Token":15,"./error/Errors":40}],10:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const {Token} = require('./Token');
const {ParseTreeListener, TerminalNode, ErrorNode} = require('./tree/Tree');
const Recognizer = require('./Recognizer');
const {DefaultErrorStrategy} = require('./error/ErrorStrategy');
const ATNDeserializer = require('./atn/ATNDeserializer');
const ATNDeserializationOptions = require('./atn/ATNDeserializationOptions');
const Lexer = require('./Lexer');

class TraceListener extends ParseTreeListener {
	constructor(parser) {
		super();
		this.parser = parser;
	}

	enterEveryRule(ctx) {
		console.log("enter   " + this.parser.ruleNames[ctx.ruleIndex] + ", LT(1)=" + this.parser._input.LT(1).text);
	}

	visitTerminal(node) {
		console.log("consume " + node.symbol + " rule " + this.parser.ruleNames[this.parser._ctx.ruleIndex]);
	}

	exitEveryRule(ctx) {
		console.log("exit    " + this.parser.ruleNames[ctx.ruleIndex] + ", LT(1)=" + this.parser._input.LT(1).text);
	}
}

class Parser extends Recognizer {
	/**
	 * this is all the parsing support code essentially; most of it is error
	 * recovery stuff.
	 */
	constructor(input) {
		super();
		// The input stream.
		this._input = null;
		/**
		 * The error handling strategy for the parser. The default value is a new
		 * instance of {@link DefaultErrorStrategy}.
		 */
		this._errHandler = new DefaultErrorStrategy();
		this._precedenceStack = [];
		this._precedenceStack.push(0);
		/**
		 * The {@link ParserRuleContext} object for the currently executing rule.
		 * this is always non-null during the parsing process.
		 */
		this._ctx = null;
		/**
		 * Specifies whether or not the parser should construct a parse tree during
		 * the parsing process. The default value is {@code true}.
		 */
		this.buildParseTrees = true;
		/**
		 * When {@link //setTrace}{@code (true)} is called, a reference to the
		 * {@link TraceListener} is stored here so it can be easily removed in a
		 * later call to {@link //setTrace}{@code (false)}. The listener itself is
		 * implemented as a parser listener so this field is not directly used by
		 * other parser methods.
		 */
		this._tracer = null;
		/**
		 * The list of {@link ParseTreeListener} listeners registered to receive
		 * events during the parse.
		 */
		this._parseListeners = null;
		/**
		 * The number of syntax errors reported during parsing. this value is
		 * incremented each time {@link //notifyErrorListeners} is called.
		 */
		this._syntaxErrors = 0;
		this.setInputStream(input);
	}

	// reset the parser's state
	reset() {
		if (this._input !== null) {
			this._input.seek(0);
		}
		this._errHandler.reset(this);
		this._ctx = null;
		this._syntaxErrors = 0;
		this.setTrace(false);
		this._precedenceStack = [];
		this._precedenceStack.push(0);
		if (this._interp !== null) {
			this._interp.reset();
		}
	}

	/**
	 * Match current input symbol against {@code ttype}. If the symbol type
	 * matches, {@link ANTLRErrorStrategy//reportMatch} and {@link //consume} are
	 * called to complete the match process.
	 *
	 * <p>If the symbol type does not match,
	 * {@link ANTLRErrorStrategy//recoverInline} is called on the current error
	 * strategy to attempt recovery. If {@link //getBuildParseTree} is
	 * {@code true} and the token index of the symbol returned by
	 * {@link ANTLRErrorStrategy//recoverInline} is -1, the symbol is added to
	 * the parse tree by calling {@link ParserRuleContext//addErrorNode}.</p>
	 *
	 * @param ttype the token type to match
	 * @return the matched symbol
	 * @throws RecognitionException if the current input symbol did not match
	 * {@code ttype} and the error strategy could not recover from the
	 * mismatched symbol
	 */
	match(ttype) {
		let t = this.getCurrentToken();
		if (t.type === ttype) {
			this._errHandler.reportMatch(this);
			this.consume();
		} else {
			t = this._errHandler.recoverInline(this);
			if (this.buildParseTrees && t.tokenIndex === -1) {
				// we must have conjured up a new token during single token
				// insertion
				// if it's not the current symbol
				this._ctx.addErrorNode(t);
			}
		}
		return t;
	}

	/**
	 * Match current input symbol as a wildcard. If the symbol type matches
	 * (i.e. has a value greater than 0), {@link ANTLRErrorStrategy//reportMatch}
	 * and {@link //consume} are called to complete the match process.
	 *
	 * <p>If the symbol type does not match,
	 * {@link ANTLRErrorStrategy//recoverInline} is called on the current error
	 * strategy to attempt recovery. If {@link //getBuildParseTree} is
	 * {@code true} and the token index of the symbol returned by
	 * {@link ANTLRErrorStrategy//recoverInline} is -1, the symbol is added to
	 * the parse tree by calling {@link ParserRuleContext//addErrorNode}.</p>
	 *
	 * @return the matched symbol
	 * @throws RecognitionException if the current input symbol did not match
	 * a wildcard and the error strategy could not recover from the mismatched
	 * symbol
	 */
	matchWildcard() {
		let t = this.getCurrentToken();
		if (t.type > 0) {
			this._errHandler.reportMatch(this);
			this.consume();
		} else {
			t = this._errHandler.recoverInline(this);
			if (this._buildParseTrees && t.tokenIndex === -1) {
				// we must have conjured up a new token during single token
				// insertion
				// if it's not the current symbol
				this._ctx.addErrorNode(t);
			}
		}
		return t;
	}

	getParseListeners() {
		return this._parseListeners || [];
	}

	/**
	 * Registers {@code listener} to receive events during the parsing process.
	 *
	 * <p>To support output-preserving grammar transformations (including but not
	 * limited to left-recursion removal, automated left-factoring, and
	 * optimized code generation), calls to listener methods during the parse
	 * may differ substantially from calls made by
	 * {@link ParseTreeWalker//DEFAULT} used after the parse is complete. In
	 * particular, rule entry and exit events may occur in a different order
	 * during the parse than after the parser. In addition, calls to certain
	 * rule entry methods may be omitted.</p>
	 *
	 * <p>With the following specific exceptions, calls to listener events are
	 * <em>deterministic</em>, i.e. for identical input the calls to listener
	 * methods will be the same.</p>
	 *
	 * <ul>
	 * <li>Alterations to the grammar used to generate code may change the
	 * behavior of the listener calls.</li>
	 * <li>Alterations to the command line options passed to ANTLR 4 when
	 * generating the parser may change the behavior of the listener calls.</li>
	 * <li>Changing the version of the ANTLR Tool used to generate the parser
	 * may change the behavior of the listener calls.</li>
	 * </ul>
	 *
	 * @param listener the listener to add
	 *
	 * @throws NullPointerException if {@code} listener is {@code null}
	 */
	addParseListener(listener) {
		if (listener === null) {
			throw "listener";
		}
		if (this._parseListeners === null) {
			this._parseListeners = [];
		}
		this._parseListeners.push(listener);
	}

	/**
	 * Remove {@code listener} from the list of parse listeners.
	 *
	 * <p>If {@code listener} is {@code null} or has not been added as a parse
	 * listener, this method does nothing.</p>
	 * @param listener the listener to remove
	 */
	removeParseListener(listener) {
		if (this._parseListeners !== null) {
			const idx = this._parseListeners.indexOf(listener);
			if (idx >= 0) {
				this._parseListeners.splice(idx, 1);
			}
			if (this._parseListeners.length === 0) {
				this._parseListeners = null;
			}
		}
	}

// Remove all parse listeners.
	removeParseListeners() {
		this._parseListeners = null;
	}

// Notify any parse listeners of an enter rule event.
	triggerEnterRuleEvent() {
		if (this._parseListeners !== null) {
			const ctx = this._ctx;
			this._parseListeners.map(function(listener) {
				listener.enterEveryRule(ctx);
				ctx.enterRule(listener);
			});
		}
	}

	/**
	 * Notify any parse listeners of an exit rule event.
	 * @see //addParseListener
	 */
	triggerExitRuleEvent() {
		if (this._parseListeners !== null) {
			// reverse order walk of listeners
			const ctx = this._ctx;
			this._parseListeners.slice(0).reverse().map(function(listener) {
				ctx.exitRule(listener);
				listener.exitEveryRule(ctx);
			});
		}
	}

	getTokenFactory() {
		return this._input.tokenSource._factory;
	}

	// Tell our token source and error strategy about a new way to create tokens.
	setTokenFactory(factory) {
		this._input.tokenSource._factory = factory;
	}

	/**
	 * The ATN with bypass alternatives is expensive to create so we create it
	 * lazily.
	 *
	 * @throws UnsupportedOperationException if the current parser does not
	 * implement the {@link //getSerializedATN()} method.
	 */
	getATNWithBypassAlts() {
		const serializedAtn = this.getSerializedATN();
		if (serializedAtn === null) {
			throw "The current parser does not support an ATN with bypass alternatives.";
		}
		let result = this.bypassAltsAtnCache[serializedAtn];
		if (result === null) {
			const deserializationOptions = new ATNDeserializationOptions();
			deserializationOptions.generateRuleBypassTransitions = true;
			result = new ATNDeserializer(deserializationOptions)
					.deserialize(serializedAtn);
			this.bypassAltsAtnCache[serializedAtn] = result;
		}
		return result;
	}

	/**
	 * The preferred method of getting a tree pattern. For example, here's a
	 * sample use:
	 *
	 * <pre>
	 * ParseTree t = parser.expr();
	 * ParseTreePattern p = parser.compileParseTreePattern("&lt;ID&gt;+0",
	 * MyParser.RULE_expr);
	 * ParseTreeMatch m = p.match(t);
	 * String id = m.get("ID");
	 * </pre>
	 */
	compileParseTreePattern(pattern, patternRuleIndex, lexer) {
		lexer = lexer || null;
		if (lexer === null) {
			if (this.getTokenStream() !== null) {
				const tokenSource = this.getTokenStream().tokenSource;
				if (tokenSource instanceof Lexer) {
					lexer = tokenSource;
				}
			}
		}
		if (lexer === null) {
			throw "Parser can't discover a lexer to use";
		}
		const m = new ParseTreePatternMatcher(lexer, this);
		return m.compile(pattern, patternRuleIndex);
	}

	getInputStream() {
		return this.getTokenStream();
	}

	setInputStream(input) {
		this.setTokenStream(input);
	}

	getTokenStream() {
		return this._input;
	}

	// Set the token stream and reset the parser.
	setTokenStream(input) {
		this._input = null;
		this.reset();
		this._input = input;
	}

	/**
	 * Match needs to return the current input symbol, which gets put
	 * into the label for the associated token ref; e.g., x=ID.
	 */
	getCurrentToken() {
		return this._input.LT(1);
	}

	notifyErrorListeners(msg, offendingToken, err) {
		offendingToken = offendingToken || null;
		err = err || null;
		if (offendingToken === null) {
			offendingToken = this.getCurrentToken();
		}
		this._syntaxErrors += 1;
		const line = offendingToken.line;
		const column = offendingToken.column;
		const listener = this.getErrorListenerDispatch();
		listener.syntaxError(this, offendingToken, line, column, msg, err);
	}

	/**
	 * Consume and return the {@linkplain //getCurrentToken current symbol}.
	 *
	 * <p>E.g., given the following input with {@code A} being the current
	 * lookahead symbol, this function moves the cursor to {@code B} and returns
	 * {@code A}.</p>
	 *
	 * <pre>
	 * A B
	 * ^
	 * </pre>
	 *
	 * If the parser is not in error recovery mode, the consumed symbol is added
	 * to the parse tree using {@link ParserRuleContext//addChild(Token)}, and
	 * {@link ParseTreeListener//visitTerminal} is called on any parse listeners.
	 * If the parser <em>is</em> in error recovery mode, the consumed symbol is
	 * added to the parse tree using
	 * {@link ParserRuleContext//addErrorNode(Token)}, and
	 * {@link ParseTreeListener//visitErrorNode} is called on any parse
	 * listeners.
	 */
	consume() {
		const o = this.getCurrentToken();
		if (o.type !== Token.EOF) {
			this.getInputStream().consume();
		}
		const hasListener = this._parseListeners !== null && this._parseListeners.length > 0;
		if (this.buildParseTrees || hasListener) {
			let node;
			if (this._errHandler.inErrorRecoveryMode(this)) {
				node = this._ctx.addErrorNode(o);
			} else {
				node = this._ctx.addTokenNode(o);
			}
			node.invokingState = this.state;
			if (hasListener) {
				this._parseListeners.map(function(listener) {
					if (node instanceof ErrorNode || (node.isErrorNode !== undefined && node.isErrorNode())) {
						listener.visitErrorNode(node);
					} else if (node instanceof TerminalNode) {
						listener.visitTerminal(node);
					}
				});
			}
		}
		return o;
	}

	addContextToParseTree() {
		// add current context to parent if we have a parent
		if (this._ctx.parentCtx !== null) {
			this._ctx.parentCtx.addChild(this._ctx);
		}
	}

	/**
	 * Always called by generated parsers upon entry to a rule. Access field
	 * {@link //_ctx} get the current context.
	 */
	enterRule(localctx, state, ruleIndex) {
		this.state = state;
		this._ctx = localctx;
		this._ctx.start = this._input.LT(1);
		if (this.buildParseTrees) {
			this.addContextToParseTree();
		}
		if (this._parseListeners !== null) {
			this.triggerEnterRuleEvent();
		}
	}

	exitRule() {
		this._ctx.stop = this._input.LT(-1);
		// trigger event on _ctx, before it reverts to parent
		if (this._parseListeners !== null) {
			this.triggerExitRuleEvent();
		}
		this.state = this._ctx.invokingState;
		this._ctx = this._ctx.parentCtx;
	}

	enterOuterAlt(localctx, altNum) {
		localctx.setAltNumber(altNum);
		// if we have new localctx, make sure we replace existing ctx
		// that is previous child of parse tree
		if (this.buildParseTrees && this._ctx !== localctx) {
			if (this._ctx.parentCtx !== null) {
				this._ctx.parentCtx.removeLastChild();
				this._ctx.parentCtx.addChild(localctx);
			}
		}
		this._ctx = localctx;
	}

	/**
	 * Get the precedence level for the top-most precedence rule.
	 *
	 * @return The precedence level for the top-most precedence rule, or -1 if
	 * the parser context is not nested within a precedence rule.
	 */
	getPrecedence() {
		if (this._precedenceStack.length === 0) {
			return -1;
		} else {
			return this._precedenceStack[this._precedenceStack.length-1];
		}
	}

	enterRecursionRule(localctx, state, ruleIndex, precedence) {
	   this.state = state;
	   this._precedenceStack.push(precedence);
	   this._ctx = localctx;
	   this._ctx.start = this._input.LT(1);
	   if (this._parseListeners !== null) {
		   this.triggerEnterRuleEvent(); // simulates rule entry for
		   									// left-recursive rules
	   }
   }

	// Like {@link //enterRule} but for recursive rules.
	pushNewRecursionContext(localctx, state, ruleIndex) {
		const previous = this._ctx;
		previous.parentCtx = localctx;
		previous.invokingState = state;
		previous.stop = this._input.LT(-1);

		this._ctx = localctx;
		this._ctx.start = previous.start;
		if (this.buildParseTrees) {
			this._ctx.addChild(previous);
		}
		if (this._parseListeners !== null) {
			this.triggerEnterRuleEvent(); // simulates rule entry for
											// left-recursive rules
		}
	}

	unrollRecursionContexts(parentCtx) {
		this._precedenceStack.pop();
		this._ctx.stop = this._input.LT(-1);
		const retCtx = this._ctx; // save current ctx (return value)
		// unroll so _ctx is as it was before call to recursive method
		if (this._parseListeners !== null) {
			while (this._ctx !== parentCtx) {
				this.triggerExitRuleEvent();
				this._ctx = this._ctx.parentCtx;
			}
		} else {
			this._ctx = parentCtx;
		}
		// hook into tree
		retCtx.parentCtx = parentCtx;
		if (this.buildParseTrees && parentCtx !== null) {
			// add return ctx into invoking rule's tree
			parentCtx.addChild(retCtx);
		}
	}

	getInvokingContext(ruleIndex) {
		let ctx = this._ctx;
		while (ctx !== null) {
			if (ctx.ruleIndex === ruleIndex) {
				return ctx;
			}
			ctx = ctx.parentCtx;
		}
		return null;
	}

	precpred(localctx, precedence) {
		return precedence >= this._precedenceStack[this._precedenceStack.length-1];
	}

	inContext(context) {
		// TODO: useful in parser?
		return false;
	}

	/**
	 * Checks whether or not {@code symbol} can follow the current state in the
	 * ATN. The behavior of this method is equivalent to the following, but is
	 * implemented such that the complete context-sensitive follow set does not
	 * need to be explicitly constructed.
	 *
	 * <pre>
	 * return getExpectedTokens().contains(symbol);
	 * </pre>
	 *
	 * @param symbol the symbol type to check
	 * @return {@code true} if {@code symbol} can follow the current state in
	 * the ATN, otherwise {@code false}.
	 */
	isExpectedToken(symbol) {
		const atn = this._interp.atn;
		let ctx = this._ctx;
		const s = atn.states[this.state];
		let following = atn.nextTokens(s);
		if (following.contains(symbol)) {
			return true;
		}
		if (!following.contains(Token.EPSILON)) {
			return false;
		}
		while (ctx !== null && ctx.invokingState >= 0 && following.contains(Token.EPSILON)) {
			const invokingState = atn.states[ctx.invokingState];
			const rt = invokingState.transitions[0];
			following = atn.nextTokens(rt.followState);
			if (following.contains(symbol)) {
				return true;
			}
			ctx = ctx.parentCtx;
		}
		if (following.contains(Token.EPSILON) && symbol === Token.EOF) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Computes the set of input symbols which could follow the current parser
	 * state and context, as given by {@link //getState} and {@link //getContext},
	 * respectively.
	 *
	 * @see ATN//getExpectedTokens(int, RuleContext)
	 */
	getExpectedTokens() {
		return this._interp.atn.getExpectedTokens(this.state, this._ctx);
	}

	getExpectedTokensWithinCurrentRule() {
		const atn = this._interp.atn;
		const s = atn.states[this.state];
		return atn.nextTokens(s);
	}

	// Get a rule's index (i.e., {@code RULE_ruleName} field) or -1 if not found.
	getRuleIndex(ruleName) {
		const ruleIndex = this.getRuleIndexMap()[ruleName];
		if (ruleIndex !== null) {
			return ruleIndex;
		} else {
			return -1;
		}
	}

	/**
	 * Return List&lt;String&gt; of the rule names in your parser instance
	 * leading up to a call to the current rule. You could override if
	 * you want more details such as the file/line info of where
	 * in the ATN a rule is invoked.
	 *
	 * this is very useful for error messages.
	 */
	getRuleInvocationStack(p) {
		p = p || null;
		if (p === null) {
			p = this._ctx;
		}
		const stack = [];
		while (p !== null) {
			// compute what follows who invoked us
			const ruleIndex = p.ruleIndex;
			if (ruleIndex < 0) {
				stack.push("n/a");
			} else {
				stack.push(this.ruleNames[ruleIndex]);
			}
			p = p.parentCtx;
		}
		return stack;
	}

	// For debugging and other purposes.
	getDFAStrings() {
		return this._interp.decisionToDFA.toString();
	}

	// For debugging and other purposes.
	dumpDFA() {
		let seenOne = false;
		for (let i = 0; i < this._interp.decisionToDFA.length; i++) {
			const dfa = this._interp.decisionToDFA[i];
			if (dfa.states.length > 0) {
				if (seenOne) {
					console.log();
				}
				this.printer.println("Decision " + dfa.decision + ":");
				this.printer.print(dfa.toString(this.literalNames, this.symbolicNames));
				seenOne = true;
			}
		}
	}

	/*
		"			printer = function() {\r\n" +
		"				this.println = function(s) { document.getElementById('output') += s + '\\n'; }\r\n" +
		"				this.print = function(s) { document.getElementById('output') += s; }\r\n" +
		"			};\r\n" +
		*/
	getSourceName() {
		return this._input.sourceName;
	}

	/**
	 * During a parse is sometimes useful to listen in on the rule entry and exit
	 * events as well as token matches. this is for quick and dirty debugging.
	 */
	setTrace(trace) {
		if (!trace) {
			this.removeParseListener(this._tracer);
			this._tracer = null;
		} else {
			if (this._tracer !== null) {
				this.removeParseListener(this._tracer);
			}
			this._tracer = new TraceListener(this);
			this.addParseListener(this._tracer);
		}
	}
}

/**
 * this field maps from the serialized ATN string to the deserialized {@link
 * ATN} with
 * bypass alternatives.
 *
 * @see ATNDeserializationOptions//isGenerateRuleBypassTransitions()
 */
Parser.bypassAltsAtnCache = {};

module.exports = Parser;

},{"./Lexer":9,"./Recognizer":13,"./Token":15,"./atn/ATNDeserializationOptions":20,"./atn/ATNDeserializer":21,"./error/ErrorStrategy":39,"./tree/Tree":45}],11:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const RuleContext = require('./RuleContext');
const Tree = require('./tree/Tree');
const INVALID_INTERVAL = Tree.INVALID_INTERVAL;
const TerminalNode = Tree.TerminalNode;
const TerminalNodeImpl = Tree.TerminalNodeImpl;
const ErrorNodeImpl = Tree.ErrorNodeImpl;
const Interval = require("./IntervalSet").Interval;

/**
 * A rule invocation record for parsing.
 *
 *  Contains all of the information about the current rule not stored in the
 *  RuleContext. It handles parse tree children list, Any ATN state
 *  tracing, and the default values available for rule indications:
 *  start, stop, rule index, current alt number, current
 *  ATN state.
 *
 *  Subclasses made for each rule and grammar track the parameters,
 *  return values, locals, and labels specific to that rule. These
 *  are the objects that are returned from rules.
 *
 *  Note text is not an actual field of a rule return value; it is computed
 *  from start and stop using the input stream's toString() method.  I
 *  could add a ctor to this so that we can pass in and store the input
 *  stream, but I'm not sure we want to do that.  It would seem to be undefined
 *  to get the .text property anyway if the rule matches tokens from multiple
 *  input streams.
 *
 *  I do not use getters for fields of objects that are used simply to
 *  group values such as this aggregate.  The getters/setters are there to
 *  satisfy the superclass interface.
 */
class ParserRuleContext extends RuleContext {
	constructor(parent, invokingStateNumber) {
		parent = parent || null;
		invokingStateNumber = invokingStateNumber || null;
		super(parent, invokingStateNumber);
		this.ruleIndex = -1;
		/**
		 * If we are debugging or building a parse tree for a visitor,
		 * we need to track all of the tokens and rule invocations associated
		 * with this rule's context. This is empty for parsing w/o tree constr.
		 * operation because we don't the need to track the details about
		 * how we parse this rule.
		 */
		this.children = null;
		this.start = null;
		this.stop = null;
		/**
		 * The exception that forced this rule to return. If the rule successfully
		 * completed, this is {@code null}.
		 */
		this.exception = null;
	}

	// COPY a ctx (I'm deliberately not using copy constructor)
	copyFrom(ctx) {
		// from RuleContext
		this.parentCtx = ctx.parentCtx;
		this.invokingState = ctx.invokingState;
		this.children = null;
		this.start = ctx.start;
		this.stop = ctx.stop;
		// copy any error nodes to alt label node
		if(ctx.children) {
			this.children = [];
			// reset parent pointer for any error nodes
			ctx.children.map(function(child) {
				if (child instanceof ErrorNodeImpl) {
					this.children.push(child);
					child.parentCtx = this;
				}
			}, this);
		}
	}

	// Double dispatch methods for listeners
	enterRule(listener) {
	}

	exitRule(listener) {
	}

	// Does not set parent link; other add methods do that
	addChild(child) {
		if (this.children === null) {
			this.children = [];
		}
		this.children.push(child);
		return child;
	}

	/** Used by enterOuterAlt to toss out a RuleContext previously added as
	 * we entered a rule. If we have // label, we will need to remove
	 * generic ruleContext object.
	 */
	removeLastChild() {
		if (this.children !== null) {
			this.children.pop();
		}
	}

	addTokenNode(token) {
		const node = new TerminalNodeImpl(token);
		this.addChild(node);
		node.parentCtx = this;
		return node;
	}

	addErrorNode(badToken) {
		const node = new ErrorNodeImpl(badToken);
		this.addChild(node);
		node.parentCtx = this;
		return node;
	}

	getChild(i, type) {
		type = type || null;
		if (this.children === null || i < 0 || i >= this.children.length) {
			return null;
		}
		if (type === null) {
			return this.children[i];
		} else {
			for(let j=0; j<this.children.length; j++) {
				const child = this.children[j];
				if(child instanceof type) {
					if(i===0) {
						return child;
					} else {
						i -= 1;
					}
				}
			}
			return null;
		}
	}

	getToken(ttype, i) {
		if (this.children === null || i < 0 || i >= this.children.length) {
			return null;
		}
		for(let j=0; j<this.children.length; j++) {
			const child = this.children[j];
			if (child instanceof TerminalNode) {
				if (child.symbol.type === ttype) {
					if(i===0) {
						return child;
					} else {
						i -= 1;
					}
				}
			}
		}
		return null;
	}

	getTokens(ttype ) {
		if (this.children=== null) {
			return [];
		} else {
			const tokens = [];
			for(let j=0; j<this.children.length; j++) {
				const child = this.children[j];
				if (child instanceof TerminalNode) {
					if (child.symbol.type === ttype) {
						tokens.push(child);
					}
				}
			}
			return tokens;
		}
	}

	getTypedRuleContext(ctxType, i) {
		return this.getChild(i, ctxType);
	}

	getTypedRuleContexts(ctxType) {
		if (this.children=== null) {
			return [];
		} else {
			const contexts = [];
			for(let j=0; j<this.children.length; j++) {
				const child = this.children[j];
				if (child instanceof ctxType) {
					contexts.push(child);
				}
			}
			return contexts;
		}
	}

	getChildCount() {
		if (this.children=== null) {
			return 0;
		} else {
			return this.children.length;
		}
	}

	getSourceInterval() {
		if( this.start === null || this.stop === null) {
			return INVALID_INTERVAL;
		} else {
			return new Interval(this.start.tokenIndex, this.stop.tokenIndex);
		}
	}
}

RuleContext.EMPTY = new ParserRuleContext();

class InterpreterRuleContext extends ParserRuleContext {
	constructor(parent, invokingStateNumber, ruleIndex) {
		super(parent, invokingStateNumber);
		this.ruleIndex = ruleIndex;
	}
}

module.exports = ParserRuleContext;

},{"./IntervalSet":7,"./RuleContext":14,"./tree/Tree":45}],12:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const RuleContext = require('./RuleContext');
const {Hash, Map, equalArrays} = require('./Utils');

class PredictionContext {

	constructor(cachedHashCode) {
		this.cachedHashCode = cachedHashCode;
	}

	/**
	 * Stores the computed hash code of this {@link PredictionContext}. The hash
	 * code is computed in parts to match the following reference algorithm.
	 *
	 * <pre>
	 * private int referenceHashCode() {
	 * int hash = {@link MurmurHash//initialize MurmurHash.initialize}({@link
	 * //INITIAL_HASH});
	 *
	 * for (int i = 0; i &lt; {@link //size()}; i++) {
	 * hash = {@link MurmurHash//update MurmurHash.update}(hash, {@link //getParent
	 * getParent}(i));
	 * }
	 *
	 * for (int i = 0; i &lt; {@link //size()}; i++) {
	 * hash = {@link MurmurHash//update MurmurHash.update}(hash, {@link
	 * //getReturnState getReturnState}(i));
	 * }
	 *
	 * hash = {@link MurmurHash//finish MurmurHash.finish}(hash, 2// {@link
	 * //size()});
	 * return hash;
	 * }
	 * </pre>
	 * This means only the {@link //EMPTY} context is in set.
	 */
	isEmpty() {
		return this === PredictionContext.EMPTY;
	}

	hasEmptyPath() {
		return this.getReturnState(this.length - 1) === PredictionContext.EMPTY_RETURN_STATE;
	}

	hashCode() {
		return this.cachedHashCode;
	}

	updateHashCode(hash) {
		hash.update(this.cachedHashCode);
	}
}

/**
 * Represents {@code $} in local context prediction, which means wildcard.
 * {@code//+x =//}.
 */
PredictionContext.EMPTY = null;

/**
 * Represents {@code $} in an array in full context mode, when {@code $}
 * doesn't mean wildcard: {@code $ + x = [$,x]}. Here,
 * {@code $} = {@link //EMPTY_RETURN_STATE}.
 */
PredictionContext.EMPTY_RETURN_STATE = 0x7FFFFFFF;

PredictionContext.globalNodeCount = 1;
PredictionContext.id = PredictionContext.globalNodeCount;


/*
function calculateHashString(parent, returnState) {
	return "" + parent + returnState;
}
*/

/**
 * Used to cache {@link PredictionContext} objects. Its used for the shared
 * context cash associated with contexts in DFA states. This cache
 * can be used for both lexers and parsers.
 */
class PredictionContextCache {

	constructor() {
		this.cache = new Map();
	}

	/**
	 * Add a context to the cache and return it. If the context already exists,
	 * return that one instead and do not add a new context to the cache.
	 * Protect shared cache from unsafe thread access.
	 */
	add(ctx) {
		if (ctx === PredictionContext.EMPTY) {
			return PredictionContext.EMPTY;
		}
		const existing = this.cache.get(ctx) || null;
		if (existing !== null) {
			return existing;
		}
		this.cache.put(ctx, ctx);
		return ctx;
	}

	get(ctx) {
		return this.cache.get(ctx) || null;
	}

	get length(){
		return this.cache.length;
	}
}


class SingletonPredictionContext extends PredictionContext {

	constructor(parent, returnState) {
		let hashCode = 0;
		const hash = new Hash();
		if(parent !== null) {
			hash.update(parent, returnState);
		} else {
			hash.update(1);
		}
		hashCode = hash.finish();
		super(hashCode);
		this.parentCtx = parent;
		this.returnState = returnState;
	}

	getParent(index) {
		return this.parentCtx;
	}

	getReturnState(index) {
		return this.returnState;
	}

	equals(other) {
		if (this === other) {
			return true;
		} else if (!(other instanceof SingletonPredictionContext)) {
			return false;
		} else if (this.hashCode() !== other.hashCode()) {
			return false; // can't be same if hash is different
		} else {
			if(this.returnState !== other.returnState)
				return false;
			else if(this.parentCtx==null)
				return other.parentCtx==null
			else
				return this.parentCtx.equals(other.parentCtx);
		}
	}

	toString() {
		const up = this.parentCtx === null ? "" : this.parentCtx.toString();
		if (up.length === 0) {
			if (this.returnState === PredictionContext.EMPTY_RETURN_STATE) {
				return "$";
			} else {
				return "" + this.returnState;
			}
		} else {
			return "" + this.returnState + " " + up;
		}
	}

	get length(){
		return 1;
	}

	static create(parent, returnState) {
		if (returnState === PredictionContext.EMPTY_RETURN_STATE && parent === null) {
			// someone can pass in the bits of an array ctx that mean $
			return PredictionContext.EMPTY;
		} else {
			return new SingletonPredictionContext(parent, returnState);
		}
	}
}

class EmptyPredictionContext extends SingletonPredictionContext {

	constructor() {
		super(null, PredictionContext.EMPTY_RETURN_STATE);
	}

	isEmpty() {
		return true;
	}

	getParent(index) {
		return null;
	}

	getReturnState(index) {
		return this.returnState;
	}

	equals(other) {
		return this === other;
	}

	toString() {
		return "$";
	}
}


PredictionContext.EMPTY = new EmptyPredictionContext();

class ArrayPredictionContext extends PredictionContext {

	constructor(parents, returnStates) {
		/**
		 * Parent can be null only if full ctx mode and we make an array
		 * from {@link //EMPTY} and non-empty. We merge {@link //EMPTY} by using
		 * null parent and
		 * returnState == {@link //EMPTY_RETURN_STATE}.
		 */
		const h = new Hash();
		h.update(parents, returnStates);
		const hashCode = h.finish();
		super(hashCode);
		this.parents = parents;
		this.returnStates = returnStates;
		return this;
	}

	isEmpty() {
		// since EMPTY_RETURN_STATE can only appear in the last position, we
		// don't need to verify that size==1
		return this.returnStates[0] === PredictionContext.EMPTY_RETURN_STATE;
	}

	getParent(index) {
		return this.parents[index];
	}

	getReturnState(index) {
		return this.returnStates[index];
	}

	equals(other) {
		if (this === other) {
			return true;
		} else if (!(other instanceof ArrayPredictionContext)) {
			return false;
		} else if (this.hashCode() !== other.hashCode()) {
			return false; // can't be same if hash is different
		} else {
			return equalArrays(this.returnStates, other.returnStates) &&
				equalArrays(this.parents, other.parents);
		}
	}

	toString() {
		if (this.isEmpty()) {
			return "[]";
		} else {
			let s = "[";
			for (let i = 0; i < this.returnStates.length; i++) {
				if (i > 0) {
					s = s + ", ";
				}
				if (this.returnStates[i] === PredictionContext.EMPTY_RETURN_STATE) {
					s = s + "$";
					continue;
				}
				s = s + this.returnStates[i];
				if (this.parents[i] !== null) {
					s = s + " " + this.parents[i];
				} else {
					s = s + "null";
				}
			}
			return s + "]";
		}
	}

	get length(){
		return this.returnStates.length;
	}
}


/**
 * Convert a {@link RuleContext} tree to a {@link PredictionContext} graph.
 * Return {@link //EMPTY} if {@code outerContext} is empty or null.
 */
function predictionContextFromRuleContext(atn, outerContext) {
	if (outerContext === undefined || outerContext === null) {
		outerContext = RuleContext.EMPTY;
	}
	// if we are in RuleContext of start rule, s, then PredictionContext
	// is EMPTY. Nobody called us. (if we are empty, return empty)
	if (outerContext.parentCtx === null || outerContext === RuleContext.EMPTY) {
		return PredictionContext.EMPTY;
	}
	// If we have a parent, convert it to a PredictionContext graph
	const parent = predictionContextFromRuleContext(atn, outerContext.parentCtx);
	const state = atn.states[outerContext.invokingState];
	const transition = state.transitions[0];
	return SingletonPredictionContext.create(parent, transition.followState.stateNumber);
}
/*
function calculateListsHashString(parents, returnStates) {
	const s = "";
	parents.map(function(p) {
		s = s + p;
	});
	returnStates.map(function(r) {
		s = s + r;
	});
	return s;
}
*/
function merge(a, b, rootIsWildcard, mergeCache) {
	// share same graph if both same
	if (a === b) {
		return a;
	}
	if (a instanceof SingletonPredictionContext && b instanceof SingletonPredictionContext) {
		return mergeSingletons(a, b, rootIsWildcard, mergeCache);
	}
	// At least one of a or b is array
	// If one is $ and rootIsWildcard, return $ as// wildcard
	if (rootIsWildcard) {
		if (a instanceof EmptyPredictionContext) {
			return a;
		}
		if (b instanceof EmptyPredictionContext) {
			return b;
		}
	}
	// convert singleton so both are arrays to normalize
	if (a instanceof SingletonPredictionContext) {
		a = new ArrayPredictionContext([a.getParent()], [a.returnState]);
	}
	if (b instanceof SingletonPredictionContext) {
		b = new ArrayPredictionContext([b.getParent()], [b.returnState]);
	}
	return mergeArrays(a, b, rootIsWildcard, mergeCache);
}

/**
 * Merge two {@link SingletonPredictionContext} instances.
 *
 * <p>Stack tops equal, parents merge is same; return left graph.<br>
 * <embed src="images/SingletonMerge_SameRootSamePar.svg"
 * type="image/svg+xml"/></p>
 *
 * <p>Same stack top, parents differ; merge parents giving array node, then
 * remainders of those graphs. A new root node is created to point to the
 * merged parents.<br>
 * <embed src="images/SingletonMerge_SameRootDiffPar.svg"
 * type="image/svg+xml"/></p>
 *
 * <p>Different stack tops pointing to same parent. Make array node for the
 * root where both element in the root point to the same (original)
 * parent.<br>
 * <embed src="images/SingletonMerge_DiffRootSamePar.svg"
 * type="image/svg+xml"/></p>
 *
 * <p>Different stack tops pointing to different parents. Make array node for
 * the root where each element points to the corresponding original
 * parent.<br>
 * <embed src="images/SingletonMerge_DiffRootDiffPar.svg"
 * type="image/svg+xml"/></p>
 *
 * @param a the first {@link SingletonPredictionContext}
 * @param b the second {@link SingletonPredictionContext}
 * @param rootIsWildcard {@code true} if this is a local-context merge,
 * otherwise false to indicate a full-context merge
 * @param mergeCache
 */
function mergeSingletons(a, b, rootIsWildcard, mergeCache) {
	if (mergeCache !== null) {
		let previous = mergeCache.get(a, b);
		if (previous !== null) {
			return previous;
		}
		previous = mergeCache.get(b, a);
		if (previous !== null) {
			return previous;
		}
	}

	const rootMerge = mergeRoot(a, b, rootIsWildcard);
	if (rootMerge !== null) {
		if (mergeCache !== null) {
			mergeCache.set(a, b, rootMerge);
		}
		return rootMerge;
	}
	if (a.returnState === b.returnState) {
		const parent = merge(a.parentCtx, b.parentCtx, rootIsWildcard, mergeCache);
		// if parent is same as existing a or b parent or reduced to a parent,
		// return it
		if (parent === a.parentCtx) {
			return a; // ax + bx = ax, if a=b
		}
		if (parent === b.parentCtx) {
			return b; // ax + bx = bx, if a=b
		}
		// else: ax + ay = a'[x,y]
		// merge parents x and y, giving array node with x,y then remainders
		// of those graphs. dup a, a' points at merged array
		// new joined parent so create new singleton pointing to it, a'
		const spc = SingletonPredictionContext.create(parent, a.returnState);
		if (mergeCache !== null) {
			mergeCache.set(a, b, spc);
		}
		return spc;
	} else { // a != b payloads differ
		// see if we can collapse parents due to $+x parents if local ctx
		let singleParent = null;
		if (a === b || (a.parentCtx !== null && a.parentCtx === b.parentCtx)) { // ax +
																				// bx =
																				// [a,b]x
			singleParent = a.parentCtx;
		}
		if (singleParent !== null) { // parents are same
			// sort payloads and use same parent
			const payloads = [ a.returnState, b.returnState ];
			if (a.returnState > b.returnState) {
				payloads[0] = b.returnState;
				payloads[1] = a.returnState;
			}
			const parents = [ singleParent, singleParent ];
			const apc = new ArrayPredictionContext(parents, payloads);
			if (mergeCache !== null) {
				mergeCache.set(a, b, apc);
			}
			return apc;
		}
		// parents differ and can't merge them. Just pack together
		// into array; can't merge.
		// ax + by = [ax,by]
		const payloads = [ a.returnState, b.returnState ];
		let parents = [ a.parentCtx, b.parentCtx ];
		if (a.returnState > b.returnState) { // sort by payload
			payloads[0] = b.returnState;
			payloads[1] = a.returnState;
			parents = [ b.parentCtx, a.parentCtx ];
		}
		const a_ = new ArrayPredictionContext(parents, payloads);
		if (mergeCache !== null) {
			mergeCache.set(a, b, a_);
		}
		return a_;
	}
}

/**
 * Handle case where at least one of {@code a} or {@code b} is
 * {@link //EMPTY}. In the following diagrams, the symbol {@code $} is used
 * to represent {@link //EMPTY}.
 *
 * <h2>Local-Context Merges</h2>
 *
 * <p>These local-context merge operations are used when {@code rootIsWildcard}
 * is true.</p>
 *
 * <p>{@link //EMPTY} is superset of any graph; return {@link //EMPTY}.<br>
 * <embed src="images/LocalMerge_EmptyRoot.svg" type="image/svg+xml"/></p>
 *
 * <p>{@link //EMPTY} and anything is {@code //EMPTY}, so merged parent is
 * {@code //EMPTY}; return left graph.<br>
 * <embed src="images/LocalMerge_EmptyParent.svg" type="image/svg+xml"/></p>
 *
 * <p>Special case of last merge if local context.<br>
 * <embed src="images/LocalMerge_DiffRoots.svg" type="image/svg+xml"/></p>
 *
 * <h2>Full-Context Merges</h2>
 *
 * <p>These full-context merge operations are used when {@code rootIsWildcard}
 * is false.</p>
 *
 * <p><embed src="images/FullMerge_EmptyRoots.svg" type="image/svg+xml"/></p>
 *
 * <p>Must keep all contexts; {@link //EMPTY} in array is a special value (and
 * null parent).<br>
 * <embed src="images/FullMerge_EmptyRoot.svg" type="image/svg+xml"/></p>
 *
 * <p><embed src="images/FullMerge_SameRoot.svg" type="image/svg+xml"/></p>
 *
 * @param a the first {@link SingletonPredictionContext}
 * @param b the second {@link SingletonPredictionContext}
 * @param rootIsWildcard {@code true} if this is a local-context merge,
 * otherwise false to indicate a full-context merge
 */
function mergeRoot(a, b, rootIsWildcard) {
	if (rootIsWildcard) {
		if (a === PredictionContext.EMPTY) {
			return PredictionContext.EMPTY; // // + b =//
		}
		if (b === PredictionContext.EMPTY) {
			return PredictionContext.EMPTY; // a +// =//
		}
	} else {
		if (a === PredictionContext.EMPTY && b === PredictionContext.EMPTY) {
			return PredictionContext.EMPTY; // $ + $ = $
		} else if (a === PredictionContext.EMPTY) { // $ + x = [$,x]
			const payloads = [ b.returnState,
					PredictionContext.EMPTY_RETURN_STATE ];
			const parents = [ b.parentCtx, null ];
			return new ArrayPredictionContext(parents, payloads);
		} else if (b === PredictionContext.EMPTY) { // x + $ = [$,x] ($ is always first if present)
			const payloads = [ a.returnState, PredictionContext.EMPTY_RETURN_STATE ];
			const parents = [ a.parentCtx, null ];
			return new ArrayPredictionContext(parents, payloads);
		}
	}
	return null;
}

/**
 * Merge two {@link ArrayPredictionContext} instances.
 *
 * <p>Different tops, different parents.<br>
 * <embed src="images/ArrayMerge_DiffTopDiffPar.svg" type="image/svg+xml"/></p>
 *
 * <p>Shared top, same parents.<br>
 * <embed src="images/ArrayMerge_ShareTopSamePar.svg" type="image/svg+xml"/></p>
 *
 * <p>Shared top, different parents.<br>
 * <embed src="images/ArrayMerge_ShareTopDiffPar.svg" type="image/svg+xml"/></p>
 *
 * <p>Shared top, all shared parents.<br>
 * <embed src="images/ArrayMerge_ShareTopSharePar.svg"
 * type="image/svg+xml"/></p>
 *
 * <p>Equal tops, merge parents and reduce top to
 * {@link SingletonPredictionContext}.<br>
 * <embed src="images/ArrayMerge_EqualTop.svg" type="image/svg+xml"/></p>
 */
function mergeArrays(a, b, rootIsWildcard, mergeCache) {
	if (mergeCache !== null) {
		let previous = mergeCache.get(a, b);
		if (previous !== null) {
			return previous;
		}
		previous = mergeCache.get(b, a);
		if (previous !== null) {
			return previous;
		}
	}
	// merge sorted payloads a + b => M
	let i = 0; // walks a
	let j = 0; // walks b
	let k = 0; // walks target M array

	let mergedReturnStates = [];
	let mergedParents = [];
	// walk and merge to yield mergedParents, mergedReturnStates
	while (i < a.returnStates.length && j < b.returnStates.length) {
		const a_parent = a.parents[i];
		const b_parent = b.parents[j];
		if (a.returnStates[i] === b.returnStates[j]) {
			// same payload (stack tops are equal), must yield merged singleton
			const payload = a.returnStates[i];
			// $+$ = $
			const bothDollars = payload === PredictionContext.EMPTY_RETURN_STATE &&
					a_parent === null && b_parent === null;
			const ax_ax = (a_parent !== null && b_parent !== null && a_parent === b_parent); // ax+ax
																							// ->
																							// ax
			if (bothDollars || ax_ax) {
				mergedParents[k] = a_parent; // choose left
				mergedReturnStates[k] = payload;
			} else { // ax+ay -> a'[x,y]
				mergedParents[k] = merge(a_parent, b_parent, rootIsWildcard, mergeCache);
				mergedReturnStates[k] = payload;
			}
			i += 1; // hop over left one as usual
			j += 1; // but also skip one in right side since we merge
		} else if (a.returnStates[i] < b.returnStates[j]) { // copy a[i] to M
			mergedParents[k] = a_parent;
			mergedReturnStates[k] = a.returnStates[i];
			i += 1;
		} else { // b > a, copy b[j] to M
			mergedParents[k] = b_parent;
			mergedReturnStates[k] = b.returnStates[j];
			j += 1;
		}
		k += 1;
	}
	// copy over any payloads remaining in either array
	if (i < a.returnStates.length) {
		for (let p = i; p < a.returnStates.length; p++) {
			mergedParents[k] = a.parents[p];
			mergedReturnStates[k] = a.returnStates[p];
			k += 1;
		}
	} else {
		for (let p = j; p < b.returnStates.length; p++) {
			mergedParents[k] = b.parents[p];
			mergedReturnStates[k] = b.returnStates[p];
			k += 1;
		}
	}
	// trim merged if we combined a few that had same stack tops
	if (k < mergedParents.length) { // write index < last position; trim
		if (k === 1) { // for just one merged element, return singleton top
			const a_ = SingletonPredictionContext.create(mergedParents[0],
					mergedReturnStates[0]);
			if (mergeCache !== null) {
				mergeCache.set(a, b, a_);
			}
			return a_;
		}
		mergedParents = mergedParents.slice(0, k);
		mergedReturnStates = mergedReturnStates.slice(0, k);
	}

	const M = new ArrayPredictionContext(mergedParents, mergedReturnStates);

	// if we created same array as a or b, return that instead
	// TODO: track whether this is possible above during merge sort for speed
	if (M === a) {
		if (mergeCache !== null) {
			mergeCache.set(a, b, a);
		}
		return a;
	}
	if (M === b) {
		if (mergeCache !== null) {
			mergeCache.set(a, b, b);
		}
		return b;
	}
	combineCommonParents(mergedParents);

	if (mergeCache !== null) {
		mergeCache.set(a, b, M);
	}
	return M;
}

/**
 * Make pass over all <em>M</em> {@code parents}; merge any {@code equals()}
 * ones.
 */
function combineCommonParents(parents) {
	const uniqueParents = new Map();

	for (let p = 0; p < parents.length; p++) {
		const parent = parents[p];
		if (!(uniqueParents.containsKey(parent))) {
			uniqueParents.put(parent, parent);
		}
	}
	for (let q = 0; q < parents.length; q++) {
		parents[q] = uniqueParents.get(parents[q]);
	}
}

function getCachedPredictionContext(context, contextCache, visited) {
	if (context.isEmpty()) {
		return context;
	}
	let existing = visited.get(context) || null;
	if (existing !== null) {
		return existing;
	}
	existing = contextCache.get(context);
	if (existing !== null) {
		visited.put(context, existing);
		return existing;
	}
	let changed = false;
	let parents = [];
	for (let i = 0; i < parents.length; i++) {
		const parent = getCachedPredictionContext(context.getParent(i), contextCache, visited);
		if (changed || parent !== context.getParent(i)) {
			if (!changed) {
				parents = [];
				for (let j = 0; j < context.length; j++) {
					parents[j] = context.getParent(j);
				}
				changed = true;
			}
			parents[i] = parent;
		}
	}
	if (!changed) {
		contextCache.add(context);
		visited.put(context, context);
		return context;
	}
	let updated = null;
	if (parents.length === 0) {
		updated = PredictionContext.EMPTY;
	} else if (parents.length === 1) {
		updated = SingletonPredictionContext.create(parents[0], context
				.getReturnState(0));
	} else {
		updated = new ArrayPredictionContext(parents, context.returnStates);
	}
	contextCache.add(updated);
	visited.put(updated, updated);
	visited.put(context, updated);

	return updated;
}

// ter's recursive version of Sam's getAllNodes()
function getAllContextNodes(context, nodes, visited) {
	if (nodes === null) {
		nodes = [];
		return getAllContextNodes(context, nodes, visited);
	} else if (visited === null) {
		visited = new Map();
		return getAllContextNodes(context, nodes, visited);
	} else {
		if (context === null || visited.containsKey(context)) {
			return nodes;
		}
		visited.put(context, context);
		nodes.push(context);
		for (let i = 0; i < context.length; i++) {
			getAllContextNodes(context.getParent(i), nodes, visited);
		}
		return nodes;
	}
}

module.exports = {
	merge,
	PredictionContext,
	PredictionContextCache,
	SingletonPredictionContext,
	predictionContextFromRuleContext,
	getCachedPredictionContext
}

},{"./RuleContext":14,"./Utils":16}],13:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const {Token} = require('./Token');
const {ConsoleErrorListener} = require('./error/ErrorListener');
const {ProxyErrorListener} = require('./error/ErrorListener');

class Recognizer {
    constructor() {
        this._listeners = [ ConsoleErrorListener.INSTANCE ];
        this._interp = null;
        this._stateNumber = -1;
    }

    checkVersion(toolVersion) {
        const runtimeVersion = "4.9.2";
        if (runtimeVersion!==toolVersion) {
            console.log("ANTLR runtime and generated code versions disagree: "+runtimeVersion+"!="+toolVersion);
        }
    }

    addErrorListener(listener) {
        this._listeners.push(listener);
    }

    removeErrorListeners() {
        this._listeners = [];
    }

    getTokenTypeMap() {
        const tokenNames = this.getTokenNames();
        if (tokenNames===null) {
            throw("The current recognizer does not provide a list of token names.");
        }
        let result = this.tokenTypeMapCache[tokenNames];
        if(result===undefined) {
            result = tokenNames.reduce(function(o, k, i) { o[k] = i; });
            result.EOF = Token.EOF;
            this.tokenTypeMapCache[tokenNames] = result;
        }
        return result;
    }

    /**
     * Get a map from rule names to rule indexes.
     * <p>Used for XPath and tree pattern compilation.</p>
     */
    getRuleIndexMap() {
        const ruleNames = this.ruleNames;
        if (ruleNames===null) {
            throw("The current recognizer does not provide a list of rule names.");
        }
        let result = this.ruleIndexMapCache[ruleNames]; // todo: should it be Recognizer.ruleIndexMapCache ?
        if(result===undefined) {
            result = ruleNames.reduce(function(o, k, i) { o[k] = i; });
            this.ruleIndexMapCache[ruleNames] = result;
        }
        return result;
    }

    getTokenType(tokenName) {
        const ttype = this.getTokenTypeMap()[tokenName];
        if (ttype !==undefined) {
            return ttype;
        } else {
            return Token.INVALID_TYPE;
        }
    }

    // What is the error header, normally line/character position information?
    getErrorHeader(e) {
        const line = e.getOffendingToken().line;
        const column = e.getOffendingToken().column;
        return "line " + line + ":" + column;
    }

    /**
     * How should a token be displayed in an error message? The default
     * is to display just the text, but during development you might
     * want to have a lot of information spit out.  Override in that case
     * to use t.toString() (which, for CommonToken, dumps everything about
     * the token). This is better than forcing you to override a method in
     * your token objects because you don't have to go modify your lexer
     * so that it creates a new Java type.
     *
     * @deprecated This method is not called by the ANTLR 4 Runtime. Specific
     * implementations of {@link ANTLRErrorStrategy} may provide a similar
     * feature when necessary. For example, see
     * {@link DefaultErrorStrategy//getTokenErrorDisplay}.*/
    getTokenErrorDisplay(t) {
        if (t===null) {
            return "<no token>";
        }
        let s = t.text;
        if (s===null) {
            if (t.type===Token.EOF) {
                s = "<EOF>";
            } else {
                s = "<" + t.type + ">";
            }
        }
        s = s.replace("\n","\\n").replace("\r","\\r").replace("\t","\\t");
        return "'" + s + "'";
    }

    getErrorListenerDispatch() {
        return new ProxyErrorListener(this._listeners);
    }

    /**
     * subclass needs to override these if there are sempreds or actions
     * that the ATN interp needs to execute
     */
    sempred(localctx, ruleIndex, actionIndex) {
        return true;
    }

    precpred(localctx , precedence) {
        return true;
    }

    get state(){
        return this._stateNumber;
    }

    set state(state) {
        this._stateNumber = state;
    }
}

Recognizer.tokenTypeMapCache = {};
Recognizer.ruleIndexMapCache = {};

module.exports = Recognizer;

},{"./Token":15,"./error/ErrorListener":38}],14:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const {RuleNode} = require('./tree/Tree');
const {INVALID_INTERVAL} = require('./tree/Tree');
const Trees = require('./tree/Trees');

class RuleContext extends RuleNode {
	/** A rule context is a record of a single rule invocation. It knows
	 * which context invoked it, if any. If there is no parent context, then
	 * naturally the invoking state is not valid.  The parent link
	 * provides a chain upwards from the current rule invocation to the root
	 * of the invocation tree, forming a stack. We actually carry no
	 * information about the rule associated with this context (except
	 * when parsing). We keep only the state number of the invoking state from
	 * the ATN submachine that invoked this. Contrast this with the s
	 * pointer inside ParserRuleContext that tracks the current state
	 * being "executed" for the current rule.
	 *
	 * The parent contexts are useful for computing lookahead sets and
	 * getting error information.
	 *
	 * These objects are used during parsing and prediction.
	 * For the special case of parsers, we use the subclass
	 * ParserRuleContext.
	 *
	 * @see ParserRuleContext
	 */
	constructor(parent, invokingState) {
		// What context invoked this rule?
		super();
		this.parentCtx = parent || null;
		/**
		 * What state invoked the rule associated with this context?
		 * The "return address" is the followState of invokingState
		 * If parent is null, this should be -1.
		 */
		this.invokingState = invokingState || -1;
	}

	depth() {
		let n = 0;
		let p = this;
		while (p !== null) {
			p = p.parentCtx;
			n += 1;
		}
		return n;
	}

	/**
	 * A context is empty if there is no invoking state; meaning nobody call
	 * current context.
	 */
	isEmpty() {
		return this.invokingState === -1;
	}

// satisfy the ParseTree / SyntaxTree interface
	getSourceInterval() {
		return INVALID_INTERVAL;
	}

	getRuleContext() {
		return this;
	}

	getPayload() {
		return this;
	}

	/**
	 * Return the combined text of all child nodes. This method only considers
	 * tokens which have been added to the parse tree.
	 * <p>
	 * Since tokens on hidden channels (e.g. whitespace or comments) are not
	 * added to the parse trees, they will not appear in the output of this
	 * method.
	 */
	getText() {
		if (this.getChildCount() === 0) {
			return "";
		} else {
			return this.children.map(function(child) {
				return child.getText();
			}).join("");
		}
	}

	/**
	 * For rule associated with this parse tree internal node, return
	 * the outer alternative number used to match the input. Default
	 * implementation does not compute nor store this alt num. Create
	 * a subclass of ParserRuleContext with backing field and set
	 * option contextSuperClass.
	 * to set it.
	 */
	getAltNumber() {
	    // use constant value of ATN.INVALID_ALT_NUMBER to avoid circular dependency
	    return 0;
    }

	/**
	 * Set the outer alternative number for this context node. Default
	 * implementation does nothing to avoid backing field overhead for
	 * trees that don't need it.  Create
	 * a subclass of ParserRuleContext with backing field and set
	 * option contextSuperClass.
	 */
	setAltNumber(altNumber) { }

	getChild(i) {
		return null;
	}

	getChildCount() {
		return 0;
	}

	accept(visitor) {
		return visitor.visitChildren(this);
	}

	/**
	 * Print out a whole tree, not just a node, in LISP format
	 * (root child1 .. childN). Print just a node if this is a leaf.
	 */
	toStringTree(ruleNames, recog) {
		return Trees.toStringTree(this, ruleNames, recog);
	}

	toString(ruleNames, stop) {
		ruleNames = ruleNames || null;
		stop = stop || null;
		let p = this;
		let s = "[";
		while (p !== null && p !== stop) {
			if (ruleNames === null) {
				if (!p.isEmpty()) {
					s += p.invokingState;
				}
			} else {
				const ri = p.ruleIndex;
				const ruleName = (ri >= 0 && ri < ruleNames.length) ? ruleNames[ri]
						: "" + ri;
				s += ruleName;
			}
			if (p.parentCtx !== null && (ruleNames !== null || !p.parentCtx.isEmpty())) {
				s += " ";
			}
			p = p.parentCtx;
		}
		s += "]";
		return s;
	}
}

module.exports = RuleContext;

},{"./tree/Tree":45,"./tree/Trees":46}],15:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

/**
 * A token has properties: text, type, line, character position in the line
 * (so we can ignore tabs), token channel, index, and source from which
 * we obtained this token.
 */
class Token {
	constructor() {
		this.source = null;
		this.type = null; // token type of the token
		this.channel = null; // The parser ignores everything not on DEFAULT_CHANNEL
		this.start = null; // optional; return -1 if not implemented.
		this.stop = null; // optional; return -1 if not implemented.
		this.tokenIndex = null; // from 0..n-1 of the token object in the input stream
		this.line = null; // line=1..n of the 1st character
		this.column = null; // beginning of the line at which it occurs, 0..n-1
		this._text = null; // text of the token.
	}

	getTokenSource() {
		return this.source[0];
	}

	getInputStream() {
		return this.source[1];
	}

	get text(){
		return this._text;
	}

	set text(text) {
		this._text = text;
	}
}

Token.INVALID_TYPE = 0;

/**
 * During lookahead operations, this "token" signifies we hit rule end ATN state
 * and did not follow it despite needing to.
 */
Token.EPSILON = -2;

Token.MIN_USER_TOKEN_TYPE = 1;

Token.EOF = -1;

/**
 * All tokens go to the parser (unless skip() is called in that rule)
 * on a particular "channel". The parser tunes to a particular channel
 * so that whitespace etc... can go to the parser on a "hidden" channel.
 */
Token.DEFAULT_CHANNEL = 0;

/**
 * Anything on different channel than DEFAULT_CHANNEL is not parsed
 * by parser.
 */
Token.HIDDEN_CHANNEL = 1;


class CommonToken extends Token {
	constructor(source, type, channel, start, stop) {
		super();
		this.source = source !== undefined ? source : CommonToken.EMPTY_SOURCE;
		this.type = type !== undefined ? type : null;
		this.channel = channel !== undefined ? channel : Token.DEFAULT_CHANNEL;
		this.start = start !== undefined ? start : -1;
		this.stop = stop !== undefined ? stop : -1;
		this.tokenIndex = -1;
		if (this.source[0] !== null) {
			this.line = source[0].line;
			this.column = source[0].column;
		} else {
			this.column = -1;
		}
	}

	/**
	 * Constructs a new {@link CommonToken} as a copy of another {@link Token}.
	 *
	 * <p>
	 * If {@code oldToken} is also a {@link CommonToken} instance, the newly
	 * constructed token will share a reference to the {@link //text} field and
	 * the {@link Pair} stored in {@link //source}. Otherwise, {@link //text} will
	 * be assigned the result of calling {@link //getText}, and {@link //source}
	 * will be constructed from the result of {@link Token//getTokenSource} and
	 * {@link Token//getInputStream}.</p>
	 *
	 * @param oldToken The token to copy.
	 */
	clone() {
		const t = new CommonToken(this.source, this.type, this.channel, this.start, this.stop);
		t.tokenIndex = this.tokenIndex;
		t.line = this.line;
		t.column = this.column;
		t.text = this.text;
		return t;
	}

	toString() {
		let txt = this.text;
		if (txt !== null) {
			txt = txt.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
		} else {
			txt = "<no text>";
		}
		return "[@" + this.tokenIndex + "," + this.start + ":" + this.stop + "='" +
				txt + "',<" + this.type + ">" +
				(this.channel > 0 ? ",channel=" + this.channel : "") + "," +
				this.line + ":" + this.column + "]";
	}

	get text(){
		if (this._text !== null) {
			return this._text;
		}
		const input = this.getInputStream();
		if (input === null) {
			return null;
		}
		const n = input.size;
		if (this.start < n && this.stop < n) {
			return input.getText(this.start, this.stop);
		} else {
			return "<EOF>";
		}
	}

	set text(text) {
		this._text = text;
	}
}

/**
 * An empty {@link Pair} which is used as the default value of
 * {@link //source} for tokens that do not have a source.
 */
CommonToken.EMPTY_SOURCE = [ null, null ];

module.exports = {
	Token,
	CommonToken
}

},{}],16:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

function arrayToString(a) {
    return Array.isArray(a) ? ("[" + a.join(", ") + "]") : "null";
}

String.prototype.seed = String.prototype.seed || Math.round(Math.random() * Math.pow(2, 32));

String.prototype.hashCode = function () {
    const key = this.toString();
    let h1b, k1;

    const remainder = key.length & 3; // key.length % 4
    const bytes = key.length - remainder;
    let h1 = String.prototype.seed;
    const c1 = 0xcc9e2d51;
    const c2 = 0x1b873593;
    let i = 0;

    while (i < bytes) {
        k1 =
            ((key.charCodeAt(i) & 0xff)) |
            ((key.charCodeAt(++i) & 0xff) << 8) |
            ((key.charCodeAt(++i) & 0xff) << 16) |
            ((key.charCodeAt(++i) & 0xff) << 24);
        ++i;

        k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
        k1 = (k1 << 15) | (k1 >>> 17);
        k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

        h1 ^= k1;
        h1 = (h1 << 13) | (h1 >>> 19);
        h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
        h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
    }

    k1 = 0;

    switch (remainder) {
        case 3:
            k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
        case 2:
            k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
        case 1:
            k1 ^= (key.charCodeAt(i) & 0xff);

            k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
            k1 = (k1 << 15) | (k1 >>> 17);
            k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
            h1 ^= k1;
    }

    h1 ^= key.length;

    h1 ^= h1 >>> 16;
    h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
    h1 ^= h1 >>> 13;
    h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
    h1 ^= h1 >>> 16;

    return h1 >>> 0;
};

function standardEqualsFunction(a, b) {
    return a ? a.equals(b) : a==b;
}

function standardHashCodeFunction(a) {
    return a ? a.hashCode() : -1;
}

class Set {
    constructor(hashFunction, equalsFunction) {
        this.data = {};
        this.hashFunction = hashFunction || standardHashCodeFunction;
        this.equalsFunction = equalsFunction || standardEqualsFunction;
    }

    add(value) {
        const hash = this.hashFunction(value);
        const key = "hash_" + hash;
        if (key in this.data) {
            const values = this.data[key];
            for (let i = 0; i < values.length; i++) {
                if (this.equalsFunction(value, values[i])) {
                    return values[i];
                }
            }
            values.push(value);
            return value;
        } else {
            this.data[key] = [value];
            return value;
        }
    }

    contains(value) {
        return this.get(value) != null;
    }

    get(value) {
        const hash = this.hashFunction(value);
        const key = "hash_" + hash;
        if (key in this.data) {
            const values = this.data[key];
            for (let i = 0; i < values.length; i++) {
                if (this.equalsFunction(value, values[i])) {
                    return values[i];
                }
            }
        }
        return null;
    }

    values() {
        let l = [];
        for (const key in this.data) {
            if (key.indexOf("hash_") === 0) {
                l = l.concat(this.data[key]);
            }
        }
        return l;
    }

    toString() {
        return arrayToString(this.values());
    }

    get length(){
        let l = 0;
        for (const key in this.data) {
            if (key.indexOf("hash_") === 0) {
                l = l + this.data[key].length;
            }
        }
        return l;
    }
}


class BitSet {
    constructor() {
        this.data = [];
    }

    add(value) {
        this.data[value] = true;
    }

    or(set) {
        const bits = this;
        Object.keys(set.data).map(function (alt) {
            bits.add(alt);
        });
    }

    remove(value) {
        delete this.data[value];
    }

    contains(value) {
        return this.data[value] === true;
    }

    values() {
        return Object.keys(this.data);
    }

    minValue() {
        return Math.min.apply(null, this.values());
    }

    hashCode() {
        const hash = new Hash();
        hash.update(this.values());
        return hash.finish();
    }

    equals(other) {
        if (!(other instanceof BitSet)) {
            return false;
        }
        return this.hashCode() === other.hashCode();
    }

    toString() {
        return "{" + this.values().join(", ") + "}";
    }

    get length(){
        return this.values().length;
    }
}


class Map {
    constructor(hashFunction, equalsFunction) {
        this.data = {};
        this.hashFunction = hashFunction || standardHashCodeFunction;
        this.equalsFunction = equalsFunction || standardEqualsFunction;
    }

    put(key, value) {
        const hashKey = "hash_" + this.hashFunction(key);
        if (hashKey in this.data) {
            const entries = this.data[hashKey];
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];
                if (this.equalsFunction(key, entry.key)) {
                    const oldValue = entry.value;
                    entry.value = value;
                    return oldValue;
                }
            }
            entries.push({key:key, value:value});
            return value;
        } else {
            this.data[hashKey] = [{key:key, value:value}];
            return value;
        }
    }

    containsKey(key) {
        const hashKey = "hash_" + this.hashFunction(key);
        if(hashKey in this.data) {
            const entries = this.data[hashKey];
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];
                if (this.equalsFunction(key, entry.key))
                    return true;
            }
        }
        return false;
    }

    get(key) {
        const hashKey = "hash_" + this.hashFunction(key);
        if(hashKey in this.data) {
            const entries = this.data[hashKey];
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];
                if (this.equalsFunction(key, entry.key))
                    return entry.value;
            }
        }
        return null;
    }

    entries() {
        let l = [];
        for (const key in this.data) {
            if (key.indexOf("hash_") === 0) {
                l = l.concat(this.data[key]);
            }
        }
        return l;
    }

    getKeys() {
        return this.entries().map(function(e) {
            return e.key;
        });
    }

    getValues() {
        return this.entries().map(function(e) {
                return e.value;
        });
    }

    toString() {
        const ss = this.entries().map(function(entry) {
            return '{' + entry.key + ':' + entry.value + '}';
        });
        return '[' + ss.join(", ") + ']';
    }

    get length(){
        let l = 0;
        for (const hashKey in this.data) {
            if (hashKey.indexOf("hash_") === 0) {
                l = l + this.data[hashKey].length;
            }
        }
        return l;
    }
}


class AltDict {
    constructor() {
        this.data = {};
    }

    get(key) {
        key = "k-" + key;
        if (key in this.data) {
            return this.data[key];
        } else {
            return null;
        }
    }

    put(key, value) {
        key = "k-" + key;
        this.data[key] = value;
    }

    values() {
        const data = this.data;
        const keys = Object.keys(this.data);
        return keys.map(function (key) {
            return data[key];
        });
    }
}


class DoubleDict {
    constructor(defaultMapCtor) {
        this.defaultMapCtor = defaultMapCtor || Map;
        this.cacheMap = new this.defaultMapCtor();
    }

    get(a, b) {
        const d = this.cacheMap.get(a) || null;
        return d === null ? null : (d.get(b) || null);
    }

    set(a, b, o) {
        let d = this.cacheMap.get(a) || null;
        if (d === null) {
            d = new this.defaultMapCtor();
            this.cacheMap.put(a, d);
        }
        d.put(b, o);
    }
}

class Hash {
    constructor() {
        this.count = 0;
        this.hash = 0;
    }

    update() {
        for(let i=0;i<arguments.length;i++) {
            const value = arguments[i];
            if (value == null)
                continue;
            if(Array.isArray(value))
                this.update.apply(this, value);
            else {
                let k = 0;
                switch (typeof(value)) {
                    case 'undefined':
                    case 'function':
                        continue;
                    case 'number':
                    case 'boolean':
                        k = value;
                        break;
                    case 'string':
                        k = value.hashCode();
                        break;
                    default:
                        if(value.updateHashCode)
                            value.updateHashCode(this);
                        else
                            console.log("No updateHashCode for " + value.toString())
                        continue;
                }
                k = k * 0xCC9E2D51;
                k = (k << 15) | (k >>> (32 - 15));
                k = k * 0x1B873593;
                this.count = this.count + 1;
                let hash = this.hash ^ k;
                hash = (hash << 13) | (hash >>> (32 - 13));
                hash = hash * 5 + 0xE6546B64;
                this.hash = hash;
            }
        }
    }

    finish() {
        let hash = this.hash ^ (this.count * 4);
        hash = hash ^ (hash >>> 16);
        hash = hash * 0x85EBCA6B;
        hash = hash ^ (hash >>> 13);
        hash = hash * 0xC2B2AE35;
        hash = hash ^ (hash >>> 16);
        return hash;
    }
}

function hashStuff() {
    const hash = new Hash();
    hash.update.apply(hash, arguments);
    return hash.finish();
}


function escapeWhitespace(s, escapeSpaces) {
    s = s.replace(/\t/g, "\\t")
         .replace(/\n/g, "\\n")
         .replace(/\r/g, "\\r");
    if (escapeSpaces) {
        s = s.replace(/ /g, "\u00B7");
    }
    return s;
}

function titleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1);
    });
}

function equalArrays(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b))
        return false;
    if (a === b)
        return true;
    if (a.length !== b.length)
        return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] === b[i])
            continue;
        if (!a[i].equals || !a[i].equals(b[i]))
            return false;
    }
    return true;
}

module.exports = {
    Hash,
    Set,
    Map,
    BitSet,
    AltDict,
    DoubleDict,
    hashStuff,
    escapeWhitespace,
    arrayToString,
    titleCase,
    equalArrays
}

},{}],17:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const LL1Analyzer = require('./../LL1Analyzer');
const {IntervalSet} = require('./../IntervalSet');
const {Token} = require('./../Token');

class ATN {

    constructor(grammarType , maxTokenType) {
        /**
         * Used for runtime deserialization of ATNs from strings
         * The type of the ATN.
        */
        this.grammarType = grammarType;
        // The maximum value for any symbol recognized by a transition in the ATN.
        this.maxTokenType = maxTokenType;
        this.states = [];
        /**
         * Each subrule/rule is a decision point and we must track them so we
         * can go back later and build DFA predictors for them.  This includes
         * all the rules, subrules, optional blocks, ()+, ()* etc...
         */
        this.decisionToState = [];
        // Maps from rule index to starting state number.
        this.ruleToStartState = [];
        // Maps from rule index to stop state number.
        this.ruleToStopState = null;
        this.modeNameToStartState = {};
        /**
         * For lexer ATNs, this maps the rule index to the resulting token type.
         * For parser ATNs, this maps the rule index to the generated bypass token
         * type if the {@link ATNDeserializationOptions//isGenerateRuleBypassTransitions}
         * deserialization option was specified; otherwise, this is {@code null}
         */
        this.ruleToTokenType = null;
        /**
         * For lexer ATNs, this is an array of {@link LexerAction} objects which may
         * be referenced by action transitions in the ATN
         */
        this.lexerActions = null;
        this.modeToStartState = [];
    }

    /**
     * Compute the set of valid tokens that can occur starting in state {@code s}.
     * If {@code ctx} is null, the set of tokens will not include what can follow
     * the rule surrounding {@code s}. In other words, the set will be
     * restricted to tokens reachable staying within {@code s}'s rule
     */
    nextTokensInContext(s, ctx) {
        const anal = new LL1Analyzer(this);
        return anal.LOOK(s, null, ctx);
    }

    /**
     * Compute the set of valid tokens that can occur starting in {@code s} and
     * staying in same rule. {@link Token//EPSILON} is in set if we reach end of
     * rule
     */
    nextTokensNoContext(s) {
        if (s.nextTokenWithinRule !== null ) {
            return s.nextTokenWithinRule;
        }
        s.nextTokenWithinRule = this.nextTokensInContext(s, null);
        s.nextTokenWithinRule.readOnly = true;
        return s.nextTokenWithinRule;
    }

    nextTokens(s, ctx) {
        if ( ctx===undefined ) {
            return this.nextTokensNoContext(s);
        } else {
            return this.nextTokensInContext(s, ctx);
        }
    }

    addState(state) {
        if ( state !== null ) {
            state.atn = this;
            state.stateNumber = this.states.length;
        }
        this.states.push(state);
    }

    removeState(state) {
        this.states[state.stateNumber] = null; // just free mem, don't shift states in list
    }

    defineDecisionState(s) {
        this.decisionToState.push(s);
        s.decision = this.decisionToState.length-1;
        return s.decision;
    }

    getDecisionState(decision) {
        if (this.decisionToState.length===0) {
            return null;
        } else {
            return this.decisionToState[decision];
        }
    }

    /**
     * Computes the set of input symbols which could follow ATN state number
     * {@code stateNumber} in the specified full {@code context}. This method
     * considers the complete parser context, but does not evaluate semantic
     * predicates (i.e. all predicates encountered during the calculation are
     * assumed true). If a path in the ATN exists from the starting state to the
     * {@link RuleStopState} of the outermost context without matching any
     * symbols, {@link Token//EOF} is added to the returned set.
     *
     * <p>If {@code context} is {@code null}, it is treated as
     * {@link ParserRuleContext//EMPTY}.</p>
     *
     * @param stateNumber the ATN state number
     * @param ctx the full parse context
     *
     * @return {IntervalSet} The set of potentially valid input symbols which could follow the
     * specified state in the specified context.
     *
     * @throws IllegalArgumentException if the ATN does not contain a state with
     * number {@code stateNumber}
     */
    getExpectedTokens(stateNumber, ctx ) {
        if ( stateNumber < 0 || stateNumber >= this.states.length ) {
            throw("Invalid state number.");
        }
        const s = this.states[stateNumber];
        let following = this.nextTokens(s);
        if (!following.contains(Token.EPSILON)) {
            return following;
        }
        const expected = new IntervalSet();
        expected.addSet(following);
        expected.removeOne(Token.EPSILON);
        while (ctx !== null && ctx.invokingState >= 0 && following.contains(Token.EPSILON)) {
            const invokingState = this.states[ctx.invokingState];
            const rt = invokingState.transitions[0];
            following = this.nextTokens(rt.followState);
            expected.addSet(following);
            expected.removeOne(Token.EPSILON);
            ctx = ctx.parentCtx;
        }
        if (following.contains(Token.EPSILON)) {
            expected.addOne(Token.EOF);
        }
        return expected;
    }
}

ATN.INVALID_ALT_NUMBER = 0;

module.exports = ATN;

},{"./../IntervalSet":7,"./../LL1Analyzer":8,"./../Token":15}],18:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const {DecisionState} = require('./ATNState');
const {SemanticContext} = require('./SemanticContext');
const {Hash} = require("../Utils");


function checkParams(params, isCfg) {
	if(params===null) {
		const result = { state:null, alt:null, context:null, semanticContext:null };
		if(isCfg) {
			result.reachesIntoOuterContext = 0;
		}
		return result;
	} else {
		const props = {};
		props.state = params.state || null;
		props.alt = (params.alt === undefined) ? null : params.alt;
		props.context = params.context || null;
		props.semanticContext = params.semanticContext || null;
		if(isCfg) {
			props.reachesIntoOuterContext = params.reachesIntoOuterContext || 0;
			props.precedenceFilterSuppressed = params.precedenceFilterSuppressed || false;
		}
		return props;
	}
}

class ATNConfig {
    /**
     * @param {Object} params A tuple: (ATN state, predicted alt, syntactic, semantic context).
     * The syntactic context is a graph-structured stack node whose
     * path(s) to the root is the rule invocation(s)
     * chain used to arrive at the state.  The semantic context is
     * the tree of semantic predicates encountered before reaching
     * an ATN state
     */
    constructor(params, config) {
        this.checkContext(params, config);
        params = checkParams(params);
        config = checkParams(config, true);
        // The ATN state associated with this configuration///
        this.state = params.state!==null ? params.state : config.state;
        // What alt (or lexer rule) is predicted by this configuration///
        this.alt = params.alt!==null ? params.alt : config.alt;
        /**
         * The stack of invoking states leading to the rule/states associated
         * with this config.  We track only those contexts pushed during
         * execution of the ATN simulator
         */
        this.context = params.context!==null ? params.context : config.context;
        this.semanticContext = params.semanticContext!==null ? params.semanticContext :
            (config.semanticContext!==null ? config.semanticContext : SemanticContext.NONE);
        // TODO: make it a boolean then
        /**
         * We cannot execute predicates dependent upon local context unless
         * we know for sure we are in the correct context. Because there is
         * no way to do this efficiently, we simply cannot evaluate
         * dependent predicates unless we are in the rule that initially
         * invokes the ATN simulator.
         * closure() tracks the depth of how far we dip into the
         * outer context: depth &gt; 0.  Note that it may not be totally
         * accurate depth since I don't ever decrement
         */
        this.reachesIntoOuterContext = config.reachesIntoOuterContext;
        this.precedenceFilterSuppressed = config.precedenceFilterSuppressed;
    }

    checkContext(params, config) {
        if((params.context===null || params.context===undefined) &&
                (config===null || config.context===null || config.context===undefined)) {
            this.context = null;
        }
    }

    hashCode() {
        const hash = new Hash();
        this.updateHashCode(hash);
        return hash.finish();
    }

    updateHashCode(hash) {
        hash.update(this.state.stateNumber, this.alt, this.context, this.semanticContext);
    }

    /**
     * An ATN configuration is equal to another if both have
     * the same state, they predict the same alternative, and
     * syntactic/semantic contexts are the same
     */
    equals(other) {
        if (this === other) {
            return true;
        } else if (! (other instanceof ATNConfig)) {
            return false;
        } else {
            return this.state.stateNumber===other.state.stateNumber &&
                this.alt===other.alt &&
                (this.context===null ? other.context===null : this.context.equals(other.context)) &&
                this.semanticContext.equals(other.semanticContext) &&
                this.precedenceFilterSuppressed===other.precedenceFilterSuppressed;
        }
    }

    hashCodeForConfigSet() {
        const hash = new Hash();
        hash.update(this.state.stateNumber, this.alt, this.semanticContext);
        return hash.finish();
    }

    equalsForConfigSet(other) {
        if (this === other) {
            return true;
        } else if (! (other instanceof ATNConfig)) {
            return false;
        } else {
            return this.state.stateNumber===other.state.stateNumber &&
                this.alt===other.alt &&
                this.semanticContext.equals(other.semanticContext);
        }
    }

    toString() {
        return "(" + this.state + "," + this.alt +
            (this.context!==null ? ",[" + this.context.toString() + "]" : "") +
            (this.semanticContext !== SemanticContext.NONE ?
                    ("," + this.semanticContext.toString())
                    : "") +
            (this.reachesIntoOuterContext>0 ?
                    (",up=" + this.reachesIntoOuterContext)
                    : "") + ")";
    }
}


class LexerATNConfig extends ATNConfig {
    constructor(params, config) {
        super(params, config);

        // This is the backing field for {@link //getLexerActionExecutor}.
        const lexerActionExecutor = params.lexerActionExecutor || null;
        this.lexerActionExecutor = lexerActionExecutor || (config!==null ? config.lexerActionExecutor : null);
        this.passedThroughNonGreedyDecision = config!==null ? this.checkNonGreedyDecision(config, this.state) : false;
        this.hashCodeForConfigSet = LexerATNConfig.prototype.hashCode;
        this.equalsForConfigSet = LexerATNConfig.prototype.equals;
        return this;
    }

    updateHashCode(hash) {
        hash.update(this.state.stateNumber, this.alt, this.context, this.semanticContext, this.passedThroughNonGreedyDecision, this.lexerActionExecutor);
    }

    equals(other) {
        return this === other ||
                (other instanceof LexerATNConfig &&
                this.passedThroughNonGreedyDecision === other.passedThroughNonGreedyDecision &&
                (this.lexerActionExecutor ? this.lexerActionExecutor.equals(other.lexerActionExecutor) : !other.lexerActionExecutor) &&
                super.equals(other));
    }

    checkNonGreedyDecision(source, target) {
        return source.passedThroughNonGreedyDecision ||
            (target instanceof DecisionState) && target.nonGreedy;
    }
}


module.exports.ATNConfig = ATNConfig;
module.exports.LexerATNConfig = LexerATNConfig;

},{"../Utils":16,"./ATNState":23,"./SemanticContext":30}],19:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const ATN = require('./ATN');
const Utils = require('./../Utils');
const {SemanticContext} = require('./SemanticContext');
const {merge} = require('./../PredictionContext');

function hashATNConfig(c) {
	return c.hashCodeForConfigSet();
}

function equalATNConfigs(a, b) {
	if ( a===b ) {
		return true;
	} else if ( a===null || b===null ) {
		return false;
	} else
       return a.equalsForConfigSet(b);
 }

/**
 * Specialized {@link Set}{@code <}{@link ATNConfig}{@code >} that can track
 * info about the set, with support for combining similar configurations using a
 * graph-structured stack
 */
class ATNConfigSet {
	constructor(fullCtx) {
		/**
		 * The reason that we need this is because we don't want the hash map to use
		 * the standard hash code and equals. We need all configurations with the
		 * same
		 * {@code (s,i,_,semctx)} to be equal. Unfortunately, this key effectively
		 * doubles
		 * the number of objects associated with ATNConfigs. The other solution is
		 * to
		 * use a hash table that lets us specify the equals/hashcode operation.
		 * All configs but hashed by (s, i, _, pi) not including context. Wiped out
		 * when we go readonly as this set becomes a DFA state
		 */
		this.configLookup = new Utils.Set(hashATNConfig, equalATNConfigs);
		/**
		 * Indicates that this configuration set is part of a full context
		 * LL prediction. It will be used to determine how to merge $. With SLL
		 * it's a wildcard whereas it is not for LL context merge
		 */
		this.fullCtx = fullCtx === undefined ? true : fullCtx;
		/**
		 * Indicates that the set of configurations is read-only. Do not
		 * allow any code to manipulate the set; DFA states will point at
		 * the sets and they must not change. This does not protect the other
		 * fields; in particular, conflictingAlts is set after
		 * we've made this readonly
		 */
		this.readOnly = false;
		// Track the elements as they are added to the set; supports get(i)///
		this.configs = [];

		// TODO: these fields make me pretty uncomfortable but nice to pack up info
		// together, saves recomputation
		// TODO: can we track conflicts as they are added to save scanning configs
		// later?
		this.uniqueAlt = 0;
		this.conflictingAlts = null;

		/**
		 * Used in parser and lexer. In lexer, it indicates we hit a pred
		 * while computing a closure operation. Don't make a DFA state from this
		 */
		this.hasSemanticContext = false;
		this.dipsIntoOuterContext = false;

		this.cachedHashCode = -1;
	}

	/**
	 * Adding a new config means merging contexts with existing configs for
	 * {@code (s, i, pi, _)}, where {@code s} is the
	 * {@link ATNConfig//state}, {@code i} is the {@link ATNConfig//alt}, and
	 * {@code pi} is the {@link ATNConfig//semanticContext}. We use
	 * {@code (s,i,pi)} as key.
	 *
	 * <p>This method updates {@link //dipsIntoOuterContext} and
	 * {@link //hasSemanticContext} when necessary.</p>
	 */
	add(config, mergeCache) {
		if (mergeCache === undefined) {
			mergeCache = null;
		}
		if (this.readOnly) {
			throw "This set is readonly";
		}
		if (config.semanticContext !== SemanticContext.NONE) {
			this.hasSemanticContext = true;
		}
		if (config.reachesIntoOuterContext > 0) {
			this.dipsIntoOuterContext = true;
		}
		const existing = this.configLookup.add(config);
		if (existing === config) {
			this.cachedHashCode = -1;
			this.configs.push(config); // track order here
			return true;
		}
		// a previous (s,i,pi,_), merge with it and save result
		const rootIsWildcard = !this.fullCtx;
		const merged = merge(existing.context, config.context, rootIsWildcard, mergeCache);
		/**
		 * no need to check for existing.context, config.context in cache
		 * since only way to create new graphs is "call rule" and here. We
		 * cache at both places
		 */
		existing.reachesIntoOuterContext = Math.max( existing.reachesIntoOuterContext, config.reachesIntoOuterContext);
		// make sure to preserve the precedence filter suppression during the merge
		if (config.precedenceFilterSuppressed) {
			existing.precedenceFilterSuppressed = true;
		}
		existing.context = merged; // replace context; no need to alt mapping
		return true;
	}

	getStates() {
		const states = new Utils.Set();
		for (let i = 0; i < this.configs.length; i++) {
			states.add(this.configs[i].state);
		}
		return states;
	}

	getPredicates() {
		const preds = [];
		for (let i = 0; i < this.configs.length; i++) {
			const c = this.configs[i].semanticContext;
			if (c !== SemanticContext.NONE) {
				preds.push(c.semanticContext);
			}
		}
		return preds;
	}

	optimizeConfigs(interpreter) {
		if (this.readOnly) {
			throw "This set is readonly";
		}
		if (this.configLookup.length === 0) {
			return;
		}
		for (let i = 0; i < this.configs.length; i++) {
			const config = this.configs[i];
			config.context = interpreter.getCachedContext(config.context);
		}
	}

	addAll(coll) {
		for (let i = 0; i < coll.length; i++) {
			this.add(coll[i]);
		}
		return false;
	}

	equals(other) {
		return this === other ||
			(other instanceof ATNConfigSet &&
			Utils.equalArrays(this.configs, other.configs) &&
			this.fullCtx === other.fullCtx &&
			this.uniqueAlt === other.uniqueAlt &&
			this.conflictingAlts === other.conflictingAlts &&
			this.hasSemanticContext === other.hasSemanticContext &&
			this.dipsIntoOuterContext === other.dipsIntoOuterContext);
	}

	hashCode() {
		const hash = new Utils.Hash();
		hash.update(this.configs);
		return hash.finish();
	}

	updateHashCode(hash) {
		if (this.readOnly) {
			if (this.cachedHashCode === -1) {
				this.cachedHashCode = this.hashCode();
			}
			hash.update(this.cachedHashCode);
		} else {
			hash.update(this.hashCode());
		}
	}

	isEmpty() {
		return this.configs.length === 0;
	}

	contains(item) {
		if (this.configLookup === null) {
			throw "This method is not implemented for readonly sets.";
		}
		return this.configLookup.contains(item);
	}

	containsFast(item) {
		if (this.configLookup === null) {
			throw "This method is not implemented for readonly sets.";
		}
		return this.configLookup.containsFast(item);
	}

	clear() {
		if (this.readOnly) {
			throw "This set is readonly";
		}
		this.configs = [];
		this.cachedHashCode = -1;
		this.configLookup = new Utils.Set();
	}

	setReadonly(readOnly) {
		this.readOnly = readOnly;
		if (readOnly) {
			this.configLookup = null; // can't mod, no need for lookup cache
		}
	}

	toString() {
		return Utils.arrayToString(this.configs) +
			(this.hasSemanticContext ? ",hasSemanticContext=" + this.hasSemanticContext : "") +
			(this.uniqueAlt !== ATN.INVALID_ALT_NUMBER ? ",uniqueAlt=" + this.uniqueAlt : "") +
			(this.conflictingAlts !== null ? ",conflictingAlts=" + this.conflictingAlts : "") +
			(this.dipsIntoOuterContext ? ",dipsIntoOuterContext" : "");
	}

	get items(){
		return this.configs;
	}

	get length(){
		return this.configs.length;
	}
}


class OrderedATNConfigSet extends ATNConfigSet {
	constructor() {
		super();
		this.configLookup = new Utils.Set();
	}
}

module.exports = {
	ATNConfigSet,
	OrderedATNConfigSet
}

},{"./../PredictionContext":12,"./../Utils":16,"./ATN":17,"./SemanticContext":30}],20:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

class ATNDeserializationOptions {
	constructor(copyFrom) {
		if(copyFrom===undefined) {
			copyFrom = null;
		}
		this.readOnly = false;
		this.verifyATN = copyFrom===null ? true : copyFrom.verifyATN;
		this.generateRuleBypassTransitions = copyFrom===null ? false : copyFrom.generateRuleBypassTransitions;
	}
}

ATNDeserializationOptions.defaultOptions = new ATNDeserializationOptions();
ATNDeserializationOptions.defaultOptions.readOnly = true;

//    def __setattr__(self, key, value):
//        if key!="readOnly" and self.readOnly:
//            raise Exception("The object is read only.")
//        super(type(self), self).__setattr__(key,value)

module.exports = ATNDeserializationOptions

},{}],21:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const {Token} = require('./../Token');
const ATN = require('./ATN');
const ATNType = require('./ATNType');

const {
    ATNState,
    BasicState,
    DecisionState,
    BlockStartState,
    BlockEndState,
    LoopEndState,
    RuleStartState,
    RuleStopState,
    TokensStartState,
    PlusLoopbackState,
    StarLoopbackState,
    StarLoopEntryState,
    PlusBlockStartState,
    StarBlockStartState,
    BasicBlockStartState
} = require('./ATNState');

const {
    Transition,
    AtomTransition,
    SetTransition,
    NotSetTransition,
    RuleTransition,
    RangeTransition,
    ActionTransition,
    EpsilonTransition,
    WildcardTransition,
    PredicateTransition,
    PrecedencePredicateTransition
} = require('./Transition')

const {IntervalSet} = require('./../IntervalSet');
const ATNDeserializationOptions = require('./ATNDeserializationOptions');

const {
    LexerActionType,
    LexerSkipAction,
    LexerChannelAction,
    LexerCustomAction,
    LexerMoreAction,
    LexerTypeAction,
    LexerPushModeAction,
    LexerPopModeAction,
    LexerModeAction,
} = require('./LexerAction');

// This is the earliest supported serialized UUID.
// stick to serialized version for now, we don't need a UUID instance
const BASE_SERIALIZED_UUID = "AADB8D7E-AEEF-4415-AD2B-8204D6CF042E";

//
// This UUID indicates the serialized ATN contains two sets of
// IntervalSets, where the second set's values are encoded as
// 32-bit integers to support the full Unicode SMP range up to U+10FFFF.
//
const ADDED_UNICODE_SMP = "59627784-3BE5-417A-B9EB-8131A7286089";

// This list contains all of the currently supported UUIDs, ordered by when
// the feature first appeared in this branch.
const SUPPORTED_UUIDS = [ BASE_SERIALIZED_UUID, ADDED_UNICODE_SMP ];

const SERIALIZED_VERSION = 3;

// This is the current serialized UUID.
const SERIALIZED_UUID = ADDED_UNICODE_SMP;

function initArray( length, value) {
	const tmp = [];
	tmp[length-1] = value;
	return tmp.map(function(i) {return value;});
}

class ATNDeserializer {
    constructor(options) {

        if ( options=== undefined || options === null ) {
            options = ATNDeserializationOptions.defaultOptions;
        }
        this.deserializationOptions = options;
        this.stateFactories = null;
        this.actionFactories = null;
    }

    /**
     * Determines if a particular serialized representation of an ATN supports
     * a particular feature, identified by the {@link UUID} used for serializing
     * the ATN at the time the feature was first introduced.
     *
     * @param feature The {@link UUID} marking the first time the feature was
     * supported in the serialized ATN.
     * @param actualUuid The {@link UUID} of the actual serialized ATN which is
     * currently being deserialized.
     * @return {@code true} if the {@code actualUuid} value represents a
     * serialized ATN at or after the feature identified by {@code feature} was
     * introduced; otherwise, {@code false}.
    */
    isFeatureSupported(feature, actualUuid) {
        const idx1 = SUPPORTED_UUIDS.indexOf(feature);
        if (idx1<0) {
            return false;
        }
        const idx2 = SUPPORTED_UUIDS.indexOf(actualUuid);
        return idx2 >= idx1;
    }

    deserialize(data) {
        this.reset(data);
        this.checkVersion();
        this.checkUUID();
        const atn = this.readATN();
        this.readStates(atn);
        this.readRules(atn);
        this.readModes(atn);
        const sets = [];
        // First, deserialize sets with 16-bit arguments <= U+FFFF.
        this.readSets(atn, sets, this.readInt.bind(this));
        // Next, if the ATN was serialized with the Unicode SMP feature,
        // deserialize sets with 32-bit arguments <= U+10FFFF.
        if (this.isFeatureSupported(ADDED_UNICODE_SMP, this.uuid)) {
            this.readSets(atn, sets, this.readInt32.bind(this));
        }
        this.readEdges(atn, sets);
        this.readDecisions(atn);
        this.readLexerActions(atn);
        this.markPrecedenceDecisions(atn);
        this.verifyATN(atn);
        if (this.deserializationOptions.generateRuleBypassTransitions && atn.grammarType === ATNType.PARSER ) {
            this.generateRuleBypassTransitions(atn);
            // re-verify after modification
            this.verifyATN(atn);
        }
        return atn;
    }

    reset(data) {
        const adjust = function(c) {
            const v = c.charCodeAt(0);
            return v>1  ? v-2 : v + 65534;
        };
        const temp = data.split("").map(adjust);
        // don't adjust the first value since that's the version number
        temp[0] = data.charCodeAt(0);
        this.data = temp;
        this.pos = 0;
    }

    checkVersion() {
        const version = this.readInt();
        if ( version !== SERIALIZED_VERSION ) {
            throw ("Could not deserialize ATN with version " + version + " (expected " + SERIALIZED_VERSION + ").");
        }
    }

    checkUUID() {
        const uuid = this.readUUID();
        if (SUPPORTED_UUIDS.indexOf(uuid)<0) {
            throw ("Could not deserialize ATN with UUID: " + uuid +
                            " (expected " + SERIALIZED_UUID + " or a legacy UUID).", uuid, SERIALIZED_UUID);
        }
        this.uuid = uuid;
    }

    readATN() {
        const grammarType = this.readInt();
        const maxTokenType = this.readInt();
        return new ATN(grammarType, maxTokenType);
    }

    readStates(atn) {
        let j, pair, stateNumber;
        const  loopBackStateNumbers = [];
        const  endStateNumbers = [];
        const  nstates = this.readInt();
        for(let i=0; i<nstates; i++) {
            const  stype = this.readInt();
            // ignore bad type of states
            if (stype===ATNState.INVALID_TYPE) {
                atn.addState(null);
                continue;
            }
            let ruleIndex = this.readInt();
            if (ruleIndex === 0xFFFF) {
                ruleIndex = -1;
            }
            const  s = this.stateFactory(stype, ruleIndex);
            if (stype === ATNState.LOOP_END) { // special case
                const  loopBackStateNumber = this.readInt();
                loopBackStateNumbers.push([s, loopBackStateNumber]);
            } else if(s instanceof BlockStartState) {
                const  endStateNumber = this.readInt();
                endStateNumbers.push([s, endStateNumber]);
            }
            atn.addState(s);
        }
        // delay the assignment of loop back and end states until we know all the
        // state instances have been initialized
        for (j=0; j<loopBackStateNumbers.length; j++) {
            pair = loopBackStateNumbers[j];
            pair[0].loopBackState = atn.states[pair[1]];
        }

        for (j=0; j<endStateNumbers.length; j++) {
            pair = endStateNumbers[j];
            pair[0].endState = atn.states[pair[1]];
        }

        let numNonGreedyStates = this.readInt();
        for (j=0; j<numNonGreedyStates; j++) {
            stateNumber = this.readInt();
            atn.states[stateNumber].nonGreedy = true;
        }

        let numPrecedenceStates = this.readInt();
        for (j=0; j<numPrecedenceStates; j++) {
            stateNumber = this.readInt();
            atn.states[stateNumber].isPrecedenceRule = true;
        }
    }

    readRules(atn) {
        let i;
        const nrules = this.readInt();
        if (atn.grammarType === ATNType.LEXER ) {
            atn.ruleToTokenType = initArray(nrules, 0);
        }
        atn.ruleToStartState = initArray(nrules, 0);
        for (i=0; i<nrules; i++) {
            const s = this.readInt();
            atn.ruleToStartState[i] = atn.states[s];
            if ( atn.grammarType === ATNType.LEXER ) {
                let tokenType = this.readInt();
                if (tokenType === 0xFFFF) {
                    tokenType = Token.EOF;
                }
                atn.ruleToTokenType[i] = tokenType;
            }
        }
        atn.ruleToStopState = initArray(nrules, 0);
        for (i=0; i<atn.states.length; i++) {
            const state = atn.states[i];
            if (!(state instanceof RuleStopState)) {
                continue;
            }
            atn.ruleToStopState[state.ruleIndex] = state;
            atn.ruleToStartState[state.ruleIndex].stopState = state;
        }
    }

    readModes(atn) {
        const nmodes = this.readInt();
        for (let i=0; i<nmodes; i++) {
            let s = this.readInt();
            atn.modeToStartState.push(atn.states[s]);
        }
    }

    readSets(atn, sets, readUnicode) {
        const m = this.readInt();
        for (let i=0; i<m; i++) {
            const iset = new IntervalSet();
            sets.push(iset);
            const n = this.readInt();
            const containsEof = this.readInt();
            if (containsEof!==0) {
                iset.addOne(-1);
            }
            for (let j=0; j<n; j++) {
                const i1 = readUnicode();
                const i2 = readUnicode();
                iset.addRange(i1, i2);
            }
        }
    }

    readEdges(atn, sets) {
        let i, j, state, trans, target;
        const nedges = this.readInt();
        for (i=0; i<nedges; i++) {
            const src = this.readInt();
            const trg = this.readInt();
            const ttype = this.readInt();
            const arg1 = this.readInt();
            const arg2 = this.readInt();
            const arg3 = this.readInt();
            trans = this.edgeFactory(atn, ttype, src, trg, arg1, arg2, arg3, sets);
            const srcState = atn.states[src];
            srcState.addTransition(trans);
        }
        // edges for rule stop states can be derived, so they aren't serialized
        for (i=0; i<atn.states.length; i++) {
            state = atn.states[i];
            for (j=0; j<state.transitions.length; j++) {
                const t = state.transitions[j];
                if (!(t instanceof RuleTransition)) {
                    continue;
                }
                let outermostPrecedenceReturn = -1;
                if (atn.ruleToStartState[t.target.ruleIndex].isPrecedenceRule) {
                    if (t.precedence === 0) {
                        outermostPrecedenceReturn = t.target.ruleIndex;
                    }
                }

                trans = new EpsilonTransition(t.followState, outermostPrecedenceReturn);
                atn.ruleToStopState[t.target.ruleIndex].addTransition(trans);
            }
        }

        for (i=0; i<atn.states.length; i++) {
            state = atn.states[i];
            if (state instanceof BlockStartState) {
                // we need to know the end state to set its start state
                if (state.endState === null) {
                    throw ("IllegalState");
                }
                // block end states can only be associated to a single block start
                // state
                if ( state.endState.startState !== null) {
                    throw ("IllegalState");
                }
                state.endState.startState = state;
            }
            if (state instanceof PlusLoopbackState) {
                for (j=0; j<state.transitions.length; j++) {
                    target = state.transitions[j].target;
                    if (target instanceof PlusBlockStartState) {
                        target.loopBackState = state;
                    }
                }
            } else if (state instanceof StarLoopbackState) {
                for (j=0; j<state.transitions.length; j++) {
                    target = state.transitions[j].target;
                    if (target instanceof StarLoopEntryState) {
                        target.loopBackState = state;
                    }
                }
            }
        }
    }

    readDecisions(atn) {
        const ndecisions = this.readInt();
        for (let i=0; i<ndecisions; i++) {
            const s = this.readInt();
            const decState = atn.states[s];
            atn.decisionToState.push(decState);
            decState.decision = i;
        }
    }

    readLexerActions(atn) {
        if (atn.grammarType === ATNType.LEXER) {
            const count = this.readInt();
            atn.lexerActions = initArray(count, null);
            for (let i=0; i<count; i++) {
                const actionType = this.readInt();
                let data1 = this.readInt();
                if (data1 === 0xFFFF) {
                    data1 = -1;
                }
                let data2 = this.readInt();
                if (data2 === 0xFFFF) {
                    data2 = -1;
                }

                atn.lexerActions[i] = this.lexerActionFactory(actionType, data1, data2);
            }
        }
    }

    generateRuleBypassTransitions(atn) {
        let i;
        const count = atn.ruleToStartState.length;
        for(i=0; i<count; i++) {
            atn.ruleToTokenType[i] = atn.maxTokenType + i + 1;
        }
        for(i=0; i<count; i++) {
            this.generateRuleBypassTransition(atn, i);
        }
    }

    generateRuleBypassTransition(atn, idx) {
        let i, state;
        const bypassStart = new BasicBlockStartState();
        bypassStart.ruleIndex = idx;
        atn.addState(bypassStart);

        const bypassStop = new BlockEndState();
        bypassStop.ruleIndex = idx;
        atn.addState(bypassStop);

        bypassStart.endState = bypassStop;
        atn.defineDecisionState(bypassStart);

        bypassStop.startState = bypassStart;

        let excludeTransition = null;
        let endState = null;

        if (atn.ruleToStartState[idx].isPrecedenceRule) {
            // wrap from the beginning of the rule to the StarLoopEntryState
            endState = null;
            for(i=0; i<atn.states.length; i++) {
                state = atn.states[i];
                if (this.stateIsEndStateFor(state, idx)) {
                    endState = state;
                    excludeTransition = state.loopBackState.transitions[0];
                    break;
                }
            }
            if (excludeTransition === null) {
                throw ("Couldn't identify final state of the precedence rule prefix section.");
            }
        } else {
            endState = atn.ruleToStopState[idx];
        }

        // all non-excluded transitions that currently target end state need to
        // target blockEnd instead
        for(i=0; i<atn.states.length; i++) {
            state = atn.states[i];
            for(let j=0; j<state.transitions.length; j++) {
                const transition = state.transitions[j];
                if (transition === excludeTransition) {
                    continue;
                }
                if (transition.target === endState) {
                    transition.target = bypassStop;
                }
            }
        }

        // all transitions leaving the rule start state need to leave blockStart
        // instead
        const ruleToStartState = atn.ruleToStartState[idx];
        const count = ruleToStartState.transitions.length;
        while ( count > 0) {
            bypassStart.addTransition(ruleToStartState.transitions[count-1]);
            ruleToStartState.transitions = ruleToStartState.transitions.slice(-1);
        }
        // link the new states
        atn.ruleToStartState[idx].addTransition(new EpsilonTransition(bypassStart));
        bypassStop.addTransition(new EpsilonTransition(endState));

        const matchState = new BasicState();
        atn.addState(matchState);
        matchState.addTransition(new AtomTransition(bypassStop, atn.ruleToTokenType[idx]));
        bypassStart.addTransition(new EpsilonTransition(matchState));
    }

    stateIsEndStateFor(state, idx) {
        if ( state.ruleIndex !== idx) {
            return null;
        }
        if (!( state instanceof StarLoopEntryState)) {
            return null;
        }
        const maybeLoopEndState = state.transitions[state.transitions.length - 1].target;
        if (!( maybeLoopEndState instanceof LoopEndState)) {
            return null;
        }
        if (maybeLoopEndState.epsilonOnlyTransitions &&
            (maybeLoopEndState.transitions[0].target instanceof RuleStopState)) {
            return state;
        } else {
            return null;
        }
    }

    /**
     * Analyze the {@link StarLoopEntryState} states in the specified ATN to set
     * the {@link StarLoopEntryState//isPrecedenceDecision} field to the
     * correct value.
     * @param atn The ATN.
     */
    markPrecedenceDecisions(atn) {
        for(let i=0; i<atn.states.length; i++) {
            const state = atn.states[i];
            if (!( state instanceof StarLoopEntryState)) {
                continue;
            }
            // We analyze the ATN to determine if this ATN decision state is the
            // decision for the closure block that determines whether a
            // precedence rule should continue or complete.
            if ( atn.ruleToStartState[state.ruleIndex].isPrecedenceRule) {
                const maybeLoopEndState = state.transitions[state.transitions.length - 1].target;
                if (maybeLoopEndState instanceof LoopEndState) {
                    if ( maybeLoopEndState.epsilonOnlyTransitions &&
                            (maybeLoopEndState.transitions[0].target instanceof RuleStopState)) {
                        state.isPrecedenceDecision = true;
                    }
                }
            }
        }
    }

    verifyATN(atn) {
        if (!this.deserializationOptions.verifyATN) {
            return;
        }
        // verify assumptions
        for(let i=0; i<atn.states.length; i++) {
            const state = atn.states[i];
            if (state === null) {
                continue;
            }
            this.checkCondition(state.epsilonOnlyTransitions || state.transitions.length <= 1);
            if (state instanceof PlusBlockStartState) {
                this.checkCondition(state.loopBackState !== null);
            } else  if (state instanceof StarLoopEntryState) {
                this.checkCondition(state.loopBackState !== null);
                this.checkCondition(state.transitions.length === 2);
                if (state.transitions[0].target instanceof StarBlockStartState) {
                    this.checkCondition(state.transitions[1].target instanceof LoopEndState);
                    this.checkCondition(!state.nonGreedy);
                } else if (state.transitions[0].target instanceof LoopEndState) {
                    this.checkCondition(state.transitions[1].target instanceof StarBlockStartState);
                    this.checkCondition(state.nonGreedy);
                } else {
                    throw("IllegalState");
                }
            } else if (state instanceof StarLoopbackState) {
                this.checkCondition(state.transitions.length === 1);
                this.checkCondition(state.transitions[0].target instanceof StarLoopEntryState);
            } else if (state instanceof LoopEndState) {
                this.checkCondition(state.loopBackState !== null);
            } else if (state instanceof RuleStartState) {
                this.checkCondition(state.stopState !== null);
            } else if (state instanceof BlockStartState) {
                this.checkCondition(state.endState !== null);
            } else if (state instanceof BlockEndState) {
                this.checkCondition(state.startState !== null);
            } else if (state instanceof DecisionState) {
                this.checkCondition(state.transitions.length <= 1 || state.decision >= 0);
            } else {
                this.checkCondition(state.transitions.length <= 1 || (state instanceof RuleStopState));
            }
        }
    }

    checkCondition(condition, message) {
        if (!condition) {
            if (message === undefined || message===null) {
                message = "IllegalState";
            }
            throw (message);
        }
    }

    readInt() {
        return this.data[this.pos++];
    }

    readInt32() {
        const low = this.readInt();
        const high = this.readInt();
        return low | (high << 16);
    }

    readLong() {
        const low = this.readInt32();
        const high = this.readInt32();
        return (low & 0x00000000FFFFFFFF) | (high << 32);
    }

    readUUID() {
        const bb = [];
        for(let i=7;i>=0;i--) {
            const int = this.readInt();
            /* jshint bitwise: false */
            bb[(2*i)+1] = int & 0xFF;
            bb[2*i] = (int >> 8) & 0xFF;
        }
        return byteToHex[bb[0]] + byteToHex[bb[1]] +
        byteToHex[bb[2]] + byteToHex[bb[3]] + '-' +
        byteToHex[bb[4]] + byteToHex[bb[5]] + '-' +
        byteToHex[bb[6]] + byteToHex[bb[7]] + '-' +
        byteToHex[bb[8]] + byteToHex[bb[9]] + '-' +
        byteToHex[bb[10]] + byteToHex[bb[11]] +
        byteToHex[bb[12]] + byteToHex[bb[13]] +
        byteToHex[bb[14]] + byteToHex[bb[15]];
    }

    edgeFactory(atn, type, src, trg, arg1, arg2, arg3, sets) {
        const target = atn.states[trg];
        switch(type) {
        case Transition.EPSILON:
            return new EpsilonTransition(target);
        case Transition.RANGE:
            return arg3 !== 0 ? new RangeTransition(target, Token.EOF, arg2) : new RangeTransition(target, arg1, arg2);
        case Transition.RULE:
            return new RuleTransition(atn.states[arg1], arg2, arg3, target);
        case Transition.PREDICATE:
            return new PredicateTransition(target, arg1, arg2, arg3 !== 0);
        case Transition.PRECEDENCE:
            return new PrecedencePredicateTransition(target, arg1);
        case Transition.ATOM:
            return arg3 !== 0 ? new AtomTransition(target, Token.EOF) : new AtomTransition(target, arg1);
        case Transition.ACTION:
            return new ActionTransition(target, arg1, arg2, arg3 !== 0);
        case Transition.SET:
            return new SetTransition(target, sets[arg1]);
        case Transition.NOT_SET:
            return new NotSetTransition(target, sets[arg1]);
        case Transition.WILDCARD:
            return new WildcardTransition(target);
        default:
            throw "The specified transition type: " + type + " is not valid.";
        }
    }

    stateFactory(type, ruleIndex) {
        if (this.stateFactories === null) {
            const sf = [];
            sf[ATNState.INVALID_TYPE] = null;
            sf[ATNState.BASIC] = () => new BasicState();
            sf[ATNState.RULE_START] = () => new RuleStartState();
            sf[ATNState.BLOCK_START] = () => new BasicBlockStartState();
            sf[ATNState.PLUS_BLOCK_START] = () => new PlusBlockStartState();
            sf[ATNState.STAR_BLOCK_START] = () => new StarBlockStartState();
            sf[ATNState.TOKEN_START] = () => new TokensStartState();
            sf[ATNState.RULE_STOP] = () => new RuleStopState();
            sf[ATNState.BLOCK_END] = () => new BlockEndState();
            sf[ATNState.STAR_LOOP_BACK] = () => new StarLoopbackState();
            sf[ATNState.STAR_LOOP_ENTRY] = () => new StarLoopEntryState();
            sf[ATNState.PLUS_LOOP_BACK] = () => new PlusLoopbackState();
            sf[ATNState.LOOP_END] = () => new LoopEndState();
            this.stateFactories = sf;
        }
        if (type>this.stateFactories.length || this.stateFactories[type] === null) {
            throw("The specified state type " + type + " is not valid.");
        } else {
            const s = this.stateFactories[type]();
            if (s!==null) {
                s.ruleIndex = ruleIndex;
                return s;
            }
        }
    }

    lexerActionFactory(type, data1, data2) {
        if (this.actionFactories === null) {
            const af = [];
            af[LexerActionType.CHANNEL] = (data1, data2) => new LexerChannelAction(data1);
            af[LexerActionType.CUSTOM] = (data1, data2) => new LexerCustomAction(data1, data2);
            af[LexerActionType.MODE] = (data1, data2) => new LexerModeAction(data1);
            af[LexerActionType.MORE] = (data1, data2) => LexerMoreAction.INSTANCE;
            af[LexerActionType.POP_MODE] = (data1, data2) => LexerPopModeAction.INSTANCE;
            af[LexerActionType.PUSH_MODE] = (data1, data2) => new LexerPushModeAction(data1);
            af[LexerActionType.SKIP] = (data1, data2) => LexerSkipAction.INSTANCE;
            af[LexerActionType.TYPE] = (data1, data2) => new LexerTypeAction(data1);
            this.actionFactories = af;
        }
        if (type>this.actionFactories.length || this.actionFactories[type] === null) {
            throw("The specified lexer action type " + type + " is not valid.");
        } else {
            return this.actionFactories[type](data1, data2);
        }
    }
}

function createByteToHex() {
	const bth = [];
	for (let i = 0; i < 256; i++) {
		bth[i] = (i + 0x100).toString(16).substr(1).toUpperCase();
	}
	return bth;
}

const byteToHex = createByteToHex();


module.exports = ATNDeserializer;

},{"./../IntervalSet":7,"./../Token":15,"./ATN":17,"./ATNDeserializationOptions":20,"./ATNState":23,"./ATNType":24,"./LexerAction":26,"./Transition":31}],22:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const {DFAState} = require('./../dfa/DFAState');
const {ATNConfigSet} = require('./ATNConfigSet');
const {getCachedPredictionContext} = require('./../PredictionContext');
const {Map} = require('./../Utils');

class ATNSimulator {
    constructor(atn, sharedContextCache) {
        /**
         * The context cache maps all PredictionContext objects that are ==
         * to a single cached copy. This cache is shared across all contexts
         * in all ATNConfigs in all DFA states.  We rebuild each ATNConfigSet
         * to use only cached nodes/graphs in addDFAState(). We don't want to
         * fill this during closure() since there are lots of contexts that
         * pop up but are not used ever again. It also greatly slows down closure().
         *
         * <p>This cache makes a huge difference in memory and a little bit in speed.
         * For the Java grammar on java.*, it dropped the memory requirements
         * at the end from 25M to 16M. We don't store any of the full context
         * graphs in the DFA because they are limited to local context only,
         * but apparently there's a lot of repetition there as well. We optimize
         * the config contexts before storing the config set in the DFA states
         * by literally rebuilding them with cached subgraphs only.</p>
         *
         * <p>I tried a cache for use during closure operations, that was
         * whacked after each adaptivePredict(). It cost a little bit
         * more time I think and doesn't save on the overall footprint
         * so it's not worth the complexity.</p>
         */
        this.atn = atn;
        this.sharedContextCache = sharedContextCache;
        return this;
    }

    getCachedContext(context) {
        if (this.sharedContextCache ===null) {
            return context;
        }
        const visited = new Map();
        return getCachedPredictionContext(context, this.sharedContextCache, visited);
    }
}

// Must distinguish between missing edge and edge we know leads nowhere///
ATNSimulator.ERROR = new DFAState(0x7FFFFFFF, new ATNConfigSet());


module.exports = ATNSimulator;

},{"./../PredictionContext":12,"./../Utils":16,"./../dfa/DFAState":35,"./ATNConfigSet":19}],23:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const INITIAL_NUM_TRANSITIONS = 4;

/**
 * The following images show the relation of states and
 * {@link ATNState//transitions} for various grammar constructs.
 *
 * <ul>
 *
 * <li>Solid edges marked with an &//0949; indicate a required
 * {@link EpsilonTransition}.</li>
 *
 * <li>Dashed edges indicate locations where any transition derived from
 * {@link Transition} might appear.</li>
 *
 * <li>Dashed nodes are place holders for either a sequence of linked
 * {@link BasicState} states or the inclusion of a block representing a nested
 * construct in one of the forms below.</li>
 *
 * <li>Nodes showing multiple outgoing alternatives with a {@code ...} support
 * any number of alternatives (one or more). Nodes without the {@code ...} only
 * support the exact number of alternatives shown in the diagram.</li>
 *
 * </ul>
 *
 * <h2>Basic Blocks</h2>
 *
 * <h3>Rule</h3>
 *
 * <embed src="images/Rule.svg" type="image/svg+xml"/>
 *
 * <h3>Block of 1 or more alternatives</h3>
 *
 * <embed src="images/Block.svg" type="image/svg+xml"/>
 *
 * <h2>Greedy Loops</h2>
 *
 * <h3>Greedy Closure: {@code (...)*}</h3>
 *
 * <embed src="images/ClosureGreedy.svg" type="image/svg+xml"/>
 *
 * <h3>Greedy Positive Closure: {@code (...)+}</h3>
 *
 * <embed src="images/PositiveClosureGreedy.svg" type="image/svg+xml"/>
 *
 * <h3>Greedy Optional: {@code (...)?}</h3>
 *
 * <embed src="images/OptionalGreedy.svg" type="image/svg+xml"/>
 *
 * <h2>Non-Greedy Loops</h2>
 *
 * <h3>Non-Greedy Closure: {@code (...)*?}</h3>
 *
 * <embed src="images/ClosureNonGreedy.svg" type="image/svg+xml"/>
 *
 * <h3>Non-Greedy Positive Closure: {@code (...)+?}</h3>
 *
 * <embed src="images/PositiveClosureNonGreedy.svg" type="image/svg+xml"/>
 *
 * <h3>Non-Greedy Optional: {@code (...)??}</h3>
 *
 * <embed src="images/OptionalNonGreedy.svg" type="image/svg+xml"/>
 */
class ATNState {
    constructor() {
        // Which ATN are we in?
        this.atn = null;
        this.stateNumber = ATNState.INVALID_STATE_NUMBER;
        this.stateType = null;
        this.ruleIndex = 0; // at runtime, we don't have Rule objects
        this.epsilonOnlyTransitions = false;
        // Track the transitions emanating from this ATN state.
        this.transitions = [];
        // Used to cache lookahead during parsing, not used during construction
        this.nextTokenWithinRule = null;
    }

    toString() {
        return this.stateNumber;
    }

    equals(other) {
        if (other instanceof ATNState) {
            return this.stateNumber===other.stateNumber;
        } else {
            return false;
        }
    }

    isNonGreedyExitState() {
        return false;
    }

    addTransition(trans, index) {
        if(index===undefined) {
            index = -1;
        }
        if (this.transitions.length===0) {
            this.epsilonOnlyTransitions = trans.isEpsilon;
        } else if(this.epsilonOnlyTransitions !== trans.isEpsilon) {
            this.epsilonOnlyTransitions = false;
        }
        if (index===-1) {
            this.transitions.push(trans);
        } else {
            this.transitions.splice(index, 1, trans);
        }
    }
}

// constants for serialization
ATNState.INVALID_TYPE = 0;
ATNState.BASIC = 1;
ATNState.RULE_START = 2;
ATNState.BLOCK_START = 3;
ATNState.PLUS_BLOCK_START = 4;
ATNState.STAR_BLOCK_START = 5;
ATNState.TOKEN_START = 6;
ATNState.RULE_STOP = 7;
ATNState.BLOCK_END = 8;
ATNState.STAR_LOOP_BACK = 9;
ATNState.STAR_LOOP_ENTRY = 10;
ATNState.PLUS_LOOP_BACK = 11;
ATNState.LOOP_END = 12;

ATNState.serializationNames = [
            "INVALID",
            "BASIC",
            "RULE_START",
            "BLOCK_START",
            "PLUS_BLOCK_START",
            "STAR_BLOCK_START",
            "TOKEN_START",
            "RULE_STOP",
            "BLOCK_END",
            "STAR_LOOP_BACK",
            "STAR_LOOP_ENTRY",
            "PLUS_LOOP_BACK",
            "LOOP_END" ];

ATNState.INVALID_STATE_NUMBER = -1;


class BasicState extends ATNState {
    constructor() {
        super();
        this.stateType = ATNState.BASIC;
    }
}

class DecisionState extends ATNState {
    constructor() {
        super();
        this.decision = -1;
        this.nonGreedy = false;
        return this;
    }
}

/**
 *  The start of a regular {@code (...)} block
 */
class BlockStartState extends DecisionState {
    constructor() {
        super();
        this.endState = null;
        return this;
    }
}

class BasicBlockStartState extends BlockStartState {
    constructor() {
        super();
        this.stateType = ATNState.BLOCK_START;
        return this;
    }
}

/**
 * Terminal node of a simple {@code (a|b|c)} block
 */
class BlockEndState extends ATNState {
    constructor() {
        super();
        this.stateType = ATNState.BLOCK_END;
        this.startState = null;
        return this;
    }
}

/**
 * The last node in the ATN for a rule, unless that rule is the start symbol.
 * In that case, there is one transition to EOF. Later, we might encode
 * references to all calls to this rule to compute FOLLOW sets for
 * error handling
 */
class RuleStopState extends ATNState {
    constructor() {
        super();
        this.stateType = ATNState.RULE_STOP;
        return this;
    }
}

class RuleStartState extends ATNState {
    constructor() {
        super();
        this.stateType = ATNState.RULE_START;
        this.stopState = null;
        this.isPrecedenceRule = false;
        return this;
    }
}

/**
 * Decision state for {@code A+} and {@code (A|B)+}.  It has two transitions:
 * one to the loop back to start of the block and one to exit.
 */
class PlusLoopbackState extends DecisionState {
    constructor() {
        super();
        this.stateType = ATNState.PLUS_LOOP_BACK;
        return this;
    }
}

/**
 * Start of {@code (A|B|...)+} loop. Technically a decision state, but
 * we don't use for code generation; somebody might need it, so I'm defining
 * it for completeness. In reality, the {@link PlusLoopbackState} node is the
 * real decision-making note for {@code A+}
 */
class PlusBlockStartState extends BlockStartState {
    constructor() {
        super();
        this.stateType = ATNState.PLUS_BLOCK_START;
        this.loopBackState = null;
        return this;
    }
}

/**
 * The block that begins a closure loop
 */
class StarBlockStartState extends BlockStartState {
    constructor() {
        super();
        this.stateType = ATNState.STAR_BLOCK_START;
        return this;
    }
}

class StarLoopbackState extends ATNState {
    constructor() {
        super();
        this.stateType = ATNState.STAR_LOOP_BACK;
        return this;
    }
}

class StarLoopEntryState extends DecisionState {
    constructor() {
        super();
        this.stateType = ATNState.STAR_LOOP_ENTRY;
        this.loopBackState = null;
        // Indicates whether this state can benefit from a precedence DFA during SLL decision making.
        this.isPrecedenceDecision = null;
        return this;
    }
}

/**
 * Mark the end of a * or + loop
 */
class LoopEndState extends ATNState {
    constructor() {
        super();
        this.stateType = ATNState.LOOP_END;
        this.loopBackState = null;
        return this;
    }
}

/**
 * The Tokens rule start state linking to each lexer rule start state
 */
class TokensStartState extends DecisionState {
    constructor() {
        super();
        this.stateType = ATNState.TOKEN_START;
        return this;
    }
}

module.exports = {
    ATNState,
    BasicState,
    DecisionState,
    BlockStartState,
    BlockEndState,
    LoopEndState,
    RuleStartState,
    RuleStopState,
    TokensStartState,
    PlusLoopbackState,
    StarLoopbackState,
    StarLoopEntryState,
    PlusBlockStartState,
    StarBlockStartState,
    BasicBlockStartState
}

},{}],24:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

/**
 * Represents the type of recognizer an ATN applies to
 */
module.exports = {
    LEXER: 0,
    PARSER: 1
};


},{}],25:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const {Token} = require('./../Token');
const Lexer = require('./../Lexer');
const ATN = require('./ATN');
const ATNSimulator = require('./ATNSimulator');
const {DFAState} = require('./../dfa/DFAState');
const {OrderedATNConfigSet} = require('./ATNConfigSet');
const {PredictionContext} = require('./../PredictionContext');
const {SingletonPredictionContext} = require('./../PredictionContext');
const {RuleStopState} = require('./ATNState');
const {LexerATNConfig} = require('./ATNConfig');
const {Transition} = require('./Transition');
const LexerActionExecutor = require('./LexerActionExecutor');
const {LexerNoViableAltException} = require('./../error/Errors');

function resetSimState(sim) {
	sim.index = -1;
	sim.line = 0;
	sim.column = -1;
	sim.dfaState = null;
}

class SimState {
	constructor() {
		resetSimState(this);
	}

	reset() {
		resetSimState(this);
	}
}

class LexerATNSimulator extends ATNSimulator {
	/**
	 * When we hit an accept state in either the DFA or the ATN, we
	 * have to notify the character stream to start buffering characters
	 * via {@link IntStream//mark} and record the current state. The current sim state
	 * includes the current index into the input, the current line,
	 * and current character position in that line. Note that the Lexer is
	 * tracking the starting line and characterization of the token. These
	 * variables track the "state" of the simulator when it hits an accept state.
	 *
	 * <p>We track these variables separately for the DFA and ATN simulation
	 * because the DFA simulation often has to fail over to the ATN
	 * simulation. If the ATN simulation fails, we need the DFA to fall
	 * back to its previously accepted state, if any. If the ATN succeeds,
	 * then the ATN does the accept and the DFA simulator that invoked it
	 * can simply return the predicted token type.</p>
	 */
	constructor(recog, atn, decisionToDFA, sharedContextCache) {
		super(atn, sharedContextCache);
		this.decisionToDFA = decisionToDFA;
		this.recog = recog;
		/**
		 * The current token's starting index into the character stream.
		 * Shared across DFA to ATN simulation in case the ATN fails and the
		 * DFA did not have a previous accept state. In this case, we use the
		 * ATN-generated exception object
		 */
		this.startIndex = -1;
		// line number 1..n within the input///
		this.line = 1;
		/**
		 * The index of the character relative to the beginning of the line
		 * 0..n-1
		 */
		this.column = 0;
		this.mode = Lexer.DEFAULT_MODE;
		/**
		 * Used during DFA/ATN exec to record the most recent accept configuration
		 * info
		 */
		this.prevAccept = new SimState();
	}

	copyState(simulator) {
		this.column = simulator.column;
		this.line = simulator.line;
		this.mode = simulator.mode;
		this.startIndex = simulator.startIndex;
	}

	match(input, mode) {
		this.match_calls += 1;
		this.mode = mode;
		const mark = input.mark();
		try {
			this.startIndex = input.index;
			this.prevAccept.reset();
			const dfa = this.decisionToDFA[mode];
			if (dfa.s0 === null) {
				return this.matchATN(input);
			} else {
				return this.execATN(input, dfa.s0);
			}
		} finally {
			input.release(mark);
		}
	}

	reset() {
		this.prevAccept.reset();
		this.startIndex = -1;
		this.line = 1;
		this.column = 0;
		this.mode = Lexer.DEFAULT_MODE;
	}

	matchATN(input) {
		const startState = this.atn.modeToStartState[this.mode];

		if (LexerATNSimulator.debug) {
			console.log("matchATN mode " + this.mode + " start: " + startState);
		}
		const old_mode = this.mode;
		const s0_closure = this.computeStartState(input, startState);
		const suppressEdge = s0_closure.hasSemanticContext;
		s0_closure.hasSemanticContext = false;

		const next = this.addDFAState(s0_closure);
		if (!suppressEdge) {
			this.decisionToDFA[this.mode].s0 = next;
		}

		const predict = this.execATN(input, next);

		if (LexerATNSimulator.debug) {
			console.log("DFA after matchATN: " + this.decisionToDFA[old_mode].toLexerString());
		}
		return predict;
	}

	execATN(input, ds0) {
		if (LexerATNSimulator.debug) {
			console.log("start state closure=" + ds0.configs);
		}
		if (ds0.isAcceptState) {
			// allow zero-length tokens
			this.captureSimState(this.prevAccept, input, ds0);
		}
		let t = input.LA(1);
		let s = ds0; // s is current/from DFA state

		while (true) { // while more work
			if (LexerATNSimulator.debug) {
				console.log("execATN loop starting closure: " + s.configs);
			}

			/**
			 * As we move src->trg, src->trg, we keep track of the previous trg to
			 * avoid looking up the DFA state again, which is expensive.
			 * If the previous target was already part of the DFA, we might
			 * be able to avoid doing a reach operation upon t. If s!=null,
			 * it means that semantic predicates didn't prevent us from
			 * creating a DFA state. Once we know s!=null, we check to see if
			 * the DFA state has an edge already for t. If so, we can just reuse
			 * it's configuration set; there's no point in re-computing it.
			 * This is kind of like doing DFA simulation within the ATN
			 * simulation because DFA simulation is really just a way to avoid
			 * computing reach/closure sets. Technically, once we know that
			 * we have a previously added DFA state, we could jump over to
			 * the DFA simulator. But, that would mean popping back and forth
			 * a lot and making things more complicated algorithmically.
			 * This optimization makes a lot of sense for loops within DFA.
			 * A character will take us back to an existing DFA state
			 * that already has lots of edges out of it. e.g., .* in comments.
			 * print("Target for:" + str(s) + " and:" + str(t))
			 */
			let target = this.getExistingTargetState(s, t);
			// print("Existing:" + str(target))
			if (target === null) {
				target = this.computeTargetState(input, s, t);
				// print("Computed:" + str(target))
			}
			if (target === ATNSimulator.ERROR) {
				break;
			}
			// If this is a consumable input element, make sure to consume before
			// capturing the accept state so the input index, line, and char
			// position accurately reflect the state of the interpreter at the
			// end of the token.
			if (t !== Token.EOF) {
				this.consume(input);
			}
			if (target.isAcceptState) {
				this.captureSimState(this.prevAccept, input, target);
				if (t === Token.EOF) {
					break;
				}
			}
			t = input.LA(1);
			s = target; // flip; current DFA target becomes new src/from state
		}
		return this.failOrAccept(this.prevAccept, input, s.configs, t);
	}

	/**
	 * Get an existing target state for an edge in the DFA. If the target state
	 * for the edge has not yet been computed or is otherwise not available,
	 * this method returns {@code null}.
	 *
	 * @param s The current DFA state
	 * @param t The next input symbol
	 * @return The existing target DFA state for the given input symbol
	 * {@code t}, or {@code null} if the target state for this edge is not
	 * already cached
	 */
	getExistingTargetState(s, t) {
		if (s.edges === null || t < LexerATNSimulator.MIN_DFA_EDGE || t > LexerATNSimulator.MAX_DFA_EDGE) {
			return null;
		}

		let target = s.edges[t - LexerATNSimulator.MIN_DFA_EDGE];
		if(target===undefined) {
			target = null;
		}
		if (LexerATNSimulator.debug && target !== null) {
			console.log("reuse state " + s.stateNumber + " edge to " + target.stateNumber);
		}
		return target;
	}

	/**
	 * Compute a target state for an edge in the DFA, and attempt to add the
	 * computed state and corresponding edge to the DFA.
	 *
	 * @param input The input stream
	 * @param s The current DFA state
	 * @param t The next input symbol
	 *
	 * @return The computed target DFA state for the given input symbol
	 * {@code t}. If {@code t} does not lead to a valid DFA state, this method
	 * returns {@link //ERROR}.
	 */
	computeTargetState(input, s, t) {
		const reach = new OrderedATNConfigSet();
		// if we don't find an existing DFA state
		// Fill reach starting from closure, following t transitions
		this.getReachableConfigSet(input, s.configs, reach, t);

		if (reach.items.length === 0) { // we got nowhere on t from s
			if (!reach.hasSemanticContext) {
				// we got nowhere on t, don't throw out this knowledge; it'd
				// cause a failover from DFA later.
				this.addDFAEdge(s, t, ATNSimulator.ERROR);
			}
			// stop when we can't match any more char
			return ATNSimulator.ERROR;
		}
		// Add an edge from s to target DFA found/created for reach
		return this.addDFAEdge(s, t, null, reach);
	}

	failOrAccept(prevAccept, input, reach, t) {
		if (this.prevAccept.dfaState !== null) {
			const lexerActionExecutor = prevAccept.dfaState.lexerActionExecutor;
			this.accept(input, lexerActionExecutor, this.startIndex,
					prevAccept.index, prevAccept.line, prevAccept.column);
			return prevAccept.dfaState.prediction;
		} else {
			// if no accept and EOF is first char, return EOF
			if (t === Token.EOF && input.index === this.startIndex) {
				return Token.EOF;
			}
			throw new LexerNoViableAltException(this.recog, input, this.startIndex, reach);
		}
	}

	/**
	 * Given a starting configuration set, figure out all ATN configurations
	 * we can reach upon input {@code t}. Parameter {@code reach} is a return
	 * parameter.
	 */
	getReachableConfigSet(input, closure,
			reach, t) {
		// this is used to skip processing for configs which have a lower priority
		// than a config that already reached an accept state for the same rule
		let skipAlt = ATN.INVALID_ALT_NUMBER;
		for (let i = 0; i < closure.items.length; i++) {
			const cfg = closure.items[i];
			const currentAltReachedAcceptState = (cfg.alt === skipAlt);
			if (currentAltReachedAcceptState && cfg.passedThroughNonGreedyDecision) {
				continue;
			}
			if (LexerATNSimulator.debug) {
				console.log("testing %s at %s\n", this.getTokenName(t), cfg
						.toString(this.recog, true));
			}
			for (let j = 0; j < cfg.state.transitions.length; j++) {
				const trans = cfg.state.transitions[j]; // for each transition
				const target = this.getReachableTarget(trans, t);
				if (target !== null) {
					let lexerActionExecutor = cfg.lexerActionExecutor;
					if (lexerActionExecutor !== null) {
						lexerActionExecutor = lexerActionExecutor.fixOffsetBeforeMatch(input.index - this.startIndex);
					}
					const treatEofAsEpsilon = (t === Token.EOF);
					const config = new LexerATNConfig({state:target, lexerActionExecutor:lexerActionExecutor}, cfg);
					if (this.closure(input, config, reach,
							currentAltReachedAcceptState, true, treatEofAsEpsilon)) {
						// any remaining configs for this alt have a lower priority
						// than the one that just reached an accept state.
						skipAlt = cfg.alt;
					}
				}
			}
		}
	}

	accept(input, lexerActionExecutor,
			   startIndex, index, line, charPos) {
		   if (LexerATNSimulator.debug) {
			   console.log("ACTION %s\n", lexerActionExecutor);
		   }
		   // seek to after last char in token
		   input.seek(index);
		   this.line = line;
		   this.column = charPos;
		   if (lexerActionExecutor !== null && this.recog !== null) {
			   lexerActionExecutor.execute(this.recog, input, startIndex);
		   }
	   }

	getReachableTarget(trans, t) {
		if (trans.matches(t, 0, Lexer.MAX_CHAR_VALUE)) {
			return trans.target;
		} else {
			return null;
		}
	}

	computeStartState(input, p) {
		const initialContext = PredictionContext.EMPTY;
		const configs = new OrderedATNConfigSet();
		for (let i = 0; i < p.transitions.length; i++) {
			const target = p.transitions[i].target;
			const cfg = new LexerATNConfig({state:target, alt:i+1, context:initialContext}, null);
			this.closure(input, cfg, configs, false, false, false);
		}
		return configs;
	}

	/**
	 * Since the alternatives within any lexer decision are ordered by
	 * preference, this method stops pursuing the closure as soon as an accept
	 * state is reached. After the first accept state is reached by depth-first
	 * search from {@code config}, all other (potentially reachable) states for
	 * this rule would have a lower priority.
	 *
	 * @return {Boolean} {@code true} if an accept state is reached, otherwise
	 * {@code false}.
	 */
	closure(input, config, configs,
			currentAltReachedAcceptState, speculative, treatEofAsEpsilon) {
		let cfg = null;
		if (LexerATNSimulator.debug) {
			console.log("closure(" + config.toString(this.recog, true) + ")");
		}
		if (config.state instanceof RuleStopState) {
			if (LexerATNSimulator.debug) {
				if (this.recog !== null) {
					console.log("closure at %s rule stop %s\n", this.recog.ruleNames[config.state.ruleIndex], config);
				} else {
					console.log("closure at rule stop %s\n", config);
				}
			}
			if (config.context === null || config.context.hasEmptyPath()) {
				if (config.context === null || config.context.isEmpty()) {
					configs.add(config);
					return true;
				} else {
					configs.add(new LexerATNConfig({ state:config.state, context:PredictionContext.EMPTY}, config));
					currentAltReachedAcceptState = true;
				}
			}
			if (config.context !== null && !config.context.isEmpty()) {
				for (let i = 0; i < config.context.length; i++) {
					if (config.context.getReturnState(i) !== PredictionContext.EMPTY_RETURN_STATE) {
						const newContext = config.context.getParent(i); // "pop" return state
						const returnState = this.atn.states[config.context.getReturnState(i)];
						cfg = new LexerATNConfig({ state:returnState, context:newContext }, config);
						currentAltReachedAcceptState = this.closure(input, cfg,
								configs, currentAltReachedAcceptState, speculative,
								treatEofAsEpsilon);
					}
				}
			}
			return currentAltReachedAcceptState;
		}
		// optimization
		if (!config.state.epsilonOnlyTransitions) {
			if (!currentAltReachedAcceptState || !config.passedThroughNonGreedyDecision) {
				configs.add(config);
			}
		}
		for (let j = 0; j < config.state.transitions.length; j++) {
			const trans = config.state.transitions[j];
			cfg = this.getEpsilonTarget(input, config, trans, configs, speculative, treatEofAsEpsilon);
			if (cfg !== null) {
				currentAltReachedAcceptState = this.closure(input, cfg, configs,
						currentAltReachedAcceptState, speculative, treatEofAsEpsilon);
			}
		}
		return currentAltReachedAcceptState;
	}

	// side-effect: can alter configs.hasSemanticContext
	getEpsilonTarget(input, config, trans,
			configs, speculative, treatEofAsEpsilon) {
		let cfg = null;
		if (trans.serializationType === Transition.RULE) {
			const newContext = SingletonPredictionContext.create(config.context, trans.followState.stateNumber);
			cfg = new LexerATNConfig( { state:trans.target, context:newContext}, config);
		} else if (trans.serializationType === Transition.PRECEDENCE) {
			throw "Precedence predicates are not supported in lexers.";
		} else if (trans.serializationType === Transition.PREDICATE) {
			// Track traversing semantic predicates. If we traverse,
			// we cannot add a DFA state for this "reach" computation
			// because the DFA would not test the predicate again in the
			// future. Rather than creating collections of semantic predicates
			// like v3 and testing them on prediction, v4 will test them on the
			// fly all the time using the ATN not the DFA. This is slower but
			// semantically it's not used that often. One of the key elements to
			// this predicate mechanism is not adding DFA states that see
			// predicates immediately afterwards in the ATN. For example,

			// a : ID {p1}? | ID {p2}? ;

			// should create the start state for rule 'a' (to save start state
			// competition), but should not create target of ID state. The
			// collection of ATN states the following ID references includes
			// states reached by traversing predicates. Since this is when we
			// test them, we cannot cash the DFA state target of ID.

			if (LexerATNSimulator.debug) {
				console.log("EVAL rule " + trans.ruleIndex + ":" + trans.predIndex);
			}
			configs.hasSemanticContext = true;
			if (this.evaluatePredicate(input, trans.ruleIndex, trans.predIndex, speculative)) {
				cfg = new LexerATNConfig({ state:trans.target}, config);
			}
		} else if (trans.serializationType === Transition.ACTION) {
			if (config.context === null || config.context.hasEmptyPath()) {
				// execute actions anywhere in the start rule for a token.
				//
				// TODO: if the entry rule is invoked recursively, some
				// actions may be executed during the recursive call. The
				// problem can appear when hasEmptyPath() is true but
				// isEmpty() is false. In this case, the config needs to be
				// split into two contexts - one with just the empty path
				// and another with everything but the empty path.
				// Unfortunately, the current algorithm does not allow
				// getEpsilonTarget to return two configurations, so
				// additional modifications are needed before we can support
				// the split operation.
				const lexerActionExecutor = LexerActionExecutor.append(config.lexerActionExecutor,
						this.atn.lexerActions[trans.actionIndex]);
				cfg = new LexerATNConfig({ state:trans.target, lexerActionExecutor:lexerActionExecutor }, config);
			} else {
				// ignore actions in referenced rules
				cfg = new LexerATNConfig( { state:trans.target}, config);
			}
		} else if (trans.serializationType === Transition.EPSILON) {
			cfg = new LexerATNConfig({ state:trans.target}, config);
		} else if (trans.serializationType === Transition.ATOM ||
					trans.serializationType === Transition.RANGE ||
					trans.serializationType === Transition.SET) {
			if (treatEofAsEpsilon) {
				if (trans.matches(Token.EOF, 0, Lexer.MAX_CHAR_VALUE)) {
					cfg = new LexerATNConfig( { state:trans.target }, config);
				}
			}
		}
		return cfg;
	}

	/**
	 * Evaluate a predicate specified in the lexer.
	 *
	 * <p>If {@code speculative} is {@code true}, this method was called before
	 * {@link //consume} for the matched character. This method should call
	 * {@link //consume} before evaluating the predicate to ensure position
	 * sensitive values, including {@link Lexer//getText}, {@link Lexer//getLine},
	 * and {@link Lexer//getcolumn}, properly reflect the current
	 * lexer state. This method should restore {@code input} and the simulator
	 * to the original state before returning (i.e. undo the actions made by the
	 * call to {@link //consume}.</p>
	 *
	 * @param input The input stream.
	 * @param ruleIndex The rule containing the predicate.
	 * @param predIndex The index of the predicate within the rule.
	 * @param speculative {@code true} if the current index in {@code input} is
	 * one character before the predicate's location.
	 *
	 * @return {@code true} if the specified predicate evaluates to
	 * {@code true}.
	 */
	evaluatePredicate(input, ruleIndex,
			predIndex, speculative) {
		// assume true if no recognizer was provided
		if (this.recog === null) {
			return true;
		}
		if (!speculative) {
			return this.recog.sempred(null, ruleIndex, predIndex);
		}
		const savedcolumn = this.column;
		const savedLine = this.line;
		const index = input.index;
		const marker = input.mark();
		try {
			this.consume(input);
			return this.recog.sempred(null, ruleIndex, predIndex);
		} finally {
			this.column = savedcolumn;
			this.line = savedLine;
			input.seek(index);
			input.release(marker);
		}
	}

	captureSimState(settings, input, dfaState) {
		settings.index = input.index;
		settings.line = this.line;
		settings.column = this.column;
		settings.dfaState = dfaState;
	}

	addDFAEdge(from_, tk, to, cfgs) {
		if (to === undefined) {
			to = null;
		}
		if (cfgs === undefined) {
			cfgs = null;
		}
		if (to === null && cfgs !== null) {
			// leading to this call, ATNConfigSet.hasSemanticContext is used as a
			// marker indicating dynamic predicate evaluation makes this edge
			// dependent on the specific input sequence, so the static edge in the
			// DFA should be omitted. The target DFAState is still created since
			// execATN has the ability to resynchronize with the DFA state cache
			// following the predicate evaluation step.
			//
			// TJP notes: next time through the DFA, we see a pred again and eval.
			// If that gets us to a previously created (but dangling) DFA
			// state, we can continue in pure DFA mode from there.
			// /
			const suppressEdge = cfgs.hasSemanticContext;
			cfgs.hasSemanticContext = false;

			to = this.addDFAState(cfgs);

			if (suppressEdge) {
				return to;
			}
		}
		// add the edge
		if (tk < LexerATNSimulator.MIN_DFA_EDGE || tk > LexerATNSimulator.MAX_DFA_EDGE) {
			// Only track edges within the DFA bounds
			return to;
		}
		if (LexerATNSimulator.debug) {
			console.log("EDGE " + from_ + " -> " + to + " upon " + tk);
		}
		if (from_.edges === null) {
			// make room for tokens 1..n and -1 masquerading as index 0
			from_.edges = [];
		}
		from_.edges[tk - LexerATNSimulator.MIN_DFA_EDGE] = to; // connect

		return to;
	}

	/**
	 * Add a new DFA state if there isn't one with this set of
	 * configurations already. This method also detects the first
	 * configuration containing an ATN rule stop state. Later, when
	 * traversing the DFA, we will know which rule to accept.
	 */
	addDFAState(configs) {
		const proposed = new DFAState(null, configs);
		let firstConfigWithRuleStopState = null;
		for (let i = 0; i < configs.items.length; i++) {
			const cfg = configs.items[i];
			if (cfg.state instanceof RuleStopState) {
				firstConfigWithRuleStopState = cfg;
				break;
			}
		}
		if (firstConfigWithRuleStopState !== null) {
			proposed.isAcceptState = true;
			proposed.lexerActionExecutor = firstConfigWithRuleStopState.lexerActionExecutor;
			proposed.prediction = this.atn.ruleToTokenType[firstConfigWithRuleStopState.state.ruleIndex];
		}
		const dfa = this.decisionToDFA[this.mode];
		const existing = dfa.states.get(proposed);
		if (existing!==null) {
			return existing;
		}
		const newState = proposed;
		newState.stateNumber = dfa.states.length;
		configs.setReadonly(true);
		newState.configs = configs;
		dfa.states.add(newState);
		return newState;
	}

	getDFA(mode) {
		return this.decisionToDFA[mode];
	}

// Get the text matched so far for the current token.
	getText(input) {
		// index is first lookahead char, don't include.
		return input.getText(this.startIndex, input.index - 1);
	}

	consume(input) {
		const curChar = input.LA(1);
		if (curChar === "\n".charCodeAt(0)) {
			this.line += 1;
			this.column = 0;
		} else {
			this.column += 1;
		}
		input.consume();
	}

	getTokenName(tt) {
		if (tt === -1) {
			return "EOF";
		} else {
			return "'" + String.fromCharCode(tt) + "'";
		}
	}
}

LexerATNSimulator.debug = false;
LexerATNSimulator.dfa_debug = false;

LexerATNSimulator.MIN_DFA_EDGE = 0;
LexerATNSimulator.MAX_DFA_EDGE = 127; // forces unicode to stay in ATN

LexerATNSimulator.match_calls = 0;

module.exports = LexerATNSimulator;

},{"./../Lexer":9,"./../PredictionContext":12,"./../Token":15,"./../dfa/DFAState":35,"./../error/Errors":40,"./ATN":17,"./ATNConfig":18,"./ATNConfigSet":19,"./ATNSimulator":22,"./ATNState":23,"./LexerActionExecutor":27,"./Transition":31}],26:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const LexerActionType = {
    // The type of a {@link LexerChannelAction} action.
    CHANNEL: 0,
    // The type of a {@link LexerCustomAction} action
    CUSTOM: 1,
    // The type of a {@link LexerModeAction} action.
    MODE: 2,
    //The type of a {@link LexerMoreAction} action.
    MORE: 3,
    //The type of a {@link LexerPopModeAction} action.
    POP_MODE: 4,
    //The type of a {@link LexerPushModeAction} action.
    PUSH_MODE: 5,
    //The type of a {@link LexerSkipAction} action.
    SKIP: 6,
    //The type of a {@link LexerTypeAction} action.
    TYPE: 7
}

class LexerAction {
    constructor(action) {
        this.actionType = action;
        this.isPositionDependent = false;
    }

    hashCode() {
        const hash = new Hash();
        this.updateHashCode(hash);
        return hash.finish()
    }

    updateHashCode(hash) {
        hash.update(this.actionType);
    }

    equals(other) {
        return this === other;
    }
}


/**
 * Implements the {@code skip} lexer action by calling {@link Lexer//skip}.
 *
 * <p>The {@code skip} command does not have any parameters, so this action is
 * implemented as a singleton instance exposed by {@link //INSTANCE}.</p>
 */
class LexerSkipAction extends LexerAction {
    constructor() {
        super(LexerActionType.SKIP);
    }

    execute(lexer) {
        lexer.skip();
    }

    toString() {
        return "skip";
    }
}

// Provides a singleton instance of this parameterless lexer action.
LexerSkipAction.INSTANCE = new LexerSkipAction();

/**
 * Implements the {@code type} lexer action by calling {@link Lexer//setType}
 * with the assigned type
 */
class LexerTypeAction extends LexerAction {
    constructor(type) {
        super(LexerActionType.TYPE);
        this.type = type;
    }

    execute(lexer) {
        lexer.type = this.type;
    }

    updateHashCode(hash) {
        hash.update(this.actionType, this.type);
    }

    equals(other) {
        if(this === other) {
            return true;
        } else if (! (other instanceof LexerTypeAction)) {
            return false;
        } else {
            return this.type === other.type;
        }
    }

    toString() {
        return "type(" + this.type + ")";
    }
}


/**
 * Implements the {@code pushMode} lexer action by calling
 * {@link Lexer//pushMode} with the assigned mode
 */
class LexerPushModeAction extends LexerAction {
    constructor(mode) {
        super(LexerActionType.PUSH_MODE);
        this.mode = mode;
    }

    /**
     * <p>This action is implemented by calling {@link Lexer//pushMode} with the
     * value provided by {@link //getMode}.</p>
     */
    execute(lexer) {
        lexer.pushMode(this.mode);
    }

    updateHashCode(hash) {
        hash.update(this.actionType, this.mode);
    }

    equals(other) {
        if (this === other) {
            return true;
        } else if (! (other instanceof LexerPushModeAction)) {
            return false;
        } else {
            return this.mode === other.mode;
        }
    }

    toString() {
        return "pushMode(" + this.mode + ")";
    }
}

/**
 * Implements the {@code popMode} lexer action by calling {@link Lexer//popMode}.
 *
 * <p>The {@code popMode} command does not have any parameters, so this action is
 * implemented as a singleton instance exposed by {@link //INSTANCE}.</p>
 */
class LexerPopModeAction extends LexerAction {
    constructor() {
        super(LexerActionType.POP_MODE);
    }

    /**
     * <p>This action is implemented by calling {@link Lexer//popMode}.</p>
     */
    execute(lexer) {
        lexer.popMode();
    }

    toString() {
        return "popMode";
    }
}

LexerPopModeAction.INSTANCE = new LexerPopModeAction();

/**
 * Implements the {@code more} lexer action by calling {@link Lexer//more}.
 *
 * <p>The {@code more} command does not have any parameters, so this action is
 * implemented as a singleton instance exposed by {@link //INSTANCE}.</p>
 */
class LexerMoreAction extends LexerAction {
    constructor() {
        super(LexerActionType.MORE);
    }

    /**
     * <p>This action is implemented by calling {@link Lexer//popMode}.</p>
     */
    execute(lexer) {
        lexer.more();
    }

    toString() {
        return "more";
    }
}

LexerMoreAction.INSTANCE = new LexerMoreAction();


/**
 * Implements the {@code mode} lexer action by calling {@link Lexer//mode} with
 * the assigned mode
 */
class LexerModeAction extends LexerAction {
    constructor(mode) {
        super(LexerActionType.MODE);
        this.mode = mode;
    }

    /**
     * <p>This action is implemented by calling {@link Lexer//mode} with the
     * value provided by {@link //getMode}.</p>
     */
    execute(lexer) {
        lexer.mode(this.mode);
    }

    updateHashCode(hash) {
        hash.update(this.actionType, this.mode);
    }

    equals(other) {
        if (this === other) {
            return true;
        } else if (! (other instanceof LexerModeAction)) {
            return false;
        } else {
            return this.mode === other.mode;
        }
    }

    toString() {
        return "mode(" + this.mode + ")";
    }
}

/**
 * Executes a custom lexer action by calling {@link Recognizer//action} with the
 * rule and action indexes assigned to the custom action. The implementation of
 * a custom action is added to the generated code for the lexer in an override
 * of {@link Recognizer//action} when the grammar is compiled.
 *
 * <p>This class may represent embedded actions created with the <code>{...}</code>
 * syntax in ANTLR 4, as well as actions created for lexer commands where the
 * command argument could not be evaluated when the grammar was compiled.</p>
 */
class LexerCustomAction extends LexerAction {
    /**
     * Constructs a custom lexer action with the specified rule and action
     * indexes.
     *
     * @param ruleIndex The rule index to use for calls to
     * {@link Recognizer//action}.
     * @param actionIndex The action index to use for calls to
     * {@link Recognizer//action}.
     */
    constructor(ruleIndex, actionIndex) {
        super(LexerActionType.CUSTOM);
        this.ruleIndex = ruleIndex;
        this.actionIndex = actionIndex;
        this.isPositionDependent = true;
    }

    /**
     * <p>Custom actions are implemented by calling {@link Lexer//action} with the
     * appropriate rule and action indexes.</p>
     */
    execute(lexer) {
        lexer.action(null, this.ruleIndex, this.actionIndex);
    }

    updateHashCode(hash) {
        hash.update(this.actionType, this.ruleIndex, this.actionIndex);
    }

    equals(other) {
        if (this === other) {
            return true;
        } else if (! (other instanceof LexerCustomAction)) {
            return false;
        } else {
            return this.ruleIndex === other.ruleIndex && this.actionIndex === other.actionIndex;
        }
    }
}

/**
 * Implements the {@code channel} lexer action by calling
 * {@link Lexer//setChannel} with the assigned channel.
 * Constructs a new {@code channel} action with the specified channel value.
 * @param channel The channel value to pass to {@link Lexer//setChannel}
 */
class LexerChannelAction extends LexerAction {
    constructor(channel) {
        super(LexerActionType.CHANNEL);
        this.channel = channel;
    }

    /**
     * <p>This action is implemented by calling {@link Lexer//setChannel} with the
     * value provided by {@link //getChannel}.</p>
     */
    execute(lexer) {
        lexer._channel = this.channel;
    }

    updateHashCode(hash) {
        hash.update(this.actionType, this.channel);
    }

    equals(other) {
        if (this === other) {
            return true;
        } else if (! (other instanceof LexerChannelAction)) {
            return false;
        } else {
            return this.channel === other.channel;
        }
    }

    toString() {
        return "channel(" + this.channel + ")";
    }
}


/**
 * This implementation of {@link LexerAction} is used for tracking input offsets
 * for position-dependent actions within a {@link LexerActionExecutor}.
 *
 * <p>This action is not serialized as part of the ATN, and is only required for
 * position-dependent lexer actions which appear at a location other than the
 * end of a rule. For more information about DFA optimizations employed for
 * lexer actions, see {@link LexerActionExecutor//append} and
 * {@link LexerActionExecutor//fixOffsetBeforeMatch}.</p>
 *
 * Constructs a new indexed custom action by associating a character offset
 * with a {@link LexerAction}.
 *
 * <p>Note: This class is only required for lexer actions for which
 * {@link LexerAction//isPositionDependent} returns {@code true}.</p>
 *
 * @param offset The offset into the input {@link CharStream}, relative to
 * the token start index, at which the specified lexer action should be
 * executed.
 * @param action The lexer action to execute at a particular offset in the
 * input {@link CharStream}.
 */
class LexerIndexedCustomAction extends LexerAction {
    constructor(offset, action) {
        super(action.actionType);
        this.offset = offset;
        this.action = action;
        this.isPositionDependent = true;
    }

    /**
     * <p>This method calls {@link //execute} on the result of {@link //getAction}
     * using the provided {@code lexer}.</p>
     */
    execute(lexer) {
        // assume the input stream position was properly set by the calling code
        this.action.execute(lexer);
    }

    updateHashCode(hash) {
        hash.update(this.actionType, this.offset, this.action);
    }

    equals(other) {
        if (this === other) {
            return true;
        } else if (! (other instanceof LexerIndexedCustomAction)) {
            return false;
        } else {
            return this.offset === other.offset && this.action === other.action;
        }
    }
}

module.exports = {
    LexerActionType,
    LexerSkipAction,
    LexerChannelAction,
    LexerCustomAction,
    LexerIndexedCustomAction,
    LexerMoreAction,
    LexerTypeAction,
    LexerPushModeAction,
    LexerPopModeAction,
    LexerModeAction
}

},{}],27:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const {hashStuff} = require("../Utils");
const {LexerIndexedCustomAction} = require('./LexerAction');

class LexerActionExecutor {
	/**
	 * Represents an executor for a sequence of lexer actions which traversed during
	 * the matching operation of a lexer rule (token).
	 *
	 * <p>The executor tracks position information for position-dependent lexer actions
	 * efficiently, ensuring that actions appearing only at the end of the rule do
	 * not cause bloating of the {@link DFA} created for the lexer.</p>
	 */
	constructor(lexerActions) {
		this.lexerActions = lexerActions === null ? [] : lexerActions;
		/**
		 * Caches the result of {@link //hashCode} since the hash code is an element
		 * of the performance-critical {@link LexerATNConfig//hashCode} operation
		 */
		this.cachedHashCode = hashStuff(lexerActions); // "".join([str(la) for la in
		// lexerActions]))
		return this;
	}

	/**
	 * Creates a {@link LexerActionExecutor} which encodes the current offset
	 * for position-dependent lexer actions.
	 *
	 * <p>Normally, when the executor encounters lexer actions where
	 * {@link LexerAction//isPositionDependent} returns {@code true}, it calls
	 * {@link IntStream//seek} on the input {@link CharStream} to set the input
	 * position to the <em>end</em> of the current token. This behavior provides
	 * for efficient DFA representation of lexer actions which appear at the end
	 * of a lexer rule, even when the lexer rule matches a variable number of
	 * characters.</p>
	 *
	 * <p>Prior to traversing a match transition in the ATN, the current offset
	 * from the token start index is assigned to all position-dependent lexer
	 * actions which have not already been assigned a fixed offset. By storing
	 * the offsets relative to the token start index, the DFA representation of
	 * lexer actions which appear in the middle of tokens remains efficient due
	 * to sharing among tokens of the same length, regardless of their absolute
	 * position in the input stream.</p>
	 *
	 * <p>If the current executor already has offsets assigned to all
	 * position-dependent lexer actions, the method returns {@code this}.</p>
	 *
	 * @param offset The current offset to assign to all position-dependent
	 * lexer actions which do not already have offsets assigned.
	 *
	 * @return {LexerActionExecutor} A {@link LexerActionExecutor} which stores input stream offsets
	 * for all position-dependent lexer actions.
	 */
	fixOffsetBeforeMatch(offset) {
		let updatedLexerActions = null;
		for (let i = 0; i < this.lexerActions.length; i++) {
			if (this.lexerActions[i].isPositionDependent &&
					!(this.lexerActions[i] instanceof LexerIndexedCustomAction)) {
				if (updatedLexerActions === null) {
					updatedLexerActions = this.lexerActions.concat([]);
				}
				updatedLexerActions[i] = new LexerIndexedCustomAction(offset,
						this.lexerActions[i]);
			}
		}
		if (updatedLexerActions === null) {
			return this;
		} else {
			return new LexerActionExecutor(updatedLexerActions);
		}
	}

	/**
	 * Execute the actions encapsulated by this executor within the context of a
	 * particular {@link Lexer}.
	 *
	 * <p>This method calls {@link IntStream//seek} to set the position of the
	 * {@code input} {@link CharStream} prior to calling
	 * {@link LexerAction//execute} on a position-dependent action. Before the
	 * method returns, the input position will be restored to the same position
	 * it was in when the method was invoked.</p>
	 *
	 * @param lexer The lexer instance.
	 * @param input The input stream which is the source for the current token.
	 * When this method is called, the current {@link IntStream//index} for
	 * {@code input} should be the start of the following token, i.e. 1
	 * character past the end of the current token.
	 * @param startIndex The token start index. This value may be passed to
	 * {@link IntStream//seek} to set the {@code input} position to the beginning
	 * of the token.
	 */
	execute(lexer, input, startIndex) {
		let requiresSeek = false;
		const stopIndex = input.index;
		try {
			for (let i = 0; i < this.lexerActions.length; i++) {
				let lexerAction = this.lexerActions[i];
				if (lexerAction instanceof LexerIndexedCustomAction) {
					const offset = lexerAction.offset;
					input.seek(startIndex + offset);
					lexerAction = lexerAction.action;
					requiresSeek = (startIndex + offset) !== stopIndex;
				} else if (lexerAction.isPositionDependent) {
					input.seek(stopIndex);
					requiresSeek = false;
				}
				lexerAction.execute(lexer);
			}
		} finally {
			if (requiresSeek) {
				input.seek(stopIndex);
			}
		}
	}

	hashCode() {
		return this.cachedHashCode;
	}

	updateHashCode(hash) {
		hash.update(this.cachedHashCode);
	}

	equals(other) {
		if (this === other) {
			return true;
		} else if (!(other instanceof LexerActionExecutor)) {
			return false;
		} else if (this.cachedHashCode != other.cachedHashCode) {
			return false;
		} else if (this.lexerActions.length != other.lexerActions.length) {
			return false;
		} else {
			const numActions = this.lexerActions.length
			for (let idx = 0; idx < numActions; ++idx) {
				if (!this.lexerActions[idx].equals(other.lexerActions[idx])) {
					return false;
				}
			}
			return true;
		}
	}

	/**
	 * Creates a {@link LexerActionExecutor} which executes the actions for
	 * the input {@code lexerActionExecutor} followed by a specified
	 * {@code lexerAction}.
	 *
	 * @param lexerActionExecutor The executor for actions already traversed by
	 * the lexer while matching a token within a particular
	 * {@link LexerATNConfig}. If this is {@code null}, the method behaves as
	 * though it were an empty executor.
	 * @param lexerAction The lexer action to execute after the actions
	 * specified in {@code lexerActionExecutor}.
	 *
	 * @return {LexerActionExecutor} A {@link LexerActionExecutor} for executing the combine actions
	 * of {@code lexerActionExecutor} and {@code lexerAction}.
	 */
	static append(lexerActionExecutor, lexerAction) {
		if (lexerActionExecutor === null) {
			return new LexerActionExecutor([ lexerAction ]);
		}
		const lexerActions = lexerActionExecutor.lexerActions.concat([ lexerAction ]);
		return new LexerActionExecutor(lexerActions);
	}
}


module.exports = LexerActionExecutor;

},{"../Utils":16,"./LexerAction":26}],28:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const Utils = require('./../Utils');
const {Set, BitSet, DoubleDict} = Utils;

const ATN = require('./ATN');
const {ATNState, RuleStopState} = require('./ATNState');

const {ATNConfig} = require('./ATNConfig');
const {ATNConfigSet} = require('./ATNConfigSet');
const {Token} = require('./../Token');
const {DFAState, PredPrediction} = require('./../dfa/DFAState');
const ATNSimulator = require('./ATNSimulator');
const PredictionMode = require('./PredictionMode');
const RuleContext = require('./../RuleContext');
const ParserRuleContext = require('./../ParserRuleContext');
const {SemanticContext} = require('./SemanticContext');
const {PredictionContext} = require('./../PredictionContext');
const {Interval} = require('./../IntervalSet');
const {Transition, SetTransition, NotSetTransition, RuleTransition, ActionTransition} = require('./Transition');
const {NoViableAltException} = require('./../error/Errors');
const {SingletonPredictionContext, predictionContextFromRuleContext} = require('./../PredictionContext');


/**
 * The embodiment of the adaptive LL(*), ALL(*), parsing strategy.
 *
 * <p>
 * The basic complexity of the adaptive strategy makes it harder to understand.
 * We begin with ATN simulation to build paths in a DFA. Subsequent prediction
 * requests go through the DFA first. If they reach a state without an edge for
 * the current symbol, the algorithm fails over to the ATN simulation to
 * complete the DFA path for the current input (until it finds a conflict state
 * or uniquely predicting state).</p>
 *
 * <p>
 * All of that is done without using the outer context because we want to create
 * a DFA that is not dependent upon the rule invocation stack when we do a
 * prediction. One DFA works in all contexts. We avoid using context not
 * necessarily because it's slower, although it can be, but because of the DFA
 * caching problem. The closure routine only considers the rule invocation stack
 * created during prediction beginning in the decision rule. For example, if
 * prediction occurs without invoking another rule's ATN, there are no context
 * stacks in the configurations. When lack of context leads to a conflict, we
 * don't know if it's an ambiguity or a weakness in the strong LL(*) parsing
 * strategy (versus full LL(*)).</p>
 *
 * <p>
 * When SLL yields a configuration set with conflict, we rewind the input and
 * retry the ATN simulation, this time using full outer context without adding
 * to the DFA. Configuration context stacks will be the full invocation stacks
 * from the start rule. If we get a conflict using full context, then we can
 * definitively say we have a true ambiguity for that input sequence. If we
 * don't get a conflict, it implies that the decision is sensitive to the outer
 * context. (It is not context-sensitive in the sense of context-sensitive
 * grammars.)</p>
 *
 * <p>
 * The next time we reach this DFA state with an SLL conflict, through DFA
 * simulation, we will again retry the ATN simulation using full context mode.
 * This is slow because we can't save the results and have to "interpret" the
 * ATN each time we get that input.</p>
 *
 * <p>
 * <strong>CACHING FULL CONTEXT PREDICTIONS</strong></p>
 *
 * <p>
 * We could cache results from full context to predicted alternative easily and
 * that saves a lot of time but doesn't work in presence of predicates. The set
 * of visible predicates from the ATN start state changes depending on the
 * context, because closure can fall off the end of a rule. I tried to cache
 * tuples (stack context, semantic context, predicted alt) but it was slower
 * than interpreting and much more complicated. Also required a huge amount of
 * memory. The goal is not to create the world's fastest parser anyway. I'd like
 * to keep this algorithm simple. By launching multiple threads, we can improve
 * the speed of parsing across a large number of files.</p>
 *
 * <p>
 * There is no strict ordering between the amount of input used by SLL vs LL,
 * which makes it really hard to build a cache for full context. Let's say that
 * we have input A B C that leads to an SLL conflict with full context X. That
 * implies that using X we might only use A B but we could also use A B C D to
 * resolve conflict. Input A B C D could predict alternative 1 in one position
 * in the input and A B C E could predict alternative 2 in another position in
 * input. The conflicting SLL configurations could still be non-unique in the
 * full context prediction, which would lead us to requiring more input than the
 * original A B C.	To make a	prediction cache work, we have to track	the exact
 * input	used during the previous prediction. That amounts to a cache that maps
 * X to a specific DFA for that context.</p>
 *
 * <p>
 * Something should be done for left-recursive expression predictions. They are
 * likely LL(1) + pred eval. Easier to do the whole SLL unless error and retry
 * with full LL thing Sam does.</p>
 *
 * <p>
 * <strong>AVOIDING FULL CONTEXT PREDICTION</strong></p>
 *
 * <p>
 * We avoid doing full context retry when the outer context is empty, we did not
 * dip into the outer context by falling off the end of the decision state rule,
 * or when we force SLL mode.</p>
 *
 * <p>
 * As an example of the not dip into outer context case, consider as super
 * constructor calls versus function calls. One grammar might look like
 * this:</p>
 *
 * <pre>
 * ctorBody
 *   : '{' superCall? stat* '}'
 *   ;
 * </pre>
 *
 * <p>
 * Or, you might see something like</p>
 *
 * <pre>
 * stat
 *   : superCall ';'
 *   | expression ';'
 *   | ...
 *   ;
 * </pre>
 *
 * <p>
 * In both cases I believe that no closure operations will dip into the outer
 * context. In the first case ctorBody in the worst case will stop at the '}'.
 * In the 2nd case it should stop at the ';'. Both cases should stay within the
 * entry rule and not dip into the outer context.</p>
 *
 * <p>
 * <strong>PREDICATES</strong></p>
 *
 * <p>
 * Predicates are always evaluated if present in either SLL or LL both. SLL and
 * LL simulation deals with predicates differently. SLL collects predicates as
 * it performs closure operations like ANTLR v3 did. It delays predicate
 * evaluation until it reaches and accept state. This allows us to cache the SLL
 * ATN simulation whereas, if we had evaluated predicates on-the-fly during
 * closure, the DFA state configuration sets would be different and we couldn't
 * build up a suitable DFA.</p>
 *
 * <p>
 * When building a DFA accept state during ATN simulation, we evaluate any
 * predicates and return the sole semantically valid alternative. If there is
 * more than 1 alternative, we report an ambiguity. If there are 0 alternatives,
 * we throw an exception. Alternatives without predicates act like they have
 * true predicates. The simple way to think about it is to strip away all
 * alternatives with false predicates and choose the minimum alternative that
 * remains.</p>
 *
 * <p>
 * When we start in the DFA and reach an accept state that's predicated, we test
 * those and return the minimum semantically viable alternative. If no
 * alternatives are viable, we throw an exception.</p>
 *
 * <p>
 * During full LL ATN simulation, closure always evaluates predicates and
 * on-the-fly. This is crucial to reducing the configuration set size during
 * closure. It hits a landmine when parsing with the Java grammar, for example,
 * without this on-the-fly evaluation.</p>
 *
 * <p>
 * <strong>SHARING DFA</strong></p>
 *
 * <p>
 * All instances of the same parser share the same decision DFAs through a
 * static field. Each instance gets its own ATN simulator but they share the
 * same {@link //decisionToDFA} field. They also share a
 * {@link PredictionContextCache} object that makes sure that all
 * {@link PredictionContext} objects are shared among the DFA states. This makes
 * a big size difference.</p>
 *
 * <p>
 * <strong>THREAD SAFETY</strong></p>
 *
 * <p>
 * The {@link ParserATNSimulator} locks on the {@link //decisionToDFA} field when
 * it adds a new DFA object to that array. {@link //addDFAEdge}
 * locks on the DFA for the current decision when setting the
 * {@link DFAState//edges} field. {@link //addDFAState} locks on
 * the DFA for the current decision when looking up a DFA state to see if it
 * already exists. We must make sure that all requests to add DFA states that
 * are equivalent result in the same shared DFA object. This is because lots of
 * threads will be trying to update the DFA at once. The
 * {@link //addDFAState} method also locks inside the DFA lock
 * but this time on the shared context cache when it rebuilds the
 * configurations' {@link PredictionContext} objects using cached
 * subgraphs/nodes. No other locking occurs, even during DFA simulation. This is
 * safe as long as we can guarantee that all threads referencing
 * {@code s.edge[t]} get the same physical target {@link DFAState}, or
 * {@code null}. Once into the DFA, the DFA simulation does not reference the
 * {@link DFA//states} map. It follows the {@link DFAState//edges} field to new
 * targets. The DFA simulator will either find {@link DFAState//edges} to be
 * {@code null}, to be non-{@code null} and {@code dfa.edges[t]} null, or
 * {@code dfa.edges[t]} to be non-null. The
 * {@link //addDFAEdge} method could be racing to set the field
 * but in either case the DFA simulator works; if {@code null}, and requests ATN
 * simulation. It could also race trying to get {@code dfa.edges[t]}, but either
 * way it will work because it's not doing a test and set operation.</p>
 *
 * <p>
 * <strong>Starting with SLL then failing to combined SLL/LL (Two-Stage
 * Parsing)</strong></p>
 *
 * <p>
 * Sam pointed out that if SLL does not give a syntax error, then there is no
 * point in doing full LL, which is slower. We only have to try LL if we get a
 * syntax error. For maximum speed, Sam starts the parser set to pure SLL
 * mode with the {@link BailErrorStrategy}:</p>
 *
 * <pre>
 * parser.{@link Parser//getInterpreter() getInterpreter()}.{@link //setPredictionMode setPredictionMode}{@code (}{@link PredictionMode//SLL}{@code )};
 * parser.{@link Parser//setErrorHandler setErrorHandler}(new {@link BailErrorStrategy}());
 * </pre>
 *
 * <p>
 * If it does not get a syntax error, then we're done. If it does get a syntax
 * error, we need to retry with the combined SLL/LL strategy.</p>
 *
 * <p>
 * The reason this works is as follows. If there are no SLL conflicts, then the
 * grammar is SLL (at least for that input set). If there is an SLL conflict,
 * the full LL analysis must yield a set of viable alternatives which is a
 * subset of the alternatives reported by SLL. If the LL set is a singleton,
 * then the grammar is LL but not SLL. If the LL set is the same size as the SLL
 * set, the decision is SLL. If the LL set has size &gt; 1, then that decision
 * is truly ambiguous on the current input. If the LL set is smaller, then the
 * SLL conflict resolution might choose an alternative that the full LL would
 * rule out as a possibility based upon better context information. If that's
 * the case, then the SLL parse will definitely get an error because the full LL
 * analysis says it's not viable. If SLL conflict resolution chooses an
 * alternative within the LL set, them both SLL and LL would choose the same
 * alternative because they both choose the minimum of multiple conflicting
 * alternatives.</p>
 *
 * <p>
 * Let's say we have a set of SLL conflicting alternatives {@code {1, 2, 3}} and
 * a smaller LL set called <em>s</em>. If <em>s</em> is {@code {2, 3}}, then SLL
 * parsing will get an error because SLL will pursue alternative 1. If
 * <em>s</em> is {@code {1, 2}} or {@code {1, 3}} then both SLL and LL will
 * choose the same alternative because alternative one is the minimum of either
 * set. If <em>s</em> is {@code {2}} or {@code {3}} then SLL will get a syntax
 * error. If <em>s</em> is {@code {1}} then SLL will succeed.</p>
 *
 * <p>
 * Of course, if the input is invalid, then we will get an error for sure in
 * both SLL and LL parsing. Erroneous input will therefore require 2 passes over
 * the input.</p>
 */
class ParserATNSimulator extends ATNSimulator {
    constructor(parser, atn, decisionToDFA, sharedContextCache) {
        super(atn, sharedContextCache);
        this.parser = parser;
        this.decisionToDFA = decisionToDFA;
        // SLL, LL, or LL + exact ambig detection?//
        this.predictionMode = PredictionMode.LL;
        // LAME globals to avoid parameters!!!!! I need these down deep in predTransition
        this._input = null;
        this._startIndex = 0;
        this._outerContext = null;
        this._dfa = null;
        /**
         * Each prediction operation uses a cache for merge of prediction contexts.
         *  Don't keep around as it wastes huge amounts of memory. DoubleKeyMap
         *  isn't synchronized but we're ok since two threads shouldn't reuse same
         *  parser/atnsim object because it can only handle one input at a time.
         *  This maps graphs a and b to merged result c. (a,b)&rarr;c. We can avoid
         *  the merge if we ever see a and b again.  Note that (b,a)&rarr;c should
         *  also be examined during cache lookup.
         */
        this.mergeCache = null;
        this.debug = false;
        this.debug_closure = false;
        this.debug_add = false;
        this.debug_list_atn_decisions = false;
        this.dfa_debug = false;
        this.retry_debug = false;
    }

    reset() {}

    adaptivePredict(input, decision, outerContext) {
        if (this.debug || this.debug_list_atn_decisions) {
            console.log("adaptivePredict decision " + decision +
                                   " exec LA(1)==" + this.getLookaheadName(input) +
                                   " line " + input.LT(1).line + ":" +
                                   input.LT(1).column);
        }
        this._input = input;
        this._startIndex = input.index;
        this._outerContext = outerContext;

        const dfa = this.decisionToDFA[decision];
        this._dfa = dfa;
        const m = input.mark();
        const index = input.index;

        // Now we are certain to have a specific decision's DFA
        // But, do we still need an initial state?
        try {
            let s0;
            if (dfa.precedenceDfa) {
                // the start state for a precedence DFA depends on the current
                // parser precedence, and is provided by a DFA method.
                s0 = dfa.getPrecedenceStartState(this.parser.getPrecedence());
            } else {
                // the start state for a "regular" DFA is just s0
                s0 = dfa.s0;
            }
            if (s0===null) {
                if (outerContext===null) {
                    outerContext = RuleContext.EMPTY;
                }
                if (this.debug || this.debug_list_atn_decisions) {
                    console.log("predictATN decision " + dfa.decision +
                                       " exec LA(1)==" + this.getLookaheadName(input) +
                                       ", outerContext=" + outerContext.toString(this.parser.ruleNames));
                }

                const fullCtx = false;
                let s0_closure = this.computeStartState(dfa.atnStartState, RuleContext.EMPTY, fullCtx);

                if( dfa.precedenceDfa) {
                    // If this is a precedence DFA, we use applyPrecedenceFilter
                    // to convert the computed start state to a precedence start
                    // state. We then use DFA.setPrecedenceStartState to set the
                    // appropriate start state for the precedence level rather
                    // than simply setting DFA.s0.
                    //
                    dfa.s0.configs = s0_closure; // not used for prediction but useful to know start configs anyway
                    s0_closure = this.applyPrecedenceFilter(s0_closure);
                    s0 = this.addDFAState(dfa, new DFAState(null, s0_closure));
                    dfa.setPrecedenceStartState(this.parser.getPrecedence(), s0);
                } else {
                    s0 = this.addDFAState(dfa, new DFAState(null, s0_closure));
                    dfa.s0 = s0;
                }
            }
            const alt = this.execATN(dfa, s0, input, index, outerContext);
            if (this.debug) {
                console.log("DFA after predictATN: " + dfa.toString(this.parser.literalNames));
            }
            return alt;
        } finally {
            this._dfa = null;
            this.mergeCache = null; // wack cache after each prediction
            input.seek(index);
            input.release(m);
        }
    }

    /**
     * Performs ATN simulation to compute a predicted alternative based
     *  upon the remaining input, but also updates the DFA cache to avoid
     *  having to traverse the ATN again for the same input sequence.
     *
     * There are some key conditions we're looking for after computing a new
     * set of ATN configs (proposed DFA state):
     *       if the set is empty, there is no viable alternative for current symbol
     *       does the state uniquely predict an alternative?
     *       does the state have a conflict that would prevent us from
     *         putting it on the work list?
     *
     * We also have some key operations to do:
     *       add an edge from previous DFA state to potentially new DFA state, D,
     *         upon current symbol but only if adding to work list, which means in all
     *         cases except no viable alternative (and possibly non-greedy decisions?)
     *       collecting predicates and adding semantic context to DFA accept states
     *       adding rule context to context-sensitive DFA accept states
     *       consuming an input symbol
     *       reporting a conflict
     *       reporting an ambiguity
     *       reporting a context sensitivity
     *       reporting insufficient predicates
     *
     * cover these cases:
     *    dead end
     *    single alt
     *    single alt + preds
     *    conflict
     *    conflict + preds
     *
     */
    execATN(dfa, s0, input, startIndex, outerContext ) {
        if (this.debug || this.debug_list_atn_decisions) {
            console.log("execATN decision " + dfa.decision +
                    " exec LA(1)==" + this.getLookaheadName(input) +
                    " line " + input.LT(1).line + ":" + input.LT(1).column);
        }
        let alt;
        let previousD = s0;

        if (this.debug) {
            console.log("s0 = " + s0);
        }
        let t = input.LA(1);
        while(true) { // while more work
            let D = this.getExistingTargetState(previousD, t);
            if(D===null) {
                D = this.computeTargetState(dfa, previousD, t);
            }
            if(D===ATNSimulator.ERROR) {
                // if any configs in previous dipped into outer context, that
                // means that input up to t actually finished entry rule
                // at least for SLL decision. Full LL doesn't dip into outer
                // so don't need special case.
                // We will get an error no matter what so delay until after
                // decision; better error message. Also, no reachable target
                // ATN states in SLL implies LL will also get nowhere.
                // If conflict in states that dip out, choose min since we
                // will get error no matter what.
                const e = this.noViableAlt(input, outerContext, previousD.configs, startIndex);
                input.seek(startIndex);
                alt = this.getSynValidOrSemInvalidAltThatFinishedDecisionEntryRule(previousD.configs, outerContext);
                if(alt!==ATN.INVALID_ALT_NUMBER) {
                    return alt;
                } else {
                    throw e;
                }
            }
            if(D.requiresFullContext && this.predictionMode !== PredictionMode.SLL) {
                // IF PREDS, MIGHT RESOLVE TO SINGLE ALT => SLL (or syntax error)
                let conflictingAlts = null;
                if (D.predicates!==null) {
                    if (this.debug) {
                        console.log("DFA state has preds in DFA sim LL failover");
                    }
                    const conflictIndex = input.index;
                    if(conflictIndex !== startIndex) {
                        input.seek(startIndex);
                    }
                    conflictingAlts = this.evalSemanticContext(D.predicates, outerContext, true);
                    if (conflictingAlts.length===1) {
                        if(this.debug) {
                            console.log("Full LL avoided");
                        }
                        return conflictingAlts.minValue();
                    }
                    if (conflictIndex !== startIndex) {
                        // restore the index so reporting the fallback to full
                        // context occurs with the index at the correct spot
                        input.seek(conflictIndex);
                    }
                }
                if (this.dfa_debug) {
                    console.log("ctx sensitive state " + outerContext +" in " + D);
                }
                const fullCtx = true;
                const s0_closure = this.computeStartState(dfa.atnStartState, outerContext, fullCtx);
                this.reportAttemptingFullContext(dfa, conflictingAlts, D.configs, startIndex, input.index);
                alt = this.execATNWithFullContext(dfa, D, s0_closure, input, startIndex, outerContext);
                return alt;
            }
            if (D.isAcceptState) {
                if (D.predicates===null) {
                    return D.prediction;
                }
                const stopIndex = input.index;
                input.seek(startIndex);
                const alts = this.evalSemanticContext(D.predicates, outerContext, true);
                if (alts.length===0) {
                    throw this.noViableAlt(input, outerContext, D.configs, startIndex);
                } else if (alts.length===1) {
                    return alts.minValue();
                } else {
                    // report ambiguity after predicate evaluation to make sure the correct set of ambig alts is reported.
                    this.reportAmbiguity(dfa, D, startIndex, stopIndex, false, alts, D.configs);
                    return alts.minValue();
                }
            }
            previousD = D;

            if (t !== Token.EOF) {
                input.consume();
                t = input.LA(1);
            }
        }
    }

    /**
     * Get an existing target state for an edge in the DFA. If the target state
     * for the edge has not yet been computed or is otherwise not available,
     * this method returns {@code null}.
     *
     * @param previousD The current DFA state
     * @param t The next input symbol
     * @return The existing target DFA state for the given input symbol
     * {@code t}, or {@code null} if the target state for this edge is not
     * already cached
     */
    getExistingTargetState(previousD, t) {
        const edges = previousD.edges;
        if (edges===null) {
            return null;
        } else {
            return edges[t + 1] || null;
        }
    }

    /**
     * Compute a target state for an edge in the DFA, and attempt to add the
     * computed state and corresponding edge to the DFA.
     *
     * @param dfa The DFA
     * @param previousD The current DFA state
     * @param t The next input symbol
     *
     * @return The computed target DFA state for the given input symbol
     * {@code t}. If {@code t} does not lead to a valid DFA state, this method
     * returns {@link //ERROR
     */
    computeTargetState(dfa, previousD, t) {
       const reach = this.computeReachSet(previousD.configs, t, false);
        if(reach===null) {
            this.addDFAEdge(dfa, previousD, t, ATNSimulator.ERROR);
            return ATNSimulator.ERROR;
        }
        // create new target state; we'll add to DFA after it's complete
        let D = new DFAState(null, reach);

        const predictedAlt = this.getUniqueAlt(reach);

        if (this.debug) {
            const altSubSets = PredictionMode.getConflictingAltSubsets(reach);
            console.log("SLL altSubSets=" + Utils.arrayToString(altSubSets) +
                        ", previous=" + previousD.configs +
                        ", configs=" + reach +
                        ", predict=" + predictedAlt +
                        ", allSubsetsConflict=" +
                        PredictionMode.allSubsetsConflict(altSubSets) + ", conflictingAlts=" +
                        this.getConflictingAlts(reach));
        }
        if (predictedAlt!==ATN.INVALID_ALT_NUMBER) {
            // NO CONFLICT, UNIQUELY PREDICTED ALT
            D.isAcceptState = true;
            D.configs.uniqueAlt = predictedAlt;
            D.prediction = predictedAlt;
        } else if (PredictionMode.hasSLLConflictTerminatingPrediction(this.predictionMode, reach)) {
            // MORE THAN ONE VIABLE ALTERNATIVE
            D.configs.conflictingAlts = this.getConflictingAlts(reach);
            D.requiresFullContext = true;
            // in SLL-only mode, we will stop at this state and return the minimum alt
            D.isAcceptState = true;
            D.prediction = D.configs.conflictingAlts.minValue();
        }
        if (D.isAcceptState && D.configs.hasSemanticContext) {
            this.predicateDFAState(D, this.atn.getDecisionState(dfa.decision));
            if( D.predicates!==null) {
                D.prediction = ATN.INVALID_ALT_NUMBER;
            }
        }
        // all adds to dfa are done after we've created full D state
        D = this.addDFAEdge(dfa, previousD, t, D);
        return D;
    }

    predicateDFAState(dfaState, decisionState) {
        // We need to test all predicates, even in DFA states that
        // uniquely predict alternative.
        const nalts = decisionState.transitions.length;
        // Update DFA so reach becomes accept state with (predicate,alt)
        // pairs if preds found for conflicting alts
        const altsToCollectPredsFrom = this.getConflictingAltsOrUniqueAlt(dfaState.configs);
        const altToPred = this.getPredsForAmbigAlts(altsToCollectPredsFrom, dfaState.configs, nalts);
        if (altToPred!==null) {
            dfaState.predicates = this.getPredicatePredictions(altsToCollectPredsFrom, altToPred);
            dfaState.prediction = ATN.INVALID_ALT_NUMBER; // make sure we use preds
        } else {
            // There are preds in configs but they might go away
            // when OR'd together like {p}? || NONE == NONE. If neither
            // alt has preds, resolve to min alt
            dfaState.prediction = altsToCollectPredsFrom.minValue();
        }
    }

// comes back with reach.uniqueAlt set to a valid alt
    execATNWithFullContext(dfa, D, // how far we got before failing over
                                         s0,
                                         input,
                                         startIndex,
                                         outerContext) {
        if (this.debug || this.debug_list_atn_decisions) {
            console.log("execATNWithFullContext "+s0);
        }
        const fullCtx = true;
        let foundExactAmbig = false;
        let reach;
        let previous = s0;
        input.seek(startIndex);
        let t = input.LA(1);
        let predictedAlt = -1;
        while (true) { // while more work
            reach = this.computeReachSet(previous, t, fullCtx);
            if (reach===null) {
                // if any configs in previous dipped into outer context, that
                // means that input up to t actually finished entry rule
                // at least for LL decision. Full LL doesn't dip into outer
                // so don't need special case.
                // We will get an error no matter what so delay until after
                // decision; better error message. Also, no reachable target
                // ATN states in SLL implies LL will also get nowhere.
                // If conflict in states that dip out, choose min since we
                // will get error no matter what.
                const e = this.noViableAlt(input, outerContext, previous, startIndex);
                input.seek(startIndex);
                const alt = this.getSynValidOrSemInvalidAltThatFinishedDecisionEntryRule(previous, outerContext);
                if(alt!==ATN.INVALID_ALT_NUMBER) {
                    return alt;
                } else {
                    throw e;
                }
            }
            const altSubSets = PredictionMode.getConflictingAltSubsets(reach);
            if(this.debug) {
                console.log("LL altSubSets=" + altSubSets + ", predict=" +
                      PredictionMode.getUniqueAlt(altSubSets) + ", resolvesToJustOneViableAlt=" +
                      PredictionMode.resolvesToJustOneViableAlt(altSubSets));
            }
            reach.uniqueAlt = this.getUniqueAlt(reach);
            // unique prediction?
            if(reach.uniqueAlt!==ATN.INVALID_ALT_NUMBER) {
                predictedAlt = reach.uniqueAlt;
                break;
            } else if (this.predictionMode !== PredictionMode.LL_EXACT_AMBIG_DETECTION) {
                predictedAlt = PredictionMode.resolvesToJustOneViableAlt(altSubSets);
                if(predictedAlt !== ATN.INVALID_ALT_NUMBER) {
                    break;
                }
            } else {
                // In exact ambiguity mode, we never try to terminate early.
                // Just keeps scarfing until we know what the conflict is
                if (PredictionMode.allSubsetsConflict(altSubSets) && PredictionMode.allSubsetsEqual(altSubSets)) {
                    foundExactAmbig = true;
                    predictedAlt = PredictionMode.getSingleViableAlt(altSubSets);
                    break;
                }
                // else there are multiple non-conflicting subsets or
                // we're not sure what the ambiguity is yet.
                // So, keep going.
            }
            previous = reach;
            if( t !== Token.EOF) {
                input.consume();
                t = input.LA(1);
            }
        }
        // If the configuration set uniquely predicts an alternative,
        // without conflict, then we know that it's a full LL decision
        // not SLL.
        if (reach.uniqueAlt !== ATN.INVALID_ALT_NUMBER ) {
            this.reportContextSensitivity(dfa, predictedAlt, reach, startIndex, input.index);
            return predictedAlt;
        }
        // We do not check predicates here because we have checked them
        // on-the-fly when doing full context prediction.

        //
        // In non-exact ambiguity detection mode, we might	actually be able to
        // detect an exact ambiguity, but I'm not going to spend the cycles
        // needed to check. We only emit ambiguity warnings in exact ambiguity
        // mode.
        //
        // For example, we might know that we have conflicting configurations.
        // But, that does not mean that there is no way forward without a
        // conflict. It's possible to have nonconflicting alt subsets as in:

        // altSubSets=[{1, 2}, {1, 2}, {1}, {1, 2}]

        // from
        //
        //    [(17,1,[5 $]), (13,1,[5 10 $]), (21,1,[5 10 $]), (11,1,[$]),
        //     (13,2,[5 10 $]), (21,2,[5 10 $]), (11,2,[$])]
        //
        // In this case, (17,1,[5 $]) indicates there is some next sequence that
        // would resolve this without conflict to alternative 1. Any other viable
        // next sequence, however, is associated with a conflict.  We stop
        // looking for input because no amount of further lookahead will alter
        // the fact that we should predict alternative 1.  We just can't say for
        // sure that there is an ambiguity without looking further.

        this.reportAmbiguity(dfa, D, startIndex, input.index, foundExactAmbig, null, reach);

        return predictedAlt;
    }

    computeReachSet(closure, t, fullCtx) {
        if (this.debug) {
            console.log("in computeReachSet, starting closure: " + closure);
        }
        if( this.mergeCache===null) {
            this.mergeCache = new DoubleDict();
        }
        const intermediate = new ATNConfigSet(fullCtx);

        // Configurations already in a rule stop state indicate reaching the end
        // of the decision rule (local context) or end of the start rule (full
        // context). Once reached, these configurations are never updated by a
        // closure operation, so they are handled separately for the performance
        // advantage of having a smaller intermediate set when calling closure.
        //
        // For full-context reach operations, separate handling is required to
        // ensure that the alternative matching the longest overall sequence is
        // chosen when multiple such configurations can match the input.

        let skippedStopStates = null;

        // First figure out where we can reach on input t
        for (let i=0; i<closure.items.length;i++) {
            const c = closure.items[i];
            if(this.debug) {
                console.log("testing " + this.getTokenName(t) + " at " + c);
            }
            if (c.state instanceof RuleStopState) {
                if (fullCtx || t === Token.EOF) {
                    if (skippedStopStates===null) {
                        skippedStopStates = [];
                    }
                    skippedStopStates.push(c);
                    if(this.debug_add) {
                        console.log("added " + c + " to skippedStopStates");
                    }
                }
                continue;
            }
            for(let j=0;j<c.state.transitions.length;j++) {
                const trans = c.state.transitions[j];
                const target = this.getReachableTarget(trans, t);
                if (target!==null) {
                    const cfg = new ATNConfig({state:target}, c);
                    intermediate.add(cfg, this.mergeCache);
                    if(this.debug_add) {
                        console.log("added " + cfg + " to intermediate");
                    }
                }
            }
        }
        // Now figure out where the reach operation can take us...
        let reach = null;

        // This block optimizes the reach operation for intermediate sets which
        // trivially indicate a termination state for the overall
        // adaptivePredict operation.
        //
        // The conditions assume that intermediate
        // contains all configurations relevant to the reach set, but this
        // condition is not true when one or more configurations have been
        // withheld in skippedStopStates, or when the current symbol is EOF.
        //
        if (skippedStopStates===null && t!==Token.EOF) {
            if (intermediate.items.length===1) {
                // Don't pursue the closure if there is just one state.
                // It can only have one alternative; just add to result
                // Also don't pursue the closure if there is unique alternative
                // among the configurations.
                reach = intermediate;
            } else if (this.getUniqueAlt(intermediate)!==ATN.INVALID_ALT_NUMBER) {
                // Also don't pursue the closure if there is unique alternative
                // among the configurations.
                reach = intermediate;
            }
        }
        // If the reach set could not be trivially determined, perform a closure
        // operation on the intermediate set to compute its initial value.
        //
        if (reach===null) {
            reach = new ATNConfigSet(fullCtx);
            const closureBusy = new Set();
            const treatEofAsEpsilon = t === Token.EOF;
            for (let k=0; k<intermediate.items.length;k++) {
                this.closure(intermediate.items[k], reach, closureBusy, false, fullCtx, treatEofAsEpsilon);
            }
        }
        if (t === Token.EOF) {
            // After consuming EOF no additional input is possible, so we are
            // only interested in configurations which reached the end of the
            // decision rule (local context) or end of the start rule (full
            // context). Update reach to contain only these configurations. This
            // handles both explicit EOF transitions in the grammar and implicit
            // EOF transitions following the end of the decision or start rule.
            //
            // When reach==intermediate, no closure operation was performed. In
            // this case, removeAllConfigsNotInRuleStopState needs to check for
            // reachable rule stop states as well as configurations already in
            // a rule stop state.
            //
            // This is handled before the configurations in skippedStopStates,
            // because any configurations potentially added from that list are
            // already guaranteed to meet this condition whether or not it's
            // required.
            //
            reach = this.removeAllConfigsNotInRuleStopState(reach, reach === intermediate);
        }
        // If skippedStopStates!==null, then it contains at least one
        // configuration. For full-context reach operations, these
        // configurations reached the end of the start rule, in which case we
        // only add them back to reach if no configuration during the current
        // closure operation reached such a state. This ensures adaptivePredict
        // chooses an alternative matching the longest overall sequence when
        // multiple alternatives are viable.
        //
        if (skippedStopStates!==null && ( (! fullCtx) || (! PredictionMode.hasConfigInRuleStopState(reach)))) {
            for (let l=0; l<skippedStopStates.length;l++) {
                reach.add(skippedStopStates[l], this.mergeCache);
            }
        }
        if (reach.items.length===0) {
            return null;
        } else {
            return reach;
        }
    }

    /**
     * Return a configuration set containing only the configurations from
     * {@code configs} which are in a {@link RuleStopState}. If all
     * configurations in {@code configs} are already in a rule stop state, this
     * method simply returns {@code configs}.
     *
     * <p>When {@code lookToEndOfRule} is true, this method uses
     * {@link ATN//nextTokens} for each configuration in {@code configs} which is
     * not already in a rule stop state to see if a rule stop state is reachable
     * from the configuration via epsilon-only transitions.</p>
     *
     * @param configs the configuration set to update
     * @param lookToEndOfRule when true, this method checks for rule stop states
     * reachable by epsilon-only transitions from each configuration in
     * {@code configs}.
     *
     * @return {@code configs} if all configurations in {@code configs} are in a
     * rule stop state, otherwise return a new configuration set containing only
     * the configurations from {@code configs} which are in a rule stop state
     */
    removeAllConfigsNotInRuleStopState(configs, lookToEndOfRule) {
        if (PredictionMode.allConfigsInRuleStopStates(configs)) {
            return configs;
        }
        const result = new ATNConfigSet(configs.fullCtx);
        for(let i=0; i<configs.items.length;i++) {
            const config = configs.items[i];
            if (config.state instanceof RuleStopState) {
                result.add(config, this.mergeCache);
                continue;
            }
            if (lookToEndOfRule && config.state.epsilonOnlyTransitions) {
                const nextTokens = this.atn.nextTokens(config.state);
                if (nextTokens.contains(Token.EPSILON)) {
                    const endOfRuleState = this.atn.ruleToStopState[config.state.ruleIndex];
                    result.add(new ATNConfig({state:endOfRuleState}, config), this.mergeCache);
                }
            }
        }
        return result;
    }

    computeStartState(p, ctx, fullCtx) {
        // always at least the implicit call to start rule
        const initialContext = predictionContextFromRuleContext(this.atn, ctx);
        const configs = new ATNConfigSet(fullCtx);
        for(let i=0;i<p.transitions.length;i++) {
            const target = p.transitions[i].target;
            const c = new ATNConfig({ state:target, alt:i+1, context:initialContext }, null);
            const closureBusy = new Set();
            this.closure(c, configs, closureBusy, true, fullCtx, false);
        }
        return configs;
    }

    /**
     * This method transforms the start state computed by
     * {@link //computeStartState} to the special start state used by a
     * precedence DFA for a particular precedence value. The transformation
     * process applies the following changes to the start state's configuration
     * set.
     *
     * <ol>
     * <li>Evaluate the precedence predicates for each configuration using
     * {@link SemanticContext//evalPrecedence}.</li>
     * <li>Remove all configurations which predict an alternative greater than
     * 1, for which another configuration that predicts alternative 1 is in the
     * same ATN state with the same prediction context. This transformation is
     * valid for the following reasons:
     * <ul>
     * <li>The closure block cannot contain any epsilon transitions which bypass
     * the body of the closure, so all states reachable via alternative 1 are
     * part of the precedence alternatives of the transformed left-recursive
     * rule.</li>
     * <li>The "primary" portion of a left recursive rule cannot contain an
     * epsilon transition, so the only way an alternative other than 1 can exist
     * in a state that is also reachable via alternative 1 is by nesting calls
     * to the left-recursive rule, with the outer calls not being at the
     * preferred precedence level.</li>
     * </ul>
     * </li>
     * </ol>
     *
     * <p>
     * The prediction context must be considered by this filter to address
     * situations like the following.
     * </p>
     * <code>
     * <pre>
     * grammar TA;
     * prog: statement* EOF;
     * statement: letterA | statement letterA 'b' ;
     * letterA: 'a';
     * </pre>
     * </code>
     * <p>
     * If the above grammar, the ATN state immediately before the token
     * reference {@code 'a'} in {@code letterA} is reachable from the left edge
     * of both the primary and closure blocks of the left-recursive rule
     * {@code statement}. The prediction context associated with each of these
     * configurations distinguishes between them, and prevents the alternative
     * which stepped out to {@code prog} (and then back in to {@code statement}
     * from being eliminated by the filter.
     * </p>
     *
     * @param configs The configuration set computed by
     * {@link //computeStartState} as the start state for the DFA.
     * @return The transformed configuration set representing the start state
     * for a precedence DFA at a particular precedence level (determined by
     * calling {@link Parser//getPrecedence})
     */
    applyPrecedenceFilter(configs) {
        let config;
        const statesFromAlt1 = [];
        const configSet = new ATNConfigSet(configs.fullCtx);
        for(let i=0; i<configs.items.length; i++) {
            config = configs.items[i];
            // handle alt 1 first
            if (config.alt !== 1) {
                continue;
            }
            const updatedContext = config.semanticContext.evalPrecedence(this.parser, this._outerContext);
            if (updatedContext===null) {
                // the configuration was eliminated
                continue;
            }
            statesFromAlt1[config.state.stateNumber] = config.context;
            if (updatedContext !== config.semanticContext) {
                configSet.add(new ATNConfig({semanticContext:updatedContext}, config), this.mergeCache);
            } else {
                configSet.add(config, this.mergeCache);
            }
        }
        for(let i=0; i<configs.items.length; i++) {
            config = configs.items[i];
            if (config.alt === 1) {
                // already handled
                continue;
            }
            // In the future, this elimination step could be updated to also
            // filter the prediction context for alternatives predicting alt>1
            // (basically a graph subtraction algorithm).
            if (!config.precedenceFilterSuppressed) {
                const context = statesFromAlt1[config.state.stateNumber] || null;
                if (context!==null && context.equals(config.context)) {
                    // eliminated
                    continue;
                }
            }
            configSet.add(config, this.mergeCache);
        }
        return configSet;
    }

    getReachableTarget(trans, ttype) {
        if (trans.matches(ttype, 0, this.atn.maxTokenType)) {
            return trans.target;
        } else {
            return null;
        }
    }

    getPredsForAmbigAlts(ambigAlts, configs, nalts) {
        // REACH=[1|1|[]|0:0, 1|2|[]|0:1]
        // altToPred starts as an array of all null contexts. The entry at index i
        // corresponds to alternative i. altToPred[i] may have one of three values:
        //   1. null: no ATNConfig c is found such that c.alt==i
        //   2. SemanticContext.NONE: At least one ATNConfig c exists such that
        //      c.alt==i and c.semanticContext==SemanticContext.NONE. In other words,
        //      alt i has at least one unpredicated config.
        //   3. Non-NONE Semantic Context: There exists at least one, and for all
        //      ATNConfig c such that c.alt==i, c.semanticContext!=SemanticContext.NONE.
        //
        // From this, it is clear that NONE||anything==NONE.
        //
        let altToPred = [];
        for(let i=0;i<configs.items.length;i++) {
            const c = configs.items[i];
            if(ambigAlts.contains( c.alt )) {
                altToPred[c.alt] = SemanticContext.orContext(altToPred[c.alt] || null, c.semanticContext);
            }
        }
        let nPredAlts = 0;
        for (let i =1;i< nalts+1;i++) {
            const pred = altToPred[i] || null;
            if (pred===null) {
                altToPred[i] = SemanticContext.NONE;
            } else if (pred !== SemanticContext.NONE) {
                nPredAlts += 1;
            }
        }
        // nonambig alts are null in altToPred
        if (nPredAlts===0) {
            altToPred = null;
        }
        if (this.debug) {
            console.log("getPredsForAmbigAlts result " + Utils.arrayToString(altToPred));
        }
        return altToPred;
    }

    getPredicatePredictions(ambigAlts, altToPred) {
        const pairs = [];
        let containsPredicate = false;
        for (let i=1; i<altToPred.length;i++) {
            const pred = altToPred[i];
            // unpredicated is indicated by SemanticContext.NONE
            if( ambigAlts!==null && ambigAlts.contains( i )) {
                pairs.push(new PredPrediction(pred, i));
            }
            if (pred !== SemanticContext.NONE) {
                containsPredicate = true;
            }
        }
        if (! containsPredicate) {
            return null;
        }
        return pairs;
    }

    /**
     * This method is used to improve the localization of error messages by
     * choosing an alternative rather than throwing a
     * {@link NoViableAltException} in particular prediction scenarios where the
     * {@link //ERROR} state was reached during ATN simulation.
     *
     * <p>
     * The default implementation of this method uses the following
     * algorithm to identify an ATN configuration which successfully parsed the
     * decision entry rule. Choosing such an alternative ensures that the
     * {@link ParserRuleContext} returned by the calling rule will be complete
     * and valid, and the syntax error will be reported later at a more
     * localized location.</p>
     *
     * <ul>
     * <li>If a syntactically valid path or paths reach the end of the decision rule and
     * they are semantically valid if predicated, return the min associated alt.</li>
     * <li>Else, if a semantically invalid but syntactically valid path exist
     * or paths exist, return the minimum associated alt.
     * </li>
     * <li>Otherwise, return {@link ATN//INVALID_ALT_NUMBER}.</li>
     * </ul>
     *
     * <p>
     * In some scenarios, the algorithm described above could predict an
     * alternative which will result in a {@link FailedPredicateException} in
     * the parser. Specifically, this could occur if the <em>only</em> configuration
     * capable of successfully parsing to the end of the decision rule is
     * blocked by a semantic predicate. By choosing this alternative within
     * {@link //adaptivePredict} instead of throwing a
     * {@link NoViableAltException}, the resulting
     * {@link FailedPredicateException} in the parser will identify the specific
     * predicate which is preventing the parser from successfully parsing the
     * decision rule, which helps developers identify and correct logic errors
     * in semantic predicates.
     * </p>
     *
     * @param configs The ATN configurations which were valid immediately before
     * the {@link //ERROR} state was reached
     * @param outerContext The is the \gamma_0 initial parser context from the paper
     * or the parser stack at the instant before prediction commences.
     *
     * @return The value to return from {@link //adaptivePredict}, or
     * {@link ATN//INVALID_ALT_NUMBER} if a suitable alternative was not
     * identified and {@link //adaptivePredict} should report an error instead
     */
    getSynValidOrSemInvalidAltThatFinishedDecisionEntryRule(configs, outerContext) {
        const cfgs = this.splitAccordingToSemanticValidity(configs, outerContext);
        const semValidConfigs = cfgs[0];
        const semInvalidConfigs = cfgs[1];
        let alt = this.getAltThatFinishedDecisionEntryRule(semValidConfigs);
        if (alt!==ATN.INVALID_ALT_NUMBER) { // semantically/syntactically viable path exists
            return alt;
        }
        // Is there a syntactically valid path with a failed pred?
        if (semInvalidConfigs.items.length>0) {
            alt = this.getAltThatFinishedDecisionEntryRule(semInvalidConfigs);
            if (alt!==ATN.INVALID_ALT_NUMBER) { // syntactically viable path exists
                return alt;
            }
        }
        return ATN.INVALID_ALT_NUMBER;
    }

    getAltThatFinishedDecisionEntryRule(configs) {
        const alts = [];
        for(let i=0;i<configs.items.length; i++) {
            const c = configs.items[i];
            if (c.reachesIntoOuterContext>0 || ((c.state instanceof RuleStopState) && c.context.hasEmptyPath())) {
                if(alts.indexOf(c.alt)<0) {
                    alts.push(c.alt);
                }
            }
        }
        if (alts.length===0) {
            return ATN.INVALID_ALT_NUMBER;
        } else {
            return Math.min.apply(null, alts);
        }
    }

    /**
     * Walk the list of configurations and split them according to
     * those that have preds evaluating to true/false.  If no pred, assume
     * true pred and include in succeeded set.  Returns Pair of sets.
     *
     * Create a new set so as not to alter the incoming parameter.
     *
     * Assumption: the input stream has been restored to the starting point
     * prediction, which is where predicates need to evaluate.*/
    splitAccordingToSemanticValidity( configs, outerContext) {
        const succeeded = new ATNConfigSet(configs.fullCtx);
        const failed = new ATNConfigSet(configs.fullCtx);
        for(let i=0;i<configs.items.length; i++) {
            const c = configs.items[i];
            if (c.semanticContext !== SemanticContext.NONE) {
                const predicateEvaluationResult = c.semanticContext.evaluate(this.parser, outerContext);
                if (predicateEvaluationResult) {
                    succeeded.add(c);
                } else {
                    failed.add(c);
                }
            } else {
                succeeded.add(c);
            }
        }
        return [succeeded, failed];
    }

    /**
     * Look through a list of predicate/alt pairs, returning alts for the
     * pairs that win. A {@code NONE} predicate indicates an alt containing an
     * unpredicated config which behaves as "always true." If !complete
     * then we stop at the first predicate that evaluates to true. This
     * includes pairs with null predicates.
     */
    evalSemanticContext(predPredictions, outerContext, complete) {
        const predictions = new BitSet();
        for(let i=0;i<predPredictions.length;i++) {
            const pair = predPredictions[i];
            if (pair.pred === SemanticContext.NONE) {
                predictions.add(pair.alt);
                if (! complete) {
                    break;
                }
                continue;
            }
            const predicateEvaluationResult = pair.pred.evaluate(this.parser, outerContext);
            if (this.debug || this.dfa_debug) {
                console.log("eval pred " + pair + "=" + predicateEvaluationResult);
            }
            if (predicateEvaluationResult) {
                if (this.debug || this.dfa_debug) {
                    console.log("PREDICT " + pair.alt);
                }
                predictions.add(pair.alt);
                if (! complete) {
                    break;
                }
            }
        }
        return predictions;
    }

// TODO: If we are doing predicates, there is no point in pursuing
//     closure operations if we reach a DFA state that uniquely predicts
//     alternative. We will not be caching that DFA state and it is a
//     waste to pursue the closure. Might have to advance when we do
//     ambig detection thought :(
//
    closure(config, configs, closureBusy, collectPredicates, fullCtx, treatEofAsEpsilon) {
        const initialDepth = 0;
        this.closureCheckingStopState(config, configs, closureBusy, collectPredicates,
                                 fullCtx, initialDepth, treatEofAsEpsilon);
    }

    closureCheckingStopState(config, configs, closureBusy, collectPredicates, fullCtx, depth, treatEofAsEpsilon) {
        if (this.debug || this.debug_closure) {
            console.log("closure(" + config.toString(this.parser,true) + ")");
            // console.log("configs(" + configs.toString() + ")");
            if(config.reachesIntoOuterContext>50) {
                throw "problem";
            }
        }
        if (config.state instanceof RuleStopState) {
            // We hit rule end. If we have context info, use it
            // run thru all possible stack tops in ctx
            if (! config.context.isEmpty()) {
                for (let i =0; i<config.context.length; i++) {
                    if (config.context.getReturnState(i) === PredictionContext.EMPTY_RETURN_STATE) {
                        if (fullCtx) {
                            configs.add(new ATNConfig({state:config.state, context:PredictionContext.EMPTY}, config), this.mergeCache);
                            continue;
                        } else {
                            // we have no context info, just chase follow links (if greedy)
                            if (this.debug) {
                                console.log("FALLING off rule " + this.getRuleName(config.state.ruleIndex));
                            }
                            this.closure_(config, configs, closureBusy, collectPredicates,
                                     fullCtx, depth, treatEofAsEpsilon);
                        }
                        continue;
                    }
                    const returnState = this.atn.states[config.context.getReturnState(i)];
                    const newContext = config.context.getParent(i); // "pop" return state
                    const parms = {state:returnState, alt:config.alt, context:newContext, semanticContext:config.semanticContext};
                    const c = new ATNConfig(parms, null);
                    // While we have context to pop back from, we may have
                    // gotten that context AFTER having falling off a rule.
                    // Make sure we track that we are now out of context.
                    c.reachesIntoOuterContext = config.reachesIntoOuterContext;
                    this.closureCheckingStopState(c, configs, closureBusy, collectPredicates, fullCtx, depth - 1, treatEofAsEpsilon);
                }
                return;
            } else if( fullCtx) {
                // reached end of start rule
                configs.add(config, this.mergeCache);
                return;
            } else {
                // else if we have no context info, just chase follow links (if greedy)
                if (this.debug) {
                    console.log("FALLING off rule " + this.getRuleName(config.state.ruleIndex));
                }
            }
        }
        this.closure_(config, configs, closureBusy, collectPredicates, fullCtx, depth, treatEofAsEpsilon);
    }

    // Do the actual work of walking epsilon edges//
    closure_(config, configs, closureBusy, collectPredicates, fullCtx, depth, treatEofAsEpsilon) {
        const p = config.state;
        // optimization
        if (! p.epsilonOnlyTransitions) {
            configs.add(config, this.mergeCache);
            // make sure to not return here, because EOF transitions can act as
            // both epsilon transitions and non-epsilon transitions.
        }
        for(let i = 0;i<p.transitions.length; i++) {
            if(i === 0 && this.canDropLoopEntryEdgeInLeftRecursiveRule(config))
                continue;

            const t = p.transitions[i];
            const continueCollecting = collectPredicates && !(t instanceof ActionTransition);
            const c = this.getEpsilonTarget(config, t, continueCollecting, depth === 0, fullCtx, treatEofAsEpsilon);
            if (c!==null) {
                let newDepth = depth;
                if ( config.state instanceof RuleStopState) {
                    // target fell off end of rule; mark resulting c as having dipped into outer context
                    // We can't get here if incoming config was rule stop and we had context
                    // track how far we dip into outer context.  Might
                    // come in handy and we avoid evaluating context dependent
                    // preds if this is > 0.
                    if (this._dfa !== null && this._dfa.precedenceDfa) {
                        if (t.outermostPrecedenceReturn === this._dfa.atnStartState.ruleIndex) {
                            c.precedenceFilterSuppressed = true;
                        }
                    }

                    c.reachesIntoOuterContext += 1;
                    if (closureBusy.add(c)!==c) {
                        // avoid infinite recursion for right-recursive rules
                        continue;
                    }
                    configs.dipsIntoOuterContext = true; // TODO: can remove? only care when we add to set per middle of this method
                    newDepth -= 1;
                    if (this.debug) {
                        console.log("dips into outer ctx: " + c);
                    }
                } else {
                    if (!t.isEpsilon && closureBusy.add(c)!==c){
                        // avoid infinite recursion for EOF* and EOF+
                        continue;
                    }
                    if (t instanceof RuleTransition) {
                        // latch when newDepth goes negative - once we step out of the entry context we can't return
                        if (newDepth >= 0) {
                            newDepth += 1;
                        }
                    }
                }
                this.closureCheckingStopState(c, configs, closureBusy, continueCollecting, fullCtx, newDepth, treatEofAsEpsilon);
            }
        }
    }

    canDropLoopEntryEdgeInLeftRecursiveRule(config) {
        // return False
        const p = config.state;
        // First check to see if we are in StarLoopEntryState generated during
        // left-recursion elimination. For efficiency, also check if
        // the context has an empty stack case. If so, it would mean
        // global FOLLOW so we can't perform optimization
        // Are we the special loop entry/exit state? or SLL wildcard
        if(p.stateType !== ATNState.STAR_LOOP_ENTRY)
            return false;
        if(p.stateType !== ATNState.STAR_LOOP_ENTRY || !p.isPrecedenceDecision ||
               config.context.isEmpty() || config.context.hasEmptyPath())
            return false;

        // Require all return states to return back to the same rule that p is in.
        const numCtxs = config.context.length;
        for(let i=0; i<numCtxs; i++) { // for each stack context
            const returnState = this.atn.states[config.context.getReturnState(i)];
            if (returnState.ruleIndex !== p.ruleIndex)
                return false;
        }

        const decisionStartState = p.transitions[0].target;
        const blockEndStateNum = decisionStartState.endState.stateNumber;
        const blockEndState = this.atn.states[blockEndStateNum];

        // Verify that the top of each stack context leads to loop entry/exit
        // state through epsilon edges and w/o leaving rule.
        for(let i=0; i<numCtxs; i++) { // for each stack context
            const returnStateNumber = config.context.getReturnState(i);
            const returnState = this.atn.states[returnStateNumber];
            // all states must have single outgoing epsilon edge
            if (returnState.transitions.length !== 1 || !returnState.transitions[0].isEpsilon)
                return false;

            // Look for prefix op case like 'not expr', (' type ')' expr
            const returnStateTarget = returnState.transitions[0].target;
            if ( returnState.stateType === ATNState.BLOCK_END && returnStateTarget === p )
                continue;

            // Look for 'expr op expr' or case where expr's return state is block end
            // of (...)* internal block; the block end points to loop back
            // which points to p but we don't need to check that
            if ( returnState === blockEndState )
                continue;

            // Look for ternary expr ? expr : expr. The return state points at block end,
            // which points at loop entry state
            if ( returnStateTarget === blockEndState )
                continue;

            // Look for complex prefix 'between expr and expr' case where 2nd expr's
            // return state points at block end state of (...)* internal block
            if (returnStateTarget.stateType === ATNState.BLOCK_END && returnStateTarget.transitions.length === 1
                    && returnStateTarget.transitions[0].isEpsilon && returnStateTarget.transitions[0].target === p)
                continue;

            // anything else ain't conforming
            return false;
        }
        return true;
    }

    getRuleName(index) {
        if (this.parser!==null && index>=0) {
            return this.parser.ruleNames[index];
        } else {
            return "<rule " + index + ">";
        }
    }

    getEpsilonTarget(config, t, collectPredicates, inContext, fullCtx, treatEofAsEpsilon) {
        switch(t.serializationType) {
        case Transition.RULE:
            return this.ruleTransition(config, t);
        case Transition.PRECEDENCE:
            return this.precedenceTransition(config, t, collectPredicates, inContext, fullCtx);
        case Transition.PREDICATE:
            return this.predTransition(config, t, collectPredicates, inContext, fullCtx);
        case Transition.ACTION:
            return this.actionTransition(config, t);
        case Transition.EPSILON:
            return new ATNConfig({state:t.target}, config);
        case Transition.ATOM:
        case Transition.RANGE:
        case Transition.SET:
            // EOF transitions act like epsilon transitions after the first EOF
            // transition is traversed
            if (treatEofAsEpsilon) {
                if (t.matches(Token.EOF, 0, 1)) {
                    return new ATNConfig({state: t.target}, config);
                }
            }
            return null;
        default:
            return null;
        }
    }

    actionTransition(config, t) {
        if (this.debug) {
            const index = t.actionIndex === -1 ? 65535 : t.actionIndex;
            console.log("ACTION edge " + t.ruleIndex + ":" + index);
        }
        return new ATNConfig({state:t.target}, config);
    }

    precedenceTransition(config, pt, collectPredicates, inContext, fullCtx) {
        if (this.debug) {
            console.log("PRED (collectPredicates=" + collectPredicates + ") " +
                    pt.precedence + ">=_p, ctx dependent=true");
            if (this.parser!==null) {
                console.log("context surrounding pred is " + Utils.arrayToString(this.parser.getRuleInvocationStack()));
            }
        }
        let c = null;
        if (collectPredicates && inContext) {
            if (fullCtx) {
                // In full context mode, we can evaluate predicates on-the-fly
                // during closure, which dramatically reduces the size of
                // the config sets. It also obviates the need to test predicates
                // later during conflict resolution.
                const currentPosition = this._input.index;
                this._input.seek(this._startIndex);
                const predSucceeds = pt.getPredicate().evaluate(this.parser, this._outerContext);
                this._input.seek(currentPosition);
                if (predSucceeds) {
                    c = new ATNConfig({state:pt.target}, config); // no pred context
                }
            } else {
                const newSemCtx = SemanticContext.andContext(config.semanticContext, pt.getPredicate());
                c = new ATNConfig({state:pt.target, semanticContext:newSemCtx}, config);
            }
        } else {
            c = new ATNConfig({state:pt.target}, config);
        }
        if (this.debug) {
            console.log("config from pred transition=" + c);
        }
        return c;
    }

    predTransition(config, pt, collectPredicates, inContext, fullCtx) {
        if (this.debug) {
            console.log("PRED (collectPredicates=" + collectPredicates + ") " + pt.ruleIndex +
                    ":" + pt.predIndex + ", ctx dependent=" + pt.isCtxDependent);
            if (this.parser!==null) {
                console.log("context surrounding pred is " + Utils.arrayToString(this.parser.getRuleInvocationStack()));
            }
        }
        let c = null;
        if (collectPredicates && ((pt.isCtxDependent && inContext) || ! pt.isCtxDependent)) {
            if (fullCtx) {
                // In full context mode, we can evaluate predicates on-the-fly
                // during closure, which dramatically reduces the size of
                // the config sets. It also obviates the need to test predicates
                // later during conflict resolution.
                const currentPosition = this._input.index;
                this._input.seek(this._startIndex);
                const predSucceeds = pt.getPredicate().evaluate(this.parser, this._outerContext);
                this._input.seek(currentPosition);
                if (predSucceeds) {
                    c = new ATNConfig({state:pt.target}, config); // no pred context
                }
            } else {
                const newSemCtx = SemanticContext.andContext(config.semanticContext, pt.getPredicate());
                c = new ATNConfig({state:pt.target, semanticContext:newSemCtx}, config);
            }
        } else {
            c = new ATNConfig({state:pt.target}, config);
        }
        if (this.debug) {
            console.log("config from pred transition=" + c);
        }
        return c;
    }

    ruleTransition(config, t) {
        if (this.debug) {
            console.log("CALL rule " + this.getRuleName(t.target.ruleIndex) + ", ctx=" + config.context);
        }
        const returnState = t.followState;
        const newContext = SingletonPredictionContext.create(config.context, returnState.stateNumber);
        return new ATNConfig({state:t.target, context:newContext}, config );
    }

    getConflictingAlts(configs) {
        const altsets = PredictionMode.getConflictingAltSubsets(configs);
        return PredictionMode.getAlts(altsets);
    }

    /**
     * Sam pointed out a problem with the previous definition, v3, of
     * ambiguous states. If we have another state associated with conflicting
     * alternatives, we should keep going. For example, the following grammar
     *
     * s : (ID | ID ID?) ';' ;
     *
     * When the ATN simulation reaches the state before ';', it has a DFA
     * state that looks like: [12|1|[], 6|2|[], 12|2|[]]. Naturally
     * 12|1|[] and 12|2|[] conflict, but we cannot stop processing this node
     * because alternative to has another way to continue, via [6|2|[]].
     * The key is that we have a single state that has config's only associated
     * with a single alternative, 2, and crucially the state transitions
     * among the configurations are all non-epsilon transitions. That means
     * we don't consider any conflicts that include alternative 2. So, we
     * ignore the conflict between alts 1 and 2. We ignore a set of
     * conflicting alts when there is an intersection with an alternative
     * associated with a single alt state in the state&rarr;config-list map.
     *
     * It's also the case that we might have two conflicting configurations but
     * also a 3rd nonconflicting configuration for a different alternative:
     * [1|1|[], 1|2|[], 8|3|[]]. This can come about from grammar:
     *
     * a : A | A | A B ;
     *
     * After matching input A, we reach the stop state for rule A, state 1.
     * State 8 is the state right before B. Clearly alternatives 1 and 2
     * conflict and no amount of further lookahead will separate the two.
     * However, alternative 3 will be able to continue and so we do not
     * stop working on this state. In the previous example, we're concerned
     * with states associated with the conflicting alternatives. Here alt
     * 3 is not associated with the conflicting configs, but since we can continue
     * looking for input reasonably, I don't declare the state done. We
     * ignore a set of conflicting alts when we have an alternative
     * that we still need to pursue
     */
    getConflictingAltsOrUniqueAlt(configs) {
        let conflictingAlts = null;
        if (configs.uniqueAlt!== ATN.INVALID_ALT_NUMBER) {
            conflictingAlts = new BitSet();
            conflictingAlts.add(configs.uniqueAlt);
        } else {
            conflictingAlts = configs.conflictingAlts;
        }
        return conflictingAlts;
    }

    getTokenName(t) {
        if (t===Token.EOF) {
            return "EOF";
        }
        if( this.parser!==null && this.parser.literalNames!==null) {
            if (t >= this.parser.literalNames.length && t >= this.parser.symbolicNames.length) {
                console.log("" + t + " ttype out of range: " + this.parser.literalNames);
                console.log("" + this.parser.getInputStream().getTokens());
            } else {
                const name = this.parser.literalNames[t] || this.parser.symbolicNames[t];
                return name + "<" + t + ">";
            }
        }
        return "" + t;
    }

    getLookaheadName(input) {
        return this.getTokenName(input.LA(1));
    }

    /**
     * Used for debugging in adaptivePredict around execATN but I cut
     * it out for clarity now that alg. works well. We can leave this
     * "dead" code for a bit
     */
    dumpDeadEndConfigs(nvae) {
        console.log("dead end configs: ");
        const decs = nvae.getDeadEndConfigs();
        for(let i=0; i<decs.length; i++) {
            const c = decs[i];
            let trans = "no edges";
            if (c.state.transitions.length>0) {
                const t = c.state.transitions[0];
                if (t instanceof AtomTransition) {
                    trans = "Atom "+ this.getTokenName(t.label);
                } else if (t instanceof SetTransition) {
                    const neg = (t instanceof NotSetTransition);
                    trans = (neg ? "~" : "") + "Set " + t.set;
                }
            }
            console.error(c.toString(this.parser, true) + ":" + trans);
        }
    }

    noViableAlt(input, outerContext, configs, startIndex) {
        return new NoViableAltException(this.parser, input, input.get(startIndex), input.LT(1), configs, outerContext);
    }

    getUniqueAlt(configs) {
        let alt = ATN.INVALID_ALT_NUMBER;
        for(let i=0;i<configs.items.length;i++) {
            const c = configs.items[i];
            if (alt === ATN.INVALID_ALT_NUMBER) {
                alt = c.alt // found first alt
            } else if( c.alt!==alt) {
                return ATN.INVALID_ALT_NUMBER;
            }
        }
        return alt;
    }

    /**
     * Add an edge to the DFA, if possible. This method calls
     * {@link //addDFAState} to ensure the {@code to} state is present in the
     * DFA. If {@code from} is {@code null}, or if {@code t} is outside the
     * range of edges that can be represented in the DFA tables, this method
     * returns without adding the edge to the DFA.
     *
     * <p>If {@code to} is {@code null}, this method returns {@code null}.
     * Otherwise, this method returns the {@link DFAState} returned by calling
     * {@link //addDFAState} for the {@code to} state.</p>
     *
     * @param dfa The DFA
     * @param from_ The source state for the edge
     * @param t The input symbol
     * @param to The target state for the edge
     *
     * @return If {@code to} is {@code null}, this method returns {@code null};
     * otherwise this method returns the result of calling {@link //addDFAState}
     * on {@code to}
     */
    addDFAEdge(dfa, from_, t, to) {
        if( this.debug) {
            console.log("EDGE " + from_ + " -> " + to + " upon " + this.getTokenName(t));
        }
        if (to===null) {
            return null;
        }
        to = this.addDFAState(dfa, to); // used existing if possible not incoming
        if (from_===null || t < -1 || t > this.atn.maxTokenType) {
            return to;
        }
        if (from_.edges===null) {
            from_.edges = [];
        }
        from_.edges[t+1] = to; // connect

        if (this.debug) {
            const literalNames = this.parser===null ? null : this.parser.literalNames;
            const symbolicNames = this.parser===null ? null : this.parser.symbolicNames;
            console.log("DFA=\n" + dfa.toString(literalNames, symbolicNames));
        }
        return to;
    }

    /**
     * Add state {@code D} to the DFA if it is not already present, and return
     * the actual instance stored in the DFA. If a state equivalent to {@code D}
     * is already in the DFA, the existing state is returned. Otherwise this
     * method returns {@code D} after adding it to the DFA.
     *
     * <p>If {@code D} is {@link //ERROR}, this method returns {@link //ERROR} and
     * does not change the DFA.</p>
     *
     * @param dfa The dfa
     * @param D The DFA state to add
     * @return The state stored in the DFA. This will be either the existing
     * state if {@code D} is already in the DFA, or {@code D} itself if the
     * state was not already present
     */
    addDFAState(dfa, D) {
        if (D === ATNSimulator.ERROR) {
            return D;
        }
        const existing = dfa.states.get(D);
        if(existing!==null) {
            return existing;
        }
        D.stateNumber = dfa.states.length;
        if (! D.configs.readOnly) {
            D.configs.optimizeConfigs(this);
            D.configs.setReadonly(true);
        }
        dfa.states.add(D);
        if (this.debug) {
            console.log("adding new DFA state: " + D);
        }
        return D;
    }

    reportAttemptingFullContext(dfa, conflictingAlts, configs, startIndex, stopIndex) {
        if (this.debug || this.retry_debug) {
            const interval = new Interval(startIndex, stopIndex + 1);
            console.log("reportAttemptingFullContext decision=" + dfa.decision + ":" + configs +
                               ", input=" + this.parser.getTokenStream().getText(interval));
        }
        if (this.parser!==null) {
            this.parser.getErrorListenerDispatch().reportAttemptingFullContext(this.parser, dfa, startIndex, stopIndex, conflictingAlts, configs);
        }
    }

    reportContextSensitivity(dfa, prediction, configs, startIndex, stopIndex) {
        if (this.debug || this.retry_debug) {
            const interval = new Interval(startIndex, stopIndex + 1);
            console.log("reportContextSensitivity decision=" + dfa.decision + ":" + configs +
                               ", input=" + this.parser.getTokenStream().getText(interval));
        }
        if (this.parser!==null) {
            this.parser.getErrorListenerDispatch().reportContextSensitivity(this.parser, dfa, startIndex, stopIndex, prediction, configs);
        }
    }

    // If context sensitive parsing, we know it's ambiguity not conflict//
    reportAmbiguity(dfa, D, startIndex, stopIndex,
                                   exact, ambigAlts, configs ) {
        if (this.debug || this.retry_debug) {
            const interval = new Interval(startIndex, stopIndex + 1);
            console.log("reportAmbiguity " + ambigAlts + ":" + configs +
                               ", input=" + this.parser.getTokenStream().getText(interval));
        }
        if (this.parser!==null) {
            this.parser.getErrorListenerDispatch().reportAmbiguity(this.parser, dfa, startIndex, stopIndex, exact, ambigAlts, configs);
        }
    }
}

module.exports = ParserATNSimulator;

},{"./../IntervalSet":7,"./../ParserRuleContext":11,"./../PredictionContext":12,"./../RuleContext":14,"./../Token":15,"./../Utils":16,"./../dfa/DFAState":35,"./../error/Errors":40,"./ATN":17,"./ATNConfig":18,"./ATNConfigSet":19,"./ATNSimulator":22,"./ATNState":23,"./PredictionMode":29,"./SemanticContext":30,"./Transition":31}],29:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const {Map, BitSet, AltDict, hashStuff} = require('./../Utils');
const ATN = require('./ATN');
const {RuleStopState} = require('./ATNState');
const {ATNConfigSet} = require('./ATNConfigSet');
const {ATNConfig} = require('./ATNConfig');
const {SemanticContext} = require('./SemanticContext');

/**
 * This enumeration defines the prediction modes available in ANTLR 4 along with
 * utility methods for analyzing configuration sets for conflicts and/or
 * ambiguities.
 */
const PredictionMode = {
    /**
     * The SLL(*) prediction mode. This prediction mode ignores the current
     * parser context when making predictions. This is the fastest prediction
     * mode, and provides correct results for many grammars. This prediction
     * mode is more powerful than the prediction mode provided by ANTLR 3, but
     * may result in syntax errors for grammar and input combinations which are
     * not SLL.
     *
     * <p>
     * When using this prediction mode, the parser will either return a correct
     * parse tree (i.e. the same parse tree that would be returned with the
     * {@link //LL} prediction mode), or it will report a syntax error. If a
     * syntax error is encountered when using the {@link //SLL} prediction mode,
     * it may be due to either an actual syntax error in the input or indicate
     * that the particular combination of grammar and input requires the more
     * powerful {@link //LL} prediction abilities to complete successfully.</p>
     *
     * <p>
     * This prediction mode does not provide any guarantees for prediction
     * behavior for syntactically-incorrect inputs.</p>
     */
    SLL: 0,

    /**
     * The LL(*) prediction mode. This prediction mode allows the current parser
     * context to be used for resolving SLL conflicts that occur during
     * prediction. This is the fastest prediction mode that guarantees correct
     * parse results for all combinations of grammars with syntactically correct
     * inputs.
     *
     * <p>
     * When using this prediction mode, the parser will make correct decisions
     * for all syntactically-correct grammar and input combinations. However, in
     * cases where the grammar is truly ambiguous this prediction mode might not
     * report a precise answer for <em>exactly which</em> alternatives are
     * ambiguous.</p>
     *
     * <p>
     * This prediction mode does not provide any guarantees for prediction
     * behavior for syntactically-incorrect inputs.</p>
     */
    LL: 1,

    /**
     *
     * The LL(*) prediction mode with exact ambiguity detection. In addition to
     * the correctness guarantees provided by the {@link //LL} prediction mode,
     * this prediction mode instructs the prediction algorithm to determine the
     * complete and exact set of ambiguous alternatives for every ambiguous
     * decision encountered while parsing.
     *
     * <p>
     * This prediction mode may be used for diagnosing ambiguities during
     * grammar development. Due to the performance overhead of calculating sets
     * of ambiguous alternatives, this prediction mode should be avoided when
     * the exact results are not necessary.</p>
     *
     * <p>
     * This prediction mode does not provide any guarantees for prediction
     * behavior for syntactically-incorrect inputs.</p>
     */
    LL_EXACT_AMBIG_DETECTION: 2,

    /**
     *
     * Computes the SLL prediction termination condition.
     *
     * <p>
     * This method computes the SLL prediction termination condition for both of
     * the following cases.</p>
     *
     * <ul>
     * <li>The usual SLL+LL fallback upon SLL conflict</li>
     * <li>Pure SLL without LL fallback</li>
     * </ul>
     *
     * <p><strong>COMBINED SLL+LL PARSING</strong></p>
     *
     * <p>When LL-fallback is enabled upon SLL conflict, correct predictions are
     * ensured regardless of how the termination condition is computed by this
     * method. Due to the substantially higher cost of LL prediction, the
     * prediction should only fall back to LL when the additional lookahead
     * cannot lead to a unique SLL prediction.</p>
     *
     * <p>Assuming combined SLL+LL parsing, an SLL configuration set with only
     * conflicting subsets should fall back to full LL, even if the
     * configuration sets don't resolve to the same alternative (e.g.
     * {@code {1,2}} and {@code {3,4}}. If there is at least one non-conflicting
     * configuration, SLL could continue with the hopes that more lookahead will
     * resolve via one of those non-conflicting configurations.</p>
     *
     * <p>Here's the prediction termination rule them: SLL (for SLL+LL parsing)
     * stops when it sees only conflicting configuration subsets. In contrast,
     * full LL keeps going when there is uncertainty.</p>
     *
     * <p><strong>HEURISTIC</strong></p>
     *
     * <p>As a heuristic, we stop prediction when we see any conflicting subset
     * unless we see a state that only has one alternative associated with it.
     * The single-alt-state thing lets prediction continue upon rules like
     * (otherwise, it would admit defeat too soon):</p>
     *
     * <p>{@code [12|1|[], 6|2|[], 12|2|[]]. s : (ID | ID ID?) ';' ;}</p>
     *
     * <p>When the ATN simulation reaches the state before {@code ';'}, it has a
     * DFA state that looks like: {@code [12|1|[], 6|2|[], 12|2|[]]}. Naturally
     * {@code 12|1|[]} and {@code 12|2|[]} conflict, but we cannot stop
     * processing this node because alternative to has another way to continue,
     * via {@code [6|2|[]]}.</p>
     *
     * <p>It also let's us continue for this rule:</p>
     *
     * <p>{@code [1|1|[], 1|2|[], 8|3|[]] a : A | A | A B ;}</p>
     *
     * <p>After matching input A, we reach the stop state for rule A, state 1.
     * State 8 is the state right before B. Clearly alternatives 1 and 2
     * conflict and no amount of further lookahead will separate the two.
     * However, alternative 3 will be able to continue and so we do not stop
     * working on this state. In the previous example, we're concerned with
     * states associated with the conflicting alternatives. Here alt 3 is not
     * associated with the conflicting configs, but since we can continue
     * looking for input reasonably, don't declare the state done.</p>
     *
     * <p><strong>PURE SLL PARSING</strong></p>
     *
     * <p>To handle pure SLL parsing, all we have to do is make sure that we
     * combine stack contexts for configurations that differ only by semantic
     * predicate. From there, we can do the usual SLL termination heuristic.</p>
     *
     * <p><strong>PREDICATES IN SLL+LL PARSING</strong></p>
     *
     * <p>SLL decisions don't evaluate predicates until after they reach DFA stop
     * states because they need to create the DFA cache that works in all
     * semantic situations. In contrast, full LL evaluates predicates collected
     * during start state computation so it can ignore predicates thereafter.
     * This means that SLL termination detection can totally ignore semantic
     * predicates.</p>
     *
     * <p>Implementation-wise, {@link ATNConfigSet} combines stack contexts but not
     * semantic predicate contexts so we might see two configurations like the
     * following.</p>
     *
     * <p>{@code (s, 1, x, {}), (s, 1, x', {p})}</p>
     *
     * <p>Before testing these configurations against others, we have to merge
     * {@code x} and {@code x'} (without modifying the existing configurations).
     * For example, we test {@code (x+x')==x''} when looking for conflicts in
     * the following configurations.</p>
     *
     * <p>{@code (s, 1, x, {}), (s, 1, x', {p}), (s, 2, x'', {})}</p>
     *
     * <p>If the configuration set has predicates (as indicated by
     * {@link ATNConfigSet//hasSemanticContext}), this algorithm makes a copy of
     * the configurations to strip out all of the predicates so that a standard
     * {@link ATNConfigSet} will merge everything ignoring predicates.</p>
     */
    hasSLLConflictTerminatingPrediction: function( mode, configs) {
        // Configs in rule stop states indicate reaching the end of the decision
        // rule (local context) or end of start rule (full context). If all
        // configs meet this condition, then none of the configurations is able
        // to match additional input so we terminate prediction.
        //
        if (PredictionMode.allConfigsInRuleStopStates(configs)) {
            return true;
        }
        // pure SLL mode parsing
        if (mode === PredictionMode.SLL) {
            // Don't bother with combining configs from different semantic
            // contexts if we can fail over to full LL; costs more time
            // since we'll often fail over anyway.
            if (configs.hasSemanticContext) {
                // dup configs, tossing out semantic predicates
                const dup = new ATNConfigSet();
                for(let i=0;i<configs.items.length;i++) {
                    let c = configs.items[i];
                    c = new ATNConfig({semanticContext:SemanticContext.NONE}, c);
                    dup.add(c);
                }
                configs = dup;
            }
            // now we have combined contexts for configs with dissimilar preds
        }
        // pure SLL or combined SLL+LL mode parsing
        const altsets = PredictionMode.getConflictingAltSubsets(configs);
        return PredictionMode.hasConflictingAltSet(altsets) && !PredictionMode.hasStateAssociatedWithOneAlt(configs);
    },

    /**
     * Checks if any configuration in {@code configs} is in a
     * {@link RuleStopState}. Configurations meeting this condition have reached
     * the end of the decision rule (local context) or end of start rule (full
     * context).
     *
     * @param configs the configuration set to test
     * @return {@code true} if any configuration in {@code configs} is in a
     * {@link RuleStopState}, otherwise {@code false}
     */
    hasConfigInRuleStopState: function(configs) {
        for(let i=0;i<configs.items.length;i++) {
            const c = configs.items[i];
            if (c.state instanceof RuleStopState) {
                return true;
            }
        }
        return false;
    },

    /**
     * Checks if all configurations in {@code configs} are in a
     * {@link RuleStopState}. Configurations meeting this condition have reached
     * the end of the decision rule (local context) or end of start rule (full
     * context).
     *
     * @param configs the configuration set to test
     * @return {@code true} if all configurations in {@code configs} are in a
     * {@link RuleStopState}, otherwise {@code false}
     */
    allConfigsInRuleStopStates: function(configs) {
        for(let i=0;i<configs.items.length;i++) {
            const c = configs.items[i];
            if (!(c.state instanceof RuleStopState)) {
                return false;
            }
        }
        return true;
    },

    /**
     *
     * Full LL prediction termination.
     *
     * <p>Can we stop looking ahead during ATN simulation or is there some
     * uncertainty as to which alternative we will ultimately pick, after
     * consuming more input? Even if there are partial conflicts, we might know
     * that everything is going to resolve to the same minimum alternative. That
     * means we can stop since no more lookahead will change that fact. On the
     * other hand, there might be multiple conflicts that resolve to different
     * minimums. That means we need more look ahead to decide which of those
     * alternatives we should predict.</p>
     *
     * <p>The basic idea is to split the set of configurations {@code C}, into
     * conflicting subsets {@code (s, _, ctx, _)} and singleton subsets with
     * non-conflicting configurations. Two configurations conflict if they have
     * identical {@link ATNConfig//state} and {@link ATNConfig//context} values
     * but different {@link ATNConfig//alt} value, e.g. {@code (s, i, ctx, _)}
     * and {@code (s, j, ctx, _)} for {@code i!=j}.</p>
     *
     * <p>Reduce these configuration subsets to the set of possible alternatives.
     * You can compute the alternative subsets in one pass as follows:</p>
     *
     * <p>{@code A_s,ctx = {i | (s, i, ctx, _)}} for each configuration in
     * {@code C} holding {@code s} and {@code ctx} fixed.</p>
     *
     * <p>Or in pseudo-code, for each configuration {@code c} in {@code C}:</p>
     *
     * <pre>
     * map[c] U= c.{@link ATNConfig//alt alt} // map hash/equals uses s and x, not
     * alt and not pred
     * </pre>
     *
     * <p>The values in {@code map} are the set of {@code A_s,ctx} sets.</p>
     *
     * <p>If {@code |A_s,ctx|=1} then there is no conflict associated with
     * {@code s} and {@code ctx}.</p>
     *
     * <p>Reduce the subsets to singletons by choosing a minimum of each subset. If
     * the union of these alternative subsets is a singleton, then no amount of
     * more lookahead will help us. We will always pick that alternative. If,
     * however, there is more than one alternative, then we are uncertain which
     * alternative to predict and must continue looking for resolution. We may
     * or may not discover an ambiguity in the future, even if there are no
     * conflicting subsets this round.</p>
     *
     * <p>The biggest sin is to terminate early because it means we've made a
     * decision but were uncertain as to the eventual outcome. We haven't used
     * enough lookahead. On the other hand, announcing a conflict too late is no
     * big deal; you will still have the conflict. It's just inefficient. It
     * might even look until the end of file.</p>
     *
     * <p>No special consideration for semantic predicates is required because
     * predicates are evaluated on-the-fly for full LL prediction, ensuring that
     * no configuration contains a semantic context during the termination
     * check.</p>
     *
     * <p><strong>CONFLICTING CONFIGS</strong></p>
     *
     * <p>Two configurations {@code (s, i, x)} and {@code (s, j, x')}, conflict
     * when {@code i!=j} but {@code x=x'}. Because we merge all
     * {@code (s, i, _)} configurations together, that means that there are at
     * most {@code n} configurations associated with state {@code s} for
     * {@code n} possible alternatives in the decision. The merged stacks
     * complicate the comparison of configuration contexts {@code x} and
     * {@code x'}. Sam checks to see if one is a subset of the other by calling
     * merge and checking to see if the merged result is either {@code x} or
     * {@code x'}. If the {@code x} associated with lowest alternative {@code i}
     * is the superset, then {@code i} is the only possible prediction since the
     * others resolve to {@code min(i)} as well. However, if {@code x} is
     * associated with {@code j>i} then at least one stack configuration for
     * {@code j} is not in conflict with alternative {@code i}. The algorithm
     * should keep going, looking for more lookahead due to the uncertainty.</p>
     *
     * <p>For simplicity, I'm doing a equality check between {@code x} and
     * {@code x'} that lets the algorithm continue to consume lookahead longer
     * than necessary. The reason I like the equality is of course the
     * simplicity but also because that is the test you need to detect the
     * alternatives that are actually in conflict.</p>
     *
     * <p><strong>CONTINUE/STOP RULE</strong></p>
     *
     * <p>Continue if union of resolved alternative sets from non-conflicting and
     * conflicting alternative subsets has more than one alternative. We are
     * uncertain about which alternative to predict.</p>
     *
     * <p>The complete set of alternatives, {@code [i for (_,i,_)]}, tells us which
     * alternatives are still in the running for the amount of input we've
     * consumed at this point. The conflicting sets let us to strip away
     * configurations that won't lead to more states because we resolve
     * conflicts to the configuration with a minimum alternate for the
     * conflicting set.</p>
     *
     * <p><strong>CASES</strong></p>
     *
     * <ul>
     *
     * <li>no conflicts and more than 1 alternative in set =&gt; continue</li>
     *
     * <li> {@code (s, 1, x)}, {@code (s, 2, x)}, {@code (s, 3, z)},
     * {@code (s', 1, y)}, {@code (s', 2, y)} yields non-conflicting set
     * {@code {3}} U conflicting sets {@code min({1,2})} U {@code min({1,2})} =
     * {@code {1,3}} =&gt; continue
     * </li>
     *
     * <li>{@code (s, 1, x)}, {@code (s, 2, x)}, {@code (s', 1, y)},
     * {@code (s', 2, y)}, {@code (s'', 1, z)} yields non-conflicting set
     * {@code {1}} U conflicting sets {@code min({1,2})} U {@code min({1,2})} =
     * {@code {1}} =&gt; stop and predict 1</li>
     *
     * <li>{@code (s, 1, x)}, {@code (s, 2, x)}, {@code (s', 1, y)},
     * {@code (s', 2, y)} yields conflicting, reduced sets {@code {1}} U
     * {@code {1}} = {@code {1}} =&gt; stop and predict 1, can announce
     * ambiguity {@code {1,2}}</li>
     *
     * <li>{@code (s, 1, x)}, {@code (s, 2, x)}, {@code (s', 2, y)},
     * {@code (s', 3, y)} yields conflicting, reduced sets {@code {1}} U
     * {@code {2}} = {@code {1,2}} =&gt; continue</li>
     *
     * <li>{@code (s, 1, x)}, {@code (s, 2, x)}, {@code (s', 3, y)},
     * {@code (s', 4, y)} yields conflicting, reduced sets {@code {1}} U
     * {@code {3}} = {@code {1,3}} =&gt; continue</li>
     *
     * </ul>
     *
     * <p><strong>EXACT AMBIGUITY DETECTION</strong></p>
     *
     * <p>If all states report the same conflicting set of alternatives, then we
     * know we have the exact ambiguity set.</p>
     *
     * <p><code>|A_<em>i</em>|&gt;1</code> and
     * <code>A_<em>i</em> = A_<em>j</em></code> for all <em>i</em>, <em>j</em>.</p>
     *
     * <p>In other words, we continue examining lookahead until all {@code A_i}
     * have more than one alternative and all {@code A_i} are the same. If
     * {@code A={{1,2}, {1,3}}}, then regular LL prediction would terminate
     * because the resolved set is {@code {1}}. To determine what the real
     * ambiguity is, we have to know whether the ambiguity is between one and
     * two or one and three so we keep going. We can only stop prediction when
     * we need exact ambiguity detection when the sets look like
     * {@code A={{1,2}}} or {@code {{1,2},{1,2}}}, etc...</p>
     */
    resolvesToJustOneViableAlt: function(altsets) {
        return PredictionMode.getSingleViableAlt(altsets);
    },

    /**
     * Determines if every alternative subset in {@code altsets} contains more
     * than one alternative.
     *
     * @param altsets a collection of alternative subsets
     * @return {@code true} if every {@link BitSet} in {@code altsets} has
     * {@link BitSet//cardinality cardinality} &gt; 1, otherwise {@code false}
     */
    allSubsetsConflict: function(altsets) {
        return ! PredictionMode.hasNonConflictingAltSet(altsets);
    },
    /**
     * Determines if any single alternative subset in {@code altsets} contains
     * exactly one alternative.
     *
     * @param altsets a collection of alternative subsets
     * @return {@code true} if {@code altsets} contains a {@link BitSet} with
     * {@link BitSet//cardinality cardinality} 1, otherwise {@code false}
     */
    hasNonConflictingAltSet: function(altsets) {
        for(let i=0;i<altsets.length;i++) {
            const alts = altsets[i];
            if (alts.length===1) {
                return true;
            }
        }
        return false;
    },


    /**
     * Determines if any single alternative subset in {@code altsets} contains
     * more than one alternative.
     *
     * @param altsets a collection of alternative subsets
     * @return {@code true} if {@code altsets} contains a {@link BitSet} with
     * {@link BitSet//cardinality cardinality} &gt; 1, otherwise {@code false}
     */
    hasConflictingAltSet: function(altsets) {
        for(let i=0;i<altsets.length;i++) {
            const alts = altsets[i];
            if (alts.length>1) {
                return true;
            }
        }
        return false;
    },


    /**
     * Determines if every alternative subset in {@code altsets} is equivalent.
     *
     * @param altsets a collection of alternative subsets
     * @return {@code true} if every member of {@code altsets} is equal to the
     * others, otherwise {@code false}
     */
    allSubsetsEqual: function(altsets) {
        let first = null;
        for(let i=0;i<altsets.length;i++) {
            const alts = altsets[i];
            if (first === null) {
                first = alts;
            } else if (alts!==first) {
                return false;
            }
        }
        return true;
    },


    /**
     * Returns the unique alternative predicted by all alternative subsets in
     * {@code altsets}. If no such alternative exists, this method returns
     * {@link ATN//INVALID_ALT_NUMBER}.
     *
     * @param altsets a collection of alternative subsets
     */
    getUniqueAlt: function(altsets) {
        const all = PredictionMode.getAlts(altsets);
        if (all.length===1) {
            return all.minValue();
        } else {
            return ATN.INVALID_ALT_NUMBER;
        }
    },

    /**
     * Gets the complete set of represented alternatives for a collection of
     * alternative subsets. This method returns the union of each {@link BitSet}
     * in {@code altsets}.
     *
     * @param altsets a collection of alternative subsets
     * @return the set of represented alternatives in {@code altsets}
     */
    getAlts: function(altsets) {
        const all = new BitSet();
        altsets.map( function(alts) { all.or(alts); });
        return all;
    },

    /**
     * This function gets the conflicting alt subsets from a configuration set.
     * For each configuration {@code c} in {@code configs}:
     *
     * <pre>
     * map[c] U= c.{@link ATNConfig//alt alt} // map hash/equals uses s and x, not
     * alt and not pred
     * </pre>
     */
    getConflictingAltSubsets: function(configs) {
        const configToAlts = new Map();
        configToAlts.hashFunction = function(cfg) { hashStuff(cfg.state.stateNumber, cfg.context); };
        configToAlts.equalsFunction = function(c1, c2) { return c1.state.stateNumber === c2.state.stateNumber && c1.context.equals(c2.context);};
        configs.items.map(function(cfg) {
            let alts = configToAlts.get(cfg);
            if (alts === null) {
                alts = new BitSet();
                configToAlts.put(cfg, alts);
            }
            alts.add(cfg.alt);
        });
        return configToAlts.getValues();
    },

    /**
     * Get a map from state to alt subset from a configuration set. For each
     * configuration {@code c} in {@code configs}:
     *
     * <pre>
     * map[c.{@link ATNConfig//state state}] U= c.{@link ATNConfig//alt alt}
     * </pre>
     */
    getStateToAltMap: function(configs) {
        const m = new AltDict();
        configs.items.map(function(c) {
            let alts = m.get(c.state);
            if (alts === null) {
                alts = new BitSet();
                m.put(c.state, alts);
            }
            alts.add(c.alt);
        });
        return m;
    },

    hasStateAssociatedWithOneAlt: function(configs) {
        const values = PredictionMode.getStateToAltMap(configs).values();
        for(let i=0;i<values.length;i++) {
            if (values[i].length===1) {
                return true;
            }
        }
        return false;
    },

    getSingleViableAlt: function(altsets) {
        let result = null;
        for(let i=0;i<altsets.length;i++) {
            const alts = altsets[i];
            const minAlt = alts.minValue();
            if(result===null) {
                result = minAlt;
            } else if(result!==minAlt) { // more than 1 viable alt
                return ATN.INVALID_ALT_NUMBER;
            }
        }
        return result;
    }
};

module.exports = PredictionMode;

},{"./../Utils":16,"./ATN":17,"./ATNConfig":18,"./ATNConfigSet":19,"./ATNState":23,"./SemanticContext":30}],30:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const { Set, Hash, equalArrays } = require('./../Utils');

/**
 * A tree structure used to record the semantic context in which
 * an ATN configuration is valid.  It's either a single predicate,
 * a conjunction {@code p1&&p2}, or a sum of products {@code p1||p2}.
 *
 * <p>I have scoped the {@link AND}, {@link OR}, and {@link Predicate} subclasses of
 * {@link SemanticContext} within the scope of this outer class.</p>
 */
class SemanticContext {

	hashCode() {
		const hash = new Hash();
		this.updateHashCode(hash);
		return hash.finish();
	}

	/**
	 * For context independent predicates, we evaluate them without a local
	 * context (i.e., null context). That way, we can evaluate them without
	 * having to create proper rule-specific context during prediction (as
	 * opposed to the parser, which creates them naturally). In a practical
	 * sense, this avoids a cast exception from RuleContext to myruleContext.
	 *
	 * <p>For context dependent predicates, we must pass in a local context so that
	 * references such as $arg evaluate properly as _localctx.arg. We only
	 * capture context dependent predicates in the context in which we begin
	 * prediction, so we passed in the outer context here in case of context
	 * dependent predicate evaluation.</p>
	 */
	evaluate(parser, outerContext) {}

	/**
	 * Evaluate the precedence predicates for the context and reduce the result.
	 *
	 * @param parser The parser instance.
	 * @param outerContext The current parser context object.
	 * @return The simplified semantic context after precedence predicates are
	 * evaluated, which will be one of the following values.
	 * <ul>
	 * <li>{@link //NONE}: if the predicate simplifies to {@code true} after
	 * precedence predicates are evaluated.</li>
	 * <li>{@code null}: if the predicate simplifies to {@code false} after
	 * precedence predicates are evaluated.</li>
	 * <li>{@code this}: if the semantic context is not changed as a result of
	 * precedence predicate evaluation.</li>
	 * <li>A non-{@code null} {@link SemanticContext}: the new simplified
	 * semantic context after precedence predicates are evaluated.</li>
	 * </ul>
	 */
	evalPrecedence(parser, outerContext) {
		return this;
	}

	static andContext(a, b) {
		if (a === null || a === SemanticContext.NONE) {
			return b;
		}
		if (b === null || b === SemanticContext.NONE) {
			return a;
		}
		const result = new AND(a, b);
		if (result.opnds.length === 1) {
			return result.opnds[0];
		} else {
			return result;
		}
	}

	static orContext(a, b) {
		if (a === null) {
			return b;
		}
		if (b === null) {
			return a;
		}
		if (a === SemanticContext.NONE || b === SemanticContext.NONE) {
			return SemanticContext.NONE;
		}
		const result = new OR(a, b);
		if (result.opnds.length === 1) {
			return result.opnds[0];
		} else {
			return result;
		}
	}
}


class Predicate extends SemanticContext {

	constructor(ruleIndex, predIndex, isCtxDependent) {
		super();
		this.ruleIndex = ruleIndex === undefined ? -1 : ruleIndex;
		this.predIndex = predIndex === undefined ? -1 : predIndex;
		this.isCtxDependent = isCtxDependent === undefined ? false : isCtxDependent; // e.g., $i ref in pred
	}

	evaluate(parser, outerContext) {
		const localctx = this.isCtxDependent ? outerContext : null;
		return parser.sempred(localctx, this.ruleIndex, this.predIndex);
	}

	updateHashCode(hash) {
		hash.update(this.ruleIndex, this.predIndex, this.isCtxDependent);
	}

	equals(other) {
		if (this === other) {
			return true;
		} else if (!(other instanceof Predicate)) {
			return false;
		} else {
			return this.ruleIndex === other.ruleIndex &&
					this.predIndex === other.predIndex &&
					this.isCtxDependent === other.isCtxDependent;
		}
	}

	toString() {
		return "{" + this.ruleIndex + ":" + this.predIndex + "}?";
	}
}

/**
 * The default {@link SemanticContext}, which is semantically equivalent to
 * a predicate of the form {@code {true}?}
 */
SemanticContext.NONE = new Predicate();


class PrecedencePredicate extends SemanticContext {

	constructor(precedence) {
		super();
		this.precedence = precedence === undefined ? 0 : precedence;
	}

	evaluate(parser, outerContext) {
		return parser.precpred(outerContext, this.precedence);
	}

	evalPrecedence(parser, outerContext) {
		if (parser.precpred(outerContext, this.precedence)) {
			return SemanticContext.NONE;
		} else {
			return null;
		}
	}

	compareTo(other) {
		return this.precedence - other.precedence;
	}

	updateHashCode(hash) {
		hash.update(this.precedence);
	}

	equals(other) {
		if (this === other) {
			return true;
		} else if (!(other instanceof PrecedencePredicate)) {
			return false;
		} else {
			return this.precedence === other.precedence;
		}
	}

	toString() {
		return "{" + this.precedence + ">=prec}?";
	}

	static filterPrecedencePredicates(set) {
		const result = [];
		set.values().map( function(context) {
			if (context instanceof PrecedencePredicate) {
				result.push(context);
			}
		});
		return result;
	}
}

class AND extends SemanticContext {
	/**
	 * A semantic context which is true whenever none of the contained contexts
	 * is false
	 */
	constructor(a, b) {
		super();
		const operands = new Set();
		if (a instanceof AND) {
			a.opnds.map(function(o) {
				operands.add(o);
			});
		} else {
			operands.add(a);
		}
		if (b instanceof AND) {
			b.opnds.map(function(o) {
				operands.add(o);
			});
		} else {
			operands.add(b);
		}
		const precedencePredicates = PrecedencePredicate.filterPrecedencePredicates(operands);
		if (precedencePredicates.length > 0) {
			// interested in the transition with the lowest precedence
			let reduced = null;
			precedencePredicates.map( function(p) {
				if(reduced===null || p.precedence<reduced.precedence) {
					reduced = p;
				}
			});
			operands.add(reduced);
		}
		this.opnds = Array.from(operands.values());
	}

	equals(other) {
		if (this === other) {
			return true;
		} else if (!(other instanceof AND)) {
			return false;
		} else {
			return equalArrays(this.opnds, other.opnds);
		}
	}

	updateHashCode(hash) {
		hash.update(this.opnds, "AND");
	}

	/**
	 * {@inheritDoc}
	 *
	 * <p>
	 * The evaluation of predicates by this context is short-circuiting, but
	 * unordered.</p>
	 */
	evaluate(parser, outerContext) {
		for (let i = 0; i < this.opnds.length; i++) {
			if (!this.opnds[i].evaluate(parser, outerContext)) {
				return false;
			}
		}
		return true;
	}

	evalPrecedence(parser, outerContext) {
		let differs = false;
		const operands = [];
		for (let i = 0; i < this.opnds.length; i++) {
			const context = this.opnds[i];
			const evaluated = context.evalPrecedence(parser, outerContext);
			differs |= (evaluated !== context);
			if (evaluated === null) {
				// The AND context is false if any element is false
				return null;
			} else if (evaluated !== SemanticContext.NONE) {
				// Reduce the result by skipping true elements
				operands.push(evaluated);
			}
		}
		if (!differs) {
			return this;
		}
		if (operands.length === 0) {
			// all elements were true, so the AND context is true
			return SemanticContext.NONE;
		}
		let result = null;
		operands.map(function(o) {
			result = result === null ? o : SemanticContext.andContext(result, o);
		});
		return result;
	}

	toString() {
		const s = this.opnds.map(o => o.toString());
		return (s.length > 3 ? s.slice(3) : s).join("&&");
	}
}


class OR extends SemanticContext {
	/**
	 * A semantic context which is true whenever at least one of the contained
	 * contexts is true
	 */
	constructor(a, b) {
		super();
		const operands = new Set();
		if (a instanceof OR) {
			a.opnds.map(function(o) {
				operands.add(o);
			});
		} else {
			operands.add(a);
		}
		if (b instanceof OR) {
			b.opnds.map(function(o) {
				operands.add(o);
			});
		} else {
			operands.add(b);
		}

		const precedencePredicates = PrecedencePredicate.filterPrecedencePredicates(operands);
		if (precedencePredicates.length > 0) {
			// interested in the transition with the highest precedence
			const s = precedencePredicates.sort(function(a, b) {
				return a.compareTo(b);
			});
			const reduced = s[s.length-1];
			operands.add(reduced);
		}
		this.opnds = Array.from(operands.values());
	}

	equals(other) {
		if (this === other) {
			return true;
		} else if (!(other instanceof OR)) {
			return false;
		} else {
			return equalArrays(this.opnds, other.opnds);
		}
	}

	updateHashCode(hash) {
		hash.update(this.opnds, "OR");
	}

	/**
	 * <p>
	 * The evaluation of predicates by this context is short-circuiting, but
	 * unordered.</p>
	 */
	evaluate(parser, outerContext) {
		for (let i = 0; i < this.opnds.length; i++) {
			if (this.opnds[i].evaluate(parser, outerContext)) {
				return true;
			}
		}
		return false;
	}

	evalPrecedence(parser, outerContext) {
		let differs = false;
		const operands = [];
		for (let i = 0; i < this.opnds.length; i++) {
			const context = this.opnds[i];
			const evaluated = context.evalPrecedence(parser, outerContext);
			differs |= (evaluated !== context);
			if (evaluated === SemanticContext.NONE) {
				// The OR context is true if any element is true
				return SemanticContext.NONE;
			} else if (evaluated !== null) {
				// Reduce the result by skipping false elements
				operands.push(evaluated);
			}
		}
		if (!differs) {
			return this;
		}
		if (operands.length === 0) {
			// all elements were false, so the OR context is false
			return null;
		}
		const result = null;
		operands.map(function(o) {
			return result === null ? o : SemanticContext.orContext(result, o);
		});
		return result;
	}

	toString() {
		const s = this.opnds.map(o => o.toString());
		return (s.length > 3 ? s.slice(3) : s).join("||");
	}
}

module.exports = {
	SemanticContext,
	PrecedencePredicate,
	Predicate
}

},{"./../Utils":16}],31:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const {Token} = require('./../Token');
const {IntervalSet} = require('./../IntervalSet');
const {Predicate, PrecedencePredicate} = require('./SemanticContext');

/**
 * An ATN transition between any two ATN states.  Subclasses define
 * atom, set, epsilon, action, predicate, rule transitions.
 *
 * <p>This is a one way link.  It emanates from a state (usually via a list of
 * transitions) and has a target state.</p>
 *
 * <p>Since we never have to change the ATN transitions once we construct it,
 * we can fix these transitions as specific classes. The DFA transitions
 * on the other hand need to update the labels as it adds transitions to
 * the states. We'll use the term Edge for the DFA to distinguish them from
 * ATN transitions.</p>
 */
class Transition {
    constructor(target) {
        // The target of this transition.
        if (target===undefined || target===null) {
            throw "target cannot be null.";
        }
        this.target = target;
        // Are we epsilon, action, sempred?
        this.isEpsilon = false;
        this.label = null;
    }
}

// constants for serialization

Transition.EPSILON = 1;
Transition.RANGE = 2;
Transition.RULE = 3;
// e.g., {isType(input.LT(1))}?
Transition.PREDICATE = 4;
Transition.ATOM = 5;
Transition.ACTION = 6;
// ~(A|B) or ~atom, wildcard, which convert to next 2
Transition.SET = 7;
Transition.NOT_SET = 8;
Transition.WILDCARD = 9;
Transition.PRECEDENCE = 10;

Transition.serializationNames = [
            "INVALID",
            "EPSILON",
            "RANGE",
            "RULE",
            "PREDICATE",
            "ATOM",
            "ACTION",
            "SET",
            "NOT_SET",
            "WILDCARD",
            "PRECEDENCE"
        ];

Transition.serializationTypes = {
        EpsilonTransition: Transition.EPSILON,
        RangeTransition: Transition.RANGE,
        RuleTransition: Transition.RULE,
        PredicateTransition: Transition.PREDICATE,
        AtomTransition: Transition.ATOM,
        ActionTransition: Transition.ACTION,
        SetTransition: Transition.SET,
        NotSetTransition: Transition.NOT_SET,
        WildcardTransition: Transition.WILDCARD,
        PrecedencePredicateTransition: Transition.PRECEDENCE
    };


// TODO: make all transitions sets? no, should remove set edges

class AtomTransition extends Transition {
    constructor(target, label) {
        super(target);
        // The token type or character value; or, signifies special label.
        this.label_ = label;
        this.label = this.makeLabel();
        this.serializationType = Transition.ATOM;
    }

    makeLabel() {
        const s = new IntervalSet();
        s.addOne(this.label_);
        return s;
    }

    matches(symbol, minVocabSymbol, maxVocabSymbol) {
        return this.label_ === symbol;
    }

    toString() {
        return this.label_;
    }
}


class RuleTransition extends Transition {
    constructor(ruleStart, ruleIndex, precedence, followState) {
        super(ruleStart);
        // ptr to the rule definition object for this rule ref
        this.ruleIndex = ruleIndex;
        this.precedence = precedence;
        // what node to begin computations following ref to rule
        this.followState = followState;
        this.serializationType = Transition.RULE;
        this.isEpsilon = true;
    }

    matches(symbol, minVocabSymbol, maxVocabSymbol) {
        return false;
    }
}

class EpsilonTransition extends Transition {
    constructor(target, outermostPrecedenceReturn) {
        super(target);
        this.serializationType = Transition.EPSILON;
        this.isEpsilon = true;
        this.outermostPrecedenceReturn = outermostPrecedenceReturn;
    }

    matches(symbol, minVocabSymbol, maxVocabSymbol) {
        return false;
    }

    toString() {
        return "epsilon";
    }
}


class RangeTransition extends Transition {
    constructor(target, start, stop) {
        super(target);
        this.serializationType = Transition.RANGE;
        this.start = start;
        this.stop = stop;
        this.label = this.makeLabel();
    }

    makeLabel() {
        const s = new IntervalSet();
        s.addRange(this.start, this.stop);
        return s;
    }

    matches(symbol, minVocabSymbol, maxVocabSymbol) {
        return symbol >= this.start && symbol <= this.stop;
    }

    toString() {
        return "'" + String.fromCharCode(this.start) + "'..'" + String.fromCharCode(this.stop) + "'";
    }
}


class AbstractPredicateTransition extends Transition {
    constructor(target) {
        super(target);
    }
}

class PredicateTransition extends AbstractPredicateTransition {
    constructor(target, ruleIndex, predIndex, isCtxDependent) {
        super(target);
        this.serializationType = Transition.PREDICATE;
        this.ruleIndex = ruleIndex;
        this.predIndex = predIndex;
        this.isCtxDependent = isCtxDependent; // e.g., $i ref in pred
        this.isEpsilon = true;
    }

    matches(symbol, minVocabSymbol, maxVocabSymbol) {
        return false;
    }

    getPredicate() {
        return new Predicate(this.ruleIndex, this.predIndex, this.isCtxDependent);
    }

    toString() {
        return "pred_" + this.ruleIndex + ":" + this.predIndex;
    }
}


class ActionTransition extends Transition {
    constructor(target, ruleIndex, actionIndex, isCtxDependent) {
        super(target);
        this.serializationType = Transition.ACTION;
        this.ruleIndex = ruleIndex;
        this.actionIndex = actionIndex===undefined ? -1 : actionIndex;
        this.isCtxDependent = isCtxDependent===undefined ? false : isCtxDependent; // e.g., $i ref in pred
        this.isEpsilon = true;
    }

    matches(symbol, minVocabSymbol, maxVocabSymbol) {
        return false;
    }

    toString() {
        return "action_" + this.ruleIndex + ":" + this.actionIndex;
    }
}


// A transition containing a set of values.
class SetTransition extends Transition {
    constructor(target, set) {
        super(target);
        this.serializationType = Transition.SET;
        if (set !==undefined && set !==null) {
            this.label = set;
        } else {
            this.label = new IntervalSet();
            this.label.addOne(Token.INVALID_TYPE);
        }
    }

    matches(symbol, minVocabSymbol, maxVocabSymbol) {
        return this.label.contains(symbol);
    }

    toString() {
        return this.label.toString();
    }
}

class NotSetTransition extends SetTransition {
    constructor(target, set) {
        super(target, set);
        this.serializationType = Transition.NOT_SET;
    }

    matches(symbol, minVocabSymbol, maxVocabSymbol) {
        return symbol >= minVocabSymbol && symbol <= maxVocabSymbol &&
                !super.matches(symbol, minVocabSymbol, maxVocabSymbol);
    }

    toString() {
        return '~' + super.toString();
    }
}

class WildcardTransition extends Transition {
    constructor(target) {
        super(target);
        this.serializationType = Transition.WILDCARD;
    }

    matches(symbol, minVocabSymbol, maxVocabSymbol) {
        return symbol >= minVocabSymbol && symbol <= maxVocabSymbol;
    }

    toString() {
        return ".";
    }
}

class PrecedencePredicateTransition extends AbstractPredicateTransition {
    constructor(target, precedence) {
        super(target);
        this.serializationType = Transition.PRECEDENCE;
        this.precedence = precedence;
        this.isEpsilon = true;
    }

    matches(symbol, minVocabSymbol, maxVocabSymbol) {
        return false;
    }

    getPredicate() {
        return new PrecedencePredicate(this.precedence);
    }

    toString() {
        return this.precedence + " >= _p";
    }
}

module.exports = {
    Transition,
    AtomTransition,
    SetTransition,
    NotSetTransition,
    RuleTransition,
    ActionTransition,
    EpsilonTransition,
    RangeTransition,
    WildcardTransition,
    PredicateTransition,
    PrecedencePredicateTransition,
    AbstractPredicateTransition
}

},{"./../IntervalSet":7,"./../Token":15,"./SemanticContext":30}],32:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

exports.ATN = require('./ATN');
exports.ATNDeserializer = require('./ATNDeserializer');
exports.LexerATNSimulator = require('./LexerATNSimulator');
exports.ParserATNSimulator = require('./ParserATNSimulator');
exports.PredictionMode = require('./PredictionMode');

},{"./ATN":17,"./ATNDeserializer":21,"./LexerATNSimulator":25,"./ParserATNSimulator":28,"./PredictionMode":29}],33:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const {Set} = require("../Utils");
const {DFAState} = require('./DFAState');
const {StarLoopEntryState} = require('../atn/ATNState');
const {ATNConfigSet} = require('./../atn/ATNConfigSet');
const {DFASerializer} = require('./DFASerializer');
const {LexerDFASerializer} = require('./DFASerializer');

class DFA {
	constructor(atnStartState, decision) {
		if (decision === undefined) {
			decision = 0;
		}
		/**
		 * From which ATN state did we create this DFA?
		 */
		this.atnStartState = atnStartState;
		this.decision = decision;
		/**
		 * A set of all DFA states. Use {@link Map} so we can get old state back
		 * ({@link Set} only allows you to see if it's there).
		 */
		this._states = new Set();
		this.s0 = null;
		/**
		 * {@code true} if this DFA is for a precedence decision; otherwise,
		 * {@code false}. This is the backing field for {@link //isPrecedenceDfa},
		 * {@link //setPrecedenceDfa}
		 */
		this.precedenceDfa = false;
		if (atnStartState instanceof StarLoopEntryState)
		{
			if (atnStartState.isPrecedenceDecision) {
				this.precedenceDfa = true;
				const precedenceState = new DFAState(null, new ATNConfigSet());
				precedenceState.edges = [];
				precedenceState.isAcceptState = false;
				precedenceState.requiresFullContext = false;
				this.s0 = precedenceState;
			}
		}
	}

	/**
	 * Get the start state for a specific precedence value.
	 *
	 * @param precedence The current precedence.
	 * @return The start state corresponding to the specified precedence, or
	 * {@code null} if no start state exists for the specified precedence.
	 *
	 * @throws IllegalStateException if this is not a precedence DFA.
	 * @see //isPrecedenceDfa()
	 */
	getPrecedenceStartState(precedence) {
		if (!(this.precedenceDfa)) {
			throw ("Only precedence DFAs may contain a precedence start state.");
		}
		// s0.edges is never null for a precedence DFA
		if (precedence < 0 || precedence >= this.s0.edges.length) {
			return null;
		}
		return this.s0.edges[precedence] || null;
	}

	/**
	 * Set the start state for a specific precedence value.
	 *
	 * @param precedence The current precedence.
	 * @param startState The start state corresponding to the specified
	 * precedence.
	 *
	 * @throws IllegalStateException if this is not a precedence DFA.
	 * @see //isPrecedenceDfa()
	 */
	setPrecedenceStartState(precedence, startState) {
		if (!(this.precedenceDfa)) {
			throw ("Only precedence DFAs may contain a precedence start state.");
		}
		if (precedence < 0) {
			return;
		}

		/**
		 * synchronization on s0 here is ok. when the DFA is turned into a
		 * precedence DFA, s0 will be initialized once and not updated again
		 * s0.edges is never null for a precedence DFA
		 */
		this.s0.edges[precedence] = startState;
	}

	/**
	 * Sets whether this is a precedence DFA. If the specified value differs
	 * from the current DFA configuration, the following actions are taken;
	 * otherwise no changes are made to the current DFA.
	 *
	 * <ul>
	 * <li>The {@link //states} map is cleared</li>
	 * <li>If {@code precedenceDfa} is {@code false}, the initial state
	 * {@link //s0} is set to {@code null}; otherwise, it is initialized to a new
	 * {@link DFAState} with an empty outgoing {@link DFAState//edges} array to
	 * store the start states for individual precedence values.</li>
	 * <li>The {@link //precedenceDfa} field is updated</li>
	 * </ul>
	 *
	 * @param precedenceDfa {@code true} if this is a precedence DFA; otherwise,
	 * {@code false}
	 */
	setPrecedenceDfa(precedenceDfa) {
		if (this.precedenceDfa!==precedenceDfa) {
			this._states = new Set();
			if (precedenceDfa) {
				const precedenceState = new DFAState(null, new ATNConfigSet());
				precedenceState.edges = [];
				precedenceState.isAcceptState = false;
				precedenceState.requiresFullContext = false;
				this.s0 = precedenceState;
			} else {
				this.s0 = null;
			}
			this.precedenceDfa = precedenceDfa;
		}
	}

	/**
	 * Return a list of all states in this DFA, ordered by state number.
	 */
	sortedStates() {
		const list = this._states.values();
		return list.sort(function(a, b) {
			return a.stateNumber - b.stateNumber;
		});
	}

	toString(literalNames, symbolicNames) {
		literalNames = literalNames || null;
		symbolicNames = symbolicNames || null;
		if (this.s0 === null) {
			return "";
		}
		const serializer = new DFASerializer(this, literalNames, symbolicNames);
		return serializer.toString();
	}

	toLexerString() {
		if (this.s0 === null) {
			return "";
		}
		const serializer = new LexerDFASerializer(this);
		return serializer.toString();
	}

	get states(){
		return this._states;
	}
}


module.exports = DFA;

},{"../Utils":16,"../atn/ATNState":23,"./../atn/ATNConfigSet":19,"./DFASerializer":34,"./DFAState":35}],34:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

/**
 * A DFA walker that knows how to dump them to serialized strings.
 */
class DFASerializer {
    constructor(dfa, literalNames, symbolicNames) {
        this.dfa = dfa;
        this.literalNames = literalNames || [];
        this.symbolicNames = symbolicNames || [];
    }

    toString() {
       if(this.dfa.s0 === null) {
           return null;
       }
       let buf = "";
       const states = this.dfa.sortedStates();
       for(let i=0; i<states.length; i++) {
           const s = states[i];
           if(s.edges!==null) {
                const n = s.edges.length;
                for(let j=0;j<n;j++) {
                    const t = s.edges[j] || null;
                    if(t!==null && t.stateNumber !== 0x7FFFFFFF) {
                        buf = buf.concat(this.getStateString(s));
                        buf = buf.concat("-");
                        buf = buf.concat(this.getEdgeLabel(j));
                        buf = buf.concat("->");
                        buf = buf.concat(this.getStateString(t));
                        buf = buf.concat('\n');
                    }
                }
           }
       }
       return buf.length===0 ? null : buf;
    }

    getEdgeLabel(i) {
        if (i===0) {
            return "EOF";
        } else if(this.literalNames !==null || this.symbolicNames!==null) {
            return this.literalNames[i-1] || this.symbolicNames[i-1];
        } else {
            return String.fromCharCode(i-1);
        }
    }

    getStateString(s) {
        const baseStateStr = ( s.isAcceptState ? ":" : "") + "s" + s.stateNumber + ( s.requiresFullContext ? "^" : "");
        if(s.isAcceptState) {
            if (s.predicates !== null) {
                return baseStateStr + "=>" + s.predicates.toString();
            } else {
                return baseStateStr + "=>" + s.prediction.toString();
            }
        } else {
            return baseStateStr;
        }
    }
}

class LexerDFASerializer extends DFASerializer {
    constructor(dfa) {
        super(dfa, null);
    }

    getEdgeLabel(i) {
        return "'" + String.fromCharCode(i) + "'";
    }
}

module.exports = { DFASerializer , LexerDFASerializer };


},{}],35:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const {ATNConfigSet} = require('./../atn/ATNConfigSet');
const {Hash, Set} = require('./../Utils');

/**
 * Map a predicate to a predicted alternative.
 */
class PredPrediction {
	constructor(pred, alt) {
		this.alt = alt;
		this.pred = pred;
	}

	toString() {
		return "(" + this.pred + ", " + this.alt + ")";
	}
}

/**
 * A DFA state represents a set of possible ATN configurations.
 * As Aho, Sethi, Ullman p. 117 says "The DFA uses its state
 * to keep track of all possible states the ATN can be in after
 * reading each input symbol. That is to say, after reading
 * input a1a2..an, the DFA is in a state that represents the
 * subset T of the states of the ATN that are reachable from the
 * ATN's start state along some path labeled a1a2..an."
 * In conventional NFA&rarr;DFA conversion, therefore, the subset T
 * would be a bitset representing the set of states the
 * ATN could be in. We need to track the alt predicted by each
 * state as well, however. More importantly, we need to maintain
 * a stack of states, tracking the closure operations as they
 * jump from rule to rule, emulating rule invocations (method calls).
 * I have to add a stack to simulate the proper lookahead sequences for
 * the underlying LL grammar from which the ATN was derived.
 *
 * <p>I use a set of ATNConfig objects not simple states. An ATNConfig
 * is both a state (ala normal conversion) and a RuleContext describing
 * the chain of rules (if any) followed to arrive at that state.</p>
 *
 * <p>A DFA state may have multiple references to a particular state,
 * but with different ATN contexts (with same or different alts)
 * meaning that state was reached via a different set of rule invocations.</p>
 */
class DFAState {
	constructor(stateNumber, configs) {
		if (stateNumber === null) {
			stateNumber = -1;
		}
		if (configs === null) {
			configs = new ATNConfigSet();
		}
		this.stateNumber = stateNumber;
		this.configs = configs;
		/**
		 * {@code edges[symbol]} points to target of symbol. Shift up by 1 so (-1)
		 * {@link Token//EOF} maps to {@code edges[0]}.
		 */
		this.edges = null;
		this.isAcceptState = false;
		/**
		 * if accept state, what ttype do we match or alt do we predict?
		 * This is set to {@link ATN//INVALID_ALT_NUMBER} when {@link//predicates}
		 * {@code !=null} or {@link //requiresFullContext}.
		 */
		this.prediction = 0;
		this.lexerActionExecutor = null;
		/**
		 * Indicates that this state was created during SLL prediction that
		 * discovered a conflict between the configurations in the state. Future
		 * {@link ParserATNSimulator//execATN} invocations immediately jumped doing
		 * full context prediction if this field is true.
		 */
		this.requiresFullContext = false;
		/**
		 * During SLL parsing, this is a list of predicates associated with the
		 * ATN configurations of the DFA state. When we have predicates,
		 * {@link //requiresFullContext} is {@code false} since full context
		 * prediction evaluates predicates
		 * on-the-fly. If this is not null, then {@link //prediction} is
		 * {@link ATN//INVALID_ALT_NUMBER}.
		 *
		 * <p>We only use these for non-{@link //requiresFullContext} but
		 * conflicting states. That
		 * means we know from the context (it's $ or we don't dip into outer
		 * context) that it's an ambiguity not a conflict.</p>
		 *
		 * <p>This list is computed by {@link
		 * ParserATNSimulator//predicateDFAState}.</p>
		 */
		this.predicates = null;
		return this;
	}

	/**
	 * Get the set of all alts mentioned by all ATN configurations in this
	 * DFA state.
	 */
	getAltSet() {
		const alts = new Set();
		if (this.configs !== null) {
			for (let i = 0; i < this.configs.length; i++) {
				const c = this.configs[i];
				alts.add(c.alt);
			}
		}
		if (alts.length === 0) {
			return null;
		} else {
			return alts;
		}
	}

	/**
	 * Two {@link DFAState} instances are equal if their ATN configuration sets
	 * are the same. This method is used to see if a state already exists.
	 *
	 * <p>Because the number of alternatives and number of ATN configurations are
	 * finite, there is a finite number of DFA states that can be processed.
	 * This is necessary to show that the algorithm terminates.</p>
	 *
	 * <p>Cannot test the DFA state numbers here because in
	 * {@link ParserATNSimulator//addDFAState} we need to know if any other state
	 * exists that has this exact set of ATN configurations. The
	 * {@link //stateNumber} is irrelevant.</p>
	 */
	equals(other) {
		// compare set of ATN configurations in this set with other
		return this === other ||
				(other instanceof DFAState &&
					this.configs.equals(other.configs));
	}

	toString() {
		let s = "" + this.stateNumber + ":" + this.configs;
		if(this.isAcceptState) {
			s = s + "=>";
			if (this.predicates !== null)
				s = s + this.predicates;
			else
				s = s + this.prediction;
		}
		return s;
	}

	hashCode() {
		const hash = new Hash();
		hash.update(this.configs);
		return hash.finish();
	}
}

module.exports = { DFAState, PredPrediction };

},{"./../Utils":16,"./../atn/ATNConfigSet":19}],36:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

exports.DFA = require('./DFA');
exports.DFASerializer = require('./DFASerializer').DFASerializer;
exports.LexerDFASerializer = require('./DFASerializer').LexerDFASerializer;
exports.PredPrediction = require('./DFAState').PredPrediction;

},{"./DFA":33,"./DFASerializer":34,"./DFAState":35}],37:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const {BitSet} = require('./../Utils');
const {ErrorListener} = require('./ErrorListener')
const {Interval} = require('./../IntervalSet')


/**
 * This implementation of {@link ANTLRErrorListener} can be used to identify
 *  certain potential correctness and performance problems in grammars. "Reports"
 *  are made by calling {@link Parser//notifyErrorListeners} with the appropriate
 *  message.
 *
 *  <ul>
 *  <li><b>Ambiguities</b>: These are cases where more than one path through the
 *  grammar can match the input.</li>
 *  <li><b>Weak context sensitivity</b>: These are cases where full-context
 *  prediction resolved an SLL conflict to a unique alternative which equaled the
 *  minimum alternative of the SLL conflict.</li>
 *  <li><b>Strong (forced) context sensitivity</b>: These are cases where the
 *  full-context prediction resolved an SLL conflict to a unique alternative,
 *  <em>and</em> the minimum alternative of the SLL conflict was found to not be
 *  a truly viable alternative. Two-stage parsing cannot be used for inputs where
 *  this situation occurs.</li>
 *  </ul>
 */
class DiagnosticErrorListener extends ErrorListener {
	constructor(exactOnly) {
		super();
		exactOnly = exactOnly || true;
		// whether all ambiguities or only exact ambiguities are reported.
		this.exactOnly = exactOnly;
	}

	reportAmbiguity(recognizer, dfa, startIndex, stopIndex, exact, ambigAlts, configs) {
		if (this.exactOnly && !exact) {
			return;
		}
		const msg = "reportAmbiguity d=" +
			this.getDecisionDescription(recognizer, dfa) +
			": ambigAlts=" +
			this.getConflictingAlts(ambigAlts, configs) +
			", input='" +
			recognizer.getTokenStream().getText(new Interval(startIndex, stopIndex)) + "'"
		recognizer.notifyErrorListeners(msg);
	}

	reportAttemptingFullContext(recognizer, dfa, startIndex, stopIndex, conflictingAlts, configs) {
		const msg = "reportAttemptingFullContext d=" +
			this.getDecisionDescription(recognizer, dfa) +
			", input='" +
			recognizer.getTokenStream().getText(new Interval(startIndex, stopIndex)) + "'"
		recognizer.notifyErrorListeners(msg);
	}

	reportContextSensitivity(recognizer, dfa, startIndex, stopIndex, prediction, configs) {
		const msg = "reportContextSensitivity d=" +
			this.getDecisionDescription(recognizer, dfa) +
			", input='" +
			recognizer.getTokenStream().getText(new Interval(startIndex, stopIndex)) + "'"
		recognizer.notifyErrorListeners(msg);
	}

	getDecisionDescription(recognizer, dfa) {
		const decision = dfa.decision
		const ruleIndex = dfa.atnStartState.ruleIndex

		const ruleNames = recognizer.ruleNames
		if (ruleIndex < 0 || ruleIndex >= ruleNames.length) {
			return "" + decision;
		}
		const ruleName = ruleNames[ruleIndex] || null
		if (ruleName === null || ruleName.length === 0) {
			return "" + decision;
		}
		return `${decision} (${ruleName})`;
	}

	/**
	 * Computes the set of conflicting or ambiguous alternatives from a
	 * configuration set, if that information was not already provided by the
	 * parser.
	 *
	 * @param reportedAlts The set of conflicting or ambiguous alternatives, as
	 * reported by the parser.
	 * @param configs The conflicting or ambiguous configuration set.
	 * @return Returns {@code reportedAlts} if it is not {@code null}, otherwise
	 * returns the set of alternatives represented in {@code configs}.
     */
	getConflictingAlts(reportedAlts, configs) {
		if (reportedAlts !== null) {
			return reportedAlts;
		}
		const result = new BitSet()
		for (let i = 0; i < configs.items.length; i++) {
			result.add(configs.items[i].alt);
		}
		return `{${result.values().join(", ")}}`;
	}
}

module.exports = DiagnosticErrorListener

},{"./../IntervalSet":7,"./../Utils":16,"./ErrorListener":38}],38:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

/**
 * Provides an empty default implementation of {@link ANTLRErrorListener}. The
 * default implementation of each method does nothing, but can be overridden as
 * necessary.
 */
class ErrorListener {
    syntaxError(recognizer, offendingSymbol, line, column, msg, e) {
    }

    reportAmbiguity(recognizer, dfa, startIndex, stopIndex, exact, ambigAlts, configs) {
    }

    reportAttemptingFullContext(recognizer, dfa, startIndex, stopIndex, conflictingAlts, configs) {
    }

    reportContextSensitivity(recognizer, dfa, startIndex, stopIndex, prediction, configs) {
    }
}

/**
 * {@inheritDoc}
 *
 * <p>
 * This implementation prints messages to {@link System//err} containing the
 * values of {@code line}, {@code charPositionInLine}, and {@code msg} using
 * the following format.</p>
 *
 * <pre>
 * line <em>line</em>:<em>charPositionInLine</em> <em>msg</em>
 * </pre>
 *
 */
class ConsoleErrorListener extends ErrorListener {
    constructor() {
        super();
    }

    syntaxError(recognizer, offendingSymbol, line, column, msg, e) {
        console.error("line " + line + ":" + column + " " + msg);
    }
}


/**
 * Provides a default instance of {@link ConsoleErrorListener}.
 */
ConsoleErrorListener.INSTANCE = new ConsoleErrorListener();

class ProxyErrorListener extends ErrorListener {
    constructor(delegates) {
        super();
        if (delegates===null) {
            throw "delegates";
        }
        this.delegates = delegates;
        return this;
    }

    syntaxError(recognizer, offendingSymbol, line, column, msg, e) {
        this.delegates.map(d => d.syntaxError(recognizer, offendingSymbol, line, column, msg, e));
    }

    reportAmbiguity(recognizer, dfa, startIndex, stopIndex, exact, ambigAlts, configs) {
        this.delegates.map(d => d.reportAmbiguity(recognizer, dfa, startIndex, stopIndex, exact, ambigAlts, configs));
    }

    reportAttemptingFullContext(recognizer, dfa, startIndex, stopIndex, conflictingAlts, configs) {
        this.delegates.map(d => d.reportAttemptingFullContext(recognizer, dfa, startIndex, stopIndex, conflictingAlts, configs));
    }

    reportContextSensitivity(recognizer, dfa, startIndex, stopIndex, prediction, configs) {
        this.delegates.map(d => d.reportContextSensitivity(recognizer, dfa, startIndex, stopIndex, prediction, configs));
    }
}

module.exports = {ErrorListener, ConsoleErrorListener, ProxyErrorListener}


},{}],39:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const {Token} = require('./../Token')
const {NoViableAltException, InputMismatchException, FailedPredicateException, ParseCancellationException} = require('./Errors')
const {ATNState} = require('./../atn/ATNState')
const {Interval, IntervalSet} = require('./../IntervalSet')

class ErrorStrategy {

    reset(recognizer) {
    }

    recoverInline(recognizer) {
    }

    recover(recognizer, e) {
    }

    sync(recognizer) {
    }

    inErrorRecoveryMode(recognizer) {
    }

    reportError(recognizer) {
    }
}


/**
 * This is the default implementation of {@link ANTLRErrorStrategy} used for
 * error reporting and recovery in ANTLR parsers.
*/
class DefaultErrorStrategy extends ErrorStrategy {
    constructor() {
        super();
        /**
         * Indicates whether the error strategy is currently "recovering from an
         * error". This is used to suppress reporting multiple error messages while
         * attempting to recover from a detected syntax error.
         *
         * @see //inErrorRecoveryMode
         */
        this.errorRecoveryMode = false;

        /**
         * The index into the input stream where the last error occurred.
         * This is used to prevent infinite loops where an error is found
         * but no token is consumed during recovery...another error is found,
         * ad nauseum. This is a failsafe mechanism to guarantee that at least
         * one token/tree node is consumed for two errors.
         */
        this.lastErrorIndex = -1;
        this.lastErrorStates = null;
        this.nextTokensContext = null;
        this.nextTokenState = 0;
    }

    /**
     * <p>The default implementation simply calls {@link //endErrorCondition} to
     * ensure that the handler is not in error recovery mode.</p>
    */
    reset(recognizer) {
        this.endErrorCondition(recognizer);
    }

    /**
     * This method is called to enter error recovery mode when a recognition
     * exception is reported.
     *
     * @param recognizer the parser instance
    */
    beginErrorCondition(recognizer) {
        this.errorRecoveryMode = true;
    }

    inErrorRecoveryMode(recognizer) {
        return this.errorRecoveryMode;
    }

    /**
     * This method is called to leave error recovery mode after recovering from
     * a recognition exception.
     * @param recognizer
     */
    endErrorCondition(recognizer) {
        this.errorRecoveryMode = false;
        this.lastErrorStates = null;
        this.lastErrorIndex = -1;
    }

    /**
     * {@inheritDoc}
     * <p>The default implementation simply calls {@link //endErrorCondition}.</p>
     */
    reportMatch(recognizer) {
        this.endErrorCondition(recognizer);
    }

    /**
     * {@inheritDoc}
     *
     * <p>The default implementation returns immediately if the handler is already
     * in error recovery mode. Otherwise, it calls {@link //beginErrorCondition}
     * and dispatches the reporting task based on the runtime type of {@code e}
     * according to the following table.</p>
     *
     * <ul>
     * <li>{@link NoViableAltException}: Dispatches the call to
     * {@link //reportNoViableAlternative}</li>
     * <li>{@link InputMismatchException}: Dispatches the call to
     * {@link //reportInputMismatch}</li>
     * <li>{@link FailedPredicateException}: Dispatches the call to
     * {@link //reportFailedPredicate}</li>
     * <li>All other types: calls {@link Parser//notifyErrorListeners} to report
     * the exception</li>
     * </ul>
     */
    reportError(recognizer, e) {
       // if we've already reported an error and have not matched a token
       // yet successfully, don't report any errors.
        if(this.inErrorRecoveryMode(recognizer)) {
            return; // don't report spurious errors
        }
        this.beginErrorCondition(recognizer);
        if ( e instanceof NoViableAltException ) {
            this.reportNoViableAlternative(recognizer, e);
        } else if ( e instanceof InputMismatchException ) {
            this.reportInputMismatch(recognizer, e);
        } else if ( e instanceof FailedPredicateException ) {
            this.reportFailedPredicate(recognizer, e);
        } else {
            console.log("unknown recognition error type: " + e.constructor.name);
            console.log(e.stack);
            recognizer.notifyErrorListeners(e.getOffendingToken(), e.getMessage(), e);
        }
    }

    /**
     *
     * {@inheritDoc}
     *
     * <p>The default implementation resynchronizes the parser by consuming tokens
     * until we find one in the resynchronization set--loosely the set of tokens
     * that can follow the current rule.</p>
     *
     */
    recover(recognizer, e) {
        if (this.lastErrorIndex===recognizer.getInputStream().index &&
            this.lastErrorStates !== null && this.lastErrorStates.indexOf(recognizer.state)>=0) {
            // uh oh, another error at same token index and previously-visited
            // state in ATN; must be a case where LT(1) is in the recovery
            // token set so nothing got consumed. Consume a single token
            // at least to prevent an infinite loop; this is a failsafe.
            recognizer.consume();
        }
        this.lastErrorIndex = recognizer._input.index;
        if (this.lastErrorStates === null) {
            this.lastErrorStates = [];
        }
        this.lastErrorStates.push(recognizer.state);
        const followSet = this.getErrorRecoverySet(recognizer)
        this.consumeUntil(recognizer, followSet);
    }

    /**
     * The default implementation of {@link ANTLRErrorStrategy//sync} makes sure
     * that the current lookahead symbol is consistent with what were expecting
     * at this point in the ATN. You can call this anytime but ANTLR only
     * generates code to check before subrules/loops and each iteration.
     *
     * <p>Implements Jim Idle's magic sync mechanism in closures and optional
     * subrules. E.g.,</p>
     *
     * <pre>
     * a : sync ( stuff sync )* ;
     * sync : {consume to what can follow sync} ;
     * </pre>
     *
     * At the start of a sub rule upon error, {@link //sync} performs single
     * token deletion, if possible. If it can't do that, it bails on the current
     * rule and uses the default error recovery, which consumes until the
     * resynchronization set of the current rule.
     *
     * <p>If the sub rule is optional ({@code (...)?}, {@code (...)*}, or block
     * with an empty alternative), then the expected set includes what follows
     * the subrule.</p>
     *
     * <p>During loop iteration, it consumes until it sees a token that can start a
     * sub rule or what follows loop. Yes, that is pretty aggressive. We opt to
     * stay in the loop as long as possible.</p>
     *
     * <p><strong>ORIGINS</strong></p>
     *
     * <p>Previous versions of ANTLR did a poor job of their recovery within loops.
     * A single mismatch token or missing token would force the parser to bail
     * out of the entire rules surrounding the loop. So, for rule</p>
     *
     * <pre>
     * classDef : 'class' ID '{' member* '}'
     * </pre>
     *
     * input with an extra token between members would force the parser to
     * consume until it found the next class definition rather than the next
     * member definition of the current class.
     *
     * <p>This functionality cost a little bit of effort because the parser has to
     * compare token set at the start of the loop and at each iteration. If for
     * some reason speed is suffering for you, you can turn off this
     * functionality by simply overriding this method as a blank { }.</p>
     *
     */
    sync(recognizer) {
        // If already recovering, don't try to sync
        if (this.inErrorRecoveryMode(recognizer)) {
            return;
        }
        const s = recognizer._interp.atn.states[recognizer.state];
        const la = recognizer.getTokenStream().LA(1);
        // try cheaper subset first; might get lucky. seems to shave a wee bit off
        const nextTokens = recognizer.atn.nextTokens(s);
        if(nextTokens.contains(la)) {
            this.nextTokensContext = null;
            this.nextTokenState = ATNState.INVALID_STATE_NUMBER;
            return;
        } else if (nextTokens.contains(Token.EPSILON)) {
            if(this.nextTokensContext === null) {
                // It's possible the next token won't match information tracked
                // by sync is restricted for performance.
                this.nextTokensContext = recognizer._ctx;
                this.nextTokensState = recognizer._stateNumber;
            }
            return;
        }
        switch (s.stateType) {
        case ATNState.BLOCK_START:
        case ATNState.STAR_BLOCK_START:
        case ATNState.PLUS_BLOCK_START:
        case ATNState.STAR_LOOP_ENTRY:
           // report error and recover if possible
            if( this.singleTokenDeletion(recognizer) !== null) {
                return;
            } else {
                throw new InputMismatchException(recognizer);
            }
        case ATNState.PLUS_LOOP_BACK:
        case ATNState.STAR_LOOP_BACK:
            this.reportUnwantedToken(recognizer);
            const expecting = new IntervalSet()
            expecting.addSet(recognizer.getExpectedTokens());
            const whatFollowsLoopIterationOrRule = expecting.addSet(this.getErrorRecoverySet(recognizer))
            this.consumeUntil(recognizer, whatFollowsLoopIterationOrRule);
            break;
        default:
            // do nothing if we can't identify the exact kind of ATN state
        }
    }

    /**
     * This is called by {@link //reportError} when the exception is a
     * {@link NoViableAltException}.
     *
     * @see //reportError
     *
     * @param recognizer the parser instance
     * @param e the recognition exception
     */
    reportNoViableAlternative(recognizer, e) {
        const tokens = recognizer.getTokenStream()
        let input
        if(tokens !== null) {
            if (e.startToken.type===Token.EOF) {
                input = "<EOF>";
            } else {
                input = tokens.getText(new Interval(e.startToken.tokenIndex, e.offendingToken.tokenIndex));
            }
        } else {
            input = "<unknown input>";
        }
        const msg = "no viable alternative at input " + this.escapeWSAndQuote(input)
        recognizer.notifyErrorListeners(msg, e.offendingToken, e);
    }

    /**
     * This is called by {@link //reportError} when the exception is an
     * {@link InputMismatchException}.
     *
     * @see //reportError
     *
     * @param recognizer the parser instance
     * @param e the recognition exception
     */
    reportInputMismatch(recognizer, e) {
        const msg = "mismatched input " + this.getTokenErrorDisplay(e.offendingToken) +
            " expecting " + e.getExpectedTokens().toString(recognizer.literalNames, recognizer.symbolicNames)
        recognizer.notifyErrorListeners(msg, e.offendingToken, e);
    }

    /**
     * This is called by {@link //reportError} when the exception is a
     * {@link FailedPredicateException}.
     *
     * @see //reportError
     *
     * @param recognizer the parser instance
     * @param e the recognition exception
     */
    reportFailedPredicate(recognizer, e) {
        const ruleName = recognizer.ruleNames[recognizer._ctx.ruleIndex]
        const msg = "rule " + ruleName + " " + e.message
        recognizer.notifyErrorListeners(msg, e.offendingToken, e);
    }

    /**
     * This method is called to report a syntax error which requires the removal
     * of a token from the input stream. At the time this method is called, the
     * erroneous symbol is current {@code LT(1)} symbol and has not yet been
     * removed from the input stream. When this method returns,
     * {@code recognizer} is in error recovery mode.
     *
     * <p>This method is called when {@link //singleTokenDeletion} identifies
     * single-token deletion as a viable recovery strategy for a mismatched
     * input error.</p>
     *
     * <p>The default implementation simply returns if the handler is already in
     * error recovery mode. Otherwise, it calls {@link //beginErrorCondition} to
     * enter error recovery mode, followed by calling
     * {@link Parser//notifyErrorListeners}.</p>
     *
     * @param recognizer the parser instance
     *
     */
    reportUnwantedToken(recognizer) {
        if (this.inErrorRecoveryMode(recognizer)) {
            return;
        }
        this.beginErrorCondition(recognizer);
        const t = recognizer.getCurrentToken()
        const tokenName = this.getTokenErrorDisplay(t)
        const expecting = this.getExpectedTokens(recognizer)
        const msg = "extraneous input " + tokenName + " expecting " +
            expecting.toString(recognizer.literalNames, recognizer.symbolicNames)
        recognizer.notifyErrorListeners(msg, t, null);
    }

    /**
     * This method is called to report a syntax error which requires the
     * insertion of a missing token into the input stream. At the time this
     * method is called, the missing token has not yet been inserted. When this
     * method returns, {@code recognizer} is in error recovery mode.
     *
     * <p>This method is called when {@link //singleTokenInsertion} identifies
     * single-token insertion as a viable recovery strategy for a mismatched
     * input error.</p>
     *
     * <p>The default implementation simply returns if the handler is already in
     * error recovery mode. Otherwise, it calls {@link //beginErrorCondition} to
     * enter error recovery mode, followed by calling
     * {@link Parser//notifyErrorListeners}.</p>
     *
     * @param recognizer the parser instance
     */
    reportMissingToken(recognizer) {
        if ( this.inErrorRecoveryMode(recognizer)) {
            return;
        }
        this.beginErrorCondition(recognizer);
        const t = recognizer.getCurrentToken()
        const expecting = this.getExpectedTokens(recognizer)
        const msg = "missing " + expecting.toString(recognizer.literalNames, recognizer.symbolicNames) +
            " at " + this.getTokenErrorDisplay(t)
        recognizer.notifyErrorListeners(msg, t, null);
    }

    /**
     * <p>The default implementation attempts to recover from the mismatched input
     * by using single token insertion and deletion as described below. If the
     * recovery attempt fails, this method throws an
     * {@link InputMismatchException}.</p>
     *
     * <p><strong>EXTRA TOKEN</strong> (single token deletion)</p>
     *
     * <p>{@code LA(1)} is not what we are looking for. If {@code LA(2)} has the
     * right token, however, then assume {@code LA(1)} is some extra spurious
     * token and delete it. Then consume and return the next token (which was
     * the {@code LA(2)} token) as the successful result of the match operation.</p>
     *
     * <p>This recovery strategy is implemented by {@link
     * //singleTokenDeletion}.</p>
     *
     * <p><strong>MISSING TOKEN</strong> (single token insertion)</p>
     *
     * <p>If current token (at {@code LA(1)}) is consistent with what could come
     * after the expected {@code LA(1)} token, then assume the token is missing
     * and use the parser's {@link TokenFactory} to create it on the fly. The
     * "insertion" is performed by returning the created token as the successful
     * result of the match operation.</p>
     *
     * <p>This recovery strategy is implemented by {@link
     * //singleTokenInsertion}.</p>
     *
     * <p><strong>EXAMPLE</strong></p>
     *
     * <p>For example, Input {@code i=(3;} is clearly missing the {@code ')'}. When
     * the parser returns from the nested call to {@code expr}, it will have
     * call chain:</p>
     *
     * <pre>
     * stat &rarr; expr &rarr; atom
     * </pre>
     *
     * and it will be trying to match the {@code ')'} at this point in the
     * derivation:
     *
     * <pre>
     * =&gt; ID '=' '(' INT ')' ('+' atom)* ';'
     * ^
     * </pre>
     *
     * The attempt to match {@code ')'} will fail when it sees {@code ';'} and
     * call {@link //recoverInline}. To recover, it sees that {@code LA(1)==';'}
     * is in the set of tokens that can follow the {@code ')'} token reference
     * in rule {@code atom}. It can assume that you forgot the {@code ')'}.
     */
    recoverInline(recognizer) {
        // SINGLE TOKEN DELETION
        const matchedSymbol = this.singleTokenDeletion(recognizer)
        if (matchedSymbol !== null) {
            // we have deleted the extra token.
            // now, move past ttype token as if all were ok
            recognizer.consume();
            return matchedSymbol;
        }
        // SINGLE TOKEN INSERTION
        if (this.singleTokenInsertion(recognizer)) {
            return this.getMissingSymbol(recognizer);
        }
        // even that didn't work; must throw the exception
        throw new InputMismatchException(recognizer);
    }

    /**
     * This method implements the single-token insertion inline error recovery
     * strategy. It is called by {@link //recoverInline} if the single-token
     * deletion strategy fails to recover from the mismatched input. If this
     * method returns {@code true}, {@code recognizer} will be in error recovery
     * mode.
     *
     * <p>This method determines whether or not single-token insertion is viable by
     * checking if the {@code LA(1)} input symbol could be successfully matched
     * if it were instead the {@code LA(2)} symbol. If this method returns
     * {@code true}, the caller is responsible for creating and inserting a
     * token with the correct type to produce this behavior.</p>
     *
     * @param recognizer the parser instance
     * @return {@code true} if single-token insertion is a viable recovery
     * strategy for the current mismatched input, otherwise {@code false}
     */
    singleTokenInsertion(recognizer) {
        const currentSymbolType = recognizer.getTokenStream().LA(1)
        // if current token is consistent with what could come after current
        // ATN state, then we know we're missing a token; error recovery
        // is free to conjure up and insert the missing token
        const atn = recognizer._interp.atn
        const currentState = atn.states[recognizer.state]
        const next = currentState.transitions[0].target
        const expectingAtLL2 = atn.nextTokens(next, recognizer._ctx)
        if (expectingAtLL2.contains(currentSymbolType) ){
            this.reportMissingToken(recognizer);
            return true;
        } else {
            return false;
        }
    }

    /**
     * This method implements the single-token deletion inline error recovery
     * strategy. It is called by {@link //recoverInline} to attempt to recover
     * from mismatched input. If this method returns null, the parser and error
     * handler state will not have changed. If this method returns non-null,
     * {@code recognizer} will <em>not</em> be in error recovery mode since the
     * returned token was a successful match.
     *
     * <p>If the single-token deletion is successful, this method calls
     * {@link //reportUnwantedToken} to report the error, followed by
     * {@link Parser//consume} to actually "delete" the extraneous token. Then,
     * before returning {@link //reportMatch} is called to signal a successful
     * match.</p>
     *
     * @param recognizer the parser instance
     * @return the successfully matched {@link Token} instance if single-token
     * deletion successfully recovers from the mismatched input, otherwise
     * {@code null}
     */
    singleTokenDeletion(recognizer) {
        const nextTokenType = recognizer.getTokenStream().LA(2)
        const expecting = this.getExpectedTokens(recognizer)
        if (expecting.contains(nextTokenType)) {
            this.reportUnwantedToken(recognizer);
            // print("recoverFromMismatchedToken deleting " \
            // + str(recognizer.getTokenStream().LT(1)) \
            // + " since " + str(recognizer.getTokenStream().LT(2)) \
            // + " is what we want", file=sys.stderr)
            recognizer.consume(); // simply delete extra token
            // we want to return the token we're actually matching
            const matchedSymbol = recognizer.getCurrentToken()
            this.reportMatch(recognizer); // we know current token is correct
            return matchedSymbol;
        } else {
            return null;
        }
    }

    /**
     * Conjure up a missing token during error recovery.
     *
     * The recognizer attempts to recover from single missing
     * symbols. But, actions might refer to that missing symbol.
     * For example, x=ID {f($x);}. The action clearly assumes
     * that there has been an identifier matched previously and that
     * $x points at that token. If that token is missing, but
     * the next token in the stream is what we want we assume that
     * this token is missing and we keep going. Because we
     * have to return some token to replace the missing token,
     * we have to conjure one up. This method gives the user control
     * over the tokens returned for missing tokens. Mostly,
     * you will want to create something special for identifier
     * tokens. For literals such as '{' and ',', the default
     * action in the parser or tree parser works. It simply creates
     * a CommonToken of the appropriate type. The text will be the token.
     * If you change what tokens must be created by the lexer,
     * override this method to create the appropriate tokens.
     *
     */
    getMissingSymbol(recognizer) {
        const currentSymbol = recognizer.getCurrentToken()
        const expecting = this.getExpectedTokens(recognizer)
        const expectedTokenType = expecting.first() // get any element
        let tokenText
        if (expectedTokenType===Token.EOF) {
            tokenText = "<missing EOF>";
        } else {
            tokenText = "<missing " + recognizer.literalNames[expectedTokenType] + ">";
        }
        let current = currentSymbol
        const lookback = recognizer.getTokenStream().LT(-1)
        if (current.type===Token.EOF && lookback !== null) {
            current = lookback;
        }
        return recognizer.getTokenFactory().create(current.source,
            expectedTokenType, tokenText, Token.DEFAULT_CHANNEL,
            -1, -1, current.line, current.column);
    }

    getExpectedTokens(recognizer) {
        return recognizer.getExpectedTokens();
    }

    /**
     * How should a token be displayed in an error message? The default
     * is to display just the text, but during development you might
     * want to have a lot of information spit out. Override in that case
     * to use t.toString() (which, for CommonToken, dumps everything about
     * the token). This is better than forcing you to override a method in
     * your token objects because you don't have to go modify your lexer
     * so that it creates a new Java type.
     */
    getTokenErrorDisplay(t) {
        if (t === null) {
            return "<no token>";
        }
        let s = t.text
        if (s === null) {
            if (t.type===Token.EOF) {
                s = "<EOF>";
            } else {
                s = "<" + t.type + ">";
            }
        }
        return this.escapeWSAndQuote(s);
    }

    escapeWSAndQuote(s) {
        s = s.replace(/\n/g,"\\n");
        s = s.replace(/\r/g,"\\r");
        s = s.replace(/\t/g,"\\t");
        return "'" + s + "'";
    }

    /**
     * Compute the error recovery set for the current rule. During
     * rule invocation, the parser pushes the set of tokens that can
     * follow that rule reference on the stack; this amounts to
     * computing FIRST of what follows the rule reference in the
     * enclosing rule. See LinearApproximator.FIRST().
     * This local follow set only includes tokens
     * from within the rule; i.e., the FIRST computation done by
     * ANTLR stops at the end of a rule.
     *
     * EXAMPLE
     *
     * When you find a "no viable alt exception", the input is not
     * consistent with any of the alternatives for rule r. The best
     * thing to do is to consume tokens until you see something that
     * can legally follow a call to r//or* any rule that called r.
     * You don't want the exact set of viable next tokens because the
     * input might just be missing a token--you might consume the
     * rest of the input looking for one of the missing tokens.
     *
     * Consider grammar:
     *
     * a : '[' b ']'
     * | '(' b ')'
     * ;
     * b : c '^' INT ;
     * c : ID
     * | INT
     * ;
     *
     * At each rule invocation, the set of tokens that could follow
     * that rule is pushed on a stack. Here are the various
     * context-sensitive follow sets:
     *
     * FOLLOW(b1_in_a) = FIRST(']') = ']'
     * FOLLOW(b2_in_a) = FIRST(')') = ')'
     * FOLLOW(c_in_b) = FIRST('^') = '^'
     *
     * Upon erroneous input "[]", the call chain is
     *
     * a -> b -> c
     *
     * and, hence, the follow context stack is:
     *
     * depth follow set start of rule execution
     * 0 <EOF> a (from main())
     * 1 ']' b
     * 2 '^' c
     *
     * Notice that ')' is not included, because b would have to have
     * been called from a different context in rule a for ')' to be
     * included.
     *
     * For error recovery, we cannot consider FOLLOW(c)
     * (context-sensitive or otherwise). We need the combined set of
     * all context-sensitive FOLLOW sets--the set of all tokens that
     * could follow any reference in the call chain. We need to
     * resync to one of those tokens. Note that FOLLOW(c)='^' and if
     * we resync'd to that token, we'd consume until EOF. We need to
     * sync to context-sensitive FOLLOWs for a, b, and c: {']','^'}.
     * In this case, for input "[]", LA(1) is ']' and in the set, so we would
     * not consume anything. After printing an error, rule c would
     * return normally. Rule b would not find the required '^' though.
     * At this point, it gets a mismatched token error and throws an
     * exception (since LA(1) is not in the viable following token
     * set). The rule exception handler tries to recover, but finds
     * the same recovery set and doesn't consume anything. Rule b
     * exits normally returning to rule a. Now it finds the ']' (and
     * with the successful match exits errorRecovery mode).
     *
     * So, you can see that the parser walks up the call chain looking
     * for the token that was a member of the recovery set.
     *
     * Errors are not generated in errorRecovery mode.
     *
     * ANTLR's error recovery mechanism is based upon original ideas:
     *
     * "Algorithms + Data Structures = Programs" by Niklaus Wirth
     *
     * and
     *
     * "A note on error recovery in recursive descent parsers":
     * http://portal.acm.org/citation.cfm?id=947902.947905
     *
     * Later, Josef Grosch had some good ideas:
     *
     * "Efficient and Comfortable Error Recovery in Recursive Descent
     * Parsers":
     * ftp://www.cocolab.com/products/cocktail/doca4.ps/ell.ps.zip
     *
     * Like Grosch I implement context-sensitive FOLLOW sets that are combined
     * at run-time upon error to avoid overhead during parsing.
     */
    getErrorRecoverySet(recognizer) {
        const atn = recognizer._interp.atn
        let ctx = recognizer._ctx
        const recoverSet = new IntervalSet()
        while (ctx !== null && ctx.invokingState>=0) {
            // compute what follows who invoked us
            const invokingState = atn.states[ctx.invokingState]
            const rt = invokingState.transitions[0]
            const follow = atn.nextTokens(rt.followState)
            recoverSet.addSet(follow);
            ctx = ctx.parentCtx;
        }
        recoverSet.removeOne(Token.EPSILON);
        return recoverSet;
    }

// Consume tokens until one matches the given token set.//
    consumeUntil(recognizer, set) {
        let ttype = recognizer.getTokenStream().LA(1)
        while( ttype !== Token.EOF && !set.contains(ttype)) {
            recognizer.consume();
            ttype = recognizer.getTokenStream().LA(1);
        }
    }
}


/**
 * This implementation of {@link ANTLRErrorStrategy} responds to syntax errors
 * by immediately canceling the parse operation with a
 * {@link ParseCancellationException}. The implementation ensures that the
 * {@link ParserRuleContext//exception} field is set for all parse tree nodes
 * that were not completed prior to encountering the error.
 *
 * <p>
 * This error strategy is useful in the following scenarios.</p>
 *
 * <ul>
 * <li><strong>Two-stage parsing:</strong> This error strategy allows the first
 * stage of two-stage parsing to immediately terminate if an error is
 * encountered, and immediately fall back to the second stage. In addition to
 * avoiding wasted work by attempting to recover from errors here, the empty
 * implementation of {@link BailErrorStrategy//sync} improves the performance of
 * the first stage.</li>
 * <li><strong>Silent validation:</strong> When syntax errors are not being
 * reported or logged, and the parse result is simply ignored if errors occur,
 * the {@link BailErrorStrategy} avoids wasting work on recovering from errors
 * when the result will be ignored either way.</li>
 * </ul>
 *
 * <p>
 * {@code myparser.setErrorHandler(new BailErrorStrategy());}</p>
 *
 * @see Parser//setErrorHandler(ANTLRErrorStrategy)
 * */
class BailErrorStrategy extends DefaultErrorStrategy {
    constructor() {
        super();
    }

    /**
     * Instead of recovering from exception {@code e}, re-throw it wrapped
     * in a {@link ParseCancellationException} so it is not caught by the
     * rule function catches. Use {@link Exception//getCause()} to get the
     * original {@link RecognitionException}.
     */
    recover(recognizer, e) {
        let context = recognizer._ctx
        while (context !== null) {
            context.exception = e;
            context = context.parentCtx;
        }
        throw new ParseCancellationException(e);
    }

    /**
     * Make sure we don't attempt to recover inline; if the parser
     * successfully recovers, it won't throw an exception.
     */
    recoverInline(recognizer) {
        this.recover(recognizer, new InputMismatchException(recognizer));
    }

// Make sure we don't attempt to recover from problems in subrules.//
    sync(recognizer) {
        // pass
    }
}


module.exports = {BailErrorStrategy, DefaultErrorStrategy};

},{"./../IntervalSet":7,"./../Token":15,"./../atn/ATNState":23,"./Errors":40}],40:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

/**
 * The root of the ANTLR exception hierarchy. In general, ANTLR tracks just
 *  3 kinds of errors: prediction errors, failed predicate errors, and
 *  mismatched input errors. In each case, the parser knows where it is
 *  in the input, where it is in the ATN, the rule invocation stack,
 *  and what kind of problem occurred.
 */

const {PredicateTransition} = require('./../atn/Transition');
const {Interval} = require('../IntervalSet').Interval;

class RecognitionException extends Error {
    constructor(params) {
        super(params.message);
        if (!!Error.captureStackTrace) {
            Error.captureStackTrace(this, RecognitionException);
        } else {
            var stack = new Error().stack;
        }
        this.message = params.message;
        this.recognizer = params.recognizer;
        this.input = params.input;
        this.ctx = params.ctx;
        /**
         * The current {@link Token} when an error occurred. Since not all streams
         * support accessing symbols by index, we have to track the {@link Token}
         * instance itself
        */
        this.offendingToken = null;
        /**
         * Get the ATN state number the parser was in at the time the error
         * occurred. For {@link NoViableAltException} and
         * {@link LexerNoViableAltException} exceptions, this is the
         * {@link DecisionState} number. For others, it is the state whose outgoing
         * edge we couldn't match.
         */
        this.offendingState = -1;
        if (this.recognizer!==null) {
            this.offendingState = this.recognizer.state;
        }
    }

    /**
     * Gets the set of input symbols which could potentially follow the
     * previously matched symbol at the time this exception was thrown.
     *
     * <p>If the set of expected tokens is not known and could not be computed,
     * this method returns {@code null}.</p>
     *
     * @return The set of token types that could potentially follow the current
     * state in the ATN, or {@code null} if the information is not available.
     */
    getExpectedTokens() {
        if (this.recognizer!==null) {
            return this.recognizer.atn.getExpectedTokens(this.offendingState, this.ctx);
        } else {
            return null;
        }
    }

    // <p>If the state number is not known, this method returns -1.</p>
    toString() {
        return this.message;
    }
}

class LexerNoViableAltException extends RecognitionException {
    constructor(lexer, input, startIndex, deadEndConfigs) {
        super({message: "", recognizer: lexer, input: input, ctx: null});
        this.startIndex = startIndex;
        this.deadEndConfigs = deadEndConfigs;
    }

    toString() {
        let symbol = "";
        if (this.startIndex >= 0 && this.startIndex < this.input.size) {
            symbol = this.input.getText(new Interval(this.startIndex,this.startIndex));
        }
        return "LexerNoViableAltException" + symbol;
    }
}


/**
 * Indicates that the parser could not decide which of two or more paths
 * to take based upon the remaining input. It tracks the starting token
 * of the offending input and also knows where the parser was
 * in the various paths when the error. Reported by reportNoViableAlternative()
 */
class NoViableAltException extends RecognitionException {
    constructor(recognizer, input, startToken, offendingToken, deadEndConfigs, ctx) {
        ctx = ctx || recognizer._ctx;
        offendingToken = offendingToken || recognizer.getCurrentToken();
        startToken = startToken || recognizer.getCurrentToken();
        input = input || recognizer.getInputStream();
        super({message: "", recognizer: recognizer, input: input, ctx: ctx});
        // Which configurations did we try at input.index() that couldn't match
        // input.LT(1)?//
        this.deadEndConfigs = deadEndConfigs;
        // The token object at the start index; the input stream might
        // not be buffering tokens so get a reference to it. (At the
        // time the error occurred, of course the stream needs to keep a
        // buffer all of the tokens but later we might not have access to those.)
        this.startToken = startToken;
        this.offendingToken = offendingToken;
    }
}

/**
 * This signifies any kind of mismatched input exceptions such as
 * when the current input does not match the expected token.
*/
class InputMismatchException extends RecognitionException {
    constructor(recognizer) {
        super({message: "", recognizer: recognizer, input: recognizer.getInputStream(), ctx: recognizer._ctx});
        this.offendingToken = recognizer.getCurrentToken();
    }
}

function formatMessage(predicate, message) {
    if (message !==null) {
        return message;
    } else {
        return "failed predicate: {" + predicate + "}?";
    }
}

/**
 * A semantic predicate failed during validation. Validation of predicates
 * occurs when normally parsing the alternative just like matching a token.
 * Disambiguating predicate evaluation occurs when we test a predicate during
 * prediction.
*/
class FailedPredicateException extends RecognitionException {
    constructor(recognizer, predicate, message) {
        super({
            message: formatMessage(predicate, message || null), recognizer: recognizer,
            input: recognizer.getInputStream(), ctx: recognizer._ctx
        });
        const s = recognizer._interp.atn.states[recognizer.state]
        const trans = s.transitions[0]
        if (trans instanceof PredicateTransition) {
            this.ruleIndex = trans.ruleIndex;
            this.predicateIndex = trans.predIndex;
        } else {
            this.ruleIndex = 0;
            this.predicateIndex = 0;
        }
        this.predicate = predicate;
        this.offendingToken = recognizer.getCurrentToken();
    }
}


class ParseCancellationException extends Error{
    constructor() {
        super()
        Error.captureStackTrace(this, ParseCancellationException);
    }
}

module.exports = {
    RecognitionException,
    NoViableAltException,
    LexerNoViableAltException,
    InputMismatchException,
    FailedPredicateException,
    ParseCancellationException
};

},{"../IntervalSet":7,"./../atn/Transition":31}],41:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

module.exports.RecognitionException = require('./Errors').RecognitionException;
module.exports.NoViableAltException = require('./Errors').NoViableAltException;
module.exports.LexerNoViableAltException = require('./Errors').LexerNoViableAltException;
module.exports.InputMismatchException = require('./Errors').InputMismatchException;
module.exports.FailedPredicateException = require('./Errors').FailedPredicateException;
module.exports.DiagnosticErrorListener = require('./DiagnosticErrorListener');
module.exports.BailErrorStrategy = require('./ErrorStrategy').BailErrorStrategy;
module.exports.DefaultErrorStrategy = require('./ErrorStrategy').DefaultErrorStrategy;
module.exports.ErrorListener = require('./ErrorListener').ErrorListener;

},{"./DiagnosticErrorListener":37,"./ErrorListener":38,"./ErrorStrategy":39,"./Errors":40}],42:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */
exports.atn = require('./atn/index');
exports.codepointat = require('./polyfills/codepointat');
exports.dfa = require('./dfa/index');
exports.fromcodepoint = require('./polyfills/fromcodepoint');
exports.tree = require('./tree/index');
exports.error = require('./error/index');
exports.Token = require('./Token').Token;
exports.CharStreams = require('./CharStreams');
exports.CommonToken = require('./Token').CommonToken;
exports.InputStream = require('./InputStream');
exports.FileStream = require('./FileStream');
exports.CommonTokenStream = require('./CommonTokenStream');
exports.Lexer = require('./Lexer');
exports.Parser = require('./Parser');
var pc = require('./PredictionContext');
exports.PredictionContextCache = pc.PredictionContextCache;
exports.ParserRuleContext = require('./ParserRuleContext');
exports.Interval = require('./IntervalSet').Interval;
exports.IntervalSet = require('./IntervalSet').IntervalSet;
exports.Utils = require('./Utils');
exports.LL1Analyzer = require('./LL1Analyzer').LL1Analyzer;

},{"./CharStreams":2,"./CommonTokenStream":4,"./FileStream":5,"./InputStream":6,"./IntervalSet":7,"./LL1Analyzer":8,"./Lexer":9,"./Parser":10,"./ParserRuleContext":11,"./PredictionContext":12,"./Token":15,"./Utils":16,"./atn/index":32,"./dfa/index":36,"./error/index":41,"./polyfills/codepointat":43,"./polyfills/fromcodepoint":44,"./tree/index":47}],43:[function(require,module,exports){
/*! https://mths.be/codepointat v0.2.0 by @mathias */
if (!String.prototype.codePointAt) {
	(function() {
		'use strict'; // needed to support `apply`/`call` with `undefined`/`null`
		var defineProperty = (function() {
			// IE 8 only supports `Object.defineProperty` on DOM elements
			let result;
			try {
				const object = {};
				const $defineProperty = Object.defineProperty;
				result = $defineProperty(object, object, object) && $defineProperty;
			} catch(error) {
			}
			return result;
		}());
		const codePointAt = function(position) {
			if (this == null) {
				throw TypeError();
			}
			const string = String(this);
			const size = string.length;
			// `ToInteger`
			let index = position ? Number(position) : 0;
			if (index !== index) { // better `isNaN`
				index = 0;
			}
			// Account for out-of-bounds indices:
			if (index < 0 || index >= size) {
				return undefined;
			}
			// Get the first code unit
			const first = string.charCodeAt(index);
			let second;
			if ( // check if it’s the start of a surrogate pair
				first >= 0xD800 && first <= 0xDBFF && // high surrogate
				size > index + 1 // there is a next code unit
			) {
				second = string.charCodeAt(index + 1);
				if (second >= 0xDC00 && second <= 0xDFFF) { // low surrogate
					// https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
					return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
				}
			}
			return first;
		};
		if (defineProperty) {
			defineProperty(String.prototype, 'codePointAt', {
				'value': codePointAt,
				'configurable': true,
				'writable': true
			});
		} else {
			String.prototype.codePointAt = codePointAt;
		}
	}());
}

},{}],44:[function(require,module,exports){
/*! https://mths.be/fromcodepoint v0.2.1 by @mathias */
if (!String.fromCodePoint) {
	(function() {
		const defineProperty = (function() {
			// IE 8 only supports `Object.defineProperty` on DOM elements
			let result;
			try {
				const object = {};
				const $defineProperty = Object.defineProperty;
				result = $defineProperty(object, object, object) && $defineProperty;
			} catch(error) {}
			return result;
		}());
		const stringFromCharCode = String.fromCharCode;
		const floor = Math.floor;
		const fromCodePoint = function(_) {
			const MAX_SIZE = 0x4000;
			const codeUnits = [];
			let highSurrogate;
			let lowSurrogate;
			let index = -1;
			const length = arguments.length;
			if (!length) {
				return '';
			}
			let result = '';
			while (++index < length) {
				let codePoint = Number(arguments[index]);
				if (
					!isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
					codePoint < 0 || // not a valid Unicode code point
					codePoint > 0x10FFFF || // not a valid Unicode code point
					floor(codePoint) !== codePoint // not an integer
				) {
					throw RangeError('Invalid code point: ' + codePoint);
				}
				if (codePoint <= 0xFFFF) { // BMP code point
					codeUnits.push(codePoint);
				} else { // Astral code point; split in surrogate halves
					// https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
					codePoint -= 0x10000;
					highSurrogate = (codePoint >> 10) + 0xD800;
					lowSurrogate = (codePoint % 0x400) + 0xDC00;
					codeUnits.push(highSurrogate, lowSurrogate);
				}
				if (index + 1 === length || codeUnits.length > MAX_SIZE) {
					result += stringFromCharCode.apply(null, codeUnits);
					codeUnits.length = 0;
				}
			}
			return result;
		};
		if (defineProperty) {
			defineProperty(String, 'fromCodePoint', {
				'value': fromCodePoint,
				'configurable': true,
				'writable': true
			});
		} else {
			String.fromCodePoint = fromCodePoint;
		}
	}());
}

},{}],45:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const {Token} = require('./../Token');
const {Interval} = require('./../IntervalSet');
const INVALID_INTERVAL = new Interval(-1, -2);

/**
 * The basic notion of a tree has a parent, a payload, and a list of children.
 * It is the most abstract interface for all the trees used by ANTLR.
 */
class Tree {}

class SyntaxTree extends Tree {
	constructor() {
		super();
	}
}

class ParseTree extends SyntaxTree {
	constructor() {
		super();
	}
}

class RuleNode extends ParseTree {
	constructor() {
		super();
	}

	getRuleContext(){
		throw new Error("missing interface implementation")
	}
}

class TerminalNode extends ParseTree {
	constructor() {
		super();
	}
}

class ErrorNode extends TerminalNode {
	constructor() {
		super();
	}
}

class ParseTreeVisitor {
	visit(ctx) {
		 if (Array.isArray(ctx)) {
			return ctx.map(function(child) {
				return child.accept(this);
			}, this);
		} else {
			return ctx.accept(this);
		}
	}

	visitChildren(ctx) {
		if (ctx.children) {
			return this.visit(ctx.children);
		} else {
			return null;
		}
	}

	visitTerminal(node) {
	}

	visitErrorNode(node) {
	}
}

class ParseTreeListener {
	visitTerminal(node) {
	}

	visitErrorNode(node) {
	}

	enterEveryRule(node) {
	}

	exitEveryRule(node) {
	}
}

class TerminalNodeImpl extends TerminalNode {
	constructor(symbol) {
		super();
		this.parentCtx = null;
		this.symbol = symbol;
	}

	getChild(i) {
		return null;
	}

	getSymbol() {
		return this.symbol;
	}

	getParent() {
		return this.parentCtx;
	}

	getPayload() {
		return this.symbol;
	}

	getSourceInterval() {
		if (this.symbol === null) {
			return INVALID_INTERVAL;
		}
		const tokenIndex = this.symbol.tokenIndex;
		return new Interval(tokenIndex, tokenIndex);
	}

	getChildCount() {
		return 0;
	}

	accept(visitor) {
		return visitor.visitTerminal(this);
	}

	getText() {
		return this.symbol.text;
	}

	toString() {
		if (this.symbol.type === Token.EOF) {
			return "<EOF>";
		} else {
			return this.symbol.text;
		}
	}
}


/**
 * Represents a token that was consumed during resynchronization
 * rather than during a valid match operation. For example,
 * we will create this kind of a node during single token insertion
 * and deletion as well as during "consume until error recovery set"
 * upon no viable alternative exceptions.
 */
class ErrorNodeImpl extends TerminalNodeImpl {
	constructor(token) {
		super(token);
	}

	isErrorNode() {
		return true;
	}

	accept(visitor) {
		return visitor.visitErrorNode(this);
	}
}

class ParseTreeWalker {

	/**
	 * Performs a walk on the given parse tree starting at the root and going down recursively
	 * with depth-first search. On each node, {@link ParseTreeWalker//enterRule} is called before
	 * recursively walking down into child nodes, then
	 * {@link ParseTreeWalker//exitRule} is called after the recursive call to wind up.
	 * @param listener The listener used by the walker to process grammar rules
	 * @param t The parse tree to be walked on
	 */
	walk(listener, t) {
		const errorNode = t instanceof ErrorNode ||
				(t.isErrorNode !== undefined && t.isErrorNode());
		if (errorNode) {
			listener.visitErrorNode(t);
		} else if (t instanceof TerminalNode) {
			listener.visitTerminal(t);
		} else {
			this.enterRule(listener, t);
			for (let i = 0; i < t.getChildCount(); i++) {
				const child = t.getChild(i);
				this.walk(listener, child);
			}
			this.exitRule(listener, t);
		}
	}

	/**
	 * Enters a grammar rule by first triggering the generic event {@link ParseTreeListener//enterEveryRule}
	 * then by triggering the event specific to the given parse tree node
	 * @param listener The listener responding to the trigger events
	 * @param r The grammar rule containing the rule context
	 */
	enterRule(listener, r) {
		const ctx = r.getRuleContext();
		listener.enterEveryRule(ctx);
		ctx.enterRule(listener);
	}

	/**
	 * Exits a grammar rule by first triggering the event specific to the given parse tree node
	 * then by triggering the generic event {@link ParseTreeListener//exitEveryRule}
	 * @param listener The listener responding to the trigger events
	 * @param r The grammar rule containing the rule context
	 */
	exitRule(listener, r) {
		const ctx = r.getRuleContext();
		ctx.exitRule(listener);
		listener.exitEveryRule(ctx);
	}
}

ParseTreeWalker.DEFAULT = new ParseTreeWalker();

module.exports = {
	RuleNode,
	ErrorNode,
	TerminalNode,
	ErrorNodeImpl,
	TerminalNodeImpl,
	ParseTreeListener,
	ParseTreeVisitor,
	ParseTreeWalker,
	INVALID_INTERVAL
}

},{"./../IntervalSet":7,"./../Token":15}],46:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const Utils = require('./../Utils');
const {Token} = require('./../Token');
const {ErrorNode, TerminalNode, RuleNode} = require('./Tree');

/** A set of utility routines useful for all kinds of ANTLR trees. */
const Trees = {
    /**
     * Print out a whole tree in LISP form. {@link //getNodeText} is used on the
     *  node payloads to get the text for the nodes.  Detect
     *  parse trees and extract data appropriately.
     */
    toStringTree: function(tree, ruleNames, recog) {
        ruleNames = ruleNames || null;
        recog = recog || null;
        if(recog!==null) {
            ruleNames = recog.ruleNames;
        }
        let s = Trees.getNodeText(tree, ruleNames);
        s = Utils.escapeWhitespace(s, false);
        const c = tree.getChildCount();
        if(c===0) {
            return s;
        }
        let res = "(" + s + ' ';
        if(c>0) {
            s = Trees.toStringTree(tree.getChild(0), ruleNames);
            res = res.concat(s);
        }
        for(let i=1;i<c;i++) {
            s = Trees.toStringTree(tree.getChild(i), ruleNames);
            res = res.concat(' ' + s);
        }
        res = res.concat(")");
        return res;
    },

    getNodeText: function(t, ruleNames, recog) {
        ruleNames = ruleNames || null;
        recog = recog || null;
        if(recog!==null) {
            ruleNames = recog.ruleNames;
        }
        if(ruleNames!==null) {
            if (t instanceof RuleNode) {
                const context = t.getRuleContext()
                const altNumber = context.getAltNumber();
                // use const value of ATN.INVALID_ALT_NUMBER to avoid circular dependency
                if ( altNumber != 0 ) {
                    return ruleNames[t.ruleIndex]+":"+altNumber;
                }
                return ruleNames[t.ruleIndex];
            } else if ( t instanceof ErrorNode) {
                return t.toString();
            } else if(t instanceof TerminalNode) {
                if(t.symbol!==null) {
                    return t.symbol.text;
                }
            }
        }
        // no recog for rule names
        const payload = t.getPayload();
        if (payload instanceof Token ) {
            return payload.text;
        }
        return t.getPayload().toString();
    },

    /**
     * Return ordered list of all children of this node
     */
    getChildren: function(t) {
        const list = [];
        for(let i=0;i<t.getChildCount();i++) {
            list.push(t.getChild(i));
        }
        return list;
    },

    /**
     * Return a list of all ancestors of this node.  The first node of
     * list is the root and the last is the parent of this node.
     */
    getAncestors: function(t) {
        let ancestors = [];
        t = t.getParent();
        while(t!==null) {
            ancestors = [t].concat(ancestors);
            t = t.getParent();
        }
        return ancestors;
    },

    findAllTokenNodes: function(t, ttype) {
        return Trees.findAllNodes(t, ttype, true);
    },

    findAllRuleNodes: function(t, ruleIndex) {
        return Trees.findAllNodes(t, ruleIndex, false);
    },

    findAllNodes: function(t, index, findTokens) {
        const nodes = [];
        Trees._findAllNodes(t, index, findTokens, nodes);
        return nodes;
    },

    _findAllNodes: function(t, index, findTokens, nodes) {
        // check this node (the root) first
        if(findTokens && (t instanceof TerminalNode)) {
            if(t.symbol.type===index) {
                nodes.push(t);
            }
        } else if(!findTokens && (t instanceof RuleNode)) {
            if(t.ruleIndex===index) {
                nodes.push(t);
            }
        }
        // check children
        for(let i=0;i<t.getChildCount();i++) {
            Trees._findAllNodes(t.getChild(i), index, findTokens, nodes);
        }
    },

    descendants: function(t) {
        let nodes = [t];
        for(let i=0;i<t.getChildCount();i++) {
            nodes = nodes.concat(Trees.descendants(t.getChild(i)));
        }
        return nodes;
    }
}

module.exports = Trees;

},{"./../Token":15,"./../Utils":16,"./Tree":45}],47:[function(require,module,exports){
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */

const Tree = require('./Tree');
const Trees = require('./Trees');
module.exports = {...Tree, Trees}

},{"./Tree":45,"./Trees":46}],48:[function(require,module,exports){

},{}]},{},[42])(42)
});
