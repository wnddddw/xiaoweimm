// Deprecated: sell.html and buy.html have been deleted.
// This script is kept for reference only.
const fs = require("fs");
const path = require("path");

const htmlDir = path.resolve(__dirname, "HTML");

// Fix sell.html - add close-modal redirect to index
for (const f of ["sell.html", "buy.html"]) {
  const fp = path.join(htmlDir, f);
  let c = fs.readFileSync(fp, "utf-8");
  
  // Find the checkAuth function and add close-redirect
  const oldGuard = `document.addEventListener("DOMContentLoaded", function(){
    var overlay = document.getElementById("modalOverlay");
    if (overlay) overlay.classList.add("show");
  });`;
  
  const newGuard = `document.addEventListener("DOMContentLoaded", function(){
    var overlay = document.getElementById("modalOverlay");
    if (overlay) {
      overlay.classList.add("show");
      // Close modal = go back to homepage
      var closeBtn = document.getElementById("modalClose");
      if (closeBtn) {
        closeBtn.onclick = function(){
          location.href = "index.html";
        };
      }
      overlay.addEventListener("click", function(e){
        if (e.target === overlay) {
          location.href = "index.html";
        }
      });
    }
  });`;
  
  if (c.includes(oldGuard)) {
    c = c.replace(oldGuard, newGuard);
    console.log(f + ": added close-redirect to checkAuth");
  } else {
    console.log(f + ": checkAuth pattern not found, searching...");
  }
  
  fs.writeFileSync(fp, c, "utf-8");
}

console.log("Done");
