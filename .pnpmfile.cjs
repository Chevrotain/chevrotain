module.exports = {
  hooks: {
    readPackage (pkg) {
      // this way we do not need to globally disable the peerDeps error in pnpm.
      // and only for vuepress related deps
      if (/vuepress|sass-loader|@docsearch\/react|@algolia\/autocomplete-preset-algolia/.test(pkg.name)) {
        console.warn(`fixing missing peerDeps for vuepress dep: ${pkg.name}`)
        delete pkg.peerDependencies
      }
      return pkg
    }
  }
}
