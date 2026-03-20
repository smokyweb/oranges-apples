'use strict';
// react-dom compat shim for React 19 + react-native-web@0.19
// DO NOT spread ReactDOM via Object.assign — React 19 attaches createRoot as a getter,
// and Object.assign calls getters eagerly, which crashes before the DOM is ready.
// Instead, lazily proxy all react-dom exports through defineProperty.

let _reactDom = null;
let _client = null;

function getReactDom() {
  if (!_reactDom) _reactDom = require('../../node_modules/react-dom/cjs/react-dom.production.js');
  return _reactDom;
}
function getClient() {
  if (!_client) _client = require('../../node_modules/react-dom/cjs/react-dom-client.production.js');
  return _client;
}

const roots = new WeakMap();

function render(element, container, callback) {
  if (!roots.has(container)) roots.set(container, getClient().createRoot(container));
  roots.get(container).render(element);
  if (typeof callback === 'function') setTimeout(callback, 0);
  return null;
}
function hydrate(element, container, callback) {
  if (!roots.has(container)) roots.set(container, getClient().hydrateRoot(container, element));
  else roots.get(container).render(element);
  if (typeof callback === 'function') setTimeout(callback, 0);
  return null;
}
function unmountComponentAtNode(container) {
  if (roots.has(container)) { roots.get(container).unmount(); roots.delete(container); return true; }
  return false;
}
function findDOMNode(instance) {
  return instance instanceof Element ? instance : null;
}

// Safe stable exports from react-dom (not from react-dom-client)
const mod = {};
Object.defineProperty(mod, 'createPortal', {
  get() { return getReactDom().createPortal; }, enumerable: true, configurable: true,
});
Object.defineProperty(mod, 'flushSync', {
  get() { return getReactDom().flushSync; }, enumerable: true, configurable: true,
});
Object.defineProperty(mod, 'unstable_batchedUpdates', {
  get() { return getReactDom().unstable_batchedUpdates; }, enumerable: true, configurable: true,
});
Object.defineProperty(mod, 'version', {
  get() { return getReactDom().version; }, enumerable: true, configurable: true,
});
Object.defineProperty(mod, '__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE', {
  get() { return getReactDom().__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE; },
  enumerable: true, configurable: true,
});
// React 18 compat APIs (removed in React 19, provided by this shim)
mod.render = render;
mod.hydrate = hydrate;
mod.unmountComponentAtNode = unmountComponentAtNode;
mod.findDOMNode = findDOMNode;
// React 19 concurrent APIs — lazy (only called when actually used at runtime)
Object.defineProperty(mod, 'createRoot', {
  get() { return getClient().createRoot; }, enumerable: true, configurable: true,
});
Object.defineProperty(mod, 'hydrateRoot', {
  get() { return getClient().hydrateRoot; }, enumerable: true, configurable: true,
});
// default export for ESM interop
mod.default = mod;

module.exports = mod;
