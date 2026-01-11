import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const docsDir = path.join(rootDir, "docs", "wiki");
const indexPath = path.join(docsDir, "index.json");

const replacements = [
  [/\r\n/g, "\n"],
  [/\u2018|\u2019/g, "'"],
  [/\u201C|\u201D/g, "\""],
  [/\u2013|\u2014/g, "-"],
  [/\u2026/g, "..."],
];

function sanitizeAscii(text) {
  let output = text;
  for (const [regex, value] of replacements) {
    output = output.replace(regex, value);
  }
  return output.replace(/[^\x00-\x7F]/g, "");
}

function rawUrl(repo, slug) {
  return `https://raw.githubusercontent.com/wiki/${repo}/${slug}.md`;
}

async function run() {
  const indexRaw = await readFile(indexPath, "utf8");
  const index = JSON.parse(indexRaw);

  for (const source of index.sources ?? []) {
    const sourceDir = path.join(docsDir, source.id);
    await mkdir(sourceDir, { recursive: true });
    for (const page of source.pages ?? []) {
      const url = rawUrl(source.repo, page.slug);
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`Failed to fetch ${url}: ${res.status}`);
        continue;
      }
      const text = await res.text();
      const sanitized = sanitizeAscii(text);
      const targetPath = path.join(sourceDir, page.file);
      await writeFile(targetPath, sanitized, "utf8");
      console.log(`Saved ${source.id}/${page.file}`);
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
