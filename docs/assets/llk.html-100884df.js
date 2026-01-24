import{_ as r,r as i,o as s,c as l,b as n,d as a,e as o,a as d}from"./app-5079ec4e.js";const u={},m={href:"https://en.wikipedia.org/wiki/LL_grammar",target:"_blank",rel:"noopener noreferrer"};function v(c,e){const t=i("ExternalLinkIcon");return s(),l("div",null,[e[3]||(e[3]=n("h1",{id:"ll-k-grammars",tabindex:"-1"},[n("a",{class:"header-anchor",href:"#ll-k-grammars","aria-hidden":"true"},"#"),a(" LL(K) Grammars")],-1)),n("p",null,[e[1]||(e[1]=a("Chevrotain can be used to build parsers for ")),n("a",m,[e[0]||(e[0]=a("LL(K)")),o(t)]),e[2]||(e[2]=a(" Grammars. This means that the number of lookahead tokens needed to disambiguate two alternatives must be a fixed number and known in advance."))]),e[4]||(e[4]=d(`<p>For example given the grammar</p><div class="language-antlr line-numbers-mode" data-ext="antlr"><pre class="language-antlr"><code>statement:
   A B C |
   A B D |
   A B E
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>Chevrotain will look <strong>three</strong> tokens ahead to decide between the two alternatives.</p><p>But given the following grammar</p><div class="language-antlr line-numbers-mode" data-ext="antlr"><pre class="language-antlr"><code>statement:
   longRule B  |
   longRule C  |
   longRule D

longRule:
   A+
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>Chevrotain will throw a an error during the parser initialization in this case. This is because there is no fixed number of tokens we can use to choose between the alternatives that is due to a potentially <strong>infinite</strong> number of &quot;A&quot; tokens that can appear before the &quot;B&quot; - &quot;C&quot; tokens.</p>`,6))])}const g=r(u,[["render",v],["__file","llk.html.vue"]]);export{g as default};
