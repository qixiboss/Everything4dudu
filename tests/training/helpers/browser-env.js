const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '../../..');

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

  toggle(name, force) {
    const on = force === undefined ? !this.values.has(name) : force;
    if (on) this.values.add(name);
    else this.values.delete(name);
    return on;
  }

  contains(name) {
    return this.values.has(name);
  }

  get value() {
    return Array.from(this.values).join(' ');
  }
}

class ElementStub {
  constructor(tagName = 'div', doc = null) {
    this.tagName = tagName.toUpperCase();
    this.doc = doc;
    this.children = [];
    this.parentNode = null;
    this.classList = new ClassList();
    this.style = {};
    this.attributes = {};
    this.dataset = {};
    this.listeners = {};
    this.textContent = '';
    this.disabled = false;
    this.href = '';
    this.type = '';
    this.value = '';
    this.checked = false;
    this.hidden = false;
    this.open = false;
    this.offsetWidth = 0;
    this.offsetHeight = 0;
    this._innerHTML = '';
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(html) {
    this._innerHTML = String(html);
    this.children = [];
    if (this.doc) this.doc._indexHtml(this._innerHTML);
  }

  get className() {
    return this.classList.value;
  }

  set className(value) {
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

  dispatchEvent(event) {
    (this.listeners[event.type] || []).slice().forEach((listener) => listener.call(this, event));
    return true;
  }

  getBoundingClientRect() {
    return { top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 };
  }

  showModal() {
    this.open = true;
  }

  close() {
    this.open = false;
  }

  /* 支持应用实际用到的选择器：.class、#id、:not(:disabled)。
     html 片段中的 class="…" 出现次数即为匹配元素个数。 */
  querySelectorAll(selector) {
    const tokens = String(selector).split(/\s+/).filter(Boolean);
    const classes = [];
    let excludeDisabled = false;
    for (const token of tokens) {
      if (token.includes(':not(:disabled)')) excludeDisabled = true;
      const base = token.split(':')[0];
      if (base.startsWith('.')) classes.push(base.slice(1));
    }
    if (!classes.length) return [];
    const html = this._innerHTML;
    const re = /<([a-z][\w-]*)\b([^>]*)>/gi;
    const out = [];
    let m;
    while ((m = re.exec(html))) {
      const classMatch = m[2].match(/\bclass="([^"]*)"/);
      const clsSet = classMatch ? classMatch[1].split(/\s+/) : [];
      if (!classes.every((c) => clsSet.includes(c))) continue;
      if (excludeDisabled && /\sdisabled(?:\s|=|$)/.test(m[2])) continue;
      const element = new ElementStub(m[1], this.doc);
      applyAttributes(element, m[2]);
      out.push(element);
    }
    return out;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }
}

function applyAttributes(element, source) {
  const re = /([:\w-]+)(?:="([^"]*)")?/g;
  let match;
  while ((match = re.exec(source))) {
    const name = match[1];
    const value = match[2] === undefined ? '' : match[2];
    if (name === 'class') element.className = value;
    else if (name === 'disabled') element.disabled = true;
    else if (name.startsWith('data-')) {
      const key = name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      element.dataset[key] = value;
    } else {
      element.attributes[name] = value;
      if (name === 'id') element.id = value;
      if (name === 'value') element.value = value;
    }
  }
}

