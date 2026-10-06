import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
const files = [
  "/",
  "/manifest.webmanifest",
  ...readdirSync("dist/assets").map((name) => `/assets/${name}`),
  ...readdirSync("dist/icons").map((name) => `/icons/${name}`),
];
const revision = createHash("sha256")
  .update(files.join("|"))
  .digest("hex")
  .slice(0, 12);
const source = readFileSync("dist/sw.js", "utf8")
  .replace("'ember-shell-v1'", `'ember-shell-${revision}'`)
  .replace(
    "['/', '/manifest.webmanifest', '/icons/apple-touch-icon.png']",
    JSON.stringify(files),
  );
writeFileSync("dist/sw.js", source);
console.log(`Offline shell: ${files.length} files, revision ${revision}`);
