const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'seller.html'), 'utf8');

function assert(name, condition) {
  if (!condition) {
    throw new Error(name);
  }
}

assert('submit button exposes a stable id', /id=["']submitProjectBtn["']/.test(html));
assert('submitProject function exists', /function\s+submitProject\s*\(/.test(html));
assert('submitProject posts to projects API', /fetch\(\s*["']\/api\/projects["']/.test(html));
assert('submitProject sends bearer token', /Authorization["']?\s*:\s*["']Bearer\s+["']\s*\+/.test(html));
assert('old submit placeholder listener is removed', !/addEventListener\(["']submit["']/.test(html));
assert('native required bubble is not used', !/reportValidity\(\)/.test(html));
assert('custom required-field validation exists', /function\s+validateProjectForm\s*\(/.test(html));
assert('sidebar opens by class rather than inline transform', /\.sidebar\.open/.test(html));
assert('mobile sidebar overlay is class controlled', /\.sidebar-overlay\.show/.test(html));
assert('asset rows provide mobile data labels', /data-label=["']名称["']/.test(html));
assert('asset index uses readable mobile label', /data-label=["']序号["']/.test(html));
assert('asset index no longer renders hash label', !/data-label=["']#["']/.test(html));
assert('asset table becomes cards on mobile', /\.asset-table\s+tr\{display:grid/.test(html));
assert('broken 180px sidebar override is gone', !/}\s*\.sidebar\{width:180px;\}/.test(html));
assert('asset rows can be renumbered after delete', /function\s+renumberAssetRows\s*\(/.test(html));
assert('delete handler renumbers current asset body', /renumberAssetRows\(body\)/.test(html));

console.log('seller page checks passed');
