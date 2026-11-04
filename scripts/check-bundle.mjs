import assert from "node:assert/strict";
import { readdir, readFile, lstat, writeFile } from "node:fs/promises";
import { resolve, relative, join, dirname, sep } from "node:path";

const root = resolve(".");
const exportRoot = resolve("dist");
const output = "artifacts/bundle-check.json";
const limit = 8388608;
const excluded = new Set([".git", ".github", ".imd", "node_modules", ".cache"]);
const cacheNames = new Set([
  ".cache",
  ".vite",
  ".npm",
  "__pycache__",
  ".turbo",
  ".pytest_cache",
]);
const files = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    const rel = relative(root, file).split(sep).join("/");
    if (
      excluded.has(entry.name) ||
      rel === "test/scratch" ||
      entry.name === ".env" ||
      entry.name.startsWith(".env.")
    )
      continue;
    assert.ok(
      !entry.isSymbolicLink(),
      "Delivery must contain no symbolic links",
    );
    if (entry.isDirectory()) {
      assert.ok(
        !cacheNames.has(entry.name),
        "Remove generated caches before delivery",
      );
      await walk(file);
    } else files.push(file);
  }
}
await walk(root);
for (const file of [
  "dist/index.html",
  "src/App.tsx",
  "src/game.ts",
  "src/styles.css",
  "package.json",
  "package-lock.json",
  "vite.config.ts",
  "tsconfig.json",
  "README.md",
  "DESIGN.md",
  "artifacts/validation.md",
  "artifacts/interaction-results.json",
  "artifacts/taste-results.json",
  "artifacts/contrast-results.json",
  "artifacts/mobile-390.jpg",
  "artifacts/desktop-1440.jpg",
  "artifacts/mobile-duel.jpg",
]) {
  assert.ok(
    (await lstat(file)).isFile() && (await lstat(file)).size > 0,
    `Required output is empty: ${file}`,
  );
}
assert.ok(
  !files.some((file) => relative(root, file) === ".gitmodules"),
  "Submodules are not a delivery dependency",
);
const manifest = JSON.parse(await readFile("package.json", "utf8"));
const lock = JSON.parse(await readFile("package-lock.json", "utf8"));
assert.deepEqual(manifest.dependencies, lock.packages[""].dependencies);
assert.deepEqual(manifest.devDependencies, lock.packages[""].devDependencies);
for (const file of files.filter((file) =>
  relative(root, file).startsWith("public" + sep),
)) {
  const destination = resolve("dist", relative(resolve("public"), file));
  assert.ok(
    (await readFile(file)).equals(await readFile(destination)),
    "Public asset differs from the export",
  );
}
const html = await readFile("dist/index.html", "utf8");
assert.ok(/<title>Myth Arena/.test(html));
for (const name of ["description", "og:title", "og:image"])
  assert.ok(html.includes(`"${name}"`));
const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => [
  exportRoot,
  match[1],
]);
refs.push(
  [exportRoot, "./assets/share-card.png"],
  [exportRoot, "./assets/verdant-dragon.webp"],
);
for (const file of files.filter(
  (file) => file.startsWith(exportRoot + sep) && file.endsWith(".css"),
)) {
  const css = await readFile(file, "utf8");
  for (const match of css.matchAll(/url\(([^)]+)\)/g))
    refs.push([dirname(file), match[1].replace(/["']/g, "")]);
}
for (const [base, ref] of refs) {
  assert.ok(
    !/^(?:https?:|\/\/|\/)/.test(ref),
    "Runtime asset URLs must be relative",
  );
  if (ref.startsWith("data:") || ref.startsWith("#")) continue;
  const file = resolve(base, ref.split(/[?#]/)[0]);
  assert.ok(
    file.startsWith(exportRoot + sep),
    "Asset reference escapes the export",
  );
  assert.ok(
    (await lstat(file)).isFile(),
    "An asset reference does not resolve",
  );
}
for (const name of ["dm-sans-latin", "dm-serif-display-latin"]) {
  const font = await readFile(`dist/assets/${name}.woff2`);
  assert.equal(font.subarray(0, 4).toString(), "wOF2");
}
const share = await readFile("dist/assets/share-card.png");
assert.equal(share.subarray(1, 4).toString(), "PNG");
assert.equal(share.readUInt32BE(16), 1200);
assert.equal(share.readUInt32BE(20), 630);
const dragon = await readFile("dist/assets/verdant-dragon.webp");
assert.equal(dragon.subarray(0, 4).toString(), "RIFF");
assert.equal(dragon.subarray(8, 12).toString(), "WEBP");
const interactions = JSON.parse(
  await readFile("artifacts/interaction-results.json", "utf8"),
);
const taste = JSON.parse(
  await readFile("artifacts/taste-results.json", "utf8"),
);
assert.ok(interactions.passed >= 18);
assert.equal(
  interactions.failed,
  interactions.results.filter((item) => !item.passed).length,
);
assert.ok(
  interactions.results
    .filter((item) => !item.passed)
    .every(
      (item) =>
        item.name.startsWith("WebKit") &&
        item.error.includes("runtime libraries"),
    ),
);
assert.equal(taste.passed, 16);
const checks = {
  requiredOutputsPresent: true,
  lockfileMatchesManifest: true,
  publicAssetsMatchExport: true,
  relativeStaticReferencesResolve: true,
  localFontAndImageSignaturesValid: true,
  shareImage1200x630: true,
  noSymlinksSubmodulesOrDeliveredCaches: true,
};
const sizes = await Promise.all(
  files
    .filter((file) => relative(root, file).split(sep).join("/") !== output)
    .map(async (file) => ({ file, bytes: (await lstat(file)).size })),
);
const contentBytes = sizes.reduce((sum, item) => sum + item.bytes, 0);
const report = {
  validatedAt: new Date().toISOString(),
  byteLimit: limit,
  deliveryBytes: 0,
  productionExportBytes: sizes
    .filter((item) => item.file.startsWith(exportRoot + sep))
    .reduce((sum, item) => sum + item.bytes, 0),
  checks,
  note:
    "Assignment inputs, disposable test support, and installed dependencies are excluded. " +
    (interactions.failed
      ? "WebKit was unavailable; no pass is claimed for it."
      : "All recorded interaction checks passed."),
};
let text = JSON.stringify(report, null, 2) + "\n";
for (let i = 0; i < 5; i++) {
  report.deliveryBytes = contentBytes + Buffer.byteLength(text);
  text = JSON.stringify(report, null, 2) + "\n";
}
assert.ok(report.deliveryBytes < limit, "Delivery exceeds 8 MiB");
await writeFile(output, text);
console.log(
  `Bundle validated: ${report.deliveryBytes} / ${limit} bytes; production export ${report.productionExportBytes} bytes.`,
);
