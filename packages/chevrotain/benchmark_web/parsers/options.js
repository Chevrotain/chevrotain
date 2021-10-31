self.globalOptions = {
  // Tip: disable CST building to emphasize performance changes
  // due to parser engine changes, e.g better implementation of `defineRule`
  // or better lookahead logic implementation
  outputCst: false,
  dev: { maxLookahead: 2, outputCst: false },
  latest: { maxLookahead: 2, outputCst: false }
}
