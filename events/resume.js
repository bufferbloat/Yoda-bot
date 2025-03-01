const { streamingStatus } = require('../utils/streamingStatus');

module.exports = {
  name: 'shardResume',
  execute(_, client) {
    console.log('Reconnected to Discord, refreshing status...');
    streamingStatus.set(client);
  }
}; 