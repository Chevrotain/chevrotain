var parserWorker;
var workerOptions;
var workerReady;
var nextRequestId = 1;
var pendingRequests = new Map();

function workerError(errorData) {
  var error = new Error(errorData.message);
  error.name = errorData.name || "Error";
  error.phase = errorData.phase;
  if (errorData.stack) {
    error.stack = errorData.stack;
  }
  return error;
}

function rejectPendingRequests(error) {
  pendingRequests.forEach(function (pending) {
    pending.reject(error);
  });
  pendingRequests.clear();
}

function sendRequest(type, data, waitForReady) {
  var requestId = nextRequestId++;
  var request = Object.assign({ type: type, requestId: requestId }, data);
  var ready = waitForReady === false ? Promise.resolve() : workerReady;

  return ready.then(function () {
    return new Promise(function (resolve, reject) {
      pendingRequests.set(requestId, { resolve: resolve, reject: reject });
      parserWorker.postMessage(request);
    });
  });
}

function createWorker() {
  parserWorker = new Worker("../worker_impel.js", { type: "module" });

  parserWorker.onmessage = function (event) {
    var response = event.data;
    if (!response || response.type !== "response") {
      return;
    }

    var pending = pendingRequests.get(response.requestId);
    if (!pending) {
      return;
    }
    pendingRequests.delete(response.requestId);

    if (response.ok) {
      pending.resolve(response.result);
    } else {
      pending.reject(workerError(response.error));
    }
  };
  parserWorker.onerror = function (event) {
    rejectPendingRequests(new Error(event.message || "Parser worker failed"));
  };
  parserWorker.onmessageerror = function () {
    rejectPendingRequests(
      new Error("Parser worker message could not be decoded"),
    );
  };

  workerReady = sendRequest("init", { config: workerOptions }, false).then(
    function (result) {
      self.chevrotainVersion = result.version;
      return result;
    },
  );
  return workerReady;
}

function initWorker(options) {
  workerOptions = options;
  createWorker().catch(function (error) {
    console.error(error);
  });
}

async function waitForWorkerReady() {
  var started = performance.now();
  while (!workerReady) {
    if (performance.now() - started > 30000) {
      throw Error("Parser worker initialization timed out");
    }
    await new Promise(function (resolve) {
      setTimeout(resolve, 25);
    });
  }
  return new Promise(function (resolve, reject) {
    var timeout = setTimeout(
      function () {
        reject(Error("Parser worker initialization timed out"));
      },
      Math.max(0, 30000 - (performance.now() - started)),
    );
    workerReady.then(
      function (result) {
        clearTimeout(timeout);
        resolve(result);
      },
      function (error) {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

function restartWorker() {
  if (workerReady) {
    workerReady.catch(function () {});
  }
  if (parserWorker) {
    parserWorker.terminate();
  }
  rejectPendingRequests(new Error("Parser worker restarted"));
  createWorker();
  return waitForWorkerReady();
}

function stopWorker() {
  if (workerReady) {
    workerReady.catch(function () {});
  }
  if (parserWorker) {
    parserWorker.terminate();
  }
  rejectPendingRequests(new Error("Parser worker stopped"));
  parserWorker = undefined;
  workerReady = Promise.resolve();
}

function setupParserBenchmark() {
  return sendRequest("setup", {});
}

function runParserBatch(iterations) {
  var roundTripStart = performance.now();
  return sendRequest("batch", { iterations: iterations }).then(
    function (result) {
      result.roundTripMs = performance.now() - roundTripStart;
      return result;
    },
  );
}

function parse(options, deferred) {
  sendRequest("legacyRun", { options: options }).then(
    function () {
      deferred.resolve();
    },
    function (error) {
      if (deferred.reject) {
        deferred.reject(error);
      } else {
        deferred.benchmark.error = error;
        deferred.resolve();
      }
    },
  );
}
