const https = require("https"),
  promise = require("promise"),
  settings = require("./settings.json"),
  fs = require("fs"),
  logger = require("./logger")

loadData = () => {
  return new promise(function (resolve, reject) {
    try {
      let processArguments = process.argv
      let targetFile = processArguments[2]
      logger.log("loading data from: " + targetFile)
      let patchData = fs.readFileSync(targetFile)
      resolve(patchData)
    } catch (err) {
      reject("Data load error. This could be because the path to your patch file is invalid: " + err)
    }
  })
}

submitPatchDataRequest = (patchData) => {
  return new promise(function (resolve, reject) {
    try {
      let options = {
        hostname: "api-staging.connect.bloomreach.com",
        method: "PATCH",
        path:
          "/dataconnect/api/v1/accounts/" +
          settings.BRSM_ACCOUNT_ID +
          "/catalogs/" +
          settings.BRSM_CATALOG_NAME +
          "/products",
        port: 443,
        headers: {
          "Content-Type": "application/json-patch+json",
          "Content-Length": patchData.length,
          Authorization: settings.BEARER_API_KEY,
        },
      }

      req = https
        .request(options, (resp) => {
          let data = ""
          // A chunk of data has been recieved.
          resp.on("data", (chunk) => {
            data += chunk
          })

          // The whole response has been received.
          resp.on("end", () => {
            resolve(JSON.parse(data))
          })
        })
        .on("error", (err) => {
          reject(err.message)
        })

      req.write(patchData)
      req.end()
    } catch (err) {
      reject("patch data request error: " + err)
    }
  })
}

requestIndexUpdate = () => {
  return new promise(function (resolve, reject) {
    try {
      let options = {
        hostname: "api-staging.connect.bloomreach.com",
        method: "POST",
        path:
          "/dataconnect/api/v1/accounts/" +
          settings.BRSM_ACCOUNT_ID +
          "/catalogs/" +
          settings.BRSM_CATALOG_NAME +
          "/indexes",
        port: 443,
        headers: {
          "Content-Type": "application/json-patch+json",
          "Content-Length": 0,
          Authorization: settings.BEARER_API_KEY,
          "BR-IGNORE-DOCUMENT-COUNT-DROP": true,
        },
      }

      req = https
        .request(options, (resp) => {
          let data = ""
          // A chunk of data has been recieved.
          resp.on("data", (chunk) => {
            data += chunk
          })

          // The whole response has been received.
          resp.on("end", () => {
            resolve(JSON.parse(data))
          })
        })
        .on("error", (err) => {
          reject(err.message)
        })

      req.write("")
      req.end()
    } catch (err) {
      reject("index update request error: " + err)
    }
  })
}

getJobStatus = (jobId) => {
  return new promise(function (resolve, reject) {
    let options = {
      hostname: "api-staging.connect.bloomreach.com",
      method: "GET",
      path: "/dataconnect/api/v1/jobs/" + jobId,
      port: 443,
      headers: {
        Authorization: settings.BEARER_API_KEY,
      },
    }

    req = https
      .request(options, (resp) => {
        let data = ""
        // A chunk of data has been recieved.
        resp.on("data", (chunk) => {
          data += chunk
        })

        // The whole response has been received.
        resp.on("end", () => {
          resolve(JSON.parse(data))
        })
      })
      .on("error", (err) => {
        reject(err.message)
      })
    req.end()
  })
}

checkJobStatusUntilComplete = (jobId) => {
  return new promise(function (resolve, reject) {
    checkJobStatusUntilCompleteIterator(
      jobId,
      function () {
        resolve()
      },
      function (err) {
        reject(err)
      }
    )
  })
}

checkJobStatusUntilCompleteIterator = (jobId, callback, errCB) => {
  getJobStatus(jobId)
    .then((statusMessage) => {
      if (statusMessage.status == "failed") {
        errCB(statusMessage)
      } else if (statusMessage.status == "success") {
        logger.log("\u2705 success")
        callback()
      } else {
        logger.log("status: " + statusMessage.status, {sameLineLogging: true})
        setTimeout(function () {
          checkJobStatusUntilCompleteIterator(jobId, callback, errCB)
        }, 5000)
      }
    })
    .catch((err) => {
      reject(err.message)
    })
}

submitJobAndMonitorStatus = () => {
  return new promise(function (resolve, reject) {
    logger.log("Running patching process.")
    loadData()
      .then((patchData) => {
        log("Patch data loaded.")
        return submitPatchDataRequest(patchData)
      })
      .then((response) => {
        logger.log("Patch job submitted with id: " + response.jobId)
        return checkJobStatusUntilComplete(response.jobId)
      })
      .then(() => {
        logger.log("About to update the index")
        return requestIndexUpdate()
      })
      .then((response) => {
        logger.log("Index update job submitted with id: " + response.jobId)
        return checkJobStatusUntilComplete(response.jobId)
      })
      .then(() => {
        resolve()
      })
      .catch((err) => {
        reject(err)
      })
  })
}

logger.log("", { noTime: true })
submitJobAndMonitorStatus()
  .then(() => {
    logger.log("\u2705 all done ")
  })
  .catch((err) => {
    logger.log("\u274c error submitting job: " + err + "\n")
  })
