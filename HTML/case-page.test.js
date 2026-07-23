const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'case.html'), 'utf8');

function assert(name, condition) {
  if (!condition) {
    throw new Error(name);
  }
}

const caseItemCount = (html.match(/class=["']case-item["']/g) || []).length;
const linkedCaseItemCount = (html.match(/<a\s+href=["']case-detail\.html["']\s+class=["']case-item["']/g) || []).length;

assert('case page lists cases', caseItemCount >= 3);
assert('every case item links to detail page', linkedCaseItemCount === caseItemCount);

console.log('case page checks passed');
