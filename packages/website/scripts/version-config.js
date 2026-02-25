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

const docsDirPath = path.join(__dirname, "../docs");
const docFiles = fs.readdirSync(docsDirPath);

const allDocFilesPaths = docFiles.map(function (file) {
  return path.join(docsDirPath, file);
});

function notChangesDocs(filePath) {
  return !filePath.includes("changes/");
}

export const markdownDocsFiles = allDocFilesPaths.reduce((result, currPath) => {
  // Only scan 2 directories deep.
  if (fs.lstatSync(currPath).isDirectory()) {
    const nestedFiles = fs.readdirSync(currPath);
    const nestedPaths = nestedFiles.map((currFile) =>
      path.join(currPath, currFile),
    );
    const newMarkdowns = nestedPaths.filter(
      (currPath) => currPath.endsWith(".md") && notChangesDocs(currPath),
    );

    result = result.concat(newMarkdowns);
  } else if (
    fs.lstatSync(currPath).isFile() &&
    currPath.endsWith(".md") &&
    notChangesDocs(currPath)
  ) {
    result.push(currPath);
  }

  return result;
}, []);

const pkgJson = jf.readFileSync(packagePath);
export const currVersion = pkgJson.version;

export const changeLogString = fs
  .readFileSync(changeLogPath, "utf8")
  .toString();
