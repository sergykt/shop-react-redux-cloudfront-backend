import * as esbuild from "esbuild";
import { readdir } from "node:fs/promises";
import path from "node:path";

const isWatch = process.argv.includes("--watch");
const root = "src";

async function collectHandlerEntryPoints(dir) {
  const entries = {};

  async function walk(currentDir) {
    const items = await readdir(currentDir, { withFileTypes: true });

    for (const item of items) {
      if (!item.isDirectory()) continue;

      const fullPath = path.join(currentDir, item.name);

      if (item.name === "handlers") {
        // Found a handlers dir — each subdirectory is a Lambda handler
        const handlers = await readdir(fullPath, { withFileTypes: true });
        for (const handler of handlers) {
          if (!handler.isDirectory() || handler.name === "__tests__") continue;
          const entryFile = path.join(fullPath, handler.name, "index.ts");
          entries[`${handler.name}/index`] = entryFile;
        }
      } else if (item.name !== "__tests__") {
        await walk(fullPath);
      }
    }
  }

  await walk(dir);
  return entries;
}

const entryPoints = await collectHandlerEntryPoints(root);

if (Object.keys(entryPoints).length === 0) {
  throw new Error(`No handler entry points found under ${root}`);
}

const buildOptions = {
  entryPoints,
  outdir: "dist/handlers",
  platform: "node",
  target: "node20",
  format: "cjs",
  bundle: true,
  minify: true,
  sourcemap: true,
};

if (isWatch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log("Watching Lambda handlers...");
} else {
  await esbuild.build(buildOptions);
  console.log("Lambda build completed successfully");
}
