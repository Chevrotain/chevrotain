import { createWebpackConfig } from "./webpack_base.config.js"

export default createWebpackConfig({
  minimize: true,
  filename: "chevrotain.min.js"
})
