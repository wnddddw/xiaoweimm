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
assert('asset row builder marks name as required', /name="name"[^>]*data-required="true"/.test(html));
assert('asset row builder marks spec as required', /name="spec"[^>]*data-required="true"/.test(html));
assert('asset row builder marks qty as required', /name="qty"[^>]*data-required="true"/.test(html));
assert('asset row builder marks year as required', /name="year"[^>]*data-required="true"/.test(html));
assert('asset row builder marks value as required', /name="value"[^>]*data-required="true"/.test(html));
assert('asset row image stays optional', !/name="imageUrl"[^>]*data-required="true"/.test(html));
assert('asset table becomes cards on mobile', /\.asset-table\s+tr\{display:grid/.test(html));
assert('broken 180px sidebar override is gone', !/}\s*\.sidebar\{width:180px;\}/.test(html));
assert('asset rows can be renumbered after delete', /function\s+renumberAssetRows\s*\(/.test(html));
assert('delete handler renumbers current asset body', /renumberAssetRows\(body\)/.test(html));
assert('asset row validator exists', /function\s+validateAssetRows\s*\(/.test(html));
assert('project form validation calls asset row validation', /if\s*\(!validateAssetRows\(\)\)\s*return false;/.test(html));
assert('transfer reason field is not shown in active form UI', !/<label><span class="req">\*<\/span>\s*转让原因<\/label>/.test(html));
assert('project payload preserves transfer reason as empty string', /transfer_reason:\s*""/.test(html));
assert('base required-field loop no longer depends on reason field', !/id:\s*"reason"/.test(html));
assert('seller top nav does not expose inaccessible buyer workbench', !/<div class=["']top-nav-links["']>[\s\S]*<a href=["']buyer\.html["']>买家工作台<\/a>/.test(html));

console.log('seller page checks passed');
