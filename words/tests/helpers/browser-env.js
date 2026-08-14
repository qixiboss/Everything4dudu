const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '../..');

function createStorage(initialValues = {}) {
  const values = new Map(
    Object.entries(initialValues).map(([key, value]) => [key, String(value)])
  );

  return {
    getItem(key) {
      return values.has(String(key)) ? values.get(String(key)) : null;
    },
    setItem(key, value) {
      values.set(String(key), String(value));
    },
    removeItem(key) {
      values.delete(String(key));
    },
    clear() {
      values.clear();
    }
  };
}

class ClassList {
  constructor() {
    this.values = new Set();
  }

  add(...names) {
    names.forEach((name) => this.values.add(name));
  }

  remove(...names) {
    names.forEach((name) => this.values.delete(name));
  }

  contains(name) {
    return this.values.has(name);
  }

  get value() {
    return Array.from(this.values).join(' ');
  }
}

class ElementStub {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.classList = new ClassList();
    this.style = {};
    this.attributes = {};
    this.listeners = {};
    this.textContent = '';
    this.disabled = false;
    this.href = '';
    this.type = '';
  }

  get className() {
    return this.classList.value;
  }

  set className(value) {
    // Matches the DOM contract: className reflects the class list, so a
    // classList.add() after an assignment stays visible to selectors.
    this.classList.values = new Set(String(value).split(/\s+/).filter(Boolean));
  }

  get firstChild() {
    return this.children[0] || null;
  }

  get lastChild() {
    return this.children[this.children.length - 1] || null;
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index >= 0) this.children.splice(index, 1);
    child.parentNode = null;
    return child;
  }

  remove() {
    if (this.parentNode) this.parentNode.removeChild(this);
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  removeAttribute(name) {
    delete this.attributes[name];
  }

  addEventListener(type, listener) {
    (this.listeners[type] ||= []).push(listener);
  }

  querySelectorAll(selector) {
    const matches = (node) => {
      const tokens = selector.split(/\s+/).filter(Boolean);
      if (!tokens.length) return false;
      return tokens.every((token) =>
        token.startsWith('.')
          ? this.classList.contains(token.slice(1))
          : node.tagName === token.toUpperCase()
      );
    };
    return collect(this, matches);
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }
}

function collect(node, matches) {
  const found = [];
  if (matches(node)) found.push(node);
  for (const child of node.children) {
    found.push(...collect(child, matches));
  }
  return found;
}

function createDocument() {
  return {
    body: new ElementStub('body'),
    activeElement: null,
    createElement: (tagName) => new ElementStub(tagName),
    createTextNode(text) {
      const node = new ElementStub('#text');
      node.textContent = String(text);
      return node;
    },
    getElementById: () => null,
    querySelectorAll: () => [],
    querySelector: () => null
  };
}

function createBrowserContext(options = {}) {
  const document = options.document || createDocument();
  const context = vm.createContext({
    console,
    localStorage: options.localStorage || createStorage(),
    document,
    location: { hash: '' },
    setTimeout,
    clearTimeout,
    Intl,
    Promise
  });

  context.window = context;
  context.self = context;
  context.addEventListener = () => {};
  return context;
}

function loadScript(context, relativePath) {
  const absolutePath = path.join(projectRoot, relativePath);
  const source = fs.readFileSync(absolutePath, 'utf8');
  vm.runInContext(source, context, { filename: absolutePath });
}

function loadLearningApp(options = {}) {
  const context = createBrowserContext(options);
  loadScript(context, 'vocab-essays/vendor/ts-fsrs/index.umd.js');
  loadScript(context, 'vocab-essays/js/namespace.js');
  loadScript(context, 'vocab-essays/js/data.js');
  loadScript(context, 'vocab-essays/js/learning-progress-v2.js');
  return context;
}

module.exports = {
  ElementStub,
  createBrowserContext,
  createDocument,
  createStorage,
  loadLearningApp,
  loadScript
};
