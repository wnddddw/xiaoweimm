const http = require("http");
const fs = require("fs");
const path = require("path");
const root = "d:/xin/HTML";
const mime = { ".html":"text/html;charset=utf-8", ".css":"text/css", ".js":"application/javascript", ".png":"image/png", ".jpg":"image/jpeg", ".svg":"image/svg+xml" };
process.on("uncaughtException", e => { console.error(e); fs.appendFileSync("d:/xin/server_err.log", e.stack + "\n"); });
http.createServer((req, res) => {
  let file = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  fs.readFile(path.join(root, file), (err, data) => {
    if (err) { res.writeHead(404); res.end("404"); return; }
    res.writeHead(200, { "Content-Type": mime[path.extname(file)] || "text/plain" });
    res.end(data);
  });
}).listen(3001, "0.0.0.0", () => console.log("Server: http://localhost:3001"));
