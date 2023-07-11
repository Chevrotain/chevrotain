import{_ as t,r as o,o as r,c as p,a as e,b as n,d as a,e as l}from"./app-e26ef647.js";const c={},i=e("h1",{id:"token-grouping",tabindex:"-1"},[e("a",{class:"header-anchor",href:"#token-grouping","aria-hidden":"true"},"#"),n(" Token Grouping")],-1),u=e("p",null,[n("Chevrotain lexers support grouping Tokens Types "),e("strong",null,"separately"),n(" from the main token vector in the lexing result. This is often useful to "),e("strong",null,"collect"),n(" a specific set of Token Types for later processing, for example to collect comments tokens.")],-1),d={href:"https://chevrotain.io/documentation/11_0_0/interfaces/ITokenConfig.html#group",target:"_blank",rel:"noopener noreferrer"},k=e("strong",null,"group",-1),g=l(`<div class="language-javascript line-numbers-mode" data-ext="js"><pre class="language-javascript"><code><span class="token keyword">const</span> Comment <span class="token operator">=</span> <span class="token function">createToken</span><span class="token punctuation">(</span><span class="token punctuation">{</span>
  <span class="token literal-property property">name</span><span class="token operator">:</span> <span class="token string">&quot;Comment&quot;</span><span class="token punctuation">,</span>
  <span class="token literal-property property">pattern</span><span class="token operator">:</span> <span class="token regex"><span class="token regex-delimiter">/</span><span class="token regex-source language-regex">\\/\\/.+</span><span class="token regex-delimiter">/</span></span><span class="token punctuation">,</span>
  <span class="token literal-property property">group</span><span class="token operator">:</span> <span class="token string">&quot;comments&quot;</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,1),m={href:"https://github.com/chevrotain/chevrotain/tree/master/examples/lexer/token_groups",target:"_blank",rel:"noopener noreferrer"};function _(h,f){const s=o("ExternalLinkIcon");return r(),p("div",null,[i,u,e("p",null,[n("To group a Token Type simply specify the "),e("a",d,[k,a(s)]),n(" property in its configuration. For example:")]),g,e("p",null,[n("See "),e("a",m,[n("executable example"),a(s)]),n(" for further details.")])])}const x=t(c,[["render",_],["__file","token_grouping.html.vue"]]);export{x as default};
