// Lets build scripts import the app's lib/*.ts modules as-is: resolves the "@/" alias and extensionless relative
// imports ("./data") to their .ts files. Node strips the types itself. Import this first, before any lib module.
import fs from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.join(import.meta.dirname, "..");

registerHooks({
  resolve(specifier, context, next) {
    let target;
    if (specifier.startsWith("@/")) target = path.join(root, specifier.slice(2));
    else if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:"))
      target = path.join(path.dirname(fileURLToPath(context.parentURL)), specifier);
    // Only step in when a TypeScript file answers; everything else (packages, CommonJS requires) resolves normally.
    if (target && !path.extname(target)) {
      for (const ext of [".ts", ".tsx", "/index.ts"]) {
        if (fs.existsSync(target + ext)) return next(pathToFileURL(target + ext).href, context);
      }
    }
    if (target && specifier.startsWith("@/")) return next(pathToFileURL(target).href, context);
    return next(specifier, context);
  },
});
