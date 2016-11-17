let req = (require as any).context("./", true, /spec\.js$/)
req.keys().forEach(req)
