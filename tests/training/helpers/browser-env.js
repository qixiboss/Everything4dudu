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
    const re = /class="([^"]*)"/g;
    const out = [];
    let m;
    while ((m = re.exec(html))) {
      const clsSet = m[1].split(/\s+/);
      if (!classes.every((c) => clsSet.includes(c))) continue;
      if (excludeDisabled) {
        const before = html.slice(0, m.index);
        const openTag = before.slice(before.lastIndexOf('<'));
        if (/\sdisabled(\s|>|=)/.test(openTag)) continue;
      }
      out.push(new ElementStub('div', this.doc));
    }
    return out;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }
}

function createDocument() {
  const byId = new Map();
  const domReady = [];
  const doc = {
    activeElement: null,
    body: new ElementStub('body', null),
    _registerId(id) {
      if (!byId.has(id)) byId.set(id, new ElementStub('div', doc));
    },
    _indexHtml(html) {
      const re = /id="([^"]+)"/g;
      let m;
      while ((m = re.exec(html))) this._registerId(m[1]);
    },
    getElementById(id) {
      if (!byId.has(id)) byId.set(id, new ElementStub('div', doc));
      return byId.get(id);
    },
    querySelectorAll() {
      return [];
    },
    querySelector() {
      return null;
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
    },
    dispatchDOMContentLoaded() {
      domReady.slice().forEach((fn) => fn());
    }
  };
  doc.body.doc = doc;
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
  const winListeners = {};
  context.addEventListener = (type, fn) => {
    (winListeners[type] ||= []).push(fn);
  };
  context.dispatchWindow = (type) => {
    (winListeners[type] || []).slice().forEach((fn) => fn());
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
