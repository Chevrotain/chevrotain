import{_ as o,r as t,o as i,c,a as n,b as a,w as l,e as s,d as u}from"./app.9a1a83fb.js";const r={},d=n("h1",{id:"semantics-cst-visitor",tabindex:"-1"},[n("a",{class:"header-anchor",href:"#semantics-cst-visitor","aria-hidden":"true"},"#"),s(" Semantics - CST Visitor")],-1),k={href:"https://github.com/chevrotain/chevrotain/tree/master/examples/tutorial/step3_actions/step3a_actions_visitor.js",target:"_blank",rel:"noopener noreferrer"},v=s("Run and Debug the source code"),m=s("."),b=n("h2",{id:"introduction",tabindex:"-1"},[n("a",{class:"header-anchor",href:"#introduction","aria-hidden":"true"},"#"),s(" Introduction")],-1),h=s("In the "),y=s("previous"),w=s(' tutorial step we have implemented a parser for a "mini" SQL Select grammar. The current problem is that our parser only validates the input conforms to the grammar, in other words it is just a recognizer. But in most real world use cases the parser will '),f=n("strong",null,"also",-1),g=s(" have to output some result/data structure/value."),x=n("p",null,[s("This can be accomplished using a CST (Concrete Syntax Tree) Visitor defined "),n("strong",null,"outside"),s(" our grammar:")],-1),_=s("See in depth documentation of Chevrotain's "),C={href:"https://chevrotain.io/docs/guide/concrete_syntax_tree.html",target:"_blank",rel:"noopener noreferrer"},S=s("CST capabilities"),T=n("h2",{id:"enabling-cst",tabindex:"-1"},[n("a",{class:"header-anchor",href:"#enabling-cst","aria-hidden":"true"},"#"),s(" Enabling CST")],-1),V=s("This feature is automatically enabled when a Parser extends the Chevrotain "),q={href:"https://chevrotain.io/documentation/10_2_0/classes/CstParser.html",target:"_blank",rel:"noopener noreferrer"},I=s("CstParser"),L=s(" class"),E=u(`<p>The invocation of any grammar rule will now automatically create a CST.</p><div class="language-javascript ext-js line-numbers-mode"><pre class="language-javascript"><code><span class="token keyword">function</span> <span class="token function">parseInput</span><span class="token punctuation">(</span><span class="token parameter">text</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">const</span> lexingResult <span class="token operator">=</span> SelectLexer<span class="token punctuation">.</span><span class="token function">tokenize</span><span class="token punctuation">(</span>text<span class="token punctuation">)</span>
  <span class="token keyword">const</span> parser <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">SelectParser</span><span class="token punctuation">(</span>lexingResult<span class="token punctuation">.</span>tokens<span class="token punctuation">)</span>

  <span class="token comment">// CST automatically created.</span>
  <span class="token keyword">const</span> cstOutput <span class="token operator">=</span> parser<span class="token punctuation">.</span><span class="token function">selectStatement</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="the-cst-visitor" tabindex="-1"><a class="header-anchor" href="#the-cst-visitor" aria-hidden="true">#</a> The CST Visitor</h2><p>Creating a CST is not enough, we also need to traverse this structure and execute our actions (semantics).</p><p>Each Chevrotain parser <strong>instance</strong> exposes two BaseVisitor classes which can be extended to create custom user visitors.</p><div class="language-javascript ext-js line-numbers-mode"><pre class="language-javascript"><code><span class="token comment">// BaseVisitor constructors are accessed via a parser instance.</span>
<span class="token keyword">const</span> parserInstance <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">SelectParser</span><span class="token punctuation">(</span><span class="token punctuation">)</span>

<span class="token keyword">const</span> BaseSQLVisitor <span class="token operator">=</span> parserInstance<span class="token punctuation">.</span><span class="token function">getBaseCstVisitorConstructor</span><span class="token punctuation">(</span><span class="token punctuation">)</span>

<span class="token comment">// This BaseVisitor include default visit methods that simply traverse the CST.</span>
<span class="token keyword">const</span> BaseSQLVisitorWithDefaults <span class="token operator">=</span>
  parserInstance<span class="token punctuation">.</span><span class="token function">getBaseCstVisitorConstructorWithDefaults</span><span class="token punctuation">(</span><span class="token punctuation">)</span>

<span class="token keyword">class</span> <span class="token class-name">myCustomVisitor</span> <span class="token keyword">extends</span> <span class="token class-name">BaseSQLVisitor</span> <span class="token punctuation">{</span>
  <span class="token function">constructor</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">super</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
    <span class="token comment">// The &quot;validateVisitor&quot; method is a helper utility which performs static analysis</span>
    <span class="token comment">// to detect missing or redundant visitor methods</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">validateVisitor</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token punctuation">}</span>

  <span class="token comment">/* Visit methods go here */</span>
<span class="token punctuation">}</span>

<span class="token keyword">class</span> <span class="token class-name">myCustomVisitorWithDefaults</span> <span class="token keyword">extends</span> <span class="token class-name">BaseSQLVisitorWithDefaults</span> <span class="token punctuation">{</span>
  <span class="token function">constructor</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">super</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">validateVisitor</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token punctuation">}</span>

  <span class="token comment">/* Visit methods go here */</span>
<span class="token punctuation">}</span>

<span class="token keyword">const</span> myVisitorInstance <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">myCustomVisitor</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
<span class="token keyword">const</span> myVisitorInstanceWithDefaults <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">myCustomVisitorWithDefaults</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>In our example we will use the BaseVisitor constructor (<strong>without</strong> defaults )</p><h2 id="visitor-methods" tabindex="-1"><a class="header-anchor" href="#visitor-methods" aria-hidden="true">#</a> Visitor Methods</h2><p>So we now know how to create a CST visitor. But how do we actually make it perform the actions (semantics) we wish? For that we must create a <strong>visit method</strong> for each grammar rule.</p><p>Recall the selectClause grammar from the previous step:</p><div class="language-antlr ext-antlr line-numbers-mode"><pre class="language-antlr"><code>selectClause:
  &quot;SELECT&quot; Identifier (&quot;,&quot; Identifier)*;
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><p>Lets create a visitor method for the selectClause rule.</p><div class="language-javascript ext-js line-numbers-mode"><pre class="language-javascript"><code><span class="token keyword">class</span> <span class="token class-name">SQLToAstVisitor</span> <span class="token keyword">extends</span> <span class="token class-name">BaseSQLVisitor</span> <span class="token punctuation">{</span>
  <span class="token function">constructor</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">super</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">validateVisitor</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token punctuation">}</span>

  <span class="token comment">// The Ctx argument is the current CSTNode&#39;s children.</span>
  <span class="token function">selectClause</span><span class="token punctuation">(</span><span class="token parameter">ctx</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token comment">// Each Terminal or Non-Terminal in a grammar rule are collected into</span>
    <span class="token comment">// an array with the same name(key) in the ctx object.</span>
    <span class="token keyword">let</span> columns <span class="token operator">=</span> ctx<span class="token punctuation">.</span>Identifier<span class="token punctuation">.</span><span class="token function">map</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token parameter">identToken</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> identToken<span class="token punctuation">.</span>image<span class="token punctuation">)</span>

    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      <span class="token literal-property property">type</span><span class="token operator">:</span> <span class="token string">&quot;SELECT_CLAUSE&quot;</span><span class="token punctuation">,</span>
      <span class="token literal-property property">columns</span><span class="token operator">:</span> columns
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>So far pretty simple, now lets add another visit method for &quot;selectStatement&quot;. First lets recall it&#39;s grammar.</p><div class="language-antlr ext-antlr line-numbers-mode"><pre class="language-antlr"><code>selectStatement
   : selectClause fromClause (whereClause)?
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><p>And now to the code:</p><div class="language-javascript ext-js line-numbers-mode"><pre class="language-javascript"><code><span class="token keyword">class</span> <span class="token class-name">SQLToAstVisitor</span> <span class="token keyword">extends</span> <span class="token class-name">BaseSQLVisitor</span> <span class="token punctuation">{</span>
  <span class="token function">constructor</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">super</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">validateVisitor</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token punctuation">}</span>

  <span class="token comment">// The Ctx argument is the current CSTNode&#39;s children.</span>
  <span class="token function">selectClause</span><span class="token punctuation">(</span><span class="token parameter">ctx</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token comment">/* as above... */</span>
  <span class="token punctuation">}</span>

  <span class="token function">selectStatement</span><span class="token punctuation">(</span><span class="token parameter">ctx</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token comment">// &quot;this.visit&quot; can be used to visit none-terminals and will invoke the correct visit method for the CstNode passed.</span>
    <span class="token keyword">let</span> select <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">visit</span><span class="token punctuation">(</span>ctx<span class="token punctuation">.</span>selectClause<span class="token punctuation">)</span>

    <span class="token comment">//  &quot;this.visit&quot; can work on either a CstNode or an Array of CstNodes.</span>
    <span class="token comment">//  If an array is passed (ctx.fromClause is an array) it is equivalent</span>
    <span class="token comment">//  to passing the first element of that array</span>
    <span class="token keyword">let</span> from <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">visit</span><span class="token punctuation">(</span>ctx<span class="token punctuation">.</span>fromClause<span class="token punctuation">)</span>

    <span class="token comment">// &quot;whereClause&quot; is optional, &quot;this.visit&quot; will ignore empty arrays (optional)</span>
    <span class="token keyword">let</span> where <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">visit</span><span class="token punctuation">(</span>ctx<span class="token punctuation">.</span>whereClause<span class="token punctuation">)</span>

    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      <span class="token literal-property property">type</span><span class="token operator">:</span> <span class="token string">&quot;SELECT_STMT&quot;</span><span class="token punctuation">,</span>
      <span class="token literal-property property">selectClause</span><span class="token operator">:</span> select<span class="token punctuation">,</span>
      <span class="token literal-property property">fromClause</span><span class="token operator">:</span> from<span class="token punctuation">,</span>
      <span class="token literal-property property">whereClause</span><span class="token operator">:</span> where
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="full-visitor" tabindex="-1"><a class="header-anchor" href="#full-visitor" aria-hidden="true">#</a> Full Visitor</h2><p>We still have a few grammar rules we need to build visitors for.</p><div class="language-ANTLR ext-ANTLR line-numbers-mode"><pre class="language-ANTLR"><code>fromClause
   : &quot;FROM&quot; Identifier

whereClause
   : &quot;WHERE&quot; expression

expression
   : atomicExpression relationalOperator atomicExpression

atomicExpression
   : Integer | Identifier

relationalOperator
   : &quot;&gt;&quot; | &quot;&lt;&quot;
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>lets implement those as well.</p><div class="language-javascript ext-js line-numbers-mode"><pre class="language-javascript"><code><span class="token keyword">class</span> <span class="token class-name">SQLToAstVisitor</span> <span class="token keyword">extends</span> <span class="token class-name">BaseSQLVisitor</span> <span class="token punctuation">{</span>
  <span class="token function">constructor</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">super</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">validateVisitor</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token punctuation">}</span>

  <span class="token function">selectStatement</span><span class="token punctuation">(</span><span class="token parameter">ctx</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token comment">/* as above... */</span>
  <span class="token punctuation">}</span>

  <span class="token function">selectClause</span><span class="token punctuation">(</span><span class="token parameter">ctx</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token comment">/* as above... */</span>
  <span class="token punctuation">}</span>

  <span class="token function">fromClause</span><span class="token punctuation">(</span><span class="token parameter">ctx</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">const</span> tableName <span class="token operator">=</span> ctx<span class="token punctuation">.</span>Identifier<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span><span class="token punctuation">.</span>image

    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      <span class="token literal-property property">type</span><span class="token operator">:</span> <span class="token string">&quot;FROM_CLAUSE&quot;</span><span class="token punctuation">,</span>
      <span class="token literal-property property">table</span><span class="token operator">:</span> tableName
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>

  <span class="token function">whereClause</span><span class="token punctuation">(</span><span class="token parameter">ctx</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">const</span> condition <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">visit</span><span class="token punctuation">(</span>ctx<span class="token punctuation">.</span>expression<span class="token punctuation">)</span>

    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      <span class="token literal-property property">type</span><span class="token operator">:</span> <span class="token string">&quot;WHERE_CLAUSE&quot;</span><span class="token punctuation">,</span>
      <span class="token literal-property property">condition</span><span class="token operator">:</span> condition
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>

  <span class="token function">expression</span><span class="token punctuation">(</span><span class="token parameter">ctx</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token comment">// Note the usage of the &quot;rhs&quot; and &quot;lhs&quot; labels defined in step 2 in the expression rule.</span>
    <span class="token keyword">const</span> lhs <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">visit</span><span class="token punctuation">(</span>ctx<span class="token punctuation">.</span>lhs<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span><span class="token punctuation">)</span>
    <span class="token keyword">const</span> operator <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">visit</span><span class="token punctuation">(</span>ctx<span class="token punctuation">.</span>relationalOperator<span class="token punctuation">)</span>
    <span class="token keyword">const</span> rhs <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">visit</span><span class="token punctuation">(</span>ctx<span class="token punctuation">.</span>rhs<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span><span class="token punctuation">)</span>

    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      <span class="token literal-property property">type</span><span class="token operator">:</span> <span class="token string">&quot;EXPRESSION&quot;</span><span class="token punctuation">,</span>
      <span class="token literal-property property">lhs</span><span class="token operator">:</span> lhs<span class="token punctuation">,</span>
      <span class="token literal-property property">operator</span><span class="token operator">:</span> operator<span class="token punctuation">,</span>
      <span class="token literal-property property">rhs</span><span class="token operator">:</span> rhs
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>

  <span class="token comment">// these two visitor methods will return a string.</span>
  <span class="token function">atomicExpression</span><span class="token punctuation">(</span><span class="token parameter">ctx</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>ctx<span class="token punctuation">.</span>Integer<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> ctx<span class="token punctuation">.</span>Integer<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span><span class="token punctuation">.</span>image
    <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> ctx<span class="token punctuation">.</span>Identifier<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span><span class="token punctuation">.</span>image
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>

  <span class="token function">relationalOperator</span><span class="token punctuation">(</span><span class="token parameter">ctx</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>ctx<span class="token punctuation">.</span>GreaterThan<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> ctx<span class="token punctuation">.</span>GreaterThan<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span><span class="token punctuation">.</span>image
    <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> ctx<span class="token punctuation">.</span>LessThan<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span><span class="token punctuation">.</span>image
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="usage" tabindex="-1"><a class="header-anchor" href="#usage" aria-hidden="true">#</a> Usage</h4><p>So we know how to create a CST Visitor, but how do we actually use it?</p><div class="language-javascript ext-js line-numbers-mode"><pre class="language-javascript"><code><span class="token comment">// A new parser instance with CST output enabled.</span>
<span class="token keyword">const</span> parserInstance <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">SelectParser</span><span class="token punctuation">(</span><span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">,</span> <span class="token punctuation">{</span> <span class="token literal-property property">outputCst</span><span class="token operator">:</span> <span class="token boolean">true</span> <span class="token punctuation">}</span><span class="token punctuation">)</span>
<span class="token comment">// Our visitor has no state, so a single instance is sufficient.</span>
<span class="token keyword">const</span> toAstVisitorInstance <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">SQLToAstVisitor</span><span class="token punctuation">(</span><span class="token punctuation">)</span>

<span class="token keyword">function</span> <span class="token function">toAst</span><span class="token punctuation">(</span><span class="token parameter">inputText</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token comment">// Lex</span>
  <span class="token keyword">const</span> lexResult <span class="token operator">=</span> selectLexer<span class="token punctuation">.</span><span class="token function">tokenize</span><span class="token punctuation">(</span>inputText<span class="token punctuation">)</span>
  parserInstance<span class="token punctuation">.</span>input <span class="token operator">=</span> lexResult<span class="token punctuation">.</span>tokens

  <span class="token comment">// Automatic CST created when parsing</span>
  <span class="token keyword">const</span> cst <span class="token operator">=</span> parserInstance<span class="token punctuation">.</span><span class="token function">selectStatement</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token keyword">if</span> <span class="token punctuation">(</span>parserInstance<span class="token punctuation">.</span>errors<span class="token punctuation">.</span>length <span class="token operator">&gt;</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">throw</span> <span class="token function">Error</span><span class="token punctuation">(</span>
      <span class="token string">&quot;Sad sad panda, parsing errors detected!\\n&quot;</span> <span class="token operator">+</span>
        parserInstance<span class="token punctuation">.</span>errors<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span><span class="token punctuation">.</span>message
    <span class="token punctuation">)</span>
  <span class="token punctuation">}</span>

  <span class="token comment">// Visit</span>
  <span class="token keyword">const</span> ast <span class="token operator">=</span> toAstVisitorInstance<span class="token punctuation">.</span><span class="token function">visit</span><span class="token punctuation">(</span>cst<span class="token punctuation">)</span>
  <span class="token keyword">return</span> ast
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,25);function j(B,A){const e=t("ExternalLinkIcon"),p=t("RouterLink");return i(),c("div",null,[d,n("p",null,[n("a",k,[v,a(e)]),m]),b,n("p",null,[h,a(p,{to:"/tutorial/step2_parsing.html"},{default:l(()=>[y]),_:1}),w,f,g]),x,n("ul",null,[n("li",null,[_,n("a",C,[S,a(e)])])]),T,n("p",null,[V,n("a",q,[I,a(e)]),L]),E])}var R=o(r,[["render",j],["__file","step3a_adding_actions_visitor.html.vue"]]);export{R as default};
