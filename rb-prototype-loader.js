(function () {
  'use strict';
  var MANIFEST_URL = 'https://ronaldboersen.github.io/glazy-tools-dist/rb-prototype-manifest.js';
  var MANIFEST_GLOBAL = 'RB_PROTOTYPE_MANIFEST';
  var SCRIPT_ID = 'rb-prototype-script';
  var STYLE_ID = 'rb-prototype-style';
  var LOADER_STATE = 'RBPrototypeLoaderState';
  var state = window[LOADER_STATE] = window[LOADER_STATE] || {};
  if (state.busy) return;
  state.busy = true;

  function finish(){ state.busy=false; }
  function remove(id){ var n=document.getElementById(id); if(n)n.remove(); }
  function load(el,label){
    return new Promise(function(resolve,reject){
      var timer=setTimeout(function(){settle(new Error(label+' took too long to load.'));},20000);
      function settle(err){clearTimeout(timer);el.onload=el.onerror=null;if(err){el.remove();reject(err);}else resolve();}
      el.onload=function(){settle();};
      el.onerror=function(){settle(new Error('Could not load '+label));};
      document.head.appendChild(el);
    });
  }
  function assetURL(value){
    var url=new URL(value);
    if(url.origin!=='https://ronaldboersen.github.io'||!url.pathname.startsWith('/glazy-tools-dist/')) throw new Error('Unexpected prototype asset address.');
    url.searchParams.set('rb',Date.now());
    return url.href;
  }
  function useManifest(){
    var m=window[MANIFEST_GLOBAL];
    if(!m||typeof m.version!=='string'||!m.script) throw new Error('Missing prototype release information.');
    if(window.RBPrototype&&window.RBPrototype.stop){try{window.RBPrototype.stop();}catch(e){}}
    if(window.RBGlazyMeltPredictor&&window.RBGlazyMeltPredictor.stop){try{window.RBGlazyMeltPredictor.stop();}catch(e){}}
    remove(SCRIPT_ID); remove(STYLE_ID);
    var chain=Promise.resolve();
    if(m.style){
      chain=chain.then(function(){
        var css=document.createElement('link');
        css.id=STYLE_ID; css.rel='stylesheet'; css.href=assetURL(m.style); css.dataset.rbVersion=m.version;
        return load(css,'prototype stylesheet');
      });
    }
    return chain.then(function(){
      var js=document.createElement('script');
      js.id=SCRIPT_ID; js.src=assetURL(m.script); js.dataset.rbVersion=m.version;
      return load(js,'prototype script');
    }).then(function(){
      state.version=m.version; state.name=m.name||'Prototype';
    });
  }

  delete window[MANIFEST_GLOBAL];
  var ms=document.createElement('script');
  ms.src=MANIFEST_URL+'?rb='+Date.now();
  load(ms,'prototype manifest').then(function(){ms.remove();return useManifest();}).then(finish,function(err){
    finish(); console.error('[RB Prototype]',err); alert('Ronald Prototype\n\nThe current prototype could not be loaded on this page.');
  });
})();