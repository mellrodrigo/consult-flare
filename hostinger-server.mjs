// Entry point do site rgmtech.com.br na Hostinger (Node.js).
//
// A Hostinger inicia o app sem um stdin válido: acessar `process.stdin` lança
// "Error: open EEXIST". Qualquer `import ... from "node:process"` (o build SSR
// usa) lê esse getter e derruba o processo. Por isso este arquivo primeiro
// troca stdin/stdout/stderr inválidos por streams vazios e só então carrega o
// app de verdade (hostinger-app.mjs).
import { PassThrough } from "node:stream";

for (const name of ["stdin", "stdout", "stderr"]) {
  try {
    void process[name];
  } catch {
    Object.defineProperty(process, name, {
      value: new PassThrough(),
      configurable: true,
      enumerable: true,
      writable: true,
    });
  }
}

await import("./hostinger-app.mjs");
