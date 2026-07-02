const { streamingStatus } = require("../utils/streamingStatus");

module.exports = {
  name: "shardReconnecting",
  execute(_, client) {
    console.log("Reconnecting to Discord...");
  },
};

module.exports = {
  name: "shardResume",
  execute(_, client) {
    console.log("Reconnected to Discord, refreshing status...");
    streamingStatus.set(client);
  },
};
