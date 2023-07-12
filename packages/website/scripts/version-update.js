import fs from "fs";
import git from "gitty";
import _ from "lodash";
import {
  changeLogPath,
  changeLogString,
  currVersion,
  markdownDocsFiles,
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

_.forEach(markdownDocsFiles, function (currDocPath) {
  if (_.includes(currDocPath, "changes")) {
    console.log("SKIPPING bumping file: <" + currDocPath + ">");
    return;
  }
  console.log("bumping file: <" + currDocPath + ">");
  const currItemContents = fs.readFileSync(currDocPath, "utf8").toString();
  const bumpedItemContents = currItemContents.replace(
    /\d+_\d+_\d+/g,
    newVersion.replace(/\./g, "_"),
  );
  fs.writeFileSync(currDocPath, bumpedItemContents);
});

// Just adding to the current commit is sufficient as lerna does the commit + tag + push
myRepo.addSync([changeLogPath].concat(markdownDocsFiles));
