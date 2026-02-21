import fs from "fs";
import git from "gitty";
import {
  changeLogPath,
  changeLogString,
  currVersion,
} from "./version-config.js";

const myRepo = git("");

const newVersion = currVersion;
const dateTemplateRegExp = /(## X\.Y\.Z )\(INSERT_DATE_HERE\)/;
if (!dateTemplateRegExp.test(changeLogString)) {
  console.log("CHANGELOG.md must contain '## X.Y.Z (INSERT_DATE_HERE)'");
  process.exit(-1);
}

// updating CHANGELOG.md date
const nowDate = new Date();
const nowDateString = nowDate.toLocaleDateString("en-US").replace(/\//g, "-");
const changeLogDate = changeLogString.replace(
  dateTemplateRegExp,
  "## " + newVersion + " " + "(" + nowDateString + ")",
);
fs.writeFileSync(changeLogPath, changeLogDate);

// Just adding to the current commit is sufficient as lerna does the commit + tag + push
myRepo.addSync([changeLogPath]);
