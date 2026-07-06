const fs = require('fs');
const path = require('path');

const htmlDir = __dirname;
const commonCss = fs.readFileSync(path.join(htmlDir, 'css', 'common.css'), 'utf8');
const menuJs = fs.readFileSync(path.join(htmlDir, 'js', 'menu.js'), 'utf8');
const pages = fs.readdirSync(htmlDir).filter((file) => file.endsWith('.html'));
const topNavPages = pages.filter((file) => {
  const html = fs.readFileSync(path.join(htmlDir, file), 'utf8');
  return html.includes('class="top-nav"');
});

function assert(name, condition) {
  if (!condition) {
    throw new Error(name);
  }
}

assert('top nav pages exist', topNavPages.length > 0);
for (const file of topNavPages) {
  const html = fs.readFileSync(path.join(htmlDir, file), 'utf8');
  assert(`${file} loads common css`, /href=["']css\/common\.css["']/.test(html));
}

assert('common css compacts mobile top nav height', /\.top-nav\s+\.nav-inner\{height:60px!important;/.test(commonCss));
assert('common css switches public top nav to compact mode on narrow desktop', /@media\s*\(max-width:\s*1500px\)[\s\S]*\.top-nav\s+\.nav-menu,\s*\.top-nav\s+\.nav-links\{display:none!important;\}[\s\S]*\.top-nav\s+\.menu-icon\{display:block!important;/.test(commonCss));
assert('common css prevents desktop top nav label wrapping', /\.top-nav\s+\.nav-menu\s+a,\s*\.top-nav\s+\.nav-login,\s*\.top-nav\s+\.nav-role-btn,\s*\.top-nav\s+\.nav-btn,\s*\.top-nav\s+\.user-greeting,\s*\.top-nav\s+\.user-greeting\s+\*\s*\{\s*white-space:\s*nowrap;\s*\}/.test(commonCss));
assert('common css shrinks mobile top nav logo', /\.top-nav\s+\.logo\{font-size:22px!important;/.test(commonCss));
assert('common css bounds mobile nav right area', /\.top-nav\s+\.nav-right\{gap:6px!important;min-width:0!important;max-width:calc\(100vw - 150px\)!important;/.test(commonCss));
assert('common css hides long logged-in public nav text', /\.top-nav\s+\.user-greeting\s+#userPhone,\s*\.top-nav\s+\.user-greeting\s+\.verify-badge,\s*\.top-nav\s+\.user-greeting\s+a,\s*\.top-nav\s+\.user-greeting\s+\.logout-link\{display:none!important;\}/.test(commonCss));
assert('common css compacts member user info', /\.top-nav\s+\.user-info\s+#navPhone,\s*\.top-nav\s+\.user-info\s+a\{display:none!important;\}/.test(commonCss));
assert('common css constrains back links', /\.top-nav\s+\.nav-back,\s*\.top-nav\s+\.nav-inner>a:not\(\.logo\)\{font-size:13px!important;/.test(commonCss));
assert('common css exposes mobile menu open state', /\.top-nav\s+\.nav-menu\.mobile-menu-open,\s*\.top-nav\s+\.nav-links\.mobile-menu-open\{display:flex!important;position:fixed!important;top:60px!important;/.test(commonCss));
assert('menu script toggles open class', /classList\.toggle\('mobile-menu-open', open\)/.test(menuJs));
assert('menu script uses readable icons', /open \? '×' : '≡'/.test(menuJs));
assert('menu script keeps compact menu active through narrow desktop width', /window\.innerWidth > 1500/.test(menuJs));
assert('menu script does not fight css with inline display', !/style\.display\s*=/.test(menuJs));

console.log(`top nav checks passed for ${topNavPages.length} pages`);
