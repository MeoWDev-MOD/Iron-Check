// Carimba a versão (começo do hash do conteúdo) nos endereços do site.css e do js/main.js das duas páginas.
// Sem isso, quem visitou a página antiga recebia a página nova com o estilo velho guardado no navegador
// (o GitHub Pages deixa guardar por 10 min) e o notebook aparecia quebrado. Roda no fim do `npm run build`.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const docs = new URL("../docs/", import.meta.url);
const version = (file) => createHash("sha256").update(readFileSync(new URL(file, docs))).digest("hex").slice(0, 10);
const css = version("site.css");
const js = version("js/main.js");

for (const page of ["index.html", "en/index.html"]) {
  const file = new URL(page, docs);
  const before = readFileSync(file, "utf8");
  const after = before
    .replace(/(href="(?:\.\.\/)?site\.css)(?:\?v=\w+)?"/g, `$1?v=${css}"`)
    .replace(/(src="(?:\.\.\/)?js\/main\.js)(?:\?v=\w+)?"/g, `$1?v=${js}"`);
  if (!after.includes(`site.css?v=${css}"`) || !after.includes(`main.js?v=${js}"`)) {
    throw new Error(`${page}: não achei o site.css ou o js/main.js para carimbar`);
  }
  if (after !== before) writeFileSync(file, after);
}
console.log(`carimbo: site.css ${css}, main.js ${js}`);
