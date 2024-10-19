var antlr4 = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var require_antlr4_web = __commonJS({
    "node_modules/antlr4/dist/antlr4.web.cjs"(exports) {
      (() => {
        var t = { 763: () => {
        } }, e = {};
        function n(s2) {
          var i2 = e[s2];
          if (void 0 !== i2) return i2.exports;
          var r2 = e[s2] = { exports: {} };
          return t[s2](r2, r2.exports, n), r2.exports;
        }
        n.d = (t2, e2) => {
          for (var s2 in e2) n.o(e2, s2) && !n.o(t2, s2) && Object.defineProperty(t2, s2, { enumerable: true, get: e2[s2] });
        }, n.o = (t2, e2) => Object.prototype.hasOwnProperty.call(t2, e2), n.r = (t2) => {
          "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(t2, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(t2, "__esModule", { value: true });
        };
        var s = {};
        (() => {
          "use strict";
          n.r(s), n.d(s, { ATN: () => j, ATNDeserializer: () => It, BailErrorStrategy: () => _e, CharStream: () => Ae, CharStreams: () => Le, CommonToken: () => vt, CommonTokenStream: () => we, DFA: () => oe, DefaultErrorStrategy: () => Ee, DiagnosticErrorListener: () => Te, ErrorListener: () => yt, FailedPredicateException: () => fe, InputMismatchException: () => pe, InputStream: () => Ne, Interval: () => S, IntervalSet: () => m, LL1Analyzer: () => G, Lexer: () => Ft, LexerATNSimulator: () => Wt, NoViableAltException: () => Zt, ParseTreeListener: () => ce, ParseTreeVisitor: () => ue, ParseTreeWalker: () => de, Parser: () => be, ParserATNSimulator: () => ee, ParserRuleContext: () => Me, PredictionContextCache: () => ne, PredictionMode: () => Qt, RecognitionException: () => bt, RuleContext: () => F, RuleNode: () => v, TerminalNode: () => w, Token: () => t2, TokenStreamRewriter: () => Ue, arrayToString: () => c, default: () => He });
          class t2 {
            constructor() {
              this.source = null, this.type = null, this.channel = null, this.start = null, this.stop = null, this.tokenIndex = null, this.line = null, this.column = null, this._text = null;
            }
            getTokenSource() {
              return this.source[0];
            }
            getInputStream() {
              return this.source[1];
            }
            get text() {
              return this._text;
            }
            set text(t3) {
              this._text = t3;
            }
          }
          function e2(t3, e3) {
            if (!Array.isArray(t3) || !Array.isArray(e3)) return false;
            if (t3 === e3) return true;
            if (t3.length !== e3.length) return false;
            for (let n2 = 0; n2 < t3.length; n2++) if (!(t3[n2] === e3[n2] || t3[n2].equals && t3[n2].equals(e3[n2]))) return false;
            return true;
          }
          t2.INVALID_TYPE = 0, t2.EPSILON = -2, t2.MIN_USER_TOKEN_TYPE = 1, t2.EOF = -1, t2.DEFAULT_CHANNEL = 0, t2.HIDDEN_CHANNEL = 1;
          const i2 = Math.round(Math.random() * Math.pow(2, 32));
          function r2(t3) {
            if (!t3) return 0;
            const e3 = typeof t3, n2 = "string" === e3 ? t3 : !("object" !== e3 || !t3.toString) && t3.toString();
            if (!n2) return 0;
            let s2, r3;
            const o2 = 3 & n2.length, a2 = n2.length - o2;
            let l2 = i2;
            const h2 = 3432918353, c2 = 461845907;
            let u2 = 0;
            for (; u2 < a2; ) r3 = 255 & n2.charCodeAt(u2) | (255 & n2.charCodeAt(++u2)) << 8 | (255 & n2.charCodeAt(++u2)) << 16 | (255 & n2.charCodeAt(++u2)) << 24, ++u2, r3 = (65535 & r3) * h2 + (((r3 >>> 16) * h2 & 65535) << 16) & 4294967295, r3 = r3 << 15 | r3 >>> 17, r3 = (65535 & r3) * c2 + (((r3 >>> 16) * c2 & 65535) << 16) & 4294967295, l2 ^= r3, l2 = l2 << 13 | l2 >>> 19, s2 = 5 * (65535 & l2) + ((5 * (l2 >>> 16) & 65535) << 16) & 4294967295, l2 = 27492 + (65535 & s2) + ((58964 + (s2 >>> 16) & 65535) << 16);
            switch (r3 = 0, o2) {
              case 3:
                r3 ^= (255 & n2.charCodeAt(u2 + 2)) << 16;
              case 2:
                r3 ^= (255 & n2.charCodeAt(u2 + 1)) << 8;
              case 1:
                r3 ^= 255 & n2.charCodeAt(u2), r3 = (65535 & r3) * h2 + (((r3 >>> 16) * h2 & 65535) << 16) & 4294967295, r3 = r3 << 15 | r3 >>> 17, r3 = (65535 & r3) * c2 + (((r3 >>> 16) * c2 & 65535) << 16) & 4294967295, l2 ^= r3;
            }
            return l2 ^= n2.length, l2 ^= l2 >>> 16, l2 = 2246822507 * (65535 & l2) + ((2246822507 * (l2 >>> 16) & 65535) << 16) & 4294967295, l2 ^= l2 >>> 13, l2 = 3266489909 * (65535 & l2) + ((3266489909 * (l2 >>> 16) & 65535) << 16) & 4294967295, l2 ^= l2 >>> 16, l2 >>> 0;
          }
          class o {
            constructor() {
              this.count = 0, this.hash = 0;
            }
            update() {
              for (let t3 = 0; t3 < arguments.length; t3++) {
                const e3 = arguments[t3];
                if (null != e3) if (Array.isArray(e3)) this.update.apply(this, e3);
                else {
                  let t4 = 0;
                  switch (typeof e3) {
                    case "undefined":
                    case "function":
                      continue;
                    case "number":
                    case "boolean":
                      t4 = e3;
                      break;
                    case "string":
                      t4 = r2(e3);
                      break;
                    default:
                      e3.updateHashCode ? e3.updateHashCode(this) : console.log("No updateHashCode for " + e3.toString());
                      continue;
                  }
                  t4 *= 3432918353, t4 = t4 << 15 | t4 >>> 17, t4 *= 461845907, this.count = this.count + 1;
                  let n2 = this.hash ^ t4;
                  n2 = n2 << 13 | n2 >>> 19, n2 = 5 * n2 + 3864292196, this.hash = n2;
                }
              }
            }
            finish() {
              let t3 = this.hash ^ 4 * this.count;
              return t3 ^= t3 >>> 16, t3 *= 2246822507, t3 ^= t3 >>> 13, t3 *= 3266489909, t3 ^= t3 >>> 16, t3;
            }
            static hashStuff() {
              const t3 = new o();
              return t3.update.apply(t3, arguments), t3.finish();
            }
          }
          function a(t3) {
            return t3 ? "string" == typeof t3 ? r2(t3) : t3.hashCode() : -1;
          }
          function l(t3, e3) {
            return t3 && t3.equals ? t3.equals(e3) : t3 === e3;
          }
          function h(t3) {
            return null === t3 ? "null" : t3;
          }
          function c(t3) {
            return Array.isArray(t3) ? "[" + t3.map(h).join(", ") + "]" : "null";
          }
          class u {
            constructor(t3, e3) {
              this.buckets = new Array(16), this.threshold = Math.floor(12), this.itemCount = 0, this.hashFunction = t3 || a, this.equalsFunction = e3 || l;
            }
            get(t3) {
              if (null == t3) return t3;
              const e3 = this._getBucket(t3);
              if (!e3) return null;
              for (const n2 of e3) if (this.equalsFunction(n2, t3)) return n2;
              return null;
            }
            add(t3) {
              return this.getOrAdd(t3) === t3;
            }
            getOrAdd(t3) {
              this._expand();
              const e3 = this._getSlot(t3);
              let n2 = this.buckets[e3];
              if (!n2) return n2 = [t3], this.buckets[e3] = n2, this.itemCount++, t3;
              for (const e4 of n2) if (this.equalsFunction(e4, t3)) return e4;
              return n2.push(t3), this.itemCount++, t3;
            }
            has(t3) {
              return null != this.get(t3);
            }
            values() {
              return this.buckets.filter((t3) => null != t3).flat(1);
            }
            toString() {
              return c(this.values());
            }
            get length() {
              return this.itemCount;
            }
            _getSlot(t3) {
              return this.hashFunction(t3) & this.buckets.length - 1;
            }
            _getBucket(t3) {
              return this.buckets[this._getSlot(t3)];
            }
            _expand() {
              if (this.itemCount <= this.threshold) return;
              const t3 = this.buckets, e3 = 2 * this.buckets.length;
              this.buckets = new Array(e3), this.threshold = Math.floor(0.75 * e3);
              for (const e4 of t3) if (e4) for (const t4 of e4) {
                const e5 = this._getSlot(t4);
                let n2 = this.buckets[e5];
                n2 || (n2 = [], this.buckets[e5] = n2), n2.push(t4);
              }
            }
          }
          class d {
            hashCode() {
              const t3 = new o();
              return this.updateHashCode(t3), t3.finish();
            }
            evaluate(t3, e3) {
            }
            evalPrecedence(t3, e3) {
              return this;
            }
            static andContext(t3, e3) {
              if (null === t3 || t3 === d.NONE) return e3;
              if (null === e3 || e3 === d.NONE) return t3;
              const n2 = new g(t3, e3);
              return 1 === n2.opnds.length ? n2.opnds[0] : n2;
            }
            static orContext(t3, e3) {
              if (null === t3) return e3;
              if (null === e3) return t3;
              if (t3 === d.NONE || e3 === d.NONE) return d.NONE;
              const n2 = new p(t3, e3);
              return 1 === n2.opnds.length ? n2.opnds[0] : n2;
            }
          }
          class g extends d {
            constructor(t3, e3) {
              super();
              const n2 = new u();
              t3 instanceof g ? t3.opnds.map(function(t4) {
                n2.add(t4);
              }) : n2.add(t3), e3 instanceof g ? e3.opnds.map(function(t4) {
                n2.add(t4);
              }) : n2.add(e3);
              const s2 = f(n2);
              if (s2.length > 0) {
                let t4 = null;
                s2.map(function(e4) {
                  (null === t4 || e4.precedence < t4.precedence) && (t4 = e4);
                }), n2.add(t4);
              }
              this.opnds = Array.from(n2.values());
            }
            equals(t3) {
              return this === t3 || t3 instanceof g && e2(this.opnds, t3.opnds);
            }
            updateHashCode(t3) {
              t3.update(this.opnds, "AND");
            }
            evaluate(t3, e3) {
              for (let n2 = 0; n2 < this.opnds.length; n2++) if (!this.opnds[n2].evaluate(t3, e3)) return false;
              return true;
            }
            evalPrecedence(t3, e3) {
              let n2 = false;
              const s2 = [];
              for (let i4 = 0; i4 < this.opnds.length; i4++) {
                const r3 = this.opnds[i4], o2 = r3.evalPrecedence(t3, e3);
                if (n2 |= o2 !== r3, null === o2) return null;
                o2 !== d.NONE && s2.push(o2);
              }
              if (!n2) return this;
              if (0 === s2.length) return d.NONE;
              let i3 = null;
              return s2.map(function(t4) {
                i3 = null === i3 ? t4 : d.andContext(i3, t4);
              }), i3;
            }
            toString() {
              const t3 = this.opnds.map((t4) => t4.toString());
              return (t3.length > 3 ? t3.slice(3) : t3).join("&&");
            }
          }
          class p extends d {
            constructor(t3, e3) {
              super();
              const n2 = new u();
              t3 instanceof p ? t3.opnds.map(function(t4) {
                n2.add(t4);
              }) : n2.add(t3), e3 instanceof p ? e3.opnds.map(function(t4) {
                n2.add(t4);
              }) : n2.add(e3);
              const s2 = f(n2);
              if (s2.length > 0) {
                const t4 = s2.sort(function(t5, e5) {
                  return t5.compareTo(e5);
                }), e4 = t4[t4.length - 1];
                n2.add(e4);
              }
              this.opnds = Array.from(n2.values());
            }
            equals(t3) {
              return this === t3 || t3 instanceof p && e2(this.opnds, t3.opnds);
            }
            updateHashCode(t3) {
              t3.update(this.opnds, "OR");
            }
            evaluate(t3, e3) {
              for (let n2 = 0; n2 < this.opnds.length; n2++) if (this.opnds[n2].evaluate(t3, e3)) return true;
              return false;
            }
            evalPrecedence(t3, e3) {
              let n2 = false;
              const s2 = [];
              for (let i3 = 0; i3 < this.opnds.length; i3++) {
                const r3 = this.opnds[i3], o2 = r3.evalPrecedence(t3, e3);
                if (n2 |= o2 !== r3, o2 === d.NONE) return d.NONE;
                null !== o2 && s2.push(o2);
              }
              if (!n2) return this;
              if (0 === s2.length) return null;
              return s2.map(function(t4) {
                return t4;
              }), null;
            }
            toString() {
              const t3 = this.opnds.map((t4) => t4.toString());
              return (t3.length > 3 ? t3.slice(3) : t3).join("||");
            }
          }
          function f(t3) {
            const e3 = [];
            return t3.values().map(function(t4) {
              t4 instanceof d.PrecedencePredicate && e3.push(t4);
            }), e3;
          }
          function x(t3, e3) {
            if (null === t3) {
              const t4 = { state: null, alt: null, context: null, semanticContext: null };
              return e3 && (t4.reachesIntoOuterContext = 0), t4;
            }
            {
              const n2 = {};
              return n2.state = t3.state || null, n2.alt = void 0 === t3.alt ? null : t3.alt, n2.context = t3.context || null, n2.semanticContext = t3.semanticContext || null, e3 && (n2.reachesIntoOuterContext = t3.reachesIntoOuterContext || 0, n2.precedenceFilterSuppressed = t3.precedenceFilterSuppressed || false), n2;
            }
          }
          class T {
            constructor(t3, e3) {
              this.checkContext(t3, e3), t3 = x(t3), e3 = x(e3, true), this.state = null !== t3.state ? t3.state : e3.state, this.alt = null !== t3.alt ? t3.alt : e3.alt, this.context = null !== t3.context ? t3.context : e3.context, this.semanticContext = null !== t3.semanticContext ? t3.semanticContext : null !== e3.semanticContext ? e3.semanticContext : d.NONE, this.reachesIntoOuterContext = e3.reachesIntoOuterContext, this.precedenceFilterSuppressed = e3.precedenceFilterSuppressed;
            }
            checkContext(t3, e3) {
              null !== t3.context && void 0 !== t3.context || null !== e3 && null !== e3.context && void 0 !== e3.context || (this.context = null);
            }
            hashCode() {
              const t3 = new o();
              return this.updateHashCode(t3), t3.finish();
            }
            updateHashCode(t3) {
              t3.update(this.state.stateNumber, this.alt, this.context, this.semanticContext);
            }
            equals(t3) {
              return this === t3 || t3 instanceof T && this.state.stateNumber === t3.state.stateNumber && this.alt === t3.alt && (null === this.context ? null === t3.context : this.context.equals(t3.context)) && this.semanticContext.equals(t3.semanticContext) && this.precedenceFilterSuppressed === t3.precedenceFilterSuppressed;
            }
            hashCodeForConfigSet() {
              const t3 = new o();
              return t3.update(this.state.stateNumber, this.alt, this.semanticContext), t3.finish();
            }
            equalsForConfigSet(t3) {
              return this === t3 || t3 instanceof T && this.state.stateNumber === t3.state.stateNumber && this.alt === t3.alt && this.semanticContext.equals(t3.semanticContext);
            }
            toString() {
              return "(" + this.state + "," + this.alt + (null !== this.context ? ",[" + this.context.toString() + "]" : "") + (this.semanticContext !== d.NONE ? "," + this.semanticContext.toString() : "") + (this.reachesIntoOuterContext > 0 ? ",up=" + this.reachesIntoOuterContext : "") + ")";
            }
          }
          class S {
            constructor(t3, e3) {
              this.start = t3, this.stop = e3;
            }
            clone() {
              return new S(this.start, this.stop);
            }
            contains(t3) {
              return t3 >= this.start && t3 < this.stop;
            }
            toString() {
              return this.start === this.stop - 1 ? this.start.toString() : this.start.toString() + ".." + (this.stop - 1).toString();
            }
            get length() {
              return this.stop - this.start;
            }
          }
          S.INVALID_INTERVAL = new S(-1, -2);
          class m {
            constructor() {
              this.intervals = null, this.readOnly = false;
            }
            first(e3) {
              return null === this.intervals || 0 === this.intervals.length ? t2.INVALID_TYPE : this.intervals[0].start;
            }
            addOne(t3) {
              this.addInterval(new S(t3, t3 + 1));
            }
            addRange(t3, e3) {
              this.addInterval(new S(t3, e3 + 1));
            }
            addInterval(t3) {
              if (null === this.intervals) this.intervals = [], this.intervals.push(t3.clone());
              else {
                for (let e3 = 0; e3 < this.intervals.length; e3++) {
                  const n2 = this.intervals[e3];
                  if (t3.stop < n2.start) return void this.intervals.splice(e3, 0, t3);
                  if (t3.stop === n2.start) return void (this.intervals[e3] = new S(t3.start, n2.stop));
                  if (t3.start <= n2.stop) return this.intervals[e3] = new S(Math.min(n2.start, t3.start), Math.max(n2.stop, t3.stop)), void this.reduce(e3);
                }
                this.intervals.push(t3.clone());
              }
            }
            addSet(t3) {
              return null !== t3.intervals && t3.intervals.forEach((t4) => this.addInterval(t4), this), this;
            }
            reduce(t3) {
              if (t3 < this.intervals.length - 1) {
                const e3 = this.intervals[t3], n2 = this.intervals[t3 + 1];
                e3.stop >= n2.stop ? (this.intervals.splice(t3 + 1, 1), this.reduce(t3)) : e3.stop >= n2.start && (this.intervals[t3] = new S(e3.start, n2.stop), this.intervals.splice(t3 + 1, 1));
              }
            }
            complement(t3, e3) {
              const n2 = new m();
              return n2.addInterval(new S(t3, e3 + 1)), null !== this.intervals && this.intervals.forEach((t4) => n2.removeRange(t4)), n2;
            }
            contains(t3) {
              if (null === this.intervals) return false;
              for (let e3 = 0; e3 < this.intervals.length; e3++) if (this.intervals[e3].contains(t3)) return true;
              return false;
            }
            removeRange(t3) {
              if (t3.start === t3.stop - 1) this.removeOne(t3.start);
              else if (null !== this.intervals) {
                let e3 = 0;
                for (let n2 = 0; n2 < this.intervals.length; n2++) {
                  const n3 = this.intervals[e3];
                  if (t3.stop <= n3.start) return;
                  if (t3.start > n3.start && t3.stop < n3.stop) {
                    this.intervals[e3] = new S(n3.start, t3.start);
                    const s2 = new S(t3.stop, n3.stop);
                    return void this.intervals.splice(e3, 0, s2);
                  }
                  t3.start <= n3.start && t3.stop >= n3.stop ? (this.intervals.splice(e3, 1), e3 -= 1) : t3.start < n3.stop ? this.intervals[e3] = new S(n3.start, t3.start) : t3.stop < n3.stop && (this.intervals[e3] = new S(t3.stop, n3.stop)), e3 += 1;
                }
              }
            }
            removeOne(t3) {
              if (null !== this.intervals) for (let e3 = 0; e3 < this.intervals.length; e3++) {
                const n2 = this.intervals[e3];
                if (t3 < n2.start) return;
                if (t3 === n2.start && t3 === n2.stop - 1) return void this.intervals.splice(e3, 1);
                if (t3 === n2.start) return void (this.intervals[e3] = new S(n2.start + 1, n2.stop));
                if (t3 === n2.stop - 1) return void (this.intervals[e3] = new S(n2.start, n2.stop - 1));
                if (t3 < n2.stop - 1) {
                  const s2 = new S(n2.start, t3);
                  return n2.start = t3 + 1, void this.intervals.splice(e3, 0, s2);
                }
              }
            }
            toString(t3, e3, n2) {
              return t3 = t3 || null, e3 = e3 || null, n2 = n2 || false, null === this.intervals ? "{}" : null !== t3 || null !== e3 ? this.toTokenString(t3, e3) : n2 ? this.toCharString() : this.toIndexString();
            }
            toCharString() {
              const e3 = [];
              for (let n2 = 0; n2 < this.intervals.length; n2++) {
                const s2 = this.intervals[n2];
                s2.stop === s2.start + 1 ? s2.start === t2.EOF ? e3.push("<EOF>") : e3.push("'" + String.fromCharCode(s2.start) + "'") : e3.push("'" + String.fromCharCode(s2.start) + "'..'" + String.fromCharCode(s2.stop - 1) + "'");
              }
              return e3.length > 1 ? "{" + e3.join(", ") + "}" : e3[0];
            }
            toIndexString() {
              const e3 = [];
              for (let n2 = 0; n2 < this.intervals.length; n2++) {
                const s2 = this.intervals[n2];
                s2.stop === s2.start + 1 ? s2.start === t2.EOF ? e3.push("<EOF>") : e3.push(s2.start.toString()) : e3.push(s2.start.toString() + ".." + (s2.stop - 1).toString());
              }
              return e3.length > 1 ? "{" + e3.join(", ") + "}" : e3[0];
            }
            toTokenString(t3, e3) {
              const n2 = [];
              for (let s2 = 0; s2 < this.intervals.length; s2++) {
                const i3 = this.intervals[s2];
                for (let s3 = i3.start; s3 < i3.stop; s3++) n2.push(this.elementName(t3, e3, s3));
              }
              return n2.length > 1 ? "{" + n2.join(", ") + "}" : n2[0];
            }
            elementName(e3, n2, s2) {
              return s2 === t2.EOF ? "<EOF>" : s2 === t2.EPSILON ? "<EPSILON>" : e3[s2] || n2[s2];
            }
            get length() {
              return this.intervals.map((t3) => t3.length).reduce((t3, e3) => t3 + e3);
            }
          }
          class E {
            constructor() {
              this.atn = null, this.stateNumber = E.INVALID_STATE_NUMBER, this.stateType = null, this.ruleIndex = 0, this.epsilonOnlyTransitions = false, this.transitions = [], this.nextTokenWithinRule = null;
            }
            toString() {
              return this.stateNumber;
            }
            equals(t3) {
              return t3 instanceof E && this.stateNumber === t3.stateNumber;
            }
            isNonGreedyExitState() {
              return false;
            }
            addTransition(t3, e3) {
              void 0 === e3 && (e3 = -1), 0 === this.transitions.length ? this.epsilonOnlyTransitions = t3.isEpsilon : this.epsilonOnlyTransitions !== t3.isEpsilon && (this.epsilonOnlyTransitions = false), -1 === e3 ? this.transitions.push(t3) : this.transitions.splice(e3, 1, t3);
            }
          }
          E.INVALID_TYPE = 0, E.BASIC = 1, E.RULE_START = 2, E.BLOCK_START = 3, E.PLUS_BLOCK_START = 4, E.STAR_BLOCK_START = 5, E.TOKEN_START = 6, E.RULE_STOP = 7, E.BLOCK_END = 8, E.STAR_LOOP_BACK = 9, E.STAR_LOOP_ENTRY = 10, E.PLUS_LOOP_BACK = 11, E.LOOP_END = 12, E.serializationNames = ["INVALID", "BASIC", "RULE_START", "BLOCK_START", "PLUS_BLOCK_START", "STAR_BLOCK_START", "TOKEN_START", "RULE_STOP", "BLOCK_END", "STAR_LOOP_BACK", "STAR_LOOP_ENTRY", "PLUS_LOOP_BACK", "LOOP_END"], E.INVALID_STATE_NUMBER = -1;
          class _ extends E {
            constructor() {
              return super(), this.stateType = E.RULE_STOP, this;
            }
          }
          class C {
            constructor(t3) {
              if (null == t3) throw "target cannot be null.";
              this.target = t3, this.isEpsilon = false, this.label = null;
            }
          }
          C.EPSILON = 1, C.RANGE = 2, C.RULE = 3, C.PREDICATE = 4, C.ATOM = 5, C.ACTION = 6, C.SET = 7, C.NOT_SET = 8, C.WILDCARD = 9, C.PRECEDENCE = 10, C.serializationNames = ["INVALID", "EPSILON", "RANGE", "RULE", "PREDICATE", "ATOM", "ACTION", "SET", "NOT_SET", "WILDCARD", "PRECEDENCE"], C.serializationTypes = { EpsilonTransition: C.EPSILON, RangeTransition: C.RANGE, RuleTransition: C.RULE, PredicateTransition: C.PREDICATE, AtomTransition: C.ATOM, ActionTransition: C.ACTION, SetTransition: C.SET, NotSetTransition: C.NOT_SET, WildcardTransition: C.WILDCARD, PrecedencePredicateTransition: C.PRECEDENCE };
          class A extends C {
            constructor(t3, e3, n2, s2) {
              super(t3), this.ruleIndex = e3, this.precedence = n2, this.followState = s2, this.serializationType = C.RULE, this.isEpsilon = true;
            }
            matches(t3, e3, n2) {
              return false;
            }
          }
          class N extends C {
            constructor(e3, n2) {
              super(e3), this.serializationType = C.SET, null != n2 ? this.label = n2 : (this.label = new m(), this.label.addOne(t2.INVALID_TYPE));
            }
            matches(t3, e3, n2) {
              return this.label.contains(t3);
            }
            toString() {
              return this.label.toString();
            }
          }
          class k extends N {
            constructor(t3, e3) {
              super(t3, e3), this.serializationType = C.NOT_SET;
            }
            matches(t3, e3, n2) {
              return t3 >= e3 && t3 <= n2 && !super.matches(t3, e3, n2);
            }
            toString() {
              return "~" + super.toString();
            }
          }
          class I extends C {
            constructor(t3) {
              super(t3), this.serializationType = C.WILDCARD;
            }
            matches(t3, e3, n2) {
              return t3 >= e3 && t3 <= n2;
            }
            toString() {
              return ".";
            }
          }
          class y extends C {
            constructor(t3) {
              super(t3);
            }
          }
          class L {
          }
          class O extends L {
          }
          class R extends O {
          }
          class v extends R {
            get ruleContext() {
              throw new Error("missing interface implementation");
            }
          }
          class w extends R {
          }
          class P extends w {
          }
          const b = { toStringTree: function(t3, e3, n2) {
            e3 = e3 || null, null !== (n2 = n2 || null) && (e3 = n2.ruleNames);
            let s2 = b.getNodeText(t3, e3);
            s2 = function(t4) {
              return t4 = t4.replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r");
            }(s2);
            const i3 = t3.getChildCount();
            if (0 === i3) return s2;
            let r3 = "(" + s2 + " ";
            i3 > 0 && (s2 = b.toStringTree(t3.getChild(0), e3), r3 = r3.concat(s2));
            for (let n3 = 1; n3 < i3; n3++) s2 = b.toStringTree(t3.getChild(n3), e3), r3 = r3.concat(" " + s2);
            return r3 = r3.concat(")"), r3;
          }, getNodeText: function(e3, n2, s2) {
            if (n2 = n2 || null, null !== (s2 = s2 || null) && (n2 = s2.ruleNames), null !== n2) {
              if (e3 instanceof v) {
                const t3 = e3.ruleContext.getAltNumber();
                return 0 != t3 ? n2[e3.ruleIndex] + ":" + t3 : n2[e3.ruleIndex];
              }
              if (e3 instanceof P) return e3.toString();
              if (e3 instanceof w && null !== e3.symbol) return e3.symbol.text;
            }
            const i3 = e3.getPayload();
            return i3 instanceof t2 ? i3.text : e3.getPayload().toString();
          }, getChildren: function(t3) {
            const e3 = [];
            for (let n2 = 0; n2 < t3.getChildCount(); n2++) e3.push(t3.getChild(n2));
            return e3;
          }, getAncestors: function(t3) {
            let e3 = [];
            for (t3 = t3.getParent(); null !== t3; ) e3 = [t3].concat(e3), t3 = t3.getParent();
            return e3;
          }, findAllTokenNodes: function(t3, e3) {
            return b.findAllNodes(t3, e3, true);
          }, findAllRuleNodes: function(t3, e3) {
            return b.findAllNodes(t3, e3, false);
          }, findAllNodes: function(t3, e3, n2) {
            const s2 = [];
            return b._findAllNodes(t3, e3, n2, s2), s2;
          }, _findAllNodes: function(t3, e3, n2, s2) {
            n2 && t3 instanceof w ? t3.symbol.type === e3 && s2.push(t3) : !n2 && t3 instanceof v && t3.ruleIndex === e3 && s2.push(t3);
            for (let i3 = 0; i3 < t3.getChildCount(); i3++) b._findAllNodes(t3.getChild(i3), e3, n2, s2);
          }, descendants: function(t3) {
            let e3 = [t3];
            for (let n2 = 0; n2 < t3.getChildCount(); n2++) e3 = e3.concat(b.descendants(t3.getChild(n2)));
            return e3;
          } }, D = b;
          class F extends v {
            constructor(t3, e3) {
              super(), this.parentCtx = t3 || null, this.invokingState = e3 || -1;
            }
            depth() {
              let t3 = 0, e3 = this;
              for (; null !== e3; ) e3 = e3.parentCtx, t3 += 1;
              return t3;
            }
            isEmpty() {
              return -1 === this.invokingState;
            }
            getSourceInterval() {
              return S.INVALID_INTERVAL;
            }
            get ruleContext() {
              return this;
            }
            getPayload() {
              return this;
            }
            getText() {
              return 0 === this.getChildCount() ? "" : this.children.map(function(t3) {
                return t3.getText();
              }).join("");
            }
            getAltNumber() {
              return 0;
            }
            setAltNumber(t3) {
            }
            getChild(t3) {
              return null;
            }
            getChildCount() {
              return 0;
            }
            accept(t3) {
              return t3.visitChildren(this);
            }
            toStringTree(t3, e3) {
              return D.toStringTree(this, t3, e3);
            }
            toString(t3, e3) {
              t3 = t3 || null, e3 = e3 || null;
              let n2 = this, s2 = "[";
              for (; null !== n2 && n2 !== e3; ) {
                if (null === t3) n2.isEmpty() || (s2 += n2.invokingState);
                else {
                  const e4 = n2.ruleIndex;
                  s2 += e4 >= 0 && e4 < t3.length ? t3[e4] : "" + e4;
                }
                null === n2.parentCtx || null === t3 && n2.parentCtx.isEmpty() || (s2 += " "), n2 = n2.parentCtx;
              }
              return s2 += "]", s2;
            }
          }
          class M {
            constructor(t3) {
              this.cachedHashCode = t3;
            }
            isEmpty() {
              return this === M.EMPTY;
            }
            hasEmptyPath() {
              return this.getReturnState(this.length - 1) === M.EMPTY_RETURN_STATE;
            }
            hashCode() {
              return this.cachedHashCode;
            }
            updateHashCode(t3) {
              t3.update(this.cachedHashCode);
            }
          }
          M.EMPTY = null, M.EMPTY_RETURN_STATE = 2147483647, M.globalNodeCount = 1, M.id = M.globalNodeCount, M.trace_atn_sim = false;
          class U extends M {
            constructor(t3, e3) {
              const n2 = new o();
              return n2.update(t3, e3), super(n2.finish()), this.parents = t3, this.returnStates = e3, this;
            }
            isEmpty() {
              return this.returnStates[0] === M.EMPTY_RETURN_STATE;
            }
            getParent(t3) {
              return this.parents[t3];
            }
            getReturnState(t3) {
              return this.returnStates[t3];
            }
            equals(t3) {
              return this === t3 || t3 instanceof U && this.hashCode() === t3.hashCode() && e2(this.returnStates, t3.returnStates) && e2(this.parents, t3.parents);
            }
            toString() {
              if (this.isEmpty()) return "[]";
              {
                let t3 = "[";
                for (let e3 = 0; e3 < this.returnStates.length; e3++) e3 > 0 && (t3 += ", "), this.returnStates[e3] !== M.EMPTY_RETURN_STATE ? (t3 += this.returnStates[e3], null !== this.parents[e3] ? t3 = t3 + " " + this.parents[e3] : t3 += "null") : t3 += "$";
                return t3 + "]";
              }
            }
            get length() {
              return this.returnStates.length;
            }
          }
          class B extends M {
            constructor(t3, e3) {
              let n2 = 0;
              const s2 = new o();
              null !== t3 ? s2.update(t3, e3) : s2.update(1), n2 = s2.finish(), super(n2), this.parentCtx = t3, this.returnState = e3;
            }
            getParent(t3) {
              return this.parentCtx;
            }
            getReturnState(t3) {
              return this.returnState;
            }
            equals(t3) {
              return this === t3 || t3 instanceof B && this.hashCode() === t3.hashCode() && this.returnState === t3.returnState && (null == this.parentCtx ? null == t3.parentCtx : this.parentCtx.equals(t3.parentCtx));
            }
            toString() {
              const t3 = null === this.parentCtx ? "" : this.parentCtx.toString();
              return 0 === t3.length ? this.returnState === M.EMPTY_RETURN_STATE ? "$" : "" + this.returnState : this.returnState + " " + t3;
            }
            get length() {
              return 1;
            }
            static create(t3, e3) {
              return e3 === M.EMPTY_RETURN_STATE && null === t3 ? M.EMPTY : new B(t3, e3);
            }
          }
          class V extends B {
            constructor() {
              super(null, M.EMPTY_RETURN_STATE);
            }
            isEmpty() {
              return true;
            }
            getParent(t3) {
              return null;
            }
            getReturnState(t3) {
              return this.returnState;
            }
            equals(t3) {
              return this === t3;
            }
            toString() {
              return "$";
            }
          }
          M.EMPTY = new V();
          class z {
            constructor(t3, e3) {
              this.buckets = new Array(16), this.threshold = Math.floor(12), this.itemCount = 0, this.hashFunction = t3 || a, this.equalsFunction = e3 || l;
            }
            set(t3, e3) {
              this._expand();
              const n2 = this._getSlot(t3);
              let s2 = this.buckets[n2];
              if (!s2) return s2 = [[t3, e3]], this.buckets[n2] = s2, this.itemCount++, e3;
              const i3 = s2.find((e4) => this.equalsFunction(e4[0], t3), this);
              if (i3) {
                const t4 = i3[1];
                return i3[1] = e3, t4;
              }
              return s2.push([t3, e3]), this.itemCount++, e3;
            }
            containsKey(t3) {
              const e3 = this._getBucket(t3);
              return !!e3 && !!e3.find((e4) => this.equalsFunction(e4[0], t3), this);
            }
            get(t3) {
              const e3 = this._getBucket(t3);
              if (!e3) return null;
              const n2 = e3.find((e4) => this.equalsFunction(e4[0], t3), this);
              return n2 ? n2[1] : null;
            }
            entries() {
              return this.buckets.filter((t3) => null != t3).flat(1);
            }
            getKeys() {
              return this.entries().map((t3) => t3[0]);
            }
            getValues() {
              return this.entries().map((t3) => t3[1]);
            }
            toString() {
              return "[" + this.entries().map((t3) => "{" + t3[0] + ":" + t3[1] + "}").join(", ") + "]";
            }
            get length() {
              return this.itemCount;
            }
            _getSlot(t3) {
              return this.hashFunction(t3) & this.buckets.length - 1;
            }
            _getBucket(t3) {
              return this.buckets[this._getSlot(t3)];
            }
            _expand() {
              if (this.itemCount <= this.threshold) return;
              const t3 = this.buckets, e3 = 2 * this.buckets.length;
              this.buckets = new Array(e3), this.threshold = Math.floor(0.75 * e3);
              for (const e4 of t3) if (e4) for (const t4 of e4) {
                const e5 = this._getSlot(t4[0]);
                let n2 = this.buckets[e5];
                n2 || (n2 = [], this.buckets[e5] = n2), n2.push(t4);
              }
            }
          }
          function q(t3, e3) {
            if (null == e3 && (e3 = F.EMPTY), null === e3.parentCtx || e3 === F.EMPTY) return M.EMPTY;
            const n2 = q(t3, e3.parentCtx), s2 = t3.states[e3.invokingState].transitions[0];
            return B.create(n2, s2.followState.stateNumber);
          }
          function H(t3, e3, n2) {
            if (t3.isEmpty()) return t3;
            let s2 = n2.get(t3) || null;
            if (null !== s2) return s2;
            if (s2 = e3.get(t3), null !== s2) return n2.set(t3, s2), s2;
            let i3 = false, r3 = [];
            for (let s3 = 0; s3 < r3.length; s3++) {
              const o3 = H(t3.getParent(s3), e3, n2);
              if (i3 || o3 !== t3.getParent(s3)) {
                if (!i3) {
                  r3 = [];
                  for (let e4 = 0; e4 < t3.length; e4++) r3[e4] = t3.getParent(e4);
                  i3 = true;
                }
                r3[s3] = o3;
              }
            }
            if (!i3) return e3.add(t3), n2.set(t3, t3), t3;
            let o2 = null;
            return o2 = 0 === r3.length ? M.EMPTY : 1 === r3.length ? B.create(r3[0], t3.getReturnState(0)) : new U(r3, t3.returnStates), e3.add(o2), n2.set(o2, o2), n2.set(t3, o2), o2;
          }
          function K(t3, e3, n2, s2) {
            if (t3 === e3) return t3;
            if (t3 instanceof B && e3 instanceof B) return function(t4, e4, n3, s3) {
              if (null !== s3) {
                let n4 = s3.get(t4, e4);
                if (null !== n4) return n4;
                if (n4 = s3.get(e4, t4), null !== n4) return n4;
              }
              const i3 = function(t5, e5, n4) {
                if (n4) {
                  if (t5 === M.EMPTY) return M.EMPTY;
                  if (e5 === M.EMPTY) return M.EMPTY;
                } else {
                  if (t5 === M.EMPTY && e5 === M.EMPTY) return M.EMPTY;
                  if (t5 === M.EMPTY) {
                    const t6 = [e5.returnState, M.EMPTY_RETURN_STATE], n5 = [e5.parentCtx, null];
                    return new U(n5, t6);
                  }
                  if (e5 === M.EMPTY) {
                    const e6 = [t5.returnState, M.EMPTY_RETURN_STATE], n5 = [t5.parentCtx, null];
                    return new U(n5, e6);
                  }
                }
                return null;
              }(t4, e4, n3);
              if (null !== i3) return null !== s3 && s3.set(t4, e4, i3), i3;
              if (t4.returnState === e4.returnState) {
                const i4 = K(t4.parentCtx, e4.parentCtx, n3, s3);
                if (i4 === t4.parentCtx) return t4;
                if (i4 === e4.parentCtx) return e4;
                const r3 = B.create(i4, t4.returnState);
                return null !== s3 && s3.set(t4, e4, r3), r3;
              }
              {
                let n4 = null;
                if ((t4 === e4 || null !== t4.parentCtx && t4.parentCtx === e4.parentCtx) && (n4 = t4.parentCtx), null !== n4) {
                  const i5 = [t4.returnState, e4.returnState];
                  t4.returnState > e4.returnState && (i5[0] = e4.returnState, i5[1] = t4.returnState);
                  const r4 = new U([n4, n4], i5);
                  return null !== s3 && s3.set(t4, e4, r4), r4;
                }
                const i4 = [t4.returnState, e4.returnState];
                let r3 = [t4.parentCtx, e4.parentCtx];
                t4.returnState > e4.returnState && (i4[0] = e4.returnState, i4[1] = t4.returnState, r3 = [e4.parentCtx, t4.parentCtx]);
                const o2 = new U(r3, i4);
                return null !== s3 && s3.set(t4, e4, o2), o2;
              }
            }(t3, e3, n2, s2);
            if (n2) {
              if (t3 instanceof V) return t3;
              if (e3 instanceof V) return e3;
            }
            return t3 instanceof B && (t3 = new U([t3.getParent()], [t3.returnState])), e3 instanceof B && (e3 = new U([e3.getParent()], [e3.returnState])), function(t4, e4, n3, s3) {
              if (null !== s3) {
                let n4 = s3.get(t4, e4);
                if (null !== n4) return M.trace_atn_sim && console.log("mergeArrays a=" + t4 + ",b=" + e4 + " -> previous"), n4;
                if (n4 = s3.get(e4, t4), null !== n4) return M.trace_atn_sim && console.log("mergeArrays a=" + t4 + ",b=" + e4 + " -> previous"), n4;
              }
              let i3 = 0, r3 = 0, o2 = 0, a2 = new Array(t4.returnStates.length + e4.returnStates.length).fill(0), l2 = new Array(t4.returnStates.length + e4.returnStates.length).fill(null);
              for (; i3 < t4.returnStates.length && r3 < e4.returnStates.length; ) {
                const h3 = t4.parents[i3], c2 = e4.parents[r3];
                if (t4.returnStates[i3] === e4.returnStates[r3]) {
                  const e5 = t4.returnStates[i3];
                  e5 === M.EMPTY_RETURN_STATE && null === h3 && null === c2 || null !== h3 && null !== c2 && h3 === c2 ? (l2[o2] = h3, a2[o2] = e5) : (l2[o2] = K(h3, c2, n3, s3), a2[o2] = e5), i3 += 1, r3 += 1;
                } else t4.returnStates[i3] < e4.returnStates[r3] ? (l2[o2] = h3, a2[o2] = t4.returnStates[i3], i3 += 1) : (l2[o2] = c2, a2[o2] = e4.returnStates[r3], r3 += 1);
                o2 += 1;
              }
              if (i3 < t4.returnStates.length) for (let e5 = i3; e5 < t4.returnStates.length; e5++) l2[o2] = t4.parents[e5], a2[o2] = t4.returnStates[e5], o2 += 1;
              else for (let t5 = r3; t5 < e4.returnStates.length; t5++) l2[o2] = e4.parents[t5], a2[o2] = e4.returnStates[t5], o2 += 1;
              if (o2 < l2.length) {
                if (1 === o2) {
                  const n4 = B.create(l2[0], a2[0]);
                  return null !== s3 && s3.set(t4, e4, n4), n4;
                }
                l2 = l2.slice(0, o2), a2 = a2.slice(0, o2);
              }
              const h2 = new U(l2, a2);
              return h2.equals(t4) ? (null !== s3 && s3.set(t4, e4, t4), M.trace_atn_sim && console.log("mergeArrays a=" + t4 + ",b=" + e4 + " -> a"), t4) : h2.equals(e4) ? (null !== s3 && s3.set(t4, e4, e4), M.trace_atn_sim && console.log("mergeArrays a=" + t4 + ",b=" + e4 + " -> b"), e4) : (function(t5) {
                const e5 = new z();
                for (let n4 = 0; n4 < t5.length; n4++) {
                  const s4 = t5[n4];
                  e5.containsKey(s4) || e5.set(s4, s4);
                }
                for (let n4 = 0; n4 < t5.length; n4++) t5[n4] = e5.get(t5[n4]);
              }(l2), null !== s3 && s3.set(t4, e4, h2), M.trace_atn_sim && console.log("mergeArrays a=" + t4 + ",b=" + e4 + " -> " + h2), h2);
            }(t3, e3, n2, s2);
          }
          class Y {
            constructor() {
              this.data = new Uint32Array(1);
            }
            set(t3) {
              Y._checkIndex(t3), this._resize(t3), this.data[t3 >>> 5] |= 1 << t3 % 32;
            }
            get(t3) {
              Y._checkIndex(t3);
              const e3 = t3 >>> 5;
              return !(e3 >= this.data.length || !(this.data[e3] & 1 << t3 % 32));
            }
            clear(t3) {
              Y._checkIndex(t3);
              const e3 = t3 >>> 5;
              e3 < this.data.length && (this.data[e3] &= ~(1 << t3));
            }
            or(t3) {
              const e3 = Math.min(this.data.length, t3.data.length);
              for (let n2 = 0; n2 < e3; ++n2) this.data[n2] |= t3.data[n2];
              if (this.data.length < t3.data.length) {
                this._resize((t3.data.length << 5) - 1);
                const n2 = t3.data.length;
                for (let s2 = e3; s2 < n2; ++s2) this.data[s2] = t3.data[s2];
              }
            }
            values() {
              const t3 = new Array(this.length);
              let e3 = 0;
              const n2 = this.data.length;
              for (let s2 = 0; s2 < n2; ++s2) {
                let n3 = this.data[s2];
                for (; 0 !== n3; ) {
                  const i3 = n3 & -n3;
                  t3[e3++] = (s2 << 5) + Y._bitCount(i3 - 1), n3 ^= i3;
                }
              }
              return t3;
            }
            minValue() {
              for (let t3 = 0; t3 < this.data.length; ++t3) {
                let e3 = this.data[t3];
                if (0 !== e3) {
                  let n2 = 0;
                  for (; !(1 & e3); ) n2++, e3 >>= 1;
                  return n2 + 32 * t3;
                }
              }
              return 0;
            }
            hashCode() {
              return o.hashStuff(this.values());
            }
            equals(t3) {
              return t3 instanceof Y && e2(this.data, t3.data);
            }
            toString() {
              return "{" + this.values().join(", ") + "}";
            }
            get length() {
              return this.data.map((t3) => Y._bitCount(t3)).reduce((t3, e3) => t3 + e3, 0);
            }
            _resize(t3) {
              const e3 = t3 + 32 >>> 5;
              if (e3 <= this.data.length) return;
              const n2 = new Uint32Array(e3);
              n2.set(this.data), n2.fill(0, this.data.length), this.data = n2;
            }
            static _checkIndex(t3) {
              if (t3 < 0) throw new RangeError("index cannot be negative");
            }
            static _bitCount(t3) {
              return t3 = (t3 = (858993459 & (t3 -= t3 >> 1 & 1431655765)) + (t3 >> 2 & 858993459)) + (t3 >> 4) & 252645135, t3 += t3 >> 8, 0 + (t3 += t3 >> 16) & 63;
            }
          }
          class G {
            constructor(t3) {
              this.atn = t3;
            }
            getDecisionLookahead(t3) {
              if (null === t3) return null;
              const e3 = t3.transitions.length, n2 = [];
              for (let s2 = 0; s2 < e3; s2++) {
                n2[s2] = new m();
                const e4 = new u(), i3 = false;
                this._LOOK(t3.transition(s2).target, null, M.EMPTY, n2[s2], e4, new Y(), i3, false), (0 === n2[s2].length || n2[s2].contains(G.HIT_PRED)) && (n2[s2] = null);
              }
              return n2;
            }
            LOOK(t3, e3, n2) {
              const s2 = new m(), i3 = null !== (n2 = n2 || null) ? q(t3.atn, n2) : null;
              return this._LOOK(t3, e3, i3, s2, new u(), new Y(), true, true), s2;
            }
            _LOOK(e3, n2, s2, i3, r3, o2, a2, l2) {
              const h2 = new T({ state: e3, alt: 0, context: s2 }, null);
              if (!r3.has(h2)) {
                if (r3.add(h2), e3 === n2) {
                  if (null === s2) return void i3.addOne(t2.EPSILON);
                  if (s2.isEmpty() && l2) return void i3.addOne(t2.EOF);
                }
                if (e3 instanceof _) {
                  if (null === s2) return void i3.addOne(t2.EPSILON);
                  if (s2.isEmpty() && l2) return void i3.addOne(t2.EOF);
                  if (s2 !== M.EMPTY) {
                    const t3 = o2.get(e3.ruleIndex);
                    try {
                      o2.clear(e3.ruleIndex);
                      for (let t4 = 0; t4 < s2.length; t4++) {
                        const e4 = this.atn.states[s2.getReturnState(t4)];
                        this._LOOK(e4, n2, s2.getParent(t4), i3, r3, o2, a2, l2);
                      }
                    } finally {
                      t3 && o2.set(e3.ruleIndex);
                    }
                    return;
                  }
                }
                for (let h3 = 0; h3 < e3.transitions.length; h3++) {
                  const c2 = e3.transitions[h3];
                  if (c2.constructor === A) {
                    if (o2.get(c2.target.ruleIndex)) continue;
                    const t3 = B.create(s2, c2.followState.stateNumber);
                    try {
                      o2.set(c2.target.ruleIndex), this._LOOK(c2.target, n2, t3, i3, r3, o2, a2, l2);
                    } finally {
                      o2.clear(c2.target.ruleIndex);
                    }
                  } else if (c2 instanceof y) a2 ? this._LOOK(c2.target, n2, s2, i3, r3, o2, a2, l2) : i3.addOne(G.HIT_PRED);
                  else if (c2.isEpsilon) this._LOOK(c2.target, n2, s2, i3, r3, o2, a2, l2);
                  else if (c2.constructor === I) i3.addRange(t2.MIN_USER_TOKEN_TYPE, this.atn.maxTokenType);
                  else {
                    let e4 = c2.label;
                    null !== e4 && (c2 instanceof k && (e4 = e4.complement(t2.MIN_USER_TOKEN_TYPE, this.atn.maxTokenType)), i3.addSet(e4));
                  }
                }
              }
            }
          }
          G.HIT_PRED = t2.INVALID_TYPE;
          class j {
            constructor(t3, e3) {
              this.grammarType = t3, this.maxTokenType = e3, this.states = [], this.decisionToState = [], this.ruleToStartState = [], this.ruleToStopState = null, this.modeNameToStartState = {}, this.ruleToTokenType = null, this.lexerActions = null, this.modeToStartState = [];
            }
            nextTokensInContext(t3, e3) {
              return new G(this).LOOK(t3, null, e3);
            }
            nextTokensNoContext(t3) {
              return null !== t3.nextTokenWithinRule || (t3.nextTokenWithinRule = this.nextTokensInContext(t3, null), t3.nextTokenWithinRule.readOnly = true), t3.nextTokenWithinRule;
            }
            nextTokens(t3, e3) {
              return void 0 === e3 ? this.nextTokensNoContext(t3) : this.nextTokensInContext(t3, e3);
            }
            addState(t3) {
              null !== t3 && (t3.atn = this, t3.stateNumber = this.states.length), this.states.push(t3);
            }
            removeState(t3) {
              this.states[t3.stateNumber] = null;
            }
            defineDecisionState(t3) {
              return this.decisionToState.push(t3), t3.decision = this.decisionToState.length - 1, t3.decision;
            }
            getDecisionState(t3) {
              return 0 === this.decisionToState.length ? null : this.decisionToState[t3];
            }
            getExpectedTokens(e3, n2) {
              if (e3 < 0 || e3 >= this.states.length) throw "Invalid state number.";
              const s2 = this.states[e3];
              let i3 = this.nextTokens(s2);
              if (!i3.contains(t2.EPSILON)) return i3;
              const r3 = new m();
              for (r3.addSet(i3), r3.removeOne(t2.EPSILON); null !== n2 && n2.invokingState >= 0 && i3.contains(t2.EPSILON); ) {
                const e4 = this.states[n2.invokingState].transitions[0];
                i3 = this.nextTokens(e4.followState), r3.addSet(i3), r3.removeOne(t2.EPSILON), n2 = n2.parentCtx;
              }
              return i3.contains(t2.EPSILON) && r3.addOne(t2.EOF), r3;
            }
          }
          j.INVALID_ALT_NUMBER = 0;
          class W extends E {
            constructor() {
              super(), this.stateType = E.BASIC;
            }
          }
          class $ extends E {
            constructor() {
              return super(), this.decision = -1, this.nonGreedy = false, this;
            }
          }
          class X extends $ {
            constructor() {
              return super(), this.endState = null, this;
            }
          }
          class J extends E {
            constructor() {
              return super(), this.stateType = E.BLOCK_END, this.startState = null, this;
            }
          }
          class Q extends E {
            constructor() {
              return super(), this.stateType = E.LOOP_END, this.loopBackState = null, this;
            }
          }
          class Z extends E {
            constructor() {
              return super(), this.stateType = E.RULE_START, this.stopState = null, this.isPrecedenceRule = false, this;
            }
          }
          class tt extends $ {
            constructor() {
              return super(), this.stateType = E.TOKEN_START, this;
            }
          }
          class et extends $ {
            constructor() {
              return super(), this.stateType = E.PLUS_LOOP_BACK, this;
            }
          }
          class nt extends E {
            constructor() {
              return super(), this.stateType = E.STAR_LOOP_BACK, this;
            }
          }
          class st extends $ {
            constructor() {
              return super(), this.stateType = E.STAR_LOOP_ENTRY, this.loopBackState = null, this.isPrecedenceDecision = null, this;
            }
          }
          class it extends X {
            constructor() {
              return super(), this.stateType = E.PLUS_BLOCK_START, this.loopBackState = null, this;
            }
          }
          class rt extends X {
            constructor() {
              return super(), this.stateType = E.STAR_BLOCK_START, this;
            }
          }
          class ot extends X {
            constructor() {
              return super(), this.stateType = E.BLOCK_START, this;
            }
          }
          class at extends C {
            constructor(t3, e3) {
              super(t3), this.label_ = e3, this.label = this.makeLabel(), this.serializationType = C.ATOM;
            }
            makeLabel() {
              const t3 = new m();
              return t3.addOne(this.label_), t3;
            }
            matches(t3, e3, n2) {
              return this.label_ === t3;
            }
            toString() {
              return this.label_;
            }
          }
          class lt extends C {
            constructor(t3, e3, n2) {
              super(t3), this.serializationType = C.RANGE, this.start = e3, this.stop = n2, this.label = this.makeLabel();
            }
            makeLabel() {
              const t3 = new m();
              return t3.addRange(this.start, this.stop), t3;
            }
            matches(t3, e3, n2) {
              return t3 >= this.start && t3 <= this.stop;
            }
            toString() {
              return "'" + String.fromCharCode(this.start) + "'..'" + String.fromCharCode(this.stop) + "'";
            }
          }
          class ht extends C {
            constructor(t3, e3, n2, s2) {
              super(t3), this.serializationType = C.ACTION, this.ruleIndex = e3, this.actionIndex = void 0 === n2 ? -1 : n2, this.isCtxDependent = void 0 !== s2 && s2, this.isEpsilon = true;
            }
            matches(t3, e3, n2) {
              return false;
            }
            toString() {
              return "action_" + this.ruleIndex + ":" + this.actionIndex;
            }
          }
          class ct extends C {
            constructor(t3, e3) {
              super(t3), this.serializationType = C.EPSILON, this.isEpsilon = true, this.outermostPrecedenceReturn = e3;
            }
            matches(t3, e3, n2) {
              return false;
            }
            toString() {
              return "epsilon";
            }
          }
          class ut extends d {
            constructor(t3, e3, n2) {
              super(), this.ruleIndex = void 0 === t3 ? -1 : t3, this.predIndex = void 0 === e3 ? -1 : e3, this.isCtxDependent = void 0 !== n2 && n2;
            }
            evaluate(t3, e3) {
              const n2 = this.isCtxDependent ? e3 : null;
              return t3.sempred(n2, this.ruleIndex, this.predIndex);
            }
            updateHashCode(t3) {
              t3.update(this.ruleIndex, this.predIndex, this.isCtxDependent);
            }
            equals(t3) {
              return this === t3 || t3 instanceof ut && this.ruleIndex === t3.ruleIndex && this.predIndex === t3.predIndex && this.isCtxDependent === t3.isCtxDependent;
            }
            toString() {
              return "{" + this.ruleIndex + ":" + this.predIndex + "}?";
            }
          }
          d.NONE = new ut();
          class dt extends y {
            constructor(t3, e3, n2, s2) {
              super(t3), this.serializationType = C.PREDICATE, this.ruleIndex = e3, this.predIndex = n2, this.isCtxDependent = s2, this.isEpsilon = true;
            }
            matches(t3, e3, n2) {
              return false;
            }
            getPredicate() {
              return new ut(this.ruleIndex, this.predIndex, this.isCtxDependent);
            }
            toString() {
              return "pred_" + this.ruleIndex + ":" + this.predIndex;
            }
          }
          class gt extends d {
            constructor(t3) {
              super(), this.precedence = void 0 === t3 ? 0 : t3;
            }
            evaluate(t3, e3) {
              return t3.precpred(e3, this.precedence);
            }
            evalPrecedence(t3, e3) {
              return t3.precpred(e3, this.precedence) ? d.NONE : null;
            }
            compareTo(t3) {
              return this.precedence - t3.precedence;
            }
            updateHashCode(t3) {
              t3.update(this.precedence);
            }
            equals(t3) {
              return this === t3 || t3 instanceof gt && this.precedence === t3.precedence;
            }
            toString() {
              return "{" + this.precedence + ">=prec}?";
            }
          }
          d.PrecedencePredicate = gt;
          class pt extends y {
            constructor(t3, e3) {
              super(t3), this.serializationType = C.PRECEDENCE, this.precedence = e3, this.isEpsilon = true;
            }
            matches(t3, e3, n2) {
              return false;
            }
            getPredicate() {
              return new gt(this.precedence);
            }
            toString() {
              return this.precedence + " >= _p";
            }
          }
          class ft {
            constructor(t3) {
              void 0 === t3 && (t3 = null), this.readOnly = false, this.verifyATN = null === t3 || t3.verifyATN, this.generateRuleBypassTransitions = null !== t3 && t3.generateRuleBypassTransitions;
            }
          }
          ft.defaultOptions = new ft(), ft.defaultOptions.readOnly = true;
          class xt {
            constructor(t3) {
              this.actionType = t3, this.isPositionDependent = false;
            }
            hashCode() {
              const t3 = new o();
              return this.updateHashCode(t3), t3.finish();
            }
            updateHashCode(t3) {
              t3.update(this.actionType);
            }
            equals(t3) {
              return this === t3;
            }
          }
          class Tt extends xt {
            constructor() {
              super(6);
            }
            execute(t3) {
              t3.skip();
            }
            toString() {
              return "skip";
            }
          }
          Tt.INSTANCE = new Tt();
          class St extends xt {
            constructor(t3) {
              super(0), this.channel = t3;
            }
            execute(t3) {
              t3._channel = this.channel;
            }
            updateHashCode(t3) {
              t3.update(this.actionType, this.channel);
            }
            equals(t3) {
              return this === t3 || t3 instanceof St && this.channel === t3.channel;
            }
            toString() {
              return "channel(" + this.channel + ")";
            }
          }
          class mt extends xt {
            constructor(t3, e3) {
              super(1), this.ruleIndex = t3, this.actionIndex = e3, this.isPositionDependent = true;
            }
            execute(t3) {
              t3.action(null, this.ruleIndex, this.actionIndex);
            }
            updateHashCode(t3) {
              t3.update(this.actionType, this.ruleIndex, this.actionIndex);
            }
            equals(t3) {
              return this === t3 || t3 instanceof mt && this.ruleIndex === t3.ruleIndex && this.actionIndex === t3.actionIndex;
            }
          }
          class Et extends xt {
            constructor() {
              super(3);
            }
            execute(t3) {
              t3.more();
            }
            toString() {
              return "more";
            }
          }
          Et.INSTANCE = new Et();
          class _t extends xt {
            constructor(t3) {
              super(7), this.type = t3;
            }
            execute(t3) {
              t3.type = this.type;
            }
            updateHashCode(t3) {
              t3.update(this.actionType, this.type);
            }
            equals(t3) {
              return this === t3 || t3 instanceof _t && this.type === t3.type;
            }
            toString() {
              return "type(" + this.type + ")";
            }
          }
          class Ct extends xt {
            constructor(t3) {
              super(5), this.mode = t3;
            }
            execute(t3) {
              t3.pushMode(this.mode);
            }
            updateHashCode(t3) {
              t3.update(this.actionType, this.mode);
            }
            equals(t3) {
              return this === t3 || t3 instanceof Ct && this.mode === t3.mode;
            }
            toString() {
              return "pushMode(" + this.mode + ")";
            }
          }
          class At extends xt {
            constructor() {
              super(4);
            }
            execute(t3) {
              t3.popMode();
            }
            toString() {
              return "popMode";
            }
          }
          At.INSTANCE = new At();
          class Nt extends xt {
            constructor(t3) {
              super(2), this.mode = t3;
            }
            execute(t3) {
              t3.setMode(this.mode);
            }
            updateHashCode(t3) {
              t3.update(this.actionType, this.mode);
            }
            equals(t3) {
              return this === t3 || t3 instanceof Nt && this.mode === t3.mode;
            }
            toString() {
              return "mode(" + this.mode + ")";
            }
          }
          function kt(t3, e3) {
            const n2 = [];
            return n2[t3 - 1] = e3, n2.map(function(t4) {
              return e3;
            });
          }
          class It {
            constructor(t3) {
              null == t3 && (t3 = ft.defaultOptions), this.deserializationOptions = t3, this.stateFactories = null, this.actionFactories = null;
            }
            deserialize(t3) {
              const e3 = this.reset(t3);
              this.checkVersion(e3), e3 && this.skipUUID();
              const n2 = this.readATN();
              this.readStates(n2, e3), this.readRules(n2, e3), this.readModes(n2);
              const s2 = [];
              return this.readSets(n2, s2, this.readInt.bind(this)), e3 && this.readSets(n2, s2, this.readInt32.bind(this)), this.readEdges(n2, s2), this.readDecisions(n2), this.readLexerActions(n2, e3), this.markPrecedenceDecisions(n2), this.verifyATN(n2), this.deserializationOptions.generateRuleBypassTransitions && 1 === n2.grammarType && (this.generateRuleBypassTransitions(n2), this.verifyATN(n2)), n2;
            }
            reset(t3) {
              if (3 === (t3.charCodeAt ? t3.charCodeAt(0) : t3[0])) {
                const e3 = function(t4) {
                  const e4 = t4.charCodeAt(0);
                  return e4 > 1 ? e4 - 2 : e4 + 65534;
                }, n2 = t3.split("").map(e3);
                return n2[0] = t3.charCodeAt(0), this.data = n2, this.pos = 0, true;
              }
              return this.data = t3, this.pos = 0, false;
            }
            skipUUID() {
              let t3 = 0;
              for (; t3++ < 8; ) this.readInt();
            }
            checkVersion(t3) {
              const e3 = this.readInt();
              if (!t3 && 4 !== e3) throw "Could not deserialize ATN with version " + e3 + " (expected 4).";
            }
            readATN() {
              const t3 = this.readInt(), e3 = this.readInt();
              return new j(t3, e3);
            }
            readStates(t3, e3) {
              let n2, s2, i3;
              const r3 = [], o2 = [], a2 = this.readInt();
              for (let n3 = 0; n3 < a2; n3++) {
                const n4 = this.readInt();
                if (n4 === E.INVALID_TYPE) {
                  t3.addState(null);
                  continue;
                }
                let s3 = this.readInt();
                e3 && 65535 === s3 && (s3 = -1);
                const i4 = this.stateFactory(n4, s3);
                if (n4 === E.LOOP_END) {
                  const t4 = this.readInt();
                  r3.push([i4, t4]);
                } else if (i4 instanceof X) {
                  const t4 = this.readInt();
                  o2.push([i4, t4]);
                }
                t3.addState(i4);
              }
              for (n2 = 0; n2 < r3.length; n2++) s2 = r3[n2], s2[0].loopBackState = t3.states[s2[1]];
              for (n2 = 0; n2 < o2.length; n2++) s2 = o2[n2], s2[0].endState = t3.states[s2[1]];
              let l2 = this.readInt();
              for (n2 = 0; n2 < l2; n2++) i3 = this.readInt(), t3.states[i3].nonGreedy = true;
              let h2 = this.readInt();
              for (n2 = 0; n2 < h2; n2++) i3 = this.readInt(), t3.states[i3].isPrecedenceRule = true;
            }
            readRules(e3, n2) {
              let s2;
              const i3 = this.readInt();
              for (0 === e3.grammarType && (e3.ruleToTokenType = kt(i3, 0)), e3.ruleToStartState = kt(i3, 0), s2 = 0; s2 < i3; s2++) {
                const i4 = this.readInt();
                if (e3.ruleToStartState[s2] = e3.states[i4], 0 === e3.grammarType) {
                  let i5 = this.readInt();
                  n2 && 65535 === i5 && (i5 = t2.EOF), e3.ruleToTokenType[s2] = i5;
                }
              }
              for (e3.ruleToStopState = kt(i3, 0), s2 = 0; s2 < e3.states.length; s2++) {
                const t3 = e3.states[s2];
                t3 instanceof _ && (e3.ruleToStopState[t3.ruleIndex] = t3, e3.ruleToStartState[t3.ruleIndex].stopState = t3);
              }
            }
            readModes(t3) {
              const e3 = this.readInt();
              for (let n2 = 0; n2 < e3; n2++) {
                let e4 = this.readInt();
                t3.modeToStartState.push(t3.states[e4]);
              }
            }
            readSets(t3, e3, n2) {
              const s2 = this.readInt();
              for (let t4 = 0; t4 < s2; t4++) {
                const t5 = new m();
                e3.push(t5);
                const s3 = this.readInt();
                0 !== this.readInt() && t5.addOne(-1);
                for (let e4 = 0; e4 < s3; e4++) {
                  const e5 = n2(), s4 = n2();
                  t5.addRange(e5, s4);
                }
              }
            }
            readEdges(t3, e3) {
              let n2, s2, i3, r3, o2;
              const a2 = this.readInt();
              for (n2 = 0; n2 < a2; n2++) {
                const n3 = this.readInt(), s3 = this.readInt(), i4 = this.readInt(), o3 = this.readInt(), a3 = this.readInt(), l2 = this.readInt();
                r3 = this.edgeFactory(t3, i4, n3, s3, o3, a3, l2, e3), t3.states[n3].addTransition(r3);
              }
              for (n2 = 0; n2 < t3.states.length; n2++) for (i3 = t3.states[n2], s2 = 0; s2 < i3.transitions.length; s2++) {
                const e4 = i3.transitions[s2];
                if (!(e4 instanceof A)) continue;
                let n3 = -1;
                t3.ruleToStartState[e4.target.ruleIndex].isPrecedenceRule && 0 === e4.precedence && (n3 = e4.target.ruleIndex), r3 = new ct(e4.followState, n3), t3.ruleToStopState[e4.target.ruleIndex].addTransition(r3);
              }
              for (n2 = 0; n2 < t3.states.length; n2++) {
                if (i3 = t3.states[n2], i3 instanceof X) {
                  if (null === i3.endState) throw "IllegalState";
                  if (null !== i3.endState.startState) throw "IllegalState";
                  i3.endState.startState = i3;
                }
                if (i3 instanceof et) for (s2 = 0; s2 < i3.transitions.length; s2++) o2 = i3.transitions[s2].target, o2 instanceof it && (o2.loopBackState = i3);
                else if (i3 instanceof nt) for (s2 = 0; s2 < i3.transitions.length; s2++) o2 = i3.transitions[s2].target, o2 instanceof st && (o2.loopBackState = i3);
              }
            }
            readDecisions(t3) {
              const e3 = this.readInt();
              for (let n2 = 0; n2 < e3; n2++) {
                const e4 = this.readInt(), s2 = t3.states[e4];
                t3.decisionToState.push(s2), s2.decision = n2;
              }
            }
            readLexerActions(t3, e3) {
              if (0 === t3.grammarType) {
                const n2 = this.readInt();
                t3.lexerActions = kt(n2, null);
                for (let s2 = 0; s2 < n2; s2++) {
                  const n3 = this.readInt();
                  let i3 = this.readInt();
                  e3 && 65535 === i3 && (i3 = -1);
                  let r3 = this.readInt();
                  e3 && 65535 === r3 && (r3 = -1), t3.lexerActions[s2] = this.lexerActionFactory(n3, i3, r3);
                }
              }
            }
            generateRuleBypassTransitions(t3) {
              let e3;
              const n2 = t3.ruleToStartState.length;
              for (e3 = 0; e3 < n2; e3++) t3.ruleToTokenType[e3] = t3.maxTokenType + e3 + 1;
              for (e3 = 0; e3 < n2; e3++) this.generateRuleBypassTransition(t3, e3);
            }
            generateRuleBypassTransition(t3, e3) {
              let n2, s2;
              const i3 = new ot();
              i3.ruleIndex = e3, t3.addState(i3);
              const r3 = new J();
              r3.ruleIndex = e3, t3.addState(r3), i3.endState = r3, t3.defineDecisionState(i3), r3.startState = i3;
              let o2 = null, a2 = null;
              if (t3.ruleToStartState[e3].isPrecedenceRule) {
                for (a2 = null, n2 = 0; n2 < t3.states.length; n2++) if (s2 = t3.states[n2], this.stateIsEndStateFor(s2, e3)) {
                  a2 = s2, o2 = s2.loopBackState.transitions[0];
                  break;
                }
                if (null === o2) throw "Couldn't identify final state of the precedence rule prefix section.";
              } else a2 = t3.ruleToStopState[e3];
              for (n2 = 0; n2 < t3.states.length; n2++) {
                s2 = t3.states[n2];
                for (let t4 = 0; t4 < s2.transitions.length; t4++) {
                  const e4 = s2.transitions[t4];
                  e4 !== o2 && e4.target === a2 && (e4.target = r3);
                }
              }
              const l2 = t3.ruleToStartState[e3], h2 = l2.transitions.length;
              for (; h2 > 0; ) i3.addTransition(l2.transitions[h2 - 1]), l2.transitions = l2.transitions.slice(-1);
              t3.ruleToStartState[e3].addTransition(new ct(i3)), r3.addTransition(new ct(a2));
              const c2 = new W();
              t3.addState(c2), c2.addTransition(new at(r3, t3.ruleToTokenType[e3])), i3.addTransition(new ct(c2));
            }
            stateIsEndStateFor(t3, e3) {
              if (t3.ruleIndex !== e3) return null;
              if (!(t3 instanceof st)) return null;
              const n2 = t3.transitions[t3.transitions.length - 1].target;
              return n2 instanceof Q && n2.epsilonOnlyTransitions && n2.transitions[0].target instanceof _ ? t3 : null;
            }
            markPrecedenceDecisions(t3) {
              for (let e3 = 0; e3 < t3.states.length; e3++) {
                const n2 = t3.states[e3];
                if (n2 instanceof st && t3.ruleToStartState[n2.ruleIndex].isPrecedenceRule) {
                  const t4 = n2.transitions[n2.transitions.length - 1].target;
                  t4 instanceof Q && t4.epsilonOnlyTransitions && t4.transitions[0].target instanceof _ && (n2.isPrecedenceDecision = true);
                }
              }
            }
            verifyATN(t3) {
              if (this.deserializationOptions.verifyATN) for (let e3 = 0; e3 < t3.states.length; e3++) {
                const n2 = t3.states[e3];
                if (null !== n2) if (this.checkCondition(n2.epsilonOnlyTransitions || n2.transitions.length <= 1), n2 instanceof it) this.checkCondition(null !== n2.loopBackState);
                else if (n2 instanceof st) if (this.checkCondition(null !== n2.loopBackState), this.checkCondition(2 === n2.transitions.length), n2.transitions[0].target instanceof rt) this.checkCondition(n2.transitions[1].target instanceof Q), this.checkCondition(!n2.nonGreedy);
                else {
                  if (!(n2.transitions[0].target instanceof Q)) throw "IllegalState";
                  this.checkCondition(n2.transitions[1].target instanceof rt), this.checkCondition(n2.nonGreedy);
                }
                else n2 instanceof nt ? (this.checkCondition(1 === n2.transitions.length), this.checkCondition(n2.transitions[0].target instanceof st)) : n2 instanceof Q ? this.checkCondition(null !== n2.loopBackState) : n2 instanceof Z ? this.checkCondition(null !== n2.stopState) : n2 instanceof X ? this.checkCondition(null !== n2.endState) : n2 instanceof J ? this.checkCondition(null !== n2.startState) : n2 instanceof $ ? this.checkCondition(n2.transitions.length <= 1 || n2.decision >= 0) : this.checkCondition(n2.transitions.length <= 1 || n2 instanceof _);
              }
            }
            checkCondition(t3, e3) {
              if (!t3) throw null == e3 && (e3 = "IllegalState"), e3;
            }
            readInt() {
              return this.data[this.pos++];
            }
            readInt32() {
              return this.readInt() | this.readInt() << 16;
            }
            edgeFactory(e3, n2, s2, i3, r3, o2, a2, l2) {
              const h2 = e3.states[i3];
              switch (n2) {
                case C.EPSILON:
                  return new ct(h2);
                case C.RANGE:
                  return new lt(h2, 0 !== a2 ? t2.EOF : r3, o2);
                case C.RULE:
                  return new A(e3.states[r3], o2, a2, h2);
                case C.PREDICATE:
                  return new dt(h2, r3, o2, 0 !== a2);
                case C.PRECEDENCE:
                  return new pt(h2, r3);
                case C.ATOM:
                  return new at(h2, 0 !== a2 ? t2.EOF : r3);
                case C.ACTION:
                  return new ht(h2, r3, o2, 0 !== a2);
                case C.SET:
                  return new N(h2, l2[r3]);
                case C.NOT_SET:
                  return new k(h2, l2[r3]);
                case C.WILDCARD:
                  return new I(h2);
                default:
                  throw "The specified transition type: " + n2 + " is not valid.";
              }
            }
            stateFactory(t3, e3) {
              if (null === this.stateFactories) {
                const t4 = [];
                t4[E.INVALID_TYPE] = null, t4[E.BASIC] = () => new W(), t4[E.RULE_START] = () => new Z(), t4[E.BLOCK_START] = () => new ot(), t4[E.PLUS_BLOCK_START] = () => new it(), t4[E.STAR_BLOCK_START] = () => new rt(), t4[E.TOKEN_START] = () => new tt(), t4[E.RULE_STOP] = () => new _(), t4[E.BLOCK_END] = () => new J(), t4[E.STAR_LOOP_BACK] = () => new nt(), t4[E.STAR_LOOP_ENTRY] = () => new st(), t4[E.PLUS_LOOP_BACK] = () => new et(), t4[E.LOOP_END] = () => new Q(), this.stateFactories = t4;
              }
              if (t3 > this.stateFactories.length || null === this.stateFactories[t3]) throw "The specified state type " + t3 + " is not valid.";
              {
                const n2 = this.stateFactories[t3]();
                if (null !== n2) return n2.ruleIndex = e3, n2;
              }
            }
            lexerActionFactory(t3, e3, n2) {
              if (null === this.actionFactories) {
                const t4 = [];
                t4[0] = (t5, e4) => new St(t5), t4[1] = (t5, e4) => new mt(t5, e4), t4[2] = (t5, e4) => new Nt(t5), t4[3] = (t5, e4) => Et.INSTANCE, t4[4] = (t5, e4) => At.INSTANCE, t4[5] = (t5, e4) => new Ct(t5), t4[6] = (t5, e4) => Tt.INSTANCE, t4[7] = (t5, e4) => new _t(t5), this.actionFactories = t4;
              }
              if (t3 > this.actionFactories.length || null === this.actionFactories[t3]) throw "The specified lexer action type " + t3 + " is not valid.";
              return this.actionFactories[t3](e3, n2);
            }
          }
          class yt {
            syntaxError(t3, e3, n2, s2, i3, r3) {
            }
            reportAmbiguity(t3, e3, n2, s2, i3, r3, o2) {
            }
            reportAttemptingFullContext(t3, e3, n2, s2, i3, r3) {
            }
            reportContextSensitivity(t3, e3, n2, s2, i3, r3) {
            }
          }
          class Lt extends yt {
            constructor() {
              super();
            }
            syntaxError(t3, e3, n2, s2, i3, r3) {
              console.error("line " + n2 + ":" + s2 + " " + i3);
            }
          }
          Lt.INSTANCE = new Lt();
          class Ot extends yt {
            constructor(t3) {
              if (super(), null === t3) throw "delegates";
              return this.delegates = t3, this;
            }
            syntaxError(t3, e3, n2, s2, i3, r3) {
              this.delegates.map((o2) => o2.syntaxError(t3, e3, n2, s2, i3, r3));
            }
            reportAmbiguity(t3, e3, n2, s2, i3, r3, o2) {
              this.delegates.map((a2) => a2.reportAmbiguity(t3, e3, n2, s2, i3, r3, o2));
            }
            reportAttemptingFullContext(t3, e3, n2, s2, i3, r3) {
              this.delegates.map((o2) => o2.reportAttemptingFullContext(t3, e3, n2, s2, i3, r3));
            }
            reportContextSensitivity(t3, e3, n2, s2, i3, r3) {
              this.delegates.map((o2) => o2.reportContextSensitivity(t3, e3, n2, s2, i3, r3));
            }
          }
          class Rt {
            constructor() {
              this._listeners = [Lt.INSTANCE], this._interp = null, this._stateNumber = -1;
            }
            checkVersion(t3) {
              const e3 = "4.13.2";
              e3 !== t3 && console.log("ANTLR runtime and generated code versions disagree: " + e3 + "!=" + t3);
            }
            addErrorListener(t3) {
              this._listeners.push(t3);
            }
            removeErrorListeners() {
              this._listeners = [];
            }
            getLiteralNames() {
              return Object.getPrototypeOf(this).constructor.literalNames || [];
            }
            getSymbolicNames() {
              return Object.getPrototypeOf(this).constructor.symbolicNames || [];
            }
            getTokenNames() {
              if (!this.tokenNames) {
                const t3 = this.getLiteralNames(), e3 = this.getSymbolicNames(), n2 = t3.length > e3.length ? t3.length : e3.length;
                this.tokenNames = [];
                for (let s2 = 0; s2 < n2; s2++) this.tokenNames[s2] = t3[s2] || e3[s2] || "<INVALID";
              }
              return this.tokenNames;
            }
            getTokenTypeMap() {
              const e3 = this.getTokenNames();
              if (null === e3) throw "The current recognizer does not provide a list of token names.";
              let n2 = this.tokenTypeMapCache[e3];
              return void 0 === n2 && (n2 = e3.reduce(function(t3, e4, n3) {
                t3[e4] = n3;
              }), n2.EOF = t2.EOF, this.tokenTypeMapCache[e3] = n2), n2;
            }
            getRuleIndexMap() {
              const t3 = this.ruleNames;
              if (null === t3) throw "The current recognizer does not provide a list of rule names.";
              let e3 = this.ruleIndexMapCache[t3];
              return void 0 === e3 && (e3 = t3.reduce(function(t4, e4, n2) {
                t4[e4] = n2;
              }), this.ruleIndexMapCache[t3] = e3), e3;
            }
            getTokenType(e3) {
              const n2 = this.getTokenTypeMap()[e3];
              return void 0 !== n2 ? n2 : t2.INVALID_TYPE;
            }
            getErrorHeader(t3) {
              return "line " + t3.getOffendingToken().line + ":" + t3.getOffendingToken().column;
            }
            getTokenErrorDisplay(e3) {
              if (null === e3) return "<no token>";
              let n2 = e3.text;
              return null === n2 && (n2 = e3.type === t2.EOF ? "<EOF>" : "<" + e3.type + ">"), n2 = n2.replace("\n", "\\n").replace("\r", "\\r").replace("	", "\\t"), "'" + n2 + "'";
            }
            getErrorListenerDispatch() {
              return console.warn("Calling deprecated method in Recognizer class: getErrorListenerDispatch()"), this.getErrorListener();
            }
            getErrorListener() {
              return new Ot(this._listeners);
            }
            sempred(t3, e3, n2) {
              return true;
            }
            precpred(t3, e3) {
              return true;
            }
            get atn() {
              return this._interp.atn;
            }
            get state() {
              return this._stateNumber;
            }
            set state(t3) {
              this._stateNumber = t3;
            }
          }
          Rt.tokenTypeMapCache = {}, Rt.ruleIndexMapCache = {};
          class vt extends t2 {
            constructor(e3, n2, s2, i3, r3) {
              super(), this.source = void 0 !== e3 ? e3 : vt.EMPTY_SOURCE, this.type = void 0 !== n2 ? n2 : null, this.channel = void 0 !== s2 ? s2 : t2.DEFAULT_CHANNEL, this.start = void 0 !== i3 ? i3 : -1, this.stop = void 0 !== r3 ? r3 : -1, this.tokenIndex = -1, null !== this.source[0] ? (this.line = e3[0].line, this.column = e3[0].column) : this.column = -1;
            }
            clone() {
              const t3 = new vt(this.source, this.type, this.channel, this.start, this.stop);
              return t3.tokenIndex = this.tokenIndex, t3.line = this.line, t3.column = this.column, t3.text = this.text, t3;
            }
            cloneWithType(e3) {
              const n2 = new vt(this.source, e3, this.channel, this.start, this.stop);
              return n2.tokenIndex = this.tokenIndex, n2.line = this.line, n2.column = this.column, e3 === t2.EOF && (n2.text = ""), n2;
            }
            toString() {
              let t3 = this.text;
              return t3 = null !== t3 ? t3.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t") : "<no text>", "[@" + this.tokenIndex + "," + this.start + ":" + this.stop + "='" + t3 + "',<" + this.type + ">" + (this.channel > 0 ? ",channel=" + this.channel : "") + "," + this.line + ":" + this.column + "]";
            }
            get text() {
              if (null !== this._text) return this._text;
              const t3 = this.getInputStream();
              if (null === t3) return null;
              const e3 = t3.size;
              return this.start < e3 && this.stop < e3 ? t3.getText(this.start, this.stop) : "<EOF>";
            }
            set text(t3) {
              this._text = t3;
            }
          }
          vt.EMPTY_SOURCE = [null, null];
          class wt {
          }
          class Pt extends wt {
            constructor(t3) {
              super(), this.copyText = void 0 !== t3 && t3;
            }
            create(t3, e3, n2, s2, i3, r3, o2, a2) {
              const l2 = new vt(t3, e3, s2, i3, r3);
              return l2.line = o2, l2.column = a2, null !== n2 ? l2.text = n2 : this.copyText && null !== t3[1] && (l2.text = t3[1].getText(i3, r3)), l2;
            }
            createThin(t3, e3) {
              const n2 = new vt(null, t3);
              return n2.text = e3, n2;
            }
          }
          Pt.DEFAULT = new Pt();
          class bt extends Error {
            constructor(t3) {
              super(t3.message), Error.captureStackTrace && Error.captureStackTrace(this, bt), this.message = t3.message, this.recognizer = t3.recognizer, this.input = t3.input, this.ctx = t3.ctx, this.offendingToken = null, this.offendingState = -1, null !== this.recognizer && (this.offendingState = this.recognizer.state);
            }
            getExpectedTokens() {
              return null !== this.recognizer ? this.recognizer.atn.getExpectedTokens(this.offendingState, this.ctx) : null;
            }
            toString() {
              return this.message;
            }
          }
          class Dt extends bt {
            constructor(t3, e3, n2, s2) {
              super({ message: "", recognizer: t3, input: e3, ctx: null }), this.startIndex = n2, this.deadEndConfigs = s2;
            }
            toString() {
              let t3 = "";
              return this.startIndex >= 0 && this.startIndex < this.input.size && (t3 = this.input.getText(new S(this.startIndex, this.startIndex))), "LexerNoViableAltException" + t3;
            }
          }
          class Ft extends Rt {
            constructor(e3) {
              super(), this._input = e3, this._factory = Pt.DEFAULT, this._tokenFactorySourcePair = [this, e3], this._interp = null, this._token = null, this._tokenStartCharIndex = -1, this._tokenStartLine = -1, this._tokenStartColumn = -1, this._hitEOF = false, this._channel = t2.DEFAULT_CHANNEL, this._type = t2.INVALID_TYPE, this._modeStack = [], this._mode = Ft.DEFAULT_MODE, this._text = null;
            }
            reset() {
              null !== this._input && this._input.seek(0), this._token = null, this._type = t2.INVALID_TYPE, this._channel = t2.DEFAULT_CHANNEL, this._tokenStartCharIndex = -1, this._tokenStartColumn = -1, this._tokenStartLine = -1, this._text = null, this._hitEOF = false, this._mode = Ft.DEFAULT_MODE, this._modeStack = [], this._interp.reset();
            }
            nextToken() {
              if (null === this._input) throw "nextToken requires a non-null input stream.";
              const e3 = this._input.mark();
              try {
                for (; ; ) {
                  if (this._hitEOF) return this.emitEOF(), this._token;
                  this._token = null, this._channel = t2.DEFAULT_CHANNEL, this._tokenStartCharIndex = this._input.index, this._tokenStartColumn = this._interp.column, this._tokenStartLine = this._interp.line, this._text = null;
                  let e4 = false;
                  for (; ; ) {
                    this._type = t2.INVALID_TYPE;
                    let n2 = Ft.SKIP;
                    try {
                      n2 = this._interp.match(this._input, this._mode);
                    } catch (t3) {
                      if (!(t3 instanceof bt)) throw console.log(t3.stack), t3;
                      this.notifyListeners(t3), this.recover(t3);
                    }
                    if (this._input.LA(1) === t2.EOF && (this._hitEOF = true), this._type === t2.INVALID_TYPE && (this._type = n2), this._type === Ft.SKIP) {
                      e4 = true;
                      break;
                    }
                    if (this._type !== Ft.MORE) break;
                  }
                  if (!e4) return null === this._token && this.emit(), this._token;
                }
              } finally {
                this._input.release(e3);
              }
            }
            skip() {
              this._type = Ft.SKIP;
            }
            more() {
              this._type = Ft.MORE;
            }
            mode(t3) {
              console.warn("Calling deprecated method in Lexer class: mode(...)"), this.setMode(t3);
            }
            setMode(t3) {
              this._mode = t3;
            }
            getMode() {
              return this._mode;
            }
            getModeStack() {
              return this._modeStack;
            }
            pushMode(t3) {
              this._interp.debug && console.log("pushMode " + t3), this._modeStack.push(this._mode), this.setMode(t3);
            }
            popMode() {
              if (0 === this._modeStack.length) throw "Empty Stack";
              return this._interp.debug && console.log("popMode back to " + this._modeStack.slice(0, -1)), this.setMode(this._modeStack.pop()), this._mode;
            }
            emitToken(t3) {
              this._token = t3;
            }
            emit() {
              const t3 = this._factory.create(this._tokenFactorySourcePair, this._type, this._text, this._channel, this._tokenStartCharIndex, this.getCharIndex() - 1, this._tokenStartLine, this._tokenStartColumn);
              return this.emitToken(t3), t3;
            }
            emitEOF() {
              const e3 = this.column, n2 = this.line, s2 = this._factory.create(this._tokenFactorySourcePair, t2.EOF, null, t2.DEFAULT_CHANNEL, this._input.index, this._input.index - 1, n2, e3);
              return this.emitToken(s2), s2;
            }
            getCharIndex() {
              return this._input.index;
            }
            getAllTokens() {
              const e3 = [];
              let n2 = this.nextToken();
              for (; n2.type !== t2.EOF; ) e3.push(n2), n2 = this.nextToken();
              return e3;
            }
            notifyListeners(t3) {
              const e3 = this._tokenStartCharIndex, n2 = this._input.index, s2 = this._input.getText(e3, n2), i3 = "token recognition error at: '" + this.getErrorDisplay(s2) + "'";
              this.getErrorListener().syntaxError(this, null, this._tokenStartLine, this._tokenStartColumn, i3, t3);
            }
            getErrorDisplay(t3) {
              const e3 = [];
              for (let n2 = 0; n2 < t3.length; n2++) e3.push(t3[n2]);
              return e3.join("");
            }
            getErrorDisplayForChar(e3) {
              return e3.charCodeAt(0) === t2.EOF ? "<EOF>" : "\n" === e3 ? "\\n" : "	" === e3 ? "\\t" : "\r" === e3 ? "\\r" : e3;
            }
            getCharErrorDisplay(t3) {
              return "'" + this.getErrorDisplayForChar(t3) + "'";
            }
            recover(e3) {
              this._input.LA(1) !== t2.EOF && (e3 instanceof Dt ? this._interp.consume(this._input) : this._input.consume());
            }
            get inputStream() {
              return this._input;
            }
            set inputStream(t3) {
              this._input = null, this._tokenFactorySourcePair = [this, this._input], this.reset(), this._input = t3, this._tokenFactorySourcePair = [this, this._input];
            }
            get sourceName() {
              return this._input.sourceName;
            }
            get type() {
              return this._type;
            }
            set type(t3) {
              this._type = t3;
            }
            get line() {
              return this._interp.line;
            }
            set line(t3) {
              this._interp.line = t3;
            }
            get column() {
              return this._interp.column;
            }
            set column(t3) {
              this._interp.column = t3;
            }
            get text() {
              return null !== this._text ? this._text : this._interp.getText(this._input);
            }
            set text(t3) {
              this._text = t3;
            }
          }
          function Mt(t3) {
            return t3.hashCodeForConfigSet();
          }
          function Ut(t3, e3) {
            return t3 === e3 || null !== t3 && null !== e3 && t3.equalsForConfigSet(e3);
          }
          Ft.DEFAULT_MODE = 0, Ft.MORE = -2, Ft.SKIP = -3, Ft.DEFAULT_TOKEN_CHANNEL = t2.DEFAULT_CHANNEL, Ft.HIDDEN = t2.HIDDEN_CHANNEL, Ft.MIN_CHAR_VALUE = 0, Ft.MAX_CHAR_VALUE = 1114111;
          class Bt {
            constructor(t3) {
              this.configLookup = new u(Mt, Ut), this.fullCtx = void 0 === t3 || t3, this.readOnly = false, this.configs = [], this.uniqueAlt = 0, this.conflictingAlts = null, this.hasSemanticContext = false, this.dipsIntoOuterContext = false, this.cachedHashCode = -1;
            }
            add(t3, e3) {
              if (void 0 === e3 && (e3 = null), this.readOnly) throw "This set is readonly";
              t3.semanticContext !== d.NONE && (this.hasSemanticContext = true), t3.reachesIntoOuterContext > 0 && (this.dipsIntoOuterContext = true);
              const n2 = this.configLookup.getOrAdd(t3);
              if (n2 === t3) return this.cachedHashCode = -1, this.configs.push(t3), true;
              const s2 = !this.fullCtx, i3 = K(n2.context, t3.context, s2, e3);
              return n2.reachesIntoOuterContext = Math.max(n2.reachesIntoOuterContext, t3.reachesIntoOuterContext), t3.precedenceFilterSuppressed && (n2.precedenceFilterSuppressed = true), n2.context = i3, true;
            }
            getStates() {
              const t3 = new u();
              for (let e3 = 0; e3 < this.configs.length; e3++) t3.add(this.configs[e3].state);
              return t3;
            }
            getPredicates() {
              const t3 = [];
              for (let e3 = 0; e3 < this.configs.length; e3++) {
                const n2 = this.configs[e3].semanticContext;
                n2 !== d.NONE && t3.push(n2.semanticContext);
              }
              return t3;
            }
            optimizeConfigs(t3) {
              if (this.readOnly) throw "This set is readonly";
              if (0 !== this.configLookup.length) for (let e3 = 0; e3 < this.configs.length; e3++) {
                const n2 = this.configs[e3];
                n2.context = t3.getCachedContext(n2.context);
              }
            }
            addAll(t3) {
              for (let e3 = 0; e3 < t3.length; e3++) this.add(t3[e3]);
              return false;
            }
            equals(t3) {
              return this === t3 || t3 instanceof Bt && e2(this.configs, t3.configs) && this.fullCtx === t3.fullCtx && this.uniqueAlt === t3.uniqueAlt && this.conflictingAlts === t3.conflictingAlts && this.hasSemanticContext === t3.hasSemanticContext && this.dipsIntoOuterContext === t3.dipsIntoOuterContext;
            }
            hashCode() {
              const t3 = new o();
              return t3.update(this.configs), t3.finish();
            }
            updateHashCode(t3) {
              this.readOnly ? (-1 === this.cachedHashCode && (this.cachedHashCode = this.hashCode()), t3.update(this.cachedHashCode)) : t3.update(this.hashCode());
            }
            isEmpty() {
              return 0 === this.configs.length;
            }
            contains(t3) {
              if (null === this.configLookup) throw "This method is not implemented for readonly sets.";
              return this.configLookup.contains(t3);
            }
            containsFast(t3) {
              if (null === this.configLookup) throw "This method is not implemented for readonly sets.";
              return this.configLookup.containsFast(t3);
            }
            clear() {
              if (this.readOnly) throw "This set is readonly";
              this.configs = [], this.cachedHashCode = -1, this.configLookup = new u();
            }
            setReadonly(t3) {
              this.readOnly = t3, t3 && (this.configLookup = null);
            }
            toString() {
              return c(this.configs) + (this.hasSemanticContext ? ",hasSemanticContext=" + this.hasSemanticContext : "") + (this.uniqueAlt !== j.INVALID_ALT_NUMBER ? ",uniqueAlt=" + this.uniqueAlt : "") + (null !== this.conflictingAlts ? ",conflictingAlts=" + this.conflictingAlts : "") + (this.dipsIntoOuterContext ? ",dipsIntoOuterContext" : "");
            }
            get items() {
              return this.configs;
            }
            get length() {
              return this.configs.length;
            }
          }
          class Vt {
            constructor(t3, e3) {
              return null === t3 && (t3 = -1), null === e3 && (e3 = new Bt()), this.stateNumber = t3, this.configs = e3, this.edges = null, this.isAcceptState = false, this.prediction = 0, this.lexerActionExecutor = null, this.requiresFullContext = false, this.predicates = null, this;
            }
            getAltSet() {
              const t3 = new u();
              if (null !== this.configs) for (let e3 = 0; e3 < this.configs.length; e3++) {
                const n2 = this.configs[e3];
                t3.add(n2.alt);
              }
              return 0 === t3.length ? null : t3;
            }
            equals(t3) {
              return this === t3 || t3 instanceof Vt && this.configs.equals(t3.configs);
            }
            toString() {
              let t3 = this.stateNumber + ":" + this.configs;
              return this.isAcceptState && (t3 += "=>", null !== this.predicates ? t3 += this.predicates : t3 += this.prediction), t3;
            }
            hashCode() {
              const t3 = new o();
              return t3.update(this.configs), t3.finish();
            }
          }
          class zt {
            constructor(t3, e3) {
              return this.atn = t3, this.sharedContextCache = e3, this;
            }
            getCachedContext(t3) {
              if (null === this.sharedContextCache) return t3;
              const e3 = new z();
              return H(t3, this.sharedContextCache, e3);
            }
          }
          zt.ERROR = new Vt(2147483647, new Bt());
          class qt extends Bt {
            constructor() {
              super(), this.configLookup = new u();
            }
          }
          class Ht extends T {
            constructor(t3, e3) {
              super(t3, e3);
              const n2 = t3.lexerActionExecutor || null;
              return this.lexerActionExecutor = n2 || (null !== e3 ? e3.lexerActionExecutor : null), this.passedThroughNonGreedyDecision = null !== e3 && this.checkNonGreedyDecision(e3, this.state), this.hashCodeForConfigSet = Ht.prototype.hashCode, this.equalsForConfigSet = Ht.prototype.equals, this;
            }
            updateHashCode(t3) {
              t3.update(this.state.stateNumber, this.alt, this.context, this.semanticContext, this.passedThroughNonGreedyDecision, this.lexerActionExecutor);
            }
            equals(t3) {
              return this === t3 || t3 instanceof Ht && this.passedThroughNonGreedyDecision === t3.passedThroughNonGreedyDecision && (this.lexerActionExecutor ? this.lexerActionExecutor.equals(t3.lexerActionExecutor) : !t3.lexerActionExecutor) && super.equals(t3);
            }
            checkNonGreedyDecision(t3, e3) {
              return t3.passedThroughNonGreedyDecision || e3 instanceof $ && e3.nonGreedy;
            }
          }
          class Kt extends xt {
            constructor(t3, e3) {
              super(e3.actionType), this.offset = t3, this.action = e3, this.isPositionDependent = true;
            }
            execute(t3) {
              this.action.execute(t3);
            }
            updateHashCode(t3) {
              t3.update(this.actionType, this.offset, this.action);
            }
            equals(t3) {
              return this === t3 || t3 instanceof Kt && this.offset === t3.offset && this.action === t3.action;
            }
          }
          class Yt {
            constructor(t3) {
              return this.lexerActions = null === t3 ? [] : t3, this.cachedHashCode = o.hashStuff(t3), this;
            }
            fixOffsetBeforeMatch(t3) {
              let e3 = null;
              for (let n2 = 0; n2 < this.lexerActions.length; n2++) !this.lexerActions[n2].isPositionDependent || this.lexerActions[n2] instanceof Kt || (null === e3 && (e3 = this.lexerActions.concat([])), e3[n2] = new Kt(t3, this.lexerActions[n2]));
              return null === e3 ? this : new Yt(e3);
            }
            execute(t3, e3, n2) {
              let s2 = false;
              const i3 = e3.index;
              try {
                for (let r3 = 0; r3 < this.lexerActions.length; r3++) {
                  let o2 = this.lexerActions[r3];
                  if (o2 instanceof Kt) {
                    const t4 = o2.offset;
                    e3.seek(n2 + t4), o2 = o2.action, s2 = n2 + t4 !== i3;
                  } else o2.isPositionDependent && (e3.seek(i3), s2 = false);
                  o2.execute(t3);
                }
              } finally {
                s2 && e3.seek(i3);
              }
            }
            hashCode() {
              return this.cachedHashCode;
            }
            updateHashCode(t3) {
              t3.update(this.cachedHashCode);
            }
            equals(t3) {
              if (this === t3) return true;
              if (t3 instanceof Yt) {
                if (this.cachedHashCode != t3.cachedHashCode) return false;
                if (this.lexerActions.length != t3.lexerActions.length) return false;
                {
                  const e3 = this.lexerActions.length;
                  for (let n2 = 0; n2 < e3; ++n2) if (!this.lexerActions[n2].equals(t3.lexerActions[n2])) return false;
                  return true;
                }
              }
              return false;
            }
            static append(t3, e3) {
              if (null === t3) return new Yt([e3]);
              const n2 = t3.lexerActions.concat([e3]);
              return new Yt(n2);
            }
          }
          function Gt(t3) {
            t3.index = -1, t3.line = 0, t3.column = -1, t3.dfaState = null;
          }
          class jt {
            constructor() {
              Gt(this);
            }
            reset() {
              Gt(this);
            }
          }
          class Wt extends zt {
            constructor(t3, e3, n2, s2) {
              super(e3, s2), this.decisionToDFA = n2, this.recog = t3, this.startIndex = -1, this.line = 1, this.column = 0, this.mode = Ft.DEFAULT_MODE, this.prevAccept = new jt();
            }
            copyState(t3) {
              this.column = t3.column, this.line = t3.line, this.mode = t3.mode, this.startIndex = t3.startIndex;
            }
            match(t3, e3) {
              this.mode = e3;
              const n2 = t3.mark();
              try {
                this.startIndex = t3.index, this.prevAccept.reset();
                const n3 = this.decisionToDFA[e3];
                return null === n3.s0 ? this.matchATN(t3) : this.execATN(t3, n3.s0);
              } finally {
                t3.release(n2);
              }
            }
            reset() {
              this.prevAccept.reset(), this.startIndex = -1, this.line = 1, this.column = 0, this.mode = Ft.DEFAULT_MODE;
            }
            matchATN(t3) {
              const e3 = this.atn.modeToStartState[this.mode];
              Wt.debug && console.log("matchATN mode " + this.mode + " start: " + e3);
              const n2 = this.mode, s2 = this.computeStartState(t3, e3), i3 = s2.hasSemanticContext;
              s2.hasSemanticContext = false;
              const r3 = this.addDFAState(s2);
              i3 || (this.decisionToDFA[this.mode].s0 = r3);
              const o2 = this.execATN(t3, r3);
              return Wt.debug && console.log("DFA after matchATN: " + this.decisionToDFA[n2].toLexerString()), o2;
            }
            execATN(e3, n2) {
              Wt.debug && console.log("start state closure=" + n2.configs), n2.isAcceptState && this.captureSimState(this.prevAccept, e3, n2);
              let s2 = e3.LA(1), i3 = n2;
              for (; ; ) {
                Wt.debug && console.log("execATN loop starting closure: " + i3.configs);
                let n3 = this.getExistingTargetState(i3, s2);
                if (null === n3 && (n3 = this.computeTargetState(e3, i3, s2)), n3 === zt.ERROR) break;
                if (s2 !== t2.EOF && this.consume(e3), n3.isAcceptState && (this.captureSimState(this.prevAccept, e3, n3), s2 === t2.EOF)) break;
                s2 = e3.LA(1), i3 = n3;
              }
              return this.failOrAccept(this.prevAccept, e3, i3.configs, s2);
            }
            getExistingTargetState(t3, e3) {
              if (null === t3.edges || e3 < Wt.MIN_DFA_EDGE || e3 > Wt.MAX_DFA_EDGE) return null;
              let n2 = t3.edges[e3 - Wt.MIN_DFA_EDGE];
              return void 0 === n2 && (n2 = null), Wt.debug && null !== n2 && console.log("reuse state " + t3.stateNumber + " edge to " + n2.stateNumber), n2;
            }
            computeTargetState(t3, e3, n2) {
              const s2 = new qt();
              return this.getReachableConfigSet(t3, e3.configs, s2, n2), 0 === s2.items.length ? (s2.hasSemanticContext || this.addDFAEdge(e3, n2, zt.ERROR), zt.ERROR) : this.addDFAEdge(e3, n2, null, s2);
            }
            failOrAccept(e3, n2, s2, i3) {
              if (null !== this.prevAccept.dfaState) {
                const t3 = e3.dfaState.lexerActionExecutor;
                return this.accept(n2, t3, this.startIndex, e3.index, e3.line, e3.column), e3.dfaState.prediction;
              }
              if (i3 === t2.EOF && n2.index === this.startIndex) return t2.EOF;
              throw new Dt(this.recog, n2, this.startIndex, s2);
            }
            getReachableConfigSet(e3, n2, s2, i3) {
              let r3 = j.INVALID_ALT_NUMBER;
              for (let o2 = 0; o2 < n2.items.length; o2++) {
                const a2 = n2.items[o2], l2 = a2.alt === r3;
                if (!l2 || !a2.passedThroughNonGreedyDecision) {
                  Wt.debug && console.log("testing %s at %s\n", this.getTokenName(i3), a2.toString(this.recog, true));
                  for (let n3 = 0; n3 < a2.state.transitions.length; n3++) {
                    const o3 = a2.state.transitions[n3], h2 = this.getReachableTarget(o3, i3);
                    if (null !== h2) {
                      let n4 = a2.lexerActionExecutor;
                      null !== n4 && (n4 = n4.fixOffsetBeforeMatch(e3.index - this.startIndex));
                      const o4 = i3 === t2.EOF, c2 = new Ht({ state: h2, lexerActionExecutor: n4 }, a2);
                      this.closure(e3, c2, s2, l2, true, o4) && (r3 = a2.alt);
                    }
                  }
                }
              }
            }
            accept(t3, e3, n2, s2, i3, r3) {
              Wt.debug && console.log("ACTION %s\n", e3), t3.seek(s2), this.line = i3, this.column = r3, null !== e3 && null !== this.recog && e3.execute(this.recog, t3, n2);
            }
            getReachableTarget(t3, e3) {
              return t3.matches(e3, 0, Ft.MAX_CHAR_VALUE) ? t3.target : null;
            }
            computeStartState(t3, e3) {
              const n2 = M.EMPTY, s2 = new qt();
              for (let i3 = 0; i3 < e3.transitions.length; i3++) {
                const r3 = e3.transitions[i3].target, o2 = new Ht({ state: r3, alt: i3 + 1, context: n2 }, null);
                this.closure(t3, o2, s2, false, false, false);
              }
              return s2;
            }
            closure(t3, e3, n2, s2, i3, r3) {
              let o2 = null;
              if (Wt.debug && console.log("closure(" + e3.toString(this.recog, true) + ")"), e3.state instanceof _) {
                if (Wt.debug && (null !== this.recog ? console.log("closure at %s rule stop %s\n", this.recog.ruleNames[e3.state.ruleIndex], e3) : console.log("closure at rule stop %s\n", e3)), null === e3.context || e3.context.hasEmptyPath()) {
                  if (null === e3.context || e3.context.isEmpty()) return n2.add(e3), true;
                  n2.add(new Ht({ state: e3.state, context: M.EMPTY }, e3)), s2 = true;
                }
                if (null !== e3.context && !e3.context.isEmpty()) {
                  for (let a2 = 0; a2 < e3.context.length; a2++) if (e3.context.getReturnState(a2) !== M.EMPTY_RETURN_STATE) {
                    const l2 = e3.context.getParent(a2), h2 = this.atn.states[e3.context.getReturnState(a2)];
                    o2 = new Ht({ state: h2, context: l2 }, e3), s2 = this.closure(t3, o2, n2, s2, i3, r3);
                  }
                }
                return s2;
              }
              e3.state.epsilonOnlyTransitions || s2 && e3.passedThroughNonGreedyDecision || n2.add(e3);
              for (let a2 = 0; a2 < e3.state.transitions.length; a2++) {
                const l2 = e3.state.transitions[a2];
                o2 = this.getEpsilonTarget(t3, e3, l2, n2, i3, r3), null !== o2 && (s2 = this.closure(t3, o2, n2, s2, i3, r3));
              }
              return s2;
            }
            getEpsilonTarget(e3, n2, s2, i3, r3, o2) {
              let a2 = null;
              if (s2.serializationType === C.RULE) {
                const t3 = B.create(n2.context, s2.followState.stateNumber);
                a2 = new Ht({ state: s2.target, context: t3 }, n2);
              } else {
                if (s2.serializationType === C.PRECEDENCE) throw "Precedence predicates are not supported in lexers.";
                if (s2.serializationType === C.PREDICATE) Wt.debug && console.log("EVAL rule " + s2.ruleIndex + ":" + s2.predIndex), i3.hasSemanticContext = true, this.evaluatePredicate(e3, s2.ruleIndex, s2.predIndex, r3) && (a2 = new Ht({ state: s2.target }, n2));
                else if (s2.serializationType === C.ACTION) if (null === n2.context || n2.context.hasEmptyPath()) {
                  const t3 = Yt.append(n2.lexerActionExecutor, this.atn.lexerActions[s2.actionIndex]);
                  a2 = new Ht({ state: s2.target, lexerActionExecutor: t3 }, n2);
                } else a2 = new Ht({ state: s2.target }, n2);
                else s2.serializationType === C.EPSILON ? a2 = new Ht({ state: s2.target }, n2) : s2.serializationType !== C.ATOM && s2.serializationType !== C.RANGE && s2.serializationType !== C.SET || o2 && s2.matches(t2.EOF, 0, Ft.MAX_CHAR_VALUE) && (a2 = new Ht({ state: s2.target }, n2));
              }
              return a2;
            }
            evaluatePredicate(t3, e3, n2, s2) {
              if (null === this.recog) return true;
              if (!s2) return this.recog.sempred(null, e3, n2);
              const i3 = this.column, r3 = this.line, o2 = t3.index, a2 = t3.mark();
              try {
                return this.consume(t3), this.recog.sempred(null, e3, n2);
              } finally {
                this.column = i3, this.line = r3, t3.seek(o2), t3.release(a2);
              }
            }
            captureSimState(t3, e3, n2) {
              t3.index = e3.index, t3.line = this.line, t3.column = this.column, t3.dfaState = n2;
            }
            addDFAEdge(t3, e3, n2, s2) {
              if (void 0 === n2 && (n2 = null), void 0 === s2 && (s2 = null), null === n2 && null !== s2) {
                const t4 = s2.hasSemanticContext;
                if (s2.hasSemanticContext = false, n2 = this.addDFAState(s2), t4) return n2;
              }
              return e3 < Wt.MIN_DFA_EDGE || e3 > Wt.MAX_DFA_EDGE || (Wt.debug && console.log("EDGE " + t3 + " -> " + n2 + " upon " + e3), null === t3.edges && (t3.edges = []), t3.edges[e3 - Wt.MIN_DFA_EDGE] = n2), n2;
            }
            addDFAState(t3) {
              const e3 = new Vt(null, t3);
              let n2 = null;
              for (let e4 = 0; e4 < t3.items.length; e4++) {
                const s3 = t3.items[e4];
                if (s3.state instanceof _) {
                  n2 = s3;
                  break;
                }
              }
              null !== n2 && (e3.isAcceptState = true, e3.lexerActionExecutor = n2.lexerActionExecutor, e3.prediction = this.atn.ruleToTokenType[n2.state.ruleIndex]);
              const s2 = this.decisionToDFA[this.mode], i3 = s2.states.get(e3);
              if (null !== i3) return i3;
              const r3 = e3;
              return r3.stateNumber = s2.states.length, t3.setReadonly(true), r3.configs = t3, s2.states.add(r3), r3;
            }
            getDFA(t3) {
              return this.decisionToDFA[t3];
            }
            getText(t3) {
              return t3.getText(this.startIndex, t3.index - 1);
            }
            consume(t3) {
              t3.LA(1) === "\n".charCodeAt(0) ? (this.line += 1, this.column = 0) : this.column += 1, t3.consume();
            }
            getTokenName(t3) {
              return -1 === t3 ? "EOF" : "'" + String.fromCharCode(t3) + "'";
            }
          }
          Wt.debug = false, Wt.dfa_debug = false, Wt.MIN_DFA_EDGE = 0, Wt.MAX_DFA_EDGE = 127;
          class $t {
            constructor(t3, e3) {
              this.alt = e3, this.pred = t3;
            }
            toString() {
              return "(" + this.pred + ", " + this.alt + ")";
            }
          }
          class Xt {
            constructor() {
              this.data = {};
            }
            get(t3) {
              return this.data["k-" + t3] || null;
            }
            set(t3, e3) {
              this.data["k-" + t3] = e3;
            }
            values() {
              return Object.keys(this.data).filter((t3) => t3.startsWith("k-")).map((t3) => this.data[t3], this);
            }
          }
          const Jt = { SLL: 0, LL: 1, LL_EXACT_AMBIG_DETECTION: 2, hasSLLConflictTerminatingPrediction: function(t3, e3) {
            if (Jt.allConfigsInRuleStopStates(e3)) return true;
            if (t3 === Jt.SLL && e3.hasSemanticContext) {
              const t4 = new Bt();
              for (let n3 = 0; n3 < e3.items.length; n3++) {
                let s2 = e3.items[n3];
                s2 = new T({ semanticContext: d.NONE }, s2), t4.add(s2);
              }
              e3 = t4;
            }
            const n2 = Jt.getConflictingAltSubsets(e3);
            return Jt.hasConflictingAltSet(n2) && !Jt.hasStateAssociatedWithOneAlt(e3);
          }, hasConfigInRuleStopState: function(t3) {
            for (let e3 = 0; e3 < t3.items.length; e3++) if (t3.items[e3].state instanceof _) return true;
            return false;
          }, allConfigsInRuleStopStates: function(t3) {
            for (let e3 = 0; e3 < t3.items.length; e3++) if (!(t3.items[e3].state instanceof _)) return false;
            return true;
          }, resolvesToJustOneViableAlt: function(t3) {
            return Jt.getSingleViableAlt(t3);
          }, allSubsetsConflict: function(t3) {
            return !Jt.hasNonConflictingAltSet(t3);
          }, hasNonConflictingAltSet: function(t3) {
            for (let e3 = 0; e3 < t3.length; e3++) if (1 === t3[e3].length) return true;
            return false;
          }, hasConflictingAltSet: function(t3) {
            for (let e3 = 0; e3 < t3.length; e3++) if (t3[e3].length > 1) return true;
            return false;
          }, allSubsetsEqual: function(t3) {
            let e3 = null;
            for (let n2 = 0; n2 < t3.length; n2++) {
              const s2 = t3[n2];
              if (null === e3) e3 = s2;
              else if (s2 !== e3) return false;
            }
            return true;
          }, getUniqueAlt: function(t3) {
            const e3 = Jt.getAlts(t3);
            return 1 === e3.length ? e3.minValue() : j.INVALID_ALT_NUMBER;
          }, getAlts: function(t3) {
            const e3 = new Y();
            return t3.map(function(t4) {
              e3.or(t4);
            }), e3;
          }, getConflictingAltSubsets: function(t3) {
            const e3 = new z();
            return e3.hashFunction = function(t4) {
              o.hashStuff(t4.state.stateNumber, t4.context);
            }, e3.equalsFunction = function(t4, e4) {
              return t4.state.stateNumber === e4.state.stateNumber && t4.context.equals(e4.context);
            }, t3.items.map(function(t4) {
              let n2 = e3.get(t4);
              null === n2 && (n2 = new Y(), e3.set(t4, n2)), n2.set(t4.alt);
            }), e3.getValues();
          }, getStateToAltMap: function(t3) {
            const e3 = new Xt();
            return t3.items.map(function(t4) {
              let n2 = e3.get(t4.state);
              null === n2 && (n2 = new Y(), e3.set(t4.state, n2)), n2.set(t4.alt);
            }), e3;
          }, hasStateAssociatedWithOneAlt: function(t3) {
            const e3 = Jt.getStateToAltMap(t3).values();
            for (let t4 = 0; t4 < e3.length; t4++) if (1 === e3[t4].length) return true;
            return false;
          }, getSingleViableAlt: function(t3) {
            let e3 = null;
            for (let n2 = 0; n2 < t3.length; n2++) {
              const s2 = t3[n2].minValue();
              if (null === e3) e3 = s2;
              else if (e3 !== s2) return j.INVALID_ALT_NUMBER;
            }
            return e3;
          } }, Qt = Jt;
          class Zt extends bt {
            constructor(t3, e3, n2, s2, i3, r3) {
              r3 = r3 || t3._ctx, s2 = s2 || t3.getCurrentToken(), n2 = n2 || t3.getCurrentToken(), e3 = e3 || t3.getInputStream(), super({ message: "", recognizer: t3, input: e3, ctx: r3 }), this.deadEndConfigs = i3, this.startToken = n2, this.offendingToken = s2;
            }
          }
          class te {
            constructor(t3) {
              this.defaultMapCtor = t3 || z, this.cacheMap = new this.defaultMapCtor();
            }
            get(t3, e3) {
              const n2 = this.cacheMap.get(t3) || null;
              return null === n2 ? null : n2.get(e3) || null;
            }
            set(t3, e3, n2) {
              let s2 = this.cacheMap.get(t3) || null;
              null === s2 && (s2 = new this.defaultMapCtor(), this.cacheMap.set(t3, s2)), s2.set(e3, n2);
            }
          }
          class ee extends zt {
            constructor(t3, e3, n2, s2) {
              super(e3, s2), this.parser = t3, this.decisionToDFA = n2, this.predictionMode = Qt.LL, this._input = null, this._startIndex = 0, this._outerContext = null, this._dfa = null, this.mergeCache = null, this.debug = false, this.debug_closure = false, this.debug_add = false, this.trace_atn_sim = false, this.dfa_debug = false, this.retry_debug = false;
            }
            reset() {
            }
            adaptivePredict(t3, e3, n2) {
              (this.debug || this.trace_atn_sim) && console.log("adaptivePredict decision " + e3 + " exec LA(1)==" + this.getLookaheadName(t3) + " line " + t3.LT(1).line + ":" + t3.LT(1).column), this._input = t3, this._startIndex = t3.index, this._outerContext = n2;
              const s2 = this.decisionToDFA[e3];
              this._dfa = s2;
              const i3 = t3.mark(), r3 = t3.index;
              try {
                let e4;
                if (e4 = s2.precedenceDfa ? s2.getPrecedenceStartState(this.parser.getPrecedence()) : s2.s0, null === e4) {
                  null === n2 && (n2 = F.EMPTY), this.debug && console.log("predictATN decision " + s2.decision + " exec LA(1)==" + this.getLookaheadName(t3) + ", outerContext=" + n2.toString(this.parser.ruleNames));
                  const i5 = false;
                  let r4 = this.computeStartState(s2.atnStartState, F.EMPTY, i5);
                  s2.precedenceDfa ? (s2.s0.configs = r4, r4 = this.applyPrecedenceFilter(r4), e4 = this.addDFAState(s2, new Vt(null, r4)), s2.setPrecedenceStartState(this.parser.getPrecedence(), e4)) : (e4 = this.addDFAState(s2, new Vt(null, r4)), s2.s0 = e4);
                }
                const i4 = this.execATN(s2, e4, t3, r3, n2);
                return this.debug && console.log("DFA after predictATN: " + s2.toString(this.parser.literalNames, this.parser.symbolicNames)), i4;
              } finally {
                this._dfa = null, this.mergeCache = null, t3.seek(r3), t3.release(i3);
              }
            }
            execATN(e3, n2, s2, i3, r3) {
              let o2;
              (this.debug || this.trace_atn_sim) && console.log("execATN decision " + e3.decision + ", DFA state " + n2 + ", LA(1)==" + this.getLookaheadName(s2) + " line " + s2.LT(1).line + ":" + s2.LT(1).column);
              let a2 = n2;
              this.debug && console.log("s0 = " + n2);
              let l2 = s2.LA(1);
              for (; ; ) {
                let n3 = this.getExistingTargetState(a2, l2);
                if (null === n3 && (n3 = this.computeTargetState(e3, a2, l2)), n3 === zt.ERROR) {
                  const t3 = this.noViableAlt(s2, r3, a2.configs, i3);
                  if (s2.seek(i3), o2 = this.getSynValidOrSemInvalidAltThatFinishedDecisionEntryRule(a2.configs, r3), o2 !== j.INVALID_ALT_NUMBER) return o2;
                  throw t3;
                }
                if (n3.requiresFullContext && this.predictionMode !== Qt.SLL) {
                  let t3 = null;
                  if (null !== n3.predicates) {
                    this.debug && console.log("DFA state has preds in DFA sim LL failover");
                    const e4 = s2.index;
                    if (e4 !== i3 && s2.seek(i3), t3 = this.evalSemanticContext(n3.predicates, r3, true), 1 === t3.length) return this.debug && console.log("Full LL avoided"), t3.minValue();
                    e4 !== i3 && s2.seek(e4);
                  }
                  this.dfa_debug && console.log("ctx sensitive state " + r3 + " in " + n3);
                  const a3 = true, l3 = this.computeStartState(e3.atnStartState, r3, a3);
                  return this.reportAttemptingFullContext(e3, t3, n3.configs, i3, s2.index), o2 = this.execATNWithFullContext(e3, n3, l3, s2, i3, r3), o2;
                }
                if (n3.isAcceptState) {
                  if (null === n3.predicates) return n3.prediction;
                  const t3 = s2.index;
                  s2.seek(i3);
                  const o3 = this.evalSemanticContext(n3.predicates, r3, true);
                  if (0 === o3.length) throw this.noViableAlt(s2, r3, n3.configs, i3);
                  return 1 === o3.length || this.reportAmbiguity(e3, n3, i3, t3, false, o3, n3.configs), o3.minValue();
                }
                a2 = n3, l2 !== t2.EOF && (s2.consume(), l2 = s2.LA(1));
              }
            }
            getExistingTargetState(t3, e3) {
              const n2 = t3.edges;
              return null === n2 ? null : n2[e3 + 1] || null;
            }
            computeTargetState(t3, e3, n2) {
              const s2 = this.computeReachSet(e3.configs, n2, false);
              if (null === s2) return this.addDFAEdge(t3, e3, n2, zt.ERROR), zt.ERROR;
              let i3 = new Vt(null, s2);
              const r3 = this.getUniqueAlt(s2);
              if (this.debug) {
                const t4 = Qt.getConflictingAltSubsets(s2);
                console.log("SLL altSubSets=" + c(t4) + ", configs=" + s2 + ", predict=" + r3 + ", allSubsetsConflict=" + Qt.allSubsetsConflict(t4) + ", conflictingAlts=" + this.getConflictingAlts(s2));
              }
              return r3 !== j.INVALID_ALT_NUMBER ? (i3.isAcceptState = true, i3.configs.uniqueAlt = r3, i3.prediction = r3) : Qt.hasSLLConflictTerminatingPrediction(this.predictionMode, s2) && (i3.configs.conflictingAlts = this.getConflictingAlts(s2), i3.requiresFullContext = true, i3.isAcceptState = true, i3.prediction = i3.configs.conflictingAlts.minValue()), i3.isAcceptState && i3.configs.hasSemanticContext && (this.predicateDFAState(i3, this.atn.getDecisionState(t3.decision)), null !== i3.predicates && (i3.prediction = j.INVALID_ALT_NUMBER)), i3 = this.addDFAEdge(t3, e3, n2, i3), i3;
            }
            predicateDFAState(t3, e3) {
              const n2 = e3.transitions.length, s2 = this.getConflictingAltsOrUniqueAlt(t3.configs), i3 = this.getPredsForAmbigAlts(s2, t3.configs, n2);
              null !== i3 ? (t3.predicates = this.getPredicatePredictions(s2, i3), t3.prediction = j.INVALID_ALT_NUMBER) : t3.prediction = s2.minValue();
            }
            execATNWithFullContext(e3, n2, s2, i3, r3, o2) {
              (this.debug || this.trace_atn_sim) && console.log("execATNWithFullContext " + s2);
              let a2, l2 = false, h2 = s2;
              i3.seek(r3);
              let c2 = i3.LA(1), u2 = -1;
              for (; ; ) {
                if (a2 = this.computeReachSet(h2, c2, true), null === a2) {
                  const t3 = this.noViableAlt(i3, o2, h2, r3);
                  i3.seek(r3);
                  const e5 = this.getSynValidOrSemInvalidAltThatFinishedDecisionEntryRule(h2, o2);
                  if (e5 !== j.INVALID_ALT_NUMBER) return e5;
                  throw t3;
                }
                const e4 = Qt.getConflictingAltSubsets(a2);
                if (this.debug && console.log("LL altSubSets=" + e4 + ", predict=" + Qt.getUniqueAlt(e4) + ", resolvesToJustOneViableAlt=" + Qt.resolvesToJustOneViableAlt(e4)), a2.uniqueAlt = this.getUniqueAlt(a2), a2.uniqueAlt !== j.INVALID_ALT_NUMBER) {
                  u2 = a2.uniqueAlt;
                  break;
                }
                if (this.predictionMode !== Qt.LL_EXACT_AMBIG_DETECTION) {
                  if (u2 = Qt.resolvesToJustOneViableAlt(e4), u2 !== j.INVALID_ALT_NUMBER) break;
                } else if (Qt.allSubsetsConflict(e4) && Qt.allSubsetsEqual(e4)) {
                  l2 = true, u2 = Qt.getSingleViableAlt(e4);
                  break;
                }
                h2 = a2, c2 !== t2.EOF && (i3.consume(), c2 = i3.LA(1));
              }
              return a2.uniqueAlt !== j.INVALID_ALT_NUMBER ? (this.reportContextSensitivity(e3, u2, a2, r3, i3.index), u2) : (this.reportAmbiguity(e3, n2, r3, i3.index, l2, null, a2), u2);
            }
            computeReachSet(e3, n2, s2) {
              this.debug && console.log("in computeReachSet, starting closure: " + e3), null === this.mergeCache && (this.mergeCache = new te());
              const i3 = new Bt(s2);
              let r3 = null;
              for (let o3 = 0; o3 < e3.items.length; o3++) {
                const a2 = e3.items[o3];
                if (this.debug && console.log("testing " + this.getTokenName(n2) + " at " + a2), a2.state instanceof _) (s2 || n2 === t2.EOF) && (null === r3 && (r3 = []), r3.push(a2), this.debug_add && console.log("added " + a2 + " to skippedStopStates"));
                else for (let t3 = 0; t3 < a2.state.transitions.length; t3++) {
                  const e4 = a2.state.transitions[t3], s3 = this.getReachableTarget(e4, n2);
                  if (null !== s3) {
                    const t4 = new T({ state: s3 }, a2);
                    i3.add(t4, this.mergeCache), this.debug_add && console.log("added " + t4 + " to intermediate");
                  }
                }
              }
              let o2 = null;
              if (null === r3 && n2 !== t2.EOF && (1 === i3.items.length || this.getUniqueAlt(i3) !== j.INVALID_ALT_NUMBER) && (o2 = i3), null === o2) {
                o2 = new Bt(s2);
                const e4 = new u(), r4 = n2 === t2.EOF;
                for (let t3 = 0; t3 < i3.items.length; t3++) this.closure(i3.items[t3], o2, e4, false, s2, r4);
              }
              if (n2 === t2.EOF && (o2 = this.removeAllConfigsNotInRuleStopState(o2, o2 === i3)), !(null === r3 || s2 && Qt.hasConfigInRuleStopState(o2))) for (let t3 = 0; t3 < r3.length; t3++) o2.add(r3[t3], this.mergeCache);
              return this.trace_atn_sim && console.log("computeReachSet " + e3 + " -> " + o2), 0 === o2.items.length ? null : o2;
            }
            removeAllConfigsNotInRuleStopState(e3, n2) {
              if (Qt.allConfigsInRuleStopStates(e3)) return e3;
              const s2 = new Bt(e3.fullCtx);
              for (let i3 = 0; i3 < e3.items.length; i3++) {
                const r3 = e3.items[i3];
                if (r3.state instanceof _) s2.add(r3, this.mergeCache);
                else if (n2 && r3.state.epsilonOnlyTransitions && this.atn.nextTokens(r3.state).contains(t2.EPSILON)) {
                  const t3 = this.atn.ruleToStopState[r3.state.ruleIndex];
                  s2.add(new T({ state: t3 }, r3), this.mergeCache);
                }
              }
              return s2;
            }
            computeStartState(t3, e3, n2) {
              const s2 = q(this.atn, e3), i3 = new Bt(n2);
              this.trace_atn_sim && console.log("computeStartState from ATN state " + t3 + " initialContext=" + s2.toString(this.parser));
              for (let e4 = 0; e4 < t3.transitions.length; e4++) {
                const r3 = t3.transitions[e4].target, o2 = new T({ state: r3, alt: e4 + 1, context: s2 }, null), a2 = new u();
                this.closure(o2, i3, a2, true, n2, false);
              }
              return i3;
            }
            applyPrecedenceFilter(t3) {
              let e3;
              const n2 = [], s2 = new Bt(t3.fullCtx);
              for (let i3 = 0; i3 < t3.items.length; i3++) {
                if (e3 = t3.items[i3], 1 !== e3.alt) continue;
                const r3 = e3.semanticContext.evalPrecedence(this.parser, this._outerContext);
                null !== r3 && (n2[e3.state.stateNumber] = e3.context, r3 !== e3.semanticContext ? s2.add(new T({ semanticContext: r3 }, e3), this.mergeCache) : s2.add(e3, this.mergeCache));
              }
              for (let i3 = 0; i3 < t3.items.length; i3++) if (e3 = t3.items[i3], 1 !== e3.alt) {
                if (!e3.precedenceFilterSuppressed) {
                  const t4 = n2[e3.state.stateNumber] || null;
                  if (null !== t4 && t4.equals(e3.context)) continue;
                }
                s2.add(e3, this.mergeCache);
              }
              return s2;
            }
            getReachableTarget(t3, e3) {
              return t3.matches(e3, 0, this.atn.maxTokenType) ? t3.target : null;
            }
            getPredsForAmbigAlts(t3, e3, n2) {
              let s2 = [];
              for (let n3 = 0; n3 < e3.items.length; n3++) {
                const i4 = e3.items[n3];
                t3.get(i4.alt) && (s2[i4.alt] = d.orContext(s2[i4.alt] || null, i4.semanticContext));
              }
              let i3 = 0;
              for (let t4 = 1; t4 < n2 + 1; t4++) {
                const e4 = s2[t4] || null;
                null === e4 ? s2[t4] = d.NONE : e4 !== d.NONE && (i3 += 1);
              }
              return 0 === i3 && (s2 = null), this.debug && console.log("getPredsForAmbigAlts result " + c(s2)), s2;
            }
            getPredicatePredictions(t3, e3) {
              const n2 = [];
              let s2 = false;
              for (let i3 = 1; i3 < e3.length; i3++) {
                const r3 = e3[i3];
                null !== t3 && t3.get(i3) && n2.push(new $t(r3, i3)), r3 !== d.NONE && (s2 = true);
              }
              return s2 ? n2 : null;
            }
            getSynValidOrSemInvalidAltThatFinishedDecisionEntryRule(t3, e3) {
              const n2 = this.splitAccordingToSemanticValidity(t3, e3), s2 = n2[0], i3 = n2[1];
              let r3 = this.getAltThatFinishedDecisionEntryRule(s2);
              return r3 !== j.INVALID_ALT_NUMBER || i3.items.length > 0 && (r3 = this.getAltThatFinishedDecisionEntryRule(i3), r3 !== j.INVALID_ALT_NUMBER) ? r3 : j.INVALID_ALT_NUMBER;
            }
            getAltThatFinishedDecisionEntryRule(t3) {
              const e3 = [];
              for (let n2 = 0; n2 < t3.items.length; n2++) {
                const s2 = t3.items[n2];
                (s2.reachesIntoOuterContext > 0 || s2.state instanceof _ && s2.context.hasEmptyPath()) && e3.indexOf(s2.alt) < 0 && e3.push(s2.alt);
              }
              return 0 === e3.length ? j.INVALID_ALT_NUMBER : Math.min.apply(null, e3);
            }
            splitAccordingToSemanticValidity(t3, e3) {
              const n2 = new Bt(t3.fullCtx), s2 = new Bt(t3.fullCtx);
              for (let i3 = 0; i3 < t3.items.length; i3++) {
                const r3 = t3.items[i3];
                r3.semanticContext !== d.NONE ? r3.semanticContext.evaluate(this.parser, e3) ? n2.add(r3) : s2.add(r3) : n2.add(r3);
              }
              return [n2, s2];
            }
            evalSemanticContext(t3, e3, n2) {
              const s2 = new Y();
              for (let i3 = 0; i3 < t3.length; i3++) {
                const r3 = t3[i3];
                if (r3.pred === d.NONE) {
                  if (s2.set(r3.alt), !n2) break;
                  continue;
                }
                const o2 = r3.pred.evaluate(this.parser, e3);
                if ((this.debug || this.dfa_debug) && console.log("eval pred " + r3 + "=" + o2), o2 && ((this.debug || this.dfa_debug) && console.log("PREDICT " + r3.alt), s2.set(r3.alt), !n2)) break;
              }
              return s2;
            }
            closure(t3, e3, n2, s2, i3, r3) {
              this.closureCheckingStopState(t3, e3, n2, s2, i3, 0, r3);
            }
            closureCheckingStopState(t3, e3, n2, s2, i3, r3, o2) {
              if ((this.trace_atn_sim || this.debug_closure) && console.log("closure(" + t3.toString(this.parser, true) + ")"), t3.state instanceof _) {
                if (!t3.context.isEmpty()) {
                  for (let a2 = 0; a2 < t3.context.length; a2++) {
                    if (t3.context.getReturnState(a2) === M.EMPTY_RETURN_STATE) {
                      if (i3) {
                        e3.add(new T({ state: t3.state, context: M.EMPTY }, t3), this.mergeCache);
                        continue;
                      }
                      this.debug && console.log("FALLING off rule " + this.getRuleName(t3.state.ruleIndex)), this.closure_(t3, e3, n2, s2, i3, r3, o2);
                      continue;
                    }
                    const l2 = this.atn.states[t3.context.getReturnState(a2)], h2 = t3.context.getParent(a2), c2 = { state: l2, alt: t3.alt, context: h2, semanticContext: t3.semanticContext }, u2 = new T(c2, null);
                    u2.reachesIntoOuterContext = t3.reachesIntoOuterContext, this.closureCheckingStopState(u2, e3, n2, s2, i3, r3 - 1, o2);
                  }
                  return;
                }
                if (i3) return void e3.add(t3, this.mergeCache);
                this.debug && console.log("FALLING off rule " + this.getRuleName(t3.state.ruleIndex));
              }
              this.closure_(t3, e3, n2, s2, i3, r3, o2);
            }
            closure_(t3, e3, n2, s2, i3, r3, o2) {
              const a2 = t3.state;
              a2.epsilonOnlyTransitions || e3.add(t3, this.mergeCache);
              for (let l2 = 0; l2 < a2.transitions.length; l2++) {
                if (0 === l2 && this.canDropLoopEntryEdgeInLeftRecursiveRule(t3)) continue;
                const h2 = a2.transitions[l2], c2 = s2 && !(h2 instanceof ht), u2 = this.getEpsilonTarget(t3, h2, c2, 0 === r3, i3, o2);
                if (null !== u2) {
                  let s3 = r3;
                  if (t3.state instanceof _) {
                    if (null !== this._dfa && this._dfa.precedenceDfa && h2.outermostPrecedenceReturn === this._dfa.atnStartState.ruleIndex && (u2.precedenceFilterSuppressed = true), u2.reachesIntoOuterContext += 1, n2.getOrAdd(u2) !== u2) continue;
                    e3.dipsIntoOuterContext = true, s3 -= 1, this.debug && console.log("dips into outer ctx: " + u2);
                  } else {
                    if (!h2.isEpsilon && n2.getOrAdd(u2) !== u2) continue;
                    h2 instanceof A && s3 >= 0 && (s3 += 1);
                  }
                  this.closureCheckingStopState(u2, e3, n2, c2, i3, s3, o2);
                }
              }
            }
            canDropLoopEntryEdgeInLeftRecursiveRule(t3) {
              const e3 = t3.state;
              if (e3.stateType !== E.STAR_LOOP_ENTRY) return false;
              if (e3.stateType !== E.STAR_LOOP_ENTRY || !e3.isPrecedenceDecision || t3.context.isEmpty() || t3.context.hasEmptyPath()) return false;
              const n2 = t3.context.length;
              for (let s3 = 0; s3 < n2; s3++) if (this.atn.states[t3.context.getReturnState(s3)].ruleIndex !== e3.ruleIndex) return false;
              const s2 = e3.transitions[0].target.endState.stateNumber, i3 = this.atn.states[s2];
              for (let s3 = 0; s3 < n2; s3++) {
                const n3 = t3.context.getReturnState(s3), r3 = this.atn.states[n3];
                if (1 !== r3.transitions.length || !r3.transitions[0].isEpsilon) return false;
                const o2 = r3.transitions[0].target;
                if (!(r3.stateType === E.BLOCK_END && o2 === e3 || r3 === i3 || o2 === i3 || o2.stateType === E.BLOCK_END && 1 === o2.transitions.length && o2.transitions[0].isEpsilon && o2.transitions[0].target === e3)) return false;
              }
              return true;
            }
            getRuleName(t3) {
              return null !== this.parser && t3 >= 0 ? this.parser.ruleNames[t3] : "<rule " + t3 + ">";
            }
            getEpsilonTarget(e3, n2, s2, i3, r3, o2) {
              switch (n2.serializationType) {
                case C.RULE:
                  return this.ruleTransition(e3, n2);
                case C.PRECEDENCE:
                  return this.precedenceTransition(e3, n2, s2, i3, r3);
                case C.PREDICATE:
                  return this.predTransition(e3, n2, s2, i3, r3);
                case C.ACTION:
                  return this.actionTransition(e3, n2);
                case C.EPSILON:
                  return new T({ state: n2.target }, e3);
                case C.ATOM:
                case C.RANGE:
                case C.SET:
                  return o2 && n2.matches(t2.EOF, 0, 1) ? new T({ state: n2.target }, e3) : null;
                default:
                  return null;
              }
            }
            actionTransition(t3, e3) {
              if (this.debug) {
                const t4 = -1 === e3.actionIndex ? 65535 : e3.actionIndex;
                console.log("ACTION edge " + e3.ruleIndex + ":" + t4);
              }
              return new T({ state: e3.target }, t3);
            }
            precedenceTransition(t3, e3, n2, s2, i3) {
              this.debug && (console.log("PRED (collectPredicates=" + n2 + ") " + e3.precedence + ">=_p, ctx dependent=true"), null !== this.parser && console.log("context surrounding pred is " + c(this.parser.getRuleInvocationStack())));
              let r3 = null;
              if (n2 && s2) if (i3) {
                const n3 = this._input.index;
                this._input.seek(this._startIndex);
                const s3 = e3.getPredicate().evaluate(this.parser, this._outerContext);
                this._input.seek(n3), s3 && (r3 = new T({ state: e3.target }, t3));
              } else {
                const n3 = d.andContext(t3.semanticContext, e3.getPredicate());
                r3 = new T({ state: e3.target, semanticContext: n3 }, t3);
              }
              else r3 = new T({ state: e3.target }, t3);
              return this.debug && console.log("config from pred transition=" + r3), r3;
            }
            predTransition(t3, e3, n2, s2, i3) {
              this.debug && (console.log("PRED (collectPredicates=" + n2 + ") " + e3.ruleIndex + ":" + e3.predIndex + ", ctx dependent=" + e3.isCtxDependent), null !== this.parser && console.log("context surrounding pred is " + c(this.parser.getRuleInvocationStack())));
              let r3 = null;
              if (n2 && (e3.isCtxDependent && s2 || !e3.isCtxDependent)) if (i3) {
                const n3 = this._input.index;
                this._input.seek(this._startIndex);
                const s3 = e3.getPredicate().evaluate(this.parser, this._outerContext);
                this._input.seek(n3), s3 && (r3 = new T({ state: e3.target }, t3));
              } else {
                const n3 = d.andContext(t3.semanticContext, e3.getPredicate());
                r3 = new T({ state: e3.target, semanticContext: n3 }, t3);
              }
              else r3 = new T({ state: e3.target }, t3);
              return this.debug && console.log("config from pred transition=" + r3), r3;
            }
            ruleTransition(t3, e3) {
              this.debug && console.log("CALL rule " + this.getRuleName(e3.target.ruleIndex) + ", ctx=" + t3.context);
              const n2 = e3.followState, s2 = B.create(t3.context, n2.stateNumber);
              return new T({ state: e3.target, context: s2 }, t3);
            }
            getConflictingAlts(t3) {
              const e3 = Qt.getConflictingAltSubsets(t3);
              return Qt.getAlts(e3);
            }
            getConflictingAltsOrUniqueAlt(t3) {
              let e3 = null;
              return t3.uniqueAlt !== j.INVALID_ALT_NUMBER ? (e3 = new Y(), e3.set(t3.uniqueAlt)) : e3 = t3.conflictingAlts, e3;
            }
            getTokenName(e3) {
              if (e3 === t2.EOF) return "EOF";
              if (null !== this.parser && null !== this.parser.literalNames) {
                if (!(e3 >= this.parser.literalNames.length && e3 >= this.parser.symbolicNames.length)) return (this.parser.literalNames[e3] || this.parser.symbolicNames[e3]) + "<" + e3 + ">";
                console.log(e3 + " ttype out of range: " + this.parser.literalNames), console.log("" + this.parser.getInputStream().getTokens());
              }
              return "" + e3;
            }
            getLookaheadName(t3) {
              return this.getTokenName(t3.LA(1));
            }
            dumpDeadEndConfigs(t3) {
              console.log("dead end configs: ");
              const e3 = t3.getDeadEndConfigs();
              for (let t4 = 0; t4 < e3.length; t4++) {
                const n2 = e3[t4];
                let s2 = "no edges";
                if (n2.state.transitions.length > 0) {
                  const t5 = n2.state.transitions[0];
                  t5 instanceof at ? s2 = "Atom " + this.getTokenName(t5.label) : t5 instanceof N && (s2 = (t5 instanceof k ? "~" : "") + "Set " + t5.set);
                }
                console.error(n2.toString(this.parser, true) + ":" + s2);
              }
            }
            noViableAlt(t3, e3, n2, s2) {
              return new Zt(this.parser, t3, t3.get(s2), t3.LT(1), n2, e3);
            }
            getUniqueAlt(t3) {
              let e3 = j.INVALID_ALT_NUMBER;
              for (let n2 = 0; n2 < t3.items.length; n2++) {
                const s2 = t3.items[n2];
                if (e3 === j.INVALID_ALT_NUMBER) e3 = s2.alt;
                else if (s2.alt !== e3) return j.INVALID_ALT_NUMBER;
              }
              return e3;
            }
            addDFAEdge(t3, e3, n2, s2) {
              if (this.debug && console.log("EDGE " + e3 + " -> " + s2 + " upon " + this.getTokenName(n2)), null === s2) return null;
              if (s2 = this.addDFAState(t3, s2), null === e3 || n2 < -1 || n2 > this.atn.maxTokenType) return s2;
              if (null === e3.edges && (e3.edges = []), e3.edges[n2 + 1] = s2, this.debug) {
                const e4 = null === this.parser ? null : this.parser.literalNames, n3 = null === this.parser ? null : this.parser.symbolicNames;
                console.log("DFA=\n" + t3.toString(e4, n3));
              }
              return s2;
            }
            addDFAState(t3, e3) {
              if (e3 === zt.ERROR) return e3;
              const n2 = t3.states.get(e3);
              return null !== n2 ? (this.trace_atn_sim && console.log("addDFAState " + e3 + " exists"), n2) : (e3.stateNumber = t3.states.length, e3.configs.readOnly || (e3.configs.optimizeConfigs(this), e3.configs.setReadonly(true)), this.trace_atn_sim && console.log("addDFAState new " + e3), t3.states.add(e3), this.debug && console.log("adding new DFA state: " + e3), e3);
            }
            reportAttemptingFullContext(t3, e3, n2, s2, i3) {
              if (this.debug || this.retry_debug) {
                const e4 = new S(s2, i3 + 1);
                console.log("reportAttemptingFullContext decision=" + t3.decision + ":" + n2 + ", input=" + this.parser.getTokenStream().getText(e4));
              }
              null !== this.parser && this.parser.getErrorListener().reportAttemptingFullContext(this.parser, t3, s2, i3, e3, n2);
            }
            reportContextSensitivity(t3, e3, n2, s2, i3) {
              if (this.debug || this.retry_debug) {
                const e4 = new S(s2, i3 + 1);
                console.log("reportContextSensitivity decision=" + t3.decision + ":" + n2 + ", input=" + this.parser.getTokenStream().getText(e4));
              }
              null !== this.parser && this.parser.getErrorListener().reportContextSensitivity(this.parser, t3, s2, i3, e3, n2);
            }
            reportAmbiguity(t3, e3, n2, s2, i3, r3, o2) {
              if (this.debug || this.retry_debug) {
                const t4 = new S(n2, s2 + 1);
                console.log("reportAmbiguity " + r3 + ":" + o2 + ", input=" + this.parser.getTokenStream().getText(t4));
              }
              null !== this.parser && this.parser.getErrorListener().reportAmbiguity(this.parser, t3, n2, s2, i3, r3, o2);
            }
          }
          class ne {
            constructor() {
              this.cache = new z();
            }
            add(t3) {
              if (t3 === M.EMPTY) return M.EMPTY;
              const e3 = this.cache.get(t3) || null;
              return null !== e3 ? e3 : (this.cache.set(t3, t3), t3);
            }
            get(t3) {
              return this.cache.get(t3) || null;
            }
            get length() {
              return this.cache.length;
            }
          }
          const se = { ATN: j, ATNDeserializer: It, LexerATNSimulator: Wt, ParserATNSimulator: ee, PredictionMode: Qt, PredictionContextCache: ne };
          class ie {
            constructor(t3, e3, n2) {
              this.dfa = t3, this.literalNames = e3 || [], this.symbolicNames = n2 || [];
            }
            toString() {
              if (null === this.dfa.s0) return null;
              let t3 = "";
              const e3 = this.dfa.sortedStates();
              for (let n2 = 0; n2 < e3.length; n2++) {
                const s2 = e3[n2];
                if (null !== s2.edges) {
                  const e4 = s2.edges.length;
                  for (let n3 = 0; n3 < e4; n3++) {
                    const e5 = s2.edges[n3] || null;
                    null !== e5 && 2147483647 !== e5.stateNumber && (t3 = t3.concat(this.getStateString(s2)), t3 = t3.concat("-"), t3 = t3.concat(this.getEdgeLabel(n3)), t3 = t3.concat("->"), t3 = t3.concat(this.getStateString(e5)), t3 = t3.concat("\n"));
                  }
                }
              }
              return 0 === t3.length ? null : t3;
            }
            getEdgeLabel(t3) {
              return 0 === t3 ? "EOF" : null !== this.literalNames || null !== this.symbolicNames ? this.literalNames[t3 - 1] || this.symbolicNames[t3 - 1] : String.fromCharCode(t3 - 1);
            }
            getStateString(t3) {
              const e3 = (t3.isAcceptState ? ":" : "") + "s" + t3.stateNumber + (t3.requiresFullContext ? "^" : "");
              return t3.isAcceptState ? null !== t3.predicates ? e3 + "=>" + c(t3.predicates) : e3 + "=>" + t3.prediction.toString() : e3;
            }
          }
          class re extends ie {
            constructor(t3) {
              super(t3, null);
            }
            getEdgeLabel(t3) {
              return "'" + String.fromCharCode(t3) + "'";
            }
          }
          class oe {
            constructor(t3, e3) {
              if (void 0 === e3 && (e3 = 0), this.atnStartState = t3, this.decision = e3, this._states = new u(), this.s0 = null, this.precedenceDfa = false, t3 instanceof st && t3.isPrecedenceDecision) {
                this.precedenceDfa = true;
                const t4 = new Vt(null, new Bt());
                t4.edges = [], t4.isAcceptState = false, t4.requiresFullContext = false, this.s0 = t4;
              }
            }
            getPrecedenceStartState(t3) {
              if (!this.precedenceDfa) throw "Only precedence DFAs may contain a precedence start state.";
              return t3 < 0 || t3 >= this.s0.edges.length ? null : this.s0.edges[t3] || null;
            }
            setPrecedenceStartState(t3, e3) {
              if (!this.precedenceDfa) throw "Only precedence DFAs may contain a precedence start state.";
              t3 < 0 || (this.s0.edges[t3] = e3);
            }
            setPrecedenceDfa(t3) {
              if (this.precedenceDfa !== t3) {
                if (this._states = new u(), t3) {
                  const t4 = new Vt(null, new Bt());
                  t4.edges = [], t4.isAcceptState = false, t4.requiresFullContext = false, this.s0 = t4;
                } else this.s0 = null;
                this.precedenceDfa = t3;
              }
            }
            sortedStates() {
              return this._states.values().sort(function(t3, e3) {
                return t3.stateNumber - e3.stateNumber;
              });
            }
            toString(t3, e3) {
              return t3 = t3 || null, e3 = e3 || null, null === this.s0 ? "" : new ie(this, t3, e3).toString();
            }
            toLexerString() {
              return null === this.s0 ? "" : new re(this).toString();
            }
            get states() {
              return this._states;
            }
          }
          const ae = { DFA: oe, DFASerializer: ie, LexerDFASerializer: re, PredPrediction: $t }, le = { PredictionContext: M }, he = { Interval: S, IntervalSet: m };
          class ce {
            visitTerminal(t3) {
            }
            visitErrorNode(t3) {
            }
            enterEveryRule(t3) {
            }
            exitEveryRule(t3) {
            }
          }
          class ue {
            visit(t3) {
              return Array.isArray(t3) ? t3.map(function(t4) {
                return t4.accept(this);
              }, this) : t3.accept(this);
            }
            visitChildren(t3) {
              return t3.children ? this.visit(t3.children) : null;
            }
            visitTerminal(t3) {
            }
            visitErrorNode(t3) {
            }
          }
          class de {
            walk(t3, e3) {
              if (e3 instanceof P || void 0 !== e3.isErrorNode && e3.isErrorNode()) t3.visitErrorNode(e3);
              else if (e3 instanceof w) t3.visitTerminal(e3);
              else {
                this.enterRule(t3, e3);
                for (let n2 = 0; n2 < e3.getChildCount(); n2++) {
                  const s2 = e3.getChild(n2);
                  this.walk(t3, s2);
                }
                this.exitRule(t3, e3);
              }
            }
            enterRule(t3, e3) {
              const n2 = e3.ruleContext;
              t3.enterEveryRule(n2), n2.enterRule(t3);
            }
            exitRule(t3, e3) {
              const n2 = e3.ruleContext;
              n2.exitRule(t3), t3.exitEveryRule(n2);
            }
          }
          de.DEFAULT = new de();
          const ge = { Trees: D, RuleNode: v, ErrorNode: P, TerminalNode: w, ParseTreeListener: ce, ParseTreeVisitor: ue, ParseTreeWalker: de };
          class pe extends bt {
            constructor(t3) {
              super({ message: "", recognizer: t3, input: t3.getInputStream(), ctx: t3._ctx }), this.offendingToken = t3.getCurrentToken();
            }
          }
          class fe extends bt {
            constructor(t3, e3, n2) {
              super({ message: xe(e3, n2 || null), recognizer: t3, input: t3.getInputStream(), ctx: t3._ctx });
              const s2 = t3._interp.atn.states[t3.state].transitions[0];
              s2 instanceof dt ? (this.ruleIndex = s2.ruleIndex, this.predicateIndex = s2.predIndex) : (this.ruleIndex = 0, this.predicateIndex = 0), this.predicate = e3, this.offendingToken = t3.getCurrentToken();
            }
          }
          function xe(t3, e3) {
            return null !== e3 ? e3 : "failed predicate: {" + t3 + "}?";
          }
          class Te extends yt {
            constructor(t3) {
              super(), t3 = t3 || true, this.exactOnly = t3;
            }
            reportAmbiguity(t3, e3, n2, s2, i3, r3, o2) {
              if (this.exactOnly && !i3) return;
              const a2 = "reportAmbiguity d=" + this.getDecisionDescription(t3, e3) + ": ambigAlts=" + this.getConflictingAlts(r3, o2) + ", input='" + t3.getTokenStream().getText(new S(n2, s2)) + "'";
              t3.notifyErrorListeners(a2);
            }
            reportAttemptingFullContext(t3, e3, n2, s2, i3, r3) {
              const o2 = "reportAttemptingFullContext d=" + this.getDecisionDescription(t3, e3) + ", input='" + t3.getTokenStream().getText(new S(n2, s2)) + "'";
              t3.notifyErrorListeners(o2);
            }
            reportContextSensitivity(t3, e3, n2, s2, i3, r3) {
              const o2 = "reportContextSensitivity d=" + this.getDecisionDescription(t3, e3) + ", input='" + t3.getTokenStream().getText(new S(n2, s2)) + "'";
              t3.notifyErrorListeners(o2);
            }
            getDecisionDescription(t3, e3) {
              const n2 = e3.decision, s2 = e3.atnStartState.ruleIndex, i3 = t3.ruleNames;
              if (s2 < 0 || s2 >= i3.length) return "" + n2;
              const r3 = i3[s2] || null;
              return null === r3 || 0 === r3.length ? "" + n2 : `${n2} (${r3})`;
            }
            getConflictingAlts(t3, e3) {
              if (null !== t3) return t3;
              const n2 = new Y();
              for (let t4 = 0; t4 < e3.items.length; t4++) n2.set(e3.items[t4].alt);
              return `{${n2.values().join(", ")}}`;
            }
          }
          class Se extends Error {
            constructor() {
              super(), Error.captureStackTrace(this, Se);
            }
          }
          class me {
            reset(t3) {
            }
            recoverInline(t3) {
            }
            recover(t3, e3) {
            }
            sync(t3) {
            }
            inErrorRecoveryMode(t3) {
            }
            reportError(t3) {
            }
          }
          class Ee extends me {
            constructor() {
              super(), this.errorRecoveryMode = false, this.lastErrorIndex = -1, this.lastErrorStates = null, this.nextTokensContext = null, this.nextTokenState = 0;
            }
            reset(t3) {
              this.endErrorCondition(t3);
            }
            beginErrorCondition(t3) {
              this.errorRecoveryMode = true;
            }
            inErrorRecoveryMode(t3) {
              return this.errorRecoveryMode;
            }
            endErrorCondition(t3) {
              this.errorRecoveryMode = false, this.lastErrorStates = null, this.lastErrorIndex = -1;
            }
            reportMatch(t3) {
              this.endErrorCondition(t3);
            }
            reportError(t3, e3) {
              this.inErrorRecoveryMode(t3) || (this.beginErrorCondition(t3), e3 instanceof Zt ? this.reportNoViableAlternative(t3, e3) : e3 instanceof pe ? this.reportInputMismatch(t3, e3) : e3 instanceof fe ? this.reportFailedPredicate(t3, e3) : (console.log("unknown recognition error type: " + e3.constructor.name), console.log(e3.stack), t3.notifyErrorListeners(e3.getOffendingToken(), e3.getMessage(), e3)));
            }
            recover(t3, e3) {
              this.lastErrorIndex === t3.getInputStream().index && null !== this.lastErrorStates && this.lastErrorStates.indexOf(t3.state) >= 0 && t3.consume(), this.lastErrorIndex = t3._input.index, null === this.lastErrorStates && (this.lastErrorStates = []), this.lastErrorStates.push(t3.state);
              const n2 = this.getErrorRecoverySet(t3);
              this.consumeUntil(t3, n2);
            }
            sync(e3) {
              if (this.inErrorRecoveryMode(e3)) return;
              const n2 = e3._interp.atn.states[e3.state], s2 = e3.getTokenStream().LA(1), i3 = e3.atn.nextTokens(n2);
              if (i3.contains(s2)) return this.nextTokensContext = null, void (this.nextTokenState = E.INVALID_STATE_NUMBER);
              if (i3.contains(t2.EPSILON)) null === this.nextTokensContext && (this.nextTokensContext = e3._ctx, this.nextTokensState = e3._stateNumber);
              else switch (n2.stateType) {
                case E.BLOCK_START:
                case E.STAR_BLOCK_START:
                case E.PLUS_BLOCK_START:
                case E.STAR_LOOP_ENTRY:
                  if (null !== this.singleTokenDeletion(e3)) return;
                  throw new pe(e3);
                case E.PLUS_LOOP_BACK:
                case E.STAR_LOOP_BACK: {
                  this.reportUnwantedToken(e3);
                  const t3 = new m();
                  t3.addSet(e3.getExpectedTokens());
                  const n3 = t3.addSet(this.getErrorRecoverySet(e3));
                  this.consumeUntil(e3, n3);
                }
              }
            }
            reportNoViableAlternative(e3, n2) {
              const s2 = e3.getTokenStream();
              let i3;
              i3 = null !== s2 ? n2.startToken.type === t2.EOF ? "<EOF>" : s2.getText(new S(n2.startToken.tokenIndex, n2.offendingToken.tokenIndex)) : "<unknown input>";
              const r3 = "no viable alternative at input " + this.escapeWSAndQuote(i3);
              e3.notifyErrorListeners(r3, n2.offendingToken, n2);
            }
            reportInputMismatch(t3, e3) {
              const n2 = "mismatched input " + this.getTokenErrorDisplay(e3.offendingToken) + " expecting " + e3.getExpectedTokens().toString(t3.literalNames, t3.symbolicNames);
              t3.notifyErrorListeners(n2, e3.offendingToken, e3);
            }
            reportFailedPredicate(t3, e3) {
              const n2 = "rule " + t3.ruleNames[t3._ctx.ruleIndex] + " " + e3.message;
              t3.notifyErrorListeners(n2, e3.offendingToken, e3);
            }
            reportUnwantedToken(t3) {
              if (this.inErrorRecoveryMode(t3)) return;
              this.beginErrorCondition(t3);
              const e3 = t3.getCurrentToken(), n2 = "extraneous input " + this.getTokenErrorDisplay(e3) + " expecting " + this.getExpectedTokens(t3).toString(t3.literalNames, t3.symbolicNames);
              t3.notifyErrorListeners(n2, e3, null);
            }
            reportMissingToken(t3) {
              if (this.inErrorRecoveryMode(t3)) return;
              this.beginErrorCondition(t3);
              const e3 = t3.getCurrentToken(), n2 = "missing " + this.getExpectedTokens(t3).toString(t3.literalNames, t3.symbolicNames) + " at " + this.getTokenErrorDisplay(e3);
              t3.notifyErrorListeners(n2, e3, null);
            }
            recoverInline(t3) {
              const e3 = this.singleTokenDeletion(t3);
              if (null !== e3) return t3.consume(), e3;
              if (this.singleTokenInsertion(t3)) return this.getMissingSymbol(t3);
              throw new pe(t3);
            }
            singleTokenInsertion(t3) {
              const e3 = t3.getTokenStream().LA(1), n2 = t3._interp.atn, s2 = n2.states[t3.state].transitions[0].target;
              return !!n2.nextTokens(s2, t3._ctx).contains(e3) && (this.reportMissingToken(t3), true);
            }
            singleTokenDeletion(t3) {
              const e3 = t3.getTokenStream().LA(2);
              if (this.getExpectedTokens(t3).contains(e3)) {
                this.reportUnwantedToken(t3), t3.consume();
                const e4 = t3.getCurrentToken();
                return this.reportMatch(t3), e4;
              }
              return null;
            }
            getMissingSymbol(e3) {
              const n2 = e3.getCurrentToken(), s2 = this.getExpectedTokens(e3).first();
              let i3;
              i3 = s2 === t2.EOF ? "<missing EOF>" : "<missing " + e3.literalNames[s2] + ">";
              let r3 = n2;
              const o2 = e3.getTokenStream().LT(-1);
              return r3.type === t2.EOF && null !== o2 && (r3 = o2), e3.getTokenFactory().create(r3.source, s2, i3, t2.DEFAULT_CHANNEL, -1, -1, r3.line, r3.column);
            }
            getExpectedTokens(t3) {
              return t3.getExpectedTokens();
            }
            getTokenErrorDisplay(e3) {
              if (null === e3) return "<no token>";
              let n2 = e3.text;
              return null === n2 && (n2 = e3.type === t2.EOF ? "<EOF>" : "<" + e3.type + ">"), this.escapeWSAndQuote(n2);
            }
            escapeWSAndQuote(t3) {
              return "'" + (t3 = (t3 = (t3 = t3.replace(/\n/g, "\\n")).replace(/\r/g, "\\r")).replace(/\t/g, "\\t")) + "'";
            }
            getErrorRecoverySet(e3) {
              const n2 = e3._interp.atn;
              let s2 = e3._ctx;
              const i3 = new m();
              for (; null !== s2 && s2.invokingState >= 0; ) {
                const t3 = n2.states[s2.invokingState].transitions[0], e4 = n2.nextTokens(t3.followState);
                i3.addSet(e4), s2 = s2.parentCtx;
              }
              return i3.removeOne(t2.EPSILON), i3;
            }
            consumeUntil(e3, n2) {
              let s2 = e3.getTokenStream().LA(1);
              for (; s2 !== t2.EOF && !n2.contains(s2); ) e3.consume(), s2 = e3.getTokenStream().LA(1);
            }
          }
          class _e extends Ee {
            constructor() {
              super();
            }
            recover(t3, e3) {
              let n2 = t3._ctx;
              for (; null !== n2; ) n2.exception = e3, n2 = n2.parentCtx;
              throw new Se(e3);
            }
            recoverInline(t3) {
              this.recover(t3, new pe(t3));
            }
            sync(t3) {
            }
          }
          const Ce = { RecognitionException: bt, NoViableAltException: Zt, LexerNoViableAltException: Dt, InputMismatchException: pe, FailedPredicateException: fe, DiagnosticErrorListener: Te, BailErrorStrategy: _e, DefaultErrorStrategy: Ee, ErrorListener: yt };
          class Ae {
            constructor(t3, e3) {
              if (this.name = "<empty>", this.strdata = t3, this.decodeToUnicodeCodePoints = e3 || false, this._index = 0, this.data = [], this.decodeToUnicodeCodePoints) for (let t4 = 0; t4 < this.strdata.length; ) {
                const e4 = this.strdata.codePointAt(t4);
                this.data.push(e4), t4 += e4 <= 65535 ? 1 : 2;
              }
              else {
                this.data = new Array(this.strdata.length);
                for (let t4 = 0; t4 < this.strdata.length; t4++) this.data[t4] = this.strdata.charCodeAt(t4);
              }
              this._size = this.data.length;
            }
            reset() {
              this._index = 0;
            }
            consume() {
              if (this._index >= this._size) throw "cannot consume EOF";
              this._index += 1;
            }
            LA(e3) {
              if (0 === e3) return 0;
              e3 < 0 && (e3 += 1);
              const n2 = this._index + e3 - 1;
              return n2 < 0 || n2 >= this._size ? t2.EOF : this.data[n2];
            }
            LT(t3) {
              return this.LA(t3);
            }
            mark() {
              return -1;
            }
            release(t3) {
            }
            seek(t3) {
              t3 <= this._index ? this._index = t3 : this._index = Math.min(t3, this._size);
            }
            getText(t3, e3) {
              if (e3 >= this._size && (e3 = this._size - 1), t3 >= this._size) return "";
              if (this.decodeToUnicodeCodePoints) {
                let n2 = "";
                for (let s2 = t3; s2 <= e3; s2++) n2 += String.fromCodePoint(this.data[s2]);
                return n2;
              }
              return this.strdata.slice(t3, e3 + 1);
            }
            toString() {
              return this.strdata;
            }
            get index() {
              return this._index;
            }
            get size() {
              return this._size;
            }
          }
          class Ne extends Ae {
            constructor(t3, e3) {
              super(t3, e3);
            }
          }
          var ke = n(763);
          const Ie = "undefined" != typeof process && null != process.versions && null != process.versions.node;
          class ye extends Ne {
            static fromPath(t3, e3, n2) {
              if (!Ie) throw new Error("FileStream is only available when running in Node!");
              ke.readFile(t3, e3, function(t4, e4) {
                let s2 = null;
                null !== e4 && (s2 = new Ae(e4, true)), n2(t4, s2);
              });
            }
            constructor(t3, e3, n2) {
              if (!Ie) throw new Error("FileStream is only available when running in Node!");
              super(ke.readFileSync(t3, e3 || "utf-8"), n2), this.fileName = t3;
            }
          }
          const Le = { fromString: function(t3) {
            return new Ae(t3, true);
          }, fromBlob: function(t3, e3, n2, s2) {
            const i3 = new window.FileReader();
            i3.onload = function(t4) {
              const e4 = new Ae(t4.target.result, true);
              n2(e4);
            }, i3.onerror = s2, i3.readAsText(t3, e3);
          }, fromBuffer: function(t3, e3) {
            return new Ae(t3.toString(e3), true);
          }, fromPath: function(t3, e3, n2) {
            ye.fromPath(t3, e3, n2);
          }, fromPathSync: function(t3, e3) {
            return new ye(t3, e3);
          } }, Oe = { arrayToString: c, stringToCharArray: function(t3) {
            let e3 = new Uint16Array(t3.length);
            for (let n2 = 0; n2 < t3.length; n2++) e3[n2] = t3.charCodeAt(n2);
            return e3;
          } };
          class Re {
          }
          class ve extends Re {
            constructor(t3) {
              super(), this.tokenSource = t3, this.tokens = [], this.index = -1, this.fetchedEOF = false;
            }
            mark() {
              return 0;
            }
            release(t3) {
            }
            reset() {
              this.seek(0);
            }
            seek(t3) {
              this.lazyInit(), this.index = this.adjustSeekIndex(t3);
            }
            get size() {
              return this.tokens.length;
            }
            get(t3) {
              return this.lazyInit(), this.tokens[t3];
            }
            consume() {
              let e3 = false;
              if (e3 = this.index >= 0 && (this.fetchedEOF ? this.index < this.tokens.length - 1 : this.index < this.tokens.length), !e3 && this.LA(1) === t2.EOF) throw "cannot consume EOF";
              this.sync(this.index + 1) && (this.index = this.adjustSeekIndex(this.index + 1));
            }
            sync(t3) {
              const e3 = t3 - this.tokens.length + 1;
              return !(e3 > 0) || this.fetch(e3) >= e3;
            }
            fetch(e3) {
              if (this.fetchedEOF) return 0;
              for (let n2 = 0; n2 < e3; n2++) {
                const e4 = this.tokenSource.nextToken();
                if (e4.tokenIndex = this.tokens.length, this.tokens.push(e4), e4.type === t2.EOF) return this.fetchedEOF = true, n2 + 1;
              }
              return e3;
            }
            getTokens(e3, n2, s2) {
              if (void 0 === s2 && (s2 = null), e3 < 0 || n2 < 0) return null;
              this.lazyInit();
              const i3 = [];
              n2 >= this.tokens.length && (n2 = this.tokens.length - 1);
              for (let r3 = e3; r3 < n2; r3++) {
                const e4 = this.tokens[r3];
                if (e4.type === t2.EOF) break;
                (null === s2 || s2.contains(e4.type)) && i3.push(e4);
              }
              return i3;
            }
            LA(t3) {
              return this.LT(t3).type;
            }
            LB(t3) {
              return this.index - t3 < 0 ? null : this.tokens[this.index - t3];
            }
            LT(t3) {
              if (this.lazyInit(), 0 === t3) return null;
              if (t3 < 0) return this.LB(-t3);
              const e3 = this.index + t3 - 1;
              return this.sync(e3), e3 >= this.tokens.length ? this.tokens[this.tokens.length - 1] : this.tokens[e3];
            }
            adjustSeekIndex(t3) {
              return t3;
            }
            lazyInit() {
              -1 === this.index && this.setup();
            }
            setup() {
              this.sync(0), this.index = this.adjustSeekIndex(0);
            }
            setTokenSource(t3) {
              this.tokenSource = t3, this.tokens = [], this.index = -1, this.fetchedEOF = false;
            }
            nextTokenOnChannel(e3, n2) {
              if (this.sync(e3), e3 >= this.tokens.length) return -1;
              let s2 = this.tokens[e3];
              for (; s2.channel !== n2; ) {
                if (s2.type === t2.EOF) return -1;
                e3 += 1, this.sync(e3), s2 = this.tokens[e3];
              }
              return e3;
            }
            previousTokenOnChannel(t3, e3) {
              for (; t3 >= 0 && this.tokens[t3].channel !== e3; ) t3 -= 1;
              return t3;
            }
            getHiddenTokensToRight(t3, e3) {
              if (void 0 === e3 && (e3 = -1), this.lazyInit(), t3 < 0 || t3 >= this.tokens.length) throw t3 + " not in 0.." + this.tokens.length - 1;
              const n2 = this.nextTokenOnChannel(t3 + 1, Ft.DEFAULT_TOKEN_CHANNEL), s2 = t3 + 1, i3 = -1 === n2 ? this.tokens.length - 1 : n2;
              return this.filterForChannel(s2, i3, e3);
            }
            getHiddenTokensToLeft(t3, e3) {
              if (void 0 === e3 && (e3 = -1), this.lazyInit(), t3 < 0 || t3 >= this.tokens.length) throw t3 + " not in 0.." + this.tokens.length - 1;
              const n2 = this.previousTokenOnChannel(t3 - 1, Ft.DEFAULT_TOKEN_CHANNEL);
              if (n2 === t3 - 1) return null;
              const s2 = n2 + 1, i3 = t3 - 1;
              return this.filterForChannel(s2, i3, e3);
            }
            filterForChannel(t3, e3, n2) {
              const s2 = [];
              for (let i3 = t3; i3 < e3 + 1; i3++) {
                const t4 = this.tokens[i3];
                -1 === n2 ? t4.channel !== Ft.DEFAULT_TOKEN_CHANNEL && s2.push(t4) : t4.channel === n2 && s2.push(t4);
              }
              return 0 === s2.length ? null : s2;
            }
            getSourceName() {
              return this.tokenSource.getSourceName();
            }
            getText(e3) {
              this.lazyInit(), this.fill(), e3 || (e3 = new S(0, this.tokens.length - 1));
              let n2 = e3.start;
              n2 instanceof t2 && (n2 = n2.tokenIndex);
              let s2 = e3.stop;
              if (s2 instanceof t2 && (s2 = s2.tokenIndex), null === n2 || null === s2 || n2 < 0 || s2 < 0) return "";
              s2 >= this.tokens.length && (s2 = this.tokens.length - 1);
              let i3 = "";
              for (let e4 = n2; e4 < s2 + 1; e4++) {
                const n3 = this.tokens[e4];
                if (n3.type === t2.EOF) break;
                i3 += n3.text;
              }
              return i3;
            }
            fill() {
              for (this.lazyInit(); 1e3 === this.fetch(1e3); ) ;
            }
          }
          Object.defineProperty(ve, "size", { get: function() {
            return this.tokens.length;
          } });
          class we extends ve {
            constructor(e3, n2) {
              super(e3), this.channel = void 0 === n2 ? t2.DEFAULT_CHANNEL : n2;
            }
            adjustSeekIndex(t3) {
              return this.nextTokenOnChannel(t3, this.channel);
            }
            LB(t3) {
              if (0 === t3 || this.index - t3 < 0) return null;
              let e3 = this.index, n2 = 1;
              for (; n2 <= t3; ) e3 = this.previousTokenOnChannel(e3 - 1, this.channel), n2 += 1;
              return e3 < 0 ? null : this.tokens[e3];
            }
            LT(t3) {
              if (this.lazyInit(), 0 === t3) return null;
              if (t3 < 0) return this.LB(-t3);
              let e3 = this.index, n2 = 1;
              for (; n2 < t3; ) this.sync(e3 + 1) && (e3 = this.nextTokenOnChannel(e3 + 1, this.channel)), n2 += 1;
              return this.tokens[e3];
            }
            getNumberOfOnChannelTokens() {
              let e3 = 0;
              this.fill();
              for (let n2 = 0; n2 < this.tokens.length; n2++) {
                const s2 = this.tokens[n2];
                if (s2.channel === this.channel && (e3 += 1), s2.type === t2.EOF) break;
              }
              return e3;
            }
          }
          class Pe extends ce {
            constructor(t3) {
              super(), this.parser = t3;
            }
            enterEveryRule(t3) {
              console.log("enter   " + this.parser.ruleNames[t3.ruleIndex] + ", LT(1)=" + this.parser._input.LT(1).text);
            }
            visitTerminal(t3) {
              console.log("consume " + t3.symbol + " rule " + this.parser.ruleNames[this.parser._ctx.ruleIndex]);
            }
            exitEveryRule(t3) {
              console.log("exit    " + this.parser.ruleNames[t3.ruleIndex] + ", LT(1)=" + this.parser._input.LT(1).text);
            }
          }
          class be extends Rt {
            constructor(t3) {
              super(), this._input = null, this._errHandler = new Ee(), this._precedenceStack = [], this._precedenceStack.push(0), this._ctx = null, this.buildParseTrees = true, this._tracer = null, this._parseListeners = null, this._syntaxErrors = 0, this.setInputStream(t3);
            }
            reset() {
              null !== this._input && this._input.seek(0), this._errHandler.reset(this), this._ctx = null, this._syntaxErrors = 0, this.setTrace(false), this._precedenceStack = [], this._precedenceStack.push(0), null !== this._interp && this._interp.reset();
            }
            match(t3) {
              let e3 = this.getCurrentToken();
              return e3.type === t3 ? (this._errHandler.reportMatch(this), this.consume()) : (e3 = this._errHandler.recoverInline(this), this.buildParseTrees && -1 === e3.tokenIndex && this._ctx.addErrorNode(e3)), e3;
            }
            matchWildcard() {
              let t3 = this.getCurrentToken();
              return t3.type > 0 ? (this._errHandler.reportMatch(this), this.consume()) : (t3 = this._errHandler.recoverInline(this), this.buildParseTrees && -1 === t3.tokenIndex && this._ctx.addErrorNode(t3)), t3;
            }
            getParseListeners() {
              return this._parseListeners || [];
            }
            addParseListener(t3) {
              if (null === t3) throw "listener";
              null === this._parseListeners && (this._parseListeners = []), this._parseListeners.push(t3);
            }
            removeParseListener(t3) {
              if (null !== this._parseListeners) {
                const e3 = this._parseListeners.indexOf(t3);
                e3 >= 0 && this._parseListeners.splice(e3, 1), 0 === this._parseListeners.length && (this._parseListeners = null);
              }
            }
            removeParseListeners() {
              this._parseListeners = null;
            }
            triggerEnterRuleEvent() {
              if (null !== this._parseListeners) {
                const t3 = this._ctx;
                this._parseListeners.forEach(function(e3) {
                  e3.enterEveryRule(t3), t3.enterRule(e3);
                });
              }
            }
            triggerExitRuleEvent() {
              if (null !== this._parseListeners) {
                const t3 = this._ctx;
                this._parseListeners.slice(0).reverse().forEach(function(e3) {
                  t3.exitRule(e3), e3.exitEveryRule(t3);
                });
              }
            }
            getTokenFactory() {
              return this._input.tokenSource._factory;
            }
            setTokenFactory(t3) {
              this._input.tokenSource._factory = t3;
            }
            getATNWithBypassAlts() {
              const t3 = this.getSerializedATN();
              if (null === t3) throw "The current parser does not support an ATN with bypass alternatives.";
              let e3 = this.bypassAltsAtnCache[t3];
              if (null === e3) {
                const n2 = new ft();
                n2.generateRuleBypassTransitions = true, e3 = new It(n2).deserialize(t3), this.bypassAltsAtnCache[t3] = e3;
              }
              return e3;
            }
            getInputStream() {
              return this.getTokenStream();
            }
            setInputStream(t3) {
              this.setTokenStream(t3);
            }
            getTokenStream() {
              return this._input;
            }
            setTokenStream(t3) {
              this._input = null, this.reset(), this._input = t3;
            }
            get syntaxErrorsCount() {
              return this._syntaxErrors;
            }
            getCurrentToken() {
              return this._input.LT(1);
            }
            notifyErrorListeners(t3, e3, n2) {
              n2 = n2 || null, null === (e3 = e3 || null) && (e3 = this.getCurrentToken()), this._syntaxErrors += 1;
              const s2 = e3.line, i3 = e3.column;
              this.getErrorListener().syntaxError(this, e3, s2, i3, t3, n2);
            }
            consume() {
              const e3 = this.getCurrentToken();
              e3.type !== t2.EOF && this.getInputStream().consume();
              const n2 = null !== this._parseListeners && this._parseListeners.length > 0;
              if (this.buildParseTrees || n2) {
                let t3;
                t3 = this._errHandler.inErrorRecoveryMode(this) ? this._ctx.addErrorNode(e3) : this._ctx.addTokenNode(e3), t3.invokingState = this.state, n2 && this._parseListeners.forEach(function(e4) {
                  t3 instanceof P || void 0 !== t3.isErrorNode && t3.isErrorNode() ? e4.visitErrorNode(t3) : t3 instanceof w && e4.visitTerminal(t3);
                });
              }
              return e3;
            }
            addContextToParseTree() {
              null !== this._ctx.parentCtx && this._ctx.parentCtx.addChild(this._ctx);
            }
            enterRule(t3, e3, n2) {
              this.state = e3, this._ctx = t3, this._ctx.start = this._input.LT(1), this.buildParseTrees && this.addContextToParseTree(), this.triggerEnterRuleEvent();
            }
            exitRule() {
              this._ctx.stop = this._input.LT(-1), this.triggerExitRuleEvent(), this.state = this._ctx.invokingState, this._ctx = this._ctx.parentCtx;
            }
            enterOuterAlt(t3, e3) {
              t3.setAltNumber(e3), this.buildParseTrees && this._ctx !== t3 && null !== this._ctx.parentCtx && (this._ctx.parentCtx.removeLastChild(), this._ctx.parentCtx.addChild(t3)), this._ctx = t3;
            }
            getPrecedence() {
              return 0 === this._precedenceStack.length ? -1 : this._precedenceStack[this._precedenceStack.length - 1];
            }
            enterRecursionRule(t3, e3, n2, s2) {
              this.state = e3, this._precedenceStack.push(s2), this._ctx = t3, this._ctx.start = this._input.LT(1), this.triggerEnterRuleEvent();
            }
            pushNewRecursionContext(t3, e3, n2) {
              const s2 = this._ctx;
              s2.parentCtx = t3, s2.invokingState = e3, s2.stop = this._input.LT(-1), this._ctx = t3, this._ctx.start = s2.start, this.buildParseTrees && this._ctx.addChild(s2), this.triggerEnterRuleEvent();
            }
            unrollRecursionContexts(t3) {
              this._precedenceStack.pop(), this._ctx.stop = this._input.LT(-1);
              const e3 = this._ctx, n2 = this.getParseListeners();
              if (null !== n2 && n2.length > 0) for (; this._ctx !== t3; ) this.triggerExitRuleEvent(), this._ctx = this._ctx.parentCtx;
              else this._ctx = t3;
              e3.parentCtx = t3, this.buildParseTrees && null !== t3 && t3.addChild(e3);
            }
            getInvokingContext(t3) {
              let e3 = this._ctx;
              for (; null !== e3; ) {
                if (e3.ruleIndex === t3) return e3;
                e3 = e3.parentCtx;
              }
              return null;
            }
            precpred(t3, e3) {
              return e3 >= this._precedenceStack[this._precedenceStack.length - 1];
            }
            inContext(t3) {
              return false;
            }
            isExpectedToken(e3) {
              const n2 = this._interp.atn;
              let s2 = this._ctx;
              const i3 = n2.states[this.state];
              let r3 = n2.nextTokens(i3);
              if (r3.contains(e3)) return true;
              if (!r3.contains(t2.EPSILON)) return false;
              for (; null !== s2 && s2.invokingState >= 0 && r3.contains(t2.EPSILON); ) {
                const t3 = n2.states[s2.invokingState].transitions[0];
                if (r3 = n2.nextTokens(t3.followState), r3.contains(e3)) return true;
                s2 = s2.parentCtx;
              }
              return !(!r3.contains(t2.EPSILON) || e3 !== t2.EOF);
            }
            getExpectedTokens() {
              return this._interp.atn.getExpectedTokens(this.state, this._ctx);
            }
            getExpectedTokensWithinCurrentRule() {
              const t3 = this._interp.atn, e3 = t3.states[this.state];
              return t3.nextTokens(e3);
            }
            getRuleIndex(t3) {
              const e3 = this.getRuleIndexMap()[t3];
              return null !== e3 ? e3 : -1;
            }
            getRuleInvocationStack(t3) {
              null === (t3 = t3 || null) && (t3 = this._ctx);
              const e3 = [];
              for (; null !== t3; ) {
                const n2 = t3.ruleIndex;
                n2 < 0 ? e3.push("n/a") : e3.push(this.ruleNames[n2]), t3 = t3.parentCtx;
              }
              return e3;
            }
            getDFAStrings() {
              return this._interp.decisionToDFA.toString();
            }
            dumpDFA() {
              let t3 = false;
              for (let e3 = 0; e3 < this._interp.decisionToDFA.length; e3++) {
                const n2 = this._interp.decisionToDFA[e3];
                n2.states.length > 0 && (t3 && console.log(), this.printer.println("Decision " + n2.decision + ":"), this.printer.print(n2.toString(this.literalNames, this.symbolicNames)), t3 = true);
              }
            }
            getSourceName() {
              return this._input.getSourceName();
            }
            setTrace(t3) {
              t3 ? (null !== this._tracer && this.removeParseListener(this._tracer), this._tracer = new Pe(this), this.addParseListener(this._tracer)) : (this.removeParseListener(this._tracer), this._tracer = null);
            }
          }
          be.bypassAltsAtnCache = {};
          class De extends w {
            constructor(t3) {
              super(), this.parentCtx = null, this.symbol = t3;
            }
            getChild(t3) {
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
              if (null === this.symbol) return S.INVALID_INTERVAL;
              const t3 = this.symbol.tokenIndex;
              return new S(t3, t3);
            }
            getChildCount() {
              return 0;
            }
            accept(t3) {
              return t3.visitTerminal(this);
            }
            getText() {
              return this.symbol.text;
            }
            toString() {
              return this.symbol.type === t2.EOF ? "<EOF>" : this.symbol.text;
            }
          }
          class Fe extends De {
            constructor(t3) {
              super(t3);
            }
            isErrorNode() {
              return true;
            }
            accept(t3) {
              return t3.visitErrorNode(this);
            }
          }
          class Me extends F {
            constructor(t3, e3) {
              super(t3, e3), this.children = null, this.start = null, this.stop = null, this.exception = null;
            }
            copyFrom(t3) {
              this.parentCtx = t3.parentCtx, this.invokingState = t3.invokingState, this.children = null, this.start = t3.start, this.stop = t3.stop, t3.children && (this.children = [], t3.children.map(function(t4) {
                t4 instanceof Fe && (this.children.push(t4), t4.parentCtx = this);
              }, this));
            }
            enterRule(t3) {
            }
            exitRule(t3) {
            }
            addChild(t3) {
              return null === this.children && (this.children = []), this.children.push(t3), t3;
            }
            removeLastChild() {
              null !== this.children && this.children.pop();
            }
            addTokenNode(t3) {
              const e3 = new De(t3);
              return this.addChild(e3), e3.parentCtx = this, e3;
            }
            addErrorNode(t3) {
              const e3 = new Fe(t3);
              return this.addChild(e3), e3.parentCtx = this, e3;
            }
            getChild(t3, e3) {
              if (e3 = e3 || null, null === this.children || t3 < 0 || t3 >= this.children.length) return null;
              if (null === e3) return this.children[t3];
              for (let n2 = 0; n2 < this.children.length; n2++) {
                const s2 = this.children[n2];
                if (s2 instanceof e3) {
                  if (0 === t3) return s2;
                  t3 -= 1;
                }
              }
              return null;
            }
            getToken(t3, e3) {
              if (null === this.children || e3 < 0 || e3 >= this.children.length) return null;
              for (let n2 = 0; n2 < this.children.length; n2++) {
                const s2 = this.children[n2];
                if (s2 instanceof w && s2.symbol.type === t3) {
                  if (0 === e3) return s2;
                  e3 -= 1;
                }
              }
              return null;
            }
            getTokens(t3) {
              if (null === this.children) return [];
              {
                const e3 = [];
                for (let n2 = 0; n2 < this.children.length; n2++) {
                  const s2 = this.children[n2];
                  s2 instanceof w && s2.symbol.type === t3 && e3.push(s2);
                }
                return e3;
              }
            }
            getTypedRuleContext(t3, e3) {
              return this.getChild(e3, t3);
            }
            getTypedRuleContexts(t3) {
              if (null === this.children) return [];
              {
                const e3 = [];
                for (let n2 = 0; n2 < this.children.length; n2++) {
                  const s2 = this.children[n2];
                  s2 instanceof t3 && e3.push(s2);
                }
                return e3;
              }
            }
            getChildCount() {
              return null === this.children ? 0 : this.children.length;
            }
            getSourceInterval() {
              return null === this.start || null === this.stop ? S.INVALID_INTERVAL : new S(this.start.tokenIndex, this.stop.tokenIndex);
            }
          }
          F.EMPTY = new Me();
          class Ue {
            static DEFAULT_PROGRAM_NAME = "default";
            constructor(t3) {
              this.tokens = t3, this.programs = /* @__PURE__ */ new Map();
            }
            getTokenStream() {
              return this.tokens;
            }
            insertAfter(t3, e3) {
              let n2, s2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : Ue.DEFAULT_PROGRAM_NAME;
              n2 = "number" == typeof t3 ? t3 : t3.tokenIndex;
              let i3 = this.getProgram(s2), r3 = new ze(this.tokens, n2, i3.length, e3);
              i3.push(r3);
            }
            insertBefore(t3, e3) {
              let n2, s2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : Ue.DEFAULT_PROGRAM_NAME;
              n2 = "number" == typeof t3 ? t3 : t3.tokenIndex;
              const i3 = this.getProgram(s2), r3 = new Ve(this.tokens, n2, i3.length, e3);
              i3.push(r3);
            }
            replaceSingle(t3, e3) {
              let n2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : Ue.DEFAULT_PROGRAM_NAME;
              this.replace(t3, t3, e3, n2);
            }
            replace(t3, e3, n2) {
              let s2 = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : Ue.DEFAULT_PROGRAM_NAME;
              if ("number" != typeof t3 && (t3 = t3.tokenIndex), "number" != typeof e3 && (e3 = e3.tokenIndex), t3 > e3 || t3 < 0 || e3 < 0 || e3 >= this.tokens.size) throw new RangeError(`replace: range invalid: ${t3}..${e3}(size=${this.tokens.size})`);
              let i3 = this.getProgram(s2), r3 = new qe(this.tokens, t3, e3, i3.length, n2);
              i3.push(r3);
            }
            delete(t3, e3) {
              let n2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : Ue.DEFAULT_PROGRAM_NAME;
              void 0 === e3 && (e3 = t3), this.replace(t3, e3, null, n2);
            }
            getProgram(t3) {
              let e3 = this.programs.get(t3);
              return null == e3 && (e3 = this.initializeProgram(t3)), e3;
            }
            initializeProgram(t3) {
              const e3 = [];
              return this.programs.set(t3, e3), e3;
            }
            getText(e3) {
              let n2, s2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : Ue.DEFAULT_PROGRAM_NAME;
              n2 = e3 instanceof S ? e3 : new S(0, this.tokens.size - 1), "string" == typeof e3 && (s2 = e3);
              const i3 = this.programs.get(s2);
              let r3 = n2.start, o2 = n2.stop;
              if (o2 > this.tokens.size - 1 && (o2 = this.tokens.size - 1), r3 < 0 && (r3 = 0), null == i3 || 0 === i3.length) return this.tokens.getText(new S(r3, o2));
              let a2 = [], l2 = this.reduceToSingleOperationPerIndex(i3), h2 = r3;
              for (; h2 <= o2 && h2 < this.tokens.size; ) {
                let e4 = l2.get(h2);
                l2.delete(h2);
                let n3 = this.tokens.get(h2);
                null == e4 ? (n3.type !== t2.EOF && a2.push(String(n3.text)), h2++) : h2 = e4.execute(a2);
              }
              if (o2 === this.tokens.size - 1) for (const t3 of l2.values()) t3.index >= this.tokens.size - 1 && a2.push(t3.text.toString());
              return a2.join("");
            }
            reduceToSingleOperationPerIndex(t3) {
              for (let e4 = 0; e4 < t3.length; e4++) {
                let n2 = t3[e4];
                if (null == n2) continue;
                if (!(n2 instanceof qe)) continue;
                let s2 = n2, i3 = this.getKindOfOps(t3, Ve, e4);
                for (let e5 of i3) e5.index === s2.index ? (t3[e5.instructionIndex] = void 0, s2.text = e5.text.toString() + (null != s2.text ? s2.text.toString() : "")) : e5.index > s2.index && e5.index <= s2.lastIndex && (t3[e5.instructionIndex] = void 0);
                let r3 = this.getKindOfOps(t3, qe, e4);
                for (let e5 of r3) {
                  if (e5.index >= s2.index && e5.lastIndex <= s2.lastIndex) {
                    t3[e5.instructionIndex] = void 0;
                    continue;
                  }
                  let n3 = e5.lastIndex < s2.index || e5.index > s2.lastIndex;
                  if (null != e5.text || null != s2.text || n3) {
                    if (!n3) throw new Error(`replace op boundaries of ${s2} overlap with previous ${e5}`);
                  } else t3[e5.instructionIndex] = void 0, s2.index = Math.min(e5.index, s2.index), s2.lastIndex = Math.max(e5.lastIndex, s2.lastIndex);
                }
              }
              for (let e4 = 0; e4 < t3.length; e4++) {
                let n2 = t3[e4];
                if (null == n2) continue;
                if (!(n2 instanceof Ve)) continue;
                let s2 = n2, i3 = this.getKindOfOps(t3, Ve, e4);
                for (let e5 of i3) e5.index === s2.index && (e5 instanceof ze ? (s2.text = this.catOpText(e5.text, s2.text), t3[e5.instructionIndex] = void 0) : e5 instanceof Ve && (s2.text = this.catOpText(s2.text, e5.text), t3[e5.instructionIndex] = void 0));
                let r3 = this.getKindOfOps(t3, qe, e4);
                for (let n3 of r3) if (s2.index !== n3.index) {
                  if (s2.index >= n3.index && s2.index <= n3.lastIndex) throw new Error(`insert op ${s2} within boundaries of previous ${n3}`);
                } else n3.text = this.catOpText(s2.text, n3.text), t3[e4] = void 0;
              }
              let e3 = /* @__PURE__ */ new Map();
              for (let n2 of t3) if (null != n2) {
                if (null != e3.get(n2.index)) throw new Error("should only be one op per index");
                e3.set(n2.index, n2);
              }
              return e3;
            }
            catOpText(t3, e3) {
              let n2 = "", s2 = "";
              return null != t3 && (n2 = t3.toString()), null != e3 && (s2 = e3.toString()), n2 + s2;
            }
            getKindOfOps(t3, e3, n2) {
              return t3.slice(0, n2).filter((t4) => t4 && t4 instanceof e3);
            }
          }
          class Be {
            constructor(t3, e3, n2, s2) {
              this.tokens = t3, this.instructionIndex = n2, this.index = e3, this.text = void 0 === s2 ? "" : s2;
            }
            toString() {
              let t3 = this.constructor.name;
              const e3 = t3.indexOf("$");
              return t3 = t3.substring(e3 + 1, t3.length), "<" + t3 + "@" + this.tokens.get(this.index) + ':"' + this.text + '">';
            }
          }
          class Ve extends Be {
            constructor(t3, e3, n2, s2) {
              super(t3, e3, n2, s2);
            }
            execute(e3) {
              return this.text && e3.push(this.text.toString()), this.tokens.get(this.index).type !== t2.EOF && e3.push(String(this.tokens.get(this.index).text)), this.index + 1;
            }
          }
          class ze extends Ve {
            constructor(t3, e3, n2, s2) {
              super(t3, e3 + 1, n2, s2);
            }
          }
          class qe extends Be {
            constructor(t3, e3, n2, s2, i3) {
              super(t3, e3, s2, i3), this.lastIndex = n2;
            }
            execute(t3) {
              return this.text && t3.push(this.text.toString()), this.lastIndex + 1;
            }
            toString() {
              return null == this.text ? "<DeleteOp@" + this.tokens.get(this.index) + ".." + this.tokens.get(this.lastIndex) + ">" : "<ReplaceOp@" + this.tokens.get(this.index) + ".." + this.tokens.get(this.lastIndex) + ':"' + this.text + '">';
            }
          }
          const He = { atn: se, dfa: ae, context: le, misc: he, tree: ge, error: Ce, Token: t2, CommonToken: vt, CharStreams: Le, CharStream: Ae, InputStream: Ne, CommonTokenStream: we, Lexer: Ft, Parser: be, ParserRuleContext: Me, Interval: S, IntervalSet: m, LL1Analyzer: G, Utils: Oe, TokenStreamRewriter: Ue };
        })();
        var i = exports;
        for (var r in s) i[r] = s[r];
        s.__esModule && Object.defineProperty(i, "__esModule", { value: true });
      })();
    }
  });
  return require_antlr4_web();
})();