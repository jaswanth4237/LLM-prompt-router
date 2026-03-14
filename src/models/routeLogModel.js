const fs = require("fs");
const path = require("path");

function appendRouteLog(entry, logFilePath = path.resolve("route_log.jsonl")) {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...entry
  });

  fs.appendFileSync(logFilePath, `${line}\n`, "utf8");
}

module.exports = {
  appendRouteLog
};
