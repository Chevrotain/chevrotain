import fs from "fs";
import jf from "jsonfile";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const versionPath = path.join(__dirname, "../src/version.ts");
export const packagePath = path.join(__dirname, "../package.json");
export const readmePath = path.join(__dirname, "../../../README.md");
export const pkgJson = jf.readFileSync(packagePath);
export const apiString = fs.readFileSync(versionPath, "utf8").toString();
export const currVersion = pkgJson.version;
