import{_ as t,o as i,c as r,a as e,b as s,e as n,d as o,r as l}from"./app.111bdffb.js";const d={},c=e("h1",{id:"ll-k-grammars",tabindex:"-1"},[e("a",{class:"header-anchor",href:"#ll-k-grammars","aria-hidden":"true"},"#"),n(" LL(K) Grammars")],-1),u=n("Chevrotain can be used to build parsers for "),m={href:"https://en.wikipedia.org/wiki/LL_grammar",target:"_blank",rel:"noopener noreferrer"},v=n("LL(K)"),h=n(" Grammars. This means that the number of lookahead tokens needed to disambiguate two alternatives must be a fixed number and known in advance."),b=o(`<p>For example given the grammar</p><div class="language-antlr ext-antlr line-numbers-mode"><pre class="language-antlr"><code>statement:
   A B C |
   A B D |
   A B E
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>Chevrotain will look <strong>three</strong> tokens ahead to decide between the two alternatives.</p><p>But given the following grammar</p><div class="language-antlr ext-antlr line-numbers-mode"><pre class="language-antlr"><code>statement:
   longRule B  |
   longRule C  |
   longRule D

longRule:
   A+
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>Chevrotain will throw a an error during the parser initialization in this case. This is because there is no fixed number of tokens we can use to choose between the alternatives that is due to a potentially <strong>infinite</strong> number of &quot;A&quot; tokens that can appear before the &quot;B&quot; - &quot;C&quot; tokens.</p>`,6);function g(p,_){const a=l("ExternalLinkIcon");return i(),r("div",null,[c,e("p",null,[u,e("a",m,[v,s(a)]),h]),b])}var k=t(d,[["render",g],["__file","llk.html.vue"]]);export{k as default};
