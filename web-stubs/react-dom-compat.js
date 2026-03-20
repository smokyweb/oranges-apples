'use strict';
// Compatibility shim: react-native-web@0.19 uses React 18 APIs removed in React 19.
// We re-export react-dom and add back the removed APIs using react-dom/client.

const ReactDOM = require('react-dom');
const ReactDOMClient = require('react-dom/client');

// Cache roots per container so we don't create duplicates
const roots = new WeakMap();

function getOrCreateRoot(container) {
  if (!roots.has(container)) {
    roots.set(container, ReactDOMClient.createRoot(container));
  }
  return roots.get(container);
}

function render(element, container, callback) {
  const root = getOrCreateRoot(container);
  root.render(element);
  if (typeof callback === 'function') setTimeout(callback, 0);
  return null;
}

function hydrate(element, container, callback) {
  let root;
  if (!roots.has(container)) {
    root = ReactDOMClient.hydrateRoot(container, element);
    roots.set(container, root);
  } else {
    root = roots.get(container);
    root.render(element);
  }
  if (typeof callback === 'function') setTimeout(callback, 0);
  return null;
}

function unmountComponentAtNode(container) {
  if (roots.has(container)) {
    roots.get(container).unmount();
    roots.delete(container);
    return true;
  }
  return false;
}

function findDOMNode(instance) {
  if (instance == null) return null;
  if (instance instanceof Element) return instance;
  return null;
}

module.exports = Object.assign({}, ReactDOM, {
  render,
  hydrate,
  unmountComponentAtNode,
  findDOMNode,
  createRoot: ReactDOMClient.createRoot,
  hydrateRoot: ReactDOMClient.hydrateRoot,
});
