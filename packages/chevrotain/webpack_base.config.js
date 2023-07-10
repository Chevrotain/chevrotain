import { dirname, resolve } from "path";
import webpack from "webpack";
import jf from "jsonfile";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = jf.readFileSync("./package.json");

const banner = `/*! ${pkg.name} - v${pkg.version} -- NOT FOR PRODUCTIVE USAGE*/`;

export function createWebpackConfig({ mode, filename, minimize }) {
  return {
    mode: "production",
    stats: {
      colors: true,
      modules: true,
      reasons: true,
    },
    entry: "./lib/src/api.js",
    output: {
      path: resolve(__dirname, "./temp/"),
      filename,
      library: "chevrotain",
      libraryTarget: "umd",
      umdNamedDefine: true,
      // https://github.com/webpack/webpack/issues/6784#issuecomment-375941431
      globalObject: "typeof self !== 'undefined' ? self : this",
    },
    optimization: {
      minimize,
    },
    plugins: [new webpack.BannerPlugin({ banner: banner, raw: true })],
  };
}
