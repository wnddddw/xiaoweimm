const fs = require('fs');
const path = require('path');
const vm = require('vm');

const authJs = fs.readFileSync(path.join(__dirname, 'js', 'auth.js'), 'utf8');
const pages = [
  'index.html',
  'login.html',
  'service.html',
  'contact.html',
  'company.html',
  'column.html',
  'case.html',
].map((file) => ({
  file,
  html: fs.readFileSync(path.join(__dirname, file), 'utf8'),
}));

function assert(name, condition) {
  if (!condition) {
    throw new Error(name);
  }
}

function createElement(initialClasses = []) {
  const classSet = new Set(initialClasses);
  return {
    disabled: false,
    textContent: '',
    value: '',
    style: {},
    checked: false,
    href: '',
    listeners: {},
    classList: {
      add(className) {
        classSet.add(className);
      },
      remove(className) {
        classSet.delete(className);
      },
      contains(className) {
        return classSet.has(className);
      },
    },
    addEventListener(eventName, handler) {
      this.listeners[eventName] = handler;
    },
    getAttribute() {
      return null;
    },
    setAttribute() {},
  };
}

assert('auth script uses shared auth message surface instead of blocking alert for password validation', !/if\s*\(!pwd\)\s*\{\s*alert\(/.test(authJs));
assert('auth script reads register password field', /document\.getElementById\('regPassword'\)/.test(authJs));
assert('auth script sends register password to backend', /register\(phone,\s*code,\s*name,\s*role,\s*password,/.test(authJs));
assert('auth script binds phone-tab links via data attribute selector', /querySelectorAll\(["']\[data-auth-switch=["']phone["']\]["']\)/.test(authJs));

pages.forEach(({ file, html }) => {
  assert(`${file} includes register password input`, /id="regPassword"/.test(html));
  assert(`${file} marks both phone-tab switch links with data attribute`, (html.match(/data-auth-switch="phone"/g) || []).length >= 2);
  assert(`${file} does not reuse duplicate toPhone ids`, (html.match(/id="toPhone"/g) || []).length === 0);
});

const elements = {
  tabPhone: createElement(['active']),
  tabPwd: createElement(),
  tabReg: createElement(),
  phoneForm: createElement(['active']),
  pwdForm: createElement(),
  regForm: createElement(),
};

const documentMock = {
  body: { appendChild() {} },
  getElementById(id) {
    return elements[id] || null;
  },
  querySelectorAll() {
    return [];
  },
  querySelector() {
    return null;
  },
  createElement() {
    return createElement();
  },
  addEventListener() {},
};

const sessionStorageMock = {
  getItem() {
    return null;
  },
  setItem() {},
  removeItem() {},
};

const context = {
  window: {},
  document: documentMock,
  sessionStorage: sessionStorageMock,
  console,
  fetch() {
    throw new Error('fetch should not run during initPage test');
  },
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  JSON,
  Date,
};

context.window = context;
vm.runInNewContext(authJs, context);
context.XW.Auth.initPage();

assert('auth init defaults to password tab for test-account login', elements.tabPwd.classList.contains('active'));
assert('auth init defaults to password form for test-account login', elements.pwdForm.classList.contains('active'));
assert('auth init clears phone tab active state by default', !elements.tabPhone.classList.contains('active'));
assert('auth init clears phone form active state by default', !elements.phoneForm.classList.contains('active'));

console.log('auth modal checks passed');
