// Standalone Batch Designer loader, adapted from the proven prototype launcher.
/* Frozen launcher lifecycle from prototype protocol 3, scoped to Batch Designer.
 * The dedicated manifest follows this app independently of prototype projects.
 */
(function () {
  'use strict';
  var BASE = 'https://ronaldboersen.github.io/glazy-tools-dist/';
  var MANIFEST = BASE + 'rb-batch-label-designer-manifest.js';
  var STATE = 'RBBatchDesignerLauncherV1';
  var state = window[STATE] = window[STATE] || { busy: false, current: null };
  if (state.busy) return;
  // An external script may execute even after its element has been removed.
  // Do not start a competing experiment after an uncertain script timeout.
  if (state.needsReload) {
    alert('Please reload this page before trying the prototype again. A previous script did not finish loading.');
    return;
  }
  state.busy = true;
  var pending = [], candidate = null, before = null, started = false;
  var feedback = document.createElement('div');
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-live', 'polite');
  feedback.textContent = 'Loading Ronald’s prototype…';
  feedback.style.cssText = 'position:fixed;bottom:18px;right:18px;z-index:2147483647;background:#fff;color:#444;border:1px solid #ddd;border-radius:8px;padding:12px 16px;font:14px/1.4 system-ui;max-width:calc(100vw - 60px)';
  document.documentElement.appendChild(feedback);

  function remove(nodes) { nodes.forEach(function (node) { node.remove(); }); }
  function load(element, label) {
    return new Promise(function (resolve, reject) {
      var settled = false;
      var timer = setTimeout(function () {
        if (element.tagName === 'SCRIPT') state.needsReload = true;
        settle(new Error(label + ' took too long to load. Please reload the page before trying again.'));
      }, 20000);
      function settle(error) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        element.onload = element.onerror = null;
        if (error) { element.remove(); reject(error); } else resolve();
      }
      element.onload = function () { settle(); };
      element.onerror = function () { settle(new Error('Could not load ' + label + '. Please try again.')); };
      try { document.head.appendChild(element); }
      catch (error) { settle(error); }
    });
  }

  // Validate every field/address BEFORE touching the running experiment.
  // Assets are versioned files on our Pages origin, not raw GitHub downloads.
  function validate(value) {
    if (!value || value.schema !== 3 || typeof value.name !== 'string' || !value.name.trim() ||
        typeof value.version !== 'string' || !value.version.trim() ||
        typeof value.appVersion !== 'string' || !value.appVersion.trim() ||
        typeof value.appGlobal !== 'string' || !/^RB[A-Za-z0-9_]+$/.test(value.appGlobal) ||
        !Array.isArray(value.assets) || !value.assets.length) {
      throw new Error('The prototype release information is incomplete.');
    }
    if (['RBBatchDesignerLauncherV1', 'RB_BATCH_LABEL_DESIGNER_MANIFEST'].includes(value.appGlobal)) {
      throw new Error('The prototype application name conflicts with the launcher.');
    }
    var seen = new Set();
    var assets = value.assets.map(function (asset) {
      if (!asset || !['js', 'css'].includes(asset.type) || typeof asset.src !== 'string') {
        throw new Error('The prototype contains an invalid asset.');
      }
      var url = new URL(asset.src, BASE);
      if (url.origin !== new URL(BASE).origin || !url.pathname.startsWith('/glazy-tools-dist/') ||
          url.username || url.password || url.search || url.hash || !url.pathname.endsWith('.' + asset.type)) {
        throw new Error('The prototype contains an unexpected asset address.');
      }
      if (seen.has(url.href)) throw new Error('The prototype lists an asset twice.');
      seen.add(url.href);
      return { type: asset.type, src: url.href };
    });
    if (!assets.some(function (asset) { return asset.type === 'js'; })) throw new Error('The prototype has no application script.');
    if (value.page && (typeof value.page.host !== 'string' || !Array.isArray(value.page.pathPrefixes) ||
        !value.page.pathPrefixes.length || value.page.pathPrefixes.some(function (p) { return typeof p !== 'string' || !p.startsWith('/'); }))) {
      throw new Error('The prototype page requirements are invalid.');
    }
    if (value.page && (location.hostname !== value.page.host || !value.page.pathPrefixes.some(function (p) { return location.pathname.startsWith(p); }))) {
      throw new Error(typeof value.page.message === 'string' ? value.page.message : 'Open the appropriate page for this prototype first.');
    }
    return {
      name: value.name, version: value.version, appVersion: value.appVersion,
      appGlobal: value.appGlobal, assets: assets,
      key: JSON.stringify([value.appGlobal, value.appVersion, value.version, assets])
    };
  }
  function usable(api, manifest) {
    return api && api.version === manifest.appVersion && typeof api.stop === 'function';
  }
  async function stop(api) {
    if (!api) return;
    if (api.isBusy) throw new Error('The current tool is still working. Let it finish before switching prototypes.');
    if (typeof api.stop !== 'function') throw new Error('The current prototype cannot close cleanly. Please reload the page.');
    if (await api.stop() === false) throw new Error('The current tool is still working. Let it finish before switching prototypes.');
  }
  async function run() {
    // Script-src avoids API rate limits and fetch/CORS dependencies.
    delete window.RB_BATCH_LABEL_DESIGNER_MANIFEST;
    var manifestNode = document.createElement('script');
    manifestNode.src = MANIFEST + '?rb=' + Date.now() + '-' + Math.random().toString(36).slice(2);
    try { await load(manifestNode, 'prototype release information'); }
    finally { manifestNode.remove(); }
    candidate = validate(window.RB_BATCH_LABEL_DESIGNER_MANIFEST);
    if(candidate.appGlobal !== 'RBBatchLabelDesigner') throw new Error('This launcher can only open Batch Label Designer.');
    feedback.textContent = 'Loading ' + candidate.name + '…';

    var current = state.current;
    if (current && current.key === candidate.key && window[current.appGlobal] === current.api &&
        usable(current.api, candidate) && typeof current.api.open === 'function') {
      await current.api.open();
      return;
    }
    before = window[candidate.appGlobal];
    // Validate both lifecycle states before closing either application.
    var instances = [];
    if (current && window[current.appGlobal] === current.api) instances.push(current.api);
    if (before && !instances.includes(before)) instances.push(before);
    instances.forEach(function (api) {
      if (api.isBusy || typeof api.stop !== 'function') throw new Error('The current tool cannot close yet. Let it finish or reload this page.');
    });
    for (var api of instances) await stop(api);
    if (current) remove(current.nodes);
    state.current = null;
    started = true;

    // Styles and dependency scripts retain their manifest order.
    for (var asset of candidate.assets) {
      var node = document.createElement(asset.type === 'css' ? 'link' : 'script');
      if (asset.type === 'css') { node.rel = 'stylesheet'; node.href = asset.src; }
      else { node.src = asset.src; node.async = false; }
      node.setAttribute('data-rb-prototype-v3', candidate.version);
      pending.push(node);
      await load(node, asset.type === 'css' ? 'prototype stylesheet' : 'prototype script');
    }
    var app = window[candidate.appGlobal];
    if (app === before || !usable(app, candidate)) {
      throw new Error('The prototype script loaded but did not start correctly. Please try again.');
    }
    state.current = { key: candidate.key, appGlobal: candidate.appGlobal, api: app, nodes: pending.slice(), name: candidate.name, version: candidate.version };
  }
  run().catch(async function (error) {
    if (started) {
      var app = candidate && window[candidate.appGlobal];
      if (app && app !== before) {
        try { await stop(app); }
        catch (cleanupError) { state.needsReload = true; console.error('[RB Prototype cleanup]', cleanupError); }
      }
      remove(pending);
    }
    console.error('[RB Prototype]', error);
    alert('Batch Label Designer\n\n' + error.message);
  }).finally(function () {
    state.busy = false;
    feedback.remove();
  });
})();
