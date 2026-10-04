(function(){
'use strict';
var API='https://api.github.com/repos/ronaldboersen/glazy-tools-dist/contents/rb-prototype-manifest.js?ref=main';
var STATE='RBPrototypeLoaderState';
var state=window[STATE]=window[STATE]||{};
if(state.busy)return;
state.busy=true;
function finish(){state.busy=false;}
function fail(err){finish();console.error('[RB Prototype]',err);alert('Ronald Prototype\\n\\nThe current prototype could not be loaded on this page.');}
function remove(id){var n=document.getElementById(id);if(n)n.remove();}
function load(el,label){return new Promise(function(resolve,reject){
 var timer=setTimeout(function(){settle(new Error(label+' took too long to load.'));},20000);
 function settle(err){clearTimeout(timer);el.onload=el.onerror=null;if(err){el.remove();reject(err);}else resolve();}
 el.onload=function(){settle();};el.onerror=function(){settle(new Error('Could not load '+label));};document.head.appendChild(el);
});}
function decodeContent(s){return decodeURIComponent(Array.prototype.map.call(atob(s.replace(/\\n/g,'')),function(c){return '%'+('00'+c.charCodeAt(0).toString(16)).slice(-2);}).join(''));}
function parseManifest(src){var m=src.match(/RB_PROTOTYPE_MANIFEST\s*=\s*(\{[\s\S]*\})\s*;?\s*$/);if(!m)throw new Error('Could not parse prototype manifest.');return JSON.parse(m[1]);}
function basename(url){return new URL(url).pathname.split('/').pop();}
fetch(API+'&rb='+Date.now(),{cache:'no-store',headers:{Accept:'application/vnd.github+json'}})
.then(function(r){if(!r.ok)throw new Error('Manifest API returned '+r.status);return r.json();})
.then(function(j){var m=parseManifest(decodeContent(j.content||''));var scripts=Array.isArray(m.scripts)?m.scripts:(m.script?[m.script]:[]);if(!m.ref||!scripts.length)throw new Error('Manifest is missing immutable asset ref or scripts.');
 if(window.RBPrototype&&window.RBPrototype.stop){try{window.RBPrototype.stop();}catch(e){}}
 if(window.RBGlazyMeltPredictor&&window.RBGlazyMeltPredictor.stop){try{window.RBGlazyMeltPredictor.stop();}catch(e){}}
 remove('rb-prototype-style');
 var old=document.querySelectorAll('[id^="rb-prototype-script"]');
 for(var oi=0;oi<old.length;oi++)old[oi].remove();
 var base='https://cdn.jsdelivr.net/gh/ronaldboersen/glazy-tools-dist@'+encodeURIComponent(m.ref)+'/';
 var chain=Promise.resolve();
 if(m.style){chain=chain.then(function(){var css=document.createElement('link');css.id='rb-prototype-style';css.rel='stylesheet';css.href=base+basename(m.style);return load(css,'prototype stylesheet');});}
 scripts.forEach(function(src,index){chain=chain.then(function(){var js=document.createElement('script');js.id='rb-prototype-script-'+index;js.src=base+basename(src);return load(js,'prototype script '+(index+1));});});
 return chain.then(function(){state.version=m.version;state.name=m.name||'Prototype';state.scripts=scripts.slice();});
}).then(finish,fail);
})();