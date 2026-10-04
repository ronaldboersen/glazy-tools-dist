(function(){
'use strict';
var API='https://api.github.com/repos/ronaldboersen/glazy-tools-dist/contents/rb-prototype-manifest.js?ref=main';
var STATE='RBPrototypeLoaderState';
var state=window[STATE]=window[STATE]||{};
if(state.busy)return;
state.busy=true;

function finish(){state.busy=false;}
function fail(err){
  finish();
  console.error('[RB Prototype]',err);
  alert('Ronald Prototype\\n\\nThe current prototype could not be loaded on this page.');
}
function load(el,label){
  return new Promise(function(resolve,reject){
    var timer=setTimeout(function(){settle(new Error(label+' took too long to load.'));},20000);
    function settle(err){
      clearTimeout(timer);
      el.onload=el.onerror=null;
      if(err){el.remove();reject(err);}else resolve();
    }
    el.onload=function(){settle();};
    el.onerror=function(){settle(new Error('Could not load '+label));};
    document.head.appendChild(el);
  });
}
function decodeContent(s){
  return decodeURIComponent(Array.prototype.map.call(atob(s.replace(/\\n/g,'')),function(c){
    return '%'+('00'+c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}
function parseManifest(src){
  var m=src.match(/RB_PROTOTYPE_MANIFEST\s*=\s*(\{[\s\S]*\})\s*;?\s*$/);
  if(!m)throw new Error('Could not parse prototype manifest.');
  return JSON.parse(m[1]);
}
function basename(url){return new URL(url,location.href).pathname.split('/').pop();}
function assetType(asset){
  if(asset&&typeof asset==='object'&&asset.type)return String(asset.type).toLowerCase();
  var src=typeof asset==='string'?asset:(asset&&asset.src)||'';
  if(/\.css(?:$|[?#])/i.test(src))return 'css';
  if(/\.js(?:$|[?#])/i.test(src))return 'js';
  throw new Error('Could not determine asset type for '+src);
}
function assetSrc(asset){
  return typeof asset==='string'?asset:(asset&&asset.src);
}
function buildUrl(src,base){
  if(!src)throw new Error('Manifest asset is missing src.');
  if(/^https?:\/\//i.test(src))return base+basename(src);
  return base+String(src).replace(/^\/+/, '');
}
function clearOldAssets(){
  var old=document.querySelectorAll('[data-rb-prototype-asset]');
  for(var i=0;i<old.length;i++)old[i].remove();
}
function makeAsset(asset,index,base){
  var type=assetType(asset);
  var src=buildUrl(assetSrc(asset),base);
  var el;
  if(type==='css'||type==='style'||type==='stylesheet'){
    el=document.createElement('link');
    el.rel='stylesheet';
    el.href=src;
  }else if(type==='js'||type==='script'){
    el=document.createElement('script');
    el.src=src;
  }else{
    throw new Error('Unsupported prototype asset type: '+type);
  }
  el.setAttribute('data-rb-prototype-asset',String(index));
  return {el:el,label:'prototype asset '+(index+1)};
}

fetch(API+'&rb='+Date.now(),{cache:'no-store',headers:{Accept:'application/vnd.github+json'}})
.then(function(r){
  if(!r.ok)throw new Error('Manifest API returned '+r.status);
  return r.json();
})
.then(function(j){
  var m=parseManifest(decodeContent(j.content||''));
  var assets=Array.isArray(m.assets)?m.assets:[];
  if(!m.ref||!assets.length)throw new Error('Manifest is missing immutable asset ref or assets.');

  if(window.RBPrototype&&window.RBPrototype.stop){try{window.RBPrototype.stop();}catch(e){}}
  if(window.RBGlazyMeltPredictor&&window.RBGlazyMeltPredictor.stop){try{window.RBGlazyMeltPredictor.stop();}catch(e){}}

  clearOldAssets();

  var base='https://cdn.jsdelivr.net/gh/ronaldboersen/glazy-tools-dist@'+encodeURIComponent(m.ref)+'/';
  var chain=Promise.resolve();

  assets.forEach(function(asset,index){
    chain=chain.then(function(){
      var built=makeAsset(asset,index,base);
      return load(built.el,built.label);
    });
  });

  return chain.then(function(){
    state.version=m.version;
    state.name=m.name||'Prototype';
    state.assets=assets.slice();
  });
})
.then(finish,fail);
})();