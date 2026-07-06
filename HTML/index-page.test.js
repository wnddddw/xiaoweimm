const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const authJs = fs.readFileSync(path.join(__dirname, 'js', 'auth.js'), 'utf8');

function assert(name, condition) {
  if (!condition) {
    throw new Error(name);
  }
}

assert('mobile header has compact nav height', /\.nav-inner\{height:60px;gap:8px;/.test(html));
assert('mobile logo is smaller', /\.logo\{font-size:22px;/.test(html));
assert('logged-in mobile header hides long user text', /\.user-greeting\s+#userPhone,\s*\.user-greeting\s+\.verify-badge,\s*\.user-greeting\s+a,\s*\.user-greeting\s+\.logout-link\{display:none;\}/.test(html));
assert('mobile right nav has bounded width', /\.nav-right\{gap:6px;min-width:0;max-width:calc\(100vw - 150px\);/.test(html));
assert('login modal has no stray comment close', !/<\/div>\s*-->/.test(html));
assert('html comments are balanced', (html.match(/<!--/g) || []).length === (html.match(/-->/g) || []).length);
assert('homepage hero removes duplicated enterprise wording', !/中小企业企业转让/.test(html));
assert('homepage copy removes M&A wording', !/M&A/.test(html));
assert('auth binds all phone login switch links', /querySelectorAll\(["']\[data-auth-switch=["']phone["']\]["']\)/.test(authJs));
assert('auth attaches phone tab handler to every matching switch link', /forEach\.call\(phoneSwitchLinks/.test(authJs));

console.log('index page checks passed');
