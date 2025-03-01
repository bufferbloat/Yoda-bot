const { streamingStatus } = require('../utils/streamingStatus');

module.exports = {
  name: 'shardReconnecting',
  execute(_, client) {
    console.log('Reconnecting to Discord...');
  }
};

// Create a separate file for the resume event
// events/resume.js
module.exports = {
  name: 'shardResume',
  execute(_, client) {
    console.log('Reconnected to Discord, refreshing status...');
    streamingStatus.set(client);
  }
}; 