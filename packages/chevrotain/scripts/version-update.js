import git from "gitty";
import fs from "fs";
import {
  apiString,
  currVersion,
  readmePath,
  versionPath,
} from "./version-config.js";
import { VERSION as oldVersion } from "../lib/src/version.js";

const myRepo = git("../../");

const newVersion = currVersion;
const oldVersionRegExpGlobal = new RegExp(
  oldVersion.replace(/\./g, "\\."),
  "g",
);

console.log("bumping version on <" + versionPath + ">");

const bumpedVersionTsFileContents = apiString.replace(
  oldVersionRegExpGlobal,
  newVersion,
);
fs.writeFileSync(versionPath, bumpedVersionTsFileContents);

console.log("bumping unpkg link in: <" + readmePath + ">");
const readmeContents = fs.readFileSync(readmePath, "utf8").toString();
const bumpedReadmeContents = readmeContents.replace(
  oldVersionRegExpGlobal,
  newVersion,
);
fs.writeFileSync(readmePath, bumpedReadmeContents);

// Just adding to the current commit is sufficient as lerna does the commit + tag + push
myRepo.addSync([versionPath, readmePath]);
