const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'buyer.html'), 'utf8');

function assert(name, condition) {
  if (!condition) {
    throw new Error(name);
  }
}

assert('buyer mobile hides top nav links', /@media\(max-width:1024px\)[\s\S]*\.topbar\s+\.top-nav-links\{display:none;\}/.test(html));
assert('buyer mobile content has no left margin', /@media\(max-width:1024px\)[\s\S]*\.main\{margin-left:0!important;\}/.test(html));
assert('buyer sidebar opens by class', /\.sidebar\.open\{transform:translateX\(0\);/.test(html));
assert('buyer sidebar overlay is class controlled', /\.sidebar-overlay\.show\{display:block;\}/.test(html));
assert('buyer has no stray 180px sidebar override', !/}\s*\.sidebar\{width:180px;\}/.test(html));
assert('buyer toggle uses readable hamburger', /btn\.textContent = open \? "×" : "☰"/.test(html));
assert('buyer top nav does not expose inaccessible seller workbench', !/<div class=["']top-nav-links["']>[\s\S]*<a href=["']seller\.html["']>卖家工作台<\/a>/.test(html));

console.log('buyer page checks passed');
