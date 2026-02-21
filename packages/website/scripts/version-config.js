import fs from "fs";
import jf from "jsonfile";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const packagePath = path.join(__dirname, "../package.json");
export const changeLogPath = path.join(
  __dirname,
  "../docs/changes/CHANGELOG.md",
);

const pkgJson = jf.readFileSync(packagePath);
export const currVersion = pkgJson.version;

export const changeLogString = fs
  .readFileSync(changeLogPath, "utf8")
  .toString();
