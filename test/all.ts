declare let require
let req = require.context("./", true, /spec\.js$/)
req.keys().forEach(req)