function createDocument(initialHtml = '') {
  const byId = new Map();
  const elements = [];
  const domReady = [];
  const listeners = {};
  const doc = {
    activeElement: null,
    body: new ElementStub('body', null),
    _registerId(id, element) {
      if (!byId.has(id)) byId.set(id, element || new ElementStub('div', doc));
      return byId.get(id);
    },
    _indexHtml(html) {
      const re = /<([a-z][\w-]*)\b([^>]*)>/gi;
      let m;
      while ((m = re.exec(html))) {
        const idMatch = m[2].match(/\bid="([^"]+)"/);
        let element = idMatch && byId.get(idMatch[1]);
        if (!element) {
          element = new ElementStub(m[1], doc);
          elements.push(element);
        }
        applyAttributes(element, m[2]);
        if (idMatch) this._registerId(idMatch[1], element);
      }
    },
    getElementById(id) {
      if (!byId.has(id)) byId.set(id, new ElementStub('div', doc));
      return byId.get(id);
    },
    querySelectorAll(selector) {
      const match = String(selector).match(/^\.([\w-]+)$/);
      return match ? elements.filter((element) => element.classList.contains(match[1])) : [];
    },
    querySelector(selector) {
      return this.querySelectorAll(selector)[0] || null;
    },
    createElement(tagName) {
      return new ElementStub(tagName, doc);
    },
    createTextNode(text) {
      const node = new ElementStub('#text', doc);
      node.textContent = String(text);
      return node;
    },
    addEventListener(type, listener) {
      if (type === 'DOMContentLoaded') domReady.push(listener);
      else (listeners[type] ||= []).push(listener);
    },
    dispatchEvent(event) {
      (listeners[event.type] || []).slice().forEach((listener) => listener.call(doc, event));
      return true;
    },
    dispatchDOMContentLoaded() {
      domReady.slice().forEach((fn) => fn());
    }
  };
  doc.body.doc = doc;
  if (initialHtml) doc._indexHtml(String(initialHtml));
  return doc;
}

function createBrowserContext(options = {}) {
  const document = options.document || createDocument();
  const clock = {
    _t: typeof options.clockStart === 'number' ? options.clockStart : 0,
    now() {
      return this._t;
    },
    advance(ms) {
      this._t += ms;
    }
  };
  const RealDate = Date;
  function FakeDate(...args) {
    if (this instanceof FakeDate) return new RealDate(...args);
    return new RealDate(...args).toString();
  }
  FakeDate.now = () => clock.now();
  FakeDate.parse = RealDate.parse;
  FakeDate.UTC = RealDate.UTC;

  const timers = { intervals: new Set(), timeouts: new Set() };
  const context = vm.createContext({
    console,
    localStorage: options.localStorage || createStorage(),
    document,
    location: { hash: '' },
    Date: FakeDate,
    Intl,
    Promise,
    CustomEvent: function CustomEvent(type, init) {
      this.type = type;
      this.detail = init && init.detail;
    },
    setTimeout(fn, ms) {
      const id = setTimeout(fn, ms);
      timers.timeouts.add(id);
      return id;
    },
    clearTimeout(id) {
      clearTimeout(id);
      timers.timeouts.delete(id);
    },
    setInterval(fn, ms) {
      const id = setInterval(fn, ms);
      timers.intervals.add(id);
      return id;
    },
    clearInterval(id) {
      clearInterval(id);
      timers.intervals.delete(id);
    },
    confirm: () => true
  });

  context.window = context;
  context.self = context;
  context.innerWidth = 1024;
  context.innerHeight = 768;
  context.matchMedia = () => ({ matches: false });
  const winListeners = {};
  context.addEventListener = (type, fn) => {
    (winListeners[type] ||= []).push(fn);
  };
  context.dispatchWindow = (type) => {
    (winListeners[type] || []).slice().forEach((fn) => fn());
  };
  context.dispatchEvent = (event) => {
    (winListeners[event.type] || []).slice().forEach((fn) => fn(event));
    return true;
  };
  context.clearTimers = () => {
    timers.intervals.forEach((id) => clearInterval(id));
    timers.intervals.clear();
    timers.timeouts.forEach((id) => clearTimeout(id));
    timers.timeouts.clear();
  };
  context.clock = clock;
  return context;
}

function loadScript(context, relativePath) {
  const absolutePath = path.join(projectRoot, relativePath);
  const source = fs.readFileSync(absolutePath, 'utf8');
  vm.runInContext(source, context, { filename: absolutePath });
}

/* site/ 是直接维护并发布的门户应用源码。 */
function loadTrainingApp(options = {}) {
  const context = createBrowserContext(options);
  loadScript(context, 'site/training/model.js');
  loadScript(context, 'site/training/app.js');
  return context;
}

module.exports = {
  ClassList,
  ElementStub,
  createBrowserContext,
  createDocument,
  createStorage,
  loadScript,
  loadTrainingApp
};
