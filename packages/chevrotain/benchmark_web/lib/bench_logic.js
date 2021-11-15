var orgData = {
  labels: [],
  datasets: [
    {
      label: "",
      fillColor: "rgba(220,220,220,0.5)",
      strokeColor: "rgba(220,220,220,0.8)",
      highlightFill: "rgba(220,220,220,0.75)",
      highlightStroke: "rgba(220,220,220,1)",
      data: []
    }
  ]
}

var data = _.cloneDeep(orgData)

function clearData() {
  data = _.cloneDeep(orgData)
}

function clearTable() {
  // when using .empty() the cells collapse... so, use non-breaking space
  $(".dataRow .benchRate .value").html("&nbsp;")
  $(".dataRow .benchRate .delta").html("&nbsp;")
  $(".dataRow .benchSpeed").html("&nbsp;")
  $(".fastestRow").removeClass("fastestRow")
}

function clearResults() {
  clearTable()
  clearData()
}

function onRunAll(options) {
  lexerOnly = options && options.lexerOnly === true
  parserOnly = options && options.parserOnly === true
  clearResults()

  // These names are in the order in which they appear in the DOM
  var enabledTestCaseNames = _.map(
    $(".dataRow").has(":checked"),
    function (currDataRow) {
      var currClassNames = $(currDataRow).attr("class").split(" ")
      return _.first(
        _.difference(currClassNames, ["dataRow", "json-only", "hide"])
      )
    }
  )

  if (_.isEmpty(enabledTestCaseNames)) {
    // otherwise the run button will never become enabled again and
    // the performance page will be stuck indefinitely.
    return
  }

  $("#runAllButton").prop("disabled", true)
  $("#runAllButton_lexer").prop("disabled", true)
  $("#runAllButton_parser").prop("disabled", true)

  //handle "Running..."
  var valueBeforeTheDots = "Running"
  wait.innerHTML = valueBeforeTheDots
  var dots = window.setInterval(function () {
    var wait = document.getElementById("wait")
    if (wait.innerHTML.length >= valueBeforeTheDots.length + 3)
      wait.innerHTML = valueBeforeTheDots
    else wait.innerHTML += "."
  }, 500)

  // more minSamples (default=5) for more accurate & consistent results.
  Benchmark.options.minSamples = 25

  var suite = new Benchmark.Suite()

  var enabledTestCaseDefs = _.pick(testCases, enabledTestCaseNames)
  // adds the tests in the order they appear in the DOM table.
  _.forEach(enabledTestCaseDefs, function (currTestCaseDefFn) {
    currTestCaseDefFn(suite)
  })

  suite
    .on("cycle", function (event) {
      var suite = event.target
      var rate = suite.hz.toFixed(2)
      var $rate = $("." + suite.name + " .benchRate .value")
      var $delta = $("." + suite.name + " .benchRate .delta")

      $rate.html(rate)
      $delta.html("&plusmn;" + suite.stats.rme.toFixed(2) + "%")

      data.labels.push(suite.name)
      data.datasets[0].data.push(rate)

      try {
        if (self.mode === "current") {
          // store latest released version results to compare with dev version
          // in the other window.
          localStorage.setItem(suite.name, suite.hz)

          var cell = $("." + suite.name + " .benchSpeed")
          cell.html("100%")
        }
        if (self.mode === "next") {
          var cell = $("." + suite.name + " .benchSpeed")
          var storedLatestHz = localStorage.getItem(suite.name)
          if (storedLatestHz) {
            var speed = ((suite.hz / storedLatestHz).toFixed(4) * 100).toFixed(
              2
            )
            cell.html(speed + "%")
          } else {
            cell.html("???")
          }
        }
      } catch (e) {
        console.warn(e)
      }
    })
    .on("complete", function () {
      try {
        var suites = this.filter("successful"),
          fastestSuite = this.filter("fastest")[0]

        suites.splice(suites.indexOf(fastestSuite), 1)

        window.clearInterval(dots)
        $("#wait").html("&nbsp;")
      } finally {
        // TODO: investigate hack around strange race condition
        setTimeout(function () {
          $("#runAllButton").prop("disabled", false)
          $("#runAllButton_lexer").prop("disabled", false)
          $("#runAllButton_parser").prop("disabled", false)
        }, 1000)
      }
    })
    .run({ async: true })
}
