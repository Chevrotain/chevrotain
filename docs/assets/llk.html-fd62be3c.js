import{_ as t,r,o as i,c as s,a as n,b as e,d as l,e as o}from"./app-4bef62ab.js";const d={},c=n("h1",{id:"ll-k-grammars",tabindex:"-1"},[n("a",{class:"header-anchor",href:"#ll-k-grammars","aria-hidden":"true"},"#"),e(" LL(K) Grammars")],-1),u={href:"https://en.wikipedia.org/wiki/LL_grammar",target:"_blank",rel:"noopener noreferrer"},m=o(`<p>For example given the grammar</p><div class="language-antlr line-numbers-mode" data-ext="antlr"><pre class="language-antlr"><code>statement:
   A B C |
   A B D |
   A B E
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>Chevrotain will look <strong>three</strong> tokens ahead to decide between the two alternatives.</p><p>But given the following grammar</p><div class="language-antlr line-numbers-mode" data-ext="antlr"><pre class="language-antlr"><code>statement:
   longRule B  |
   longRule C  |
   longRule D

longRule:
   A+
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>Chevrotain will throw a an error during the parser initialization in this case. This is because there is no fixed number of tokens we can use to choose between the alternatives that is due to a potentially <strong>infinite</strong> number of &quot;A&quot; tokens that can appear before the &quot;B&quot; - &quot;C&quot; tokens.</p>`,6);function v(h,b){const a=r("ExternalLinkIcon");return i(),s("div",null,[c,n("p",null,[e("Chevrotain can be used to build parsers for "),n("a",u,[e("LL(K)"),l(a)]),e(" Grammars. This means that the number of lookahead tokens needed to disambiguate two alternatives must be a fixed number and known in advance.")]),m])}const p=t(d,[["render",v],["__file","llk.html.vue"]]);export{p as default};
