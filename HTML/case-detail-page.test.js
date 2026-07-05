const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'case-detail.html'), 'utf8');
const commonCss = fs.readFileSync(path.join(__dirname, 'css', 'common.css'), 'utf8');

function assert(name, condition) {
  if (!condition) {
    throw new Error(name);
  }
}

const imgTags = html.match(/<img\b[^>]*>/g) || [];
const imageAltValues = imgTags.map((tag) => {
  const match = tag.match(/\salt=["']([^"']+)["']/);
  return match ? match[1] : '';
});

assert('case detail includes original project info section', html.includes('原项目信息'));
assert('case detail includes project image gallery section', html.includes('项目图片'));
assert('case detail includes asset inventory section', html.includes('资产清单'));
assert('case detail marks project fields for future API hydration', /data-project-field=["']project_id["']/.test(html));
assert('case detail marks asset categories for future API hydration', /data-asset-type=["']equipment["']/.test(html));
assert('case detail contains at least four real image tags', imgTags.length >= 4);
assert('all case detail images include Chinese alt text', imageAltValues.length === imgTags.length && imageAltValues.every((alt) => /[\u4e00-\u9fff]/.test(alt)));
assert('asset inventory includes equipment category', html.includes('设备'));
assert('asset inventory includes raw material category', html.includes('原料'));
assert('asset inventory includes stock category', html.includes('库存'));
assert('mobile gallery layout is responsive', /@media\s*\(max-width:\s*768px\)[\s\S]*\.project-gallery\{grid-template-columns:1fr;/.test(html));
assert('mobile asset list becomes cards', /@media\s*\(max-width:\s*768px\)[\s\S]*\.asset-list\{grid-template-columns:1fr;/.test(html));
assert('case hero uses compact vertical padding', /\.case-hero\{[^}]*padding:34px 0 30px;/.test(html));
assert('case hero title is compact on desktop', /\.case-hero h1\{[^}]*font-size:30px;/.test(html));
assert('case hero metrics use compact desktop spacing', /\.hero-metrics\{[^}]*gap:18px;/.test(html));
assert('case hero mobile title stays compact', /@media\s*\(max-width:\s*768px\)[\s\S]*\.case-hero h1\{font-size:22px;/.test(html));
assert('info table has stronger visual frame', /\.info-table\{[^}]*border:1px solid rgba\(26,68,170,0\.34\);[^}]*box-shadow:0 14px 34px rgba\(26,68,170,0\.10\);/.test(html));
assert('info table has restrained top accent bar', /\.info-table::before\{[^}]*height:5px;[^}]*background:var\(--main\);/.test(html));
assert('info labels use tinted emphasis', /\.info-label\{[^}]*background:linear-gradient\(135deg,#eef3ff,#f8fafd\);[^}]*color:var\(--main\);[^}]*font-weight:700;/.test(html));
assert('info rows stay in table layout rather than standalone cards', /\.info-row\{[^}]*display:flex;[^}]*border-bottom:1px solid #eef0f3;/.test(html));
assert('mobile info table keeps compact label column', /@media\s*\(max-width:\s*768px\)[\s\S]*\.info-label\{width:90px;padding:10px 12px;font-size:12px;/.test(html));
assert('shared css does not globally hide public page sections', !/(^|\n)\s*\.section\s*\{\s*display:\s*none;\s*\}/.test(commonCss));
assert('shared css scopes dashboard tab sections under main layout', /\.main\s+\.section\s*\{\s*display:\s*none;\s*\}/.test(commonCss));

console.log('case detail page checks passed');
