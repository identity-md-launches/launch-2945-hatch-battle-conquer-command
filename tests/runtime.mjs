import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";

export const loadPlaywright = () =>
  import("playwright").catch(
    () => import("../test/scratch/toolchain/node_modules/playwright/index.mjs"),
  );
export const loadAxe = () =>
  import("@axe-core/playwright").catch(
    () =>
      import(
        "../test/scratch/toolchain/node_modules/@axe-core/playwright/dist/index.mjs"
      ),
  );
export async function serve(
  directory = "dist",
  prefix = "/preview/",
  special = {},
) {
  const root = resolve(directory);
  const types = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".webp": "image/webp",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
    ".txt": "text/plain",
  };
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname,
      );
      let file;
      if (special[pathname]) file = resolve(special[pathname]);
      else {
        if (!pathname.startsWith(prefix)) {
          response.writeHead(404);
          response.end();
          return;
        }
        file = resolve(root, pathname.slice(prefix.length) || "index.html");
        if (file !== root && !file.startsWith(root + sep)) {
          response.writeHead(403);
          response.end();
          return;
        }
      }
      const content = await readFile(file);
      response.writeHead(200, {
        "Content-Type": types[extname(file)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      response.end(content);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  const origin = `http://127.0.0.1:${server.address().port}`;
  return {
    origin,
    url: origin + prefix,
    close: () => new Promise((done) => server.close(done)),
  };
}
