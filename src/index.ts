import { createHash } from "crypto";
import { constants } from "fs";
import { copyFile, readFile, writeFile } from "fs/promises";
import { createRequire } from "module";
import { join } from "path";
import { fileURLToPath } from "url";

export default async () => {
  const filename = fileURLToPath(import.meta.url);
  const buffer = await readFile(filename);
  const hash = createHash("sha256").update(buffer).digest("hex");
  const _require = createRequire(filename);
  const patchPath = `${_require.resolve("typescript")}.patch`;
  const resolvePath = (path: string) => join(patchPath, "..", path);
  const copyPath = (path: string) => `${path}_`;
  const typescriptPaths = [
    "tsc.js",
    "tsserver.js",
    "tsserverlibrary.js",
    "typescript.js",
    "typescriptServices.js",
    "typingsInstaller.js",
  ].map(resolvePath);

  try {
    const _hash = await readFile(patchPath, "utf-8");
    if (hash === _hash) {
      return;
    }
  } catch {
    await Promise.allSettled(typescriptPaths.map((path) => copyFile(path, copyPath(path), constants.COPYFILE_EXCL)));
  }

  const searchValue = "function getEffectiveCallArguments(node) {\n            if (node.kind === 206";
  const replaceValue = `${searchValue}) {

  }
  if (node.kind === 206`;

  await Promise.all(
    typescriptPaths.map(async (path) => {
      const code = await readFile(copyPath(path), "utf-8");
      const _code = code.replace(searchValue, () => replaceValue);
      if (code === _code) {
        throw new Error(`Not found searchValue ${path}`);
      }
      await writeFile(path, _code);
    }),
  );

  await writeFile(patchPath, hash);
};
